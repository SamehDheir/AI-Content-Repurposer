"use client";
import { useState, useCallback } from "react";
import { Copy, Check, X, Image as ImageIcon, Sparkles, ZoomIn, ZoomOut, Download } from "lucide-react";
import { type Job, type ContentType, api } from "@/src/lib/api";
import { TABS } from "./types";
import { TwitterContent }    from "./TwitterContent";
import { BlogContent }       from "./BlogContent";
import { FacebookContent }   from "./FacebookContent";
import { HighlightsContent } from "./HighlightsContent";
import { useTheme } from "@/src/contexts/ThemeContext";

interface Props {
  job:     Job;
  onClose: () => void;
  onJobUpdate?: (job: Job) => void;
}

export function ContentViewer({ job, onClose, onJobUpdate }: Props) {
  const { theme } = useTheme();
  const [tab, setTab]         = useState<ContentType>("TWITTER_THREAD");
  const [copied, setCopied]   = useState(false);
  const [editedBodies, setEditedBodies] = useState<Partial<Record<ContentType, string>>>({});
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(job.imageUrl || null);

  const getBody = (t: ContentType) =>
    editedBodies[t] ?? job.generatedContent.find((c) => c.type === t)?.body ?? "";

  const body = getBody(tab);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBlogEdit = useCallback((val: string) => {
    setEditedBodies((prev) => ({ ...prev, BLOG_POST: val }));
  }, []);

  const handleGenerateImage = async () => {
    setGeneratingImage(true);
    try {
      const result = await api.generateImageForJob(job.id);
      setLocalImageUrl(result.imageUrl);
      onJobUpdate?.({ ...job, imageUrl: result.imageUrl });
    } catch (error: any) {
      console.error('Failed to generate image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleZoom = () => {
    setImageZoomed(!imageZoomed);
  };

  const handleDownload = async () => {
    const imageUrl = localImageUrl || job.imageUrl;
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `featured-image-${job.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div
        className={`relative w-full max-w-2xl max-h-[90vh] md:max-h-[88vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl ${
          theme === 'dark' ? 'bg-[#141416] border-white/8' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent pointer-events-none" />

        {/* ── Header ── */}
        <div className={`flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b ${theme === 'dark' ? 'border-white/8' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500/70" />
            <span className={`text-sm font-semibold tracking-tight ${theme === 'dark' ? 'text-zinc-100' : 'text-gray-900'}`}>
              Generated content
            </span>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 md:w-7 md:h-7 rounded-lg flex items-center justify-center transition-all ${
              theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Generated Image ── */}
        {(localImageUrl || job.imageUrl || generatingImage) && (
          <div className={`px-5 py-3 border-b ${theme === 'dark' ? 'border-white/8' : 'border-gray-200'} bg-zinc-900/50`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ImageIcon size={12} className="text-indigo-400" />
                <span className="text-xs font-medium text-zinc-400">
                  {generatingImage ? "Generating Image..." : "Featured Image"}
                </span>
              </div>
              {!generatingImage && (localImageUrl || job.imageUrl) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleZoom}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-all"
                    title={imageZoomed ? "Zoom out" : "Zoom in"}
                  >
                    {imageZoomed ? <ZoomOut size={13} /> : <ZoomIn size={13} />}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/10 transition-all"
                    title="Download image"
                  >
                    <Download size={13} />
                  </button>
                </div>
              )}
            </div>
            {generatingImage ? (
              <div className="rounded-lg overflow-hidden border border-white/10 mx-auto max-h-32 w-48 flex items-center justify-center bg-zinc-800">
                <div className="flex flex-col items-center gap-2 py-6">
                  <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                  <span className="text-xs text-zinc-400">Generating...</span>
                </div>
              </div>
            ) : (
              <div 
                className={`rounded-lg overflow-hidden border border-white/10 mx-auto transition-all ${
                  imageZoomed ? "max-h-96 w-full" : "max-h-32 w-48"
                }`}
              >
                <img
                  src={localImageUrl || job.imageUrl}
                  alt="Generated featured image"
                  className="w-full h-full object-contain bg-zinc-800"
                />
              </div>
            )}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className={`flex items-center gap-1 px-4 md:px-5 pt-3 pb-0 border-b ${theme === 'dark' ? 'border-white/8' : 'border-gray-200'}`}>
          {TABS.map((t) => {
            const hasContent = !!getBody(t.key);
            const isActive   = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                disabled={!hasContent}
                className={`relative flex items-center gap-1.5 px-2 md:px-3 py-2 -mb-px text-xs font-medium transition-all rounded-t-lg ${
                  isActive
                    ? `${theme === 'dark' ? 'text-zinc-100 bg-white/8 border-white/10' : 'text-gray-900 bg-gray-100 border-gray-300'} border-b-${theme === 'dark' ? '[#141416]' : 'white'}`
                    : hasContent
                    ? `${theme === 'dark' ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`
                    : `${theme === 'dark' ? 'text-zinc-700' : 'text-gray-400'} cursor-not-allowed`
                }`}
                aria-label={`Switch to ${t.label} tab`}
              >
                <span className="text-[11px] opacity-70">{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-500 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* ── Content area ── */}
        <div className={`flex-1 overflow-y-auto px-4 md:px-5 py-4 md:py-5 scrollbar-thin scrollbar-track-transparent ${
          theme === 'dark' ? 'scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20' : 'scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400'
        }`}>
          {!body ? (
            <div className="flex items-center justify-center h-32">
              <p className={`text-sm ${theme === 'dark' ? 'text-zinc-600' : 'text-gray-500'}`}>No content available.</p>
            </div>
          ) : (
            <>
              {tab === "TWITTER_THREAD" && <TwitterContent body={body} />}
              {tab === "BLOG_POST"      && <BlogContent body={body} onBodyChange={handleBlogEdit} />}
              {tab === "FACEBOOK_POST"  && <FacebookContent body={body} />}
              {tab === "HIGHLIGHTS"     && <HighlightsContent body={body} />}
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 px-4 md:px-5 py-3 md:py-3.5 border-t ${
          theme === 'dark' ? 'border-white/8 bg-white/3' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
            <span className={`text-xs ${theme === 'dark' ? 'text-zinc-600' : 'text-gray-500'}`}>
              {body.length.toLocaleString()} chars
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!localImageUrl && !job.imageUrl && (
              <button
                onClick={handleGenerateImage}
                disabled={generatingImage}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  generatingImage
                    ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                } min-h-[44px]`}
                aria-label="Generate image"
              >
                {generatingImage ? (
                  <>
                    <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} />
                    <span className="hidden sm:inline">Generate Image</span>
                    <span className="sm:hidden">Generate</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                copied
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              } min-h-[44px]`}
              aria-label="Copy content"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              <span className="hidden sm:inline">{copied ? "Copied!" : "Copy all"}</span>
              <span className="sm:hidden">{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}