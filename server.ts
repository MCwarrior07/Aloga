import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createClient } from "@libsql/client";

const isVercel = !!process.env.VERCEL;
const isProd = process.env.NODE_ENV === 'production' || isVercel;

const uploadDir = isVercel ? '/tmp' : path.join(process.cwd(), "uploads");
if (!isVercel && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const uploadMiddleware = multer({ storage });

const JWT_SECRET = process.env.JWT_SECRET || "vibe-secret-key-123";
const dbPath = isVercel ? path.join('/tmp', 'vibestream.db') : path.join(process.cwd(), "vibestream.db");

// --- LibSQL wrapper to mimic better-sqlite3 API ---
class DB {
  private client: any;
  private _ready: Promise<void>;

  constructor() {
    this._ready = this.init();
  }

  private async init() {
    try {
      // In Vercel, we must write to /tmp. For local dev, we use the project root.
      const dbUrl = isVercel ? `file:///tmp/vibestream.db` : `file:${path.join(process.cwd(), "vibestream.db")}`;

      // If deployed on Vercel: copy the bundled db to /tmp on cold start so it's fresh but mutable
      if (isVercel) {
        const bundledDbPath = path.resolve(process.cwd(), "vibestream.db");
        const tmpDbPath = '/tmp/vibestream.db';
        if (!fs.existsSync(tmpDbPath) && fs.existsSync(bundledDbPath)) {
          fs.copyFileSync(bundledDbPath, tmpDbPath);
          console.log("Aloga: Copied bundled vibestream.db to /tmp");
        }
      }

      this.client = createClient({
        url: dbUrl
      });
      console.log("Aloga: Connected to LibSQL database at", dbUrl);
    } catch (err) {
      console.error("Aloga: Failed to initialize LibSQL:", err);
    }
  }

  async ready() { await this._ready; }

  async exec(sql: string) {
    if (!this.client) throw new Error("Database not initialized");
    // LibSQL executeMultiple splits statements automatically
    await this.client.executeMultiple(sql);
  }

  async run(sql: string, ...params: any[]) {
    if (!this.client) throw new Error("Database not initialized");
    const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const result = await this.client.execute({ sql, args });
    return { lastInsertRowid: Number(result.lastInsertRowid), changes: result.rowsAffected };
  }

  async get(sql: string, ...params: any[]): Promise<any> {
    if (!this.client) throw new Error("Database not initialized");
    const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const result = await this.client.execute({ sql, args });
    return result.rows.length > 0 ? result.rows[0] : undefined;
  }

  async all(sql: string, ...params: any[]): Promise<any[]> {
    if (!this.client) throw new Error("Database not initialized");
    const args = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
    const result = await this.client.execute({ sql, args });
    return result.rows;
  }
}

const db = new DB();

// --- Express App Setup ---
const app = express();
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

// Ensure DB is ready before handling any request
app.use(async (req, res, next) => {
  try {
    await db.ready();
    next();
  } catch (err) {
    console.error("Aloga: DB init failed:", err);
    res.status(500).json({ error: "Database initialization failed" });
  }
});

// --- Database Initialization (runs once after DB is ready) ---
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await db.ready();
      await db.exec(`
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
          type TEXT,
          active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS ad_impressions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ad_id INTEGER,
          video_id INTEGER,
          user_id INTEGER,
          revenue REAL,
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

      // Seed data if empty
      const seedUser = await db.get("SELECT * FROM users WHERE email = ?", "admin@vibestream.com");
      if (!seedUser) {
        const hashedPassword = bcrypt.hashSync("password123", 10);
        await db.run("INSERT INTO users (username, email, password, is_admin, avatar_url) VALUES (?, ?, ?, ?, ?)",
          "admin", "admin@vibestream.com", hashedPassword, 1, "https://api.dicebear.com/7.x/avataaars/svg?seed=admin"
        );
        const videos = [
          { title: "Welcome to Aloga", desc: "The future of video is here.", url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", thumb: "https://picsum.photos/seed/vibe1/800/450", short: 0 },
          { title: "Cool Tech Review", desc: "Checking out the latest gadgets.", url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", thumb: "https://picsum.photos/seed/vibe2/800/450", short: 0 },
          { title: "Life Hack #1", desc: "How to save time.", url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", thumb: "https://picsum.photos/seed/vibe3/800/450", short: 1 },
          { title: "Funny Cat", desc: "Look at this cat!", url: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", thumb: "https://picsum.photos/seed/vibe4/800/450", short: 1 },
        ];
        for (const v of videos) {
          await db.run("INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, is_short) VALUES (?, ?, ?, ?, ?, ?)",
            1, v.title, v.desc, v.url, v.thumb, v.short
          );
        }
        await db.run("INSERT INTO ads (title, video_url, type) VALUES (?, ?, ?)",
          "Aloga Premium Ad", "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", "pre-roll"
        );
        console.log("Aloga: Seeded initial data");
      }
      dbInitialized = true;
    } catch (err) {
      console.error("Aloga: DB schema init failed:", err);
    }
  }
  next();
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
    try { req.user = jwt.verify(token, JWT_SECRET); } catch (err) { /* ignore */ }
  }
  next();
};

// --- Health Check ---
app.get("/api/health", async (req, res) => {
  try {
    const userCount = await db.get("SELECT COUNT(*) as count FROM users");
    res.json({ status: "ok", vercel: isVercel, dbPath, userCount: userCount?.count || 0 });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// --- Auth Routes ---
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);
  try {
    const result = await db.run("INSERT INTO users (username, email, password, avatar_url) VALUES (?, ?, ?, ?)",
      username, email, hashedPassword, `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    );
    res.json({ success: true, userId: result.lastInsertRowid });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user: any = await db.get("SELECT * FROM users WHERE email = ?", email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, username: user.username, isAdmin: user.is_admin }, JWT_SECRET);
  res.json({ token, user: { id: user.id, username: user.username, isAdmin: user.is_admin, avatar_url: user.avatar_url } });
});

// --- User Routes ---
app.get("/api/users/top", async (req, res) => {
  const users = await db.all(`SELECT u.id, u.username, u.avatar_url, 
    (SELECT COUNT(*) FROM subscriptions WHERE following_id = u.id) as subscribers
    FROM users u ORDER BY subscribers DESC, u.id ASC LIMIT 6`);
  res.json(users);
});

app.get("/api/users/:id", async (req, res) => {
  const user: any = await db.get("SELECT id, username, avatar_url, created_at FROM users WHERE id = ?", req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const subscribers = await db.get("SELECT COUNT(*) as count FROM subscriptions WHERE following_id = ?", user.id);
  const videoCount = await db.get("SELECT COUNT(*) as count FROM videos WHERE user_id = ? AND status = 'published'", user.id);
  const totalViews = await db.get("SELECT SUM(views) as total FROM videos WHERE user_id = ? AND status = 'published'", user.id);
  user.banner_url = `https://picsum.photos/seed/banner${user.id}/1920/400`;
  user.subscribers = subscribers?.count || 0;
  user.video_count = videoCount?.count || 0;
  user.total_views = totalViews?.total || 0;
  res.json(user);
});

// --- Video Routes ---
app.get("/api/videos", async (req, res) => {
  const { short, category, search } = req.query;
  let query = "SELECT v.*, u.username as creator_name, u.avatar_url as creator_avatar, (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comment_count FROM videos v JOIN users u ON v.user_id = u.id WHERE v.status = 'published'";
  const params: any[] = [];
  if (short !== undefined) { query += " AND v.is_short = ?"; params.push(short === "true" ? 1 : 0); }
  if (category) { query += " AND v.category = ?"; params.push(category); }
  if (search) { query += " AND (v.title LIKE ? OR v.description LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
  query += " ORDER BY v.created_at DESC";
  const videos = await db.all(query, ...params);
  res.json(videos);
});

app.get("/api/videos/:id", optionalAuthenticate, async (req: any, res) => {
  const video: any = await db.get("SELECT v.*, u.username as creator_name, u.avatar_url as creator_avatar FROM videos v JOIN users u ON v.user_id = u.id WHERE v.id = ?", req.params.id);
  if (!video) return res.status(404).json({ error: "Video not found" });
  await db.run("UPDATE videos SET views = views + 1 WHERE id = ?", req.params.id);
  if (req.user) { await db.run("INSERT INTO watch_history (user_id, video_id) VALUES (?, ?)", req.user.id, video.id); }
  const subscribers = await db.get("SELECT COUNT(*) as count FROM subscriptions WHERE following_id = ?", video.user_id);
  video.subscriber_count = subscribers?.count || 0;
  res.json(video);
});

app.post("/api/videos/:id/like", authenticate, async (req: any, res) => {
  try {
    const videoId = req.params.id;
    const userId = req.user.id;
    const existing = await db.get("SELECT * FROM video_likes WHERE video_id = ? AND user_id = ?", videoId, userId);
    if (existing) {
      await db.run("DELETE FROM video_likes WHERE video_id = ? AND user_id = ?", videoId, userId);
      await db.run("UPDATE videos SET likes = likes - 1 WHERE id = ?", videoId);
      res.json({ liked: false });
    } else {
      await db.run("INSERT INTO video_likes (video_id, user_id) VALUES (?, ?)", videoId, userId);
      await db.run("UPDATE videos SET likes = likes + 1 WHERE id = ?", videoId);
      res.json({ liked: true });
    }
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get("/api/videos/:id/like/check", authenticate, async (req: any, res) => {
  const existing = await db.get("SELECT * FROM video_likes WHERE video_id = ? AND user_id = ?", req.params.id, req.user.id);
  res.json({ liked: !!existing });
});

app.get("/api/videos/:id/comments", async (req, res) => {
  const comments = await db.all("SELECT c.*, u.username, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.video_id = ? ORDER BY c.created_at DESC", req.params.id);
  res.json(comments);
});

app.post("/api/videos/:id/comments", authenticate, async (req: any, res) => {
  try {
    const { content } = req.body;
    const result = await db.run("INSERT INTO comments (video_id, user_id, content) VALUES (?, ?, ?)", req.params.id, req.user.id, content);
    const comment = await db.get("SELECT c.*, u.username, u.avatar_url FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?", result.lastInsertRowid);
    res.json(comment);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post("/api/videos", authenticate, uploadMiddleware.fields([{ name: 'video', maxCount: 1 }, { name: 'thumbnail', maxCount: 1 }]), async (req: any, res) => {
  const { title, description, is_short, category, tags } = req.body;
  try {
    const videoPath = req.files?.['video'] ? `/uploads/${req.files['video'][0].filename}` : req.body.video_url;
    const thumbnailPath = req.files?.['thumbnail'] ? `/uploads/${req.files['thumbnail'][0].filename}` : req.body.thumbnail_url;
    const isShortVal = is_short === 'true' || is_short === true ? 1 : 0;
    const result = await db.run("INSERT INTO videos (user_id, title, description, video_url, thumbnail_url, is_short, category, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      req.user.id, title, description, videoPath, thumbnailPath, isShortVal, category || 'General', tags || '', 'published'
    );
    res.json({ success: true, videoId: result.lastInsertRowid });
  } catch (err: any) { res.status(400).json({ error: err.message }); }
});

// --- Subscription Routes ---
app.post("/api/subscriptions/toggle", authenticate, async (req: any, res) => {
  const { following_id } = req.body;
  const follower_id = req.user.id;
  if (follower_id === following_id) return res.status(400).json({ error: "Cannot subscribe to yourself" });
  const existing = await db.get("SELECT * FROM subscriptions WHERE follower_id = ? AND following_id = ?", follower_id, following_id);
  if (existing) {
    await db.run("DELETE FROM subscriptions WHERE follower_id = ? AND following_id = ?", follower_id, following_id);
    res.json({ subscribed: false });
  } else {
    await db.run("INSERT INTO subscriptions (follower_id, following_id) VALUES (?, ?)", follower_id, following_id);
    res.json({ subscribed: true });
  }
});

app.get("/api/subscriptions/check/:id", authenticate, async (req: any, res) => {
  const existing = await db.get("SELECT * FROM subscriptions WHERE follower_id = ? AND following_id = ?", req.user.id, req.params.id);
  res.json({ subscribed: !!existing });
});

app.get("/api/subscriptions/mine", authenticate, async (req: any, res) => {
  const subs = await db.all(`SELECT u.id, u.username, u.avatar_url FROM subscriptions s
    JOIN users u ON s.following_id = u.id WHERE s.follower_id = ?`, req.user.id);
  res.json(subs);
});

// --- Watch History ---
app.get("/api/history", authenticate, async (req: any, res) => {
  const history = await db.all(`SELECT w.id as history_id, w.watched_at, v.*, u.username as creator_name, u.avatar_url as creator_avatar 
    FROM watch_history w JOIN videos v ON w.video_id = v.id JOIN users u ON v.user_id = u.id
    WHERE w.user_id = ? ORDER BY w.watched_at DESC LIMIT 50`, req.user.id);
  res.json(history);
});

// --- Notifications ---
app.get("/api/notifications", authenticate, async (req: any, res) => {
  const recentVideosFromSubs = await db.all(`SELECT v.id as video_id, v.title, u.username, u.avatar_url, v.created_at
    FROM videos v JOIN subscriptions s ON v.user_id = s.following_id JOIN users u ON v.user_id = u.id
    WHERE s.follower_id = ? ORDER BY v.created_at DESC LIMIT 5`, req.user.id);
  const notifications = recentVideosFromSubs.map((v: any) => ({
    id: `new_video_${v.video_id}`, type: 'new_video',
    message: `${v.username} uploaded: ${v.title}`,
    avatar_url: v.avatar_url, link: `/watch/${v.video_id}`, created_at: v.created_at
  }));
  res.json(notifications);
});

// --- Ad System ---
app.get("/api/ads/serve", async (req, res) => {
  const { type } = req.query;
  const ad = await db.get("SELECT * FROM ads WHERE type = ? AND active = 1 ORDER BY RANDOM() LIMIT 1", type);
  res.json(ad || null);
});

app.post("/api/ads/impression", async (req, res) => {
  const { ad_id, video_id, user_id } = req.body;
  const revenue = 0.05;
  await db.run("INSERT INTO ad_impressions (ad_id, video_id, user_id, revenue) VALUES (?, ?, ?, ?)", ad_id, video_id, user_id || null, revenue);
  const video: any = await db.get("SELECT user_id FROM videos WHERE id = ?", video_id);
  if (video) {
    await db.run("INSERT INTO earnings (user_id, amount, source) VALUES (?, ?, ?)", video.user_id, revenue * 0.7, "ad_share_creator");
    await db.run("INSERT INTO earnings (user_id, amount, source) VALUES (?, ?, ?)", 1, revenue * 0.3, "ad_share_platform");
  }
  res.json({ success: true });
});

// --- Creator Studio ---
app.get("/api/studio/stats", authenticate, async (req: any, res) => {
  const userId = req.user.id;
  const totalViewsObj = await db.get("SELECT SUM(views) as total FROM videos WHERE user_id = ?", userId);
  const totalViews = totalViewsObj?.total || 0;
  const totalEarningsObj = await db.get("SELECT SUM(amount) as total FROM earnings WHERE user_id = ?", userId);
  const totalEarnings = totalEarningsObj?.total || 0;
  const subscribersObj = await db.get("SELECT COUNT(*) as count FROM subscriptions WHERE following_id = ?", userId);
  const subscribers = subscribersObj?.count || 0;
  const videos = await db.all("SELECT v.*, (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comment_count FROM videos v WHERE user_id = ? ORDER BY created_at DESC", userId);
  const watchTime = Math.floor((totalViews * 2.5) / 60);
  const baseViews = Math.max(totalViews / 10, 10);
  const chartData = [0.4, 0.6, 0.45, 0.7, 0.55, 0.9, 0.8, 1.0, 0.85, 1.1, 0.95, 1.2].map(m => Math.round(baseViews * m));
  res.json({ totalViews, totalEarnings, subscribers, videos, watchTime, chartData });
});

// --- Admin Routes ---
app.get("/api/admin/stats", authenticate, async (req: any, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: "Forbidden" });
  const platformRevenueObj = await db.get("SELECT SUM(amount) as total FROM earnings WHERE source = 'ad_share_platform'");
  const totalUsersObj = await db.get("SELECT COUNT(*) as count FROM users");
  const totalVideosObj = await db.get("SELECT COUNT(*) as count FROM videos");
  const totalViewsObj = await db.get("SELECT SUM(views) as total FROM videos");

  res.json({
    platformRevenue: platformRevenueObj?.total || 0,
    totalUsers: totalUsersObj?.count || 0,
    totalVideos: totalVideosObj?.count || 0,
    totalViews: totalViewsObj?.total || 0
  });
});

app.get("/api/admin/reports", authenticate, async (req: any, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: "Forbidden" });
  const reports = await db.all("SELECT r.*, v.title as video_title, u.username as reporter_name FROM reports r JOIN videos v ON r.video_id = v.id JOIN users u ON r.reporter_id = u.id WHERE r.status = 'pending'");
  res.json(reports);
});

app.post("/api/admin/moderate", authenticate, async (req: any, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: "Forbidden" });
  const { video_id, action } = req.body;
  if (action === 'delete') { await db.run("UPDATE videos SET status = 'deleted' WHERE id = ?", video_id); }
  else if (action === 'flag') { await db.run("UPDATE videos SET status = 'flagged' WHERE id = ?", video_id); }
  res.json({ success: true });
});

// Global Error Handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});

// --- Vite Setup & Server Start ---
async function startServer() {
  if (!isVercel) {
    if (!isProd) {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.join(process.cwd(), "dist")));
      app.get("*", (req, res) => { res.sendFile(path.join(process.cwd(), "dist/index.html")); });
    }
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    app.listen(PORT, "0.0.0.0", () => { console.log(`Aloga Server running on http://localhost:${PORT}`); });
  }
}

startServer();

// Vercel Serverless Export
export default app;
