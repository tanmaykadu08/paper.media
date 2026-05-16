// === PAPER.MEDIA DYNAMIC CMS ENGINE ===
const API_BASE = "https://papermediaapi.paper-mediaa.workers.dev";
const adminKey = localStorage.getItem("paper_admin_key");

// Default Data Structure
const DEFAULT_DATA = {
    homepage: {
        hero_title: "We Turn Content<br>Into Real Growth.",
        hero_sub: "Short-form videos, reels, and edits that grab attention, build audience, and drive results.",
        hero_cta_text: "Get Started",
        hero_cta_link: "contact.html",
        banner_active: false,
        banner_text: "Available for new projects!"
    },
    projects: [],
    services: [
        { title: "Reels Editing", icon: "🎬", desc: "Scroll-stopping reels designed to boost engagement and retention." },
        { title: "Social Management", icon: "📱", desc: "We manage your growth so you focus on your business." }
    ],
    pricing: [],
    founders: [],
    about: {
        intro: "We are a digital creative studio obsessed with high-impact storytelling.",
        process: []
    },
    contact: {
        email: "hello@paper.media",
        instagram: "https://instagram.com",
        whatsapp: ""
    },
    appearance: {
        primary_color: "#000000",
        bg_color: "#f5f1ea",
        heading_font: "Sora"
    },
    seo: {
        description: "Paper.Media — High-quality reels, social media management & content creation built to convert views into followers and followers into customers.",
        og_image: "https://papermedia.co.in/logo.png",
        ga_id: ""
    }
};

// --- API Logic ---
async function api(path, options = {}) {
    const headers = { 
        'Content-Type': 'application/json', 
        'X-Admin-Key': adminKey,
        ...options.headers 
    };
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

async function getSiteData() {
    try {
        const data = await api('/content');
        return data.content || {};
    } catch (e) {
        console.error("Failed to fetch site data:", e);
        return {};
    }
}

async function saveSiteData(updates) {
    try {
        await api('/admin/content', { method: 'POST', body: JSON.stringify(updates) });
        showToast("Changes saved successfully!");
    } catch (e) {
        showToast("Save failed", true);
    }
}

// Reviews State Management (Synced with site_content key 'reviews')
async function getReviewsData() {
    const data = await getSiteData();
    return data.reviews || [];
}

async function saveReviewsData(reviews) {
    await saveSiteData({ reviews });
    showToast("Reviews saved successfully!");
}

// Toast System
function showToast(msg, isError = false) {
    let toast = document.getElementById('cms-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cms-toast';
        toast.style.cssText = `
            position: fixed; bottom: 30px; right: 30px; padding: 16px 24px;
            background: #000; color: #fff; border-radius: 8px; font-weight: 600;
            z-index: 999999; transform: translateY(100px); opacity: 0;
            transition: all 0.3s ease; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        `;
        document.body.appendChild(toast);
    }
    toast.innerText = msg;
    toast.style.background = isError ? "#ef4444" : "#10b981";
    toast.style.transform = "translateY(0)";
    toast.style.opacity = "1";
    
    setTimeout(() => {
        toast.style.transform = "translateY(100px)";
        toast.style.opacity = "0";
    }, 3000);
}

// === TEMPLATES & RENDERERS ===
const MODULES = {
    dashboard: async () => {
        const data = await getSiteData();
        const portfolio = await api('/portfolio');
        const projectsCount = portfolio.items ? portfolio.items.length : 0;
        
        return `
            <div class="dashboard-home">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
                    <h1>Dashboard Overview</h1>
                    <span style="font-size:12px; color:#10b981; font-weight:700;">● Cloud Sync Active</span>
                </div>
                <div class="stats-grid">
                    <div class="card">
                        <div style="font-size:32px; margin-bottom:8px;">${projectsCount}</div>
                        <div style="color:var(--muted); font-size:14px;">Total Projects</div>
                    </div>
                    <div class="card">
                        <div style="font-size:32px; margin-bottom:8px;">${(data.services || []).length}</div>
                        <div style="color:var(--muted); font-size:14px;">Active Services</div>
                    </div>
                    <div class="card">
                        <div style="font-size:32px; margin-bottom:8px;">${(data.pricing || []).length}</div>
                        <div style="color:var(--muted); font-size:14px;">Pricing Plans</div>
                    </div>
                    <div class="card">
                        <div style="font-size:32px; margin-bottom:8px;">${(data.founders || []).length}</div>
                        <div style="color:var(--muted); font-size:14px;">Team Members</div>
                    </div>
                </div>
            </div>
        `;
    },
    homepage: async () => {
        const fullData = await getSiteData();
        const data = fullData.homepage || {};
        return `
            <h1>Homepage Hero CMS</h1>
            <div class="card" style="margin-top:20px;">
                <label style="display:block; margin-bottom:8px; font-weight:600;">Main Title</label>
                <input type="text" id="hp-title" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:16px;" value="${data.hero_title}">
                
                <label style="display:block; margin-bottom:8px; font-weight:600;">Subtitle</label>
                <textarea id="hp-sub" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; height:80px; margin-bottom:16px;">${data.hero_sub}</textarea>
                
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
                    <div>
                        <label style="display:block; margin-bottom:8px; font-weight:600;">CTA Text</label>
                        <input type="text" id="hp-cta-text" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px;" value="${data.hero_cta_text}">
                    </div>
                    <div>
                        <label style="display:block; margin-bottom:8px; font-weight:600;">CTA Link</label>
                        <input type="text" id="hp-cta-link" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px;" value="${data.hero_cta_link}">
                    </div>
                </div>

                <hr style="border:0; border-top:1px solid #eee; margin:24px 0;">
                
                <label style="display:block; margin-bottom:8px; font-weight:600;">Banner Active?</label>
                <select id="hp-banner-active" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:16px;">
                    <option value="true" ${data.banner_active ? "selected" : ""}>Yes, display banner</option>
                    <option value="false" ${!data.banner_active ? "selected" : ""}>No, hide banner</option>
                </select>

                <label style="display:block; margin-bottom:8px; font-weight:600;">Banner Text</label>
                <input type="text" id="hp-banner-text" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:24px;" value="${data.banner_text}">

                <button class="btn-primary" onclick="saveHomepage()" style="padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save Changes</button>
            </div>
        `;
    },
    portfolio: async () => {
        const res = await api('/portfolio');
        const projects = res.items || [];
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1>Featured Projects</h1>
                <button onclick="addProject()" style="padding:10px 20px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">+ Add Project</button>
            </div>
            <div id="projects-container" style="margin-top:24px; display:grid; gap:16px;">
        `;
        
        projects.forEach((p, idx) => {
            html += `
                <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px;">
                    <div>
                        <div style="font-weight:700; font-size:16px;">${p.title}</div>
                        <div style="font-size:13px; color:#666;">${p.category}</div>
                    </div>
                    <div>
                        <button onclick="editProject(${idx})" style="padding:6px 12px; border:1px solid #ddd; border-radius:4px; background:#fff; cursor:pointer; margin-right:8px;">Edit</button>
                        <button onclick="deleteProject(${idx})" style="padding:6px 12px; border:1px solid #ff4444; color:#ff4444; border-radius:4px; background:#fff; cursor:pointer;">Delete</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        return html;
    },
    reviews: async () => {
        const reviews = await getReviewsData();
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1>Client Reviews</h1>
                <button onclick="addReview()" style="padding:10px 20px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">+ Add Review</button>
            </div>
            <p style="color:#666; margin-top:8px;">Manage testimonials that appear on the homepage. Use arrows to reorder.</p>
            <div style="margin-top:24px; display:grid; gap:16px;">
        `;
        if (reviews.length === 0) {
            html += `<div class="card" style="text-align:center; padding:40px; color:#888;">No reviews yet. Add one!</div>`;
        }
        reviews.forEach((r, idx) => {
            html += `
                <div class="card" style="padding:24px; position:relative;">
                    <div style="position:absolute; top:24px; right:24px; display:flex; gap:8px;">
                        <button onclick="moveReview(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.5"' : ''} style="padding:6px; border:1px solid #ddd; border-radius:4px; background:#fff; cursor:pointer;">↑</button>
                        <button onclick="moveReview(${idx}, 1)" ${idx === reviews.length - 1 ? 'disabled style="opacity:0.5"' : ''} style="padding:6px; border:1px solid #ddd; border-radius:4px; background:#fff; cursor:pointer;">↓</button>
                        <button onclick="deleteReview(${idx})" style="padding:6px 12px; border:1px solid #ff4444; color:#ff4444; border-radius:4px; background:#fff; cursor:pointer; margin-left:8px;">Remove</button>
                    </div>
                    
                    <div style="display:flex; gap:16px; margin-bottom:16px;">
                        <input type="text" id="rev-name-${idx}" value="${r.name}" placeholder="Client Name" style="flex:1; padding:10px; border:1px solid #ddd; border-radius:6px;">
                        <input type="text" id="rev-role-${idx}" value="${r.role}" placeholder="Client Role / Business Type" style="flex:1; padding:10px; border:1px solid #ddd; border-radius:6px;">
                    </div>
                    
                    <div style="display:flex; gap:16px; margin-bottom:16px;">
                        <div style="flex:1;">
                            <input type="text" id="rev-img-${idx}" value="${r.image || ''}" placeholder="Optional Profile Image URL" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
                        </div>
                        <div style="width:150px;">
                            <select id="rev-rating-${idx}" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px;">
                                <option value="5" ${r.rating == 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5)</option>
                                <option value="4" ${r.rating == 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4)</option>
                                <option value="3" ${r.rating == 3 ? 'selected' : ''}>⭐⭐⭐ (3)</option>
                                <option value="2" ${r.rating == 2 ? 'selected' : ''}>⭐⭐ (2)</option>
                                <option value="1" ${r.rating == 1 ? 'selected' : ''}>⭐ (1)</option>
                            </select>
                        </div>
                    </div>
                    
                    <textarea id="rev-text-${idx}" placeholder="Review Text" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; height:80px;">${r.text}</textarea>
                    
                    <div style="margin-top:16px; padding:16px; background:#faf9f6; border-radius:8px; border:1px dashed #ccc;">
                        <div style="font-size:12px; color:#888; margin-bottom:8px; text-transform:uppercase; font-weight:700;">Live Preview</div>
                        <div style="font-style:italic; margin-bottom:12px;">"${r.text}"</div>
                        <div style="display:flex; align-items:center; gap:12px;">
                            ${r.image ? `<img src="${r.image}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">` : `<div style="width:40px; height:40px; border-radius:50%; background:#ddd; display:flex; align-items:center; justify-content:center; font-weight:bold;">${r.name ? r.name[0] : '?'}</div>`}
                            <div>
                                <div style="font-weight:600; font-size:14px;">${r.name || 'Name'}</div>
                                <div style="font-size:12px; color:#666;">${r.role || 'Role'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>
        <button onclick="saveAllReviews()" style="margin-top:24px; padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save All Reviews</button>
        `;
        return html;
    },
    services: async () => {
        const data = await getSiteData();
        const services = data.services || [];
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1>Services CMS</h1>
                <button onclick="addService()" style="padding:10px 20px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">+ Add Service</button>
            </div>
            <div style="margin-top:24px; display:grid; gap:16px;">
        `;
        services.forEach((s, idx) => {
            html += `
                <div class="card" style="padding:24px;">
                    <input type="text" id="svc-icon-${idx}" value="${s.icon}" placeholder="Emoji/Icon" style="width:60px; padding:8px; border:1px solid #ddd; border-radius:4px; margin-bottom:8px;">
                    <input type="text" id="svc-title-${idx}" value="${s.title}" placeholder="Service Name" style="width:calc(100% - 76px); padding:8px; border:1px solid #ddd; border-radius:4px; margin-bottom:8px;">
                    <textarea id="svc-desc-${idx}" placeholder="Description" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:4px; height:60px; margin-bottom:12px;">${s.desc}</textarea>
                    <button onclick="deleteService(${idx})" style="padding:6px 12px; border:1px solid #ff4444; color:#ff4444; border-radius:4px; background:#fff; cursor:pointer;">Remove</button>
                </div>
            `;
        });
        html += `</div>
        <button onclick="saveServices()" style="margin-top:24px; padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save All Services</button>
        `;
        return html;
    },
    appearance: async () => {
        const fullData = await getSiteData();
        const app = fullData.appearance || {};
        const seo = fullData.seo || {};
        return `
            <h1>Appearance & SEO Settings</h1>
            
            <div class="card" style="margin-top:24px;">
                <h2>Visuals</h2>
                <hr style="margin: 16px 0; border: 0; border-top: 1px solid #eee;">
                
                <label style="display:block; margin-bottom:8px; font-weight:600;">Primary Action Color</label>
                <input type="color" id="app-primary" value="${app.primary_color}" style="margin-bottom:16px;">

                <label style="display:block; margin-bottom:8px; font-weight:600;">Background Color</label>
                <input type="color" id="app-bg" value="${app.bg_color}" style="margin-bottom:16px;">

                <label style="display:block; margin-bottom:8px; font-weight:600;">Heading Font</label>
                <select id="app-font" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:24px;">
                    <option value="Sora" ${app.heading_font === 'Sora' ? 'selected' : ''}>Sora (Modern/Bold)</option>
                    <option value="Inter" ${app.heading_font === 'Inter' ? 'selected' : ''}>Inter (Clean/Minimal)</option>
                    <option value="Outfit" ${app.heading_font === 'Outfit' ? 'selected' : ''}>Outfit (Geometric)</option>
                </select>
            </div>
            
            <div class="card" style="margin-top:24px;">
                <h2>SEO & Analytics</h2>
                <hr style="margin: 16px 0; border: 0; border-top: 1px solid #eee;">
                
                <label style="display:block; margin-bottom:8px; font-weight:600;">SEO Description</label>
                <textarea id="seo-desc" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; height:80px; margin-bottom:16px;" placeholder="Brief description for search engines...">${seo.description || ''}</textarea>
                
                <label style="display:block; margin-bottom:8px; font-weight:600;">Open Graph Image URL (For social sharing)</label>
                <input type="text" id="seo-og" value="${seo.og_image || ''}" placeholder="https://..." style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:16px;">
                
                <label style="display:block; margin-bottom:8px; font-weight:600;">Google Analytics Measurement ID</label>
                <input type="text" id="seo-ga" value="${seo.ga_id || ''}" placeholder="G-XXXXXXXXXX" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:24px;">

                <button class="btn-primary" onclick="saveAppearance()" style="padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save All Settings</button>
            </div>
        `;
    },
    pricing: async () => {
        const data = await getSiteData();
        const plans = data.pricing || [];
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1>Pricing Plans</h1>
                <button onclick="addPricing()" style="padding:10px 20px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">+ Add Plan</button>
            </div>
            <div style="margin-top:24px; display:grid; gap:16px; grid-template-columns:1fr 1fr;">
        `;
        plans.forEach((p, idx) => {
            html += `
                <div class="card" style="padding:24px;">
                    <input type="text" id="pr-title-${idx}" value="${p.title}" placeholder="Plan Name" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #ddd; border-radius:4px;">
                    <input type="text" id="pr-price-${idx}" value="${p.price}" placeholder="Price (e.g. $999)" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #ddd; border-radius:4px;">
                    <textarea id="pr-desc-${idx}" placeholder="Description" style="width:100%; padding:8px; margin-bottom:12px; border:1px solid #ddd; border-radius:4px; height:60px;">${p.desc}</textarea>
                    <textarea id="pr-features-${idx}" placeholder="Features (comma separated)" style="width:100%; padding:8px; margin-bottom:12px; border:1px solid #ddd; border-radius:4px; height:60px;">${p.features.join(',')}</textarea>
                    <button onclick="deletePricing(${idx})" style="padding:6px 12px; border:1px solid #ff4444; color:#ff4444; border-radius:4px; background:#fff; cursor:pointer;">Remove</button>
                </div>
            `;
        });
        html += `</div><button onclick="savePricing()" style="margin-top:24px; padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save Pricing</button>`;
        return html;
    },
    founders: async () => {
        const data = await getSiteData();
        const f = data.founders || [];
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1>Founders</h1>
                <button onclick="addFounder()" style="padding:10px 20px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">+ Add Founder</button>
            </div>
            <div style="margin-top:24px; display:grid; gap:16px;">
        `;
        f.forEach((person, idx) => {
            html += `
                <div class="card" style="display:flex; gap:16px; align-items:center;">
                    <input type="text" id="f-name-${idx}" value="${person.name}" placeholder="Name" style="padding:8px; border:1px solid #ddd; border-radius:4px; flex:1;">
                    <input type="text" id="f-role-${idx}" value="${person.role}" placeholder="Role" style="padding:8px; border:1px solid #ddd; border-radius:4px; flex:1;">
                    <input type="text" id="f-img-${idx}" value="${person.image}" placeholder="Image URL" style="padding:8px; border:1px solid #ddd; border-radius:4px; flex:1;">
                    <button onclick="deleteFounder(${idx})" style="padding:8px 12px; border:1px solid #ff4444; color:#ff4444; border-radius:4px; background:#fff; cursor:pointer;">Del</button>
                </div>
            `;
        });
        html += `</div><button onclick="saveFounders()" style="margin-top:24px; padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save Founders</button>`;
        return html;
    },
    contact: async () => {
        const data = await getSiteData();
        const c = data.contact || {};
        return `
            <h1>Contact Section</h1>
            <div class="card" style="margin-top:24px;">
                <label style="display:block; margin-bottom:8px; font-weight:600;">Email</label>
                <input type="email" id="c-email" value="${c.email}" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:16px;">
                
                <label style="display:block; margin-bottom:8px; font-weight:600;">Instagram URL</label>
                <input type="text" id="c-ig" value="${c.instagram}" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:16px;">
                
                <label style="display:block; margin-bottom:8px; font-weight:600;">WhatsApp Link</label>
                <input type="text" id="c-wa" value="${c.whatsapp}" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:24px;">

                <button class="btn-primary" onclick="saveContact()" style="padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save Contact Info</button>
            </div>
        `;
    },
    about: async () => {
        const data = await getSiteData();
        const a = data.about || {};
        return `
            <h1>About Section</h1>
            <div class="card" style="margin-top:24px;">
                <label style="display:block; margin-bottom:8px; font-weight:600;">Intro Text</label>
                <textarea id="ab-intro" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; height:80px; margin-bottom:16px;">${a.intro}</textarea>
                <button class="btn-primary" onclick="saveAbout()" style="padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save About</button>
            </div>
        `;
    },
    navigation: async () => {
        const data = await getSiteData();
        const nav = data.navigation || { home: true, services: true, portfolio: true, pricing: true, about: true, contact: true };
        return `
            <h1>Navigation Menu</h1>
            <div class="card" style="margin-top:24px;">
                <p style="margin-bottom:16px; color:#666;">Toggle which links appear in the main navigation bar.</p>
                ${Object.keys(nav).map(key => `
                    <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #eee;">
                        <span style="text-transform:capitalize; font-weight:600;">${key}</span>
                        <input type="checkbox" id="nav-${key}" ${nav[key] ? 'checked' : ''}>
                    </div>
                `).join('')}
                <button class="btn-primary" onclick="saveNavigation()" style="margin-top:24px; padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save Navigation</button>
            </div>
        `;
    },
    medialib: () => {
        return `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1>Media Library</h1>
                <button onclick="alert('Mock Uploading... Image Saved!')" style="padding:10px 20px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">+ Upload File</button>
            </div>
            <div class="card" style="margin-top:24px; text-align:center; padding:60px;">
                <h2>Local Media Library</h2>
                <p>Media storage is currently simulated. In a real environment, this connects to AWS S3 or Cloudinary.</p>
            </div>
        `;
    }
};

// === ACTION HANDLERS ===

// Homepage
window.saveHomepage = async function() {
    const data = await getSiteData();
    data.homepage = data.homepage || {};
    data.homepage.hero_title = document.getElementById('hp-title').value;
    data.homepage.hero_sub = document.getElementById('hp-sub').value;
    data.homepage.hero_cta_text = document.getElementById('hp-cta-text').value;
    data.homepage.hero_cta_link = document.getElementById('hp-cta-link').value;
    data.homepage.banner_active = document.getElementById('hp-banner-active').value === "true";
    data.homepage.banner_text = document.getElementById('hp-banner-text').value;
    await saveSiteData({ homepage: data.homepage });
};

// Projects
window.deleteProject = async function(id) {
    if(!confirm("Delete this project?")) return;
    try {
        await api(`/admin/portfolio/${id}`, { method: 'DELETE' });
        showToast("Project deleted");
        renderModule('portfolio');
    } catch(e) { showToast("Delete failed", true); }
};
window.addProject = async function() {
    const title = prompt("Project Title:");
    if(!title) return;
    const cat = prompt("Category (e.g., Reel, Strategy):");
    
    try {
        await api('/admin/portfolio', { 
            method: 'POST', 
            body: JSON.stringify({ title, tag: cat || "", is_featured: 1 }) 
        });
        showToast("Project added!");
        renderModule('portfolio');
    } catch(e) { showToast("Failed to add project", true); }
};
window.editProject = async function(id) {
    const res = await api('/portfolio');
    const p = (res.items || []).find(proj => proj.id == id);
    if(!p) return;

    const newTitle = prompt("Edit Title:", p.title);
    if(newTitle === null) return;
    
    try {
        await api(`/admin/portfolio/${id}`, { 
            method: 'PUT', 
            body: JSON.stringify({ title: newTitle }) 
        });
        showToast("Project updated!");
        renderModule('portfolio');
    } catch(e) { showToast("Update failed", true); }
};

// Reviews
window.addReview = async function() {
    const data = await getReviewsData();
    data.unshift({ name: "", role: "", text: "", rating: 5, image: "" });
    await saveReviewsData(data);
    renderModule('reviews');
};
window.deleteReview = async function(idx) {
    if(!confirm("Delete this review?")) return;
    const data = await getReviewsData();
    data.splice(idx, 1);
    await saveReviewsData(data);
    renderModule('reviews');
};
window.moveReview = async function(idx, dir) {
    const data = await getReviewsData();
    if(idx + dir < 0 || idx + dir >= data.length) return;
    const temp = data[idx];
    data[idx] = data[idx + dir];
    data[idx + dir] = temp;
    await saveReviewsData(data);
    renderModule('reviews');
};
window.saveAllReviews = async function() {
    const data = await getReviewsData();
    data.forEach((r, idx) => {
        r.name = document.getElementById(`rev-name-${idx}`).value;
        r.role = document.getElementById(`rev-role-${idx}`).value;
        r.text = document.getElementById(`rev-text-${idx}`).value;
        r.rating = parseInt(document.getElementById(`rev-rating-${idx}`).value, 10);
        r.image = document.getElementById(`rev-img-${idx}`).value;
    });
    await saveReviewsData(data);
    renderModule('reviews'); 
};

// Services
window.addService = async function() {
    const data = await getSiteData();
    data.services = data.services || [];
    data.services.push({ icon: "✨", title: "New Service", desc: "" });
    await saveSiteData({ services: data.services });
    renderModule('services');
};
window.deleteService = async function(idx) {
    const data = await getSiteData();
    data.services.splice(idx, 1);
    await saveSiteData({ services: data.services });
    renderModule('services');
};
window.saveServices = async function() {
    const data = await getSiteData();
    data.services.forEach((s, idx) => {
        s.icon = document.getElementById(`svc-icon-${idx}`).value;
        s.title = document.getElementById(`svc-title-${idx}`).value;
        s.desc = document.getElementById(`svc-desc-${idx}`).value;
    });
    await saveSiteData({ services: data.services });
};

// Appearance & SEO
window.saveAppearance = async function() {
    const data = await getSiteData();
    const appearance = {
        primary_color: document.getElementById('app-primary').value,
        bg_color: document.getElementById('app-bg').value,
        heading_font: document.getElementById('app-font').value
    };
    
    const seo = {
        description: document.getElementById('seo-desc').value,
        og_image: document.getElementById('seo-og').value,
        ga_id: document.getElementById('seo-ga').value
    };
    
    await saveSiteData({ appearance, seo });
};

// Pricing
window.addPricing = async function() {
    const data = await getSiteData();
    data.pricing = data.pricing || [];
    data.pricing.push({ title: "New Plan", price: "$0", desc: "Plan description", features: ["Feature 1"] });
    await saveSiteData({ pricing: data.pricing });
    renderModule('pricing');
};
window.deletePricing = async function(idx) {
    const data = await getSiteData();
    data.pricing.splice(idx, 1);
    await saveSiteData({ pricing: data.pricing });
    renderModule('pricing');
};
window.savePricing = async function() {
    const data = await getSiteData();
    data.pricing.forEach((p, idx) => {
        p.title = document.getElementById(`pr-title-${idx}`).value;
        p.price = document.getElementById(`pr-price-${idx}`).value;
        p.desc = document.getElementById(`pr-desc-${idx}`).value;
        p.features = document.getElementById(`pr-features-${idx}`).value.split(',').map(f => f.trim()).filter(f => f);
    });
    await saveSiteData({ pricing: data.pricing });
};

// Founders
window.addFounder = async function() {
    const data = await getSiteData();
    data.founders = data.founders || [];
    data.founders.push({ name: "New Founder", role: "Role", image: "" });
    await saveSiteData({ founders: data.founders });
    renderModule('founders');
};
window.deleteFounder = async function(idx) {
    const data = await getSiteData();
    data.founders.splice(idx, 1);
    await saveSiteData({ founders: data.founders });
    renderModule('founders');
};
window.saveFounders = async function() {
    const data = await getSiteData();
    data.founders.forEach((f, idx) => {
        f.name = document.getElementById(`f-name-${idx}`).value;
        f.role = document.getElementById(`f-role-${idx}`).value;
        f.image = document.getElementById(`f-img-${idx}`).value;
    });
    await saveSiteData({ founders: data.founders });
};

// Contact
window.saveContact = async function() {
    const contact = {
        email: document.getElementById('c-email').value,
        instagram: document.getElementById('c-ig').value,
        whatsapp: document.getElementById('c-wa').value
    };
    await saveSiteData({ contact });
};

// About
window.saveAbout = async function() {
    const about = {
        intro: document.getElementById('ab-intro').value
    };
    await saveSiteData({ about });
};

// Navigation
window.saveNavigation = async function() {
    const data = await getSiteData();
    const navigation = data.navigation || {};
    Object.keys(navigation).forEach(key => {
        navigation[key] = document.getElementById(`nav-${key}`).checked;
    });
    await saveSiteData({ navigation });
};

// === ROUTER ===
window.renderModule = async function(moduleName) {
    const container = document.getElementById('main-content');
    container.innerHTML = `<div style="padding:100px; text-align:center; font-size:18px; color:var(--muted);">⏳ Loading Cloud Data...</div>`;
    
    if (MODULES[moduleName]) {
        try {
            const html = await MODULES[moduleName]();
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = `<div class="card" style="text-align:center; padding:60px; color:var(--danger);">Error loading module: ${e.message}</div>`;
        }
    } else {
        container.innerHTML = `
            <div class="card" style="text-align:center; padding:60px;">
                <h2>Module Under Construction</h2>
                <p>The <strong>${moduleName}</strong> module is currently being built.</p>
            </div>
        `;
    }

    // Update active nav state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.dataset.module === moduleName) {
            btn.classList.add('active');
        }
    });
};

// Ensure Dashboard loads on init
window.addEventListener('DOMContentLoaded', () => {
    // Only run if we are inside the admin dashboard
    if(document.getElementById('main-content')) {
        renderModule('dashboard');
    }
});
