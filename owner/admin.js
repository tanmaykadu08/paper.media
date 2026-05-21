// === PAPER.MEDIA ADMIN ENGINE ===

const API_BASE = "https://papermediaapi.paper-mediaa.workers.dev";
let adminKey = localStorage.getItem("papermedia_admin_secret") || localStorage.getItem("paper_admin_key");

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
                    <button class="btn-secondary" style="text-align:left;" onclick="renderPage('portfolio')">📁 Media Library</button>
                    <button class="btn-secondary" style="text-align:left;" onclick="renderPage('homepage')">🏠 Edit Homepage Hero</button>
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
            <h1>Media Library</h1>
            <button class="btn-primary" onclick="openProjectModal()">Add Media</button>
        </div>
        <div id="portfolio-grid" class="grid-2">
            <!-- Dynamic projects -->
        </div>

        <!-- Project Modal -->
        <div id="project-modal" class="modal hidden">
            <div class="modal-content">
                <h2 id="modal-title">Add Media</h2>
                <div class="form-group">
                    <label>Description (Optional)</label>
                    <textarea id="p-desc" style="height:80px;" placeholder="Brief details..."></textarea>
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label>Thumbnail Image</label>
                        <input type="file" id="p-file-img" accept="image/*" onchange="uploadToCloudinary(this, 'image')">
                        <input type="hidden" id="p-image">
                        <div id="p-img-preview" style="margin-top:8px; font-size:12px; color:var(--muted);"></div>
                    </div>
                    <div class="form-group">
                        <label>Reel / Video</label>
                        <input type="file" id="p-file-vid" accept="video/*" onchange="uploadToCloudinary(this, 'video')">
                        <input type="hidden" id="p-video">
                        <div id="p-vid-preview" style="margin-top:8px; font-size:12px; color:var(--muted);"></div>
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

    grid.innerHTML = currentPortData.map((item, index) => `
        <div class="card port-card-admin" style="padding:0; overflow:hidden;">
            ${item.is_featured ? '<div class="featured-badge">Featured</div>' : ''}
            <div class="reorder-controls">
                <button class="reorder-btn" onclick="reorderProject(${item.id}, 'up')">▲</button>
                <button class="reorder-btn" onclick="reorderProject(${item.id}, 'down')">▼</button>
            </div>
            <div style="height:150px; background:#f0f0f0;">
                ${item.video_url ? `<video src="${item.video_url}" muted style="width:100%; height:100%; object-fit:cover;"></video>` : `<img src="${item.image_url}" style="width:100%; height:100%; object-fit:cover;">`}
            </div>
            <div style="padding:20px;">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
                    <div>
                        <p style="font-size:12px; color:var(--muted);">${item.description || "No description"}</p>
                    </div>
                </div>
                <div style="display:flex; gap:8px; margin-top:16px;">
                    <button class="btn-secondary" style="font-size:12px; flex:1;" onclick="editProject(${item.id})">Edit</button>
                    <button class="btn-secondary" style="font-size:12px; color:var(--danger);" onclick="deletePort(${item.id})">Delete</button>
                </div>
            </div>
        </div>
    `).join('') || '<p style="grid-column:1/-1; text-align:center; padding:40px;">No projects found.</p>';
}

function openProjectModal() {
    editingProjectId = null;
    document.getElementById('modal-title').innerText = "Add Media";
    document.getElementById('p-desc').value = "";
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
    document.getElementById('modal-title').innerText = "Edit Media";
    document.getElementById('p-desc').value = item.description || "";
    document.getElementById('p-image').value = item.image_url || "";
    document.getElementById('p-video').value = item.video_url || "";
    document.getElementById('p-featured').checked = item.is_featured === 1;
    document.getElementById('project-modal').classList.remove('hidden');
}

async function saveProject() {
    const payload = {
        title: "Media",
        tag: "",
        description: document.getElementById('p-desc').value,
        link: "",
        image_url: document.getElementById('p-image').value,
        video_url: document.getElementById('p-video').value,
        is_featured: document.getElementById('p-featured').checked ? 1 : 0
    };

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

    const preview = document.getElementById(`p-${type === 'image' ? 'img' : 'vid'}-preview`);
    const hiddenInput = document.getElementById(`p-${type === 'image' ? 'image' : 'video'}`);

    preview.innerText = "Uploading...";

    try {
        const signRes = await api('/admin/media/sign');
        const formData = new FormData();
        formData.append("file", file);
        formData.append("api_key", signRes.api_key);
        formData.append("timestamp", signRes.timestamp);
        formData.append("signature", signRes.signature);
        formData.append("resource_type", type);

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signRes.cloud_name}/${type}/upload`;

        const uploadReq = await fetch(cloudinaryUrl, { method: "POST", body: formData });
        const uploadRes = await uploadReq.json();

        if (uploadRes.secure_url) {
            hiddenInput.value = uploadRes.secure_url;
            preview.innerText = "✅ Uploaded";
            showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`);
        } else {
            console.error("Cloudinary upload failed:", uploadRes);
            throw new Error(uploadRes.error?.message || "Upload failed");
        }
    } catch (e) {
        console.error("uploadToCloudinary error:", e);
        preview.innerText = "❌ Upload failed";
        showToast("Cloudinary error: " + e.message, true);
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
