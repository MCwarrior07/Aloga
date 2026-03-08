import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Music,
  UserPlus,
  Volume2,
  VolumeX,
  Play,
  Pause,
  PlaySquare,
  ChevronUp,
  ChevronDown,
  Info,
  SkipForward,
  CheckCircle
} from 'lucide-react';
import { Video } from '../types';
import { cn } from '../lib/utils';

function ShortVideo({ video, isActive, onNext, user }: { video: Video, isActive: boolean, onNext: () => void, user: any }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(video.likes);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [ad, setAd] = useState<any>(null);
  const [adCountdown, setAdCountdown] = useState(0);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");

  useEffect(() => {
    if (isActive) {
      // Check subscription status
      if (user) {
        fetch(`/api/subscriptions/check/${video.user_id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => res.json())
          .then(subData => setIsSubscribed(subData.subscribed));

        // Check like status
        fetch(`/api/videos/${video.id}/like/check`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => res.json())
          .then(likeData => setLiked(likeData.liked));
      }

      // Check for ad insertion
      if (Math.random() > 0.7) {
        fetch('/api/ads/serve?type=short')
          .then(res => res.json())
          .then(adData => {
            if (adData) {
              setAd(adData);
              setAdCountdown(5);
            } else {
              videoRef.current?.play();
              setIsPlaying(true);
            }
          });
      } else {
        videoRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
      setAd(null);
    }
  }, [isActive, user]);

  const handleToggleSubscribe = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/subscriptions/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ following_id: video.user_id })
      });
      const data = await res.json();
      setIsSubscribed(data.subscribed);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLike = async () => {
    if (!user) return alert("Please sign in to like videos!");
    try {
      const res = await fetch(`/api/videos/${video.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to like');
      setLiked(data.liked);
      setLikeCount(prev => data.liked ? prev + 1 : prev - 1);
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleOpenComments = () => {
    fetch(`/api/videos/${video.id}/comments`)
      .then(res => res.json())
      .then(setComments);
    setShowComments(true);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please sign in to comment!");
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/videos/${video.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: commentText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to comment');
      setComments([data, ...comments]);
      setCommentText('');
    } catch (err: any) {
      console.error(err);
      alert(err.message);
    }
  };

  useEffect(() => {
    if (adCountdown > 0) {
      const timer = setTimeout(() => setAdCountdown(adCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [adCountdown]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleSkipAd = () => {
    if (adCountdown === 0) {
      setAd(null);
      videoRef.current?.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="relative h-full w-full bg-black flex items-center justify-center overflow-hidden">
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
            <div className="absolute top-12 left-6 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
              <Info className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-white uppercase tracking-widest">Sponsored</span>
            </div>
            <div className="absolute bottom-24 right-6 flex flex-col items-end gap-4">
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
              loop
              muted={isMuted}
              className="w-full h-full object-cover"
              onClick={togglePlay}
            />

            {/* Overlay UI */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-10 pointer-events-auto">
              <div className="flex flex-col items-center gap-1">
                <div className="relative mb-2">
                  <Link
                    to={`/channel/${video.user_id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block hover:scale-105 transition-transform"
                  >
                    <img src={video.creator_avatar} alt="avatar" className="w-12 h-12 rounded-full border-2 border-white shadow-xl object-cover" referrerPolicy="no-referrer" />
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSubscribe();
                    }}
                    className={cn(
                      "absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full p-1 shadow-lg hover:scale-110 transition-transform",
                      isSubscribed ? "bg-zinc-800 text-zinc-400" : "bg-orange-500 text-black"
                    )}
                  >
                    {isSubscribed ? <CheckCircle className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={handleToggleLike}
                  className={cn(
                    "p-3 rounded-full bg-zinc-900/40 backdrop-blur-md transition-all active:scale-90",
                    liked ? "text-orange-500" : "text-white hover:bg-zinc-800/60"
                  )}
                >
                  <Heart className={cn("w-7 h-7", liked && "fill-current")} />
                </button>
                <span className="text-xs font-bold text-white drop-shadow-md">{likeCount.toLocaleString()}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button onClick={handleOpenComments} className="p-3 rounded-full bg-zinc-900/40 backdrop-blur-md text-white hover:bg-zinc-800/60 transition-all active:scale-90">
                  <MessageCircle className="w-7 h-7" />
                </button>
                <span className="text-xs font-bold text-white drop-shadow-md">{comments.length > 0 ? comments.length : ((video as any).comment_count || 0)}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button className="p-3 rounded-full bg-zinc-900/40 backdrop-blur-md text-white hover:bg-zinc-800/60 transition-all active:scale-90">
                  <Share2 className="w-7 h-7" />
                </button>
                <span className="text-xs font-bold text-white drop-shadow-md">Share</span>
              </div>

              <button className="p-3 rounded-full bg-zinc-900/40 backdrop-blur-md text-white hover:bg-zinc-800/60 transition-all active:scale-90">
                <MoreVertical className="w-7 h-7" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-zinc-900/40 backdrop-blur-md border border-white/10 flex items-center justify-center animate-spin-slow">
                <Music className="w-6 h-6 text-white" />
              </div>
            </div>

            {/* Bottom Info */}
            <div className="absolute bottom-8 left-4 right-16 z-10 pointer-events-auto space-y-4">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white drop-shadow-md">
                  <Link to={`/channel/${video.user_id}`} onClick={(e) => e.stopPropagation()} className="hover:underline">
                    @{video.creator_name}
                  </Link>
                </h3>
                <p className="text-sm text-zinc-100 drop-shadow-md line-clamp-2">{video.description}</p>
              </div>
              <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md w-fit px-3 py-1.5 rounded-full border border-white/10">
                <Music className="w-3 h-3 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest truncate max-w-[150px]">Original Sound - {video.creator_name}</span>
              </div>
            </div>

            {/* Play/Pause Indicator */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
                >
                  <div className="w-20 h-20 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center">
                    <Play className="w-10 h-10 text-white fill-current" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comments Slide-out Panel */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute bottom-0 left-0 right-0 h-3/4 bg-zinc-950/95 backdrop-blur-2xl rounded-t-3xl border-t border-zinc-800 z-50 flex flex-col"
          >
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold">{comments.length} Comments</h3>
              <button onClick={() => setShowComments(false)} className="text-zinc-500 py-1 px-3 hover:text-white transition-colors">Close</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
              {comments.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <img src={c.avatar_url} className="w-8 h-8 rounded-full" alt="avatar" />
                  <div>
                    <span className="text-xs font-bold text-zinc-500 mr-2">@{c.username}</span>
                    <p className="text-sm font-medium">{c.content}</p>
                  </div>
                </div>
              ))}
              {comments.length === 0 && <p className="text-sm text-zinc-500 text-center py-8">Be the first to comment!</p>}
            </div>

            {user ? (
              <form onSubmit={handlePostComment} className="p-4 border-t border-zinc-800 flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 focus:outline-none focus:border-orange-500 text-sm"
                />
                <button type="submit" disabled={!commentText.trim()} className="bg-orange-500 text-black px-4 rounded-full font-bold text-sm disabled:opacity-50">Post</button>
              </form>
            ) : (
              <div className="p-4 border-t border-zinc-800 text-center">
                <span className="text-sm text-zinc-500">Sign in to comment</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mute Toggle */}
      <button
        onClick={() => setIsMuted(!isMuted)}
        className="absolute top-12 right-6 z-30 p-2 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-all"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}

export default function Shorts({ user }: { user: any }) {
  const [shorts, setShorts] = useState<Video[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/videos?short=true')
      .then(res => res.json())
      .then(setShorts);
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / containerRef.current.clientHeight);
      setActiveIndex(index);
    }
  };

  const scrollNext = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: (activeIndex + 1) * containerRef.current.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  const scrollPrev = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: (activeIndex - 1) * containerRef.current.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-zinc-950 overflow-hidden">
      {/* Navigation Controls (Desktop) */}
      <div className="hidden lg:flex flex-col gap-4 mr-8">
        <button
          onClick={scrollPrev}
          disabled={activeIndex === 0}
          className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-800 transition-all disabled:opacity-20"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <button
          onClick={scrollNext}
          disabled={activeIndex === shorts.length - 1}
          className="p-4 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-800 transition-all disabled:opacity-20"
        >
          <ChevronDown className="w-6 h-6" />
        </button>
      </div>

      {/* Shorts Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-[calc(100vh-64px)] lg:h-[85vh] w-full max-w-[450px] snap-y snap-mandatory overflow-y-scroll no-scrollbar bg-zinc-900 shadow-2xl rounded-none lg:rounded-[40px] pt-16 lg:pt-0"
      >
        {shorts.map((short, i) => (
          <div key={short.id} className="h-full w-full snap-start">
            <ShortVideo video={short} isActive={i === activeIndex} onNext={scrollNext} user={user} />
          </div>
        ))}
        {shorts.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
            <PlaySquare className="w-16 h-16 opacity-20" />
            <p className="font-bold">No shorts available</p>
          </div>
        )}
      </div>

      {/* Sidebar Info (Desktop) */}
      <div className="hidden lg:flex flex-col gap-8 ml-8 w-64">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
          <h3 className="text-xl font-bold tracking-tight">Shorts Feed</h3>
          <p className="text-sm text-zinc-500 leading-relaxed">Swipe or use arrow keys to browse the latest trending shorts on Aloga.</p>
          <div className="flex items-center gap-2 text-orange-500 text-xs font-bold uppercase tracking-widest">
            <Zap className="w-4 h-4" /> Trending Now
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4">
          <h4 className="font-bold text-sm">Monetization Active</h4>
          <p className="text-xs text-zinc-500">Creators earn from ad impressions between videos in the shorts feed.</p>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 w-[70%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Zap } from 'lucide-react';
