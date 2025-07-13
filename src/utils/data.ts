// src/utils/data.ts
import videosData from '../data/videos.json';

export interface VideoData {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  thumbnailWidth: number;
  thumbnailHeight: number;
  datePublished?: string;
  dateModified?: string;
  embedUrl: string;
  tags: string;
  previewUrl?: string;
  duration?: string;
}

export async function getAllVideos(): Promise<VideoData[]> {
  console.log(`[getAllVideos] Data video dimuat. Total video: ${videosData.length}`);
  return videosData as VideoData[];
}
