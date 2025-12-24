
import React, { useState, useMemo, useEffect } from 'react';
import { Post, User, Notification as NotificationType, Comment, TopUpRequest, ReportRecord, Advertisement, SignUpRequest, WithdrawRequest } from './types';
import { PostCard } from './components/PostCard';
import { RichEditor } from './components/RichEditor';
import { Notification } from './components/Notification';
import { ProfileEditor } from './components/ProfileEditor';
import { AdminDashboard } from './components/AdminDashboard';
import { GiftItem, WithdrawModal, TopUpModal } from './components/Modals';
import { supabase } from './services/supabaseClient';

type ViewType = 'home' | 'saved' | 'profile' | 'edit-profile' | 'admin' | 'landing' | 'wallet';

// Menggunakan Unicode ꓘ (U+A4D8)
export const VokeLogo = ({ className = "text-2xl", withGradient = true }: { className?: string, withGradient?: boolean }) => (
  <span className={`voke-logo inline-flex items-center font-[800] uppercase tracking-tighter ${withGradient ? 'voke-gradient-text' : 'text-slate-900'} ${className}`}>
    VOꓘE
  </span>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});

  const [posts, setPosts] = useState<Post[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [signupRequests, setSignupRequests] = useState<SignUpRequest[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);

  const [viewRate, setViewRate] = useState<number>(0.0001); // Can be fetched from a 'settings' table if created
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  const [isWriting, setIsWriting] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [view, setView] = useState<ViewType>('landing');
  const [activeNotification, setActiveNotification] = useState<NotificationType | null>(null);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    name: '', username: '', password: '', bio: '', waNumber: '', email: '', address: '',
    avatar: `https://picsum.photos/seed/${Math.random()}/200`
  });

  const handleNotify = (message: string, type: 'success' | 'error' | 'info') => {
    const newNotif: NotificationType = { id: Date.now().toString(), message, type, timestamp: new Date() };
    setActiveNotification(newNotif);
  };

  // --- Auth & Initial Data Fetching ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
        setView('home');
      } else {
        setUser(null);
        setView('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPosts();
      fetchAds();
      // Fetch other data if needed
      fetchAllUsers(); // For Admin Dashboard compatibility
    }
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    if (data) {
      setUser({
        id: data.id,
        name: data.name || 'User',
        username: data.username || '@user',
        avatar: data.avatar_url || 'https://via.placeholder.com/150',
        bio: data.bio || '',
        waNumber: data.wa_number,
        email: data.email,
        address: data.address,
        followersCount: 0, // Need to implement followers table/count
        followingCount: 0,
        giftBalance: parseFloat(data.gift_balance) || 0,
        isAdmin: data.role === 'admin',
        status: data.status as any
      });
    }
  };

  const fetchAllUsers = async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
      const map: Record<string, User> = {};
      data.forEach((p: any) => {
        map[p.id] = {
          id: p.id,
          name: p.name,
          username: p.username,
          avatar: p.avatar_url,
          bio: p.bio,
          waNumber: p.wa_number,
          email: p.email,
          address: p.address,
          followersCount: 0,
          followingCount: 0,
          giftBalance: parseFloat(p.gift_balance) || 0,
          isAdmin: p.role === 'admin',
          status: p.status
        };
      });
      setAllUsers(map);
    }
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles (name, username, avatar_url),
        likes (user_id),
        comments (id, text, user_id, created_at, profiles(name))
      `)
      .order('created_at', { ascending: false });

    if (error) { console.error(error); return; }

    if (data) {
      const mappedPosts: Post[] = data.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        title: p.title,
        content: p.content,
        caption: p.caption,
        likes: p.likes_count,
        shares: p.shares_count,
        views: p.views_count,
        gifts: p.gifts_received,
        timestamp: new Date(p.created_at),
        isPromoted: p.is_promoted,
        promotedUntil: p.promoted_until ? new Date(p.promoted_until) : undefined,
        comments: p.comments.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          userName: c.profiles?.name || 'User',
          text: c.text,
          timestamp: new Date(c.created_at)
        })),
        isLiked: p.likes.some((l: any) => l.user_id === user?.id),
        author: {
          name: p.profiles?.name || 'Unknown',
          username: p.profiles?.username || '',
          avatar: p.profiles?.avatar_url || ''
        }
      }));
      setPosts(mappedPosts);
    }
  };

  const fetchAds = async () => {
    const { data } = await supabase.from('ads').select('*');
    if (data) {
      setAds(data.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description,
        imageUrl: a.image_url,
        link: a.link,
        embedCode: a.embed_code,
        position: a.position,
        isActive: a.is_active
      })));
    }
  };

  const totalBalance = useMemo(() => user?.giftBalance || 0, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Fallback logic for legacy superadmin
    if (loginForm.email === 'superadmin' && loginForm.password === 'superman') {
      setUser({
        id: 'superadmin',
        name: 'Super Admin',
        username: '@superadmin',
        avatar: 'https://ui-avatars.com/api/?name=Super+Admin&background=000&color=fff',
        bio: 'Administrator System',
        email: 'admin@voke.id',
        waNumber: '',
        address: '',
        followersCount: 9999,
        followingCount: 0,
        giftBalance: 999999999,
        isAdmin: true,
        status: 'approved'
      });
      setView('home');
      handleNotify('Login berhasil sebagai Super Admin!', 'success');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: loginForm.email,
      password: loginForm.password,
    });

    if (error) {
      handleNotify(error.message, 'error');
    } else {
      handleNotify('Login berhasil!', 'success');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({
      email: signupForm.email,
      password: signupForm.password,
      options: {
        data: {
          full_name: signupForm.name,
          username: signupForm.username.startsWith('@') ? signupForm.username : `@${signupForm.username}`,
          avatar_url: signupForm.avatar
        }
      }
    });

    if (error) {
      handleNotify(error.message, 'error');
    } else {
      if (data.user) {
        // Update profile with extra fields
        await supabase.from('profiles').update({
          bio: signupForm.bio,
          wa_number: signupForm.waNumber,
          address: signupForm.address,
          status: 'pending' // Enforce pending status
        }).eq('id', data.user.id);

        handleNotify('Pendaftaran berhasil! Silakan login.', 'success');
        setAuthMode('login');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('landing');
  };

  // --- Actions ---

  const handlePublish = async (title: string, content: string, caption: string) => {
    if (!user) return;
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      title,
      content,
      caption
    });

    if (error) {
      handleNotify('Gagal menerbitkan karya.', 'error');
    } else {
      handleNotify('Karya diterbitkan!', 'success');
      setIsWriting(false);
      fetchPosts();
      setView('home');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.isLiked) {
      // Unlike
      await supabase.from('likes').delete().match({ post_id: postId, user_id: user.id });
      await supabase.from('posts').update({ likes_count: post.likes - 1 }).eq('id', postId);
    } else {
      // Like
      await supabase.from('likes').insert({ post_id: postId, user_id: user.id });
      await supabase.from('posts').update({ likes_count: post.likes + 1 }).eq('id', postId);
    }
    fetchPosts(); // Refresh to ensure sync
  };

  const handleAddComment = async (postId: string, text: string) => {
    if (!user) return;
    await supabase.from('comments').insert({
      post_id: postId,
      user_id: user.id,
      text
    });
    fetchPosts();
  };

  const handleGift = async (postId: string, gift: GiftItem) => {
    if (!user) return;
    if (totalBalance < gift.price) {
      setIsTopUpOpen(true);
      handleNotify('Saldo tidak mencukupi.', 'error');
      return;
    }

    // 1. Deduct from sender
    const { error: deductErr } = await supabase.from('profiles').update({ gift_balance: user.giftBalance - gift.price }).eq('id', user.id);
    if (deductErr) return;

    // 2. Add transaction record
    await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'gift_sent',
      amount: gift.price,
      related_entity_id: postId,
      status: 'completed'
    });

    // 3. Increment Post Gifts
    const post = posts.find(p => p.id === postId);
    if (post) {
      await supabase.from('posts').update({ gifts_received: (post.gifts || 0) + gift.price }).eq('id', postId);
      // 4. Add to receiver balance 
      // Need to fetch receiver id from post.userId
      const { data: authorData } = await supabase.from('profiles').select('gift_balance').eq('id', post.userId).single();
      if (authorData) {
        await supabase.from('profiles').update({ gift_balance: authorData.gift_balance + gift.price }).eq('id', post.userId);
      }
    }

    fetchUserProfile(user.id);
    fetchPosts();
    handleNotify(`Apresiasi ${gift.name} terkirim!`, 'success');
  };

  // --- Admin Actions Mock/Impl ---
  // Note: Implementing full Admin actions with Supabase would require RLS policies and more handlers.
  // We will basic implementations.

  // --- Admin Data Fetching ---
  const fetchAdminData = async () => {
    if (!user?.isAdmin) return;

    // Fetch TopUps
    const { data: topUps } = await supabase.from('transactions').select('*, profiles(name)').eq('type', 'topup').eq('status', 'pending');
    if (topUps) {
      setTopUpRequests(topUps.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        userName: t.profiles?.name || 'User',
        points: t.amount,
        price: t.amount,
        status: t.status,
        timestamp: new Date(t.created_at)
      })));
    }

    // Fetch Withdraws
    const { data: withdraws } = await supabase.from('transactions').select('*, profiles(name)').eq('type', 'withdraw').eq('status', 'pending');
    if (withdraws) {
      setWithdrawRequests(withdraws.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        userName: t.profiles?.name || 'User',
        amount: t.amount,
        method: 'Bank Transfer',
        account: 'N/A',
        status: t.status,
        timestamp: new Date(t.created_at)
      })));
    }

    // Fetch Registration Requests (Pending Users)
    const { data: pendingUsers } = await supabase.from('profiles').select('*').eq('status', 'pending');
    if (pendingUsers) {
      setSignupRequests(pendingUsers.map((p: any) => ({
        id: p.id,
        name: p.name,
        username: p.username,
        avatar: p.avatar_url,
        bio: p.bio,
        waNumber: p.wa_number,
        email: p.email,
        address: p.address,
        status: p.status,
        timestamp: new Date(p.updated_at || Date.now())
      })));
    }

    // Fetch Reports
    const { data: reportsData } = await supabase.from('reports').select('*, profiles(name), posts(title)').eq('status', 'pending');
    if (reportsData) {
      setReports(reportsData.map((r: any) => ({
        id: r.id,
        postId: r.post_id,
        postTitle: r.posts?.title || 'Unknown Post',
        reporterName: r.profiles?.name || 'Reporter',
        reason: r.reason,
        status: r.status,
        timestamp: new Date(r.created_at)
      })));
    }
  };

  useEffect(() => {
    if (view === 'admin') {
      fetchAdminData();
      fetchAllUsers();
    }
  }, [view]);


  // --- Admin Actions ---

  const handleApproveTopUp = async (id: string) => {
    const req = topUpRequests.find(r => r.id === id);
    if (!req) return;

    await supabase.from('transactions').update({ status: 'completed' }).eq('id', id);

    const { data: userData } = await supabase.from('profiles').select('gift_balance').eq('id', req.userId).single();
    if (userData) {
      await supabase.from('profiles').update({ gift_balance: userData.gift_balance + req.points }).eq('id', req.userId);
    }

    fetchAdminData();
    handleNotify('Top up disetujui.', 'success');
  };

  const handleApproveWithdraw = async (id: string) => {
    await supabase.from('transactions').update({ status: 'completed' }).eq('id', id);
    fetchAdminData();
    handleNotify('Penarikan disetujui.', 'success');
  };

  const handleApproveUser = async (id: string) => {
    await supabase.from('profiles').update({ status: 'approved' }).eq('id', id);
    fetchAdminData();
    handleNotify('User disetujui.', 'success');
  };

  const handleRejectUser = async (id: string) => {
    await supabase.from('profiles').update({ status: 'rejected' }).eq('id', id);
    fetchAdminData();
    handleNotify('User ditolak.', 'info');
  };

  const onDismissReport = async (id: string) => {
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', id);
    fetchAdminData();
    handleNotify('Laporan diabaikan.', 'success');
  };

  const onDeletePost = async (postId: string, reportId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
    await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
    fetchAdminData();
    fetchPosts();
    handleNotify('Post dihapus.', 'success');
  };

  // --- Render ---

  // NOTE: Reuse existing layout code, just replace handlers and state

  const activeTopAd = useMemo(() => ads.find(a => a.isActive && a.position === 'top'), [ads]);
  const activeBottomAd = useMemo(() => ads.find(a => a.isActive && a.position === 'bottom'), [ads]);

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-200 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-200 rounded-full blur-[120px] opacity-40"></div>

        <div className="w-full max-w-xl text-center relative z-10">
          <div className="w-20 h-20 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shadow-2xl mx-auto mb-10 float-animation">
            <i className="fas fa-feather-alt text-white text-3xl"></i>
          </div>
          <VokeLogo className="text-8xl mb-12 block" />

          <div className="voke-card p-10 md:p-14 text-left animate-in fade-in zoom-in duration-500">
            <h3 className="text-2xl font-black text-slate-800 mb-8 text-center uppercase tracking-widest">
              {authMode === 'login' ? 'Masuk' : 'Daftar'}
            </h3>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input required type="email" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="email@example.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input required type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">Masuk ke VOꓘE</button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama</label>
                    <input required type="text" value={signupForm.name} onChange={e => setSignupForm({ ...signupForm, name: e.target.value })} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="Nama asli" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <input required type="text" value={signupForm.username} onChange={e => setSignupForm({ ...signupForm, username: e.target.value })} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="@user" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input required type="email" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="mail@voke.id" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input required type="password" value={signupForm.password} onChange={e => setSignupForm({ ...signupForm, password: e.target.value })} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95">Kirim Pendaftaran</button>
              </form>
            )}

            <p className="mt-10 text-[11px] text-slate-400 font-bold uppercase text-center tracking-widest">
              {authMode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-indigo-600 font-black ml-2 hover:underline">
                {authMode === 'login' ? 'Registrasi' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Navigation */}
      <nav className="sticky top-0 z-[100] bg-white/90 backdrop-blur-2xl border-b border-slate-100 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setView('home')}>
            <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <i className="fas fa-feather-alt text-white text-xl"></i>
            </div>
            <VokeLogo className="text-2xl" />
          </div>

          <div className="hidden lg:flex items-center bg-slate-50 p-1.5 rounded-[1.5rem]">
            <button onClick={() => setView('home')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'home' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Beranda</button>
            <button onClick={() => setView('saved')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'saved' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Disimpan</button>
            <button onClick={() => setView('wallet')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'wallet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Dompet</button>
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={() => setIsWriting(true)} className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
              <i className="fas fa-plus"></i>
            </button>
            {user?.isAdmin && (
              <button onClick={() => setView('admin')} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${view === 'admin' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                <i className="fas fa-shield-halved"></i>
              </button>
            )}
            <div onClick={() => setView('profile')} className="w-11 h-11 rounded-full border-2 border-white overflow-hidden cursor-pointer shadow-sm hover:ring-4 hover:ring-indigo-500/10 transition-all">
              <img src={user?.avatar} className="w-full h-full object-cover" />
            </div>
            <button onClick={handleLogout} className="w-11 h-11 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all">
              <i className="fas fa-power-off"></i>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {view === 'admin' ? (
          <AdminDashboard
            topUps={topUpRequests}
            reports={reports}
            pendingPromos={posts.filter(p => p.isPendingPromotion)}
            signupRequests={signupRequests}
            ads={ads}
            allUsers={allUsers}
            withdraws={withdrawRequests}
            viewRate={viewRate}
            onUpdateViewRate={setViewRate}
            onApproveTopUp={handleApproveTopUp}
            onRejectTopUp={() => { }}
            onApproveWithdraw={handleApproveWithdraw}
            onRejectWithdraw={() => { }}
            onApprovePromo={() => { }}
            onRejectPromo={() => { }}
            onDismissReport={onDismissReport}
            onDeletePost={onDeletePost}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
            onSaveAd={() => { }}
            onDeleteAd={() => { }}
            onToggleAd={() => { }}
            onClose={() => setView('home')}
          />
        ) : isWriting ? (
          <RichEditor onPublish={(t, c, cap) => handlePublish(t, c, cap)} onCancel={() => setIsWriting(false)} onNotify={handleNotify} />
        ) : view === 'profile' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="voke-card p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-indigo-50/50"></div>
              <div className="relative z-10">
                <img src={user?.avatar} className="w-32 h-32 rounded-[2.5rem] object-cover mx-auto mb-6 border-4 border-white shadow-xl" />
                <h2 className="text-3xl font-[800] text-slate-900">{user?.name}</h2>
                <p className="text-indigo-600 font-bold mb-6">{user?.username}</p>
                <p className="text-slate-500 max-w-md mx-auto mb-10 leading-relaxed text-sm">{user?.bio || 'Kreator di platform VOꓘE.'}</p>

                <div className="flex justify-center space-x-10 mb-10">
                  <div><p className="text-xl font-black">{posts.filter(p => p.userId === user?.id).length}</p><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Karya</p></div>
                  <div><p className="text-xl font-black">{user?.followersCount}</p><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Pengikut</p></div>
                  <div><p className="text-xl font-black">{user?.followingCount}</p><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Mengikuti</p></div>
                </div>

                <div className="flex justify-center space-x-3">
                  <button onClick={() => setView('edit-profile')} className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Edit Profil</button>
                  <button onClick={() => setView('wallet')} className="px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Dompet</button>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              {posts.filter(p => p.userId === user?.id).map(p => <PostCard key={p.id} post={p} isFollowing={false} isSaved={savedPosts.has(p.id)} onFollowToggle={() => { }} onLike={handleLike} onSaveToggle={id => setSavedPosts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} onAddComment={handleAddComment} onGift={handleGift} onNotify={handleNotify} userGiftBalance={totalBalance} />)}
            </div>
          </div>
        ) : view === 'wallet' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Poin Tersedia</p>
              <h2 className="text-6xl font-[800] tracking-tighter mb-10">
                {totalBalance.toLocaleString('id-ID')} <span className="text-lg font-medium opacity-50 ml-2">Poin</span>
              </h2>
              <div className="flex gap-4">
                <button onClick={() => setIsTopUpOpen(true)} className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl">Isi Poin</button>
                <button onClick={() => setIsWithdrawOpen(true)} className="px-10 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest border border-slate-700 hover:bg-slate-700 transition-all">Tarik Dana</button>
              </div>
            </div>
            {/* Wallet Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="voke-card p-8 bg-indigo-50 border-indigo-100">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-black text-lg text-indigo-900">Program View</h5>
                  <div className="flex items-center space-x-1 bg-emerald-100 text-emerald-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    <i className="fas fa-arrow-up text-[8px]"></i>
                    <span>Tren Naik</span>
                  </div>
                </div>
                <p className="text-xs text-indigo-700/70 leading-relaxed font-bold">Potensi pendapatan dari penonton sedang meningkat pesat.</p>
              </div>
              <div className="voke-card p-8 bg-amber-50 border-amber-100">
                <div className="flex justify-between items-start mb-2">
                  <h5 className="font-black text-lg text-amber-900">Dukungan Hadiah</h5>
                  <div className="flex items-center space-x-1 bg-amber-100 text-amber-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    <i className="fas fa-check text-[8px]"></i>
                    <span>Stabil</span>
                  </div>
                </div>
                <p className="text-xs text-amber-700/70 leading-relaxed font-bold">Apresiasi langsung pembaca terhadap karya Anda tetap terjaga.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {activeTopAd && (
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] p-10 text-white relative shadow-2xl group border border-slate-800">
                {/* Ad Content */}
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
                  <div className="flex-1 w-full">
                    <span className="bg-indigo-500/20 text-indigo-400 text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-indigo-500/30 mb-4 inline-block">Sponsor VOꓘE</span>
                    {activeTopAd.embedCode ? (
                      <div className="w-full overflow-hidden rounded-2xl bg-white/5 p-4" dangerouslySetInnerHTML={{ __html: activeTopAd.embedCode }} />
                    ) : (
                      <>
                        <h4 className="text-2xl font-black mb-2">{activeTopAd.title || 'Pariwara'}</h4>
                        <p className="text-slate-400 text-sm mb-6">{activeTopAd.description || 'Lihat penawaran menarik kami.'}</p>
                        {activeTopAd.imageUrl && <img src={activeTopAd.imageUrl} className="w-full max-h-64 object-cover rounded-2xl mb-6 shadow-xl" alt="" />}
                        {activeTopAd.link && (
                          <a href={activeTopAd.link} target="_blank" className="inline-block bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Pelajari</a>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-10">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post} isFollowing={following.has(post.userId)} isSaved={savedPosts.has(post.id)}
                  onFollowToggle={id => setFollowing(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                  onLike={handleLike}
                  onSaveToggle={id => setSavedPosts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                  onAddComment={handleAddComment}
                  onGift={handleGift} onNotify={handleNotify} userGiftBalance={totalBalance} onTopUpRequest={() => setIsTopUpOpen(true)}
                  onPromoteRequest={id => handleNotify('Feature coming soon with DB', 'info')}
                  bottomAd={activeBottomAd}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <TopUpModal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} onSelect={() => { }} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} balance={totalBalance} onWithdraw={() => { }} />
      {activeNotification && <Notification notification={activeNotification} onClose={() => setActiveNotification(null)} />}
    </div>
  );
};

export default App;
