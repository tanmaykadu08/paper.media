// ============================================================
//  worker.js — Paper.Media Cloudflare Worker
//  Stack : Cloudflare Workers + Turso (LibSQL) + Cloudinary
//  Routes:
//    GET  /                       → health check
//    GET  /portfolio              → list all portfolio items
//    POST /contact                → save inquiry to Turso
//    POST /media/sign             → Cloudinary signed upload params (admin)
//    POST /media/confirm          → link uploaded media to portfolio row
//    POST /admin/portfolio        → create portfolio item (admin)
//    PUT  /admin/portfolio/:id    → update portfolio item (admin)
//    DELETE /admin/portfolio/:id  → delete portfolio item (admin)
//    GET  /admin/inquiries        → list inquiries (admin)
//    PUT  /admin/inquiries/:id    → update inquiry status (admin)
// ============================================================

import { createClient } from "@libsql/client/web";

// ── CORS headers ─────────────────────────────────────────────
function corsHeaders(origin) {
  const allowed = [
    "https://paper.media",
    "https://www.paper.media",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
  ];
  const allowOrigin = allowed.includes(origin) ? origin : allowed[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Max-Age": "86400",
  };
}

// ── JSON response helpers ────────────────────────────────────
function json(data, status = 200, origin = "*") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
  });
}

function err(message, status = 400, origin = "*") {
  return json({ error: message }, status, origin);
}

// ── Turso client ──────────────────────────────────────────────
function getDb(env) {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });
}

// ── Admin auth guard ─────────────────────────────────────────
function isAdmin(request, env) {
  return request.headers.get("X-Admin-Key") === env.ADMIN_SECRET_KEY;
}

// ── Cloudinary: generate SHA-1 signature (Web Crypto) ────────
async function signCloudinaryUpload(folder, resourceType, env) {
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${folder}&resource_type=${resourceType}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(env.CLOUDINARY_API_SECRET),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(toSign.replace(env.CLOUDINARY_API_SECRET, ""))
  );
  const signature = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    signature,
    timestamp,
    api_key: env.CLOUDINARY_API_KEY,
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    upload_url: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
  };
}

// ============================================================
//  MAIN FETCH HANDLER
// ============================================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const method = request.method;

    // ── Preflight ─────────────────────────────────────────────
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    // ── Health check ──────────────────────────────────────────
    if (method === "GET" && url.pathname === "/") {
      return json({
        status: "ok",
        project: "paper.media",
        version: "2.0.0",
        timestamp: new Date().toISOString(),
      }, 200, origin);
    }

    // ── GET /portfolio ─────────────────────────────────────────
    if (method === "GET" && url.pathname === "/portfolio") {
      try {
        const db = getDb(env);
        const result = await db.execute(
          "SELECT * FROM portfolio ORDER BY created_at DESC"
        );
        return json({ items: result.rows, count: result.rows.length }, 200, origin);
      } catch (e) {
        console.error("[portfolio]", e.message);
        return err("Failed to fetch portfolio", 500, origin);
      }
    }

    // ── POST /contact ──────────────────────────────────────────
    if (method === "POST" && url.pathname === "/contact") {
      let body;
      try {
        body = await request.json();
      } catch {
        return err("Invalid JSON body", 400, origin);
      }

      const { name, email, message } = body || {};
      if (!name || !email || !message) {
        return err("name, email, and message are required", 422, origin);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return err("Invalid email address", 422, origin);
      }
      if (String(message).length < 10) {
        return err("Message must be at least 10 characters", 422, origin);
      }

      try {
        const db = getDb(env);
        const result = await db.execute({
          sql: `INSERT INTO inquiries (name, email, message, status, created_at)
                VALUES (?, ?, ?, 'new', datetime('now'))`,
          args: [String(name).trim(), String(email).trim().toLowerCase(), String(message).trim()],
        });
        return json(
          { success: true, id: Number(result.lastInsertRowid), message: "Inquiry received!" },
          201,
          origin
        );
      } catch (e) {
        console.error("[contact]", e.message);
        return err("Failed to save inquiry", 500, origin);
      }
    }

    // ── POST /media/sign  (admin only) ─────────────────────────
    if (method === "POST" && url.pathname === "/media/sign") {
      if (!isAdmin(request, env)) return err("Unauthorized", 401, origin);

      let body;
      try {
        body = await request.json();
      } catch {
        return err("Invalid JSON", 400, origin);
      }

      const resourceType = body.resource_type || "image";
      const folder = body.folder || "paper-media/portfolio";

      if (!["image", "video", "auto"].includes(resourceType)) {
        return err("resource_type must be image, video, or auto", 422, origin);
      }

      try {
        const params = await signCloudinaryUpload(folder, resourceType, env);
        return json(params, 200, origin);
      } catch (e) {
        console.error("[media/sign]", e.message);
        return err("Failed to generate signature", 500, origin);
      }
    }

    // ── POST /media/confirm  (admin only) ──────────────────────
    if (method === "POST" && url.pathname === "/media/confirm") {
      if (!isAdmin(request, env)) return err("Unauthorized", 401, origin);

      let body;
      try {
        body = await request.json();
      } catch {
        return err("Invalid JSON", 400, origin);
      }

      const { portfolio_id, public_id, secure_url, resource_type } = body || {};
      if (!portfolio_id || !public_id || !secure_url) {
        return err("portfolio_id, public_id, and secure_url are required", 422, origin);
      }

      try {
        const db = getDb(env);
        const column = resource_type === "video" ? "video_url" : "image_url";
        await db.execute({
          sql: `UPDATE portfolio
                SET ${column} = ?, cloudinary_public_id = ?, updated_at = datetime('now')
                WHERE id = ?`,
          args: [secure_url, public_id, Number(portfolio_id)],
        });
        return json({ success: true, message: "Media linked to portfolio item" }, 200, origin);
      } catch (e) {
        console.error("[media/confirm]", e.message);
        return err("Failed to update portfolio item", 500, origin);
      }
    }

    // ── POST /admin/portfolio  (create) ────────────────────────
    if (method === "POST" && url.pathname === "/admin/portfolio") {
      if (!isAdmin(request, env)) return err("Unauthorized", 401, origin);

      let body;
      try {
        body = await request.json();
      } catch {
        return err("Invalid JSON", 400, origin);
      }

      const { title, tag, bg_color = "#f5f5f5", emoji = "🎬", image_url = null, video_url = null } = body || {};
      if (!title || !tag) return err("title and tag are required", 422, origin);

      try {
        const db = getDb(env);
        const result = await db.execute({
          sql: `INSERT INTO portfolio (title, tag, bg_color, emoji, image_url, video_url, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
          args: [title, tag, bg_color, emoji, image_url, video_url],
        });
        return json({ success: true, id: Number(result.lastInsertRowid) }, 201, origin);
      } catch (e) {
        console.error("[admin/portfolio POST]", e.message);
        return err("Failed to create portfolio item", 500, origin);
      }
    }

    // ── PUT /admin/portfolio/:id  (update) ─────────────────────
    const putPortfolioMatch = url.pathname.match(/^\/admin\/portfolio\/(\d+)$/);
    if (method === "PUT" && putPortfolioMatch) {
      if (!isAdmin(request, env)) return err("Unauthorized", 401, origin);

      const id = Number(putPortfolioMatch[1]);
      let body;
      try {
        body = await request.json();
      } catch {
        return err("Invalid JSON", 400, origin);
      }

      const allowed = ["title", "tag", "bg_color", "emoji", "image_url", "video_url"];
      const fields = [];
      const args = [];
      for (const key of allowed) {
        if (body[key] !== undefined) {
          fields.push(`${key} = ?`);
          args.push(body[key]);
        }
      }
      if (fields.length === 0) return err("No valid fields to update", 422, origin);
      fields.push("updated_at = datetime('now')");
      args.push(id);

      try {
        const db = getDb(env);
        await db.execute({ sql: `UPDATE portfolio SET ${fields.join(", ")} WHERE id = ?`, args });
        return json({ success: true }, 200, origin);
      } catch (e) {
        console.error("[admin/portfolio PUT]", e.message);
        return err("Failed to update portfolio item", 500, origin);
      }
    }

    // ── DELETE /admin/portfolio/:id ────────────────────────────
    const deletePortfolioMatch = url.pathname.match(/^\/admin\/portfolio\/(\d+)$/);
    if (method === "DELETE" && deletePortfolioMatch) {
      if (!isAdmin(request, env)) return err("Unauthorized", 401, origin);

      const id = Number(deletePortfolioMatch[1]);
      try {
        const db = getDb(env);
        await db.execute({ sql: "DELETE FROM portfolio WHERE id = ?", args: [id] });
        return json({ success: true }, 200, origin);
      } catch (e) {
        console.error("[admin/portfolio DELETE]", e.message);
        return err("Failed to delete portfolio item", 500, origin);
      }
    }

    // ── GET /admin/inquiries ───────────────────────────────────
    if (method === "GET" && url.pathname === "/admin/inquiries") {
      if (!isAdmin(request, env)) return err("Unauthorized", 401, origin);

      const status = url.searchParams.get("status");
      try {
        const db = getDb(env);
        const sql = status
          ? "SELECT * FROM inquiries WHERE status = ? ORDER BY created_at DESC"
          : "SELECT * FROM inquiries ORDER BY created_at DESC";
        const args = status ? [status] : [];
        const result = await db.execute({ sql, args });
        return json({ inquiries: result.rows, count: result.rows.length }, 200, origin);
      } catch (e) {
        console.error("[admin/inquiries GET]", e.message);
        return err("Failed to fetch inquiries", 500, origin);
      }
    }

    // ── PUT /admin/inquiries/:id ───────────────────────────────
    const putInquiryMatch = url.pathname.match(/^\/admin\/inquiries\/(\d+)$/);
    if (method === "PUT" && putInquiryMatch) {
      if (!isAdmin(request, env)) return err("Unauthorized", 401, origin);

      const id = Number(putInquiryMatch[1]);
      let body;
      try {
        body = await request.json();
      } catch {
        return err("Invalid JSON", 400, origin);
      }

      const { status } = body || {};
      if (!["new", "read", "replied"].includes(status)) {
        return err("status must be new, read, or replied", 422, origin);
      }

      try {
        const db = getDb(env);
        await db.execute({ sql: "UPDATE inquiries SET status = ? WHERE id = ?", args: [status, id] });
        return json({ success: true }, 200, origin);
      } catch (e) {
        console.error("[admin/inquiries PUT]", e.message);
        return err("Failed to update inquiry", 500, origin);
      }
    }

    // ── 404 ───────────────────────────────────────────────────
    return err("Route not found", 404, origin);
  },
};
