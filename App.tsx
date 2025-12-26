
import React, { useState, useMemo, useEffect } from 'react';
import { Post, User, Notification as NotificationType, Comment, TopUpRequest, ReportRecord, Advertisement, SignUpRequest, WithdrawRequest } from './types';
import { PostCard } from './components/PostCard';
import { RichEditor } from './components/RichEditor';
import { Notification } from './components/Notification';
import { ProfileEditor } from './components/ProfileEditor';
import { AdminDashboard } from './components/AdminDashboard';
import { GiftItem, WithdrawModal, TopUpModal, SpotlightModal } from './components/Modals';
import { supabase } from './services/supabaseClient';

type ViewType = 'home' | 'saved' | 'profile' | 'edit-profile' | 'admin' | 'landing' | 'wallet';

const ADMIN_CONTACT = {
  email: 'vokehub@gmail.com',
  wa: '085163612553',
  waLink: 'https://wa.me/6285163612553'
};

// Refined Logo Component with Matching Icon
export const VokeLogo = ({ className = "text-2xl", withGradient = true }: { className?: string, withGradient?: boolean }) => (
  <span className={`voke-logo inline-flex items-center space-x-2 font-[800] uppercase tracking-tighter ${className}`}>
    <span className={`w-[1.2em] h-[1.2em] rounded-[0.45em] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 ${withGradient ? 'bg-gradient-to-br from-[#0EA5E9] to-[#2563EB]' : 'bg-slate-900'}`}>
      <i className="fas fa-feather-alt text-white text-[0.6em]"></i>
    </span>
    <span className={withGradient ? 'voke-gradient-text' : 'text-slate-900'} style={{ letterSpacing: '-0.06em' }}>
      VOꓘE
    </span>
  </span>
);

const App: React.FC = () => {
  console.log('%c VOKE SYSTEM v1.2.2 ACTIVE ', 'background: #2563EB; color: #white; font-weight: bold;');
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<ViewType>('landing');
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<Record<string, User>>({});

  const [posts, setPosts] = useState<Post[]>([]);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequest[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequest[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [signupRequests, setSignupRequests] = useState<SignUpRequest[]>([]);
  const [ads, setAds] = useState<Advertisement[]>([]);

  const [viewRate, setViewRate] = useState<number>(0.01); // 1 view = 0.01 point
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  const [isWriting, setIsWriting] = useState(false);
  const [activeDraft, setActiveDraft] = useState<Post | null>(null);
  const activeTopAd = useMemo(() => ads.find(a => a.isActive && a.position === 'top'), [ads]);
  const activeMiddleAd = useMemo(() => ads.find(a => a.isActive && a.position === 'middle'), [ads]);
  const activeBottomAd = useMemo(() => ads.find(a => a.isActive && a.position === 'bottom'), [ads]);
  const [drafts, setDrafts] = useState<Post[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [activeNotification, setActiveNotification] = useState<NotificationType | null>(null);

  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [activeSpotlight, setActiveSpotlight] = useState<Post | null>(null);
  const [shownSpotlights, setShownSpotlights] = useState<Set<string>>(new Set());
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = useMemo(() => {
    let result = posts;
    if (activePostId) {
      result = posts.filter(p => p.id === activePostId);
      if (result.length === 0) result = posts;
    } else if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = posts.filter(post =>
        post.title.toLowerCase().includes(query) ||
        (post.author?.name && post.author.name.toLowerCase().includes(query)) ||
        (post.author?.username && post.author.username.toLowerCase().includes(query)) ||
        post.content.toLowerCase().includes(query) ||
        (post.caption && post.caption.toLowerCase().includes(query))
      );
    }
    return result;
  }, [posts, searchQuery, activePostId]);

  const popularPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => {
        const scoreA = (a.likes * 5) + (a.comments.length * 10) + (a.views) + (a.gifts * 2);
        const scoreB = (b.likes * 5) + (b.comments.length * 10) + (b.views) + (b.gifts * 2);
        return scoreB - scoreA;
      })
      .slice(0, 5);
  }, [posts]);

  const editorPicks = useMemo(() => {
    return posts.filter(p => p.isEditorPick).slice(0, 5);
  }, [posts]);

  const newPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
  }, [posts]);

  const editorData = useMemo(() => {
    if (!activeDraft) return undefined;
    return {
      title: activeDraft.title,
      content: activeDraft.content,
      caption: activeDraft.caption || '',
      coverImage: activeDraft.coverImage
    };
  }, [activeDraft?.id, activeDraft?.title, activeDraft?.content, activeDraft?.caption, activeDraft?.coverImage]);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({ name: '', username: '', email: '', password: '', bio: '', waNumber: '', address: '', avatar: '' });

  const handleNotify = (message: string, type: 'success' | 'error' | 'info') => {
    const newNotif: NotificationType = { id: Date.now().toString(), message, type, timestamp: new Date() };
    setActiveNotification(newNotif);
  };

  // --- Auth & Initial Data Fetching ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        // Parallelize fetching, don't await blocking
        fetchUserProfile(session.user.id);
        setView('home');
      }
      setIsInitializing(false);
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
    if (session) {
      fetchPosts();
      fetchAds();
      fetchSavedPosts(); // Fetch saved posts from database
      fetchAllUsers(); // For Admin Dashboard compatibility

      // Handle direct link to post
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('post') || params.get('id');
      if (postId) {
        setActivePostId(postId);
      }
    }
  }, [user]);

  // Spotlight Popup Logic
  useEffect(() => {
    if (view === 'home' && posts.length > 0 && !activeSpotlight) {
      const pending = posts.find(p =>
        p.isPromoted &&
        !shownSpotlights.has(p.id) &&
        p.userId !== user?.id &&
        (!p.promotedUntil || new Date(p.promotedUntil) > new Date())
      );
      if (pending) {
        setActiveSpotlight(pending);
        setShownSpotlights(prev => new Set(prev).add(pending.id));
      }
    }
  }, [posts, activeSpotlight, shownSpotlights, view, user?.id]);

  const updateViewRate = async (rate: number) => {
    const { error } = await supabase.from('settings').upsert({ key: 'view_rate', value: rate });
    if (error) {
      handleNotify('Gagal update rate: ' + error.message, 'error');
    } else {
      setViewRate(rate);
      handleNotify('Rate diupdate.', 'success');
    }
  };

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
      // Check if user is approved
      if (data.status === 'pending') {
        handleNotify('Akun Anda menunggu persetujuan admin. Silakan hubungi admin.', 'info');
        await supabase.auth.signOut();
        setUser(null);
        setView('landing');
        return;
      }

      if (data.status === 'rejected') {
        handleNotify('Akun Anda ditolak oleh admin.', 'error');
        await supabase.auth.signOut();
        setUser(null);
        setView('landing');
        return;
      }

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
    setIsLoadingPosts(true);
    console.log('Fetching posts...');
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        gifts_received,
        profiles!user_id (name, username, avatar_url),
        likes (user_id),
        comments (id, text, user_id, created_at, profiles(name))
      `)
      .eq('status', 'published')
      .order('is_promoted', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      handleNotify('Gagal memuat posts: ' + error.message, 'error');
      setIsLoadingPosts(false);
      return;
    }

    console.log('Posts fetched:', data?.length || 0, 'posts');

    if (data) {
      console.log('--- RAW POST DATA SAMPLE ---', data[0]);
      const mappedPosts: Post[] = data.map((p: any) => ({
        id: p.id,
        userId: p.user_id,
        title: p.title,
        content: p.content,
        caption: p.caption,
        likes: p.likes_count || 0,
        shares: p.shares_count || 0,
        views: p.views_count || 0,
        coverImage: p.cover_image,
        gifts: p.gifts_received || 0,
        timestamp: new Date(p.created_at),
        isPromoted: p.is_promoted,
        isEditorPick: p.is_editor_pick,
        promotedUntil: p.promoted_until ? new Date(p.promoted_until) : undefined,
        isPendingPromotion: p.is_pending_promotion,
        author: p.profiles ? {
          name: p.profiles.name,
          username: p.profiles.username,
          avatar: p.profiles.avatar_url
        } : undefined,
        comments: p.comments.map((c: any) => ({
          id: c.id,
          userId: c.user_id,
          userName: c.profiles?.name || 'User',
          text: c.text,
          timestamp: new Date(c.created_at)
        })),
        isLiked: p.likes.some((l: any) => l.user_id === user?.id),
      }));
      console.log('Mapped posts:', mappedPosts.length);
      console.log('Gift values in posts:', mappedPosts.map(p => ({ id: p.id, gifts: p.gifts })));
      setPosts(mappedPosts);
    }
    setIsLoadingPosts(false);
  };

  const fetchDrafts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching drafts:', error);
    } else if (data) {
      setDrafts(data.map((p: any) => ({
        ...p,
        userId: p.user_id,
        timestamp: new Date(p.created_at),
        likes: 0,
        shares: 0,
        views: 0,
        gifts: 0,
        comments: [],
        author: { name: user.name, username: user.username, avatar: user.avatar }
      })));
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

  // Fetch Saved Posts from Database
  const fetchSavedPosts = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching saved posts:', error);
      return;
    }

    if (data) {
      const postIds = new Set(data.map((s: any) => s.post_id));
      setSavedPosts(postIds);
      console.log('Loaded saved posts:', postIds.size);
    }
  };

  // Toggle Save/Unsave Post
  const handleSaveToggle = async (postId: string) => {
    if (!user) return;

    const isSaved = savedPosts.has(postId);

    if (isSaved) {
      // UNSAVE: Delete from database
      const { error } = await supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', postId);

      if (error) {
        console.error('Failed to unsave post:', error);
        handleNotify('Gagal menghapus simpanan', 'error');
        return;
      }

      // Update local state
      setSavedPosts(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      handleNotify('Post dihapus dari simpanan', 'success');
    } else {
      // SAVE: Insert to database
      const { error } = await supabase
        .from('saved_posts')
        .insert({ user_id: user.id, post_id: postId });

      if (error) {
        console.error('Failed to save post:', error);
        handleNotify('Gagal menyimpan post', 'error');
        return;
      }

      // Update local state
      setSavedPosts(prev => new Set(prev).add(postId));
      handleNotify('Post berhasil disimpan!', 'success');
    }
  };

  const totalBalance = useMemo(() => user?.giftBalance || 0, [user]);

  // Global Debugger
  useEffect(() => {
    (window as any).__VOKE_DEBUG__ = {
      posts,
      user,
      totalBalance,
      version: '1.2.1-debug'
    };
  }, [posts, user, totalBalance]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let emailToLogin = loginForm.email.trim();

    // Check if input is likely a username (no @ symbol)
    if (!emailToLogin.includes('@')) {
      let usernameInput = emailToLogin;
      if (!usernameInput.startsWith('@')) usernameInput = '@' + usernameInput;

      // Resolve username to email
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', usernameInput)
        .single();

      if (profileError || !profile || !profile.email) {
        handleNotify('Username tidak ditemukan.', 'error');
        setIsLoading(false);
        return;
      }
      emailToLogin = profile.email;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailToLogin,
      password: loginForm.password,
    });

    if (error) {
      handleNotify(error.message === 'Invalid login credentials' ? 'Password salah atau akun tidak ditemukan.' : error.message, 'error');
    } else {
      handleNotify('Login berhasil!', 'success');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formattedUsername = signupForm.username.startsWith('@') ? signupForm.username : `@${signupForm.username}`;

      // Check if username already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', formattedUsername)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking username:', checkError);
        handleNotify('Gagal memeriksa username: ' + checkError.message, 'error');
        setIsLoading(false);
        return;
      }

      if (existingUser) {
        handleNotify('Username sudah digunakan. Silakan pilih username lain.', 'error');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: signupForm.email,
        password: signupForm.password,
        options: {
          data: {
            full_name: signupForm.name,
            username: formattedUsername,
            avatar_url: signupForm.avatar
          }
        }
      });

      if (error) {
        console.error('Signup Error:', error);
        handleNotify(error.message, 'error');
        setIsLoading(false);
      } else {
        if (data.user) {
          // Update profile with extra fields, using upsert to be safe if trigger failed
          const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            name: signupForm.name,
            username: formattedUsername,
            avatar_url: signupForm.avatar,
            email: signupForm.email,
            bio: signupForm.bio,
            wa_number: signupForm.waNumber,
            address: signupForm.address,
            status: 'pending',
            role: 'user',
            gift_balance: 0
          });

          if (profileError) {
            console.error('Profile update error:', profileError);
            // handleNotify('Profile update failed: ' + profileError.message, 'error'); // Optional: show to user
          }

          // Logout user immediately after signup (they need admin approval first)
          await supabase.auth.signOut();

          handleNotify('Pendaftaran berhasil! Tunggu persetujuan admin untuk login.', 'success');
          setAuthMode('login');
          setIsLoading(false);
        } else {
          handleNotify('Warning: No user data returned', 'info');
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Unexpected Signup Exception:', err);
      handleNotify('Terjadi kesalahan tidak terduga: ' + (err.message || err), 'error');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('landing');
  };

  const handleUpdateProfile = async (updatedUser: User) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        name: updatedUser.name,
        username: updatedUser.username,
        bio: updatedUser.bio,
        avatar_url: updatedUser.avatar,
        wa_number: updatedUser.waNumber,
        address: updatedUser.address
      })
      .eq('id', user.id);

    if (error) {
      handleNotify('Gagal memperbarui profil: ' + error.message, 'error');
    } else {
      handleNotify('Profil berhasil diperbarui!', 'success');
      fetchUserProfile(user.id); // Refresh user data
      setView('profile');
    }
  };

  // --- Actions ---

  const handlePublish = async (title: string, content: string, caption: string, coverImage?: string) => {
    if (!user) return;

    let error;

    if (activeDraft) {
      // Update existing draft to published
      const updateData: any = {
        title,
        content,
        caption,
        cover_image: coverImage,
        status: 'published'
      };

      // Only update created_at if it was a draft (effectively setting the publish date)
      if (activeDraft.status === 'draft') {
        updateData.created_at = new Date().toISOString();
      }

      const { error: updateError } = await supabase.from('posts').update(updateData).eq('id', activeDraft.id);
      error = updateError;
    } else {
      // Insert new post
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        title,
        content,
        caption,
        cover_image: coverImage,
        status: 'published'
      });
      error = insertError;
    }

    if (error) {
      handleNotify('Gagal menerbitkan karya: ' + (error as any).message, 'error');
    } else {
      handleNotify('Karya diterbitkan!', 'success');
      setIsWriting(false);
      setActiveDraft(null);
      fetchPosts();
      setView('home');
    }
  };

  const handleSaveDraft = async (title: string, content: string, caption: string, coverImage?: string) => {
    if (!user) return;

    let error;

    if (activeDraft) {
      // Update existing draft
      const { error: updateError } = await supabase.from('posts').update({
        title,
        content,
        caption,
        cover_image: coverImage
      }).eq('id', activeDraft.id);
      error = updateError;
    } else {
      // Insert new draft
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        title,
        content,
        caption,
        cover_image: coverImage,
        status: 'draft'
      });
      error = insertError;
    }

    if (error) {
      handleNotify('Gagal menyimpan draf: ' + (error as any).message, 'error');
    } else {
      handleNotify('Draf berhasil disimpan ke database!', 'success');
      setIsWriting(false);
      setActiveDraft(null);
      if (view === 'drafts') fetchDrafts();
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;

    const { error } = await supabase.from('posts').delete().eq('id', postId);

    if (error) {
      handleNotify('Gagal menghapus tulisan: ' + error.message, 'error');
    } else {
      handleNotify('Tulisan berhasil dihapus.', 'success');
      fetchPosts();
      if (view === 'drafts') fetchDrafts();
    }
  };

  const handleEdit = (post: Post) => {
    setActiveDraft(post);
    setIsWriting(true);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic Update
    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));

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
    console.log('--- handleGift Triggered ---');
    console.log('PostId:', postId);
    console.log('Gift:', gift);
    console.log('User:', user?.id, 'Balance:', user?.giftBalance);

    if (!user) {
      console.warn('No user logged in');
      return;
    }
    if (totalBalance < gift.price) {
      setIsTopUpOpen(true);
      handleNotify('Saldo tidak mencukupi.', 'error');
      return;
    }

    // 1. Deduct from sender
    const { error: deductErr } = await supabase.from('profiles').update({ gift_balance: user.giftBalance - gift.price }).eq('id', user.id);
    if (deductErr) {
      console.error('Error deducting balance from sender:', deductErr);
      handleNotify('Gagal memotong saldo: ' + deductErr.message, 'error');
      return;
    }

    // 2. Add transaction record
    const { error: txErr } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'gift_sent',
      amount: gift.price,
      related_entity_id: postId,
      status: 'completed'
    });
    if (txErr) console.warn('Gagal mencatat transaksi:', txErr);

    // 3. Increment Post Gifts
    const post = posts.find(p => p.id === postId);
    if (post) {
      console.log('Attemping to increment Post gifts for:', postId);
      const { error: postUpdateErr } = await supabase.from('posts').update({ gifts_received: (post.gifts || 0) + gift.price }).eq('id', postId);
      if (postUpdateErr) {
        console.error('FAILED Post Update:', postUpdateErr.message, postUpdateErr.details);
        handleNotify('Gagal update post (RLS?): ' + postUpdateErr.message, 'info');
      } else {
        console.log('SUCCESS Post Update');
      }

      // 4. Add to receiver balance 
      console.log('Fetching author balance for profile:', post.userId);
      const { data: authorData, error: fetchErr } = await supabase.from('profiles').select('gift_balance').eq('id', post.userId).single();
      if (fetchErr) {
        console.error('FAILED Fetch Receiver Profile:', fetchErr.message);
      } else if (authorData) {
        const currentAuthorBalance = parseFloat(authorData.gift_balance.toString()) || 0;
        console.log('Current receiver balance:', currentAuthorBalance);
        console.log('Adding:', gift.price);

        const { error: receiveErr } = await supabase.from('profiles').update({ gift_balance: currentAuthorBalance + gift.price }).eq('id', post.userId);
        if (receiveErr) {
          console.error('FAILED Receiver Balance Update:', receiveErr.message, receiveErr.details);
          handleNotify('Poin gagal Masuk ke penerima. Ini biasanya karena kebijakan keamanan Supabase (RLS).', 'error');
        } else {
          console.log('SUCCESS Receiver Balance Update. New Total:', currentAuthorBalance + gift.price);
        }
      }
    }

    fetchUserProfile(user.id);
    fetchPosts();
    handleNotify(`Apresiasi ${gift.name} terkirim!`, 'success');
  };

  const handlePromoteRequest = async (postId: string, duration: number, cost: number) => {
    if (!user) return;
    if (user.giftBalance < cost) {
      handleNotify('Saldo tidak mencukupi untuk Spotlight.', 'error');
      return;
    }

    // 1. Deduct points
    const { error: deductErr } = await supabase.from('profiles').update({ gift_balance: user.giftBalance - cost }).eq('id', user.id);
    if (deductErr) {
      handleNotify('Gagal memproses poin: ' + deductErr.message, 'error');
      return;
    }

    // 2. Set pending promotion
    const { error: updateErr } = await supabase.from('posts').update({
      is_pending_promotion: true,
      // We'll store the requested duration in metadata if the table supports it, 
      // or just assume it's handled by the transaction record for now.
    }).eq('id', postId);

    if (updateErr) {
      handleNotify('Gagal mengajukan Spotlight: ' + updateErr.message, 'error');
      return;
    }

    // 3. Record transaction with duration metadata
    const { error: txErr } = await supabase.from('transactions').insert({
      user_id: user.id,
      type: 'promotion_request',
      amount: cost,
      related_entity_id: postId,
      status: 'completed',
      metadata: { duration, cost }
    });

    if (txErr) {
      console.warn('Transaction record failed but points deducted:', txErr.message);
    }

    fetchUserProfile(user.id);
    fetchPosts();
    handleNotify('Pengajuan Spotlight terkirim! Menunggu persetujuan admin.', 'success');
  };

  // --- Admin Actions Mock/Impl ---
  // Note: Implementing full Admin actions with Supabase would require RLS policies and more handlers.
  // We will basic implementations.

  // --- Admin Data Fetching ---
  const fetchAdminData = async () => {
    if (!user?.isAdmin) return;

    // Fetch TopUps
    const { data: topUps } = await supabase
      .from('transactions')
      .select('*, profiles(name)')
      .eq('type', 'topup')
      .eq('status', 'pending');

    if (topUps) {
      setTopUpRequests(topUps.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        userName: t.profiles?.name || 'User',
        points: t.amount,
        price: t.metadata?.price || t.amount,
        status: t.status,
        timestamp: new Date(t.created_at)
      })));
    }

    // Fetch Withdraws
    const { data: withdraws } = await supabase
      .from('transactions')
      .select('*, profiles(name)')
      .eq('type', 'withdraw')
      .eq('status', 'pending');

    if (withdraws) {
      setWithdrawRequests(withdraws.map((t: any) => ({
        id: t.id,
        userId: t.user_id,
        userName: t.profiles?.name || 'User',
        amount: t.amount,
        method: t.metadata?.method || 'Bank Transfer',
        account: t.metadata?.account || 'N/A',
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

    // Explicitly fetch pending promos if any (though fetchPosts already gets them, 
    // we need to make sure they are mapped and available for the AdminDashboard)
    // Actually, AdminDashboard uses `posts.filter(p => p.isPendingPromotion)` in the render props,
    // so we just need to make sure fetchPosts includes is_pending_promotion.
    // I already added is_pending_promotion to fetchPosts mapping.
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
    setIsProcessingTx(true);
    await supabase.from('transactions').update({ status: 'completed' }).eq('id', id);
    fetchAdminData();
    handleNotify('Penarikan disetujui.', 'success');
    setIsProcessingTx(false);
  };

  const handleRejectTopUp = async (id: string) => {
    setIsProcessingTx(true);
    await supabase.from('transactions').update({ status: 'rejected' }).eq('id', id);
    fetchAdminData();
    handleNotify('Top up ditolak.', 'info');
    setIsProcessingTx(false);
  };

  const handleRejectWithdraw = async (id: string) => {
    setIsProcessingTx(true);
    const req = withdrawRequests.find(r => r.id === id);
    if (!req) {
      setIsProcessingTx(false);
      return;
    }

    await supabase.from('transactions').update({ status: 'rejected' }).eq('id', id);

    // Refund points
    const { data: userData } = await supabase.from('profiles').select('gift_balance').eq('id', req.userId).single();
    if (userData) {
      await supabase.from('profiles').update({ gift_balance: userData.gift_balance + req.amount }).eq('id', req.userId);
    }

    fetchAdminData();
    handleNotify('Penarikan ditolak & poin dikembalikan.', 'info');
    setIsProcessingTx(false);
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

  const handleDeleteUser = async (id: string) => {
    // Delete from profiles
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);

    if (profileError) {
      handleNotify('Gagal menghapus user: ' + profileError.message, 'error');
      return;
    }

    // Try to delete from auth.users (will fail from client, but that's OK)
    // This requires service role key which we don't have in client
    try {
      await supabase.auth.admin.deleteUser(id);
    } catch (authError) {
      // Ignore auth error - profile is already deleted, user can't login
      console.log('Auth delete skipped (requires service role):', authError);
    }

    fetchAdminData();
    fetchAllUsers();
    handleNotify('User berhasil dihapus.', 'success');
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

  const handleUpdatePoints = async (userId: string, amount: number) => {
    // 1. Fetch current balance
    const { data: userData, error: fetchErr } = await supabase.from('profiles').select('gift_balance').eq('id', userId).single();
    if (fetchErr) {
      handleNotify('Gagal mengambil data user: ' + fetchErr.message, 'error');
      return;
    }

    const currentBalance = parseFloat(userData.gift_balance.toString()) || 0;
    const newBalance = currentBalance + amount;

    // 2. Update balance
    const { error: updateErr } = await supabase.from('profiles').update({ gift_balance: newBalance }).eq('id', userId);
    if (updateErr) {
      handleNotify('Gagal update poin: ' + updateErr.message, 'error');
      return;
    }
    // 3. Record internal transaction
    const { error: txErr } = await supabase.from('transactions').insert({
      user_id: userId,
      type: amount >= 0 ? 'topup' : 'withdraw',
      amount: Math.abs(amount),
      status: 'completed',
      metadata: { admin_note: 'Manual adjustment by admin', previous_balance: currentBalance }
    });

    if (txErr) console.warn('Gagal mencatat log transaksi:', txErr.message);

    // 4. Send notification to user
    const { error: notifyErr } = await supabase.from('notifications').insert({
      user_id: userId,
      type: 'system',
      title: amount >= 0 ? 'Poin Ditambahkan!' : 'Poin Dikurangi',
      content: `Admin telah ${amount >= 0 ? 'menambahkan' : 'mengurangi'} saldo Anda sebesar ${Math.abs(amount)} poin. Total saldo Anda sekarang adalah ${newBalance}.`,
      is_read: false
    });

    if (notifyErr) console.warn('Gagal mengirim notifikasi:', notifyErr.message);

    // 5. Refresh data
    fetchAllUsers();
    if (userId === user?.id) fetchUserProfile(userId);
    handleNotify(`Saldo user berhasil diperbarui. Total sekarang: ${newBalance}`, 'success');
  };

  const handleView = async (postId: string) => {
    if (!user) return;

    // Check localStorage for unique view tracking
    const viewKey = `view_${postId}_${user.id}`;
    const hasViewed = localStorage.getItem(viewKey);

    if (hasViewed) return; // Already viewed

    // Mark as viewed
    localStorage.setItem(viewKey, 'true');

    // Get post to find author
    const post = posts.find(p => p.id === postId);
    if (!post || post.userId === user.id) return; // Don't pay for own views

    try {
      // Update post unique_views in database
      const { data: postData } = await supabase
        .from('posts')
        .select('unique_views, user_id')
        .eq('id', postId)
        .single();

      if (!postData) return;

      const newUniqueViews = (postData.unique_views || 0) + 1;

      // Update post unique_views
      await supabase
        .from('posts')
        .update({ unique_views: newUniqueViews })
        .eq('id', postId);

      // Credit author's gift_balance
      const { data: authorProfile, error: profileError } = await supabase
        .from('profiles')
        .select('gift_balance')
        .eq('id', post.userId)
        .single();

      if (profileError) {
        console.error('Error fetching author profile for view payment:', profileError);
        return;
      }

      if (authorProfile) {
        const currentBalance = parseFloat(authorProfile.gift_balance.toString()) || 0;
        const newBalance = currentBalance + viewRate;

        console.log(`View payment: Adding ${viewRate} to ${post.userId}'s balance. Old: ${currentBalance}, New: ${newBalance}`);

        const { error: updateError } = await supabase
          .from('profiles')
          .update({ gift_balance: newBalance })
          .eq('id', post.userId);

        if (updateError) {
          console.error('Error updating gift_balance for view payment:', updateError);
        } else {
          console.log('View payment successful!');
        }
      }

      // Update local post state
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, unique_views: newUniqueViews }
          : p
      ));
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const handleToggleEditorPick = async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const newValue = !post.isEditorPick;
    const { error } = await supabase
      .from('posts')
      .update({ is_editor_pick: newValue })
      .eq('id', postId);

    if (error) {
      handleNotify('Gagal mengubah status Editor Pick: ' + error.message, 'error');
    } else {
      handleNotify(newValue ? 'Ditambahkan ke Pilihan Editor!' : 'Dihapus dari Pilihan Editor', 'success');
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isEditorPick: newValue } : p));
    }
  };

  const handleApprovePromo = async (postId: string) => {
    // 1. Fetch the duration from the latest transaction
    const { data: txs, error: txErr } = await supabase
      .from('transactions')
      .select('metadata')
      .eq('related_entity_id', postId)
      .eq('type', 'promotion_request')
      .order('created_at', { ascending: false })
      .limit(1);

    const duration = (txs && txs[0]?.metadata?.duration) || 7; // Default to 7 if not found
    const until = new Date();
    until.setDate(until.getDate() + duration);

    const { data, error } = await supabase.from('posts').update({
      is_pending_promotion: false,
      is_promoted: true,
      promoted_until: until.toISOString()
    }).eq('id', postId).select();

    if (error) {
      handleNotify('Gagal menyetujui Spotlight: ' + error.message, 'error');
    } else if (!data || data.length === 0) {
      handleNotify('Gagal: Post tidak ditemukan atau izin ditolak (RLS).', 'error');
    } else {
      console.log('Spotlight approved:', data);
      await fetchPosts();
      await fetchAdminData();
      handleNotify(`Spotlight diaktifkan selama ${duration} hari.`, 'success');
    }
  };

  const handleRejectPromo = async (postId: string) => {
    // 1. Fetch the cost from the latest transaction
    const { data: txs } = await supabase
      .from('transactions')
      .select('amount, metadata')
      .eq('related_entity_id', postId)
      .eq('type', 'promotion_request')
      .order('created_at', { ascending: false })
      .limit(1);

    const cost = (txs && txs[0]?.amount) || (txs && txs[0]?.metadata?.cost) || 10000;

    // 2. Mark as not pending
    const { data, error } = await supabase.from('posts').update({ is_pending_promotion: false }).eq('id', postId).select();

    if (error) {
      handleNotify('Gagal menolak Spotlight: ' + error.message, 'error');
    } else if (!data || data.length === 0) {
      handleNotify('Gagal: Izin ditolak atau post tidak ditemukan.', 'error');
    } else {
      // 3. Refund points
      const post = posts.find(p => p.id === postId);
      if (post) {
        const { data: userData } = await supabase.from('profiles').select('gift_balance').eq('id', post.userId).single();
        if (userData) {
          await supabase.from('profiles').update({ gift_balance: userData.gift_balance + cost }).eq('id', post.userId);
        }
      }
      await fetchPosts();
      await fetchAdminData();
      handleNotify(`Spotlight ditolak & ${cost} poin dikembalikan.`, 'info');
    }
  };

  const handleSaveAd = async (ad: Advertisement) => {
    // Map frontend Ad model to DB model if necessary, or just save as is if fields match.
    // Assuming DB has snake_case columns, let's check types.ts and fetchAds.
    // fetchAds maps: id, title, description, image_url, link, embed_code, position, is_active

    const dbAd = {
      // If it's a new ad (generated with Date.now()), we might want to let DB handle UUID or just us string.
      // The current ID generation in Modals.tsx uses `ad-${Date.now()}` which is fine if ID column is text.
      // If ID in DB is UUID, this might fail. Let's assume it supports text or we generate UUID if needed.
      // For now, we'll try to save with the ID provided or let Supabase generate if it was proper UUID.
      // But Modals.tsx generates string ID. Let's trust it fits.
      id: ad.id,
      title: ad.title,
      description: ad.description,
      image_url: ad.imageUrl,
      link: ad.link,
      embed_code: ad.embedCode,
      position: ad.position,
      is_active: ad.isActive
    };

    const { error } = await supabase.from('ads').upsert(dbAd);

    if (error) {
      console.error('Error saving ad:', error);
      handleNotify('Gagal menyimpan iklan: ' + error.message, 'error');
    } else {
      handleNotify('Iklan berhasil disimpan!', 'success');
      fetchAds();
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Yakin ingin menghapus iklan ini?')) return;

    const { error } = await supabase.from('ads').delete().eq('id', id);

    if (error) {
      handleNotify('Gagal menghapus iklan: ' + error.message, 'error');
    } else {
      handleNotify('Iklan dihapus.', 'success');
      fetchAds();
    }
  };

  const handleToggleAd = async (id: string) => {
    const ad = ads.find(a => a.id === id);
    if (!ad) return;

    const { error } = await supabase.from('ads').update({ is_active: !ad.isActive }).eq('id', id);

    if (error) {
      handleNotify('Gagal update status iklan: ' + error.message, 'error');
    } else {
      handleNotify(ad.isActive ? 'Iklan dimatikan.' : 'Iklan diaktifkan.', 'success');
      fetchAds();
    }
  };

  // --- Render ---

  // NOTE: Reuse existing layout code, just replace handlers and state




  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center relative overscroll-none">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
          <VokeLogo className="text-4xl animate-bounce" />
        </div>
        <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Memuat...</p>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-200 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-200 rounded-full blur-[120px] opacity-40"></div>

        <div className="w-full max-w-xl text-center relative z-10">
          <VokeLogo className="text-4xl md:text-5xl lg:text-6xl mb-6 md:mb-8 lg:mb-10 block" />

          <div className="voke-card p-10 md:p-14 text-left animate-in fade-in zoom-in duration-500">
            <h3 className="text-2xl font-black text-slate-800 mb-8 text-center uppercase tracking-widest">
              {authMode === 'login' ? 'Masuk' : 'Daftar'}
            </h3>

            {authMode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username / Email</label>
                  <input required type="text" value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all" placeholder="@username atau email@example.com" disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input required type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-semibold outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all" placeholder="••••••••" disabled={isLoading} />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? 'Memproses...' : 'Masuk ke VOꓘE'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama</label>
                    <input required type="text" value={signupForm.name} onChange={e => setSignupForm({ ...signupForm, name: e.target.value })} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="Nama asli" disabled={isLoading} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <input required type="text" value={signupForm.username} onChange={e => setSignupForm({ ...signupForm, username: e.target.value })} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="@user" disabled={isLoading} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                  <input required type="email" value={signupForm.email} onChange={e => setSignupForm({ ...signupForm, email: e.target.value })} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="mail@voke.id" disabled={isLoading} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor WhatsApp</label>
                  <input required type="tel" value={signupForm.waNumber} onChange={e => setSignupForm({ ...signupForm, waNumber: e.target.value })} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="08123456789" disabled={isLoading} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat</label>
                  <input required type="text" value={signupForm.address} onChange={e => setSignupForm({ ...signupForm, address: e.target.value })} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="Alamat lengkap" disabled={isLoading} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                  <input required type="password" value={signupForm.password} onChange={e => setSignupForm({ ...signupForm, password: e.target.value })} className="w-full p-4 bg-slate-50 border-slate-100 border rounded-2xl font-bold text-sm" placeholder="Minimal 6 karakter" disabled={isLoading} />
                </div>
                <button type="submit" disabled={isLoading} className="w-full py-5 bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading ? 'Mendaftar...' : 'Kirim Pendaftaran'}
                </button>
              </form>
            )}

            <p className="mt-10 text-[11px] text-slate-400 font-bold uppercase text-center tracking-widest">
              {authMode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}
              <button onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} className="text-indigo-600 font-black ml-2 hover:underline">
                {authMode === 'login' ? 'Registrasi' : 'Login'}
              </button>
            </p>
          </div>

          {/* Landing Contact Info */}
          <div className="mt-12 flex flex-col items-center space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Butuh Bantuan?</p>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:space-x-6">
              <a href={`mailto:${ADMIN_CONTACT.email}`} className="group flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-all">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <i className="fas fa-envelope text-[10px]"></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{ADMIN_CONTACT.email}</span>
              </a>
              <a href={ADMIN_CONTACT.waLink} target="_blank" className="group flex items-center space-x-2 text-slate-500 hover:text-slate-900 transition-all">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                  <i className="fab fa-whatsapp text-[12px]"></i>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">{ADMIN_CONTACT.wa}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Notification component for landing page */}
        {activeNotification && <Notification notification={activeNotification} onClose={() => setActiveNotification(null)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Navigation */}
      <nav className="sticky top-0 z-[100] bg-white/90 backdrop-blur-2xl border-b border-slate-100 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => setView('home')}>
            <VokeLogo className="text-2xl" />
          </div>

          <div className="hidden lg:flex items-center bg-slate-50 p-1.5 rounded-[1.5rem]">
            <button onClick={() => setView('home')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'home' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Beranda</button>
            <button onClick={() => setView('saved')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'saved' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Disimpan</button>
            <button onClick={() => setView('wallet')} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === 'wallet' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Dompet</button>
          </div>

          <div className="flex items-center space-x-2 md:space-x-3">
            <button onClick={() => setIsWriting(true)} className="w-10 h-10 md:w-11 md:h-11 bg-gradient-to-br from-[#0EA5E9] to-[#2563EB] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-100 hover:scale-105 active:scale-95 transition-all">
              <i className="fas fa-plus"></i>
            </button>

            <button
              onClick={() => handleNotify('Belum ada notifikasi baru.', 'info')}
              className="w-10 h-10 md:w-11 md:h-11 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl flex items-center justify-center transition-all relative"
            >
              <i className="fas fa-bell"></i>
              <span className="absolute top-3 right-3 w-2 h-2 bg-indigo-500 rounded-full border-2 border-white"></span>
            </button>

            {user?.isAdmin && (
              <button onClick={() => setView('admin')} className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all ${view === 'admin' ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}>
                <i className="fas fa-shield-halved"></i>
              </button>
            )}
            <div onClick={() => setView('profile')} className="w-10 h-10 md:w-11 md:h-11 rounded-full border-2 border-white overflow-hidden cursor-pointer shadow-sm hover:ring-4 hover:ring-indigo-500/10 transition-all">
              <img src={user?.avatar} className="w-full h-full object-cover" />
            </div>
            <button onClick={handleLogout} className="flex w-10 h-10 md:w-11 md:h-11 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-2xl items-center justify-center transition-all">
              <i className="fas fa-power-off"></i>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {view === 'admin' ? (
          <AdminDashboard
            topUps={topUpRequests}
            withdraws={withdrawRequests}
            reports={reports}
            pendingPromos={posts.filter(p => p.isPendingPromotion)}
            signupRequests={signupRequests}
            ads={ads}
            allUsers={allUsers}
            allPosts={posts}
            viewRate={viewRate}
            onUpdateViewRate={updateViewRate}
            onApproveTopUp={handleApproveTopUp}
            onRejectTopUp={handleRejectTopUp}
            onApproveWithdraw={handleApproveWithdraw}
            onRejectWithdraw={handleRejectWithdraw}
            onApprovePromo={handleApprovePromo}
            onRejectPromo={handleRejectPromo}
            onDismissReport={onDismissReport}
            onDeletePost={handleDeletePost}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
            onDeleteUser={handleDeleteUser}
            onSaveAd={handleSaveAd}
            onDeleteAd={handleDeleteAd}
            onToggleAd={handleToggleAd}
            onUpdatePoints={handleUpdatePoints}
            onToggleEditorPick={handleToggleEditorPick}
            onClose={() => setView('home')}
          />
        ) : isWriting ? (
          <RichEditor
            onPublish={(t, c, cap, img) => handlePublish(t, c, cap, img)}
            onSaveDraft={(t, c, cap, img) => handleSaveDraft(t, c, cap, img)}
            onCancel={() => { setIsWriting(false); setActiveDraft(null); }}
            onNotify={handleNotify}
            initialData={editorData}
          />
        ) : view === 'drafts' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-800">Draf Saya</h2>
              <button onClick={() => setView('profile')} className="px-6 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Kembali</button>
            </div>
            {drafts.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[2.5rem]">
                <i className="fas fa-file-alt text-4xl text-slate-300 mb-4"></i>
                <p className="text-slate-400 font-bold">Belum ada draf tersimpan.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {drafts.map(draft => (
                  <div key={draft.id} className="bg-white p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all border border-slate-100 flex justify-between items-center group">
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-slate-800 mb-2 truncate pr-4">{draft.title || 'Tanpa Judul'}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                        {new Date(draft.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setActiveDraft(draft);
                          setIsWriting(true);
                        }}
                        className="w-10 h-10 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center hover:bg-cyan-100 transition-all"
                        title="Edit Draf"
                      >
                        <i className="fas fa-pen-nib"></i>
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Hapus draf ini?')) {
                            await handleDeletePost(draft.id);
                            fetchDrafts();
                          }
                        }}
                        className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-100 transition-all"
                        title="Hapus Draf"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : view === 'saved' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <h2 className="text-2xl font-black text-slate-800">Simpanan Saya</h2>
              <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="relative flex-grow sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-search text-slate-300 text-xs text-[#2563EB]"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari simpanan..."
                    className="w-full bg-slate-50 border border-slate-100 py-2.5 pl-10 pr-4 rounded-xl font-bold text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#2563EB] transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button onClick={() => setView('profile')} className="px-6 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all shrink-0">Kembali</button>
              </div>
            </div>
            {filteredPosts.filter(p => savedPosts.has(p.id)).length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[2.5rem]">
                <i className="fas fa-bookmark text-4xl text-slate-300 mb-4"></i>
                <p className="text-slate-400 font-bold">{searchQuery ? 'Tidak ada simpanan yang cocok.' : 'Belum ada postingan yang disimpan.'}</p>
                {searchQuery && <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-500 font-black text-[10px] uppercase tracking-widest">Hapus Pencarian</button>}
              </div>
            ) : (
              <div className="space-y-10">
                {filteredPosts.filter(p => savedPosts.has(p.id)).map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    isFollowing={following.has(post.userId)}
                    isSaved={savedPosts.has(post.id)}
                    onFollowToggle={id => setFollowing(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                    onLike={handleLike}
                    onSaveToggle={handleSaveToggle}
                    onAddComment={handleAddComment}
                    onGift={handleGift}
                    onNotify={handleNotify}
                    userGiftBalance={totalBalance}
                    onTopUpRequest={() => setIsTopUpOpen(true)}
                    onPromoteRequest={handlePromoteRequest}
                    onDelete={handleDeletePost}
                    onEdit={handleEdit}
                    currentUserId={user?.id}
                    middleAd={activeMiddleAd}
                    bottomAd={activeBottomAd}
                    viewRate={viewRate}
                    onView={handleView}
                  />
                ))}
              </div>
            )}
          </div>
        ) : view === 'profile' ? (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="voke-card p-12 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-32 bg-cyan-50/50"></div>
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

                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => setView('edit-profile')} className="flex-1 min-w-[120px] sm:flex-none px-6 sm:px-8 py-3.5 bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-cyan-100 hover:shadow-xl hover:scale-105 transition-all">Edit Profil</button>
                  <button onClick={() => setView('wallet')} className="flex-1 min-w-[100px] sm:flex-none px-6 sm:px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Dompet</button>
                  <button onClick={() => { fetchDrafts(); setView('drafts'); }} className="flex-1 min-w-[100px] sm:flex-none px-6 sm:px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Draf</button>
                  <button onClick={() => setView('saved')} className="flex-1 min-w-[100px] sm:flex-none px-6 sm:px-8 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Simpanan</button>
                </div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest text-[11px]">Karya Saya</h3>
                <div className="relative w-full sm:w-64 group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i className="fas fa-search text-slate-300 text-xs text-[#2563EB]"></i>
                  </div>
                  <input
                    type="text"
                    placeholder="Cari karya saya..."
                    className="w-full bg-slate-50/50 border border-slate-100 py-3 pl-10 pr-4 rounded-xl font-bold text-xs focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#2563EB] transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {filteredPosts.filter(p => p.userId === user?.id).length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                  <i className="fas fa-feather-alt text-4xl text-slate-200 mb-4"></i>
                  <p className="text-slate-400 font-bold">{searchQuery ? 'Tidak ada karya yang cocok.' : 'Belum ada karya yang diterbitkan.'}</p>
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-500 font-black text-[10px] uppercase tracking-widest">Hapus Pencarian</button>}
                </div>
              ) : (
                filteredPosts.filter(p => p.userId === user?.id).map(p => <PostCard key={p.id} post={p} isFollowing={false} isSaved={savedPosts.has(p.id)} onFollowToggle={() => { }} onLike={handleLike} onSaveToggle={id => setSavedPosts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })} onAddComment={handleAddComment} onGift={handleGift} onNotify={handleNotify} userGiftBalance={totalBalance} onPromoteRequest={handlePromoteRequest} onDelete={handleDeletePost} onEdit={handleEdit} currentUserId={user?.id} middleAd={activeMiddleAd} bottomAd={activeBottomAd} viewRate={viewRate} onView={handleView} />)
              )}
            </div>
          </div>
        ) : view === 'edit-profile' ? (
          <ProfileEditor
            user={user!}
            onSave={handleUpdateProfile}
            onCancel={() => setView('profile')}
          />
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
              <div className="voke-card p-8 bg-cyan-50 border-cyan-100">
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

            {/* Wallet Contact Instruction */}
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 items-center justify-between flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h5 className="font-black text-slate-800 uppercase tracking-widest text-[10px] mb-2">Konfirmasi & Dukungan</h5>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  Sudah kirim bukti transfer atau ingin tanya seputar pencairan dana? Hubungi admin melalui WhatsApp atau Email resmi kami.
                </p>
              </div>
              <div className="flex space-x-3">
                <a href={ADMIN_CONTACT.waLink} target="_blank" className="px-6 py-3 bg-white text-emerald-600 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm border border-slate-100 hover:bg-emerald-50 hover:scale-105 transition-all">
                  <i className="fab fa-whatsapp mr-2"></i> WhatsApp
                </a>
                <a href={`mailto:${ADMIN_CONTACT.email}`} className="px-6 py-3 bg-white text-cyan-600 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-sm border border-slate-100 hover:bg-cyan-50 hover:scale-105 transition-all">
                  <i className="fas fa-envelope mr-2"></i> Email
                </a>
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
                    <span className="bg-cyan-500/20 text-cyan-500 text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-cyan-500/30 mb-4 inline-block">Sponsor VOꓘE</span>
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
              {/* Search Bar - VOꓘE Optimized */}
              <div className="relative group mx-auto max-w-2xl w-full">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <i className="fas fa-search text-slate-400 group-focus-within:text-[#2563EB] transition-colors"></i>
                </div>
                <input
                  type="text"
                  placeholder="Cari nama, judul, atau #hashtag..."
                  className="w-full bg-white border border-slate-100 py-4 pl-14 pr-6 rounded-[2rem] font-bold text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-[#2563EB] transition-all shadow-sm group-hover:shadow-md"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>

              {activePostId && (
                <div className="flex items-center justify-between bg-[#E0F2FE] p-6 rounded-[2rem] border border-[#BAE6FD] animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#0EA5E9] rounded-xl flex items-center justify-center text-white text-xs">
                      <i className="fas fa-link"></i>
                    </div>
                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Melihat Artikel Spesifik</p>
                  </div>
                  <button
                    onClick={() => {
                      setActivePostId(null);
                      window.history.replaceState({}, '', window.location.pathname);
                    }}
                    className="px-6 py-2 bg-white text-[#0EA5E9] rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95 border border-[#BAE6FD]/30"
                  >
                    Tampilkan Semua
                  </button>
                </div>
              )}

              {/* Featured Sections - Popular & Editor Picks */}
              {!searchQuery && !activePostId && !isLoadingPosts && (
                <div className="space-y-16 py-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {/* Popular Posts Carousel */}
                  {popularPosts.length > 0 && (
                    <section className="space-y-8">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-rose-50 rounded-[1.25rem] flex items-center justify-center text-rose-500 shadow-sm shadow-rose-100/50">
                            <i className="fas fa-fire text-lg"></i>
                          </div>
                          <div>
                            <h3 className="text-2xl font-[900] text-slate-900 tracking-tight">Terpopuler</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 flex items-center">
                              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full mr-2 animate-pulse"></span>
                              Karya Terpanas Minggu Ini
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex overflow-x-auto pb-8 -mx-4 px-4 space-x-6 no-scrollbar scroll-smooth">
                        {popularPosts.map(post => (
                          <div key={`pop-${post.id}`} className="min-w-[300px] sm:min-w-[400px] transform hover:scale-[1.01] transition-transform duration-300">
                            <PostCard
                              post={post} isFollowing={following.has(post.userId)} isSaved={savedPosts.has(post.id)}
                              onFollowToggle={id => setFollowing(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                              onLike={handleLike} onSaveToggle={handleSaveToggle} onAddComment={handleAddComment}
                              onGift={handleGift} onNotify={handleNotify} userGiftBalance={totalBalance} onTopUpRequest={() => setIsTopUpOpen(true)}
                              onPromoteRequest={handlePromoteRequest} onDelete={handleDeletePost} onEdit={handleEdit} currentUserId={user?.id}
                              viewRate={viewRate}
                              onView={handleView}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Editor Picks Carousel */}
                  {editorPicks.length > 0 && (
                    <section className="space-y-8">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-amber-50 rounded-[1.25rem] flex items-center justify-center text-amber-500 shadow-sm shadow-amber-100/50">
                            <i className="fas fa-award text-lg"></i>
                          </div>
                          <div>
                            <h3 className="text-2xl font-[900] text-slate-900 tracking-tight">Pilihan Editor</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5 flex items-center">
                              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2 animate-pulse"></span>
                              Kurasi Terbaik dari Tim VOꓘE
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex overflow-x-auto pb-8 -mx-4 px-4 space-x-6 no-scrollbar scroll-smooth">
                        {editorPicks.map(post => (
                          <div key={`edit-${post.id}`} className="min-w-[300px] sm:min-w-[400px] transform hover:scale-[1.01] transition-transform duration-300">
                            <PostCard
                              post={post} isFollowing={following.has(post.userId)} isSaved={savedPosts.has(post.id)}
                              onFollowToggle={id => setFollowing(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                              onLike={handleLike} onSaveToggle={handleSaveToggle} onAddComment={handleAddComment}
                              onGift={handleGift} onNotify={handleNotify} userGiftBalance={totalBalance} onTopUpRequest={() => setIsTopUpOpen(true)}
                              onPromoteRequest={handlePromoteRequest} onDelete={handleDeletePost} onEdit={handleEdit} currentUserId={user?.id}
                              viewRate={viewRate}
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Main Feed Label for New Posts */}
                  <div className="flex items-center space-x-4 px-2 pt-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-sm">
                      <i className="fas fa-bolt-lightning text-lg"></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-[900] text-slate-900 tracking-tight leading-none">Karya Terbaru</h3>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1.5">Update langsung dari kreator</p>
                    </div>
                  </div>
                </div>
              )}

              {isLoadingPosts ? (
                <div className="space-y-8 animate-pulse">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-[2.5rem] p-6 sm:p-8 space-y-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-full"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-100 rounded w-32"></div>
                          <div className="h-3 bg-slate-50 rounded w-24"></div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="h-6 bg-slate-100 rounded w-3/4"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-slate-50 rounded w-full"></div>
                          <div className="h-4 bg-slate-50 rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                filteredPosts.length === 0 ? (
                  <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                    <i className="fas fa-search text-4xl text-slate-200 mb-4"></i>
                    <p className="text-slate-400 font-bold">Tidak ada hasil ditemukan untuk "{searchQuery}"</p>
                    <button onClick={() => setSearchQuery('')} className="mt-4 text-blue-500 font-black text-[10px] uppercase tracking-widest">Hapus Pencarian</button>
                  </div>
                ) : (
                  filteredPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post} isFollowing={following.has(post.userId)} isSaved={savedPosts.has(post.id)}
                      onFollowToggle={id => setFollowing(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}
                      onLike={handleLike}
                      onSaveToggle={handleSaveToggle}
                      onAddComment={handleAddComment}
                      onGift={handleGift} onNotify={handleNotify} userGiftBalance={totalBalance} onTopUpRequest={() => setIsTopUpOpen(true)}
                      onPromoteRequest={handlePromoteRequest}
                      onDelete={handleDeletePost}
                      onEdit={handleEdit}
                      currentUserId={user?.id}
                      middleAd={activeMiddleAd}
                      bottomAd={activeBottomAd}
                      viewRate={viewRate}
                      onView={(postId) => {
                        const viewedKey = `voke_view_${postId}`;
                        const alreadyViewed = localStorage.getItem(viewedKey);

                        if (!alreadyViewed) {
                          localStorage.setItem(viewedKey, 'true');
                          // Update local state immediately for snappy UI
                          setPosts(prev => prev.map(p => p.id === postId ? { ...p, views: (p.views || 0) + 1 } : p));

                          // Update DB via RPC
                          supabase.rpc('increment_view', { post_id: postId }).then(({ error }) => {
                            if (error) {
                              console.warn('RPC increment_view failed, falling back to direct update:', error);
                              // Fallback direct update if RPC fails
                              const p = posts.find(x => x.id === postId);
                              if (p) {
                                supabase.from('posts')
                                  .update({ views_count: (p.views || 0) + 1 })
                                  .eq('id', postId)
                                  .then(({ error: upError }) => {
                                    if (upError) console.error('View fallback update failed:', upError);
                                  });
                              }
                            }
                          });
                        }
                      }}
                    />
                  ))
                )
              )}
            </div>
          </div>
        )}

        {/* Global Footer Contact */}
        <footer className="mt-20 pt-10 border-t border-slate-100 flex flex-col items-center space-y-6">
          <VokeLogo className="text-2xl opacity-20 grayscale" withGradient={false} />
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-8">
            <a href={`mailto:${ADMIN_CONTACT.email}`} className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 transition-colors">
              <i className="fas fa-envelope text-[10px]"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">{ADMIN_CONTACT.email}</span>
            </a>
            <a href={ADMIN_CONTACT.waLink} target="_blank" className="flex items-center space-x-2 text-slate-400 hover:text-slate-600 transition-colors">
              <i className="fab fa-whatsapp text-xs"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">{ADMIN_CONTACT.wa}</span>
            </a>
          </div>
          <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.4em]">VOꓘE Premium Platform © 2025</p>
        </footer>
      </main>

      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onSelect={async (pkg) => {
          if (!user) return;
          if (confirm(`Beli paket ${pkg.name} seharga Rp ${pkg.price.toLocaleString('id-ID')}?`)) {
            setIsProcessingTx(true);
            // Create pending transaction
            const { error } = await supabase.from('transactions').insert({
              user_id: user.id,
              type: 'topup',
              amount: pkg.points, // Points to add
              status: 'pending',
              metadata: { package_name: pkg.name, price: pkg.price, version: '1.2' }
            });

            setIsProcessingTx(false);
            if (error) {
              handleNotify(`Gagal: ${error.message}`, 'error');
            } else {
              handleNotify('Permintaan dikirim! Mohon transfer & konfirmasi bukti ke email loudvoke@gmail.com atau WA 085163612553', 'success');
              setIsTopUpOpen(false);
            }
          }
        }}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        balance={totalBalance}
        onWithdraw={async (amount, method, account) => {
          if (!user) return;
          if (amount < 5000) {
            handleNotify('Minimal pencairan adalah 5.000 poin.', 'error');
            return;
          }
          setIsProcessingTx(true);
          // Create pending transaction
          const { error } = await supabase.from('transactions').insert({
            user_id: user.id,
            type: 'withdraw',
            amount: amount,
            status: 'pending',
            metadata: { method, account, version: '1.2' }
          });

          setIsProcessingTx(false);
          if (error) {
            handleNotify(`Gagal: ${error.message}`, 'error');
          } else {
            handleNotify('Permintaan cair dana dikirim! Konfirmasi ke loudvoke@gmail.com / WA 085163612553', 'success');
            setIsWithdrawOpen(false);
          }
        }}
      />

      <SpotlightModal
        isOpen={!!activeSpotlight}
        onClose={() => setActiveSpotlight(null)}
        post={activeSpotlight}
        authorName={activeSpotlight?.author?.name || 'User'}
      />

      {isProcessingTx && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-[10px] uppercase tracking-widest text-indigo-600">Memproses Permintaan...</p>
          </div>
        </div>
      )}
      {activeNotification && <Notification notification={activeNotification} onClose={() => setActiveNotification(null)} />}
    </div>
  );
};

export default App;
