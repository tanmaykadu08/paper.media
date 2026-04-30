export default {
async fetch(request) {
const url = new URL(request.url);


// Handle contact form
if (request.method === "POST" && url.pathname === "/contact") {
  try {
    const data = await request.json();

    return new Response(JSON.stringify({
      success: true,
      message: "Received",
      data
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: "Invalid JSON"
    }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Default route
return new Response("API is working 🚀");


}
};
