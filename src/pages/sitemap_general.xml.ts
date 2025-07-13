// src/pages/sitemap_general.xml.ts
import type { APIRoute } from 'astro';
import { slugify } from '../utils/slugify';
import { getAllVideos } from '../utils/data';

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response('Site URL is not defined in Astro config.', { status: 500 });
  }

  const allVideos = await getAllVideos();
  const baseUrl = site.href.endsWith('/') ? site.href.slice(0, -1) : site.href;

  let urls: string[] = [];

  urls.push(`<url><loc>${baseUrl}/</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/category/</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);
  urls.push(`<url><loc>${baseUrl}/tags/</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`);

  allVideos.forEach(video => {
    const videoDetailUrl = `${baseUrl}/${slugify(video.title)}-${video.id}/`;
    const lastMod = video.dateModified || video.datePublished || new Date().toISOString();
    urls.push(`<url><loc>${videoDetailUrl}</loc><lastmod>${lastMod}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`);
  });

  const categories = new Set(allVideos.map(video => video.category));
  categories.forEach(category => {
    const categorySlug = slugify(category);
    urls.push(`<url><loc>${baseUrl}/category/${categorySlug}/</loc><lastmod>${new Date().toISOString()}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`);
  });

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join('\n  ')}
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