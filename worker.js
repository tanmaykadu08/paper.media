export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/contact") {
      try {
        const data = await request.json();

        return new Response(
          JSON.stringify({
            success: true,
            message: "Received",
            data
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid JSON" }),
          { status: 400 }
        );
      }
    }

    return new Response("API is working 🚀");
  }
};