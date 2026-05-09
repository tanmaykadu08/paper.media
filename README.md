# Paper.Media — Portfolio & Agency Site

Paper.Media is a full-stack media agency portfolio website. The public site showcases the portfolio and lets clients submit inquiries. The owner manages everything — portfolio items, site content, and inquiries — through a private admin panel powered by a Cloudflare Worker backend and Turso database.

---

## Project Structure

```
paper.media/
├── client/                   ← Vercel Frontend (Static HTML/JS)
│   ├── index.html            ← Main public-facing site
│   ├── links.html            ← Custom Linktree page
│   ├── style.css             ← Public site styles
│   ├── logo.png              ← Brand logo
│   └── js/
│       └── main.js           ← Portfolio & content loader (fetches from API)
├── owner/                    ← Admin Panel (private, no-index)
│   ├── admin.html            ← Admin SPA (Dashboard, Inquiries, Portfolio, Content)
│   └── admin.css             ← Admin panel styles
├── worker.js                 ← Cloudflare Worker backend (all API logic, zero npm deps)
├── wrangler.toml             ← Cloudflare Worker configuration
├── package.json              ← Wrangler dev/deploy scripts
├── vercel.json               ← Vercel routing rules
└── README.md
```

---

## Deployment Guide

### 1. Backend (Cloudflare Workers + Turso)

The backend is a single `worker.js` file with **zero npm dependencies** — it uses the Turso HTTP REST API directly via native `fetch()`.

**Prerequisites:**
- Node.js installed locally
- A Cloudflare account with the Worker `papermediaapi` created
- A Turso database URL and Auth Token
- A Cloudinary account (Cloud Name, API Key, API Secret)

**Steps:**
1. Navigate to the project root:
   ```bash
   npm install
   ```
2. Add your secrets to Cloudflare securely:
   ```bash
   npx wrangler secret put TURSO_DATABASE_URL
   npx wrangler secret put TURSO_AUTH_TOKEN
   npx wrangler secret put CLOUDINARY_API_KEY
   npx wrangler secret put CLOUDINARY_API_SECRET
   npx wrangler secret put ADMIN_SECRET_KEY
   ```
   *(Paste the values when prompted by Wrangler.)*
3. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```
4. Initialize the database tables by visiting this URL in your browser once:
   ```
   https://papermediaapi.paper-mediaa.workers.dev/setup
   ```

### 2. Frontend (Vercel)

The frontend deploys automatically via GitHub. Vercel reads `vercel.json` to route all URLs correctly.

**Steps:**
1. Push your code to GitHub:
   ```bash
   git add .
   git commit -m "your message"
   git push origin main
   ```
2. Vercel will auto-deploy on every push. No manual steps needed after initial setup.

### 3. Admin Panel Access

Navigate to `/admin` on your Vercel deployment URL. Enter your `ADMIN_SECRET_KEY` password to log in. No username is required.

---

## API Reference

All `/admin/*` routes require an `X-Admin-Key: <password>` header.

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/setup` | — | Create DB tables (run once after deploy) |
| GET | `/portfolio` | — | Get all portfolio items |
| POST | `/contact` | — | Submit a client inquiry |
| GET | `/content` | — | Get site content (hero text, social links) |
| GET | `/admin/inquiries` | ✅ | List all client inquiries |
| PUT | `/admin/inquiries/:id` | ✅ | Update inquiry status |
| POST | `/admin/content` | ✅ | Update site text / social links |
| GET | `/admin/media/sign` | ✅ | Get Cloudinary signed upload params |
| POST | `/admin/portfolio` | ✅ | Add a new portfolio item |
| DELETE | `/admin/portfolio/:id` | ✅ | Delete a portfolio item |
| GET | `/api/health` | — | Health check |