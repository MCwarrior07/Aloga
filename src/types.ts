export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url: string;
  is_admin: boolean;
  created_at: string;
}

export interface Video {
  id: number;
  user_id: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  is_short: boolean;
  views: number;
  likes: number;
  category: string;
  tags: string;
  status: 'published' | 'pending' | 'flagged' | 'deleted';
  created_at: string;
  creator_name: string;
  creator_avatar: string;
}

export interface Comment {
  id: number;
  video_id: number;
  user_id: number;
  content: string;
  created_at: string;
  username: string;
  avatar_url: string;
}

export interface Ad {
  id: number;
  title: string;
  video_url: string;
  type: 'pre-roll' | 'mid-roll' | 'short';
  active: boolean;
}

export interface Earning {
  id: number;
  user_id: number;
  amount: number;
  source: string;
  created_at: string;
}

export interface Report {
  id: number;
  video_id: number;
  reporter_id: number;
  reason: string;
  status: 'pending' | 'resolved';
  created_at: string;
  video_title: string;
  reporter_name: string;
}
