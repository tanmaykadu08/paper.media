export default {
  async fetch(request, env) {
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
        headers: { "Content-Type": "application/json", ...cors }
      });
    }

    function checkAdmin() {
      const userHeader = request.headers.get("X-Admin-User");
      const keyHeader = request.headers.get("X-Admin-Key");
      
      if (env.ADMIN_USERNAME && userHeader !== env.ADMIN_USERNAME) {
        throw new Error("Unauthorized");
      }
      if (keyHeader !== env.ADMIN_SECRET_KEY) {
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
        checkAdmin();
        await turso(`CREATE TABLE IF NOT EXISTS inquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, message TEXT, status TEXT DEFAULT 'new', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await turso(`CREATE TABLE IF NOT EXISTS portfolio (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, tag TEXT, bg_color TEXT, emoji TEXT, image_url TEXT, video_url TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
        await turso(`CREATE TABLE IF NOT EXISTS site_content (key TEXT PRIMARY KEY, value TEXT)`);
        return jsonResponse({ success: true, message: "Tables created successfully" });
      }

      // --- PUBLIC ROUTES ---
      if (method === "POST" && url.pathname === "/contact") {
        const { name, email, message } = await request.json();
        await turso("INSERT INTO inquiries (name, email, message) VALUES (?, ?, ?)", [name, email, message]);
        return jsonResponse({ success: true, message: "Saved to DB" });
      }

      if (method === "GET" && url.pathname === "/portfolio") {
        const result = await turso("SELECT * FROM portfolio ORDER BY created_at DESC");
        return jsonResponse({ items: result.rows, count: result.rows.length });
      }

      if (method === "GET" && url.pathname === "/content") {
        const result = await turso("SELECT * FROM site_content");
        const content = {};
        result.rows.forEach(r => content[r.key] = r.value);
        return jsonResponse({ content });
      }

      // --- ADMIN ROUTES ---
      if (url.pathname.startsWith("/admin/")) {
        checkAdmin();

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

        if (method === "POST" && url.pathname === "/admin/content") {
          const updates = await request.json(); // { "hero_title": "New Title", "about_text": "..." }
          for (const [key, value] of Object.entries(updates)) {
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
            const { title, tag, emoji, bg_color, image_url, video_url } = await request.json();
            await turso("INSERT INTO portfolio (title, tag, emoji, bg_color, image_url, video_url) VALUES (?, ?, ?, ?, ?, ?)", [title, tag, emoji, bg_color, image_url || null, video_url || null]);
            return jsonResponse({ success: true });
        }
        
        const portMatch = url.pathname.match(/^\/admin\/portfolio\/(\d+)$/);
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