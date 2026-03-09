import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  CheckCircle,
  Users,
  Video as VideoIcon,
  Play,
  MoreVertical,
  Search,
  Filter,
  MessageSquare,
  ThumbsUp,
  Share2,
  Bell,
  UserPlus,
  UserMinus,
  Upload
} from 'lucide-react';
import { Video } from '../types';
import { cn, formatDate } from '../lib/utils';
import AdBanner from '../components/AdBanner';
import { format } from 'date-fns';

export default function Channel({ user }: { user: any }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('videos');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    // Fetch creator info and videos
    Promise.all([
      fetch(`/api/users/${id}`).then(res => res.json()),
      fetch(`/api/videos`).then(res => res.json())
    ]).then(([creatorData, allVideos]) => {
      if (creatorData.error) {
        navigate('/');
        return;
      }
      setCreator(creatorData);

      const creatorVideos = allVideos.filter((v: Video) => v.user_id === Number(id));
      setVideos(creatorVideos);

      // Check subscription status
      if (user) {
        fetch(`/api/subscriptions/check/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => res.json())
          .then(subData => setIsSubscribed(subData.subscribed));
      }

      setLoading(false);
    });
  }, [id, user, navigate]);

  const handleToggleSubscribe = async () => {
    if (!user) return navigate('/login');
    try {
      const res = await fetch('/api/subscriptions/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ following_id: Number(id) })
      });
      const data = await res.json();
      setIsSubscribed(data.subscribed);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8">
      {/* Banner */}
      <div className="h-48 md:h-64 rounded-[40px] overflow-hidden relative group">
        <img
          src={creator.banner_url}
          alt="banner"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          <div className="relative">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-8 border-zinc-950 overflow-hidden bg-zinc-900 shadow-2xl">
              <img
                src={creator.avatar_url}
                alt="avatar"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute bottom-2 right-2 bg-orange-500 rounded-full p-2 border-4 border-zinc-950 shadow-xl">
              <CheckCircle className="w-4 h-4 text-black fill-current" />
            </div>
          </div>
          <div className="pb-2 space-y-1">
            <h1 className="text-4xl font-bold tracking-tight flex items-center gap-2 justify-center md:justify-start">
              {creator.username}
            </h1>
            <div className="flex items-center gap-4 text-zinc-500 text-sm font-medium justify-center md:justify-start">
              <span>@{creator.username.toLowerCase().replace(' ', '')}</span>
              <span>•</span>
              <span>{creator.subscribers.toLocaleString()} subscribers</span>
              <span>•</span>
              <span>{creator.video_count} videos</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pb-2 justify-center">
          <button className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-2xl border border-zinc-800 transition-all active:scale-95">
            <Bell className="w-6 h-6" />
          </button>
          <button
            onClick={handleToggleSubscribe}
            className={cn(
              "px-8 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-xl flex items-center gap-2",
              isSubscribed
                ? "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 border border-zinc-700"
                : "bg-white text-black hover:bg-zinc-200 shadow-white/10"
            )}
          >
            {isSubscribed ? <UserMinus className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            {isSubscribed ? 'Subscribed' : 'Subscribe'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-900 sticky top-16 bg-zinc-950/80 backdrop-blur-md z-30 -mx-4 px-8">
        <div className="flex items-center gap-8">
          <TabButton id="videos" label="Videos" active={activeTab === 'videos'} onClick={setActiveTab} />
          <TabButton id="shorts" label="Shorts" active={activeTab === 'shorts'} onClick={setActiveTab} />
          <TabButton id="playlists" label="Playlists" active={activeTab === 'playlists'} onClick={setActiveTab} />
          <TabButton id="community" label="Community" active={activeTab === 'community'} onClick={setActiveTab} />
          <TabButton id="about" label="About" active={activeTab === 'about'} onClick={setActiveTab} />
          <div className="flex-1" />
          <button className="p-2 hover:bg-zinc-900 rounded-lg transition-colors">
            <Search className="w-5 h-5 text-zinc-500" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-8">
        {activeTab === 'videos' && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Latest Uploads</h3>
              <button className="flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-white transition-colors">
                <Filter className="w-4 h-4" /> Sort by
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
              {videos.map((video) => (
                <div key={video.id}>
                  <VideoCard video={video} />
                </div>
              ))}
            </div>
            {videos.length === 0 && (
              <div className="text-center py-20 text-zinc-500 space-y-4">
                <VideoIcon className="w-16 h-16 mx-auto opacity-20" />
                <p>This creator hasn't uploaded any videos yet.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Description</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Welcome to my channel! I create content about technology, lifestyle, and creative projects.
                  Don't forget to subscribe and hit the bell icon to stay updated with my latest uploads.
                  <br /><br />
                  For business inquiries: business@{creator.username.toLowerCase().replace(' ', '')}.com
                </p>
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold">Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a href="#" className="flex items-center gap-3 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-orange-500/30 transition-all group">
                    <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-orange-500/10 transition-colors">
                      <Share2 className="w-5 h-5 group-hover:text-orange-500" />
                    </div>
                    <span className="text-sm font-bold">Twitter / X</span>
                  </a>
                  <a href="#" className="flex items-center gap-3 p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:border-orange-500/30 transition-all group">
                    <div className="p-2 bg-zinc-800 rounded-lg group-hover:bg-orange-500/10 transition-colors">
                      <Share2 className="w-5 h-5 group-hover:text-orange-500" />
                    </div>
                    <span className="text-sm font-bold">Instagram</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="lg:col-span-4 space-y-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 space-y-6">
                <h3 className="text-xl font-bold">Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                    <span className="text-zinc-500 text-sm">Joined</span>
                    <span className="font-bold text-sm">{creator.created_at ? formatDate(creator.created_at, 'MMM d, yyyy') : 'Recently'}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-zinc-800">
                    <span className="text-zinc-500 text-sm">Total Views</span>
                    <span className="font-bold text-sm">{(creator.total_views || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-zinc-500 text-sm">Country</span>
                    <span className="font-bold text-sm">United States</span>
                  </div>
                </div>
                <button className="w-full p-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl transition-colors">
                  <Share2 className="w-5 h-5 mx-auto" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ id, label, active, onClick }: any) {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "py-4 px-2 text-sm font-bold transition-all relative",
        active ? "text-white" : "text-zinc-500 hover:text-zinc-300"
      )}
    >
      {label}
      {active && (
        <motion.div
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-t-full"
        />
      )}
    </button>
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
        <div className="flex-1 min-w-0 space-y-1">
          <h3 className="font-bold text-zinc-100 line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors">
            {video.title}
          </h3>
          <div className="flex flex-col text-xs text-zinc-500">
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
