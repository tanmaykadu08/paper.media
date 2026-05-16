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

    // Show loading skeletons on dynamic grids
    showLoadingState('.services-grid');
    showLoadingState('.portfolio-grid', '#featuredPortfolio');
    showLoadingState('.testimonials-grid', '#testimonialsGrid');
    showLoadingState('.pricing-grid');
    showLoadingState('.creators-grid');

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

        // --- Services (home + services.html) ---
        if (isHome || path.includes('services.html')) {
            const services = Array.isArray(content.services) ? content.services : [];
            updateServices(services);
        }

        // --- Portfolio (home featured + full portfolio page) ---
        if (portData && typeof loadFeatured === 'function') {
            loadFeatured(portData.items || []);
        }

        // --- Testimonials (home only) ---
        if (isHome) {
            const reviews = Array.isArray(content.reviews) ? content.reviews : [];
            updateTestimonials(reviews);
        }

        // --- Pricing ---
        if (path.includes('pricing.html')) {
            const pricing = Array.isArray(content.pricing) ? content.pricing : [];
            updatePricing(pricing);
        }

        // --- Founders / About ---
        if (path.includes('about.html')) {
            const founders = Array.isArray(content.founders) ? content.founders : [];
            updateFounders(founders);
            const aboutIntro = document.querySelector('.creators-intro');
            if (aboutIntro && content.founders_intro) aboutIntro.innerHTML = content.founders_intro;
        }

    } catch (err) {
        console.error('CMS load error:', err);
        // Clear loading states gracefully
        clearLoadingStates();
    }
}

function showLoadingState(...selectors) {
    selectors.forEach(sel => {
        const el = document.querySelector(sel);
        if (el && el.children.length === 0) {
            el.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:40px; color:#aaa; font-size:14px;">Loading...</div>`;
        }
    });
}

function clearLoadingStates() {
    ['.services-grid', '.portfolio-grid', '#featuredPortfolio', '.testimonials-grid', '#testimonialsGrid', '.pricing-grid', '.creators-grid']
        .forEach(sel => {
            const el = document.querySelector(sel);
            if (el && el.querySelector('[style*="Loading"]')) el.innerHTML = '';
        });
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

