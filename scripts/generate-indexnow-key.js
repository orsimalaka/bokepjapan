// scripts/generate-indexnow-key.js
import fs from 'fs/promises';
import path from 'path';
import { index } from '../src/utils/site.js';

const PUBLIC_DIR = 'public';

async function generateIndexNowKeyFile() {
  const API_KEY_NAME = index;

  if (!API_KEY_NAME || typeof API_KEY_NAME !== 'string' || API_KEY_NAME.length !== 36 || !API_KEY_NAME.includes('-')) {
    console.error('Error: IndexNow API Key (index) tidak valid atau tidak ditemukan.');
    console.warn('Silakan tambahkan UUID yang valid (contoh: export const index = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx";).');
    process.exit(1);
  }

  console.log(`Menggunakan kunci IndexNow ${API_KEY_NAME}`);

  const fileName = `${API_KEY_NAME}.txt`;
  const filePath = path.join(PUBLIC_DIR, fileName);
  const fileContent = API_KEY_NAME;

  try {
    await fs.access(filePath);
    console.log(`File kunci IndexNow sudah ada: ${filePath}`);
    console.log(`Menggunakan kunci yang sudah ada: ${API_KEY_NAME}`);
    return; 
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Kesalahan saat memeriksa keberadaan file kunci: ${error.message}`);
      process.exit(1);
    }
  }

  try {
    await fs.mkdir(PUBLIC_DIR, { recursive: true });
    await fs.writeFile(filePath, fileContent);
    console.log(`Berhasil membuat file kunci IndexNow baru: ${filePath}`);
    console.log(`Isi file: "${fileContent}"`);
  } catch (error) {
    console.error(`Gagal menulis file kunci IndexNow: ${error.message}`);
    process.exit(1);
  }
}

generateIndexNowKeyFile();