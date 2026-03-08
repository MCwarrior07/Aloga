import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Video } from '../types';
import { Search as SearchIcon, Play, MoreVertical, CheckCircle, Filter } from 'lucide-react';

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/videos?search=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => {
                setResults(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [query]);

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <SearchIcon className="w-8 h-8 text-orange-500" />
                    Results for "{query}"
                </h1>
                <button className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-sm font-bold hover:bg-zinc-800 transition-colors w-fit">
                    <Filter className="w-4 h-4" /> Filters
                </button>
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : results.length > 0 ? (
                <div className="space-y-4">
                    {results.map((video) => (
                        <Link key={video.id} to={`/watch/${video.id}`} className="flex flex-col md:flex-row gap-4 p-4 hover:bg-zinc-900/50 rounded-2xl transition-colors group">
                            <div className="w-full md:w-80 aspect-video bg-zinc-900 rounded-xl overflow-hidden relative shrink-0 shadow-lg">
                                <img
                                    src={video.thumbnail_url}
                                    alt={video.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Play className="w-10 h-10 text-white fill-current drop-shadow-lg" />
                                </div>
                                <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-xs font-bold">
                                    {Math.floor((video.id * 7) % 15 + 1)}:{(video.id * 13 % 60).toString().padStart(2, '0')}
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 pr-4 space-y-2">
                                <h3 className="font-bold text-lg md:text-xl md:mb-1 group-hover:text-orange-500 transition-colors line-clamp-2 md:line-clamp-none">{video.title}</h3>
                                <div className="text-xs text-zinc-500 hidden md:block">
                                    {video.views.toLocaleString()} views • {format(new Date(video.created_at), 'MMM d, yyyy')}
                                </div>
                                <div className="flex items-center gap-2 mt-2 md:mt-4">
                                    <object><Link to={`/channel/${video.user_id}`} className="shrink-0 group/creator">
                                        <img
                                            src={video.creator_avatar}
                                            alt="avatar"
                                            className="w-8 h-8 rounded-full border border-zinc-800"
                                            referrerPolicy="no-referrer"
                                        />
                                    </Link></object>
                                    <object><Link to={`/channel/${video.user_id}`} className="text-sm font-bold text-zinc-400 hover:text-white transition-colors flex items-center gap-1">
                                        {video.creator_name}
                                        <CheckCircle className="w-3 h-3 fill-zinc-500 text-black" />
                                    </Link></object>
                                </div>
                                <p className="text-sm text-zinc-500 mt-2 line-clamp-1 md:line-clamp-2">{video.description}</p>
                            </div>
                            <button className="h-fit p-2 hover:bg-zinc-800 rounded-full transition-colors hidden md:block opacity-0 group-hover:opacity-100">
                                <MoreVertical className="w-5 h-5 text-zinc-400 hover:text-white" />
                            </button>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 text-zinc-500 space-y-4">
                    <SearchIcon className="w-16 h-16 mx-auto opacity-20" />
                    <h2 className="text-2xl font-bold text-white">No results found</h2>
                    <p>Try different keywords or remove search filters</p>
                </div>
            )}
        </div>
    );
}
