// ============================================================
//  functions/index.js — Paper.Media Firebase Cloud Functions
//  Backend logic: contact form emails, media processing
// ============================================================

const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { initializeApp }     = require("firebase-admin/app");
const { getFirestore }      = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// ── 1. Contact form submission handler ──── a───────────────────
//    Called when a new document is added to /inquiries
exports.onNewInquiry = onDocumentCreated("inquiries/{docId}", async (event) => {
  const inquiry = event.data.data();
  console.log("New inquiry received:", inquiry.name, inquiry.email);

  // TODO: add Nodemailer / SendGrid to email the owner
  // await sendEmail({ to: "owner@paper.media", subject: "New inquiry", ... });

  await event.data.ref.update({ status: "received", receivedAt: new Date() });
});

// ── 2. Health check endpoint ─────────────────────────────────
exports.health = onRequest((req, res) => {
  res.json({ status: "ok", project: "paper.media", timestamp: new Date().toISOString() });
});
