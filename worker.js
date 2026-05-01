export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method === "POST" && url.pathname === "/contact") {
      const { name, email, message } = await request.json();

      await fetch(env.TURSO_DATABASE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.TURSO_AUTH_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sql: "INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)",
          args: [name, email, message]
        })
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: {
          "Content-Type": "application/json",
          ...cors
        }
      });
    }

    return new Response("API OK 🚀", { headers: cors });
  }
};