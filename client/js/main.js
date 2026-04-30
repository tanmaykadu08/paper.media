// ============================================================
//  main.js — Paper.Media Public Site
//  Reads data from Firestore and renders it on the public site.
//  TODO (client dev): wire up the functions below once Firebase
//  config is filled in firebase-config.js
// ============================================================

import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  orderBy,
  query,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Load portfolio items from Firestore ──────────────────────
export async function loadPortfolio() {
  const grid = document.getElementById("portfolio-grid");
  if (!grid) return;

  try {
    const q = query(collection(db, "portfolio"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    grid.innerHTML = ""; // clear static placeholders

    snap.forEach(doc => {
      const item = doc.data();
      grid.insertAdjacentHTML("beforeend", `
        <div class="port-card spotlight-card">
          <div class="port-thumb" style="background:${item.bgColor || '#f5f5f5'};">
            ${item.imageUrl
              ? `<img src="${item.imageUrl}" alt="${item.title}" style="width:100%;height:100%;object-fit:cover;">`
              : `<div class="port-thumb-bg">${item.emoji || "🎬"}</div>`
            }
            <div class="port-thumb-overlay"><div class="port-play-btn">▶</div></div>
          </div>
          <div class="port-info">
            <span class="port-tag">${item.tag || "Reels"}</span>
            <div class="port-name">${item.title}</div>
          </div>
        </div>
      `);
    });

    if (snap.empty) {
      grid.innerHTML = `<p style="color:#999;grid-column:1/-1;">No portfolio items yet.</p>`;
    }
  } catch (err) {
    console.warn("Portfolio load failed:", err.message);
    // Keep static placeholders on error
  }
}

// ── Load site content (hero text, about, etc.) ───────────────
export async function loadSiteContent() {
  try {
    const q = query(collection(db, "siteContent"), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return;

    const content = snap.docs[0].data();

    if (content.heroTitle) {
      const el = document.querySelector(".hero-title");
      if (el) el.innerHTML = content.heroTitle;
    }
    if (content.heroSub) {
      const el = document.querySelector(".hero-sub");
      if (el) el.textContent = content.heroSub;
    }
    if (content.aboutText) {
      const el = document.querySelector(".about-text");
      if (el) el.innerHTML = content.aboutText;
    }
  } catch (err) {
    console.warn("Site content load failed:", err.message);
  }
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadPortfolio();
  loadSiteContent();
});
