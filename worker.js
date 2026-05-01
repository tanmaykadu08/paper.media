export default {
async fetch(request) {
const url = new URL(request.url);


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// Handle preflight
if (request.method === "OPTIONS") {
  return new Response(null, { headers: corsHeaders });
}

// Test route
if (request.method === "POST" && url.pathname === "/contact") {
  const data = await request.json();

  return new Response(JSON.stringify({
    success: true,
    received: data
  }), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    }
  });
}

return new Response("WORKING 🚀", {
  headers: corsHeaders
});


}
};
