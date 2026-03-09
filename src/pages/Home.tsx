import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  MoreVertical,
  Clock,
  CheckCircle,
  PlaySquare,
  TrendingUp,
  Users,
  Zap,
  Shield,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { Video } from '../types';
import { cn, formatDate } from '../lib/utils';
import AdBanner from '../components/AdBanner';

export default function Home() {
  const [trending, setTrending] = useState<Video[]>([]);
  const [recommended, setRecommended] = useState<Video[]>([]);
  const [shorts, setShorts] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));

    Promise.all([
      fetch('/api/videos?short=false&category=trending').then(res => res.json()),
      fetch('/api/videos?short=false').then(res => res.json()),
      fetch('/api/videos?short=true').then(res => res.json())
    ]).then(([tData, rData, sData]) => {
      // Mocking trending by sorting by views if API doesn't filter perfectly
      setTrending(rData.sort((a: any, b: any) => b.views - a.views).slice(0, 4));
      // Mocking recommended by shuffling
      setRecommended(rData.sort(() => 0.5 - Math.random()).slice(0, 8));

      setShorts(sData);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" /></div>;

  return (
    <div className="space-y-12 pb-20 max-w-7xl mx-auto px-4 mt-8">

      {/* 1st Layer: Trending */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20">
            <TrendingUp className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Trending</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trending.map((video) => (
            <div key={video.id}>
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      </section>

      {/* AdSense Slot */}
      <div className="max-w-4xl mx-auto py-4">
        <AdBanner slotId="847294829" format="horizontal" />
      </div>

      {/* 2nd Layer: Recommended / FYP */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20">
            <Sparkles className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight">Recommended for You</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recommended.map((video) => (
            <div key={video.id}>
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      </section>

      {/* 3rd Layer: Shorts */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-lg shadow-lg shadow-orange-500/20">
              <PlaySquare className="w-5 h-5 text-black" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight">Shorts</h3>
          </div>
          <Link to="/shorts" className="text-orange-500 text-sm font-bold hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {shorts.slice(0, 6).map((short) => (
            <Link
              key={short.id}
              to={`/shorts?id=${short.id}`}
              className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-zinc-900 shadow-xl"
            >
              <img
                src={short.thumbnail_url}
                alt={short.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 space-y-1">
                <h4 className="text-sm font-bold line-clamp-2 leading-tight group-hover:text-orange-400 transition-colors">{short.title}</h4>
                <p className="text-[10px] text-zinc-400 font-medium">{short.views.toLocaleString()} views</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  return (
    <Link to={`/watch/${video.id}`} className="group flex flex-col gap-3">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 shadow-xl">
        <img
          src={video.thumbnail_url}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="w-6 h-6 text-black fill-current" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold border border-white/10">
          {Math.floor((video.id * 7) % 15 + 1)}:{(video.id * 13 % 60).toString().padStart(2, '0')}
        </div>
      </div>

      <div className="flex gap-3 px-1">
        <Link to={`/channel/${video.user_id}`} className="shrink-0 pt-1">
          <img
            src={video.creator_avatar}
            alt="avatar"
            className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-900"
            referrerPolicy="no-referrer"
          />
        </Link>
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-bold text-zinc-100 line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors">
            {video.title}
          </h3>
          <div className="flex flex-col text-xs text-zinc-500">
            <Link to={`/channel/${video.user_id}`} className="hover:text-white transition-colors flex items-center gap-1">
              {video.creator_name}
              <CheckCircle className="w-3 h-3 fill-zinc-500 text-black" />
            </Link>
            <span>{video.views.toLocaleString()} views • {formatDate(video.created_at, 'MMM d, yyyy')}</span>
          </div>
        </div>
        <button className="p-1 hover:bg-zinc-900 rounded-lg transition-colors h-fit opacity-0 group-hover:opacity-100">
          <MoreVertical className="w-4 h-4 text-zinc-500" />
        </button>
      </div>
    </Link>
  );
}



import { Film, DollarSign } from 'lucide-react';
