import React, { useRef, useState, useEffect } from 'react';
import { SunoTrack } from '../types/suno';
import { formatTime } from '../utils/sunoUtils';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Repeat, 
  Download
} from 'lucide-react';

interface AudioPlayerProps {
  track: SunoTrack;
  lang: 'vi' | 'en';
  onDownloadAudio?: () => void;
}

function resolveTrackAudioSrc(track: SunoTrack): string | null {
  if (!track) return null;
  const src = track.audio_url || '';
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return `/api/suno/stream?url=${encodeURIComponent(track.audio_url)}&id=${encodeURIComponent(track.id)}`;
  }
  return src || `/api/audio/sample/${track.id}`;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ track, lang, onDownloadAudio }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration || 180);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentSrc, setCurrentSrc] = useState<string | null>(() => resolveTrackAudioSrc(track));
  const [hasTriedFallback, setHasTriedFallback] = useState(false);
  const [waveSeed] = useState(() => Array.from({ length: 48 }, () => 0.2 + Math.random() * 0.8));

  // Determine the best audio source when track changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setHasTriedFallback(false);

    const src = resolveTrackAudioSrc(track);
    setCurrentSrc(src);

    if (audioRef.current && src) {
      audioRef.current.currentTime = 0;
      audioRef.current.src = src;
      audioRef.current.load();
    }
  }, [track.id, track.audio_url]);

  const handleAudioError = () => {
    console.warn('Audio stream loading error');
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn('Audio play error:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && !isNaN(audioRef.current.duration) && audioRef.current.duration > 0) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume > 0 ? volume : 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackRate(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 sm:p-5 flex flex-col gap-4">
      {currentSrc && (
        <audio
          ref={audioRef}
          src={currentSrc}
          onError={handleAudioError}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => {
            if (!isLoop) setIsPlaying(false);
          }}
          loop={isLoop}
          preload="auto"
        />
      )}

      {/* Simulated Waveform Visualizer & Seek Area */}
      <div className="flex flex-col gap-1.5">
        <div 
          className="relative h-12 flex items-center justify-between gap-[2px] px-1 cursor-pointer bg-neutral-950/60 rounded-lg p-2 overflow-hidden border border-neutral-800/40"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            const newTime = clickPos * duration;
            setCurrentTime(newTime);
            if (audioRef.current) audioRef.current.currentTime = newTime;
          }}
        >
          {waveSeed.map((heightFactor, idx) => {
            const barProgress = (idx / waveSeed.length) * 100;
            const isPassed = barProgress <= progressPercent;
            const dynamicScale = isPlaying ? (1 + 0.3 * Math.sin((currentTime * 8) + idx)) : 1;
            const height = Math.min(100, Math.max(16, heightFactor * 100 * dynamicScale));

            return (
              <div
                key={idx}
                className="flex-1 rounded-full transition-all duration-75"
                style={{
                  height: `${height}%`,
                  backgroundColor: isPassed ? '#f59e0b' : '#334155',
                  opacity: isPassed ? 1 : 0.45,
                }}
              />
            );
          })}
        </div>

        {/* Scrubber slider & Timestamps */}
        <div className="flex items-center gap-3 pt-1">
          <span className="font-mono text-xs tabular-nums text-neutral-400 min-w-[36px]">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
            />
          </div>
          <span className="font-mono text-xs tabular-nums text-neutral-400 min-w-[36px] text-right">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Control Buttons Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
        
        {/* Left: Main Play / Pause & Restart */}
        <div className="flex items-center gap-2">
          <button
            onClick={restartAudio}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800/80 transition-colors cursor-pointer"
            title={lang === 'vi' ? 'Phát lại từ đầu' : 'Restart'}
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-300 text-neutral-950 flex items-center justify-center font-bold shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            title={isPlaying ? 'Tạm dừng' : 'Phát'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-neutral-950" />
            ) : (
              <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
            )}
          </button>

          <button
            onClick={() => setIsLoop(!isLoop)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isLoop 
                ? 'text-amber-400 bg-amber-500/10' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800/80'
            }`}
            title={lang === 'vi' ? 'Lặp lại bài hát' : 'Toggle repeat'}
          >
            <Repeat className="w-4 h-4" />
          </button>

          <button
            onClick={cycleSpeed}
            className="px-2 py-1 text-xs font-mono font-medium text-neutral-300 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-md border border-neutral-700/60 transition-colors cursor-pointer"
            title={lang === 'vi' ? 'Tốc độ phát' : 'Playback speed'}
          >
            <span className="tabular-nums">{playbackRate}x</span>
          </button>
        </div>

        {/* Right: Volume & Fast Download */}
        <div className="flex items-center gap-4">
          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-neutral-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-18 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-neutral-300"
            />
          </div>

          {onDownloadAudio && (
            <button
              onClick={onDownloadAudio}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>MP3</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
