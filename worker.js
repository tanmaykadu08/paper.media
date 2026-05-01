import { createClient } from "@libsql/client";

export default {
async fetch(request, env) {
const url = new URL(request.url);


const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN
});

if (request.method === "POST" && url.pathname === "/contact") {
  try {
    const { name, email, message } = await request.json();

    await db.execute({
      sql: "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
      args: [name, email, message]
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { status: 500 });
  }
}

return new Response("API running 🚀");


}
};
