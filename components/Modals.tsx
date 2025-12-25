
import React, { useState, useEffect, useRef } from 'react';
import { Post, Advertisement, AdPosition } from '../types';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

const VokeText = () => (
  <span>VOꓘE</span>
);

import ReactDOM from 'react-dom';

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[999] p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300 shadow-2xl border border-white/20 my-auto relative">
        <div className="p-6 md:p-8 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-black text-gray-900 tracking-tight uppercase tracking-widest">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-all active:scale-90"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6 md:p-8 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export interface GiftItem {
  name: string;
  icon: string;
  price: number;
}

export interface TopUpPackage {
  id: string;
  name: string;
  points: number;
  price: number;
  bonus?: string;
  isPopular?: boolean;
}

export const AdEditorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (ad: Advertisement) => void;
  adToEdit?: Advertisement | null;
}> = ({ isOpen, onClose, onSave, adToEdit }) => {
  const [formData, setFormData] = useState<Advertisement>({
    id: crypto.randomUUID(),
    title: '',
    description: '',
    imageUrl: '',
    embedCode: '',
    link: '',
    position: 'top',
    isActive: true
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adToEdit) {
      setFormData(adToEdit);
    } else {
      setFormData({
        id: crypto.randomUUID(),
        title: '',
        description: '',
        imageUrl: '',
        embedCode: '',
        link: '',
        position: 'top',
        isActive: true
      });
    }
  }, [adToEdit, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={adToEdit ? "Edit Iklan" : "Tambah Iklan Baru"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul Iklan (Opsional)</label>
          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm"
            placeholder="Contoh: Promo Voke Premium"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi (Opsional)</label>
          <textarea
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm min-h-[80px]"
            placeholder="Tulis pesan promosi..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Banner Gambar (Opsional)</label>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center space-x-2 border border-dashed border-slate-300"
            >
              <i className="fas fa-upload"></i>
              <span>{formData.imageUrl ? 'Ganti Gambar' : 'Upload Banner'}</span>
            </button>
            {formData.imageUrl && (
              <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-100 shrink-0">
                <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Script JS (Opsional)</label>
          <textarea
            value={formData.embedCode || ''}
            onChange={e => setFormData({ ...formData, embedCode: e.target.value })}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-mono text-xs min-h-[80px]"
            placeholder="<script src='...'></script>"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link Tujuan (Opsional)</label>
          <input
            type="url"
            value={formData.link || ''}
            onChange={e => setFormData({ ...formData, link: e.target.value })}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm"
            placeholder="https://..."
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Posisi Tayang</label>
          <select
            value={formData.position}
            onChange={e => setFormData({ ...formData, position: e.target.value as AdPosition })}
            className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-sm"
          >
            <option value="top">Atas (Dashboard)</option>
            <option value="middle">Tengah Artikel (Postingan)</option>
            <option value="bottom">Bawah (Post Card)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {adToEdit ? "Simpan Perubahan" : "Tayangkan Iklan"}
        </button>
      </form>
    </Modal>
  );
};

export const GiftModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onGift: (gift: GiftItem) => void;
  currentBalance: number;
  onTopUpRequest: () => void;
}> = ({ isOpen, onClose, onGift, currentBalance, onTopUpRequest }) => {
  const gifts: GiftItem[] = [
    { name: 'Bronze', icon: '🥉', price: 10 },
    { name: 'Silver', icon: '🥈', price: 50 },
    { name: 'Gold', icon: '🥇', price: 200 },
    { name: 'Platinum', icon: '💎', price: 1000 },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apresiasi Penulis">
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
          <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">Saldo <VokeText /></span>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-black text-indigo-600">{currentBalance.toLocaleString('id-ID')}</span>
            <span className="text-[10px] font-bold text-indigo-400">POIN</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {gifts.map((g) => {
            const canAfford = currentBalance >= g.price;
            return (
              <button
                key={g.name}
                disabled={!canAfford}
                onClick={() => {
                  onGift(g);
                  onClose();
                }}
                className={`flex flex-col items-center p-5 border-2 rounded-3xl transition-all group relative ${canAfford
                  ? 'border-gray-100 hover:border-indigo-500 hover:bg-indigo-50/50'
                  : 'border-gray-50 bg-gray-50/50 opacity-60 cursor-not-allowed'
                  }`}
              >
                <span className="text-4xl mb-3 group-hover:scale-110 transition-transform">{g.icon}</span>
                <span className="font-black text-sm text-gray-800">{g.name}</span>
                <span className="text-[10px] font-bold text-gray-400 mt-1">{g.price.toLocaleString('id-ID')} Poin</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => { onClose(); onTopUpRequest(); }}
          className="w-full py-4 text-indigo-600 font-black text-xs uppercase tracking-widest hover:bg-indigo-50 rounded-2xl transition-all flex items-center justify-center space-x-2 border border-dashed border-indigo-200"
        >
          <i className="fas fa-plus-circle"></i>
          <span>Isi Saldo Poin</span>
        </button>
      </div>
    </Modal>
  );
};

export const SpotlightModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  authorName: string;
}> = ({ isOpen, onClose, post, authorName }) => {
  if (!isOpen || !post) return null;

  // Safe snippet helper: uses caption if available, otherwise truncates content text
  const getTeaser = (post: Post) => {
    if (post.caption) return post.caption;
    const textOnly = post.content.replace(/<[^>]*>/g, ' ');
    return textOnly.length > 200 ? textOnly.substring(0, 200) + '...' : textOnly;
  };

  const teaser = getTeaser(post);

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[999] p-4 sm:p-6">
      <div className="bg-white rounded-[3.5rem] w-full max-w-lg overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.4)] relative animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500">
        {/* Subtle decorative background */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent)] pointer-events-none"></div>

        <div className="bg-gradient-to-br from-[#0EA5E9] via-[#2563EB] to-[#4F46E5] p-10 sm:p-14 text-white relative">
          {/* Spotlight Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 mb-8">
            <i className="fas fa-star text-[10px] text-yellow-300"></i>
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pilihan VOꓘE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-[900] mb-8 leading-[1.1] tracking-tight">{post.title}</h2>

          <div className="flex items-center space-x-4">
            <img
              src={post.author?.avatar || 'https://via.placeholder.com/150'}
              className="w-14 h-14 rounded-2xl border-2 border-white/30 object-cover shadow-lg"
              alt={authorName}
            />
            <div>
              <p className="text-sm font-black text-white">{authorName}</p>
              <p className="text-[10px] text-indigo-100/60 uppercase tracking-widest font-black mt-0.5">{post.author?.username || 'user'}</p>
            </div>
          </div>
        </div>

        <div className="p-10 sm:p-14 relative">
          <div className="text-slate-500 text-lg leading-[1.8] font-medium italic mb-2 relative">
            <span className="absolute -top-4 -left-6 text-slate-100 text-6xl font-serif select-none pointer-events-none">“</span>
            {teaser}
            <span className="inline-block items-center ml-2">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full inline-block animate-bounce"></span>
            </span>
          </div>
        </div>

        <div className="p-8 sm:p-12 border-t border-slate-50 bg-slate-50/50 flex flex-col space-y-4">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.25em] hover:bg-black transition-all flex items-center justify-center space-x-3 shadow-xl hover:scale-[1.02] active:scale-95 shadow-indigo-100"
          >
            <span>Baca Selengkapnya</span>
            <i className="fas fa-arrow-right text-[10px] transform translate-x-0 group-hover:translate-x-1 transition-transform"></i>
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest hover:text-slate-600 transition-colors"
          >
            Nanti Saja
          </button>
        </div>
      </div>
    </div>
  );
};

export const WithdrawModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onWithdraw: (amount: number, method: string, account: string, bankName?: string) => void;
}> = ({ isOpen, onClose, balance, onWithdraw }) => {
  const MIN_WITHDRAW = 5000;
  const adminFee = 6500;

  const [method, setMethod] = useState('Bank Transfer');
  const [bankName, setBankName] = useState('BCA');
  const [account, setAccount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setWithdrawAmount(balance >= MIN_WITHDRAW ? MIN_WITHDRAW : balance);
    }
  }, [isOpen, balance]);

  const netAmount = Math.max(0, (withdrawAmount * 10) - adminFee);
  const isValidAmount = withdrawAmount >= MIN_WITHDRAW && withdrawAmount <= balance;
  const canWithdraw = balance >= MIN_WITHDRAW;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidAmount && account) {
      onWithdraw(withdrawAmount, method, account, method === 'Bank Transfer' ? bankName : undefined);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<>Cairkan Saldo <VokeText /></>}>
      <form onSubmit={handleConfirm} className="space-y-6">
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 flex justify-between items-center">
          <div>
            <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mb-1">Saldo Akun <VokeText /></p>
            <p className="text-2xl font-black text-amber-700">{balance.toLocaleString('id-ID')} <span className="text-sm font-medium">Poin</span></p>
          </div>
          <i className="fas fa-coins text-amber-400 text-2xl"></i>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nominal Cairkan (Min. 5.000)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(Number(e.target.value))}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl font-black text-lg outline-none focus:ring-2 focus:ring-amber-500"
            />
            {!canWithdraw && <p className="text-[10px] text-rose-500 font-bold mt-2">Saldo minimal 5.000 poin diperlukan.</p>}
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tujuan Pengiriman</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm mb-3">
              <option>Bank Transfer</option>
              <option>GoPay</option>
              <option>Dana</option>
            </select>
            <input
              type="text"
              placeholder="No. Rekening / No. HP"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="w-full p-4 bg-gray-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
        </div>

        <div className="bg-gray-100/50 p-5 rounded-3xl space-y-2 border border-gray-100">
          <div className="flex justify-between text-[11px] font-bold text-gray-400">
            <span>Biaya Sistem</span>
            <span>Rp {adminFee.toLocaleString('id-ID')}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-black text-gray-900">
            <span>Estimasi Dana Cair</span>
            <span className="text-emerald-600">Rp {netAmount.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="flex flex-col space-y-3">
          <button
            type="submit"
            disabled={!canWithdraw || !isValidAmount || !account}
            className={`w-full py-5 rounded-[1.25rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl ${canWithdraw && isValidAmount && account
              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-100'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed shadow-none'
              }`}
          >
            Cairkan Dana Sekarang
          </button>
          <button type="button" onClick={onClose} className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-colors">Batal</button>
        </div>
      </form>
    </Modal>
  );
};

export const PromoteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (duration: number, cost: number) => void;
  postTitle: string;
  balance: number;
}> = ({ isOpen, onClose, onConfirm, postTitle, balance }) => {
  const PLANS = [
    { duration: 1, cost: 200, label: '1 Hari', points: '200 Poin' },
    { duration: 3, cost: 400, label: '3 Hari', points: '400 Poin' }
  ];
  const [selectedPlan, setSelectedPlan] = useState(PLANS[0]);

  const canAfford = balance >= selectedPlan.cost;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<><VokeText /> Spotlight</>}>
      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2.5rem] border border-indigo-100 text-center">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-md mx-auto mb-4">
            <i className="fas fa-rocket text-indigo-500 text-2xl"></i>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed px-4">Tampilkan karya <b>"{postTitle}"</b> di barisan terdepan <VokeText /> selama {selectedPlan.label}.</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {PLANS.map(plan => (
            <button
              key={plan.duration}
              onClick={() => setSelectedPlan(plan)}
              className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center space-y-2 ${selectedPlan.duration === plan.duration
                ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100'
                : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'
                }`}
            >
              <span className={`text-[10px] font-black uppercase tracking-widest ${selectedPlan.duration === plan.duration ? 'text-indigo-600' : ''}`}>{plan.label}</span>
              <span className={`text-sm font-black ${selectedPlan.duration === plan.duration ? 'text-indigo-900' : ''}`}>{plan.points}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => { onConfirm(selectedPlan.duration, selectedPlan.cost); onClose(); }}
            disabled={!canAfford}
            className={`w-full py-5 rounded-[1.25rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl ${canAfford ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
          >
            {canAfford ? 'Konfirmasi Spotlight' : 'Poin Tidak Cukup'}
          </button>
          <button onClick={onClose} className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Batal</button>
        </div>
      </div>
    </Modal>
  );
};

export const ReportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onReport: (reason: string) => void;
}> = ({ isOpen, onClose, onReport }) => {
  const [reason, setReason] = useState('Spam');
  const reasons = ['Spam', 'Konten Tidak Pantas', 'Plagiarisme', 'Lainnya'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Laporkan Karya">
      <div className="space-y-6">
        <p className="text-xs text-gray-500 font-medium leading-relaxed">Alasan pelaporan? Laporan akan ditinjau admin dalam 24 jam.</p>
        <div className="space-y-3">
          {reasons.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`w-full p-4 rounded-2xl text-left text-sm font-bold transition-all border-2 ${reason === r ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-50 text-gray-400 hover:border-gray-100'
                }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex flex-col space-y-3 pt-4">
          <button
            onClick={() => {
              onReport(reason);
              onClose();
            }}
            className="w-full py-5 bg-rose-500 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest hover:bg-rose-600 shadow-xl transition-all"
          >
            Kirim Laporan
          </button>
          <button type="button" onClick={onClose} className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest">Batal</button>
        </div>
      </div>
    </Modal>
  );
};

export const TopUpModal: React.FC<{ isOpen: boolean; onClose: () => void; onSelect: (pkg: TopUpPackage) => void; }> = ({ isOpen, onClose, onSelect }) => {
  const packages: TopUpPackage[] = [
    { id: 'p1', name: 'Starter VOKE', points: 1000, price: 10000 },
    { id: 'p2', name: 'Popular VOKE', points: 5500, price: 50000, bonus: '+10%', isPopular: true },
    { id: 'p3', name: 'Pro VOKE', points: 12000, price: 100000, bonus: '+20%' },
    { id: 'p4', name: 'VIP VOKE', points: 32500, price: 250000, bonus: '+30%' },
  ];

  console.log('Rendering TopUpModal. Packages:', packages.length);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<>Isi Poin <VokeText /></>}>
      <div className="space-y-4 bg-white">
        {/* Added bg-white to ensure visibility */}
        {packages.map((pkg) => (
          <button key={pkg.id} onClick={() => onSelect(pkg)} className={`w-full relative flex items-center justify-between p-5 rounded-3xl border-2 transition-all overflow-hidden text-left ${pkg.isPopular ? 'border-indigo-600 bg-indigo-50/20' : 'border-gray-100 hover:border-indigo-200'}`}>
            <div className="flex-1">
              <h4 className="font-black text-gray-900 text-sm mb-1">{pkg.name}</h4>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-black text-indigo-600">{pkg.points.toLocaleString('id-ID')}</span>
                <span className="text-[10px] font-bold text-indigo-400">Poin</span>
              </div>
            </div>
            <span className="text-sm font-black text-gray-800 shrink-0 ml-4">Rp {pkg.price.toLocaleString('id-ID')}</span>
          </button>
        ))}
        <button onClick={onClose} className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-colors">Batal</button>
      </div>
    </Modal>
  );
};
