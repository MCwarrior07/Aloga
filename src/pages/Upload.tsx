import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Upload as UploadIcon,
  Film,
  Image as ImageIcon,
  X,
  CheckCircle,
  Loader2,
  AlertCircle,
  PlaySquare,
  Type,
  Tag,
  Layout
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Upload({ user }: { user: any }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: 'https://www.w3schools.com/html/mov_bbb.mp4', // Default for demo
    thumbnail_url: '',
    is_short: false,
    category: 'Entertainment',
    tags: ''
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="p-6 bg-zinc-900 rounded-full border border-zinc-800">
          <AlertCircle className="w-12 h-12 text-zinc-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Sign in to Upload</h2>
          <p className="text-zinc-500 max-w-xs">Join our community of creators and start sharing your vibe with the world.</p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="bg-orange-500 hover:bg-orange-600 text-black px-8 py-3 rounded-xl font-bold transition-all active:scale-95"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setUploadProgress(0);

    const isVercel = window.location.hostname.includes('vercel.app');

    if (isVercel && videoFile && videoFile.size > 4 * 1024 * 1024) {
      setError("File exceeds Vercel Serverless limit (4MB). Please select a smaller file or upload without one to auto-generate.");
      setLoading(false);
      return;
    }

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 5;
      });
    }, 100);

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('is_short', String(formData.is_short));
      submitData.append('category', formData.category);
      submitData.append('tags', formData.tags);

      if (isVercel && videoFile) {
        // Vercel serverless /tmp is ephemeral, videos will 404. We simulate uploads with a generic video string.
        submitData.append('video_url', 'https://www.w3schools.com/html/mov_bbb.mp4');
      } else if (videoFile) {
        submitData.append('video', videoFile);
      } else {
        submitData.append('video_url', formData.video_url);
      }

      if (isVercel && thumbnailFile) {
        submitData.append('thumbnail_url', `https://picsum.photos/seed/${formData.title}/800/450`);
      } else if (thumbnailFile) {
        submitData.append('thumbnail', thumbnailFile);
      } else {
        submitData.append('thumbnail_url', formData.thumbnail_url || `https://picsum.photos/seed/${formData.title}/800/450`);
      }

      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: submitData
      });

      clearInterval(interval);
      setUploadProgress(100);

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/studio'), 2000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to upload video');
      }
    } catch (err) {
      clearInterval(interval);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-20"
    >
      <div className="flex items-center gap-4 mb-12">
        <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
          <UploadIcon className="w-8 h-8 text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Upload Content</h1>
          <p className="text-zinc-500">Share your stories, tutorials, or moments with the Aloga community.</p>
        </div>
      </div>

      {success ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-orange-500/10 border border-orange-500/20 rounded-[32px] p-12 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-orange-500/20">
            <CheckCircle className="w-10 h-10 text-black" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-orange-500">Upload Successful!</h2>
            <p className="text-zinc-400">Your video is being processed and will be live shortly. Redirecting to Studio...</p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Media Upload */}
          <div className="lg:col-span-5 space-y-6">
            <div className="aspect-[9/16] bg-zinc-900 border-2 border-dashed border-zinc-800 rounded-[32px] flex flex-col items-center justify-center p-8 text-center space-y-4 group hover:border-orange-500/50 transition-all cursor-pointer relative overflow-hidden">
              <div className="p-4 bg-zinc-800 rounded-full group-hover:scale-110 transition-transform">
                <Film className="w-8 h-8 text-zinc-500 group-hover:text-orange-500" />
              </div>
              <div className="space-y-1">
                <p className="font-bold">{videoFile ? videoFile.name : 'Select Video File'}</p>
                <p className="text-xs text-zinc-500">MP4, MOV or WebM up to 500MB</p>
              </div>
              <button type="button" className="bg-zinc-800 hover:bg-zinc-700 px-6 py-2 rounded-xl text-sm font-bold transition-colors">
                {videoFile ? 'Change File' : 'Browse Files'}
              </button>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="video/*" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && f.size > 4 * 1024 * 1024) {
                  setError("For this Vercel environment, please select a file under 4MB, or leave empty to simulate an upload.");
                } else {
                  setError("");
                }
                setVideoFile(f || null);
              }} />
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold">
                <ImageIcon className="w-4 h-4 text-orange-500" />
                Thumbnail
              </div>
              <div className="aspect-video bg-zinc-950 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center text-center p-4 group cursor-pointer hover:border-zinc-700 transition-all relative overflow-hidden">
                <p className="text-xs text-zinc-500 group-hover:text-zinc-300 relative z-10">{thumbnailFile ? thumbnailFile.name : 'Auto-generated or upload custom'}</p>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer z-20" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          </div>

          {/* Right Column: Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Type className="w-3 h-3" /> Title (required)
                  </label>
                  <input
                    type="text"
                    placeholder="Add a catchy title..."
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-orange-500 transition-all text-lg font-bold"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-3 h-3" /> Description
                  </label>
                  <textarea
                    placeholder="Tell viewers about your video..."
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-orange-500 transition-all resize-none text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                    <select
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-orange-500 transition-all text-sm appearance-none"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option>Entertainment</option>
                      <option>Gaming</option>
                      <option>Tech</option>
                      <option>Music</option>
                      <option>Education</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      <Tag className="w-3 h-3" /> Tags
                    </label>
                    <input
                      type="text"
                      placeholder="vibe, tech, cool"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-6 focus:outline-none focus:border-orange-500 transition-all text-sm"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                      <PlaySquare className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Upload as Short</p>
                      <p className="text-xs text-zinc-500">Vertical video optimized for mobile feed</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_short: !formData.is_short })}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      formData.is_short ? "bg-orange-500" : "bg-zinc-800"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      formData.is_short ? "left-7" : "left-1"
                    )} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500 text-sm font-medium flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" />
                  {error}
                </div>
              )}

              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-zinc-950 rounded-full border border-zinc-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full bg-orange-500"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] bg-orange-500 hover:bg-orange-600 text-black font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Publish Video'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </motion.div>
  );
}
