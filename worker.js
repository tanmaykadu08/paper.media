async function sendNotificationEmail({ name, email, message }, env) {
  const toEmail = env.NOTIFICATION_EMAIL || "paper.mediaa@gmail.com";
  const fromEmail = env.EMAIL_FROM || "Paper.Media Contact <onboarding@resend.dev>";
  
  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: fromEmail,
          to: toEmail,
          subject: `New Inquiry from ${name}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fcfcfc;">
              <h2 style="color: #4f46e5; border-bottom: 1px solid #eee; padding-bottom: 10px;">New Website Inquiry</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              <p><strong>Message:</strong></p>
              <div style="white-space: pre-wrap; background-color: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #4f46e5; color: #1f2937;">${message}</div>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="font-size: 12px; color: #9ca3af;">This email was sent automatically from Paper.Media's contact form integration.</p>
            </div>
          `
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error(`Failed to send email via Resend: ${response.status} ${errText}`);
      } else {
        console.log("Email sent successfully via Resend.");
      }
    } catch (e) {
      console.error("Error sending email via Resend:", e);
    }
  } else if (env.SENDGRID_API_KEY) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: toEmail }]
          }],
          from: { email: fromEmail.includes("<") ? fromEmail.split("<")[1].replace(">", "").trim() : fromEmail, name: "Paper.Media Contact" },
          subject: `New Inquiry from ${name}`,
          content: [{
            type: "text/html",
            value: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fcfcfc;">
                <h2 style="color: #4f46e5; border-bottom: 1px solid #eee; padding-bottom: 10px;">New Website Inquiry</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                <p><strong>Message:</strong></p>
                <div style="white-space: pre-wrap; background-color: #f3f4f6; padding: 15px; border-radius: 6px; border-left: 4px solid #4f46e5; color: #1f2937;">${message}</div>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="font-size: 12px; color: #9ca3af;">This email was sent automatically from Paper.Media's contact form integration.</p>
              </div>
            `
          }]
        })
      });
      if (!response.ok) {
        const errText = await response.text();
        console.error(`Failed to send email via SendGrid: ${response.status} ${errText}`);
      } else {
        console.log("Email sent successfully via SendGrid.");
      }
    } catch (e) {
      console.error("Error sending email via SendGrid:", e);
    }
  } else {
    console.warn("No email API keys (RESEND_API_KEY or SENDGRID_API_KEY) found. Email not sent.");
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key, X-Admin-User"
    };

    if (method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    // Helper to run queries via Turso HTTP API
    async function turso(sql, args = []) {
      const dbUrl = env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, 'https://') + '/v2/pipeline';
      const res = await fetch(dbUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.TURSO_AUTH_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          requests: [
            {
              type: "execute",
              stmt: {
                sql: sql,
                args: args.map(arg => {
                   if(arg === null) return { type: "null" };
                   if(typeof arg === "number") return { type: "integer", value: String(arg) };
                   return { type: "text", value: String(arg) };
                })
              }
            },
            { type: "close" }
          ]
        })
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Turso HTTP Error: ${res.status} ${text}`);
      }

      const json = await res.json();
      const result = json.results && json.results[0];
      if (!result) throw new Error("Empty Turso response");
      if (result.type === "error") throw new Error(`Turso SQL Error: ${result.error.message}`);
      
      const response = result.response;
      if(!response || !response.result) return { rows: [], lastInsertRowid: null };

      const cols = response.result.cols || [];
      const rawRows = response.result.rows || [];
      const rows = rawRows.map(row => {
        const obj = {};
        cols.forEach((col, i) => {
          const cell = row[i];
          obj[col.name] = (cell && cell.type !== "null") ? cell.value : null;
        });
        return obj;
      });

      return {
        rows,
        lastInsertRowid: response.result.last_insert_rowid ? Number(response.result.last_insert_rowid) : null
      };
    }

    // Helper for sending JSON
    function jsonResponse(data, status = 200) {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 
          "Content-Type": "application/json", 
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          ...cors 
        }
      });
    }

    function checkAdmin() {
      const keyHeader = request.headers.get("X-Admin-Key");
      
      // Check environment secret OR fallback to legacy key for transition safety
      if (keyHeader !== env.ADMIN_SECRET_KEY && keyHeader !== "papermediaadmin2026") {
        throw new Error("Unauthorized");
      }
    }

    async function signCloudinaryUpload(timestamp, api_secret) {
      const encoder = new TextEncoder();
      const data = encoder.encode(`timestamp=${timestamp}${api_secret}`);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    try {
      // Setup Route - Creates necessary tables if they don't exist
      if (method === "GET" && url.pathname === "/setup") {
        const logs = [];
        const run = async (q) => {
            try { await turso(q); logs.push(`SUCCESS: ${q}`); }
            catch(e) { logs.push(`FAIL: ${q} -> ${e.message}`); }
        };

        await run(`CREATE TABLE IF NOT EXISTS inquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, message TEXT, status TEXT DEFAULT 'new', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE IF NOT EXISTS portfolio (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, tag TEXT, bg_color TEXT, emoji TEXT, image_url TEXT, video_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await run(`CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT)`);
        
        // Safe migrations
        await run(`ALTER TABLE portfolio ADD COLUMN description TEXT`);
        await run(`ALTER TABLE portfolio ADD COLUMN link TEXT`);
        await run(`ALTER TABLE portfolio ADD COLUMN is_featured INTEGER DEFAULT 0`);
        await run(`ALTER TABLE portfolio ADD COLUMN sort_order INTEGER DEFAULT 0`);
        
        return jsonResponse({ success: true, logs });
      }

      // --- PUBLIC ROUTES ---
      if (method === "POST" && url.pathname === "/contact") {
        const { name, email, message } = await request.json();
        await turso("INSERT INTO inquiries (name, email, message) VALUES (?, ?, ?)", [name, email, message]);
        
        // Asynchronously send notification email (does not block client response)
        if (ctx && typeof ctx.waitUntil === "function") {
          ctx.waitUntil(sendNotificationEmail({ name, email, message }, env));
        } else {
          // Fallback if ctx is not passed/available in local development testing
          sendNotificationEmail({ name, email, message }, env);
        }
        
        return jsonResponse({ success: true, message: "Saved to DB" });
      }

      if (method === "GET" && url.pathname === "/portfolio") {
        const featuredOnly = url.searchParams.get("featured") === "1";
        // Fallback query if migrations haven't run
        let sql = "SELECT * FROM portfolio";
        try {
            if (featuredOnly) sql += " WHERE is_featured = 1";
            sql += " ORDER BY sort_order ASC, created_at DESC";
            const result = await turso(sql);
            return jsonResponse({ items: result.rows, count: result.rows.length });
        } catch(e) {
            // Fallback to basic query
            console.error("Advanced query failed, falling back:", e.message);
            sql = featuredOnly ? "SELECT * FROM portfolio" : "SELECT * FROM portfolio";
            sql += " ORDER BY created_at DESC";
            const result = await turso(sql);
            return jsonResponse({ items: result.rows, count: result.rows.length, warning: "Using fallback query (columns missing)" });
        }
      }

      if (method === "GET" && url.pathname === "/content") {
        const result = await turso("SELECT * FROM site_content");
        const content = {};
        result.rows.forEach(r => {
          let val = r.value;
          try {
            // Check if it's a JSON string (starts with { or [)
            if (val && (val.startsWith('{') || val.startsWith('['))) {
              val = JSON.parse(val);
            }
          } catch(e) {}
          content[r.key] = val;
        });
        return jsonResponse({ content, timestamp: Date.now() });
      }

      // --- ADMIN ROUTES ---
      if (url.pathname.startsWith("/admin/")) {
        checkAdmin();

        if (method === "GET" && url.pathname === "/admin/verify") {
          return jsonResponse({ success: true, message: "Valid Secret Key" });
        }

        if (method === "GET" && url.pathname === "/admin/inquiries") {
          const result = await turso("SELECT * FROM inquiries ORDER BY created_at DESC");
          return jsonResponse({ inquiries: result.rows });
        }

        const inqMatch = url.pathname.match(/^\/admin\/inquiries\/(\d+)$/);
        if (method === "PUT" && inqMatch) {
          const { status } = await request.json();
          await turso("UPDATE inquiries SET status = ? WHERE id = ?", [status, Number(inqMatch[1])]);
          return jsonResponse({ success: true });
        }

        if (method === "DELETE" && inqMatch) {
          await turso("DELETE FROM inquiries WHERE id = ?", [Number(inqMatch[1])]);
          return jsonResponse({ success: true });
        }

        if (method === "POST" && url.pathname === "/admin/content") {
          const updates = await request.json(); 
          for (let [key, value] of Object.entries(updates)) {
            // If value is object or array, stringify it for DB storage
            if (typeof value === 'object' && value !== null) {
              value = JSON.stringify(value);
            }
            await turso("INSERT INTO site_content (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?", [key, value, value]);
          }
          return jsonResponse({ success: true });
        }

        if (method === "GET" && url.pathname === "/admin/media/sign") {
          const timestamp = Math.round((new Date).getTime() / 1000);
          const signature = await signCloudinaryUpload(timestamp, env.CLOUDINARY_API_SECRET);
          return jsonResponse({
            timestamp,
            signature,
            api_key: env.CLOUDINARY_API_KEY,
            cloud_name: env.CLOUDINARY_CLOUD_NAME
          });
        }

        if (method === "POST" && url.pathname === "/admin/portfolio") {
            const { title, tag, emoji, bg_color, image_url, video_url, description, link, is_featured, sort_order } = await request.json();
            await turso(
              "INSERT INTO portfolio (title, tag, emoji, bg_color, image_url, video_url, description, link, is_featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
              [title, tag, emoji, bg_color, image_url || null, video_url || null, description || '', link || '', is_featured ? 1 : 0, sort_order || 0]
            );
            return jsonResponse({ success: true });
        }
        
        const portMatch = url.pathname.match(/^\/admin\/portfolio\/(\d+)$/);
        if (method === "PUT" && portMatch) {
            const updates = await request.json();
            const id = Number(portMatch[1]);
            
            // Build dynamic update query
            const keys = Object.keys(updates);
            if (keys.length === 0) return jsonResponse({ success: false, error: "No fields to update" });
            
            const setClause = keys.map(k => `${k} = ?`).join(", ");
            const values = Object.values(updates);
            
            await turso(`UPDATE portfolio SET ${setClause} WHERE id = ?`, [...values, id]);
            return jsonResponse({ success: true });
        }

        if (method === "DELETE" && portMatch) {
            await turso("DELETE FROM portfolio WHERE id = ?", [Number(portMatch[1])]);
            return jsonResponse({ success: true });
        }
      }

      return new Response("API OK 🚀", { headers: cors });

    } catch (err) {
      console.error("Worker Error:", err.message);
      const status = err.message === "Unauthorized" ? 401 : 500;
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: status,
        headers: { "Content-Type": "application/json", ...cors }
      });
    }
  }
};