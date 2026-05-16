// === PAPER.MEDIA ADMIN ENGINE ===

const API_BASE = "https://papermediaapi.paper-mediaa.workers.dev";
let adminKey = localStorage.getItem("paper_admin_key");

// --- Auth Check ---
if (localStorage.getItem("papermedia_admin_auth") !== "true") {
    window.location.href = "admin.html";
}

function logoutAdmin() {
    localStorage.removeItem("papermedia_admin_auth");
    localStorage.removeItem("paper_admin_key");
    window.location.href = "admin.html";
}

// --- Template Registry ---
const PAGES = {
    dashboard: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
            <h1>Dashboard Overview</h1>
            <p id="dashboard-date" style="font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:1px;"></p>
        </div>
        
        <div class="grid-3">
            <div class="card spotlight-card">
                <p>Total Portfolio</p>
                <h2 id="stat-portfolio" style="font-size:48px; margin:12px 0 4px;">-</h2>
                <span style="font-size:12px; color:var(--muted);">Live Projects</span>
            </div>
            <div class="card spotlight-card">
                <p>Inquiries</p>
                <h2 id="stat-leads" style="font-size:48px; margin:12px 0 4px;">-</h2>
                <span style="font-size:12px; color:var(--muted);">Unread Leads</span>
            </div>
            <div class="card spotlight-card">
                <p>System Status</p>
                <h2 style="font-size:48px; margin:12px 0 4px;">Online</h2>
                <span style="font-size:12px; color:var(--primary); font-weight:700;">API Active</span>
            </div>
        </div>

        <div class="grid-2" style="margin-top:24px;">
            <div class="card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2>Recent Inquiries</h2>
                    <button class="btn-secondary" style="font-size:10px; padding:6px 12px;" onclick="renderPage('inquiries')">View All</button>
                </div>
                <div class="table-container" style="border:none;">
                    <table>
                        <thead><tr><th>Client</th><th>Date</th></tr></thead>
                        <tbody id="dash-recent-list">
                            <tr><td colspan="2" style="text-align:center; padding:40px;">Fetching latest activity...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card">
                <h2>Quick Actions</h2>
                <div style="display:flex; flex-direction:column; gap:12px; margin-top:12px;">
                    <button class="btn-secondary" style="text-align:left;" onclick="renderPage('portfolio')">📸 Add Portfolio Project</button>
                    <button class="btn-secondary" style="text-align:left;" onclick="renderPage('homepage')">🏠 Edit Homepage Hero</button>
                    <button class="btn-secondary" style="text-align:left;" onclick="renderPage('medialib')">📁 Browse Media Assets</button>
                </div>
            </div>
        </div>
    `,
    inquiries: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
            <h1>Leads & Inquiries</h1>
            <button class="btn-secondary" onclick="exportLeads()">Export CSV</button>
        </div>
        <div class="table-container">
            <table>
                <thead><tr><th>Client</th><th>Message</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody id="leads-list">
                    <tr><td colspan="4" style="text-align:center; padding:40px;">Loading leads...</td></tr>
                </tbody>
            </table>
        </div>
    `,
    homepage: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
            <h1>Homepage CMS</h1>
            <button class="btn-primary" onclick="saveCMS('homepage')">Save Changes</button>
        </div>
        <div class="card">
            <h2>Hero Section</h2>
            <div class="form-group">
                <label>Main Title</label>
                <input type="text" id="cms-hero_title">
            </div>
            <div class="form-group">
                <label>Subtitle</label>
                <textarea id="cms-hero_sub" style="height:100px;"></textarea>
            </div>
            <div class="grid-2">
                <div class="form-group">
                    <label>CTA Text</label>
                    <input type="text" id="cms-hero_cta_text">
                </div>
                <div class="form-group">
                    <label>CTA Link</label>
                    <input type="text" id="cms-hero_cta_link">
                </div>
            </div>
        </div>
        <div class="card">
            <h2>Announcement Banner</h2>
            <div class="grid-2">
                <div class="form-group">
                    <label>Banner Text</label>
                    <input type="text" id="cms-banner_text">
                </div>
                <div class="form-group">
                    <label>Visibility</label>
                    <select id="cms-banner_active">
                        <option value="true">Active</option>
                        <option value="false">Hidden</option>
                    </select>
                </div>
            </div>
        </div>
    `,
    portfolio: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
            <h1>Portfolio Manager</h1>
            <button class="btn-primary" onclick="openProjectModal()">Add New Project</button>
        </div>
        <div id="portfolio-grid" class="grid-2">
            <!-- Dynamic projects -->
        </div>

        <!-- Project Modal -->
        <div id="project-modal" class="modal hidden">
            <div class="modal-content">
                <h2 id="modal-title">Add Project</h2>
                <div class="form-group">
                    <label>Project Title</label>
                    <input type="text" id="p-title" placeholder="Brand Name / Project Title">
                </div>
                <div class="form-group">
                    <label>Category / Tag</label>
                    <input type="text" id="p-tag" placeholder="e.g. Fashion Film, Social Edit">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea id="p-desc" style="height:80px;" placeholder="Brief project details..."></textarea>
                </div>
                <div class="form-group">
                    <label>Instagram / Reel Link</label>
                    <input type="text" id="p-link" placeholder="https://instagram.com/reels/...">
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Thumbnail Image</label>
                        <div class="upload-container">
                            <input type="file" id="p-file-img" accept="image/*" onchange="uploadToCloudinary(this, 'image')">
                            <div class="progress-bar-wrap" id="p-img-progress-wrap" style="display:none; height:4px; background:#eee; border-radius:2px; margin-top:8px; overflow:hidden;">
                                <div id="p-img-progress" style="width:0%; height:100%; background:var(--primary); transition:width 0.2s;"></div>
                            </div>
                        </div>
                        <input type="hidden" id="p-image">
                        <div id="p-img-preview" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;"></div>
                    </div>
                    <div class="form-group">
                        <label>Reel / Video</label>
                        <div class="upload-container">
                            <input type="file" id="p-file-vid" accept="video/*" onchange="uploadToCloudinary(this, 'video')">
                            <div class="progress-bar-wrap" id="p-vid-progress-wrap" style="display:none; height:4px; background:#eee; border-radius:2px; margin-top:8px; overflow:hidden;">
                                <div id="p-vid-progress" style="width:0%; height:100%; background:var(--primary); transition:width 0.2s;"></div>
                            </div>
                        </div>
                        <input type="hidden" id="p-video">
                        <div id="p-vid-preview" style="margin-top:8px; display:flex; flex-wrap:wrap; gap:8px;"></div>
                    </div>
                </div>
                <div class="form-group" style="display:flex; align-items:center; gap:12px; margin-top:12px;">
                    <input type="checkbox" id="p-featured" style="width:auto;">
                    <label style="margin:0;">Show in Featured Projects (Homepage)</label>
                </div>
                <div style="display:flex; gap:12px; margin-top:32px;">
                    <button class="btn-primary" id="btn-save-project" onclick="saveProject()">Save Project</button>
                    <button class="btn-secondary" onclick="closeProjectModal()">Cancel</button>
                </div>
            </div>
        </div>
    `,
    services: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
            <h1>Services</h1>
            <div style="display:flex; gap:12px;">
                <button class="btn-secondary" onclick="addServiceRow()">Add Service</button>
                <button class="btn-primary" onclick="saveCMS('services')">Save All</button>
            </div>
        </div>
        <div id="services-container"></div>
    `,
    pricing: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
            <h1>Pricing Plans</h1>
            <div style="display:flex; gap:12px;">
                <button class="btn-secondary" onclick="addPricingRow()">Add Plan</button>
                <button class="btn-primary" onclick="saveCMS('pricing')">Save All</button>
            </div>
        </div>
        <div id="pricing-grid" class="grid-2"></div>
    `,
    founders: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
            <h1>Founders</h1>
            <div style="display:flex; gap:12px;">
                <button class="btn-secondary" onclick="addFounderRow()">Add Founder</button>
                <button class="btn-primary" onclick="saveCMS('founders')">Save All</button>
            </div>
        </div>
        <div class="card">
            <label style="font-size:12px; font-weight:700; color:var(--muted);">Founders Intro Text</label>
            <textarea id="cms-founders_intro" style="height:100px; margin-top:8px;"></textarea>
        </div>
        <div id="founders-container"></div>
    `,
    medialib: () => `
        <h1>Media Library</h1>
        <p>Manage all assets used across the site.</p>
        <div id="media-grid" class="grid-3" style="margin-top:32px;"></div>
    `,
    appearance: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
            <h1>Appearance</h1>
            <button class="btn-primary" onclick="saveCMS('appearance')">Update Style</button>
        </div>
        <div class="grid-2">
            <div class="card">
                <h2>Colors</h2>
                <div class="form-group">
                    <label>Primary Brand Color</label>
                    <input type="color" id="style-primary">
                </div>
                <div class="form-group">
                    <label>Background Tint</label>
                    <input type="color" id="style-bg">
                </div>
            </div>
            <div class="card">
                <h2>Typography</h2>
                <div class="form-group">
                    <label>Heading Font</label>
                    <select id="style-font">
                        <option value="'Sora', sans-serif">Sora (Premium)</option>
                        <option value="'Inter', sans-serif">Inter (Modern)</option>
                    </select>
                </div>
            </div>
        </div>
    `,
    settings: () => `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
            <h1>Site Settings</h1>
            <button class="btn-primary" onclick="saveCMS('settings')">Save Settings</button>
        </div>
        <div class="card">
            <h2>Branding</h2>
            <div class="grid-2">
                <div class="form-group">
                    <label>Logo URL</label>
                    <input type="text" id="set-logo">
                </div>
                <div class="form-group">
                    <label>Favicon URL</label>
                    <input type="text" id="set-favicon">
                </div>
            </div>
        </div>
        <div class="card">
            <h2>SEO</h2>
            <div class="form-group">
                <label>Meta Title</label>
                <input type="text" id="set-title">
            </div>
            <div class="form-group">
                <label>Instagram Handle</label>
                <input type="text" id="set-ig">
            </div>
        </div>
    `
};

// --- Core Logic ---

// The initialization is now handled entirely by admin-dashboard.html inline script.
// It calls initializeAdminDashboard() which then calls loadDashboardHome().

function loadDashboardHome() {
    initNav();
    renderPage('dashboard');
}

// checkAuth is now handled by the head script in HTML

function initNav() {
    document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const page = btn.dataset.page;
            console.log(`Navigating to: ${page}`);
            renderPage(page);
            if (window.innerWidth <= 768) toggleSidebar();
        });
    });
}

function renderPage(name) {
    const container = document.getElementById('main-content');
    if (!container) {
        console.error("Critical Error: #main-content container not found in DOM.");
        return;
    }

    // Always clear and scroll to top to prevent "blank" or "half-rendered" states
    container.innerHTML = '<div class="loading-view"><span>⏳</span> Loading Section...</div>';
    window.scrollTo(0, 0);

    // Update active state in nav
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.nav-btn[data-page="${name}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Inject template with a slight delay for smooth transition and ensuring DOM is ready
    setTimeout(() => {
        try {
            console.log("Rendering Section");
            if (PAGES[name]) {
                container.innerHTML = PAGES[name]();
                loadPageData(name);
            } else {
                container.innerHTML = `
                    <div class="card spotlight-card" style="text-align:center; padding:60px;">
                        <h2 style="color:var(--danger); margin-bottom:12px;">Section failed to load</h2>
                        <p>The requested module "${name}" is missing or undefined.</p>
                        <button class="btn-primary" style="margin-top:20px;" onclick="renderPage('dashboard')">Back to Dashboard</button>
                    </div>
                `;
            }
        } catch (err) {
            console.error(`Rendering failed for ${name}:`, err);
            container.innerHTML = `
                <div class="card spotlight-card" style="text-align:center; padding:60px;">
                    <h2 style="color:var(--danger); margin-bottom:12px;">Section failed to load</h2>
                    <p>${err.message}</p>
                </div>
            `;
        }
    }, 50);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('open');
}

// --- API Router ---

async function loadPageData(page) {
    try {
        switch (page) {
            case 'dashboard': await initDashboard(); break;
            case 'inquiries': await initInquiries(); break;
            case 'homepage': await initHomepage(); break;
            case 'portfolio': await initPortfolio(); break;
            case 'services': await initServices(); break;
            case 'pricing': await initPricing(); break;
            case 'founders': await initFounders(); break;
            case 'medialib': await initMediaLib(); break;
            case 'appearance': await initAppearance(); break;
            case 'settings': await initSettings(); break;
        }
    } catch (err) {
        console.error("Data Fetch Error:", err);
        showToast("Session expired or API error", true);
        if (err.message.includes("Unauthorized")) logoutAdmin();
    }
}

// --- API Helpers ---

async function api(path, options = {}) {
    const headers = { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey, ...options.headers };
    try {
        const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `API Error: ${res.status}`);
        return data;
    } catch (err) {
        console.error(`API Call Failed [${path}]:`, err);
        throw err;
    }
}

function showToast(msg, err = false) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = msg;
    t.className = err ? 'show error' : 'show';
    setTimeout(() => t.classList.remove('show'), 3000);
}

// --- Section Initializers ---

async function initDashboard() {
    const dateEl = document.getElementById('dashboard-date');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const leadData = await api('/admin/inquiries');
    const portData = await api('/portfolio');

    const unreadLeads = leadData.inquiries.filter(l => l.status === 'new').length;

    document.getElementById('stat-leads').innerText = unreadLeads;
    document.getElementById('stat-portfolio').innerText = portData.items.length;

    const tbody = document.getElementById('dash-recent-list');
    tbody.innerHTML = leadData.inquiries.slice(0, 5).map(l => `
        <tr>
            <td><strong>${l.name}</strong><br><small>${l.email}</small></td>
            <td>${new Date(l.created_at).toLocaleDateString()}</td>
        </tr>
    `).join('') || '<tr><td colspan="2" style="text-align:center; padding:20px;">No recent leads.</td></tr>';
}

async function initInquiries() {
    const data = await api('/admin/inquiries');
    document.getElementById('leads-list').innerHTML = data.inquiries.map(l => `
        <tr>
            <td><strong>${l.name}</strong><br><small>${l.email}</small></td>
            <td><div style="font-size:12px; color:var(--muted); max-width:300px;">${l.message}</div></td>
            <td><span class="badge badge-${l.status}">${l.status}</span></td>
            <td><button class="btn-secondary" onclick="deleteLead(${l.id})">Delete</button></td>
        </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;">No inquiries found.</td></tr>';
}

async function initHomepage() {
    const data = await api('/content');
    const c = data.content;
    document.getElementById('cms-hero_title').value = c.hero_title || '';
    document.getElementById('cms-hero_sub').value = c.hero_sub || '';
    document.getElementById('cms-hero_cta_text').value = c.hero_cta_text || '';
    document.getElementById('cms-hero_cta_link').value = c.hero_cta_link || '';
    document.getElementById('cms-banner_text').value = c.banner_text || '';
    document.getElementById('cms-banner_active').value = c.banner_active ? 'true' : 'false';
}

// --- PORTFOLIO SYSTEM ---
let currentPortData = [];
let editingProjectId = null;

async function initPortfolio() {
    const data = await api('/portfolio');
    currentPortData = data.items || [];
    renderPortfolioGrid();
}

function renderPortfolioGrid() {
    const grid = document.getElementById('portfolio-grid');
    if (!grid) return;

    grid.innerHTML = currentPortData.map((item, index) => {
        // Use Cloudinary transformations for lightweight previews
        let thumbUrl = item.image_url;
        let videoThumb = "";

        if (thumbUrl && thumbUrl.includes('cloudinary.com')) {
            thumbUrl = thumbUrl.replace('/upload/', '/upload/c_fill,w_400,h_250,g_auto,q_auto,f_auto/');
        }

        if (item.video_url && item.video_url.includes('cloudinary.com')) {
            // Generate a smart thumbnail from the first frame (0.1s) of the video
            videoThumb = item.video_url.replace(/\.[^/.]+$/, ".jpg").replace('/upload/', '/upload/so_0.1,c_fill,w_400,h_250,g_auto,q_auto,f_auto/');
        }

        return `
            <div class="card port-card-admin" style="padding:0; overflow:hidden;">
                ${item.is_featured ? '<div class="featured-badge">Featured</div>' : ''}
                <div class="reorder-controls">
                    <button class="reorder-btn" title="Move Up" onclick="reorderProject(${item.id}, 'up')">▲</button>
                    <button class="reorder-btn" title="Move Down" onclick="reorderProject(${item.id}, 'down')">▼</button>
                </div>
                <div style="height:150px; background:#f0f0f0; position:relative; overflow:hidden;">
                    ${item.video_url 
                        ? `<div class="video-preview-wrap" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:#000;">
                             <span style="position:absolute; top:8px; right:8px; background:rgba(0,0,0,0.7); color:#fff; font-size:9px; padding:2px 6px; border-radius:4px; z-index:2; font-weight:700;">VIDEO</span>
                             <video 
            <div class="port-card-admin" style="background:var(--card); border:1px solid var(--border); border-radius:12px; overflow:hidden; transition:all 0.3s;">
                <div style="height:200px; background:#f0f0f0; position:relative;">
                    ${
                        video 
                        ? `<div style="width:100%; height:100%; position:relative;">
                             <video muted playsinline style="width:100%; height:100%; object-fit:cover;">
                                <source src="${video}#t=0.1" type="video/mp4">
                             </video>
                             <div style="position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.5); color:white; padding:4px 8px; border-radius:4px; font-size:10px;">REEL</div>
                           </div>` 
                        : `<img src="${thumbUrl || 'placeholder.png'}" style="width:100%; height:100%; object-fit:cover;" loading="lazy">`
                    }
                </div>
                <div style="padding:20px;">
                    <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                        <div>
                            <h4 style="font-size:14px; font-weight:700; color:var(--text);">${title}</h4>
                            <p style="font-size:11px; color:var(--muted);">${tag}</p>
                        </div>
                    </div>
                    <div style="display:flex; gap:8px; margin-top:16px;">
                        <button class="btn-secondary" style="font-size:12px; flex:1; padding:8px;" onclick="editProject(${item.id})">Edit</button>
                        <button class="btn-secondary" style="font-size:12px; color:var(--danger); flex:1; padding:8px;" onclick="deletePort(${item.id})">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('') || '<p style="grid-column:1/-1; text-align:center; padding:80px; color:var(--muted);">No projects found in your portfolio.</p>';
}

function openProjectModal() {
    editingProjectId = null;
    document.getElementById('modal-title').innerText = "Add Project";
    document.getElementById('p-title').value = "";
    document.getElementById('p-tag').value = "";
    document.getElementById('p-desc').value = "";
    document.getElementById('p-link').value = "";
    document.getElementById('p-image').value = "";
    document.getElementById('p-video').value = "";
    document.getElementById('p-featured').checked = false;
    document.getElementById('project-modal').classList.remove('hidden');
}

function closeProjectModal() {
    document.getElementById('project-modal').classList.add('hidden');
}

function editProject(id) {
    const item = currentPortData.find(i => i.id === id);
    if (!item) return;

    editingProjectId = id;
    document.getElementById('modal-title').innerText = "Edit Project";
    document.getElementById('p-title').value = item.title || "";
    document.getElementById('p-tag').value = item.tag || "";
    document.getElementById('p-desc').value = item.description || "";
    document.getElementById('p-link').value = item.link || "";
    document.getElementById('p-image').value = item.image_url || "";
    document.getElementById('p-video').value = item.video_url || "";
    document.getElementById('p-featured').checked = item.is_featured === 1;
    document.getElementById('project-modal').classList.remove('hidden');
}

async function saveProject() {
    const payload = {
        title: document.getElementById('p-title').value,
        tag: document.getElementById('p-tag').value,
        description: document.getElementById('p-desc').value,
        link: document.getElementById('p-link').value,
        image_url: document.getElementById('p-image').value,
        video_url: document.getElementById('p-video').value,
        is_featured: document.getElementById('p-featured').checked ? 1 : 0
    };

    if (!payload.title) return showToast("Title is required", true);

    const btn = document.getElementById('btn-save-project');
    btn.disabled = true;
    btn.innerText = "Saving...";

    try {
        if (editingProjectId) {
            await api(`/admin/portfolio/${editingProjectId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            const nextOrder = currentPortData.length > 0 ? Math.max(...currentPortData.map(p => p.sort_order)) + 1 : 0;
            await api('/admin/portfolio', { method: 'POST', body: JSON.stringify({ ...payload, sort_order: nextOrder }) });
        }
        showToast("Project saved!");
        closeProjectModal();
        initPortfolio();
    } catch (e) {
        showToast("Save failed", true);
    } finally {
        btn.disabled = false;
        btn.innerText = "Save Project";
    }
}

async function uploadToCloudinary(input, type) {
    const file = input.files[0];
    if (!file) return;

    // --- 1. Validation ---
    const MAX_IMG_SIZE = 10 * 1024 * 1024; // 10MB
    const MAX_VID_SIZE = 100 * 1024 * 1024; // 100MB
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/webm'];

    if (type === 'image') {
        if (!allowedImageTypes.includes(file.type)) {
            showToast("Unsupported image format", true);
            input.value = ""; return;
        }
        if (file.size > MAX_IMG_SIZE) {
            showToast("Image too large (Max 10MB)", true);
            input.value = ""; return;
        }
    } else {
        if (!allowedVideoTypes.includes(file.type)) {
            showToast("Unsupported video format", true);
            input.value = ""; return;
        }
        if (file.size > MAX_VID_SIZE) {
            showToast("Video too large (Max 100MB)", true);
            input.value = ""; return;
        }
    }

    const preview = document.getElementById(`p-${type === 'image' ? 'img' : 'vid'}-preview`);
    const hiddenInput = document.getElementById(`p-${type === 'image' ? 'image' : 'video'}`);
    const progressWrap = document.getElementById(`p-${type === 'image' ? 'img' : 'vid'}-progress-wrap`);
    const progressBar = document.getElementById(`p-${type === 'image' ? 'img' : 'vid'}-progress`);

    console.log(`[Upload] Starting ${type} upload:`, { name: file.name, size: (file.size/1024/1024).toFixed(2) + "MB" });

    // Show loading state
    preview.innerHTML = `<span style="font-size:11px; color:var(--primary);">Processing ${file.name}...</span>`;
    progressWrap.style.display = "block";
    progressBar.style.width = "0%";
    input.disabled = true;

    try {
        const signRes = await api('/admin/media/sign');
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signRes.api_key);
        formData.append("timestamp", signRes.timestamp);
        formData.append("signature", signRes.signature);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signRes.cloud_name}/${type}/upload`;

        // Use XHR for progress tracking
        const xhr = new XMLHttpRequest();
        xhr.open("POST", cloudinaryUrl, true);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressBar.style.width = percent + "%";
                preview.innerHTML = `<span style="font-size:11px; color:#666;">Uploading: ${percent}%</span>`;
            }
        };

        xhr.onload = function() {
            input.disabled = false;
            const uploadRes = JSON.parse(xhr.responseText);
            console.log("[Upload] Cloudinary Response:", uploadRes);

            if (xhr.status === 200 && uploadRes.secure_url) {
                hiddenInput.value = uploadRes.secure_url;
                progressWrap.style.display = "none";
                
                // Optimized preview rendering (Memory safe)
                if (type === 'image') {
                    preview.innerHTML = `
                        <div style="position:relative;">
                            <img src="${uploadRes.secure_url.replace('/upload/', '/upload/w_200,f_auto/')}" style="height:60px; border-radius:4px; border:1px solid #ddd;">
                            <div style="position:absolute; top:-5px; right:-5px; background:green; color:white; border-radius:50%; width:16px; height:16px; display:flex; align-items:center; justify-content:center; font-size:10px;">✓</div>
                        </div>
                    `;
                } else {
                    preview.innerHTML = `
                        <div style="font-size:11px; color:green; font-weight:600;">✅ Video Ready</div>
                        <div style="font-size:10px; color:#888;">${uploadRes.secure_url.split('/').pop()}</div>
                    `;
                }
                showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`);
            } else {
                console.error("[Upload] Failed:", uploadRes.error ? uploadRes.error.message : "Unknown error");
                throw new Error(uploadRes.error ? uploadRes.error.message : "Upload failed");
            }
        };

        xhr.onerror = function() {
            input.disabled = false;
            throw new Error("Network error during upload");
        };

        xhr.send(formData);

    } catch (e) {
        console.error("[Upload] Error Exception:", e);
        input.disabled = false;
        progressWrap.style.display = "none";
        preview.innerHTML = `<span style="font-size:11px; color:red;">❌ ${e.message || "Upload failed"}</span>`;
        showToast(e.message || "Upload error", true);
    }
}

async function deletePort(id) {
    if (!confirm("Delete this project?")) return;
    try {
        await api(`/admin/portfolio/${id}`, { method: 'DELETE' });
        showToast("Project deleted");
        initPortfolio();
    } catch (e) { showToast("Delete failed", true); }
}

async function reorderProject(id, direction) {
    const index = currentPortData.findIndex(i => i.id === id);
    if (index === -1) return;

    let targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentPortData.length) return;

    const itemA = currentPortData[index];
    const itemB = currentPortData[targetIndex];

    try {
        const orderA = itemA.sort_order;
        const orderB = itemB.sort_order;
        await api(`/admin/portfolio/${itemA.id}`, { method: 'PUT', body: JSON.stringify({ sort_order: orderB }) });
        await api(`/admin/portfolio/${itemB.id}`, { method: 'PUT', body: JSON.stringify({ sort_order: orderA }) });
        initPortfolio();
    } catch (e) { showToast("Reorder failed", true); }
}

// --- Dynamic Editors ---
let servicesData = [];
let pricingData = [];
let foundersData = [];

async function initServices() {
    const data = await api('/content');
    servicesData = data.content.services || [];
    renderServices();
}
function renderServices() {
    document.getElementById('services-container').innerHTML = servicesData.map((s, i) => `
        <div class="card">
            <div class="grid-2">
                <input type="text" value="${s.name}" onchange="servicesData[${i}].name=this.value" placeholder="Service Name">
                <input type="text" value="${s.icon}" onchange="servicesData[${i}].icon=this.value" placeholder="Icon/Emoji">
            </div>
            <textarea style="margin-top:12px;" onchange="servicesData[${i}].desc=this.value">${s.desc}</textarea>
            <button onclick="servicesData.splice(${i},1); renderServices()" style="margin-top:12px; color:var(--danger); border:none; background:none; cursor:pointer;">Remove</button>
        </div>
    `).join('') || '<p>No services defined.</p>';
}
function addServiceRow() { servicesData.push({ name: '', icon: '', desc: '' }); renderServices(); }

async function initPricing() {
    const data = await api('/content');
    pricingData = data.content.pricing || [];
    renderPricing();
}
function renderPricing() {
    document.getElementById('pricing-grid').innerHTML = pricingData.map((p, i) => `
        <div class="card">
            <input type="text" value="${p.name}" onchange="pricingData[${i}].name=this.value" placeholder="Plan Name">
            <input type="text" value="${p.price}" onchange="pricingData[${i}].price=this.value" style="margin-top:8px;">
            <textarea style="margin-top:8px;" onchange="pricingData[${i}].desc=this.value">${p.desc}</textarea>
            <button onclick="pricingData.splice(${i},1); renderPricing()" style="margin-top:12px; color:var(--danger); border:none; background:none; cursor:pointer;">Remove</button>
        </div>
    `).join('') || '<p>No pricing plans defined.</p>';
}
function addPricingRow() { pricingData.push({ name: '', price: '', desc: '', features: [] }); renderPricing(); }

async function initFounders() {
    const data = await api('/content');
    foundersData = data.content.founders || [];
    document.getElementById('cms-founders_intro').value = data.content.founders_intro || '';
    renderFounders();
}
function renderFounders() {
    document.getElementById('founders-container').innerHTML = foundersData.map((f, i) => `
        <div class="card">
            <div class="grid-2">
                <input type="text" value="${f.name}" onchange="foundersData[${i}].name=this.value" placeholder="Name">
                <input type="text" value="${f.role}" onchange="foundersData[${i}].role=this.value" placeholder="Role">
            </div>
            <input type="text" value="${f.image}" onchange="foundersData[${i}].image=this.value" placeholder="Image URL" style="margin-top:12px;">
            <button onclick="foundersData.splice(${i},1); renderFounders()" style="margin-top:12px; color:var(--danger); border:none; background:none; cursor:pointer;">Remove</button>
        </div>
    `).join('') || '<p>No founders added.</p>';
}
function addFounderRow() { foundersData.push({ name: '', role: '', image: '' }); renderFounders(); }

async function initMediaLib() {
    const data = await api('/portfolio');
    document.getElementById('media-grid').innerHTML = data.items.map(item => `
        <div class="card" style="padding:10px; text-align:center;">
            <div style="height:80px; background:#f0f0f0; margin-bottom:10px;">
                ${item.video_url ? '🎥 Video' : `<img src="${item.image_url}" style="width:100%; height:100%; object-fit:contain;">`}
            </div>
            <button class="btn-secondary" style="font-size:10px; width:100%;" onclick="navigator.clipboard.writeText('${item.image_url || item.video_url}'); showToast('URL Copied')">Copy URL</button>
        </div>
    `).join('') || '<p>No assets in library.</p>';
}

async function initAppearance() {
    const data = await api('/content');
    const a = data.content.appearance || {};
    document.getElementById('style-primary').value = a.primary_color || '#000000';
    document.getElementById('style-bg').value = a.bg_color || '#f5f1ea';
    document.getElementById('style-font').value = a.heading_font || "'Sora', sans-serif";
}

async function initSettings() {
    const data = await api('/content');
    const c = data.content;
    document.getElementById('set-logo').value = c.logo_url || '';
    document.getElementById('set-favicon').value = c.favicon_url || '';
    document.getElementById('set-title').value = c.meta_title || '';
    document.getElementById('set-ig').value = c.socials?.instagram || '';
}

function logoutAdmin() {
    localStorage.removeItem("papermedia_admin_auth");
    window.location.href = "admin.html";
}

async function saveCMS(type) {
    showToast(`Saving ${type}...`);
    let payload = {};
    try {
        if (type === 'homepage') {
            payload = {
                hero_title: document.getElementById('cms-hero_title').value,
                hero_sub: document.getElementById('cms-hero_sub').value,
                hero_cta_text: document.getElementById('cms-hero_cta_text').value,
                hero_cta_link: document.getElementById('cms-hero_cta_link').value,
                banner_text: document.getElementById('cms-banner_text').value,
                banner_active: document.getElementById('cms-banner_active').value === 'true'
            };
        } else if (type === 'services') payload = { services: servicesData };
        else if (type === 'pricing') payload = { pricing: pricingData };
        else if (type === 'founders') payload = { founders: foundersData, founders_intro: document.getElementById('cms-founders_intro').value };
        else if (type === 'appearance') {
            payload = {
                appearance: {
                    primary_color: document.getElementById('style-primary').value,
                    bg_color: document.getElementById('style-bg').value,
                    heading_font: document.getElementById('style-font').value
                }
            };
        } else if (type === 'settings') {
            payload = {
                logo_url: document.getElementById('set-logo').value,
                favicon_url: document.getElementById('set-favicon').value,
                meta_title: document.getElementById('set-title').value,
                socials: { instagram: document.getElementById('set-ig').value }
            };
        }

        await api('/admin/content', { method: 'POST', body: JSON.stringify(payload) });
        showToast("Changes saved successfully!");
    } catch (e) {
        showToast("Save failed", true);
    }
}

async function deleteLead(id) {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
        await api(`/admin/inquiries/${id}`, { method: 'DELETE' });
        showToast("Lead deleted");
        initInquiries();
    } catch (e) { showToast("Delete failed", true); }
}

async function exportLeads() {
    try {
        const data = await api('/admin/inquiries');
        const leads = data.inquiries || [];
        if (leads.length === 0) return showToast("No leads to export", true);
        const csv = ["Name,Email,Status,Message,Date", ...leads.map(l => `"${l.name}","${l.email}","${l.status}","${l.message.replace(/"/g, '""')}","${l.created_at}"`)].join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (e) { showToast("Export failed", true); }
}
// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('main-content')) {
        renderPage('dashboard');
    }
});

// Helper for dynamic re-renders
function refreshCurrentPage() {
    const activeBtn = document.querySelector('.nav-btn.active');
    if (activeBtn) renderPage(activeBtn.dataset.page);
}
