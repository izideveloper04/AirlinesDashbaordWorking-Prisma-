// scripts/fix-image-paths.mjs
import fs from 'fs';
import path from 'path';

const DATA_PATH  = './data/pages-export.json';
const IMAGES_DIR = './public/images/uploads';

const pages = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));

let fixed   = 0;
let missing = 0;

for (const page of pages) {
    if (!page.featured_image) continue;

    // Find the downloaded file by page ID (e.g. 1502.jpg, 1502.png, 1502.webp)
    const files = fs.readdirSync(IMAGES_DIR);
    const match = files.find(f => f.startsWith(`${page.id}.`));

    if (match) {
        page.featuredImageLocal = `/images/uploads/${match}`;
        fixed++;
    } else {
        page.featuredImageLocal = '';  // no image found for this page
        missing++;
    }
}

// Save updated JSON
fs.writeFileSync(DATA_PATH, JSON.stringify(pages, null, 2));

console.log(`\n✅ Done!`);
console.log(`   Fixed   : ${fixed}`);
console.log(`   Missing : ${missing}`);
console.log(`\n📁 pages-export.json updated with correct local image paths\n`);