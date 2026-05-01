export default {
  async fetch(request) {
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
      const data = await request.json();

      return new Response(JSON.stringify({
        success: true,
        data
      }), {
        headers: {
          "Content-Type": "application/json",
          ...cors
        }
      });
    }

    return new Response("API READY 🚀", { headers: cors });
  }
};