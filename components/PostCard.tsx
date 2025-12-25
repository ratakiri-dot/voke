import React, { useState } from 'react';
import { Post, User, Advertisement } from '../types';
import { GiftModal, ReportModal, PromoteModal, GiftItem } from './Modals';

interface PostCardProps {
  post: Post;
  isFollowing: boolean;
  isSaved: boolean;
  onFollowToggle: (userId: string) => void;
  onLike: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
  onAddComment: (postId: string, text: string) => void;
  onGift: (postId: string, gift: GiftItem) => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
  onView?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  currentUserId?: string;
  userGiftBalance?: number;
  onTopUpRequest?: () => void;
  onPromoteRequest?: (postId: string) => void;
  bottomAd?: Advertisement | null;
  viewRate?: number;
}

export const PostCard: React.FC<PostCardProps> = ({
  post, isFollowing, isSaved, onFollowToggle, onLike, onSaveToggle,
  onAddComment, onGift, onNotify, onView, onDelete, currentUserId,
  userGiftBalance = 0, onTopUpRequest = () => { },
  onPromoteRequest = (_id: string) => { },
  bottomAd,
  viewRate
}) => {
  const author = post.author || { name: 'Sistem VOꓘE', avatar: 'https://picsum.photos/seed/me/200', username: '@voke_official' };
  console.log(`[PostCard ${post.id}] gifts:`, post.gifts);

  const [isGiftOpen, setIsGiftOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isPromoteOpen, setIsPromoteOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');

  const handleExpand = () => {
    setIsExpanded(true);
    if (onView) onView(post.id);
  };

  const handleSendComment = () => {
    if (commentText.trim()) {
      onAddComment(post.id, commentText);
      setCommentText('');
    }
  };

  const isOwnPost = currentUserId && post.userId === currentUserId;
  const isCurrentlyPromoted = post.isPromoted && post.promotedUntil && new Date(post.promotedUntil) > new Date();

  return (
    <div className={`voke-card group overflow-hidden ${isCurrentlyPromoted ? 'ring-2 ring-indigo-500/30' : ''}`}>
      <div className="p-8 md:p-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center space-x-4 min-w-0">
            <img src={author.avatar} alt={author.name} className="w-14 h-14 rounded-2xl object-cover border-4 border-white shadow-md transition-transform group-hover:scale-105 shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-extrabold text-slate-800 leading-none text-lg truncate">
                  {author.name}
                </h4>
                {isCurrentlyPromoted && (
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-blue-100 shrink-0">
                    <i className="fas fa-sparkles mr-1 animate-pulse"></i> Spotlight
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5 truncate">{author.username} • {new Date(post.timestamp).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</p>
            </div>
          </div>
          {!isOwnPost ? (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => setIsReportOpen(true)}
                className="w-11 h-11 sm:w-10 sm:h-10 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-xl flex items-center justify-center transition-all shrink-0"
              >
                <i className="fas fa-flag text-xs"></i>
              </button>
              <button
                onClick={() => onFollowToggle(post.userId)}
                className={`flex-1 sm:flex-none px-6 py-3 sm:py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${isFollowing ? 'bg-slate-100 text-slate-500' : 'bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-900/10'
                  }`}
              >
                {isFollowing ? 'Mengikuti' : 'Ikuti'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (confirm('Yakin ingin menghapus tulisan ini?')) {
                    onDelete?.(post.id);
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-3 sm:py-2.5 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100"
              >
                <i className="fas fa-trash-alt mr-1"></i>
                <span>Hapus</span>
              </button>
              <button
                onClick={() => setIsPromoteOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center px-4 py-3 sm:py-2.5 bg-cyan-50 text-cyan-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-100 transition-all border border-cyan-100"
              >
                <i className="fas fa-rocket mr-1"></i>
                <span>Spotlight</span>
              </button>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-3xl font-[800] mb-4 text-slate-800 leading-[1.15] tracking-tight group-hover:text-indigo-600 transition-colors">{post.title}</h3>

          <div className="flex flex-wrap items-center gap-3">
            {post.caption && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-4 py-2 rounded-xl font-black uppercase tracking-wider">
                #{post.caption.replace(/#/g, '')}
              </span>
            )}

            {post.giftStats && Object.entries(post.giftStats).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(post.giftStats).map(([name, stat]) => {
                  const giftDetail = stat as { count: number; icon: string };
                  return (
                    <div key={name} className="flex items-center space-x-2 bg-amber-50 text-amber-600 border border-amber-100/50 px-3 py-1.5 rounded-xl shadow-sm">
                      <span className="text-sm">{giftDetail.icon}</span>
                      <span className="text-[11px] font-black">+{giftDetail.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="relative mb-10">
          <div
            className={`text-slate-600 leading-[1.8] text-lg transition-all duration-700 ${!isExpanded ? 'line-clamp-3 overflow-hidden' : ''}`}
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
          {!isExpanded && (
            <button
              onClick={handleExpand}
              className="mt-6 text-indigo-600 font-black text-[11px] uppercase tracking-[0.25em] hover:text-indigo-700 flex items-center space-x-2"
            >
              <span>Ulas Tulisan</span>
              <i className="fas fa-arrow-right text-[10px]"></i>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between pt-8 border-t border-slate-100">
          <div className="flex items-center space-x-2 md:space-x-4">
            <button onClick={() => onLike(post.id)} className={`flex items-center px-4 py-2 rounded-2xl transition-all ${post.isLiked ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400 hover:text-rose-400'}`}>
              <i className={`${post.isLiked ? 'fas' : 'far'} fa-heart text-sm mr-2.5`}></i>
              <span className="text-xs font-black">{post.likes}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center px-4 py-2 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-2xl transition-all">
              <i className="far fa-comment text-sm mr-2.5"></i>
              <span className="text-xs font-black">{post.comments.length}</span>
            </button>
            <div className="flex items-center px-4 py-2 bg-slate-50 text-slate-400 rounded-2xl">
              <i className="far fa-eye text-sm mr-2.5"></i>
              <span className="text-xs font-black">{post.views.toLocaleString('id-ID')}</span>
              {viewRate !== undefined && (
                <span className="ml-1 text-[9px] text-slate-300 font-bold bg-slate-100 px-1.5 py-0.5 rounded-md">
                  {(post.views * viewRate).toFixed(4)}
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {/* GIFT BUTTON - Always Visible */}
            <button
              onClick={() => !isOwnPost && setIsGiftOpen(true)}
              className={`h-11 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-sm border ${isOwnPost
                ? 'bg-gradient-to-r from-amber-100 to-amber-50 text-amber-700 border-amber-200 cursor-default'
                : 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200 hover:from-amber-100 hover:to-yellow-100'
                }`}
              title={isOwnPost ? `Total hadiah: Rp ${(post.gifts || 0).toLocaleString('id-ID')}` : 'Kirim hadiah'}
            >
              <i className="fas fa-gift text-base text-amber-600"></i>
              <span className="text-sm font-extrabold text-amber-800">
                {post.gifts >= 1000 ? `${(post.gifts / 1000).toFixed(1)}k` : (post.gifts || 0)}
              </span>
            </button>
            <button
              onClick={async () => {
                // Strip HTML tags for clean text share
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = post.content;
                const cleanText = tempDiv.textContent || tempDiv.innerText || '';

                const shareData = {
                  title: post.title,
                  text: cleanText.substring(0, 100) + '...',
                  url: window.location.href
                };

                if (navigator.share) {
                  try {
                    await navigator.share(shareData);
                    onNotify('Berhasil dibagikan!', 'success');
                  } catch (err) {
                    // User cancelled
                  }
                } else {
                  // Fallback: copy to clipboard
                  navigator.clipboard.writeText(window.location.href);
                  onNotify('Link disalin ke clipboard!', 'success');
                }
              }}
              className="w-11 h-11 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:text-cyan-500 hover:bg-cyan-50 transition-all"
            >
              <i className="fas fa-share-nodes text-sm"></i>
            </button>
            <button onClick={() => onSaveToggle(post.id)} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isSaved ? 'bg-cyan-50 text-cyan-600' : 'bg-slate-50 text-slate-300 hover:text-cyan-400'}`}>
              <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark text-sm`}></i>
            </button>
          </div>
        </div>
      </div>

      {bottomAd && bottomAd.isActive && (
        <div className="mx-8 mb-8 p-8 bg-slate-900 rounded-[2.25rem] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10"><i className="fas fa-bullhorn text-6xl"></i></div>
          <div className="relative z-10 w-full">
            <h5 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-4">Pariwara</h5>
            {bottomAd.embedCode ? (
              <div className="w-full bg-white/5 p-4 rounded-2xl" dangerouslySetInnerHTML={{ __html: bottomAd.embedCode }} />
            ) : (
              <>
                <h4 className="text-lg font-black mb-1">{bottomAd.title || 'Informasi Menarik'}</h4>
                <p className="text-slate-400 text-xs mb-6 max-w-sm">{bottomAd.description || 'Jangan lewatkan promo dari mitra kami.'}</p>
                {bottomAd.imageUrl && <img src={bottomAd.imageUrl} className="w-full max-h-48 object-cover rounded-xl mb-6" alt="" />}
                {bottomAd.link && (
                  <a href={bottomAd.link} target="_blank" rel="noopener" className="inline-block px-6 py-2.5 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Kunjungi</a>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {showComments && (
        <div className="bg-slate-50/50 p-8 border-t border-slate-100 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-6 mb-10">
            {post.comments.map((c) => (
              <div key={c.id} className="flex space-x-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center text-[11px] font-black text-slate-600 shrink-0 border border-white shadow-sm">
                  {c.userName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="bg-white p-5 rounded-3xl rounded-tl-none border border-slate-200/50 shadow-sm inline-block max-w-full">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-black text-xs text-slate-800">{c.userName}</span>
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {post.comments.length === 0 && <p className="text-center text-slate-300 text-[10px] font-black uppercase tracking-widest">Belum ada tanggapan.</p>}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Berikan apresiasi Anda..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
              className="w-full pl-6 pr-16 py-4 bg-white border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium"
            />
            <button
              onClick={handleSendComment}
              disabled={!commentText.trim()}
              className="absolute right-2 top-2 w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all disabled:opacity-20 active:scale-90"
            >
              <i className="fas fa-paper-plane text-[10px]"></i>
            </button>
          </div>
        </div>
      )}

      <GiftModal isOpen={isGiftOpen} onClose={() => setIsGiftOpen(false)} onGift={onGift.bind(null, post.id)} currentBalance={userGiftBalance} onTopUpRequest={onTopUpRequest} />
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} onReport={(reason) => { onNotify(`Laporan "${reason}" terkirim ke moderator.`, 'info'); }} />
      <PromoteModal isOpen={isPromoteOpen} onClose={() => setIsPromoteOpen(false)} postTitle={post.title} balance={userGiftBalance} onConfirm={() => { onPromoteRequest(post.id); onNotify('Pengajuan Spotlight terkirim.', 'success'); }} />
    </div>
  );
};
