import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, MoreVertical, ThumbsUp, CheckCircle } from 'lucide-react';
import { Video } from '../types';
import { format } from 'date-fns';

export default function Liked({ user }: { user: any }) {
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }
        fetch('/api/videos/liked', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(res => res.json())
            .then(data => {
                setVideos(data || []);
                setLoading(false);
            });
    }, [user]);

    if (!user) return <div className="text-center py-20 text-zinc-500">Please sign in to view your liked videos.</div>;
    if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" /></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8 border-b border-zinc-900 pb-6">
                <div className="p-4 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
                    <ThumbsUp className="w-8 h-8 text-black" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Liked Videos</h1>
                    <p className="text-zinc-500 mt-1">{videos.length} videos</p>
                </div>
            </div>

            {videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {videos.map((video) => (
                        <Link key={video.id} to={`/watch/${video.id}`} className="group flex flex-col gap-3">
                            <div className="relative aspect-video rounded-2xl overflow-hidden bg-zinc-900 shadow-xl">
                                <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-2xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
                                        <Play className="w-6 h-6 text-black fill-current" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 px-1">
                                <img src={video.creator_avatar} alt="avatar" className="w-10 h-10 rounded-full bg-zinc-800 shrink-0 object-cover" referrerPolicy="no-referrer" />
                                <div className="flex-1 min-w-0 space-y-1">
                                    <h3 className="font-bold text-zinc-100 line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors">{video.title}</h3>
                                    <div className="flex flex-col text-xs text-zinc-500">
                                        <span className="flex items-center gap-1">{video.creator_name} <CheckCircle className="w-3 h-3 fill-zinc-500 text-black" /></span>
                                        <span>{video.views.toLocaleString()} views • {format(new Date(video.created_at), 'MMM d, yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-zinc-500 space-y-4">
                    <ThumbsUp className="w-16 h-16 mx-auto opacity-20" />
                    <p>You haven't liked any videos yet.</p>
                </div>
            )}
        </div>
    );
}
