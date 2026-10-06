import React, { useState } from 'react';
import { SunoTrack } from '../types/suno';
import { 
  formatTime, 
  formatNumber, 
  getProxyDownloadUrl, 
  triggerFileDownload, 
  triggerTextDownload, 
  generateLrcContent, 
  createTrackZip 
} from '../utils/sunoUtils';
import { AudioPlayer } from './AudioPlayer';
import { 
  Download, 
  Music, 
  Video, 
  Image as ImageIcon, 
  FileText, 
  Code, 
  Archive, 
  Copy, 
  Check, 
  ExternalLink,
  Sparkles,
  Share2,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface TrackCardProps {
  track: SunoTrack;
  lang: 'vi' | 'en';
  onTrackAction?: (track: SunoTrack) => void;
}

export const TrackCard: React.FC<TrackCardProps> = ({ track, lang, onTrackAction }) => {
  const [activeTab, setActiveTab] = useState<'lyrics' | 'prompt' | 'details'>('lyrics');
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [zipStatus, setZipStatus] = useState<string>('');
  const [imgError, setImgError] = useState(false);

  const t = {
    vi: {
      downloadMp3: 'Tải MP3 320kbps',
      downloadMp4: 'Tải Video MP4',
      downloadCover: 'Tải Ảnh Bìa HD',
      downloadLrc: 'Tải Lời LRC',
      downloadTxt: 'Tải Lời TXT',
      downloadJson: 'Tải Metadata JSON',
      downloadZip: 'Tải Trọn Bộ ZIP',
      lyricsTab: 'Lời Bài Hát',
      promptTab: 'Prompt & Thể Loại',
      detailsTab: 'Thông Số Kỹ Thuật',
      copied: 'Đã sao chép!',
      copyLyrics: 'Sao chép lời',
      copyPrompt: 'Sao chép prompt',
      openSuno: 'Mở trên Suno',
      modelVer: 'Mô hình',
      duration: 'Thời lượng',
      views: 'Lượt nghe',
      likes: 'Yêu thích',
      date: 'Ngày tạo',
    },
    en: {
      downloadMp3: 'Download MP3 320kbps',
      downloadMp4: 'Download MP4 Video',
      downloadCover: 'Download HD Cover',
      downloadLrc: 'Download LRC Lyrics',
      downloadTxt: 'Download TXT Lyrics',
      downloadJson: 'Download Metadata JSON',
      downloadZip: 'Download All (ZIP)',
      lyricsTab: 'Lyrics',
      promptTab: 'Prompt & Style',
      detailsTab: 'Tech Details',
      copied: 'Copied!',
      copyLyrics: 'Copy Lyrics',
      copyPrompt: 'Copy Prompt',
      openSuno: 'Open on Suno',
      modelVer: 'Model',
      duration: 'Duration',
      views: 'Plays',
      likes: 'Upvotes',
      date: 'Created',
    },
  }[lang];

  const safeFilename = (track.title || 'suno_track').replace(/[^\w\d_.-]/gi, '_');

  const [downloadingFormat, setDownloadingFormat] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadFormat = async (format: 'mp3' | 'wav' | 'm4a') => {
    onTrackAction?.(track);
    setDownloadingFormat(format);
    setDownloadError(null);
    try {
      const ext = format;
      const downloadUrl = `/api/suno/proxy-download?id=${encodeURIComponent(track.id)}&url=${encodeURIComponent(track.audio_url)}&filename=${encodeURIComponent(safeFilename)}.${ext}&format=${format}`;
      await triggerFileDownload(downloadUrl, `${safeFilename}.${ext}`);
    } catch (err: any) {
      setDownloadError(err.message || `Lỗi khi tải định dạng ${format.toUpperCase()}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  const handleDownloadMp3 = () => handleDownloadFormat('mp3');
  const handleDownloadWav = () => handleDownloadFormat('wav');
  const handleDownloadM4a = () => handleDownloadFormat('m4a');

  const handleDownloadMp4 = () => {
    onTrackAction?.(track);
    const downloadUrl = getProxyDownloadUrl(track.video_url, `${safeFilename}.mp4`, 'video');
    triggerFileDownload(downloadUrl, `${safeFilename}.mp4`);
  };

  const handleDownloadCover = () => {
    const downloadUrl = getProxyDownloadUrl(track.image_url, `${safeFilename}_cover.jpg`, 'image');
    triggerFileDownload(downloadUrl, `${safeFilename}_cover.jpg`);
  };

  const handleDownloadLrc = () => {
    const lrc = generateLrcContent(track);
    triggerTextDownload(lrc, `${safeFilename}.lrc`, 'text/plain;charset=utf-8');
  };

  const handleDownloadTxt = () => {
    triggerTextDownload(track.lyrics, `${safeFilename}_lyrics.txt`, 'text/plain;charset=utf-8');
  };

  const handleDownloadJson = () => {
    const metadata = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      model_name: track.model_name,
      style_tags: track.style_tags,
      duration_seconds: track.duration,
      lyrics_prompt: track.lyrics,
      audio_url: track.audio_url,
      video_url: track.video_url,
      cover_url: track.image_url,
      created_at: track.created_at,
    };
    triggerTextDownload(JSON.stringify(metadata, null, 2), `${safeFilename}_meta.json`, 'application/json');
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      setZipStatus('Đang khởi tạo gói ZIP...');
      onTrackAction?.(track);
      const zipBlob = await createTrackZip(track, (msg) => setZipStatus(msg));
      const blobUrl = URL.createObjectURL(zipBlob);
      triggerFileDownload(blobUrl, `${safeFilename}_FullBundle.zip`);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
    } catch (err) {
      console.error('ZIP failed:', err);
    } finally {
      setIsZipping(false);
      setZipStatus('');
    }
  };

  const handleCopy = (text: string, type: 'lyrics' | 'prompt') => {
    navigator.clipboard.writeText(text);
    if (type === 'lyrics') {
      setCopiedLyrics(true);
      setTimeout(() => setCopiedLyrics(false), 2000);
    } else {
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    }
  };

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl transition-all">
      
      {/* Top Banner / Cover Header */}
      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start">
        
        {/* Cover Art Container */}
        <div className="relative w-full md:w-56 h-56 shrink-0 rounded-xl overflow-hidden bg-neutral-950 border border-neutral-800 group shadow-lg">
          {!imgError && track.image_url ? (
            <img
              src={track.image_url}
              alt={track.title}
              onError={() => setImgError(true)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-neutral-900 to-neutral-950 text-neutral-500">
              <Music className="w-12 h-12 mb-2 text-amber-500/40" />
              <span className="text-xs text-center font-medium">Suno Art Master</span>
            </div>
          )}

          {/* Quick Hover Download Cover */}
          <button
            onClick={handleDownloadCover}
            className="absolute bottom-2 right-2 p-2 bg-neutral-900/90 hover:bg-neutral-800 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-neutral-700/80 cursor-pointer shadow-md"
            title={t.downloadCover}
          >
            <ImageIcon className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Track Info & Unboxed Metadata */}
        <div className="flex-1 flex flex-col justify-between w-full min-w-0">
          <div>
            {/* Title */}
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight break-words mb-1.5">
              {track.title}
            </h2>

            {/* Artist & Profile */}
            <div className="flex items-center gap-2 text-sm text-neutral-300 mb-3">
              <span className="font-semibold text-amber-400">{track.artist}</span>
              {track.artist_handle && (
                <span className="text-neutral-500 font-mono text-xs">{track.artist_handle}</span>
              )}
              <span className="text-neutral-600">·</span>
              <a
                href={`https://suno.com/song/${track.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-amber-400 transition-colors"
              >
                <span>{t.openSuno}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Zero-Pill Static Metadata: Clean unboxed text with typographic separators */}
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-neutral-400 mb-4">
              <span>{t.modelVer}: <strong className="text-neutral-200 font-medium">{track.model_name}</strong></span>
              <span className="text-neutral-600" aria-hidden="true">·</span>
              <span>{t.duration}: <strong className="text-neutral-200 font-mono tabular-nums">{formatTime(track.duration)}</strong></span>
              {track.play_count !== undefined && (
                <>
                  <span className="text-neutral-600" aria-hidden="true">·</span>
                  <span>{t.views}: <strong className="text-neutral-200 font-mono tabular-nums">{formatNumber(track.play_count)}</strong></span>
                </>
              )}
              {track.upvote_count !== undefined && (
                <>
                  <span className="text-neutral-600" aria-hidden="true">·</span>
                  <span>{t.likes}: <strong className="text-neutral-200 font-mono tabular-nums">{formatNumber(track.upvote_count)}</strong></span>
                </>
              )}
            </div>

            {/* Style Tags (Zero-Pill format: clean delimited list) */}
            {track.style_tags && track.style_tags.length > 0 && (
              <div className="text-xs text-neutral-400 mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-neutral-500">Style:</span>
                {track.style_tags.map((tag, idx) => (
                  <React.Fragment key={idx}>
                    <span className="text-neutral-300 font-medium">{tag}</span>
                    {idx < track.style_tags.length - 1 && <span className="text-neutral-600">/</span>}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>

          {/* Audio Player embedded */}
          <AudioPlayer track={track} lang={lang} onDownloadAudio={handleDownloadMp3} />
        </div>

      </div>

      {/* Primary Download Matrix */}
      <div className="border-t border-neutral-800 bg-neutral-950/40 p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-300">
            Tùy Chọn Tải Về / Download Options
          </h3>
          <span className="text-xs text-neutral-500 font-mono">ID: {track.id.slice(0, 8)}...</span>
        </div>

        {/* Download Error Banner */}
        {downloadError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{downloadError}</span>
            </div>
            <button onClick={() => setDownloadError(null)} className="text-red-400 hover:text-white text-xs font-bold">
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* 1. MP3 Audio (Universal 320kbps) */}
          <button
            onClick={handleDownloadMp3}
            disabled={downloadingFormat !== null}
            className="flex items-center justify-between p-3.5 bg-neutral-900 hover:bg-neutral-850 disabled:opacity-60 border border-neutral-800 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                {downloadingFormat === 'mp3' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                  {downloadingFormat === 'mp3' ? 'Đang chuẩn bị MP3...' : (lang === 'vi' ? 'Tải MP3 320kbps' : 'Download MP3 (320k)')}
                </div>
                <div className="text-xs text-neutral-400">
                  {lang === 'vi' ? 'Chuẩn phổ biến, mở mọi Player' : 'Universal MP3 320kbps'}
                </div>
              </div>
            </div>
            {downloadingFormat === 'mp3' ? (
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 transition-colors shrink-0" />
            )}
          </button>

          {/* 1b. WAV Studio Master (Lossless 1411kbps PCM) */}
          <button
            onClick={handleDownloadWav}
            disabled={downloadingFormat !== null}
            className="flex items-center justify-between p-3.5 bg-neutral-900 hover:bg-neutral-850 disabled:opacity-60 border border-neutral-800 hover:border-cyan-500/40 rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
                {downloadingFormat === 'wav' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition-colors">
                  {downloadingFormat === 'wav' ? 'Đang xuất WAV 50MB...' : (lang === 'vi' ? 'Tải WAV Studio (Lossless)' : 'Download WAV Studio')}
                </div>
                <div className="text-xs text-neutral-400">
                  {lang === 'vi' ? 'PCM 1411kbps, dựng mix DAW' : 'Lossless 16-bit 44.1kHz'}
                </div>
              </div>
            </div>
            {downloadingFormat === 'wav' ? (
              <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-neutral-500 group-hover:text-cyan-400 transition-colors shrink-0" />
            )}
          </button>

          {/* 1c. Decrypted M4A Master (Valid moov box) */}
          <button
            onClick={handleDownloadM4a}
            disabled={downloadingFormat !== null}
            className="flex items-center justify-between p-3.5 bg-neutral-900 hover:bg-neutral-850 disabled:opacity-60 border border-neutral-800 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                {downloadingFormat === 'm4a' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Music className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                  {downloadingFormat === 'm4a' ? 'Đang chuẩn bị M4A...' : (lang === 'vi' ? 'Tải M4A Gốc' : 'Download M4A Master')}
                </div>
                <div className="text-xs text-neutral-400">
                  {lang === 'vi' ? 'Giải mã DRM (có moov box)' : 'DRM-Decrypted Master'}
                </div>
              </div>
            </div>
            {downloadingFormat === 'm4a' ? (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-neutral-500 group-hover:text-indigo-400 transition-colors shrink-0" />
            )}
          </button>

          {/* 2. MP4 Video */}
          <button
            onClick={handleDownloadMp4}
            className="flex items-center justify-between p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                  {t.downloadMp4}
                </div>
                <div className="text-xs text-neutral-400">Video MP4 Visualizer</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors shrink-0" />
          </button>

          {/* 3. HD Cover Art */}
          <button
            onClick={handleDownloadCover}
            className="flex items-center justify-between p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {t.downloadCover}
                </div>
                <div className="text-xs text-neutral-400">High-Res PNG / JPG Artwork</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-500 group-hover:text-blue-400 transition-colors shrink-0" />
          </button>

          {/* 4. Synced LRC Lyrics */}
          <button
            onClick={handleDownloadLrc}
            className="flex items-center justify-between p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors">
                  {t.downloadLrc}
                </div>
                <div className="text-xs text-neutral-400">Đồng bộ Karaoke / Player</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 transition-colors shrink-0" />
          </button>

          {/* 5. Plain Lyrics TXT */}
          <button
            onClick={handleDownloadTxt}
            className="flex items-center justify-between p-3.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-amber-500/40 rounded-xl transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors">
                  {t.downloadTxt}
                </div>
                <div className="text-xs text-neutral-400">Văn bản lời bài hát thô</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-neutral-500 group-hover:text-rose-400 transition-colors shrink-0" />
          </button>

          {/* 6. Bundle ZIP */}
          <button
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="flex items-center justify-between p-3.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 hover:border-amber-500/50 rounded-xl transition-all cursor-pointer group text-left disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400 text-neutral-950 flex items-center justify-center shrink-0 font-bold">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-semibold text-amber-300">
                  {isZipping ? (zipStatus || 'Đang nén...') : t.downloadZip}
                </div>
                <div className="text-xs text-amber-200/70">MP3 + Cover + Lyrics + JSON</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-amber-400 transition-colors shrink-0" />
          </button>

        </div>
      </div>

      {/* Tabs: Lyrics / Prompt / Technical Specs */}
      <div className="border-t border-neutral-800 p-6 md:p-8">
        
        {/* Interactive segmented controls */}
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-1 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              onClick={() => setActiveTab('lyrics')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'lyrics' 
                  ? 'bg-neutral-800 text-amber-400 shadow-sm' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t.lyricsTab}
            </button>
            <button
              onClick={() => setActiveTab('prompt')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'prompt' 
                  ? 'bg-neutral-800 text-amber-400 shadow-sm' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t.promptTab}
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'details' 
                  ? 'bg-neutral-800 text-amber-400 shadow-sm' 
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {t.detailsTab}
            </button>
          </div>

          {activeTab === 'lyrics' && (
            <button
              onClick={() => handleCopy(track.lyrics, 'lyrics')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              {copiedLyrics ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
              <span>{copiedLyrics ? t.copied : t.copyLyrics}</span>
            </button>
          )}

          {activeTab === 'prompt' && (
            <button
              onClick={() => handleCopy(track.lyrics, 'prompt')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              {copiedPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
              <span>{copiedPrompt ? t.copied : t.copyPrompt}</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        {activeTab === 'lyrics' && (
          <div className="bg-neutral-950 rounded-xl p-4 sm:p-5 border border-neutral-800/80 max-h-72 overflow-y-auto font-mono text-xs sm:text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">
            {track.lyrics || '(Không có lời bài hát / Instrumental)'}
          </div>
        )}

        {activeTab === 'prompt' && (
          <div className="bg-neutral-950 rounded-xl p-4 sm:p-5 border border-neutral-800/80 flex flex-col gap-4">
            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Style Tags & Instruments
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-mono text-neutral-300">
                {track.style_tags && track.style_tags.length > 0 ? (
                  track.style_tags.map((st, i) => (
                    <span key={i} className="px-2.5 py-1 bg-neutral-900 border border-neutral-800 rounded text-amber-300">
                      #{st}
                    </span>
                  ))
                ) : (
                  <span className="text-neutral-500">Chưa xác định</span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Raw Prompt / Lyrics
              </div>
              <p className="text-xs font-mono text-neutral-300 bg-neutral-900 p-3 rounded-lg border border-neutral-800 whitespace-pre-wrap">
                {track.lyrics}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="bg-neutral-950 rounded-xl p-4 sm:p-5 border border-neutral-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-neutral-500 block mb-1">Suno Song UUID</span>
              <span className="text-neutral-200 select-all">{track.id}</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">Model Version</span>
              <span className="text-neutral-200">{track.model_name}</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">Audio Duration</span>
              <span className="text-neutral-200 tabular-nums">{track.duration}s ({formatTime(track.duration)})</span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">Direct CDN Audio Stream</span>
              <a href={track.audio_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline truncate block">
                {track.audio_url}
              </a>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">Direct CDN Video Stream</span>
              <a href={track.video_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline truncate block">
                {track.video_url}
              </a>
            </div>
            <div>
              <span className="text-neutral-500 block mb-1">Direct Cover Art</span>
              <a href={track.image_url} target="_blank" rel="noreferrer" className="text-amber-400 hover:underline truncate block">
                {track.image_url}
              </a>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
