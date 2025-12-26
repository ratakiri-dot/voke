import React, { useState, useEffect, useRef } from 'react';
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
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
  currentUserId?: string;
  userGiftBalance?: number;
  onTopUpRequest?: () => void;
  onPromoteRequest?: (postId: string, duration: number, cost: number) => void;
  bottomAd?: Advertisement | null;
  middleAd?: Advertisement | null;
  viewRate?: number;
}

const ScriptAd: React.FC<{ embedCode: string }> = ({ embedCode }: { embedCode: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear previous content
      containerRef.current.innerHTML = '';

      // Create a temporary element to parse the HTML string
      const div = document.createElement('div');
      div.innerHTML = embedCode;

      // Convert NodeList to Array to iterate safely
      const nodes = Array.from(div.childNodes);

      nodes.forEach(node => {
        if (node.nodeName === 'SCRIPT') {
          const script = document.createElement('script');
          const scriptNode = node as HTMLScriptElement;

          // Copy all attributes
          Array.from(scriptNode.attributes).forEach(attr => {
            script.setAttribute(attr.name, attr.value);
          });

          // Copy content if any
          if (scriptNode.innerHTML) {
            script.innerHTML = scriptNode.innerHTML;
          }

          containerRef.current?.appendChild(script);
        } else {
          // Clone other nodes (like div, iframe, etc)
          containerRef.current?.appendChild(node.cloneNode(true));
        }
      });
    }
  }, [embedCode]);

  return <div ref={containerRef} className="w-full flex justify-center py-4" />;
};

export const PostCard: React.FC<PostCardProps> = ({
  post, isFollowing, isSaved, onFollowToggle, onLike, onSaveToggle,
  onAddComment, onGift, onNotify, onView, onEdit, onDelete, currentUserId,
  userGiftBalance = 0, onTopUpRequest = () => { },
  onPromoteRequest = (_id: string, _d: number, _c: number) => { },
  bottomAd,
  middleAd,
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
    setIsExpanded(!isExpanded);
    if (!isExpanded && onView) {
      onView(post.id);
    }
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
    <div className={`voke-card group overflow-hidden ${isCurrentlyPromoted ? 'ring-1 ring-blue-500/20' : ''}`}>
      {post.coverImage && (
        <div className="w-full aspect-[2/1] overflow-hidden">
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      )}
      <div className="p-6 md:p-10">
        {/* 1. Title Section */}
        <div className="mb-4">
          <h3 className="medium-title text-[24px] sm:text-[28px] mb-3 leading-[1.25] group-hover:text-gray-600 transition-colors">
            {post.title}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {post.caption && (
              <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                #{post.caption.replace(/#/g, '')}
              </span>
            )}

            {post.giftStats && Object.entries(post.giftStats).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(post.giftStats).map(([name, stat]) => {
                  const giftDetail = stat as { count: number; icon: string };
                  return (
                    <div key={name} className="flex items-center space-x-1 bg-amber-50 text-amber-700 border border-amber-200/50 px-2 py-0.5 rounded text-xs">
                      <span>{giftDetail.icon}</span>
                      <span className="font-semibold">+{giftDetail.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. Excerpt Section */}
        <div className="relative mb-6">
          {!isExpanded ? (
            <div
              className="medium-content text-gray-700 line-clamp-3 overflow-hidden"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          ) : (
            <div className="medium-content text-gray-700 space-y-4">
              {(() => {
                // Match ending of paragraphs, divs, or double breaks
                const parts = post.content.split(/(<\/p>|<\/div>|<br\s*\/?>\s*<br\s*\/?>)/i);

                // Group pairs of [content, tag]
                const segments = [];
                for (let i = 0; i < parts.length; i += 2) {
                  if (parts[i].trim() || (parts[i + 1] && parts[i + 1].trim())) {
                    segments.push(parts[i] + (parts[i + 1] || ''));
                  }
                }

                if (segments.length >= 1 && middleAd && middleAd.isActive) {
                  // For 1 segment, place after. For more, place in middle.
                  const mid = Math.max(1, Math.ceil(segments.length / 2));
                  const firstHalf = segments.slice(0, mid);
                  const secondHalf = segments.slice(mid);

                  return (
                    <div className="space-y-0">
                      <div dangerouslySetInnerHTML={{ __html: firstHalf.join('') }} />

                      {/* Middle Ad */}
                      <div className="my-10 p-6 bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden shadow-sm relative group/ad">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest tracking-[0.2em]">Pariwara Sponsor</span>
                          <span className="text-[8px] font-black text-slate-200 uppercase px-2 py-0.5 border border-slate-100 rounded-md">VOKE ADS</span>
                        </div>
                        {middleAd.embedCode ? (
                          <ScriptAd embedCode={middleAd.embedCode} />
                        ) : (
                          <div className="flex flex-col md:flex-row gap-6 items-center">
                            {middleAd.imageUrl && (
                              <img src={middleAd.imageUrl} className="w-24 h-24 object-cover rounded-2xl shrink-0 shadow-sm transition-transform group-hover/ad:scale-105" alt="" />
                            )}
                            <div className="flex-1 text-center md:text-left">
                              <h4 className="text-sm font-black mb-1 text-slate-800">{middleAd.title || 'Pariwara'}</h4>
                              <p className="text-[10px] text-slate-500 mb-4 line-clamp-2 leading-relaxed">{middleAd.description || 'Lihat penawaran menarik dari mitra kami.'}</p>
                              {middleAd.link && (
                                <a href={middleAd.link} target="_blank" rel="noopener" className="inline-block px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-md active:scale-95">Pelajari Selengkapnya</a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {secondHalf.length > 0 && <div dangerouslySetInnerHTML={{ __html: secondHalf.join('') }} />}
                    </div>
                  );
                }
                return <div dangerouslySetInnerHTML={{ __html: post.content }} />;
              })()}
            </div>
          )}
          {!isExpanded && (
            <button
              onClick={handleExpand}
              className="mt-4 text-gray-700 font-medium text-sm hover:text-black flex items-center space-x-1.5 transition-colors"
            >
              <span>Baca selengkapnya</span>
              <i className="fas fa-arrow-right text-xs transition-transform hover:translate-x-0.5"></i>
            </button>
          )}
        </div>

        {/* 3. Author Profile Section (Content Footer) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 border-t border-gray-100 mt-6">
          <div className="flex items-center space-x-3 min-w-0">
            <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="font-medium text-gray-900 leading-none text-sm truncate">
                  {author.name}
                </h4>
                {isCurrentlyPromoted && (
                  <span className="voke-gradient-bg text-white text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                    <i className="fas fa-sparkles mr-0.5"></i> Spotlight
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {author.username} · {new Date(post.timestamp).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>
          {!isOwnPost ? (
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                onClick={() => setIsReportOpen(true)}
                className="w-8 h-8 bg-white text-gray-400 hover:text-red-600 rounded flex items-center justify-center transition-colors shrink-0 border border-gray-200"
              >
                <i className="fas fa-flag text-xs"></i>
              </button>
              <button
                onClick={() => onFollowToggle(post.userId)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded text-sm font-medium transition-all ${isFollowing ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'voke-gradient-bg text-white hover:opacity-90'
                  }`}
              >
                {isFollowing ? 'Mengikuti' : 'Ikuti'}
              </button>
            </div>
          ) : (
            <div className="flex gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => {
                  if (confirm('Yakin ingin menghapus tulisan ini?')) {
                    onDelete?.(post.id);
                  }
                }}
                className="flex-1 sm:flex-none flex items-center justify-center px-3 py-1.5 bg-red-50 text-red-600 rounded text-xs font-medium hover:bg-red-100 transition-colors border border-red-200"
              >
                <i className="fas fa-trash-alt mr-1"></i>
                <span>Hapus</span>
              </button>
              <button
                onClick={() => onEdit?.(post)}
                className="flex-1 sm:flex-none flex items-center justify-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-200"
              >
                <i className="fas fa-pen-nib mr-1"></i>
                <span>Edit</span>
              </button>
              <button
                onClick={() => setIsPromoteOpen(true)}
                className="flex-1 sm:flex-none flex items-center justify-center px-3 py-1.5 bg-cyan-50 text-cyan-600 rounded text-xs font-medium hover:bg-cyan-100 transition-colors border border-cyan-200"
              >
                <i className="fas fa-rocket mr-1"></i>
                <span>Spotlight</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 gap-2 sm:gap-3">
          {/* Stats Section: Like, Comment, View */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => onLike(post.id)}
              className={`flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-sm transition-colors ${post.isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'}`}
              title="Like"
            >
              <i className={`${post.isLiked ? 'fas' : 'far'} fa-heart`}></i>
              <span>{post.likes}</span>
            </button>

            <button
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition-colors"
              title="Komentar"
            >
              <i className="far fa-comment"></i>
              <span>{post.comments.length}</span>
            </button>

            <div className="flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-sm text-gray-500" title="Tayangan">
              <i className="far fa-eye"></i>
              <span>{post.views >= 1000 ? `${(post.views / 1000).toFixed(1)}k` : post.views}</span>
            </div>
          </div>

          {/* Actions Section: Gift, Share, Save */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => !isOwnPost && setIsGiftOpen(true)}
              className={`flex items-center space-x-1 text-xs sm:text-sm transition-colors ${isOwnPost
                ? 'text-amber-700 cursor-default'
                : 'text-amber-600 hover:text-amber-700'
                }`}
              title={isOwnPost ? `Total hadiah: Rp ${(post.gifts || 0).toLocaleString('id-ID')}` : 'Kirim hadiah'}
            >
              <i className="fas fa-gift"></i>
              <span className="font-medium">
                {post.gifts >= 1000 ? `${(post.gifts / 1000).toFixed(1)}k` : (post.gifts || 0)}
              </span>
            </button>

            <button
              onClick={async () => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = post.content;
                const cleanText = tempDiv.textContent || tempDiv.innerText || '';
                const shareUrl = `${window.location.origin}${window.location.pathname}?post=${post.id}`;

                const shareData = {
                  title: post.title,
                  text: cleanText.substring(0, 100) + '...',
                  url: shareUrl
                };

                if (navigator.share) {
                  try {
                    await navigator.share(shareData);
                    onNotify('Berhasil dibagikan!', 'success');
                  } catch (err) {
                    // Handled
                  }
                } else {
                  navigator.clipboard.writeText(shareUrl);
                  onNotify('Link artikel disalin!', 'success');
                }
              }}
              className="text-gray-500 hover:text-gray-900 text-xs sm:text-sm transition-colors"
              title="Bagikan artikel"
            >
              <i className="fas fa-share-nodes"></i>
            </button>

            <button
              onClick={() => onSaveToggle(post.id)}
              className={`text-xs sm:text-sm transition-colors ${isSaved ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`}
              title={isSaved ? "Hapus dari simpanan" : "Simpan artikel"}
            >
              <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark`}></i>
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
      <PromoteModal isOpen={isPromoteOpen} onClose={() => setIsPromoteOpen(false)} postTitle={post.title} balance={userGiftBalance} onConfirm={(duration, cost) => { onPromoteRequest(post.id, duration, cost); onNotify('Pengajuan Spotlight terkirim.', 'success'); }} />
    </div>
  );
};
