/* ============================================================
main.js — Paper.Media Public Site (Worker-based)
Firebase removed. Uses Cloudflare Worker API.
============================================================ */

// ── Worker API URL ───────────────────────────────────────────
const BASE_URL = "https://papermediaapi.paper-mediaa.workers.dev";

// ── Portfolio (temporary static fallback) ────────────────────
function loadPortfolio() {
const grid = document.getElementById("portfolio-grid");
if (!grid) return;

// Static demo (replace later with API/db)
grid.innerHTML = `     <div class="port-card spotlight-card">       <div class="port-thumb">         <div class="port-thumb-bg">🎬</div>       </div>       <div class="port-info">         <span class="port-tag">Reels</span>         <div class="port-name">Sample Project</div>       </div>     </div>
  `;
}

// ── Contact Form → Worker API ────────────────────────────────
function setupContactForm() {
const form = document.querySelector("form");
if (!form) return;

form.addEventListener("submit", async (e) => {
e.preventDefault();


const formData = new FormData(form);

const data = {
  name: formData.get("name"),
  email: formData.get("email"),
  message: formData.get("message")
};

try {
  const res = await fetch(`${BASE_URL}/contact`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });

  const result = await res.json();

  if (result.success) {
    alert("Message sent 🚀");
    form.reset();
  } else {
    alert("Failed to send ❌");
  }

} catch (err) {
  console.error(err);
  alert("Error sending message ❌");
}


});
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
loadPortfolio();
setupContactForm();
});
