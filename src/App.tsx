import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Home as HomeIcon,
  PlaySquare,
  Film,
  Upload as UploadIcon,
  User,
  Settings,
  LogOut,
  Menu,
  Search,
  Bell,
  LayoutDashboard,
  Shield,
  TrendingUp,
  History,
  ThumbsUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import Shorts from './pages/Shorts';
import Watch from './pages/Watch';
import Channel from './pages/Channel';
import Upload from './pages/Upload';
import Studio from './pages/Studio';
import Admin from './pages/Admin';
import Login from './pages/Login';
import HistoryPage from './pages/History';
import SearchPage from './pages/Search';
import Trending from './pages/Trending';
import Liked from './pages/Liked';
import { cn } from './lib/utils';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
          }
        })
        .catch(console.error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      fetch('/api/subscriptions/mine', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(setSubscriptions)
        .catch(console.error);

      fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(setNotifications)
        .catch(console.error);
    } else {
      setSubscriptions([]);
      setNotifications([]);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isShortsPage = location.pathname === '/shorts';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-orange-500/30">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 z-50 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
              <Film className="w-5 h-5 text-black" />
            </div>
            <span className="text-xl font-bold tracking-tighter hidden sm:block">ALOGA</span>
          </Link>
        </div>

        <div className="flex-1 max-w-2xl mx-8 hidden md:block">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="Search creators, videos, shorts..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-full py-2.5 pl-12 pr-4 focus:outline-none focus:border-orange-500/50 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/search?q=${searchQuery}`)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <Link to="/upload" className="p-2 hover:bg-zinc-900 rounded-full transition-colors relative group">
                <UploadIcon className="w-6 h-6" />
                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Upload</span>
              </Link>
              <div className="relative group/bell">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-zinc-900 rounded-full transition-colors relative"
                >
                  <Bell className="w-6 h-6" />
                  {notifications.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-zinc-950" />}
                </button>
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-800 flex justify-between items-center">
                      <h3 className="font-bold">Notifications</h3>
                      <button onClick={() => setShowNotifications(false)} className="text-xs text-zinc-500 hover:text-white transition-colors">Close</button>
                    </div>
                    <div className="max-h-96 overflow-y-auto no-scrollbar">
                      {notifications.length > 0 ? notifications.map((n: any) => (
                        <Link
                          key={n.id}
                          to={n.link}
                          onClick={() => setShowNotifications(false)}
                          className="flex gap-3 p-4 hover:bg-zinc-800 transition-colors border-b border-zinc-800/50"
                        >
                          <img src={n.avatar_url} alt="avatar" className="w-10 h-10 rounded-full shrink-0 object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-zinc-200 line-clamp-2">{n.message}</p>
                            <p className="text-xs text-zinc-500 mt-1">{format(new Date(n.created_at), 'MMM d, h:mm a')}</p>
                          </div>
                        </Link>
                      )) : (
                        <div className="p-8 text-center text-zinc-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">You have no new notifications.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative group">
                <button className="flex items-center gap-2 p-1 hover:bg-zinc-900 rounded-full transition-colors">
                  <img
                    src={user.avatar_url}
                    alt="avatar"
                    className="w-8 h-8 rounded-full object-cover border border-zinc-800"
                    referrerPolicy="no-referrer"
                  />
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="px-4 py-2 border-b border-zinc-800 mb-2">
                    <p className="font-bold truncate">{user.username}</p>
                    <p className="text-xs text-zinc-500 truncate">Creator Account</p>
                  </div>
                  <Link to={`/channel/${user.id}`} className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors text-sm">
                    <User className="w-4 h-4" /> Your Channel
                  </Link>
                  <Link to="/studio" className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors text-sm">
                    <LayoutDashboard className="w-4 h-4" /> Creator Studio
                  </Link>
                  {user.isAdmin && (
                    <Link to="/admin" className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-800 transition-colors text-sm text-orange-500">
                      <Shield className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                  <div className="h-px bg-zinc-800 my-2" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-orange-500/10 text-orange-500 transition-colors text-sm font-bold"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-orange-500 hover:bg-orange-600 text-black px-6 py-2 rounded-full font-bold text-sm transition-all active:scale-95 shadow-lg shadow-orange-500/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-900 z-50 flex items-center justify-around px-2">
        <Link to="/" className={cn("flex flex-col items-center gap-1 p-2 transition-colors", location.pathname === '/' ? "text-orange-500" : "text-zinc-500 hover:text-white")}>
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">Home</span>
        </Link>
        <Link to="/shorts" className={cn("flex flex-col items-center gap-1 p-2 transition-colors", isShortsPage ? "text-orange-500" : "text-zinc-500 hover:text-white")}>
          <PlaySquare className="w-6 h-6" />
          <span className="text-[10px] font-bold">Shorts</span>
        </Link>
        <Link to="/upload" className="flex flex-col items-center justify-center p-3 relative -top-5 bg-orange-500 text-black rounded-full shadow-lg shadow-orange-500/20 active:scale-95 transition-transform">
          <UploadIcon className="w-6 h-6" />
        </Link>
        <Link to="/history" className={cn("flex flex-col items-center gap-1 p-2 transition-colors", location.pathname === '/history' ? "text-orange-500" : "text-zinc-500 hover:text-white")}>
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold">History</span>
        </Link>
        {user ? (
          <Link to={`/channel/${user.id}`} className={cn("flex flex-col items-center gap-1 p-2 transition-colors", location.pathname.startsWith('/channel') ? "text-orange-500" : "text-zinc-500 hover:text-white")}>
            <img src={user.avatar_url} alt="avatar" className="w-6 h-6 rounded-full border border-current object-cover" referrerPolicy="no-referrer" />
            <span className="text-[10px] font-bold">You</span>
          </Link>
        ) : (
          <Link to="/login" className="flex flex-col items-center gap-1 p-2 text-zinc-500 hover:text-white transition-colors">
            <User className="w-6 h-6" />
            <span className="text-[10px] font-bold">Sign in</span>
          </Link>
        )}
      </nav>

      {/* Sidebar (Desktop Only) */}
      <aside
        className={cn(
          "hidden md:block fixed left-0 top-16 bottom-0 bg-zinc-950 border-r border-zinc-900 transition-all duration-300 z-40 overflow-y-auto no-scrollbar",
          isSidebarOpen ? "w-64" : "w-20",
          isShortsPage && "hidden"
        )}
      >
        <div className="p-4 space-y-6">
          <div className="space-y-1">
            <SidebarItem icon={HomeIcon} label="Home" to="/" active={location.pathname === '/'} collapsed={!isSidebarOpen} />
            <SidebarItem icon={PlaySquare} label="Shorts" to="/shorts" active={location.pathname === '/shorts'} collapsed={!isSidebarOpen} />
            <SidebarItem icon={TrendingUp} label="Trending" to="/trending" active={location.pathname === '/trending'} collapsed={!isSidebarOpen} />
          </div>

          <div className="h-px bg-zinc-900 mx-2" />

          <div className="space-y-1">
            <SidebarItem icon={History} label="History" to="/history" collapsed={!isSidebarOpen} />
            <SidebarItem icon={ThumbsUp} label="Liked Videos" to="/liked" collapsed={!isSidebarOpen} />
          </div>

          {user && (
            <>
              <div className="h-px bg-zinc-900 mx-2" />
              <div className="px-4 py-2">
                <p className={cn("text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4", !isSidebarOpen && "hidden")}>Subscriptions</p>
                <div className="space-y-3">
                  {subscriptions.map((sub: any) => (
                    <Link key={sub.id} to={`/channel/${sub.id}`} className="flex items-center gap-3 group">
                      <img
                        src={sub.avatar_url}
                        alt="sub"
                        className="w-8 h-8 rounded-full bg-zinc-800 object-cover border border-zinc-800"
                        referrerPolicy="no-referrer"
                      />
                      {isSidebarOpen && <span className="text-sm text-zinc-400 group-hover:text-white transition-colors truncate">{sub.username}</span>}
                    </Link>
                  ))}
                  {subscriptions.length === 0 && isSidebarOpen && (
                    <p className="text-xs text-zinc-500">No subscriptions yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={cn(
          "transition-all duration-300 pt-16 min-h-screen pb-20 md:pb-0",
          isShortsPage ? "md:pl-0" : (isSidebarOpen ? "md:pl-64" : "md:pl-20")
        )}
      >
        <div className={cn("p-4 md:p-8", isShortsPage && "p-0")}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shorts" element={<Shorts user={user} />} />
            <Route path="/watch/:id" element={<Watch user={user} />} />
            <Route path="/channel/:id" element={<Channel user={user} />} />
            <Route path="/upload" element={<Upload user={user} />} />
            <Route path="/studio" element={<Studio user={user} />} />
            <Route path="/admin" element={<Admin user={user} />} />
            <Route path="/history" element={<HistoryPage user={user} />} />
            <Route path="/trending" element={<Trending />} />
            <Route path="/liked" element={<Liked user={user} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/login" element={<Login onLogin={setUser} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, to, active, collapsed }: any) {
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-4 px-4 py-3 rounded-xl transition-all group",
        active ? "bg-orange-500/10 text-orange-500" : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
        collapsed && "justify-center px-0"
      )}
    >
      <Icon className={cn("w-6 h-6", active && "text-orange-500")} />
      {!collapsed && <span className="text-sm font-medium">{label}</span>}
      {collapsed && (
        <span className="absolute left-20 bg-zinc-800 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          {label}
        </span>
      )}
    </Link>
  );
}
