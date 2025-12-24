
import React, { useState, useMemo, useEffect } from 'react';
import { Post, User, Notification as NotificationType, Comment, TopUpRequest, ReportRecord, Advertisement, SignUpRequest, WithdrawRequest } from './types';
import { INITIAL_POSTS, CURRENT_USER, MOCK_USERS_DATA, MOCK_TOPUP_REQUESTS, MOCK_REPORTS, MOCK_ADS, MOCK_SIGNUP_REQUESTS } from './constants';
import { PostCard } from './components/PostCard';
import { RichEditor } from './components/RichEditor';
import { Notification } from './components/Notification';
import { ProfileEditor } from './components/ProfileEditor';
import { AdminDashboard } from './components/AdminDashboard';
import { GiftItem, WithdrawModal, TopUpModal } from './components/Modals';

type ViewType = 'home' | 'saved' | 'profile' | 'edit-profile' | 'admin' | 'landing' | 'wallet';

// Menggunakan Unicode ꓘ (U+A4D8) agar stabil tanpa CSS transform yang sering menyebabkan bug render pada gradient text
export const VokeLogo = ({ className = "text-2xl", withGradient = true }: { className?: string, withGradient?: boolean }) => (
  <span className={`voke-logo inline-flex items-center font-[800] uppercase tracking-tighter ${withGradient ? 'voke-gradient-text' : 'text-slate-900'} ${className}`}>
    VOꓘE
  </span>
);

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<Record<string, User>>(MOCK_USERS_DATA);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>(MOCK_TOPUP_REQUESTS);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>(MOCK_REPORTS);
  const [signupRequests, setSignupRequests] = useState<SignUpRequest[]>(MOCK_SIGNUP_REQUESTS);
  const [ads, setAds] = useState<Advertisement[]>(MOCK_ADS);
  const [viewRate, setViewRate] = useState<number>(0.0001);
  const [following, setFollowing] = useState<Set<string>>(new Set(['user1']));
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [isWriting, setIsWriting] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [view, setView] = useState<ViewType>('landing');
  const [activeNotification, setActiveNotification] = useState<NotificationType | null>(null);
  
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [signupForm, setSignupForm] = useState({ 
    name: '', username: '', password: '', bio: '', waNumber: '', email: '', address: '',
    avatar: `https://picsum.photos/seed/${Math.random()}/200` 
  });

  const handleNotify = (message: string, type: 'success' | 'error' | 'info') => {
    const newNotif: NotificationType = { id: Date.now().toString(), message, type, timestamp: new Date() };
    setActiveNotification(newNotif);
  };

  useEffect(() => {
    if (user && allUsers[user.id]) {
      const dbUser = allUsers[user.id];
      if (dbUser.giftBalance !== user.giftBalance || dbUser.name !== user.name) {
        setUser(dbUser);
      }
    }
  }, [allUsers]);

  const totalBalance = useMemo(() => user?.giftBalance || 0, [user]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const { username, password } = loginForm;
    
    // Admin login special case
    if (username === 'superadmin' && password === 'superman') {
      setUser(CURRENT_USER);
      setView('home');
      handleNotify('Mode Administrator Aktif', 'success');
      return;
    }

    const cleanUsername = username.startsWith('@') ? username : `@${username}`;
    const foundUser = (Object.values(allUsers) as User[]).find(u => u.username === cleanUsername);
    
    if (foundUser && foundUser.password === password) {
      setUser(foundUser);
      setView('home');
      handleNotify(`Selamat datang kembali, ${foundUser.name}!`, 'success');
    } else {
      handleNotify('Kredensial tidak valid.', 'error');
    }
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedUsername = signupForm.username.startsWith('@') ? signupForm.username : `@${signupForm.username}`;
    const newRequest: SignUpRequest = {
      id: `req-${Date.now()}`, ...signupForm, username: formattedUsername, status: 'pending', timestamp: new Date()
    };
    setSignupRequests(prev => [newRequest, ...prev]);
    handleNotify('Pendaftaran terkirim. Mohon tunggu verifikasi admin.', 'success');
    setAuthMode('login');
  };

  // --- Admin Handlers ---
  const handleUpdateViewRate = (newRate: number) => { setViewRate(newRate); handleNotify('Rate monetisasi diperbarui!', 'success'); };
  
  const handleApproveTopUp = (id: string) => {
    const req = topUpRequests.find(r => r.id === id);
    if (req) {
      setAllUsers(prev => ({
        ...prev, [req.userId]: { ...prev[req.userId], giftBalance: (prev[req.userId]?.giftBalance || 0) + req.points }
      }));
      setTopUpRequests(prev => prev.filter(r => r.id !== id));
      handleNotify('Top up poin disetujui.', 'success');
    }
  };

  const handleApproveWithdraw = (id: string) => {
    setWithdrawRequests(prev => prev.filter(r => r.id !== id));
    handleNotify('Pencairan dana telah diverifikasi.', 'success');
  };

  const handleApproveUser = (id: string) => {
    const req = signupRequests.find(r => r.id === id);
    if (req) {
      const newUser: User = {
        id: `user-${Date.now()}`, 
        name: req.name,
        username: req.username,
        password: req.password,
        avatar: req.avatar,
        bio: req.bio,
        waNumber: req.waNumber,
        email: req.email,
        address: req.address,
        followersCount: 0, 
        followingCount: 0, 
        giftBalance: 1000, 
        status: 'approved'
      };
      setAllUsers(prev => ({ ...prev, [newUser.id]: newUser }));
      setSignupRequests(prev => prev.filter(r => r.id !== id));
      handleNotify(`Akun ${req.username} telah diaktifkan.`, 'success');
    }
  };

  const handleApprovePromo = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPromoted: true, isPendingPromotion: false, promotedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } : p));
    handleNotify('Karya telah masuk Spotlight.', 'success');
  };

  const handleRejectPromo = (postId: string) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPendingPromotion: false } : p));
    handleNotify('Permintaan Spotlight ditolak.', 'info');
  };

  const handleDeletePost = (postId: string, reportId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    setReports(prev => prev.filter(r => r.id !== reportId));
    handleNotify('Konten telah dihapus dari server.', 'error');
  };

  const handleSaveAd = (ad: Advertisement) => {
    setAds(prev => {
      const exists = prev.find(a => a.id === ad.id);
      if (exists) return prev.map(a => a.id === ad.id ? ad : a);
      return [ad, ...prev];
    });
    handleNotify('Data iklan berhasil disimpan.', 'success');
  };

  const handleToggleAd = (id: string) => {
    setAds(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
    handleNotify('Status tayang iklan diperbarui.', 'success');
  };

  const handleIncrementView = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const authorId = p.userId;
        if (user && authorId !== user.id) {
          setAllUsers(prevUsers => ({
            ...prevUsers,
            [authorId]: { ...prevUsers[authorId], giftBalance: (prevUsers[authorId]?.giftBalance || 0) + viewRate }
          }));
        }
        return { ...p, views: p.views + 1 };
      }
      return p;
    }));
  };

  const handleGift = (postId: string, gift: GiftItem) => {
    if (totalBalance < gift.price) { setIsTopUpOpen(true); return; }
    if (user) {
      const targetPost = posts.find(p => p.id === postId);
      if (!targetPost) return;
      setAllUsers(prev => ({
        ...prev,
        [user.id]: { ...prev[user.id], giftBalance: prev[user.id].giftBalance - gift.price },
        [targetPost.userId]: { ...prev[targetPost.userId], giftBalance: (prev[targetPost.userId]?.giftBalance || 0) + gift.price }
      }));
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const stats = p.giftStats || {};
          const currentStat = stats[gift.name] || { count: 0, icon: gift.icon };
          return { ...p, gifts: p.gifts + gift.price, giftStats: { ...stats, [gift.name]: { count: currentStat.count + 1, icon: gift.icon } } };
        }
        return p;
      }));
      handleNotify(`Apresiasi ${gift.name} terkirim!`, 'success');
    }
  };

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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                  <input required type="text" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="@username" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input required type="password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">Masuk ke VOꓘE</button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama</label>
                    <input required type="text" value={signupForm.name} onChange={e => setSignupForm({...signupForm, name: e.target.value})} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="Nama asli" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <input required type="text" value={signupForm.username} onChange={e => setSignupForm({...signupForm, username: e.target.value})} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="@user" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input required type="email" value={signupForm.email} onChange={e => setSignupForm({...signupForm, email: e.target.value})} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="mail@voke.id" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input required type="password" value={signupForm.password} onChange={e => setSignupForm({...signupForm, password: e.target.value})} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="••••••••" />
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
            <button onClick={() => { setUser(null); setView('landing'); }} className="w-11 h-11 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all">
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
            onUpdateViewRate={handleUpdateViewRate}
            onApproveTopUp={handleApproveTopUp} 
            onRejectTopUp={id => setTopUpRequests(prev => prev.filter(r => r.id !== id))} 
            onApproveWithdraw={handleApproveWithdraw}
            onRejectWithdraw={id => setWithdrawRequests(prev => prev.filter(r => r.id !== id))}
            onApprovePromo={handleApprovePromo} 
            onRejectPromo={handleRejectPromo} 
            onDismissReport={id => setReports(prev => prev.filter(r => r.id !== id))} 
            onDeletePost={handleDeletePost} 
            onApproveUser={handleApproveUser} 
            onRejectUser={id => setSignupRequests(prev => prev.filter(r => r.id !== id))} 
            onSaveAd={handleSaveAd} 
            onDeleteAd={id => setAds(prev => prev.filter(a => a.id !== id))} 
            onToggleAd={handleToggleAd} 
            onClose={() => setView('home')}
          />
        ) : isWriting ? (
          <RichEditor onPublish={(t, c, cap) => { setPosts([{ id: Date.now().toString(), userId: user!.id, title: t, content: c, caption: cap, likes: 0, comments: [], shares: 0, gifts: 0, views: 0, timestamp: new Date() }, ...posts]); setIsWriting(false); setView('home'); }} onCancel={() => setIsWriting(false)} onNotify={handleNotify} />
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
              {posts.filter(p => p.userId === user?.id).map(p => <PostCard key={p.id} post={p} isFollowing={false} isSaved={savedPosts.has(p.id)} onFollowToggle={() => {}} onLike={() => {}} onSaveToggle={id => setSavedPosts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} onAddComment={() => {}} onGift={handleGift} onNotify={handleNotify} userGiftBalance={totalBalance} onView={handleIncrementView} />)}
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
                  onLike={id => setPosts(prev => prev.map(p => p.id === id ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked } : p))}
                  onSaveToggle={id => setSavedPosts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                  onAddComment={(id, text) => setPosts(prev => prev.map(p => p.id === id ? { ...p, comments: [...p.comments, { id: Date.now().toString(), userId: user!.id, userName: user!.name, text, timestamp: new Date() }] } : p))}
                  onGift={handleGift} onNotify={handleNotify} userGiftBalance={totalBalance} onTopUpRequest={() => setIsTopUpOpen(true)}
                  onView={handleIncrementView}
                  onPromoteRequest={id => setPosts(prev => prev.map(p => p.id === id ? { ...p, isPendingPromotion: true } : p))}
                  bottomAd={activeBottomAd}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <TopUpModal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} onSelect={pkg => { setTopUpRequests([{ id: `tr-${Date.now()}`, userId: user!.id, userName: user!.name, points: pkg.points, price: pkg.price, status: 'pending', timestamp: new Date() }, ...topUpRequests]); setIsTopUpOpen(false); handleNotify('Permintaan Top-Up telah diajukan.', 'info'); }} />
      <WithdrawModal isOpen={isWithdrawOpen} onClose={() => setIsWithdrawOpen(false)} balance={totalBalance} onWithdraw={(amt, meth, acc) => { setWithdrawRequests([{id: `wr-${Date.now()}`, userId: user!.id, userName: user!.name, amount: amt, method: meth, account: acc, status: 'pending', timestamp: new Date()}, ...withdrawRequests]); setIsWithdrawOpen(false); handleNotify('Permintaan penarikan dana sedang diproses.', 'success'); }} />
      {activeNotification && <Notification notification={activeNotification} onClose={() => setActiveNotification(null)} />}
    </div>
  );
};

export default App;
