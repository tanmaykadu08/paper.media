// ============================================================
//  worker.js — Paper.Media Cloudflare Worker
//  ✅ ZERO npm dependencies — uses native fetch() only
//  
//  Turso    → HTTP REST API  (no @libsql/client needed)
//  Cloudinary → Signed upload params via Web Crypto SHA-1
//
//  Routes:
//    GET    /                       → health check
//    GET    /portfolio              → list portfolio items
//    POST   /contact                → save inquiry
//    POST   /media/sign             → Cloudinary signed upload (admin)
//    POST   /media/confirm          → link media to portfolio row (admin)
//    POST   /admin/portfolio        → create portfolio item (admin)
//    PUT    /admin/portfolio/:id    → update portfolio item (admin)
//    DELETE /admin/portfolio/:id    → delete portfolio item (admin)
//    GET    /admin/inquiries        → list inquiries (admin)
//    PUT    /admin/inquiries/:id    → update inquiry status (admin)
// ============================================================

// ── CORS ─────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://paper.media",
  "https://www.paper.media",
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "http://localhost:8080",
];

function getCorsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Admin-Key",
    "Access-Control-Max-Age": "86400",
  };
}

// ── Response helpers ─────────────────────────────────────────
function jsonResponse(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: {
      "Content-Type": "application/json",
      ...getCorsHeaders(origin || ""),
    },
  });
}

function errResponse(message, status, origin) {
  return jsonResponse({ error: message }, status || 400, origin);
}

// ── Admin auth ────────────────────────────────────────────────
function checkAdmin(request, env) {
  return request.headers.get("X-Admin-Key") === env.ADMIN_SECRET_KEY;
}

// ── Turso HTTP REST client ────────────────────────────────────
//  Turso exposes a REST API at: <db-url>/v2/pipeline
//  No npm package needed — just fetch().
async function turso(env, sql, args) {
  const dbUrl = env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, "https://");

  const body = {
    requests: [
      {
        type: "execute",
        stmt: {
          sql: sql,
          args: (args || []).map((v) => {
            if (v === null || v === undefined) return { type: "null" };
            if (typeof v === "number") return { type: "integer", value: String(v) };
            return { type: "text", value: String(v) };
          }),
        },
      },
      { type: "close" },
    ],
  };

  const res = await fetch(`${dbUrl}/v2/pipeline`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.TURSO_AUTH_TOKEN}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Turso HTTP ${res.status}: ${text}`);
  }

  const json = await res.json();

  // Check for query-level error
  const result = json.results && json.results[0];
  if (!result) throw new Error("Empty Turso response");
  if (result.type === "error") throw new Error(result.error.message);

  const response = result.response;
  if (!response) throw new Error("No response in Turso result");

  // Convert columnar result to row objects
  const cols = (response.result && response.result.cols) || [];
  const rawRows = (response.result && response.result.rows) || [];

  const rows = rawRows.map((row) => {
    const obj = {};
    cols.forEach((col, i) => {
      const cell = row[i];
      obj[col.name] = cell && cell.type !== "null" ? cell.value : null;
    });
    return obj;
  });

  return {
    rows,
    lastInsertRowid: response.result && response.result.last_insert_rowid
      ? Number(response.result.last_insert_rowid)
      : null,
  };
}

// ── Cloudinary SHA-1 signature (Web Crypto — no npm needed) ──
async function signCloudinaryUpload(folder, resourceType, env) {
  const timestamp = Math.floor(Date.now() / 1000);

  // String to sign: sorted key=value pairs + api_secret appended (NOT HMAC)
  const paramStr = [
    `folder=${folder}`,
    `resource_type=${resourceType}`,
    `timestamp=${timestamp}`,
  ]
    .sort()
    .join("&");

  const toSign = paramStr + env.CLOUDINARY_API_SECRET;

  // SHA-1 digest via Web Crypto
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-1", encoder.encode(toSign));
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return {
    signature,
    timestamp,
    api_key: env.CLOUDINARY_API_KEY,
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    folder,
    resource_type: resourceType,
    upload_url: `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
  };
}

// ============================================================
//  MAIN HANDLER
// ============================================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    const origin = request.headers.get("Origin") || "";
    const path = url.pathname;

    // ── Preflight ───────────────────────────────────────────
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin),
      });
    }

    try {
      // ── GET / ─────────────────────────────────────────────
      if (method === "GET" && path === "/") {
        return jsonResponse({
          status: "ok",
          project: "paper.media",
          version: "2.0.0",
          timestamp: new Date().toISOString(),
        }, 200, origin);
      }

      // ── GET /portfolio ─────────────────────────────────────
      if (method === "GET" && path === "/portfolio") {
        const result = await turso(
          env,
          "SELECT * FROM portfolio ORDER BY created_at DESC",
          []
        );
        return jsonResponse({ items: result.rows, count: result.rows.length }, 200, origin);
      }

      // ── POST /contact ──────────────────────────────────────
      if (method === "POST" && path === "/contact") {
        let body;
        try { body = await request.json(); }
        catch { return errResponse("Invalid JSON body", 400, origin); }

        const name    = body && body.name    ? String(body.name).trim()    : "";
        const email   = body && body.email   ? String(body.email).trim()   : "";
        const message = body && body.message ? String(body.message).trim() : "";

        if (!name || !email || !message)
          return errResponse("name, email, and message are required", 422, origin);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
          return errResponse("Invalid email address", 422, origin);
        if (message.length < 10)
          return errResponse("Message must be at least 10 characters", 422, origin);

        const result = await turso(
          env,
          "INSERT INTO inquiries (name, email, message, status, created_at) VALUES (?, ?, ?, 'new', datetime('now'))",
          [name, email.toLowerCase(), message]
        );
        return jsonResponse(
          { success: true, id: result.lastInsertRowid, message: "Inquiry received!" },
          201,
          origin
        );
      }

      // ── POST /media/sign (admin) ───────────────────────────
      if (method === "POST" && path === "/media/sign") {
        if (!checkAdmin(request, env)) return errResponse("Unauthorized", 401, origin);

        let body;
        try { body = await request.json(); }
        catch { return errResponse("Invalid JSON", 400, origin); }

        const resourceType = (body && body.resource_type) || "image";
        const folder       = (body && body.folder)        || "paper-media/portfolio";

        if (!["image", "video", "auto"].includes(resourceType))
          return errResponse("resource_type must be image, video, or auto", 422, origin);

        const params = await signCloudinaryUpload(folder, resourceType, env);
        return jsonResponse(params, 200, origin);
      }

      // ── POST /media/confirm (admin) ────────────────────────
      if (method === "POST" && path === "/media/confirm") {
        if (!checkAdmin(request, env)) return errResponse("Unauthorized", 401, origin);

        let body;
        try { body = await request.json(); }
        catch { return errResponse("Invalid JSON", 400, origin); }

        const { portfolio_id, public_id, secure_url, resource_type } = body || {};
        if (!portfolio_id || !public_id || !secure_url)
          return errResponse("portfolio_id, public_id, and secure_url are required", 422, origin);

        const col = resource_type === "video" ? "video_url" : "image_url";
        await turso(
          env,
          `UPDATE portfolio SET ${col} = ?, cloudinary_public_id = ?, updated_at = datetime('now') WHERE id = ?`,
          [secure_url, public_id, Number(portfolio_id)]
        );
        return jsonResponse({ success: true }, 200, origin);
      }

      // ── POST /admin/portfolio (create) ─────────────────────
      if (method === "POST" && path === "/admin/portfolio") {
        if (!checkAdmin(request, env)) return errResponse("Unauthorized", 401, origin);

        let body;
        try { body = await request.json(); }
        catch { return errResponse("Invalid JSON", 400, origin); }

        const title     = body && body.title     ? String(body.title)     : "";
        const tag       = body && body.tag       ? String(body.tag)       : "";
        const bg_color  = body && body.bg_color  ? String(body.bg_color)  : "#f5f5f5";
        const emoji     = body && body.emoji     ? String(body.emoji)     : "🎬";
        const image_url = body && body.image_url ? String(body.image_url) : null;
        const video_url = body && body.video_url ? String(body.video_url) : null;

        if (!title || !tag) return errResponse("title and tag are required", 422, origin);

        const result = await turso(
          env,
          "INSERT INTO portfolio (title, tag, bg_color, emoji, image_url, video_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
          [title, tag, bg_color, emoji, image_url, video_url]
        );
        return jsonResponse({ success: true, id: result.lastInsertRowid }, 201, origin);
      }

      // ── PUT /admin/portfolio/:id (update) ──────────────────
      const putPortMatch = path.match(/^\/admin\/portfolio\/(\d+)$/);
      if (method === "PUT" && putPortMatch) {
        if (!checkAdmin(request, env)) return errResponse("Unauthorized", 401, origin);

        const id = Number(putPortMatch[1]);
        let body;
        try { body = await request.json(); }
        catch { return errResponse("Invalid JSON", 400, origin); }

        const allowed = ["title", "tag", "bg_color", "emoji", "image_url", "video_url"];
        const setParts = [];
        const args = [];
        for (const key of allowed) {
          if (body && body[key] !== undefined) {
            setParts.push(`${key} = ?`);
            args.push(body[key]);
          }
        }
        if (setParts.length === 0) return errResponse("No valid fields to update", 422, origin);
        setParts.push("updated_at = datetime('now')");
        args.push(id);

        await turso(env, `UPDATE portfolio SET ${setParts.join(", ")} WHERE id = ?`, args);
        return jsonResponse({ success: true }, 200, origin);
      }

      // ── DELETE /admin/portfolio/:id ────────────────────────
      const delPortMatch = path.match(/^\/admin\/portfolio\/(\d+)$/);
      if (method === "DELETE" && delPortMatch) {
        if (!checkAdmin(request, env)) return errResponse("Unauthorized", 401, origin);
        const id = Number(delPortMatch[1]);
        await turso(env, "DELETE FROM portfolio WHERE id = ?", [id]);
        return jsonResponse({ success: true }, 200, origin);
      }

      // ── GET /admin/inquiries ───────────────────────────────
      if (method === "GET" && path === "/admin/inquiries") {
        if (!checkAdmin(request, env)) return errResponse("Unauthorized", 401, origin);

        const status = url.searchParams.get("status");
        const result = await turso(
          env,
          status
            ? "SELECT * FROM inquiries WHERE status = ? ORDER BY created_at DESC"
            : "SELECT * FROM inquiries ORDER BY created_at DESC",
          status ? [status] : []
        );
        return jsonResponse({ inquiries: result.rows, count: result.rows.length }, 200, origin);
      }

      // ── PUT /admin/inquiries/:id ───────────────────────────
      const putInqMatch = path.match(/^\/admin\/inquiries\/(\d+)$/);
      if (method === "PUT" && putInqMatch) {
        if (!checkAdmin(request, env)) return errResponse("Unauthorized", 401, origin);

        const id = Number(putInqMatch[1]);
        let body;
        try { body = await request.json(); }
        catch { return errResponse("Invalid JSON", 400, origin); }

        const status = body && body.status ? String(body.status) : "";
        if (!["new", "read", "replied"].includes(status))
          return errResponse("status must be: new, read, or replied", 422, origin);

        await turso(env, "UPDATE inquiries SET status = ? WHERE id = ?", [status, id]);
        return jsonResponse({ success: true }, 200, origin);
      }

      // ── 404 ───────────────────────────────────────────────
      return errResponse("Route not found", 404, origin);

    } catch (e) {
      console.error("[worker error]", e.message);
      return errResponse("Internal server error: " + e.message, 500, origin);
    }
  },
};
