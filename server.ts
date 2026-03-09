import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import multer from "multer";

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true' || !!process.env.VERCEL;

const uploadDir = isVercel ? path.join('/tmp', 'uploads') : path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

const dbPath = isVercel ? path.join('/tmp', 'vibestream.db') : path.join(process.cwd(), "vibestream.db");

// On Vercel, we need to copy the bundled DB to /tmp because the root is read-only
if (isVercel) {
  console.log("Running on Vercel. Target DB path:", dbPath);
  if (!fs.existsSync(dbPath)) {
    const bundledDbPath = path.join(process.cwd(), "vibestream.db");
    console.log("Checking for bundled DB at:", bundledDbPath);
    if (fs.existsSync(bundledDbPath)) {
      try {
        fs.copyFileSync(bundledDbPath, dbPath);
        console.log("Database successfully copied to /tmp");
      } catch (err) {
        console.error("CRITICAL: Failed to copy database to /tmp:", err);
      }
    } else {
      console.warn("WARNING: Bundled vibestream.db not found at", bundledDbPath);
    }
  } else {
    console.log("Database already exists in /tmp");
  }
}

let db: any;
try {
  db = new Database(dbPath);
  console.log("Database connection established at:", dbPath);
} catch (err) {
  console.error("CRITICAL: Failed to open database:", err);
  // Fallback to in-memory if it's a demo and persistsing fails
  db = new Database(":memory:");
  console.warn("Using in-memory database as fallback!");
}
const JWT_SECRET = process.env.JWT_SECRET || "vibe-secret-key-123";

// --- Database Initialization ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    avatar_url TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    title TEXT,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    is_short INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    category TEXT,
    tags TEXT,
    status TEXT DEFAULT 'published',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER,
    user_id INTEGER,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(video_id) REFERENCES videos(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    follower_id INTEGER,
    following_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(follower_id) REFERENCES users(id),
    FOREIGN KEY(following_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS video_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, user_id),
    FOREIGN KEY(video_id) REFERENCES videos(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    video_url TEXT,
    type TEXT, -- 'pre-roll', 'mid-roll', 'short'
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ad_impressions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad_id INTEGER,
    video_id INTEGER,
    user_id INTEGER, -- viewer
    revenue REAL, -- total revenue for this impression
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(ad_id) REFERENCES ads(id),
    FOREIGN KEY(video_id) REFERENCES videos(id)
  );

  CREATE TABLE IF NOT EXISTS earnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount REAL,
    source TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER,
    reporter_id INTEGER,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(video_id) REFERENCES videos(id),
    FOREIGN KEY(reporter_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS watch_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    video_id INTEGER,
    watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(video_id) REFERENCES videos(id)
  );
`);

// --- Migration: Ensure columns exist ---
const tableInfo = db.prepare("PRAGMA table_info(videos)").all();
const columns = tableInfo.map((c: any) => c.name);

if (!columns.includes('status')) {
  db.exec("ALTER TABLE videos ADD COLUMN status TEXT DEFAULT 'published'");
}
if (!columns.includes('category')) {
  db.exec("ALTER TABLE videos ADD COLUMN category TEXT");
}
if (!columns.includes('tags')) {
  db.exec("ALTER TABLE videos ADD COLUMN tags TEXT");
}

// --- Seed Data ---
const seedUser = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@vibestream.com");
if (!seedUser) {
  const hashedPassword = bcrypt.hashSync("password123", 10);
  db.prepare("INSERT INTO users (username, email, password, is_admin, avatar_url) VALUES (?, ?, ?, ?, ?)").run(
    "admin", "admin@vibestream.com", hashedPassword, 1, "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
  );

  // Seed some videos
  const adminId = 1;
  const videos = [
    { title: "Welcome to Aloga", desc: "The future of video is here.", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumb: "https://picsum.photos/seed/vibe1/800/450", short: 0 },
    { title: "Cool Tech Review", desc: "Checking out the latest gadgets.", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumb: "https://picsum.photos/seed/vibe2/800/450", short: 0 },
    { title: "Life Hack #1", desc: "How to save time.", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumb: "https://picsum.photos/seed/vibe3/800/450", short: 1 },
    { title: "Funny Cat", desc: "Look at this cat!", url: "https://www.w3schools.com/html/mov_bbb.mp4", thumb: "https://picsum.photos/seed/vibe4/800/450", short: 1 },
  ];

  videos.forEach(v => {
    db.prepare("INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, is_short) VALUES (?, ?, ?, ?, ?, ?)").run(
      adminId, v.title, v.desc, v.url, v.thumb, v.short
    );
  });

  // Seed some ads
  db.prepare("INSERT INTO ads (title, video_url, type) VALUES (?, ?, ?)").run(
    "Aloga Premium Ad", "https://www.w3schools.com/html/mov_bbb.mp4", "pre-roll"
  );
}

// --- Diagnostic Route ---
app.get("/api/health", (req, res) => {
  try {
    const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
    res.json({
      status: "ok",
      vercel: isVercel,
      dbPath,
      userCount,
      dbExists: fs.existsSync(dbPath),
      tmpExists: fs.existsSync('/tmp'),
      cwd: process.cwd()
    });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message, stack: err.stack });
  }
});

// --- Middleware ---
const authenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};

const optionalAuthenticate = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // Ignore invalid token
    }
  }
  next();
};

// --- App Setup ---
const app = express();
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

// Global Error Logger for Vercel
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// --- Auth Routes ---
app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const result = db.prepare("INSERT INTO users (username, email, password, avatar_url) VALUES (?, ?, ?, ?)").run(
      username, email, hashedPassword, `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    );
    res.json({ success: true, userId: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, username: user.username, isAdmin: user.is_admin }, JWT_SECRET);
  res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.is_admin, avatar_url: user.avatar_url } });
});

// --- User Routes ---
app.get("/api/users/top", (req, res) => {
  const users = db.prepare(`
      SELECT u.id, u.username, u.avatar_url, 
      (SELECT COUNT(*) FROM subscriptions WHERE following_id = u.id) as subscribers
      FROM users u
      ORDER BY subscribers DESC, u.id ASC
      LIMIT 6
    `).all();
  res.json(users);
});

app.get("/api/users/:id", (req, res) => {
  const user: any = db.prepare("SELECT id, username, avatar_url, created_at FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const subscribers = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE following_id = ?").get(user.id).count;
  const videoCount = db.prepare("SELECT COUNT(*) as count FROM videos WHERE user_id = ? AND status = 'published'").get(user.id).count;
  const totalViews = db.prepare("SELECT SUM(views) as total FROM videos WHERE user_id = ? AND status = 'published'").get(user.id).total || 0;

  user.banner_url = `https://picsum.photos/seed/banner${user.id}/1920/400`;
  user.subscribers = subscribers;
  user.video_count = videoCount;
  user.total_views = totalViews;

  res.json(user);
});

// --- Video Routes ---
app.get("/api/videos", (req, res) => {
  const { short, category, search } = req.query;
  let query = "SELECT v.*, u.username as creator_name, u.avatar_url as creator_avatar, (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comment_count FROM videos v JOIN users u ON v.user_id = u.id WHERE v.status = 'published'";
  const params: any[] = [];

  if (short !== undefined) {
    query += " AND v.is_short = ?";
    params.push(short === "true" ? 1 : 0);
  }
  if (category) {
    query += " AND v.category = ?";
    params.push(category);
  }
  if (search) {
    query += " AND (v.title LIKE ? OR v.description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY v.created_at DESC";
  const videos = db.prepare(query).all(...params);
  res.json(videos);
});

app.get("/api/videos/:id", optionalAuthenticate, (req: any, res) => {
  const video: any = db.prepare("SELECT v.*, u.username as creator_name, u.avatar_url as creator_avatar FROM videos v JOIN users u ON v.user_id = u.id WHERE v.id = ?").get(req.params.id);
  if (!video) return res.status(404).json({ error: "Video not found" });

  // Increment views
  db.prepare("UPDATE videos SET views = views + 1 WHERE id = ?").run(req.params.id);

  // Record history if logged in
  if (req.user) {
    db.prepare("INSERT INTO watch_history (user_id, video_id) VALUES (?, ?)").run(req.user.id, video.id);
  }

  // Get subscriber count
  const subscribers = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE following_id = ?").get(video.user_id).count;
  video.subscriber_count = subscribers;

  res.json(video);
});

app.post("/api/videos/:id/like", authenticate, (req: any, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;

    const existing = db.prepare("SELECT * FROM video_likes WHERE video_id = ? AND user_id = ?").get(videoId, userId);

    if (existing) {
      db.prepare("DELETE FROM video_likes WHERE video_id = ? AND user_id = ?").run(videoId, userId);
      db.prepare("UPDATE videos SET likes = likes - 1 WHERE id = ?").run(videoId);
      res.json({ liked: false });
    } else {
      db.prepare("INSERT INTO video_likes (video_id, user_id) VALUES (?, ?)").run(videoId, userId);
      db.prepare("UPDATE videos SET likes = likes + 1 WHERE id = ?").run(videoId);
      res.json({ liked: true });
    }
  } catch (err: any) {
    console.error("Like Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/videos/:id/like/check", authenticate, (req: any, res) => {
  const videoId = req.params.id;
  const userId = req.user.id;
  const existing = db.prepare("SELECT * FROM video_likes WHERE video_id = ? AND user_id = ?").get(videoId, userId);
  res.json({ liked: !!existing });
});

app.get("/api/videos/:id/comments", (req, res) => {
  const comments = db.prepare("SELECT c.*, u.username, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.video_id = ? ORDER BY c.created_at DESC").all(req.params.id);
  res.json(comments);
});

app.post("/api/videos/:id/comments", authenticate, (req: any, res) => {
  try {
    const { content } = req.body;
    const result = db.prepare("INSERT INTO comments (video_id, user_id, content) VALUES (?, ?, ?)").run(
      req.params.id, req.user.id, content
    );
    const comment = db.prepare("SELECT c.*, u.username, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?").get(result.lastInsertRowid);
    res.json(comment);
  } catch (err: any) {
    console.error("Comment Error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/videos", authenticate, upload.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), (req: any, res) => {
  const { title, description, is_short, category, tags } = req.body;
  try {
    const videoPath = req.files?.['video'] ? `/uploads/${req.files['video'][0].filename}` : req.body.video_url;
    const thumbnailPath = req.files?.['thumbnail'] ? `/uploads/${req.files['thumbnail'][0].filename}` : req.body.thumbnail_url;

    const isShortVal = is_short === 'true' || is_short === true ? 1 : 0;

    const result = db.prepare("INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, is_short, category, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      req.user.id, title, description, videoPath, thumbnailPath, isShortVal, category || 'General', tags || '', 'published'
    );
    res.json({ success: true, videoId: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// --- Subscription Routes ---
app.post("/api/subscriptions/toggle", authenticate, (req: any, res) => {
  const { following_id } = req.body;
  const follower_id = req.user.id;

  if (follower_id === following_id) return res.status(400).json({ error: "Cannot subscribe to yourself" });

  const existing = db.prepare("SELECT * FROM subscriptions WHERE follower_id = ? AND following_id = ?").get(follower_id, following_id);

  if (existing) {
    db.prepare("DELETE FROM subscriptions WHERE follower_id = ? AND following_id = ?").run(follower_id, following_id);
    res.json({ subscribed: false });
  } else {
    db.prepare("INSERT INTO subscriptions (follower_id, following_id) VALUES (?, ?)").run(follower_id, following_id);
    res.json({ subscribed: true });
  }
});

app.get("/api/subscriptions/check/:id", authenticate, (req: any, res) => {
  const following_id = req.params.id;
  const follower_id = req.user.id;
  const existing = db.prepare("SELECT * FROM subscriptions WHERE follower_id = ? AND following_id = ?").get(follower_id, following_id);
  res.json({ subscribed: !!existing });
});

app.get("/api/subscriptions/mine", authenticate, (req: any, res) => {
  const subs = db.prepare(`
      SELECT u.id, u.username, u.avatar_url 
      FROM subscriptions s
      JOIN users u ON s.following_id = u.id
      WHERE s.follower_id = ?
    `).all(req.user.id);
  res.json(subs);
});

// --- Watch History Routes ---
app.get("/api/history", authenticate, (req: any, res) => {
  const history = db.prepare(`
      SELECT w.id as history_id, w.watched_at, v.*, u.username as creator_name, u.avatar_url as creator_avatar 
      FROM watch_history w
      JOIN videos v ON w.video_id = v.id
      JOIN users u ON v.user_id = u.id
      WHERE w.user_id = ?
      ORDER BY w.watched_at DESC
      LIMIT 50
    `).all(req.user.id);
  res.json(history);
});

// --- Notification Routes ---
app.get("/api/notifications", authenticate, (req: any, res) => {
  // For now, mock notifications based on recent activity, or return empty
  // In a real app, you'd have a notifications table.
  // We'll return recent videos from subscribed channels as notifications
  const recentVideosFromSubs = db.prepare(`
      SELECT v.id as video_id, v.title, u.username, u.avatar_url, v.created_at
      FROM videos v
      JOIN subscriptions s ON v.user_id = s.following_id
      JOIN users u ON v.user_id = u.id
      WHERE s.follower_id = ?
      ORDER BY v.created_at DESC
      LIMIT 5
    `).all(req.user.id);

  const notifications = recentVideosFromSubs.map((v: any) => ({
    id: `new_video_${v.video_id}`,
    type: 'new_video',
    message: `${v.username} uploaded: ${v.title}`,
    avatar_url: v.avatar_url,
    link: `/watch/${v.video_id}`,
    created_at: v.created_at
  }));

  res.json(notifications);
});

// --- Ad System ---
app.get("/api/ads/serve", (req, res) => {
  const { type } = req.query;
  const ad = db.prepare("SELECT * FROM ads WHERE type = ? AND active = 1 ORDER BY RANDOM() LIMIT 1").get(type);
  res.json(ad || null);
});

app.post("/api/ads/impression", (req, res) => {
  const { ad_id, video_id, user_id } = req.body;
  const revenue = 0.05; // $0.05 per impression
  db.prepare("INSERT INTO ad_impressions (ad_id, video_id, user_id, revenue) VALUES (?, ?, ?, ?)").run(
    ad_id, video_id, user_id || null, revenue
  );

  // Distribute earnings
  const video: any = db.prepare("SELECT user_id FROM videos WHERE id = ?").get(video_id);
  if (video) {
    const creatorShare = revenue * 0.7;
    const platformShare = revenue * 0.3;

    // Pay Creator
    db.prepare("INSERT INTO earnings (user_id, amount, source) VALUES (?, ?, ?)").run(
      video.user_id, creatorShare, "ad_share_creator"
    );

    // Pay Platform (Admin - user_id 1)
    db.prepare("INSERT INTO earnings (user_id, amount, source) VALUES (?, ?, ?)").run(
      1, platformShare, "ad_share_platform"
    );
  }

  res.json({ success: true });
});

// --- Creator Studio / Analytics ---
app.get("/api/studio/stats", authenticate, (req: any, res) => {
  const userId = req.user.id;

  // Total views, earnings, subs
  const totalViews = db.prepare("SELECT SUM(views) as total FROM videos WHERE user_id = ?").get(userId).total || 0;
  const totalEarnings = db.prepare("SELECT SUM(amount) as total FROM earnings WHERE user_id = ?").get(userId).total || 0;
  const subscribers = db.prepare("SELECT COUNT(*) as count FROM subscriptions WHERE following_id = ?").get(userId).count || 0;
  const videos = db.prepare("SELECT v.*, (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comment_count FROM videos v WHERE user_id = ? ORDER BY created_at DESC").all(userId);

  // Calculate a rough watch time (e.g. 2.5 mins average per view)
  const watchTime = Math.floor((totalViews * 2.5) / 60);

  // Generate chart data (last 12 days simulation or weeks if you prefer, but we'll do 12 periods of "views")
  // For a real app, this groups by Day. Here we'll just mock a curve based on total views
  // to keep it simple but somewhat dynamic based on the creator's actual views
  const baseViews = Math.max(totalViews / 10, 10);
  const chartData = [
    baseViews * 0.4, baseViews * 0.6, baseViews * 0.45, baseViews * 0.7,
    baseViews * 0.55, baseViews * 0.9, baseViews * 0.8, baseViews * 1.0,
    baseViews * 0.85, baseViews * 1.1, baseViews * 0.95, baseViews * 1.2
  ].map(v => Math.round(v));

  const stats = {
    totalViews,
    totalEarnings,
    subscribers,
    videos,
    watchTime,
    chartData
  };
  res.json(stats);
});

// --- Admin Routes ---
app.get("/api/admin/stats", authenticate, (req: any, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: "Forbidden" });
  const stats = {
    platformRevenue: db.prepare("SELECT SUM(amount) as total FROM earnings WHERE source = 'ad_share_platform'").get().total || 0,
    totalUsers: db.prepare("SELECT COUNT(*) as count FROM users").get().count,
    totalVideos: db.prepare("SELECT COUNT(*) as count FROM videos").get().count,
    totalViews: db.prepare("SELECT SUM(views) as total FROM videos").get().total || 0
  };
  res.json(stats);
});

app.get("/api/admin/reports", authenticate, (req: any, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: "Forbidden" });
  const reports = db.prepare("SELECT r.*, v.title as video_title, u.username as reporter_name FROM reports r JOIN videos v ON r.video_id = v.id JOIN users u ON r.reporter_id = u.id WHERE r.status = 'pending'").all();
  res.json(reports);
});

app.post("/api/admin/moderate", authenticate, (req: any, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: "Forbidden" });
  const { video_id, action } = req.body; // action: 'delete', 'flag', 'approve'
  if (action === 'delete') {
    db.prepare("UPDATE videos SET status = 'deleted' WHERE id = ?").run(video_id);
  } else if (action === 'flag') {
    db.prepare("UPDATE videos SET status = 'flagged' WHERE id = ?").run(video_id);
  }
  res.json({ success: true });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// --- Vite Setup ---
async function setupFrontend() {
  if (isVercel) return;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist/index.html"));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aloga Server running on http://localhost:${PORT}`);
  });
}

setupFrontend();

export default app;
