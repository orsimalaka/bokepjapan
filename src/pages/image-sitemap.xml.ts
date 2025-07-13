import type { APIRoute } from 'astro';
import { slugify } from '../utils/slugify';
import { getAllVideos, type VideoData } from '../utils/data';
import { terbit, nama } from '../utils/site';

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response('Site URL is not defined in Astro config.', { status: 500 });
  }

  const defaultPublishedDate = terbit || new Date().toISOString();

  let allVideos: VideoData[] = [];
  try {
    allVideos = await getAllVideos();
  } catch (error) {
    console.error("Gagal memuat data video untuk image-sitemap:", error);
    return new Response('Gagal memuat data video untuk sitemap gambar.', { status: 500 });
  }

  const baseUrl = site.href.endsWith('/') ? site.href.slice(0, -1) : site.href;

  let imageEntries: string[] = [];

  const logoUrl = `${baseUrl}/logo.png`;
  imageEntries.push(`
    <url>
      <loc>${baseUrl}/</loc>
      <lastmod>${defaultPublishedDate}</lastmod> <image:image>
        <image:loc>${logoUrl}</image:loc>
        <image:caption>${escapeXml(`Logo ${site.hostname}`)}</image:caption>
        <image:title>${escapeXml(`Logo ${site.hostname}`)}</image:title>
      </image:image>
    </url>
  `);

  allVideos.forEach(video => {
    if (!video.id || !video.title) {
      console.warn(`Melewatkan video untuk sitemap gambar karena ID atau judul hilang: ${video.id || 'N/A'}`);
      return;
    }

    const videoDetailUrl = `${baseUrl}/${slugify(video.title)}-${video.id}/`;
    const thumbnailUrl = video.thumbnail;

    const absoluteThumbnailUrl = thumbnailUrl && (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://'))
      ? thumbnailUrl
      : `${baseUrl}${thumbnailUrl}`;

    const imageCaptionDescription = `Video bokep viral ${video.title} yang terbaru kategori ${video.category} nonton streaming di link ${nama}`;


    if (absoluteThumbnailUrl && videoDetailUrl) {
      const videoLastMod = video.dateModified || video.datePublished || defaultPublishedDate;

      imageEntries.push(`
        <url>
          <loc>${videoDetailUrl}</loc>
          <lastmod>${videoLastMod}</lastmod>
          <image:image>
            <image:loc>${absoluteThumbnailUrl}</image:loc>
            <image:caption>${escapeXml(imageCaptionDescription)}</image:caption>
            <image:title>${escapeXml(video.title)}</image:title>
          </image:image>
        </url>
      `);
    } else {
      console.warn(`Melewatkan thumbnail video untuk sitemap gambar karena URL tidak valid atau hilang: ID ${video.id}`);
    }
  });

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${imageEntries.join('\n  ')}
</urlset>`;

  return new Response(sitemapContent, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};

/**
 * Meng-escape karakter khusus XML dan membersihkan entitas HTML/XML yang tidak lengkap.
 *
 * @param unsafe String yang perlu di-escape.
 * @returns String yang aman untuk XML.
 */
function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';

  let cleaned = unsafe;

  cleaned = cleaned.replace(/&(?!#?\w+;)/g, '&amp;');

  return cleaned.replace(/[<>"']/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
      default: return c;
    }
  });
}