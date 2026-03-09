import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  BarChart2,
  Video as VideoIcon,
  DollarSign,
  Users,
  Settings,
  Plus,
  MoreVertical,
  Eye,
  MessageSquare,
  ThumbsUp,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Calendar,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatDate } from '../lib/utils';
import AdBanner from '../components/AdBanner';
import { format } from 'date-fns';

export default function Studio({ user }: { user: any }) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) return;
    fetch('/api/studio/stats', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, [user]);

  if (!user) return <div className="text-center py-20 text-zinc-500">Please sign in to access Creator Studio</div>;
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto space-y-8 pb-20"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
            <BarChart2 className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Channel Studio</h1>
            <p className="text-zinc-500 mt-1">Manage your content, track performance, and grow your audience.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/upload"
            className="bg-orange-500 hover:bg-orange-600 text-black px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-5 h-5" /> Create
          </Link>
          <button className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors border border-zinc-800">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Subscribers"
          value={stats.subscribers.toLocaleString()}
          change="+12.5%"
          icon={Users}
          color="blue"
        />
        <StatCard
          label="Channel Views"
          value={stats.totalViews.toLocaleString()}
          change="+8.2%"
          icon={Eye}
          color="purple"
        />
        <StatCard
          label="Watch Time (hrs)"
          value={stats.watchTime.toLocaleString()}
          change="+15.1%"
          icon={Clock}
          color="orange"
        />
        <StatCard
          label="Estimated Revenue"
          value={`$${stats.totalEarnings.toFixed(2)}`}
          change="+24.3%"
          icon={DollarSign}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <TabButton id="overview" label="Dashboard" icon={BarChart2} active={activeTab === 'overview'} onClick={setActiveTab} />
          <TabButton id="content" label="Content" icon={VideoIcon} active={activeTab === 'content'} onClick={setActiveTab} />
          <TabButton id="analytics" label="Analytics" icon={TrendingUp} active={activeTab === 'analytics'} onClick={setActiveTab} />
          <TabButton id="monetization" label="Monetization" icon={DollarSign} active={activeTab === 'monetization'} onClick={setActiveTab} />
          <TabButton id="comments" label="Comments" icon={MessageSquare} active={activeTab === 'comments'} onClick={setActiveTab} />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9 space-y-8">
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Recent Video Performance */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Latest Video Performance</h3>
                  <button onClick={() => setActiveTab('content')} className="text-orange-500 text-sm font-bold hover:underline">See all content</button>
                </div>
                {stats.videos.length > 0 ? (
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="aspect-video bg-zinc-950 rounded-2xl overflow-hidden relative group">
                        <img
                          src={stats.videos[0].thumbnail_url}
                          alt="latest"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <h4 className="font-bold text-lg leading-tight">{stats.videos[0].title}</h4>
                      <p className="text-xs text-zinc-500">Published {formatDate(stats.videos[0].created_at, 'MMM d, yyyy')}</p>
                    </div>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                        <div className="flex items-center gap-3">
                          <Eye className="w-5 h-5 text-zinc-500" />
                          <span className="text-sm font-medium">Views</span>
                        </div>
                        <span className="font-bold">{stats.videos[0].views.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                        <div className="flex items-center gap-3">
                          <ThumbsUp className="w-5 h-5 text-zinc-500" />
                          <span className="text-sm font-medium">Likes</span>
                        </div>
                        <span className="font-bold">{stats.videos[0].likes.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                        <div className="flex items-center gap-3">
                          <MessageSquare className="w-5 h-5 text-zinc-500" />
                          <span className="text-sm font-medium">Comments</span>
                        </div>
                        <span className="font-bold">{stats.videos[0].comment_count || 0}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-20 text-center text-zinc-500">
                    <VideoIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p>No videos uploaded yet.</p>
                  </div>
                )}
              </div>

              {/* Channel Analytics Chart Mockup */}
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Channel Growth</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Last 28 Days</span>
                  </div>
                </div>
                <div className="h-64 flex items-end gap-2">
                  {stats.chartData.map((views: number, i: number) => {
                    const maxViews = Math.max(...stats.chartData, 1);
                    const heightPercent = Math.max((views / maxViews) * 100, 5); // min 5% height
                    return (
                      <div key={i} className="flex-1 bg-orange-500/20 rounded-t-lg relative group">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ delay: i * 0.05 }}
                          className="absolute bottom-0 left-0 right-0 bg-orange-500 rounded-t-lg group-hover:bg-orange-400 transition-colors"
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          {views.toLocaleString()} views
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2">
                  <span>Week 1</span>
                  <span>Week 2</span>
                  <span>Week 3</span>
                  <span>Week 4</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'content' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                <h3 className="text-xl font-bold">Channel Content</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Filter videos..."
                      className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                  <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <th className="px-6 py-4">Video</th>
                      <th className="px-6 py-4">Visibility</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Views</th>
                      <th className="px-6 py-4">Comments</th>
                      <th className="px-6 py-4">Likes</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {stats.videos.map((video: any) => (
                      <tr key={video.id} className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-24 aspect-video bg-zinc-950 rounded-lg overflow-hidden shrink-0">
                              <img src={video.thumbnail_url} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate max-w-[200px]">{video.title}</p>
                              <p className="text-xs text-zinc-500 mt-1 truncate max-w-[200px]">{video.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full" />
                            <span className="text-xs font-medium">Public</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-400">
                          {formatDate(video.created_at, 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">{video.views.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm font-medium">{video.comment_count || 0}</td>
                        <td className="px-6 py-4 text-sm font-medium">{video.likes.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'monetization' && (
            <div className="space-y-8">
              <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-500/10 rounded-2xl">
                    <DollarSign className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Monetization Overview</h3>
                    <p className="text-zinc-500">You are currently earning 70% of ad revenue from your content.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Available Balance</p>
                    <h4 className="text-3xl font-bold text-orange-500">${stats.totalEarnings.toFixed(2)}</h4>
                    <button className="w-full mt-4 bg-orange-500 hover:bg-orange-600 text-black py-2 rounded-xl text-sm font-bold transition-all active:scale-95">
                      Withdraw Funds
                    </button>
                  </div>
                  <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Platform Share (30%)</p>
                    <h4 className="text-3xl font-bold text-zinc-400">${(stats.totalEarnings * 0.428).toFixed(2)}</h4>
                    <p className="text-xs text-zinc-500">Platform fee deducted at source</p>
                  </div>
                  <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-2">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">RPM (Revenue per 1k)</p>
                    <h4 className="text-3xl font-bold">$4.20</h4>
                    <p className="text-xs text-zinc-500">Average across all content</p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-zinc-800">
                  <h3 className="text-xl font-bold">Recent Payouts</h3>
                </div>
                <div className="divide-y divide-zinc-800">
                  {[
                    { date: '2024-02-01', amount: 450.00, status: 'Completed' },
                    { date: '2024-01-01', amount: 380.50, status: 'Completed' },
                    { date: '2023-12-01', amount: 520.25, status: 'Completed' },
                  ].map((payout, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-zinc-800/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-zinc-800 rounded-lg">
                          <Calendar className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">Monthly Ad Share</p>
                          <p className="text-xs text-zinc-500">{payout.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">${payout.amount.toFixed(2)}</p>
                        <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">{payout.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-zinc-700 transition-all group">
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-2xl transition-all group-hover:scale-110 bg-orange-500/10">
          <Icon className="w-6 h-6 text-orange-500" />
        </div>
        <div className="flex items-center gap-1 text-orange-500 text-xs font-bold">
          {/* Removed 'change' prop as it's no longer passed */} <ArrowUpRight className="w-3 h-3" />
        </div>
      </div>
      <div>
        <p className="text-zinc-500 text-sm font-medium">{label}</p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
      </div>
    </div>
  );
}

function TabButton({ id, label, icon: Icon, active, onClick }: any) {
  return (
    <button
      onClick={() => onClick(id)}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all",
        active ? "bg-orange-500 text-black shadow-lg shadow-orange-500/20" : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
      )}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );
}
