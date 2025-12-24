
import { Post, User, TopUpRequest, ReportRecord, Advertisement, SignUpRequest } from './types';

export const CURRENT_USER: User = {
  id: 'me',
  name: 'Andi Pratama',
  username: '@andipratama',
  password: 'password123',
  avatar: 'https://picsum.photos/seed/me/200',
  bio: 'Administrator VOKE & Penulis.',
  waNumber: '08123456789',
  email: 'admin@voke.id',
  address: 'Jakarta, Indonesia',
  followersCount: 1250,
  followingCount: 85,
  giftBalance: 50000,
  isAdmin: true
};

export const INITIAL_POSTS: Post[] = [
  {
    id: '1',
    userId: 'user1',
    title: 'Matahari di Ujung Senja',
    content: 'Matahari perlahan tenggelam di ufuk barat, menyisakan warna jingga yang mempesona...',
    caption: 'Renungan sore.',
    likes: 42,
    comments: [],
    shares: 12,
    gifts: 70,
    views: 1200,
    timestamp: new Date(Date.now() - 3600000),
    isPromoted: true,
    promotedUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
  }
];

export const MOCK_TOPUP_REQUESTS: TopUpRequest[] = [
  {
    id: 'tr-1',
    userId: 'user1',
    userName: 'Siska Amelia',
    points: 15000,
    price: 25000,
    status: 'pending',
    timestamp: new Date(Date.now() - 1800000)
  }
];

export const MOCK_REPORTS: ReportRecord[] = [
  {
    id: 'rep-1',
    postId: '1',
    postTitle: 'Matahari di Ujung Senja',
    reporterName: 'Andi Pratama',
    reason: 'Lainnya',
    status: 'pending',
    timestamp: new Date()
  }
];

export const MOCK_SIGNUP_REQUESTS: SignUpRequest[] = [
  {
    id: 'req-user-3',
    name: 'Dewi Lestari',
    username: '@dewi_les',
    avatar: 'https://picsum.photos/seed/user3/200',
    bio: 'Pecinta kopi dan kata-kata.',
    waNumber: '085712345678',
    email: 'dewi.lestari@gmail.com',
    address: 'Bandung, Jawa Barat',
    status: 'pending',
    timestamp: new Date(Date.now() - 5400000)
  }
];

export const MOCK_ADS: Advertisement[] = [
  {
    id: 'ad-1',
    title: 'VOKE Premium: Menulis Efektif',
    description: 'Dapatkan diskon 50% untuk kursus menulis eksklusif hari ini!',
    imageUrl: 'https://picsum.photos/seed/ads1/800/400',
    link: 'https://example.com/ebook',
    position: 'top',
    isActive: true
  }
];

export const MOCK_USERS_DATA: Record<string, User> = {
  'user1': {
    id: 'user1',
    name: 'Siska Amelia',
    username: '@siska_am',
    password: 'password123',
    avatar: 'https://picsum.photos/seed/user1/200',
    bio: 'Penulis puisi paruh waktu.',
    waNumber: '082199887766',
    email: 'siska.am@voke.id',
    address: 'Yogyakarta',
    followersCount: 1500,
    followingCount: 200,
    giftBalance: 500
  },
  'user2': {
    id: 'user2',
    name: 'Budi Santoso',
    username: '@budisan',
    password: 'password123',
    avatar: 'https://picsum.photos/seed/user2/200',
    bio: 'Guru bahasa yang suka traveling.',
    waNumber: '081122334455',
    email: 'budisan@gmail.com',
    address: 'Surabaya',
    followersCount: 340,
    followingCount: 500,
    giftBalance: 300
  },
  'user_halo': {
    id: 'user_halo',
    name: 'Halo User',
    username: '@halo',
    password: 'halo',
    avatar: 'https://picsum.photos/seed/halo/200',
    bio: 'Akun pengetesan sistem VOKE.',
    waNumber: '089988776655',
    email: 'halo@voke.id',
    address: 'Jakarta',
    followersCount: 10,
    followingCount: 5,
    giftBalance: 25000 
  }
};
