// scripts/download-images.mjs
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

const pages = JSON.parse(fs.readFileSync('./data/pages-export.json', 'utf8'));
const OUT_DIR = './public/images/uploads';

fs.mkdirSync(OUT_DIR, { recursive: true });

function download(url, dest) {
    return new Promise((resolve, reject) => {
        if (!url) return resolve(null);

        // Skip if already downloaded
        if (fs.existsSync(dest)) {
            console.log(`⏭ Already exists, skipping: ${path.basename(dest)}`);
            return resolve(dest);
        }

        const client = url.startsWith('https') ? https : http;
        const file = fs.createWriteStream(dest);

        client.get(url, (res) => {
            // Follow redirects
            if (res.statusCode === 301 || res.statusCode === 302) {
                file.close();
                fs.unlinkSync(dest);
                return download(res.headers.location, dest).then(resolve).catch(reject);
            }

            if (res.statusCode !== 200) {
                file.close();
                fs.unlinkSync(dest);
                console.log(`⚠ Skipped (HTTP ${res.statusCode}): ${url}`);
                return resolve(null);
            }

            res.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(dest);
            });
        }).on('error', (err) => {
            file.close();
            if (fs.existsSync(dest)) fs.unlinkSync(dest);
            console.log(`✗ Error: ${url} — ${err.message}`);
            resolve(null); // resolve not reject so script continues
        });
    });
}

async function run() {
    const withImages = pages.filter(p => p.featured_image);
    console.log(`\n📦 Found ${withImages.length} pages with featured images\n`);

    let success = 0;
    let skipped = 0;
    let failed  = 0;

    for (let i = 0; i < withImages.length; i++) {
        const page = withImages[i];
        const url  = page.featured_image;

        try {
            const urlObj   = new URL(url);
            const ext      = path.extname(urlObj.pathname) || '.jpg';
            const filename = `${page.id}${ext}`;
            const dest     = path.join(OUT_DIR, filename);

            process.stdout.write(`[${i + 1}/${withImages.length}] ${page.title} → `);

            const result = await download(url, dest);

            if (result) {
                console.log(`✓ ${filename}`);
                success++;
            } else {
                skipped++;
            }
        } catch (err) {
            console.log(`✗ Failed: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n✅ Done!`);
    console.log(`   Downloaded : ${success}`);
    console.log(`   Skipped    : ${skipped}`);
    console.log(`   Failed     : ${failed}`);
    console.log(`\n📁 Images saved to: ${OUT_DIR}\n`);
}

run();