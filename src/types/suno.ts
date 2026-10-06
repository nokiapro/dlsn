export interface SunoTrack {
  id: string;
  title: string;
  artist: string;
  artist_handle?: string;
  audio_url: string;
  video_url: string;
  image_url: string;
  lyrics: string;
  style_tags: string[];
  model_name: string;
  duration: number; // in seconds
  created_at: string;
  play_count?: number;
  upvote_count?: number;
}

export type DownloadFormat = 'mp3' | 'mp4' | 'cover' | 'lyrics_txt' | 'lyrics_lrc' | 'metadata_json';

export interface BatchItem {
  id: string;
  url: string;
  status: 'pending' | 'parsing' | 'ready' | 'downloading' | 'completed' | 'error';
  track?: SunoTrack;
  error?: string;
  progress?: number;
}

export interface HistoryItem {
  track: SunoTrack;
  downloadedAt: string;
  downloadCount: number;
}

export type ActiveTab = 'single' | 'batch' | 'featured' | 'trimmer' | 'history';
