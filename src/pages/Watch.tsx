import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  MoreHorizontal,
  CheckCircle,
  MessageSquare,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipForward,
  Info
} from 'lucide-react';
import { Video } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import AdBanner from '../components/AdBanner';

export default function Watch({ user }: { user: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [suggested, setSuggested] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [ad, setAd] = useState<any>(null);
  const [adCountdown, setAdCountdown] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    setLoading(true);
    // Fetch video details
    fetch(`/api/videos/${id}`)
      .then(res => res.json())
      .then(data => {
        setVideo(data);
        setLoading(false);

        // Check subscription status if user is logged in
        if (user) {
          fetch(`/api/subscriptions/check/${data.user_id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
            .then(res => res.json())
            .then(subData => setIsSubscribed(subData.subscribed));

          // Check like status
          fetch(`/api/videos/${id}/like/check`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          })
            .then(res => res.json())
            .then(likeData => setIsLiked(likeData.liked));
        }

        // Fetch comments
        fetch(`/api/videos/${id}/comments`)
          .then(res => res.json())
          .then(setComments);

        // Serve pre-roll ad
        fetch('/api/ads/serve?type=pre-roll')
          .then(res => res.json())
          .then(adData => {
            if (adData) {
              setAd(adData);
              setAdCountdown(5);
            } else {
              setIsPlaying(true);
            }
          });
      });

    // Fetch suggested videos
    fetch('/api/videos')
      .then(res => res.json())
      .then(data => setSuggested(data.filter((v: Video) => v.id !== Number(id))));
  }, [id]);

  useEffect(() => {
    if (adCountdown > 0) {
      const timer = setTimeout(() => setAdCountdown(adCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [adCountdown]);

  const handleSkipAd = () => {
    if (adCountdown === 0) {
      // Record impression
      fetch('/api/ads/impression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ad_id: ad.id, video_id: video?.id, user_id: user?.id })
      });
      setAd(null);
      setIsPlaying(true);
    }
  };

  const handleToggleSubscribe = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await fetch('/api/subscriptions/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ following_id: video?.user_id })
      });
      const data = await res.json();
      setIsSubscribed(data.subscribed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLike = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await fetch(`/api/videos/${id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setIsLiked(data.liked);
      if (video) {
        setVideo({ ...video, likes: data.liked ? video.likes + 1 : video.likes - 1 });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim() || isPostingComment) return;

    setIsPostingComment(true);
    try {
      const res = await fetch(`/api/videos/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: commentText })
      });
      const newComment = await res.json();
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!video) return <div className="text-center py-20">Video not found</div>;

  return (
    <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-8 space-y-6">
        {/* Video Player Container */}
        <div className="aspect-video bg-black rounded-3xl overflow-hidden relative group shadow-2xl">
          <AnimatePresence mode="wait">
            {ad ? (
              <motion.div
                key="ad"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20"
              >
                <video
                  src={ad.video_url}
                  autoPlay
                  muted={isMuted}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-6 left-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <Info className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-white uppercase tracking-widest">Advertisement</span>
                </div>
                <div className="absolute bottom-12 right-6 flex items-center gap-4">
                  <button
                    onClick={handleSkipAd}
                    disabled={adCountdown > 0}
                    className={cn(
                      "px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2",
                      adCountdown > 0 ? "bg-black/60 text-zinc-500 cursor-not-allowed" : "bg-white text-black hover:bg-zinc-200"
                    )}
                  >
                    {adCountdown > 0 ? `Skip in ${adCountdown}` : 'Skip Ad'}
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-full"
              >
                <video
                  ref={videoRef}
                  src={video.video_url}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={togglePlay}
                  autoPlay
                />

                {/* Custom Controls */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-6 gap-4">
                  {/* Progress Bar */}
                  <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer group/progress">
                    <div
                      className="h-full bg-orange-500 relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-orange-500 rounded-full shadow-lg scale-0 group-hover/progress:scale-100 transition-transform" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button onClick={togglePlay} className="hover:scale-110 transition-transform">
                        {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                      </button>
                      <div className="flex items-center gap-4">
                        <button onClick={() => setIsMuted(!isMuted)}>
                          {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                        </button>
                        <span className="text-xs font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Settings className="w-5 h-5 hover:rotate-90 transition-transform cursor-pointer" />
                      <Maximize className="w-5 h-5 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Video Info */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">{video.title}</h1>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link to={`/channel/${video.user_id}`} className="shrink-0">
                <img
                  src={video.creator_avatar}
                  alt="avatar"
                  className="w-12 h-12 rounded-full border border-zinc-800"
                  referrerPolicy="no-referrer"
                />
              </Link>
              <div>
                <Link to={`/channel/${video.user_id}`} className="flex items-center gap-1 hover:text-orange-500 transition-colors">
                  <span className="font-bold">{video.creator_name}</span>
                  <CheckCircle className="w-4 h-4 fill-orange-500 text-black" />
                </Link>
                <p className="text-xs text-zinc-500">{(video as any).subscriber_count?.toLocaleString() || '0'} subscribers</p>
              </div>
              <button
                onClick={handleToggleSubscribe}
                className={cn(
                  "ml-4 px-6 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95",
                  isSubscribed
                    ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                    : "bg-white text-black hover:bg-zinc-200"
                )}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-zinc-900 rounded-full border border-zinc-800">
                <button
                  onClick={handleToggleLike}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 hover:bg-zinc-800 transition-colors border-r border-zinc-800 rounded-l-full",
                    isLiked && "text-orange-500"
                  )}
                >
                  <ThumbsUp className={cn("w-5 h-5", isLiked && "fill-current")} />
                  <span className="text-sm font-bold">{video.likes.toLocaleString()}</span>
                </button>
                <button className="px-4 py-2 hover:bg-zinc-800 transition-colors rounded-r-full">
                  <ThumbsDown className="w-5 h-5" />
                </button>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-800 transition-colors">
                <Share2 className="w-5 h-5" />
                <span className="text-sm font-bold">Share</span>
              </button>
              <button className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-800 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Description Box */}
        <div className="bg-zinc-900/50 border border-zinc-900 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-4 text-sm font-bold">
            <span>{video.views.toLocaleString()} views</span>
            <span>{format(new Date(video.created_at), 'MMM d, yyyy')}</span>
            <div className="flex items-center gap-1 text-zinc-500">
              {video.tags?.split(',').map(tag => (
                <span key={tag} className="hover:text-orange-500 cursor-pointer">#{tag.trim()}</span>
              ))}
            </div>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
            {video.description}
          </p>
          <button className="text-sm font-bold hover:text-orange-500 transition-colors">Show more</button>
        </div>

        {/* Comments Section */}
        <div className="space-y-8 pt-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold">{comments.length.toLocaleString()} Comments</h3>
            <div className="flex items-center gap-2 text-sm font-bold text-zinc-500 cursor-pointer hover:text-white">
              <Settings className="w-4 h-4" /> Sort by
            </div>
          </div>

          {user && (
            <form onSubmit={handlePostComment} className="flex gap-4">
              <img src={user.avatar_url} alt="me" className="w-10 h-10 rounded-full shrink-0" referrerPolicy="no-referrer" />
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  className="w-full bg-transparent border-b border-zinc-800 focus:border-orange-500 py-2 focus:outline-none transition-all"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setCommentText('')}
                    className="px-4 py-2 text-sm font-bold hover:bg-zinc-900 rounded-full transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || isPostingComment}
                    className="px-4 py-2 text-sm font-bold bg-orange-500 text-black rounded-full hover:bg-orange-600 transition-colors disabled:opacity-50"
                  >
                    {isPostingComment ? 'Posting...' : 'Comment'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-6">
            {comments.map((comment: any) => (
              <div key={comment.id} className="flex gap-4 group">
                <img src={comment.avatar_url} alt="user" className="w-10 h-10 rounded-full shrink-0" referrerPolicy="no-referrer" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{comment.username}</span>
                    <span className="text-xs text-zinc-500">{format(new Date(comment.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <p className="text-sm text-zinc-300">{comment.content}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="flex items-center gap-1 text-zinc-500 hover:text-white cursor-pointer transition-colors">
                      <ThumbsUp className="w-4 h-4" />
                      <span className="text-xs font-bold">0</span>
                    </div>
                    <ThumbsDown className="w-4 h-4 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
                    <span className="text-xs font-bold text-zinc-500 hover:text-white cursor-pointer transition-colors">Reply</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar Suggestions */}
      <div className="lg:col-span-4 space-y-4">
        <AdBanner slotId="445566778" format="rectangle" />
        <div className="flex items-center gap-2 mb-4 mt-4">
          <button className="px-4 py-1.5 bg-white text-black rounded-lg text-xs font-bold">All</button>
          <button className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-bold transition-colors">From {video.creator_name}</button>
          <button className="px-4 py-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs font-bold transition-colors">Related</button>
        </div>

        <div className="space-y-4">
          {suggested.map((v) => (
            <Link key={v.id} to={`/watch/${v.id}`} className="flex gap-3 group">
              <div className="w-40 aspect-video bg-zinc-900 rounded-xl overflow-hidden shrink-0 relative">
                <img
                  src={v.thumbnail_url}
                  alt={v.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-1.5 right-1.5 bg-black/80 px-1 py-0.5 rounded text-[10px] font-bold">{Math.floor((v.id * 7) % 15 + 1)}:{(v.id * 13 % 60).toString().padStart(2, '0')}</div>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h4 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">{v.title}</h4>
                <div className="flex flex-col text-[11px] text-zinc-500">
                  <span className="hover:text-white transition-colors">{v.creator_name}</span>
                  <span>{v.views.toLocaleString()} views • {format(new Date(v.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
