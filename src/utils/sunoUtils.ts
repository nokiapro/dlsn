import JSZip from 'jszip';
import { SunoTrack } from '../types/suno';

const UUID_REGEX = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export function extractSunoId(input: string): string | null {
  if (!input) return null;
  const match = input.match(UUID_REGEX);
  if (match) return match[0];
  
  if (input.includes('suno.com')) {
    const parts = input.split('/');
    const last = parts[parts.length - 1]?.split('?')[0];
    if (last && last.length >= 8) return last;
  }
  return null;
}

export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatNumber(num?: number): string {
  if (!num && num !== 0) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

export function generateLrcContent(track: SunoTrack): string {
  const header = `[ti:${track.title}]\n[ar:${track.artist}]\n[al:Suno AI Generation]\n[by:SunoWave Downloader]\n\n`;
  const lines = track.lyrics.split('\n');
  const duration = track.duration || 180;
  const lineDuration = Math.max(2, Math.floor(duration / Math.max(lines.length, 1)));

  let lrcBody = '';
  let currentTime = 5; // start after 5s

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const mins = Math.floor(currentTime / 60);
    const secs = Math.floor(currentTime % 60);
    const timeTag = `[${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.00]`;
    lrcBody += `${timeTag} ${trimmed}\n`;
    currentTime += lineDuration;
  }

  return header + lrcBody;
}

export function getProxyDownloadUrl(fileUrl: string, filename: string, type: 'audio' | 'video' | 'image'): string {
  return `/api/suno/proxy-download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}&type=${type}`;
}

export async function triggerFileDownload(url: string, filename: string): Promise<void> {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function triggerTextDownload(content: string, filename: string, mimeType = 'text/plain;charset=utf-8'): Promise<void> {
  const blob = new Blob([content], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

export async function createTrackZip(track: SunoTrack, onProgress?: (msg: string) => void): Promise<Blob> {
  const zip = new JSZip();
  const safeTitle = track.title.replace(/[^\w\d_\s-]/gi, '').trim() || 'suno_track';
  const folderName = `${safeTitle} - ${track.artist}`.replace(/[^\w\d_\s-]/gi, '').trim();
  const folder = zip.folder(folderName) || zip;

  onProgress?.('Đang chuẩn bị file metadata & lyrics...');

  // 1. Add Lyrics TXT
  folder.file(`${safeTitle}_lyrics.txt`, track.lyrics);

  // 2. Add Lyrics LRC
  folder.file(`${safeTitle}.lrc`, generateLrcContent(track));

  // 3. Add Metadata JSON
  const metadata = {
    title: track.title,
    artist: track.artist,
    artist_handle: track.artist_handle,
    suno_id: track.id,
    model: track.model_name,
    duration_seconds: track.duration,
    style_tags: track.style_tags,
    prompt_and_lyrics: track.lyrics,
    audio_source: track.audio_url,
    video_source: track.video_url,
    exported_at: new Date().toISOString(),
    tool: 'SunoWave Music Downloader'
  };
  folder.file(`${safeTitle}_metadata.json`, JSON.stringify(metadata, null, 2));

  // 4. Download Audio
  try {
    const audioExt = track.audio_url.endsWith('.m4a') ? 'm4a' : 'mp3';
    onProgress?.(`Đang tải file âm thanh gốc (${audioExt.toUpperCase()})...`);
    const audioResp = await fetch(getProxyDownloadUrl(track.audio_url, `${safeTitle}.${audioExt}`, 'audio'));
    if (audioResp.ok) {
      const audioBlob = await audioResp.blob();
      folder.file(`${safeTitle}.${audioExt}`, audioBlob);
    }
  } catch (err) {
    console.error('Failed to include audio in zip:', err);
  }

  // 5. Download Cover Image
  if (track.image_url) {
    try {
      onProgress?.('Đang tải ảnh bìa gốc HD...');
      const imgResp = await fetch(getProxyDownloadUrl(track.image_url, `${safeTitle}_cover.jpg`, 'image'));
      if (imgResp.ok) {
        const imgBlob = await imgResp.blob();
        folder.file(`${safeTitle}_cover.jpg`, imgBlob);
      }
    } catch (err) {
      console.error('Failed to include cover in zip:', err);
    }
  }

  onProgress?.('Đang nén dữ liệu thành file ZIP...');
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return zipBlob;
}
