// === GLOBAL APP LOGIC ===

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initNavbar();
    initScrollReveal();
    initMagnetic();
    loadSiteData(); // Load CMS content
});

// === CMS DATA LOADING ===
const API_BASE = 'https://papermediaapi.paper-mediaa.workers.dev';

async function loadSiteData() {
    const path = window.location.pathname;
    const isHome = path === '/' || path.endsWith('index.html');

    // ── Inject skeletons immediately (before any fetch) ──────────────────
    if (isHome || path.includes('services.html')) {
        showSkeletons('.services-grid', 'service', 3);
    }
    if (isHome || path.includes('portfolio.html')) {
        showSkeletons('#featuredPortfolio', 'portfolio', 3);
        showSkeletons('.portfolio-grid:not(#featuredPortfolio)', 'portfolio', 6);
    }
    if (isHome) {
        showSkeletons('.testimonials-grid', 'testimonial', 3);
        showSkeletons('#testimonialsGrid', 'testimonial', 3);
    }
    if (path.includes('pricing.html')) {
        showSkeletons('.pricing-grid', 'pricing', 4);
    }

    try {
        // Fetch content + portfolio in parallel for speed
        const [contentRes, portRes] = await Promise.all([
            fetch(`${API_BASE}/content`, { cache: 'no-store' }),
            (path.includes('portfolio.html') || isHome)
                ? fetch(`${API_BASE}/portfolio?featured=${isHome ? '1' : '0'}`, { cache: 'no-store' })
                : Promise.resolve(null)
        ]);

        const { content = {} } = await contentRes.json();
        const portData = portRes ? await portRes.json() : null;

        // --- Global Updates ---
        updateBanner(content.homepage || {});
        updateHero(content.homepage || {});
        updateSettings(content);
        injectSEO(content);
        applyAppearance(content.appearance || {}, content.mobile || {});

        const allContentItems = [
            ...(Array.isArray(content.services) ? content.services : []),
            ...(portData && Array.isArray(portData.items) ? portData.items : [])
        ];

        // --- Services (home + services.html) ---
        if (isHome || path.includes('services.html')) {
            // Ensure Services section only renders items with type/category = "service"
            const services = allContentItems.filter(item => 
                item.type === 'service' || 
                item.category === 'service' ||
                (!item.type && !item.category && !item.video_url && !item.image_url) // safe fallback for legacy services
            );
            clearSkeletons('.services-grid');
            updateServices(services);
        }

        // --- Portfolio ---
        if (typeof loadFeatured === 'function') {
            // Featured Projects section only renders items with: featured_project, reel, portfolio_item
            const validTypes = ['featured_project', 'reel', 'portfolio_item'];
            const portfolioItems = allContentItems.filter(item => 
                validTypes.includes(item.type) || 
                validTypes.includes(item.category) ||
                validTypes.includes(item.tag) ||
                item.featured_project === true || 
                item.reel === true || 
                item.portfolio_item === true
            );
            
            clearSkeletons('#featuredPortfolio');
            clearSkeletons('.portfolio-grid');
            loadFeatured(portfolioItems);
        }

        // --- Testimonials (home only) ---
        if (isHome) {
            const reviews = Array.isArray(content.reviews) ? content.reviews : [];
            clearSkeletons('.testimonials-grid');
            clearSkeletons('#testimonialsGrid');
            updateTestimonials(reviews);
        }

        // --- Pricing ---
        if (path.includes('pricing.html')) {
            const pricing = Array.isArray(content.pricing) ? content.pricing : [];
            clearSkeletons('.pricing-grid');
            updatePricing(pricing);
        }

        // --- Founders / About (Moved to Home) ---
        if (isHome) {
            const founders = Array.isArray(content.founders) ? content.founders : [];
            updateFounders(founders);
            const aboutIntro = document.querySelector('.creators-intro');
            if (aboutIntro && content.founders_intro) aboutIntro.innerHTML = content.founders_intro;
        }

    } catch (err) {
        console.error('CMS load error:', err);
        // On error: clear all skeletons and show empty state
        ['.services-grid', '#featuredPortfolio', '.portfolio-grid',
         '.testimonials-grid', '#testimonialsGrid', '.pricing-grid'
        ].forEach(sel => clearSkeletons(sel));
    }
}


// === SKELETON TEMPLATES ===

const SKELETONS = {
    service: () => `
        <div class="sk-service">
            <div class="sk-block sk-emoji"></div>
            <div class="sk-block sk-title"></div>
            <div class="sk-block sk-line"></div>
            <div class="sk-block sk-line"></div>
            <div class="sk-block sk-line short"></div>
        </div>`,

    portfolio: () => `
        <div class="sk-port">
            <div class="sk-block sk-thumb"></div>
            <div class="sk-port-body">
                <div class="sk-block sk-tag"></div>
                <div class="sk-block sk-name"></div>
            </div>
        </div>`,

    testimonial: () => `
        <div class="sk-test">
            <div class="sk-block sk-stars"></div>
            <div class="sk-block sk-text-line"></div>
            <div class="sk-block sk-text-line med"></div>
            <div class="sk-block sk-text-line short"></div>
            <div class="sk-author">
                <div class="sk-block sk-avatar"></div>
                <div class="sk-author-info">
                    <div class="sk-block sk-author-name"></div>
                    <div class="sk-block sk-author-role"></div>
                </div>
            </div>
        </div>`,

    pricing: () => `
        <div class="sk-pricing">
            <div class="sk-block sk-tier"></div>
            <div class="sk-block sk-price"></div>
            <div class="sk-block sk-desc"></div>
            <div class="sk-block sk-feat"></div>
            <div class="sk-block sk-feat med"></div>
            <div class="sk-block sk-feat med"></div>
            <div class="sk-block sk-feat short"></div>
            <div class="sk-block sk-btn"></div>
        </div>`,
};

function showSkeletons(selector, type, count = 3) {
    const el = document.querySelector(selector);
    if (!el) return;
    // Only inject if container is empty or has placeholder comment
    const alreadyHasContent = el.querySelector('.sk-service, .sk-port, .sk-test, .sk-pricing, .service-card, .port-card, .testimonial-card, .pricing-card');
    if (alreadyHasContent) return;
    const template = SKELETONS[type];
    if (!template) return;
    el.innerHTML = Array.from({ length: count }, template).join('');
}

function clearSkeletons(selector) {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = '';
}



function updateBanner(content) {
    if (content.banner_active && content.banner_text) {
        let banner = document.getElementById('announcement-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'announcement-banner';
            banner.style.cssText = 'background:var(--primary); color:white; text-align:center; padding:8px; font-size:13px; font-weight:600; position:relative; z-index:2000;';
            document.body.prepend(banner);
        }
        banner.innerText = content.banner_text;
    } else {
        const banner = document.getElementById('announcement-banner');
        if (banner) banner.remove();
    }
}

function updateHero(content) {
    const title = document.getElementById('client-hero_title');
    const sub   = document.getElementById('client-hero_sub');
    const ctaPrimary = document.getElementById('client-hero_cta_primary');

    // Smooth content swap — fade out → update → fade in
    const fadeSwap = (el, newHTML, isText = false) => {
        if (!el || !newHTML) return;
        el.style.transition = 'opacity 0.3s ease';
        el.style.opacity = '0';
        setTimeout(() => {
            if (isText) el.innerText = newHTML;
            else el.innerHTML = newHTML;
            el.style.opacity = '1';
        }, 300);
    };

    if (title && content.hero_title) fadeSwap(title, content.hero_title);
    if (sub && content.hero_sub)     fadeSwap(sub, content.hero_sub);
    if (ctaPrimary && content.hero_cta_text) fadeSwap(ctaPrimary, content.hero_cta_text, true);
    if (ctaPrimary && content.hero_cta_link) ctaPrimary.href = content.hero_cta_link;

    // Stats — inject skeleton first, then replace with real data
    const statsStrip = document.querySelector('.hero-stats-strip');
    if (content.stats && statsStrip) {
        const statsContainers = document.querySelectorAll('.hstat, .hero-card');
        content.stats.slice(0, 4).forEach((stat, i) => {
            const container = statsContainers[i];
            if (!container) return;
            // Remove shimmer if previously applied
            container.classList.remove('sk-block');
            const numEl   = container.querySelector('.hstat-num,   .hero-card-num');
            const labelEl = container.querySelector('.hstat-label, .hero-card-label');
            if (numEl)   { numEl.style.opacity   = '0'; setTimeout(() => { numEl.innerText   = stat.value; numEl.style.transition   = 'opacity 0.4s'; numEl.style.opacity   = '1'; }, 200 + i * 60); }
            if (labelEl) { labelEl.style.opacity = '0'; setTimeout(() => { labelEl.innerText = stat.label; labelEl.style.transition = 'opacity 0.4s'; labelEl.style.opacity = '1'; }, 200 + i * 60); }
        });
    }
}


function updateSettings(content) {
    // --- Logo ---
    // if (content.logo_url) {
    //     document.querySelectorAll('.brand-logo, .footer-logo img, .footer-logo-img').forEach(img => img.src = content.logo_url);
    // }

    // --- Meta Title ---
    if (content.meta_title) {
        document.title = content.meta_title;
    }

    // --- Socials: connect every link on the page to admin panel values ---
    const s = content.socials || {};

    // Helper: show/hide + update href for all matching elements
    const syncLink = (selector, href) => {
        document.querySelectorAll(selector).forEach(el => {
            if (href) {
                el.href = href;
                el.style.display = '';   // make sure it's visible
            } else {
                el.style.display = 'none'; // hide if no value set in admin
            }
        });
    };

    // Instagram — stored as full URL in admin
    syncLink('#client-contact_ig, [data-social="instagram"]', s.instagram || '');

    // LinkedIn — stored as full URL in admin
    syncLink('#client-contact_li, [data-social="linkedin"]', s.linkedin || '');

    // WhatsApp — admin stores the raw number (e.g. 919503691537), convert to wa.me link
    const waHref = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : '';
    syncLink('#client-contact_whatsapp, [data-social="whatsapp"]', waHref);

    // Email — admin stores plain email address, auto-prefix mailto:
    const emailHref = s.email ? (s.email.startsWith('mailto:') ? s.email : `mailto:${s.email}`) : '';
    syncLink('#client-contact_email, [data-social="email"]', emailHref);

    // Also update the visible email text in the footer contact column
    const emailTextEl = document.getElementById('client-contact_email_text');
    if (emailTextEl) {
        if (s.email) {
            emailTextEl.textContent = s.email;
            emailTextEl.href = `mailto:${s.email}`;
            emailTextEl.style.display = '';
        } else {
            emailTextEl.style.display = 'none';
        }
    }
}

function injectSEO(content) {
    const seo = content.seo || {};
    
    // 1. Dynamic Meta Tags
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
    }
    if (seo.description) metaDesc.content = seo.description;

    let ogImage = document.querySelector('meta[property="og:image"]');
    if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute("property", "og:image");
        document.head.appendChild(ogImage);
    }
    if (seo.og_image) ogImage.content = seo.og_image;
    
    // 2. Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
    }
    canonical.href = window.location.href.split('?')[0];

    // 3. Structured Schema (JSON-LD) for index.html only
    if (window.location.pathname === '/' || window.location.pathname.endsWith('index.html')) {
        let schemaScript = document.getElementById('seo-schema');
        if (!schemaScript) {
            schemaScript = document.createElement('script');
            schemaScript.id = "seo-schema";
            schemaScript.type = "application/ld+json";
            document.head.appendChild(schemaScript);
        }
        
        const schemaData = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Paper.Media",
            "url": "https://papermedia.co.in/",
            "logo": content.logo_url || "https://papermedia.co.in/paper-media-logo.jpg"
        };
        schemaScript.textContent = JSON.stringify(schemaData);
    }

    // 4. Google Analytics
    if (seo.ga_id && !window.gtag) {
        const gaScript = document.createElement('script');
        gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${seo.ga_id}`;
        gaScript.async = true;
        document.head.appendChild(gaScript);
        
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', seo.ga_id);
    }
}

function applyAppearance(appearance, mobile = {}) {
    if (appearance.primary_color) {
        document.documentElement.style.setProperty('--primary', appearance.primary_color);
    }
    if (appearance.bg_color) {
        document.documentElement.style.setProperty('--bg-main', appearance.bg_color);
    }
    if (appearance.heading_font) {
        document.documentElement.style.setProperty('--font-heading', appearance.heading_font);
    }

    // Mobile Specifics (Applied if screen is small)
    if (window.innerWidth <= 768) {
        if (mobile.hero_height) {
            document.documentElement.style.setProperty('--mobile-hero-h', `${mobile.hero_height}vh`);
        }
        if (mobile.section_padding) {
            document.documentElement.style.setProperty('--mobile-padding', `${mobile.section_padding}px`);
        }
        if (mobile.h1_size) {
            document.documentElement.style.setProperty('--mobile-h1', `${mobile.h1_size}rem`);
        }
        if (mobile.p_size) {
            document.documentElement.style.setProperty('--mobile-p', `${mobile.p_size}rem`);
        }
    }
}


function updateServices(services) {
    const grid = document.querySelector('.services-grid');
    if (!grid || !services || services.length === 0) return;
    grid.innerHTML = '';
    services.forEach(s => {
        // Support both field names (title = new standard, name = legacy)
        const title = s.title || s.name || '';
        grid.innerHTML += `
            <div class="service-card spotlight-card reveal visible">
                <span class="service-emoji">${s.icon || ''}</span>
                <div class="service-name">${title}</div>
                <p class="service-desc">${s.desc || ''}</p>
            </div>
        `;
    });
}

function updatePricing(pricing) {
    const grid = document.querySelector('.pricing-grid');
    if (!grid || !pricing || pricing.length === 0) return;
    grid.innerHTML = '';
    pricing.forEach((p, i) => {
        // Support both field names (title = new standard, name = legacy)
        const title = p.title || p.name || 'Plan';

        // Normalise features — might be array, newline-string, or missing
        let feats = [];
        if (Array.isArray(p.features)) {
            feats = p.features.filter(Boolean);
        } else if (typeof p.features === 'string' && p.features.trim()) {
            feats = p.features.split('\n').map(f => f.trim()).filter(Boolean);
        }

        const featuresHtml = feats.map(f => `<li><span class="check">✓</span> ${f}</li>`).join('');
        
        let priceHtml = p.price || '';
        const priceMatch = priceHtml.match(/^([^\/]+)(\s*\/\s*.*)$/i);
        if (priceMatch) {
            priceHtml = `<span class="price-main">${priceMatch[1]}</span><span class="price-period">${priceMatch[2]}</span>`;
        } else {
            priceHtml = `<span class="price-main">${priceHtml}</span>`;
        }

        const isPopular = (pricing.length === 3 && i === 1) || (pricing.length === 2 && i === 1) || title.toLowerCase().includes('pro');
        const popularBadge = isPopular ? `<div class="popular-badge">RECOMMENDED</div>` : '';
        const popularClass = isPopular ? 'popular-plan' : '';
        const btnClass = isPopular ? 'btn-primary' : 'btn-dark';

        grid.innerHTML += `
            <div class="pricing-card spotlight-card reveal visible ${popularClass}">
                ${popularBadge}
                <div class="p-tier">${title}</div>
                <div class="p-price">${priceHtml}</div>
                <p class="p-desc">${p.desc || ''}</p>
                <div class="p-features-container">
                    <ul class="p-features">${featuresHtml}</ul>
                </div>
                <a href="contact.html" class="${btnClass} magnetic" style="width:100%; display:block; text-align:center;">Get Started</a>
            </div>
        `;
    });
}

function updateFounders(founders) {
    const grid = document.querySelector('.creators-grid');
    if (!grid) return;

    // Default fallback team if API returns nothing
    const defaultFounders = [
        { name: 'Tanmay Kadu' },
        { name: 'Kunal Patle' },
        { name: 'Yashraj Ghuge' },
        { name: 'Atharv Kamble' },
        { name: 'Harsh Tiwari' }
    ];
    const team = founders && founders.length > 0 ? founders : defaultFounders;

    // Split into rows of 3 and 2
    grid.innerHTML = '';
    const chunkSize = 3;
    for (let i = 0; i < team.length; i += chunkSize) {
        const row = document.createElement('div');
        row.className = 'creators-row';
        const chunk = team.slice(i, i + chunkSize);
        chunk.forEach((f, j) => {
            row.innerHTML += `
                <div class="creator-box reveal visible" style="transition-delay: ${(i + j) * 0.1}s;">
                    <div class="creator-name">${f.name}</div>
                    ${f.role ? `<div style="font-size:13px; color:#888; margin-top:4px;">${f.role}</div>` : ''}
                </div>
            `;
        });
        grid.appendChild(row);
    }
}

function updateTestimonials(reviews) {
    const grid = document.getElementById('testimonialsGrid');
    const section = document.getElementById('testimonialsSection');
    
    if (!grid || !section) return;
    
    if (!reviews || reviews.length === 0) {
        section.style.display = 'none'; // hide empty cards and shrink spacing
        return;
    }
    
    section.style.display = 'block';
    grid.innerHTML = '';
    
    reviews.forEach(r => {
        let starsHtml = '';
        for (let i = 0; i < 5; i++) {
            starsHtml += i < r.rating ? '<span class="star filled">★</span>' : '<span class="star">☆</span>';
        }
        
        const avatarHtml = r.image 
            ? `<img src="${r.image}" alt="${r.name}" class="test-avatar-img">`
            : `<div class="test-avatar-fallback">${r.name ? r.name[0] : '?'}</div>`;
            
        grid.innerHTML += `
            <div class="testimonial-card reveal visible">
                <div class="test-rating">${starsHtml}</div>
                <div class="test-quote">"${r.text}"</div>
                <div class="test-author-box">
                    <div class="test-avatar">${avatarHtml}</div>
                    <div class="test-author">
                        <div class="test-name">${r.name}</div>
                        <div class="test-role">${r.role}</div>
                    </div>
                </div>
            </div>
        `;
    });
}

// ... existing helper functions (initCursor, initNavbar, etc.) remains same ...

// === CUSTOM CURSOR ===
function initCursor() {
    const cursor = document.getElementById('cursor');
    if (!cursor) return;
    
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) {
        cursor.style.display = 'none';
        return;
    }

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const trailCount = 8;
    const trails = [];
    for (let i = 0; i < trailCount; i++) {
        const dot = document.createElement('div');
        dot.className = 'cursor-trail';
        document.body.appendChild(dot);
        trails.push({ x: mouseX, y: mouseY, el: dot });
    }

    let rotation = 0;

    function renderCursor() {
        const dx = mouseX - cursorX;
        const dy = mouseY - cursorY;
        cursorX += dx * 0.35;
        cursorY += dy * 0.35;

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
            const targetRotation = Math.atan2(dy, dx) * 180 / Math.PI + 45;
            let dRotation = targetRotation - rotation;
            if (dRotation > 180) dRotation -= 360;
            if (dRotation < -180) dRotation += 360;
            rotation += dRotation * 0.15;
        }

        cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%) rotate(${rotation}deg)`;

        trails[0].x = cursorX;
        trails[0].y = cursorY;
        for (let i = 1; i < trailCount; i++) {
            trails[i].x += (trails[i - 1].x - trails[i].x) * 0.4;
            trails[i].y += (trails[i - 1].y - trails[i].y) * 0.4;
        }
        trails.forEach((trail, i) => {
            trail.el.style.transform = `translate3d(${trail.x}px, ${trail.y}px, 0) translate(-50%, -50%)`;
            trail.el.style.opacity = 1 - (i / trailCount);
            trail.el.style.transform += ` scale(${1 - (i / trailCount) * 0.5})`;
        });

        requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    document.addEventListener('mouseover', (e) => {
        if (e.target.closest('a, button, .magnetic, .port-card, .service-card, .building-card, .testimonial-card')) {
            cursor.classList.add('hovered');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest('a, button, .magnetic, .port-card, .service-card, .building-card, .testimonial-card')) {
            cursor.classList.remove('hovered');
        }
    });
}

// === NAVBAR & MOBILE MENU ===
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const navOverlay = document.getElementById('navOverlay');

    if (hamburger && mobileNav) {
        const toggleMenu = () => {
            const isOpen = mobileNav.classList.contains('open');
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        };

        const openMenu = () => {
            hamburger.classList.add('open');
            mobileNav.classList.add('open');
            if (navOverlay) navOverlay.classList.add('open');
            document.body.style.overflow = 'hidden';
        };

        const closeMenu = () => {
            hamburger.classList.remove('open');
            mobileNav.classList.remove('open');
            if (navOverlay) navOverlay.classList.remove('open');
            document.body.style.overflow = 'auto';
        };

        hamburger.addEventListener('click', toggleMenu);

        if (navOverlay) {
            navOverlay.addEventListener('click', closeMenu);
        }

        const mobileLinks = mobileNav.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // Close on Esc key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });
    }

    // Throttled scroll listener using rAF — prevents layout thrashing
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                if (window.scrollY > 50) {
                    navbar.classList.add('scrolled');
                } else {
                    navbar.classList.remove('scrolled');
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}

// === SCROLL REVEAL ===
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    if (!reveals.length) return;
    const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(r => obs.observe(r));
}

// === MAGNETIC ELEMENTS ===
function initMagnetic() {
    // Skip entirely on touch devices — no hover to respond to
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) return;

    const magneticElements = document.querySelectorAll('.magnetic');
    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        }, { passive: true });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'translate(0, 0)';
        });
    });
}

// === SPOTLIGHT EFFECT ===
// === SPOTLIGHT EFFECT (desktop only) ===
if (!('ontouchstart' in window) && navigator.maxTouchPoints === 0) {
    document.querySelectorAll('.spotlight-card').forEach(card => {
        card.onmousemove = e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        };
    });
}
// === LIGHTBOX VIDEO PLAYER ===
window.openLightbox = function(videoSrc) {
    let modal = document.getElementById('videoLightbox');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'lightbox-modal';
        modal.id = 'videoLightbox';
        modal.innerHTML = `
            <div class="lightbox-content">
                <div class="lightbox-close" id="lightboxClose">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </div>
                <video id="lightboxVideo" class="lightbox-video" controls playsinline></video>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('#lightboxClose').addEventListener('click', closeLightbox);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeLightbox();
        });
    }
    
    const vid = modal.querySelector('#lightboxVideo');
    vid.src = videoSrc;
    modal.classList.add('active');
    vid.play().catch(() => {});
};

window.closeLightbox = function() {
    const modal = document.getElementById('videoLightbox');
    if (modal) {
        modal.classList.remove('active');
        const vid = modal.querySelector('#lightboxVideo');
        if (vid) {
            vid.pause();
            vid.src = '';
        }
    }
};
