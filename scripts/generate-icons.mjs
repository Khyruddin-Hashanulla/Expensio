import sharp from 'sharp';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svgBuffer = readFileSync(resolve(__dirname, '../client/public/favicon.svg'));

await Promise.all([
  sharp(svgBuffer).resize(192, 192).png().toFile(resolve(__dirname, '../client/public/icon-192.png')),
  sharp(svgBuffer).resize(512, 512).png().toFile(resolve(__dirname, '../client/public/icon-512.png')),
]);

console.log('Icons generated successfully');
