// === PAPER.MEDIA DYNAMIC CMS ENGINE ===
const CMS_KEY = "papermedia_cms_data";

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
    pricing: [
        { title: "Starter", price: "₹14,999/mo", desc: "Perfect for individual creators starting their journey.", features: ["8 High-Quality Reels", "Professional Color Grading", "Basic Content Strategy", "48-Hour Turnaround"] },
        { title: "Growth", price: "₹29,999/mo", desc: "For brands ready to scale their social presence.", features: ["15 High-Quality Reels", "Social Media Management", "Advanced Strategy & SEO", "Monthly Growth Reports"] },
        { title: "Agency", price: "Custom", desc: "Tailored solutions for established businesses.", features: ["Unlimited Reels Editing", "Dedicated Content Manager", "Full Production Support", "Priority Support"] }
    ],

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

// State Management
function getSiteData() {
    const raw = localStorage.getItem(CMS_KEY);
    if (!raw) {
        localStorage.setItem(CMS_KEY, JSON.stringify(DEFAULT_DATA));
        return DEFAULT_DATA;
    }
    return JSON.parse(raw);
}

function saveSiteData(data) {
    localStorage.setItem(CMS_KEY, JSON.stringify(data));
    showToast("Changes saved successfully!");
}

// Reviews State Management
const REVIEWS_KEY = "papermedia_reviews";
function getReviewsData() {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
}
function saveReviewsData(data) {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(data));
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
    dashboard: () => {
        const data = getSiteData();
        return `
            <div class="dashboard-home">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
                    <h1>Dashboard Overview</h1>
                    <span style="font-size:12px; color:#888;">Live Data Synced</span>
                </div>
                <div class="stats-grid">
                    <div class="card">
                        <div style="font-size:32px; margin-bottom:8px;">${data.projects.length}</div>
                        <div style="color:var(--muted); font-size:14px;">Total Projects</div>
                    </div>
                    <div class="card">
                        <div style="font-size:32px; margin-bottom:8px;">${data.services.length}</div>
                        <div style="color:var(--muted); font-size:14px;">Active Services</div>
                    </div>
                    <div class="card">
                        <div style="font-size:32px; margin-bottom:8px;">${data.pricing.length}</div>
                        <div style="color:var(--muted); font-size:14px;">Pricing Plans</div>
                    </div>
                </div>

                <div class="card" style="margin-top: 24px;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                        <h2>Recent Inquiries</h2>
                        <button class="btn-secondary" onclick="fetchInquiries()" style="padding:6px 12px; font-size:12px;">Refresh</button>
                    </div>
                    <div style="overflow-x:auto;">
                        <table style="width:100%; border-collapse:collapse; text-align:left;">
                            <thead>
                                <tr style="border-bottom:1px solid #eee;">
                                    <th style="padding:12px 8px; color:#666; font-weight:600;">Name</th>
                                    <th style="padding:12px 8px; color:#666; font-weight:600;">Message</th>
                                    <th style="padding:12px 8px; color:#666; font-weight:600;">Date</th>
                                    <th style="padding:12px 8px; color:#666; font-weight:600;">Status</th>
                                    <th style="padding:12px 8px; color:#666; font-weight:600; text-align:right;">Action</th>
                                </tr>
                            </thead>
                            <tbody id="inquiries-list">
                                <tr><td colspan="5" style="padding:24px; text-align:center; color:#888;">Fetching inquiries...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <script>
                if (typeof fetchInquiries === "function") {
                    setTimeout(fetchInquiries, 100);
                }
            </script>
        `;
    },
    homepage: () => {
        const data = getSiteData().homepage;
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
    portfolio: () => {
        const projects = getSiteData().projects;
        let html = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h1>Media Library</h1>
                <button onclick="addProject()" style="padding:10px 20px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">+ Add Media</button>
            </div>
            <div id="projects-container" style="margin-top:24px; display:grid; gap:16px;">
        `;
        
        projects.forEach((p, idx) => {
            html += `
                <div class="card" style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px;">
                    <div style="display:flex; align-items:center; gap:16px;">
                        <img src="${p.thumbnail}" style="width:60px; height:60px; object-fit:cover; border-radius:8px; background:#eee;" onerror="this.src='https://via.placeholder.com/60'">
                        <div>
                            <div style="font-weight:700; font-size:16px;">${p.desc ? 'Media' : 'Media (No Description)'}</div>
                            <div style="font-size:13px; color:#666; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.desc || "No description"}</div>
                        </div>
                    </div>
                    <div>
                        <button onclick="editProject(${idx})" style="padding:6px 12px; border:1px solid #ddd; border-radius:4px; background:#fff; cursor:pointer; margin-right:8px;">Edit Desc</button>
                        <button onclick="deleteProject(${idx})" style="padding:6px 12px; border:1px solid #ff4444; color:#ff4444; border-radius:4px; background:#fff; cursor:pointer;">Remove</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        return html;
    },
    reviews: () => {
        const reviews = getReviewsData();
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
    services: () => {
        const services = getSiteData().services;
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
    appearance: () => {
        const app = getSiteData().appearance;
        const seo = getSiteData().seo || {};
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
    pricing: () => {
        const plans = getSiteData().pricing;
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
                    <input type="text" id="pr-title-${idx}" value="${p.title}" placeholder="Plan Name (e.g. Prime, Basic)" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #ddd; border-radius:4px;">
                    <input type="text" id="pr-price-${idx}" value="${p.price}" placeholder="Price (e.g. ₹9,999/mo)" style="width:100%; padding:8px; margin-bottom:8px; border:1px solid #ddd; border-radius:4px;">
                    <textarea id="pr-desc-${idx}" placeholder="Description" style="width:100%; padding:8px; margin-bottom:12px; border:1px solid #ddd; border-radius:4px; height:60px;">${p.desc}</textarea>
                    <textarea id="pr-features-${idx}" placeholder="Features (one per line)" style="width:100%; padding:8px; margin-bottom:12px; border:1px solid #ddd; border-radius:4px; height:60px;">${p.features.join('\n')}</textarea>
                    <button onclick="deletePricing(${idx})" style="padding:6px 12px; border:1px solid #ff4444; color:#ff4444; border-radius:4px; background:#fff; cursor:pointer;">Remove</button>
                </div>
            `;
        });
        html += `</div><button onclick="savePricing()" style="margin-top:24px; padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save Pricing</button>`;
        return html;
    },

    contact: () => {
        const c = getSiteData().contact;
        return `
            <h1>Contact Section</h1>
            <div class="card" style="margin-top:24px;">
                <label style="display:block; margin-bottom:8px; font-weight:600;">Email</label>
                <input type="email" id="c-email" value="${c.email}" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:16px;">
                
                <label style="display:block; margin-bottom:8px; font-weight:600;">Instagram URL</label>
                <input type="text" id="c-ig" value="${c.instagram}" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:16px;">
                
                <label style="display:block; margin-bottom:8px; font-weight:600;">WhatsApp Number</label>
                <input type="text" id="c-wa" value="${c.whatsapp}" placeholder="e.g. +1234567890" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; margin-bottom:24px;">

                <button class="btn-primary" onclick="saveContact()" style="padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save Contact Info</button>
            </div>
        `;
    },
    about: () => {
        const a = getSiteData().about;
        return `
            <h1>About Section</h1>
            <div class="card" style="margin-top:24px;">
                <label style="display:block; margin-bottom:8px; font-weight:600;">Intro Text</label>
                <textarea id="ab-intro" style="width:100%; padding:12px; border:1px solid #ddd; border-radius:6px; height:80px; margin-bottom:16px;">${a.intro}</textarea>
                <button class="btn-primary" onclick="saveAbout()" style="padding:12px 24px; background:#000; color:#fff; border:none; border-radius:6px; cursor:pointer;">Save About</button>
            </div>
        `;
    },


};

// === ACTION HANDLERS ===

// Homepage
window.saveHomepage = function() {
    const data = getSiteData();
    data.homepage.hero_title = document.getElementById('hp-title').value;
    data.homepage.hero_sub = document.getElementById('hp-sub').value;
    data.homepage.hero_cta_text = document.getElementById('hp-cta-text').value;
    data.homepage.hero_cta_link = document.getElementById('hp-cta-link').value;
    data.homepage.banner_active = document.getElementById('hp-banner-active').value === "true";
    data.homepage.banner_text = document.getElementById('hp-banner-text').value;
    saveSiteData(data);
};

let editingIdx = null;

function showMediaModal(idx = null) {
    editingIdx = idx;
    let existingDesc = "";
    let existingUrl = "";
    if(idx !== null) {
        const p = getSiteData().projects[idx];
        existingDesc = p.desc || "";
        existingUrl = p.thumbnail || "";
    }
    
    let modal = document.getElementById('media-modal');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'media-modal';
        modal.className = 'modal hidden';
        modal.innerHTML = `
            <div class="modal-content">
                <h2 id="media-modal-title" style="margin-bottom: 24px;">Add Media</h2>
                <div class="form-group">
                    <label>Upload File (Image / Video)</label>
                    <input type="file" id="media-file-input" accept="image/*,video/*" style="margin-bottom:8px; padding: 12px; border: 2px dashed #ddd; width: 100%; border-radius: 8px; cursor: pointer;">
                    <div style="font-size:11px; color:var(--muted); margin-bottom:16px;">Files are processed locally. For large files, use the URL field instead.</div>
                </div>
                <div style="text-align:center; font-size:12px; font-weight:bold; color:#aaa; margin-bottom:16px;">OR</div>
                <div class="form-group">
                    <label>Paste Media URL</label>
                    <input type="text" id="media-url-input" placeholder="https://...">
                </div>
                <div class="form-group">
                    <label>Description (Optional)</label>
                    <textarea id="media-desc-input" style="height:80px;" placeholder="Brief details..."></textarea>
                </div>
                <div style="display:flex; gap:12px; margin-top:32px;">
                    <button class="btn-primary" onclick="saveMediaModal()">Save Media</button>
                    <button class="btn-secondary" onclick="document.getElementById('media-modal').classList.add('hidden')">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Handle file selection and convert to data URL for local preview
        document.getElementById('media-file-input').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if(!file) return;
            const reader = new FileReader();
            reader.onload = function(evt) {
                document.getElementById('media-url-input').value = evt.target.result;
            };
            reader.readAsDataURL(file);
        });
    }
    
    document.getElementById('media-modal-title').innerText = idx !== null ? "Edit Media" : "Add Media";
    document.getElementById('media-url-input').value = existingUrl;
    document.getElementById('media-desc-input').value = existingDesc;
    document.getElementById('media-file-input').value = ""; // reset file input
    modal.classList.remove('hidden');
}

window.deleteProject = function(idx) {
    if(!confirm("Delete this media?")) return;
    const data = getSiteData();
    data.projects.splice(idx, 1);
    saveSiteData(data);
    renderModule('portfolio');
};

window.addProject = function() {
    showMediaModal(null);
};

window.editProject = function(idx) {
    showMediaModal(idx);
};

window.saveMediaModal = function() {
    const url = document.getElementById('media-url-input').value;
    const desc = document.getElementById('media-desc-input').value;
    if(!url) {
        alert("Please provide a media URL or upload a file.");
        return;
    }
    
    const data = getSiteData();
    if(editingIdx !== null) {
        data.projects[editingIdx].thumbnail = url;
        data.projects[editingIdx].desc = desc;
    } else {
        data.projects.push({ title: "Media", category: "", thumbnail: url, video: "", desc: desc || "" });
    }
    saveSiteData(data);
    document.getElementById('media-modal').classList.add('hidden');
    renderModule('portfolio');
};

// Reviews
window.addReview = function() {
    const data = getReviewsData();
    data.unshift({ name: "", role: "", text: "", rating: 5, image: "" });
    saveReviewsData(data);
    renderModule('reviews');
};
window.deleteReview = function(idx) {
    if(!confirm("Delete this review?")) return;
    const data = getReviewsData();
    data.splice(idx, 1);
    saveReviewsData(data);
    renderModule('reviews');
};
window.moveReview = function(idx, dir) {
    const data = getReviewsData();
    if(idx + dir < 0 || idx + dir >= data.length) return;
    const temp = data[idx];
    data[idx] = data[idx + dir];
    data[idx + dir] = temp;
    saveReviewsData(data);
    renderModule('reviews');
};
window.saveAllReviews = function() {
    const data = getReviewsData();
    data.forEach((r, idx) => {
        r.name = document.getElementById(`rev-name-${idx}`).value;
        r.role = document.getElementById(`rev-role-${idx}`).value;
        r.text = document.getElementById(`rev-text-${idx}`).value;
        r.rating = parseInt(document.getElementById(`rev-rating-${idx}`).value, 10);
        r.image = document.getElementById(`rev-img-${idx}`).value;
    });
    saveReviewsData(data);
    renderModule('reviews'); // Re-render for live preview updates
};

// Services
window.addService = function() {
    const data = getSiteData();
    data.services.push({ icon: "✨", title: "New Service", desc: "" });
    saveSiteData(data);
    renderModule('services');
};
window.deleteService = function(idx) {
    const data = getSiteData();
    data.services.splice(idx, 1);
    saveSiteData(data);
    renderModule('services');
};
window.saveServices = function() {
    const data = getSiteData();
    data.services.forEach((s, idx) => {
        s.icon = document.getElementById(`svc-icon-${idx}`).value;
        s.title = document.getElementById(`svc-title-${idx}`).value;
        s.desc = document.getElementById(`svc-desc-${idx}`).value;
    });
    saveSiteData(data);
};

// Appearance & SEO
window.saveAppearance = function() {
    const data = getSiteData();
    data.appearance.primary_color = document.getElementById('app-primary').value;
    data.appearance.bg_color = document.getElementById('app-bg').value;
    data.appearance.heading_font = document.getElementById('app-font').value;
    
    if (!data.seo) data.seo = {};
    data.seo.description = document.getElementById('seo-desc').value;
    data.seo.og_image = document.getElementById('seo-og').value;
    data.seo.ga_id = document.getElementById('seo-ga').value;
    
    saveSiteData(data);
};

// Pricing
window.addPricing = function() {
    const data = getSiteData();
    data.pricing.push({ title: "New Plan", price: "₹9,999/mo", desc: "Plan description", features: ["Feature 1"] });
    saveSiteData(data);
    renderModule('pricing');
};
window.deletePricing = function(idx) {
    const data = getSiteData();
    data.pricing.splice(idx, 1);
    saveSiteData(data);
    renderModule('pricing');
};
window.savePricing = function() {
    const data = getSiteData();
    data.pricing.forEach((p, idx) => {
        p.title = document.getElementById(`pr-title-${idx}`).value;
        p.price = document.getElementById(`pr-price-${idx}`).value;
        p.desc = document.getElementById(`pr-desc-${idx}`).value;
        p.features = document.getElementById(`pr-features-${idx}`).value.split(/\r?\n/).map(f => f.trim()).filter(f => f);
    });
    saveSiteData(data);
};


// Contact
window.saveContact = function() {
    const data = getSiteData();
    data.contact.email = document.getElementById('c-email').value;
    data.contact.instagram = document.getElementById('c-ig').value;
    data.contact.whatsapp = document.getElementById('c-wa').value;
    saveSiteData(data);
};

// About
window.saveAbout = function() {
    const data = getSiteData();
    data.about.intro = document.getElementById('ab-intro').value;
    saveSiteData(data);
};



// === ROUTER ===
window.renderModule = function(moduleName) {
    const container = document.getElementById('main-content');
    if (MODULES[moduleName]) {
        container.innerHTML = MODULES[moduleName]();
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

// === INQUIRIES API INTEGRATION ===
window.fetchInquiries = async function() {
    const list = document.getElementById('inquiries-list');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="5" style="padding:24px; text-align:center; color:#888;">Loading...</td></tr>';
    const secret = localStorage.getItem("papermedia_admin_secret");
    
    try {
        const res = await fetch("https://papermediaapi.paper-mediaa.workers.dev/admin/inquiries", {
            headers: { "X-Admin-Key": secret }
        });
        const data = await res.json();
        
        if (data.inquiries && data.inquiries.length > 0) {
            list.innerHTML = data.inquiries.map(inq => {
                const isReplied = inq.status === 'replied';
                return `
                    <tr style="border-bottom:1px solid #eee;">
                        <td style="padding:12px 8px; font-weight:600;">${inq.name}</td>
                        <td style="padding:12px 8px; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${inq.message}">
                            ${inq.message}
                        </td>
                        <td style="padding:12px 8px; font-size:12px; color:#666;">
                            ${new Date(inq.created_at + 'Z').toLocaleDateString()}
                        </td>
                        <td style="padding:12px 8px;">
                            <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:12px; color:${isReplied ? '#10b981' : '#f59e0b'}; font-weight:600;">
                                <input type="checkbox" onchange="updateInquiryStatus(${inq.id}, this.checked)" ${isReplied ? 'checked' : ''}>
                                ${isReplied ? 'Replied' : 'Pending'}
                            </label>
                        </td>
                        <td style="padding:12px 8px; text-align:right;">
                            <a href="mailto:${inq.email}?subject=Reply from Paper.Media" class="btn-secondary" style="padding:6px 12px; text-decoration:none; display:inline-block; font-size:12px;">Reply Email</a>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            list.innerHTML = '<tr><td colspan="5" style="padding:24px; text-align:center; color:#888;">No inquiries found.</td></tr>';
        }
    } catch (err) {
        list.innerHTML = '<tr><td colspan="5" style="padding:24px; text-align:center; color:red;">Failed to load inquiries.</td></tr>';
        console.error(err);
    }
};

window.updateInquiryStatus = async function(id, isChecked) {
    const status = isChecked ? 'replied' : 'new';
    const secret = localStorage.getItem("papermedia_admin_secret");
    try {
        await fetch(`https://papermediaapi.paper-mediaa.workers.dev/admin/inquiries/${id}`, {
            method: "PUT",
            headers: { "X-Admin-Key": secret, "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });
        fetchInquiries(); // Refresh to update colors and labels
    } catch (err) {
        alert("Failed to update status.");
    }
};
