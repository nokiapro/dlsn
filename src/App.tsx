/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SunoTrack } from './types/suno';
import { extractSunoId } from './utils/sunoUtils';
import { TrackCard } from './components/TrackCard';
import { M4aConverter } from './components/M4aConverter';
import { 
  Music, 
  Link as LinkIcon, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  ClipboardPaste, 
  X,
  Download
} from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'player' | 'converter'>('player');
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SunoTrack | null>(null);

  const [isConvertingMp3, setIsConvertingMp3] = useState(false);
  const [isConvertingWav, setIsConvertingWav] = useState(false);

  const handleDirectConvertWav = async () => {
    const rawInput = inputUrl.trim();
    if (!rawInput) {
      setErrorMessage('Vui lòng nhập đường link bài hát Suno để tải WAV.');
      return;
    }
    setErrorMessage(null);
    setIsConvertingWav(true);
    try {
      const id = extractSunoId(rawInput) || '';
      const targetUrl = `/api/suno/proxy-download?id=${encodeURIComponent(id)}&url=${encodeURIComponent(rawInput)}&format=wav`;
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = `suno_${id.slice(0, 8) || 'track'}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi tải file WAV Studio.');
    } finally {
      setTimeout(() => setIsConvertingWav(false), 2500);
    }
  };

  const handleDirectConvertMp3 = async () => {
    const rawInput = inputUrl.trim();
    if (!rawInput) {
      setErrorMessage('Vui lòng nhập đường link bài hát Suno.');
      return;
    }
    setErrorMessage(null);
    setIsConvertingMp3(true);
    try {
      const targetUrl = `/api/convert/url-to-mp3?url=${encodeURIComponent(rawInput)}`;
      const link = document.createElement('a');
      link.href = targetUrl;
      link.download = 'suno_audio.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi chuyển đổi link sang MP3.');
    } finally {
      setTimeout(() => setIsConvertingMp3(false), 2500);
    }
  };

  const handleSearch = async (urlToSearch?: string) => {
    const rawInput = (urlToSearch || inputUrl).trim();
    if (!rawInput) {
      setErrorMessage('Vui lòng nhập đường link bài hát Suno.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      const id = extractSunoId(rawInput);
      const resp = await fetch('/api/suno/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rawInput, id }),
      });

      const data = await resp.json();
      if (data.success && data.data) {
        setCurrentTrack(data.data);
      } else {
        setErrorMessage(data.message || 'Không thể trích xuất bài hát từ link đã nhập.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi kết nối máy chủ khi phân tích link Suno.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputUrl(text);
        handleSearch(text);
      }
    } catch {
      // Fallback
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* 1. Minimal Header */}
      <header className="border-b border-neutral-850 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-amber-500/20">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                SunoWave
              </span>
              <span className="ml-2 text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Player & Downloader
              </span>
            </div>
          </div>

          {/* Navigation Mode Switcher */}
          <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab('player')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'player'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Nghe & Tải Nhạc</span>
            </button>
            <button
              onClick={() => setActiveTab('converter')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'converter'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Chuyển M4A sang MP3</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {activeTab === 'player' && (
          <div className="space-y-8">
            
            {/* Input Form Box */}
            <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative">
                <div className="text-center sm:text-left mb-5">
                  <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
                    <span>Nhập Link Bài Hát Suno</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h1>
                  <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                    Dán đường link từ Suno.com để phát nhạc trực tiếp và tải về định dạng MP3 (320kbps) hoặc M4A đã giải mã DRM.
                  </p>
                </div>

                <div className="relative flex flex-col sm:flex-row items-stretch gap-2.5">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <LinkIcon className="w-4 h-4" />
                    </div>
                    
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Dán link bài hát Suno (Ví dụ: https://suno.com/song/34de101b-c077-40c6-8e3d-7f08e4640610)"
                      className="w-full pl-10 pr-20 py-3.5 bg-neutral-950/80 border border-neutral-750 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-sm text-white placeholder-neutral-500 transition-all outline-none"
                    />

                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                      {inputUrl ? (
                        <button
                          type="button"
                          onClick={() => setInputUrl('')}
                          className="p-1.5 text-neutral-500 hover:text-white rounded-md transition-colors"
                          title="Xóa"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePasteClipboard}
                          className="px-2.5 py-1 text-xs font-medium text-neutral-400 hover:text-amber-400 bg-neutral-850 hover:bg-neutral-800 rounded-md transition-colors flex items-center gap-1 border border-neutral-750"
                          title="Dán từ Clipboard"
                        >
                          <ClipboardPaste className="w-3.5 h-3.5" />
                          <span>Dán</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSearch()}
                    disabled={isLoading || !inputUrl.trim()}
                    className="px-5 py-3.5 bg-neutral-800 hover:bg-neutral-750 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer text-sm border border-neutral-700"
                    title="Mở trình phát nhạc với sóng âm và thông tin chi tiết"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Đang tải...</span>
                      </>
                    ) : (
                      <>
                        <Music className="w-4 h-4 text-amber-400" />
                        <span>Phát Nhạc</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDirectConvertMp3}
                    disabled={isConvertingMp3 || isConvertingWav || !inputUrl.trim()}
                    className="px-5 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 shrink-0 cursor-pointer text-sm"
                    title="Chuyển đổi trực tiếp link sang file MP3 320kbps và tải về máy"
                  >
                    {isConvertingMp3 ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang tải MP3...</span>
                      </>
                    ) : (
                      <>
                        <span>Tải MP3 Luôn</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDirectConvertWav}
                    disabled={isConvertingWav || isConvertingMp3 || !inputUrl.trim()}
                    className="px-5 py-3.5 bg-neutral-900 hover:bg-neutral-850 hover:border-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-400 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-neutral-750 shrink-0 cursor-pointer text-sm"
                    title="Tải tệp âm thanh WAV Studio Lossless 1411kbps (PCM 16-bit 44.1kHz)"
                  >
                    {isConvertingWav ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                        <span>Đang xuất WAV Studio...</span>
                      </>
                    ) : (
                      <>
                        <span>Tải WAV (Studio)</span>
                        <Download className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center justify-between">
                    <span>{errorMessage}</span>
                    <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Extracted Player & Download Card */}
            {currentTrack && (
              <div className="animate-in fade-in duration-300">
                <TrackCard
                  track={currentTrack}
                  lang="vi"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Direct M4A to MP3 Converter */}
        {activeTab === 'converter' && (
          <div className="space-y-6">
            <M4aConverter />
          </div>
        )}

      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500">
        <p>SunoWave • Tải & Chuyển Đổi Nhạc Suno AI Chuẩn MP3 320kbps Lossless</p>
      </footer>

    </div>
  );
};

export default App;
