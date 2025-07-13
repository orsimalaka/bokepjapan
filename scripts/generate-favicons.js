// scripts/generate-favicons.js
import favicons from 'favicons';
import fs from 'fs/promises';
import path from 'path';
import { desk, nama, url } from '../src/utils/site.js';

const SOURCE_IMAGE = 'public/favicon.svg';
const OUTPUT_DIR = 'public/';

async function generateFavicons() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const configuration = {
      path: `${url}/`,
      appName: nama,
      appDescription: desk,
      developerName: nama,
      developerURL: url,
      background: '#ffffff',
      theme_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      version: '1.0',
      logging: true,
      pipeHTML: true,
      pixel_art: false,
      icons: {
        android: true,
        appleIcon: true,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: false,
        windows: false,
        yandex: false
      }
    };

    console.log('Generating favicons...');
    const response = await favicons(SOURCE_IMAGE, configuration);

    for (const image of response.images) {
      await fs.writeFile(path.join(OUTPUT_DIR, image.name), image.contents);
    }

    for (const file of response.files) {
      await fs.writeFile(path.join(OUTPUT_DIR, file.name), file.contents);
    }

    const htmlTags = response.html.join('\n');
    console.log('\nFavicon HTML tags (paste into your <head>):\n');
    console.log(htmlTags);
    await fs.writeFile('src/components/FaviconTags.astro', htmlTags);

    console.log('\nFavicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

generateFavicons();