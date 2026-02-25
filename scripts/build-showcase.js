import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const publicDir = path.resolve('public');

// Ensure dist directory exists and is empty
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir);

// Copy localized index files
const filesToCopy = ['index.html', 'index_en.html', 'index_ja.html'];
filesToCopy.forEach(file => {
    const src = path.resolve(file);
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(distDir, file));
    }
});

// Copy public directory contents to dist root
if (fs.existsSync(publicDir)) {
    const files = fs.readdirSync(publicDir);
    for (const file of files) {
        const src = path.join(publicDir, file);
        const dest = path.join(distDir, file);
        if (fs.lstatSync(src).isDirectory()) {
            fs.cpSync(src, dest, { recursive: true });
        } else {
            fs.copyFileSync(src, dest);
        }
    }
}

console.log('Showcase site built successfully in dist/');
