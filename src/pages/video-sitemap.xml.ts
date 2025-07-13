// src/pages/video-sitemap.xml.ts
import type { APIRoute } from 'astro';
import { slugify } from '../utils/slugify';
import { getAllVideos, type VideoData } from '../utils/data';
import { nama, terbit } from '../utils/site';

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response('Site URL is not defined in Astro config.', { status: 500 });
  }

  const defaultPublishedDate = terbit || new Date().toISOString();

  let allVideos: VideoData[] = [];
  try {
    allVideos = await getAllVideos();
  } catch (error) {
    console.error("Gagal memuat data video untuk video-sitemap:", error);
    return new Response('Gagal memuat data video untuk sitemap.', { status: 500 });
  }

  const baseUrl = site.href.endsWith('/') ? site.href.slice(0, -1) : site.href;

  let videoEntries: string[] = [];

  allVideos.forEach(video => {
    if (!video.id) {
      console.warn(`Melewatkan video tanpa ID untuk sitemap: ${video.title || 'Unknown Title'}`);
      return;
    }

    const videoDetailUrl = `${baseUrl}/${slugify(video.title)}-${video.id}/`;
    const thumbnailUrl = video.thumbnail;
    const embedUrl = video.embedUrl;

    const absoluteThumbnailUrl = thumbnailUrl && (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) ? thumbnailUrl : `${baseUrl}${thumbnailUrl}`;
    const absoluteEmbedUrl = embedUrl && (embedUrl.startsWith('http://') || embedUrl.startsWith('https://')) ? embedUrl : `${baseUrl}${embedUrl}`;

    const durationInSeconds = parseDurationStringToSeconds(video.duration);
    const videoPublishedDate = video.datePublished || defaultPublishedDate;
    const videoModifiedDate = video.dateModified || videoPublishedDate;

    const videoTitleForSitemap = video.title || 'Video';
    const videoDescriptionForSitemap = `Video bokep viral ${videoTitleForSitemap} yang terbaru nonton streaming di link ${nama}`;

    if (videoTitleForSitemap && videoDescriptionForSitemap && absoluteThumbnailUrl && absoluteEmbedUrl) {
      videoEntries.push(`
        <url>
          <loc>${videoDetailUrl}</loc>
          <lastmod>${videoModifiedDate}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
          <video:video>
            <video:thumbnail_loc>${absoluteThumbnailUrl}</video:thumbnail_loc>
            <video:title>${escapeXml(videoTitleForSitemap)}</video:title>
            <video:description>${escapeXml(videoDescriptionForSitemap)}</video:description>
            <video:content_loc>${absoluteEmbedUrl}</video:content_loc>
            <video:duration>${durationInSeconds}</video:duration>
            <video:publication_date>${videoPublishedDate}</video:publication_date>
            </video:video>
        </url>
      `);
    } else {
      console.warn(`Melewatkan video untuk sitemap karena data wajib hilang: ID ${video.id || 'N/A'} (Deskripsi: ${videoDescriptionForSitemap})`);
    }
  });

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${videoEntries.join('\n  ')}
</urlset>`;

  return new Response(sitemapContent, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
};

/**
 * Mengurai string durasi (misal: "120", "1:30", "01:30") menjadi jumlah detik.
 * Mengembalikan 26 jika tidak dapat diurai.
 * @param durationString String durasi dari data video.
 * @returns Durasi dalam detik (number).
 */
function parseDurationStringToSeconds(durationString: string | undefined): number {
    if (!durationString) {
        return 26;
    }

    const num = parseInt(durationString, 10);
    if (!isNaN(num)) {
        return num;
    }

    const parts = durationString.split(':');
    if (parts.length === 2) {
        const minutes = parseInt(parts[0], 10);
        const seconds = parseInt(parts[1], 10);
        if (!isNaN(minutes) && !isNaN(seconds)) {
            return (minutes * 60) + seconds;
        }
    }

    if (parts.length === 3) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        const seconds = parseInt(parts[2], 10);
        if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
            return (hours * 3600) + (minutes * 60) + seconds;
        }
    }

    return 26;
}


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