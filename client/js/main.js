/* ============================================================
main.js — Paper.Media Public Site (Worker-based)
Firebase removed. Uses Cloudflare Worker API.
============================================================ */

// ── Worker API URL ───────────────────────────────────────────
const BASE_URL = "https://papermediaapi.paper-mediaa.workers.dev";

// ── Portfolio (Dynamic from API) ──────────────────────────────
async function loadPortfolio() {
  const grid = document.getElementById("portfolio-grid");
  if (!grid) return;

  try {
    const res = await fetch(`${BASE_URL}/portfolio`);
    const data = await res.json();
    
    if (data.items && data.items.length > 0) {
      grid.innerHTML = ''; // Clear fallback
      data.items.forEach(item => {
        let mediaHtml = `<div class="port-thumb-bg">${item.emoji || '✨'}</div>`;
        if (item.image_url) mediaHtml = `<img src="${item.image_url}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;">`;
        if (item.video_url) mediaHtml = `<video src="${item.video_url}" muted loop autoplay style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;"></video>`;
        
        grid.innerHTML += `
          <div class="port-card spotlight-card reveal visible">
            <div class="port-thumb" style="background:${item.bg_color || '#333'}; position:relative; overflow:hidden;">
              ${mediaHtml}
            </div>
            <div class="port-info">
              <span class="port-tag">${item.tag}</span>
              <div class="port-name">${item.title}</div>
            </div>
          </div>
        `;
      });
    }
  } catch (err) {
    console.error("Failed to load portfolio:", err);
  }
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

// ── Site Content (Dynamic from CMS) ──────────────────────────
async function loadSiteContent() {
  try {
    const res = await fetch(`${BASE_URL}/content`);
    const data = await res.json();
    if (data.content) {
      if (data.content.hero_title) document.getElementById("dyn-hero-title").innerHTML = data.content.hero_title;
      if (data.content.hero_sub) document.getElementById("dyn-hero-sub").innerHTML = data.content.hero_sub;
      if (data.content.about_text) document.getElementById("dyn-about-text").innerHTML = data.content.about_text;
      
      const waLink = document.getElementById("link-whatsapp");
      if (waLink && data.content.contact_whatsapp) waLink.href = data.content.contact_whatsapp;
      
      const igLink = document.getElementById("link-ig");
      if (igLink && data.content.contact_ig) igLink.href = data.content.contact_ig;
    }
  } catch (err) {
    console.error("Error loading site content", err);
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadSiteContent();
  loadPortfolio();
  setupContactForm();
});
