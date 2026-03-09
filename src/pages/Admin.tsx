import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Flag,
  Users,
  Video as VideoIcon,
  BarChart2,
  Settings,
  MoreVertical,
  Search,
  Filter,
  Eye,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Report } from '../types';
import { cn, formatDate } from '../lib/utils';
import { format } from 'date-fns';

export default function Admin({ user }: { user: any }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');

  useEffect(() => {
    if (!user?.isAdmin) return;

    const fetchData = async () => {
      try {
        const [reportsRes, statsRes] = await Promise.all([
          fetch('/api/admin/reports', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        ]);

        const reportsData = await reportsRes.json();
        const statsData = await statsRes.json();

        setReports(reportsData);
        setStats(statsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleModerate = async (videoId: number, action: 'delete' | 'flag' | 'approve') => {
    try {
      const res = await fetch('/api/admin/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ video_id: videoId, action })
      });
      if (res.ok) {
        setReports(reports.filter(r => r.video_id !== videoId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user?.isAdmin) return <div className="text-center py-20 text-orange-500 font-bold">Access Denied: Administrator privileges required.</div>;
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
            <Shield className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
            <p className="text-zinc-500 mt-1">Manage platform safety, moderate content, and oversee system operations.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors border border-zinc-800">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatCard label="Platform Revenue" value={`$${stats?.platformRevenue?.toFixed(2) || '0.00'}`} icon={BarChart2} />
        <AdminStatCard label="Total Users" value={stats?.totalUsers || '0'} icon={Users} />
        <AdminStatCard label="Active Videos" value={stats?.totalVideos || '0'} icon={VideoIcon} />
        <AdminStatCard label="Total Views" value={stats?.totalViews?.toLocaleString() || '0'} icon={Eye} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-3 space-y-2">
          <TabButton id="reports" label="Moderation Queue" icon={Flag} active={activeTab === 'reports'} onClick={setActiveTab} />
          <TabButton id="users" label="User Management" icon={Users} active={activeTab === 'users'} onClick={setActiveTab} />
          <TabButton id="analytics" label="System Analytics" icon={BarChart2} active={activeTab === 'analytics'} onClick={setActiveTab} />
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-9">
          {activeTab === 'reports' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50 backdrop-blur-md">
                <h3 className="text-xl font-bold">Moderation Queue</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      className="bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-orange-500 transition-all"
                    />
                  </div>
                  <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800">
                    <Filter className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-zinc-800">
                {reports.length > 0 ? reports.map((report) => (
                  <div key={report.id} className="p-6 hover:bg-zinc-800/30 transition-colors group">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-500/10 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">Reported for: {report.reason}</p>
                            <p className="text-xs text-zinc-500">Reported by {report.reporter_name} • {formatDate(report.created_at, 'MMM d, yyyy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                          <div className="w-24 aspect-video bg-zinc-900 rounded-lg overflow-hidden shrink-0">
                            <img src={`https://picsum.photos/seed/${report.video_id}/200/112`} alt="thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">{report.video_title}</p>
                            <Link to={`/watch/${report.video_id}`} className="text-xs text-orange-500 hover:underline flex items-center gap-1 mt-1">
                              Review Content <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleModerate(report.video_id, 'approve')}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-orange-500/10 hover:text-orange-500 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-orange-500/20"
                        >
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => handleModerate(report.video_id, 'flag')}
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-orange-500/10 hover:text-orange-500 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-orange-500/20"
                        >
                          <Flag className="w-4 h-4" /> Flag
                        </button>
                        <button
                          onClick={() => handleModerate(report.video_id, 'delete')}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-black rounded-xl text-xs font-bold transition-all border border-orange-500/20"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-20 text-center text-zinc-500 space-y-4">
                    <CheckCircle className="w-16 h-16 mx-auto opacity-20" />
                    <p>Moderation queue is empty. All clear!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-[32px] p-20 text-center text-zinc-500">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>User management interface is coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AdminStatCard({ label, value, icon: Icon }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4 hover:border-zinc-700 transition-all group">
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-2xl transition-all group-hover:scale-110 bg-orange-500/10">
          <Icon className="w-6 h-6 text-orange-500" />
        </div>
      </div>
      <div>
        <p className="text-zinc-500 text-sm font-medium">{label}</p>
        <h3 className="text-3xl font-bold mt-1">{value}</h3>
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
