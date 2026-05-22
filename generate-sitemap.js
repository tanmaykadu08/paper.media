import fs from 'fs';
import path from 'path';

// Define the website root URL
const BASE_URL = 'https://papermedia.co.in';

// Define paths
const CLIENT_DIR = path.join(process.cwd(), 'client');
const SITEMAP_PATH = path.join(CLIENT_DIR, 'sitemap.xml');

// Files or directories to ignore
const IGNORE_FILES = ['404.html'];

function generateSitemap() {
    try {
        // Read all files in the client directory
        const files = fs.readdirSync(CLIENT_DIR);
        
        // Filter out non-html files and ignored files
        const htmlFiles = files.filter(file => {
            return file.endsWith('.html') && !IGNORE_FILES.includes(file);
        });

        // Generate URL entries
        let urlsXml = '';
        
        htmlFiles.forEach(file => {
            // For index.html, we just use the root URL
            let loc = file === 'index.html' ? `${BASE_URL}/` : `${BASE_URL}/${file}`;
            
            // Get last modified date of the file
            const stats = fs.statSync(path.join(CLIENT_DIR, file));
            const lastmod = stats.mtime.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            
            // Priority: index.html gets 1.0, others get 0.8
            const priority = file === 'index.html' ? '1.0' : '0.8';

            urlsXml += `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
        });

        // Wrap in the standard sitemap XML structure
        const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlsXml}
</urlset>`;

        // Write the file
        fs.writeFileSync(SITEMAP_PATH, sitemapXml, 'utf8');
        
        console.log(`✅ Successfully generated sitemap with ${htmlFiles.length} pages!`);
        console.log(`📂 Saved to: ${SITEMAP_PATH}`);
        
    } catch (error) {
        console.error('❌ Error generating sitemap:', error.message);
    }
}

// Run the generator
generateSitemap();
