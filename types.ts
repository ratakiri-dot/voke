
export interface User {
  id: string;
  name: string;
  avatar: string;
  username: string;
  password?: string;
  bio: string;
  waNumber?: string;
  email?: string;
  address?: string;
  followersCount: number;
  followingCount: number;
  giftBalance: number;
  isAdmin?: boolean;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
}

export interface Post {
  id: string;
  userId: string;
  title: string;
  content: string;
  caption: string;
  likes: number;
  comments: Comment[];
  shares: number;
  gifts: number;
  giftStats?: Record<string, { count: number; icon: string }>;
  views: number;
  timestamp: Date;
  isLiked?: boolean;
  isPromoted?: boolean;
  promotedUntil?: Date;
  isPendingPromotion?: boolean; 
}

export interface TopUpRequest {
  id: string;
  userId: string;
  userName: string;
  points: number;
  price: number;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  method: string;
  account: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
}

export interface ReportRecord {
  id: string;
  postId: string;
  postTitle: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'resolved';
  timestamp: Date;
}

export interface SignUpRequest {
  id: string;
  name: string;
  username: string;
  password?: string;
  avatar: string;
  bio: string;
  waNumber: string;
  email: string;
  address: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
}

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp?: Date;
}

export type AdPosition = 'top' | 'middle' | 'bottom';

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  embedCode?: string;
  link?: string;
  position: AdPosition;
  isActive: boolean;
}
