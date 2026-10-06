import React, { useState, useRef } from 'react';
import { UploadCloud, Music, ArrowRight, CheckCircle2, AlertCircle, Loader2, Download, Link as LinkIcon, Sparkles } from 'lucide-react';

export const M4aConverter: React.FC = () => {
  // Method 1: Link converter
  const [linkInput, setLinkInput] = useState('');
  const [isConvertingLink, setIsConvertingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);

  // Method 2: File converter
  const [file, setFile] = useState<File | null>(null);
  const [isFileConverting, setIsFileConverting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileSuccess, setFileSuccess] = useState(false);
  const [fileDownloadUrl, setFileDownloadUrl] = useState<string | null>(null);
  const [convertedFilename, setConvertedFilename] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert by Link
  const handleConvertLink = async () => {
    const trimmed = linkInput.trim();
    if (!trimmed) {
      setLinkError('Vui lòng nhập link Suno hoặc link file M4A.');
      return;
    }

    setIsConvertingLink(true);
    setLinkError(null);
    setLinkSuccess(false);

    try {
      const targetUrl = `/api/convert/url-to-mp3?url=${encodeURIComponent(trimmed)}`;
      const res = await fetch(targetUrl);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Lỗi máy chủ (${res.status})`);
      }

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'suno_audio_320k.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setLinkSuccess(true);
    } catch (err: any) {
      setLinkError(err.message || 'Lỗi khi chuyển đổi link sang MP3.');
    } finally {
      setIsConvertingLink(false);
    }
  };

  // Convert by File
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setFileError(null);
      setFileSuccess(false);
      setFileDownloadUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setFileError(null);
      setFileSuccess(false);
      setFileDownloadUrl(null);
    }
  };

  const handleConvertFile = async () => {
    if (!file) return;

    setIsFileConverting(true);
    setFileError(null);
    setFileSuccess(false);

    try {
      const resp = await fetch(`/api/convert/m4a-to-mp3?filename=${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: file,
      });

      if (!resp.ok) {
        let msg = 'Chuyển đổi thất bại';
        try {
          const errJson = await resp.json();
          if (errJson.message) msg = errJson.message;
        } catch {
          msg = await resp.text();
        }
        throw new Error(msg);
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const outName = file.name.replace(/\.(m4a|mp4|webm)$/i, '') + '.mp3';
      
      setFileDownloadUrl(url);
      setConvertedFilename(outName);
      setFileSuccess(true);

      // Auto-trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = outName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      setFileError(err.message || 'Có lỗi xảy ra khi chuyển đổi file.');
    } finally {
      setIsFileConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Method 1: Convert Directly from Suno / M4A Link */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Chuyển Đổi Từ Link Suno / M4A Sang MP3 (320kbps)
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h2>
            <p className="text-xs text-neutral-400">
              Dán đường link Suno hoặc link CloudFront M4A để hệ thống tự động giải mã DRM và xuất file MP3 chuẩn 320kbps
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <LinkIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConvertLink()}
              placeholder="Dán link Suno (https://suno.com/song/...) hoặc link M4A..."
              className="w-full pl-10 pr-4 py-3.5 bg-neutral-950/80 border border-neutral-750 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-sm text-white placeholder-neutral-500 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleConvertLink}
            disabled={isConvertingLink || !linkInput.trim()}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-neutral-950 font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 shrink-0 cursor-pointer text-sm"
          >
            {isConvertingLink ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý & Convert...</span>
              </>
            ) : (
              <>
                <span>Chuyển Sang MP3 & Tải Về</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {linkError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{linkError}</span>
          </div>
        )}

        {linkSuccess && (
          <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Đã chuyển đổi thành công! Tệp MP3 320kbps đang được tải về máy của bạn.</span>
          </div>
        )}
      </div>

      {/* 2. Method 2: Convert Local M4A File from Computer */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Hoặc Chọn File M4A Từ Máy Tính
            </h2>
            <p className="text-xs text-neutral-400">
              Sửa triệt để lỗi "moov box not found", chuyển mọi file M4A (kể cả file tải trước đây bị lỗi) sang MP3 320kbps
            </p>
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
            file 
              ? 'border-indigo-500/60 bg-indigo-500/5' 
              : 'border-neutral-800 hover:border-neutral-700 bg-neutral-950/40 hover:bg-neutral-950/70'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".m4a,.mp4,.webm,.opus,.wav"
            className="hidden"
            onChange={handleFileChange}
          />

          {file ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Music className="w-6 h-6" />
              </div>
              <div className="font-semibold text-white text-sm break-all">{file.name}</div>
              <div className="text-xs text-neutral-400 font-mono">
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Sẵn sàng chuyển đổi
              </div>
              <span className="text-xs text-indigo-400/80 mt-1 hover:underline">
                Bấm để chọn file khác
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-neutral-800/80 text-neutral-400 flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="font-medium text-neutral-200 text-sm">
                Kéo thả file .m4a vào đây hoặc <span className="text-indigo-400 underline">chọn từ máy tính</span>
              </div>
              <p className="text-xs text-neutral-500">
                Tự động sửa lỗi moov box và chuyển mã bằng FFmpeg sang chuẩn MP3 320kbps
              </p>
            </div>
          )}
        </div>

        {fileError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fileError}</span>
          </div>
        )}

        {fileSuccess && fileDownloadUrl && (
          <div className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã chuyển đổi thành công sang file MP3 320kbps!</span>
            </div>
            <a
              href={fileDownloadUrl}
              download={convertedFilename}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-neutral-950 font-bold rounded-lg hover:bg-emerald-400 transition-colors text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải Lại MP3</span>
            </a>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={handleConvertFile}
            disabled={!file || isFileConverting}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer text-sm"
          >
            {isFileConverting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang xử lý và chuyển đổi FFmpeg...</span>
              </>
            ) : (
              <>
                <span>Chuyển File Sang MP3 320kbps</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

    </div>
  );
};
