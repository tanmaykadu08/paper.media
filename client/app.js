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
    try {
        // Fetch real-time data from Cloudflare Worker + Turso
        const res = await fetch(`${API_BASE}/content?v=${Date.now()}`);
        const data = await res.json();
        const content = data.content || {};

        // 1. Populate Announcement Banner
        updateBanner(content.homepage || {});

        // 2. Populate Hero (if on home page)
        updateHero(content.homepage || {});

        // 3. Populate Site Settings (Logo, Socials)
        updateSettings(content);
        
        // 3.5. Inject SEO, Schema, Canonical, and GA
        injectSEO(content);

        // 4. Apply Appearance Settings
        applyAppearance(content.appearance || {}, content.mobile || {});

        // 5. Page Specific Data
        const path = window.location.pathname;
        const isHome = path === '/' || path.endsWith('index.html');

        if (path.includes('portfolio.html') || isHome) {
            if (typeof loadFeatured === 'function') {
                // Fetch portfolio from DB
                const portRes = await fetch(`${API_BASE}/portfolio?featured=${isHome ? '1' : '0'}`);
                const portData = await portRes.json();
                loadFeatured(portData.items || []);
            }
        } 
        
        if (path.includes('services.html') || isHome) {
            if (typeof updateServices === 'function') updateServices(content.services || []);
        }
        
        if (isHome) {
            const reviewsRaw = localStorage.getItem('papermedia_reviews');
            const reviewsData = reviewsRaw ? JSON.parse(reviewsRaw) : [];
            updateTestimonials(reviewsData);
        }

        if (path.includes('pricing.html')) {
            if (typeof updatePricing === 'function') updatePricing(content.pricing || []);
        } 

        if (path.includes('about.html')) {
            if (typeof updateFounders === 'function') updateFounders(content.founders || []);
            const aboutTitle = document.querySelector('.cinematic-title');
            if (aboutTitle && content.founders_intro) aboutTitle.innerHTML = content.founders_intro;
        }

    } catch (err) {
        console.error('Error loading site data:', err);
    }
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
    const sub = document.getElementById('client-hero_sub');
    const ctaPrimary = document.getElementById('client-hero_cta_primary');
    
    if (title && content.hero_title) title.innerHTML = content.hero_title;
    if (sub && content.hero_sub) sub.innerHTML = content.hero_sub;
    if (ctaPrimary && content.hero_cta_text) ctaPrimary.innerText = content.hero_cta_text;
    if (ctaPrimary && content.hero_cta_link) ctaPrimary.href = content.hero_cta_link;

    // Stats
    if (content.stats) {
        const statsContainers = document.querySelectorAll('.hstat, .hero-card');
        content.stats.slice(0, 4).forEach((stat, i) => {
            if (statsContainers[i]) {
                const numEl = statsContainers[i].querySelector('.hstat-num, .hero-card-num');
                const labelEl = statsContainers[i].querySelector('.hstat-label, .hero-card-label');
                if (numEl) numEl.innerText = stat.value;
                if (labelEl) labelEl.innerText = stat.label;
            }
        });
    }
}

function updateSettings(content) {
    if (content.logo_url) {
        const logos = document.querySelectorAll('.brand-logo, .footer-logo img');
        logos.forEach(img => img.src = content.logo_url);
    }
    // Update Meta Title
    if (content.meta_title) {
        document.title = content.meta_title;
    }
    // Update socials
    if (content.socials) {
        const whatsapp = document.getElementById('client-contact_whatsapp');
        const ig = document.getElementById('client-contact_ig');
        if (whatsapp && content.socials.whatsapp) whatsapp.href = content.socials.whatsapp;
        if (ig && content.socials.instagram) ig.href = content.socials.instagram;
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
            "logo": content.logo_url || "https://papermedia.co.in/logo.png"
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
        grid.innerHTML += `
            <div class="service-card spotlight-card reveal visible">
                <span class="service-emoji">${s.icon}</span>
                <div class="service-name">${s.title}</div>
                <p class="service-desc">${s.desc}</p>
            </div>
        `;
    });
}

function updatePricing(pricing) {
    const grid = document.querySelector('.pricing-grid');
    if (!grid || !pricing || pricing.length === 0) return;
    grid.innerHTML = '';
    pricing.forEach(p => {
        const featuresHtml = p.features.map(f => `<li><span class="check">✓</span> ${f}</li>`).join('');
        grid.innerHTML += `
            <div class="pricing-card spotlight-card reveal visible">
                <div class="p-tier">${p.title}</div>
                <div class="p-price">${p.price}</div>
                <p class="p-desc">${p.desc}</p>
                <ul class="p-features">${featuresHtml}</ul>
                <a href="contact.html" class="btn-dark magnetic" style="width:100%; display:block; text-align:center;">Get Started</a>
            </div>
        `;
    });
}

function updateFounders(founders) {
    const grid = document.querySelector('.creators-grid');
    if (!grid || !founders || founders.length === 0) return;
    
    grid.innerHTML = '';
    founders.forEach(f => {
        grid.innerHTML += `
            <div class="creator-card reveal visible">
                <img src="${f.image || 'placeholder.jpg'}" alt="${f.name}" class="creator-img" loading="lazy" decoding="async">
                <div class="creator-info">
                    <div class="creator-name">${f.name}</div>
                    <div class="creator-role">${f.role}</div>
                </div>
            </div>
        `;
    });
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

    if (hamburger && mobileNav) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('open');
            mobileNav.classList.toggle('open');
            document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : 'auto';
        });

        const mobileLinks = mobileNav.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('open');
                mobileNav.classList.remove('open');
                document.body.style.overflow = 'auto';
            });
        });

        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
                hamburger.classList.remove('open');
                mobileNav.classList.remove('open');
                document.body.style.overflow = 'auto';
            }
        });
    }

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// === SCROLL REVEAL ===
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    reveals.forEach(r => obs.observe(r));
}

// === MAGNETIC ELEMENTS ===
function initMagnetic() {
    const magneticElements = document.querySelectorAll('.magnetic');
    magneticElements.forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });
        el.addEventListener('mouseleave', () => { 
            el.style.transform = 'translate(0, 0)'; 
        });
    });
}

// === SPOTLIGHT EFFECT ===
const spotlightCards = document.querySelectorAll('.spotlight-card');
if (!isTouch) {
    spotlightCards.forEach(card => {
        card.onmousemove = e => {
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        };
    });
}

