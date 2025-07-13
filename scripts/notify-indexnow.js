// scripts/notify-indexnow.js
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { index, url } from '../src/utils/site.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function slugify(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

const YOUR_DOMAIN = url;
const API_KEY_NAME = index;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

if (!YOUR_DOMAIN) {
  console.error("Error: PUBLIC_SITE_URL is not defined for IndexNow");
  process.exit(1);
}

if (!API_KEY_NAME) {
    console.error("Error: IndexNow API Key is not defined");
    process.exit(1);
}

const VIDEOS_JSON_PATH = path.resolve(__dirname, '../src/data/videos.json');
const LAST_SENT_URLS_CACHE = path.resolve(__dirname, '../.indexnow_cache.json');

async function getAllVideoUrls() {
  try {
    const fileContent = await fs.readFile(VIDEOS_JSON_PATH, 'utf-8');
    const allVideos = JSON.parse(fileContent);

    if (!Array.isArray(allVideos)) {
      console.error('Data videos.json tidak dalam format array yang diharapkan.');
      return [];
    }

    return allVideos.map(video => {
      const slug = slugify(video.title || 'untitled-video');
      return `${YOUR_DOMAIN}/${slug}-${video.id}/`;
    });
  } catch (error) {
    console.error('Gagal memuat atau memproses videos.json:', error);
    return [];
  }
}

async function sendToIndexNow(urlsToSend, keyName) {
  if (urlsToSend.length === 0) {
    console.log('Tidak ada URL baru atau yang diperbarui untuk dikirim ke IndexNow.');
    return;
  }

  const API_KEY_LOCATION = `${YOUR_DOMAIN}/${keyName}.txt`;
  const chunkSize = 10000;

  for (let i = 0; i < urlsToSend.length; i += chunkSize) {
    const chunk = urlsToSend.slice(i, i + chunkSize);

    const payload = {
      host: new URL(YOUR_DOMAIN).hostname,
      key: keyName,
      keyLocation: API_KEY_LOCATION,
      urlList: chunk,
    };

    try {
      console.log(`Mengirim ${chunk.length} URL ke IndexNow (chunk ${Math.floor(i / chunkSize) + 1})...`);
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`Berhasil mengirim chunk URL ke IndexNow. Status: ${response.status}`);
      } else {
        console.error(`Gagal mengirim chunk URL ke IndexNow: ${response.status} - ${response.statusText}`);
        const errorBody = await response.text();
        console.error('Response body:', errorBody);
      }
    } catch (error) {
      console.error('Terjadi kesalahan saat mengirim ke IndexNow:', error);
    }
  }
}

async function main() {
  if (!API_KEY_NAME || typeof API_KEY_NAME !== 'string' || API_KEY_NAME.length !== 36) {
      console.error("Error: IndexNow API Key is invalid or missing.");
      process.exit(1);
  }
  
  console.log(`Using IndexNow key from site.js: ${API_KEY_NAME}`);

  const currentUrls = await getAllVideoUrls();
  let lastSentUrls = [];

  try {
    const cacheContent = await fs.readFile(LAST_SENT_URLS_CACHE, 'utf-8');
    lastSentUrls = JSON.parse(cacheContent);
  } catch (error) {
    console.log('Cache IndexNow tidak ditemukan atau rusak, akan mengirim semua URL baru.');
  }

  const urlsToSubmit = currentUrls.filter(url => !lastSentUrls.includes(url));

  await sendToIndexNow(urlsToSubmit, API_KEY_NAME);

  try {
    await fs.writeFile(LAST_SENT_URLS_CACHE, JSON.stringify(currentUrls), 'utf-8');
    console.log('Cache IndexNow berhasil diperbarui.');
  } catch (error) {
    console.error('Gagal memperbarui cache IndexNow:', error);
  }
}

main();