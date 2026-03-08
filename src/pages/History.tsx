import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Video } from '../types';
import { History as HistoryIcon, Play, MoreVertical } from 'lucide-react';

export default function History({ user }: { user: any }) {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetch('/api/history', {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
                .then(res => res.json())
                .then(data => {
                    setHistory(data);
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, [user]);

    if (!user) return <div className="text-center py-20 text-zinc-500">Please sign in to view your watch history.</div>;
    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="flex items-center gap-4 mb-8">
                <HistoryIcon className="w-8 h-8 text-white" />
                <h1 className="text-3xl font-bold">Watch History</h1>
            </div>

            {history.length > 0 ? (
                <div className="space-y-4">
                    {history.map((item) => (
                        <Link key={item.history_id} to={`/watch/${item.id}`} className="flex gap-4 p-4 hover:bg-zinc-900 rounded-2xl transition-colors group">
                            <div className="w-48 aspect-video bg-zinc-800 rounded-xl overflow-hidden relative shrink-0 shadow-lg">
                                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="w-8 h-8 text-white fill-current drop-shadow-lg" />
                                </div>
                                <div className="absolute bottom-1 right-1 bg-black/80 px-1 py-0.5 rounded text-[10px] font-bold">
                                    {Math.floor((item.id * 7) % 15 + 1)}:{(item.id * 13 % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                                <h3 className="font-bold text-lg mb-1 group-hover:text-orange-500 transition-colors line-clamp-2">{item.title}</h3>
                                <p className="text-sm text-zinc-400 mb-1">{item.creator_name}</p>
                                <div className="text-xs text-zinc-500">
                                    {item.views.toLocaleString()} views • Watched {format(new Date(item.watched_at), 'MMM d, h:mm a')}
                                </div>
                                <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{item.description}</p>
                            </div>
                            <button className="h-fit p-2 hover:bg-zinc-800 rounded-full transition-colors opacity-0 group-hover:opacity-100">
                                <MoreVertical className="w-5 h-5 text-zinc-400 hover:text-white" />
                            </button>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-zinc-500 space-y-4">
                    <HistoryIcon className="w-16 h-16 mx-auto opacity-20" />
                    <p>Your watch history is empty.</p>
                </div>
            )}
        </div>
    );
}
