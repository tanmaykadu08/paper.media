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
      try {
        const { name, email, message } = await request.json();

        // 1. Convert Turso URL to HTTPS and append the REST endpoint
        // Example: libsql://mydb.turso.io -> https://mydb.turso.io/v2/pipeline
        const dbUrl = env.TURSO_DATABASE_URL.replace(/^libsql:\/\//, 'https://') + '/v2/pipeline';

        // 2. Format the body exactly how the Turso HTTP API expects it
        const dbReq = await fetch(dbUrl, {
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
                  // Note: Our initial schema named the table 'inquiries'. 
                  // If you created it as 'contacts' in Turso, change this to 'contacts'.
                  sql: "INSERT INTO inquiries (name, email, message) VALUES (?, ?, ?)",
                  args: [
                    { type: "text", value: String(name) },
                    { type: "text", value: String(email) },
                    { type: "text", value: String(message) }
                  ]
                }
              },
              { type: "close" }
            ]
          })
        });

        // 3. Catch HTTP-level errors (e.g., wrong URL or Auth Token)
        if (!dbReq.ok) {
          const errText = await dbReq.text();
          throw new Error(`Turso HTTP Error: ${dbReq.status} ${errText}`);
        }

        const dbRes = await dbReq.json();

        // 4. Catch SQL-level errors (e.g., table doesn't exist)
        const result = dbRes.results && dbRes.results[0];
        if (result && result.type === "error") {
          throw new Error(`Turso SQL Error: ${result.error.message}`);
        }

        return new Response(JSON.stringify({ success: true, message: "Saved to DB" }), {
          headers: {
            "Content-Type": "application/json",
            ...cors
          }
        });
      } catch (err) {
        // Now if it fails, it will actually return the error so you can see it!
        return new Response(JSON.stringify({ success: false, error: err.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...cors
          }
        });
      }
    }

    return new Response("API OK 🚀", { headers: cors });
  }
};