
import React, { useState, useMemo } from 'react';
import { TopUpRequest, ReportRecord, Post, Advertisement, SignUpRequest, User, WithdrawRequest } from '../types';
import { AdEditorModal } from './Modals';

interface AdminDashboardProps {
  topUps: TopUpRequest[];
  withdraws: WithdrawRequest[];
  reports: ReportRecord[];
  pendingPromos: Post[];
  signupRequests: SignUpRequest[];
  ads: Advertisement[];
  allUsers: Record<string, User>;
  viewRate: number;
  onUpdateViewRate: (rate: number) => void;
  onApproveTopUp: (id: string) => void;
  onRejectTopUp: (id: string) => void;
  onApproveWithdraw: (id: string) => void;
  onRejectWithdraw: (id: string) => void;
  onApprovePromo: (postId: string) => void;
  onRejectPromo: (postId: string) => void;
  onDismissReport: (reportId: string) => void;
  onDeletePost: (postId: string, reportId: string) => void;
  onApproveUser: (id: string) => void;
  onRejectUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onSaveAd: (ad: Advertisement) => void;
  onDeleteAd: (id: string) => void;
  onToggleAd: (id: string) => void;
  onUpdatePoints: (userId: string, amount: number) => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  topUps, withdraws, reports, pendingPromos, signupRequests, ads, allUsers,
  viewRate, onUpdateViewRate,
  onApproveTopUp, onRejectTopUp, onApproveWithdraw, onRejectWithdraw, onApprovePromo, onRejectPromo, onDismissReport, onDeletePost,
  onApproveUser, onRejectUser, onDeleteUser, onSaveAd, onDeleteAd, onToggleAd,
  onUpdatePoints,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'finance' | 'promo' | 'reports' | 'ads'>('users');
  const [searchUser, setSearchUser] = useState('');
  const [tempRate, setTempRate] = useState(viewRate.toString());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Ad Management States
  const [isAdEditorOpen, setIsAdEditorOpen] = useState(false);
  const [adToEdit, setAdToEdit] = useState<Advertisement | null>(null);

  // Point Adjustment State
  const [pointAdjustAmount, setPointAdjustAmount] = useState('');
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);

  const filteredUsers = useMemo(() => {
    return (Object.values(allUsers) as User[]).filter(u =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.username.toLowerCase().includes(searchUser.toLowerCase())
    );
  }, [allUsers, searchUser]);

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in duration-500">
      <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/20">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-sm shadow-lg">
            <i className="fas fa-shield-halved"></i>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">VOꓘE Admin Hub</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Management Hub</p>
          </div>
        </div>
        <button onClick={onClose} className="w-12 h-12 bg-white hover:bg-rose-50 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all shadow-sm">
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto no-scrollbar">
        {(['users', 'finance', 'promo', 'reports', 'ads'] as const).map(tab => {
          let count = 0;
          if (tab === 'users') count = signupRequests.length;
          if (tab === 'finance') count = topUps.length + withdraws.length;
          if (tab === 'promo') count = pendingPromos.length;
          if (tab === 'reports') count = reports.length;

          return (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedUser(null); }}
              className={`flex-none px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center space-x-2 ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <span>{tab === 'users' ? 'Pengguna' : tab === 'finance' ? 'Keuangan' : tab === 'promo' ? 'Promosi' : tab === 'reports' ? 'Laporan' : 'Iklan'}</span>
              {count > 0 && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white ${activeTab === tab ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-8 max-h-[65vh] overflow-y-auto custom-scrollbar">

        {/* TAB PENGGUNA: LIST VIEW */}
        {activeTab === 'users' && !selectedUser && (
          <div className="space-y-10">
            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Antrean Pendaftaran ({signupRequests.length})</h4>
              {signupRequests.map(r => (
                <div key={r.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img src={r.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-sm" alt={r.name} />
                    <div>
                      <p className="font-black text-slate-800 text-sm leading-none">{r.name}</p>
                      <p className="text-[10px] text-indigo-600 font-bold mt-1 uppercase tracking-widest">{r.username}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => onRejectUser(r.id)} className="px-5 py-2.5 bg-white text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border">Tolak</button>
                    <button onClick={() => onApproveUser(r.id)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-200">Setujui</button>
                  </div>
                </div>
              ))}
              {signupRequests.length === 0 && <p className="text-center py-6 text-slate-300 italic text-sm font-medium">Tidak ada pengajuan baru.</p>}
            </section>

            <section className="space-y-4 pt-6 border-t border-slate-50">
              <div className="flex justify-between items-center px-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Semua Pengguna</h4>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cari user..."
                    value={searchUser}
                    onChange={e => setSearchUser(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                  />
                  <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-[10px]"></i>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map(u => (
                  <div key={u.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center space-x-4 hover:shadow-md transition-all group">
                    <img src={u.avatar} className="w-10 h-10 rounded-xl object-cover" alt={u.name} />
                    <div className="flex-1">
                      <p className="font-black text-slate-800 text-xs leading-none">{u.name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black mt-1">{u.username}</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                      className="px-4 py-2 bg-slate-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all"
                    >
                      Detail
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB PENGGUNA: DETAIL VIEW */}
        {activeTab === 'users' && selectedUser && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <button onClick={() => setSelectedUser(null)} className="mb-6 flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
              <i className="fas fa-arrow-left"></i>
              <span>Kembali ke Daftar</span>
            </button>
            <div className="bg-slate-50 rounded-[2.5rem] p-10 border border-slate-100">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 mb-10">
                <img src={selectedUser.avatar} className="w-24 h-24 rounded-[2rem] object-cover shadow-xl border-4 border-white" alt={selectedUser.name} />
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black text-slate-900 leading-none">{selectedUser.name}</h3>
                  <p className="text-indigo-600 font-bold uppercase tracking-widest mt-2">{selectedUser.username}</p>
                  <div className="mt-4 flex space-x-4 justify-center md:justify-start">
                    <div className="bg-white px-4 py-2 rounded-xl text-center shadow-sm">
                      <p className="text-sm font-black text-slate-800">{selectedUser.giftBalance.toLocaleString()}</p>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Poin</p>
                    </div>
                    <div className="bg-white px-4 py-2 rounded-xl text-center shadow-sm">
                      <p className="text-sm font-black text-slate-800">{selectedUser.followersCount.toLocaleString()}</p>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Pengikut</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b pb-2 mb-4">Biodata</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium shrink-0">Bio:</span>
                      <span className="text-slate-800 font-bold text-right ml-4">{selectedUser.bio || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">Email:</span>
                      <span className="text-slate-800 font-bold">{selectedUser.email || '-'}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 bg-white p-6 rounded-3xl shadow-sm">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest border-b pb-2 mb-4">Kontak</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">WA:</span>
                      <span className="text-slate-800 font-bold">{selectedUser.waNumber || '-'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">Lokasi:</span>
                      <span className="text-slate-800 font-bold text-right">{selectedUser.address || '-'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Actions for User */}
              <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Manajemen Saldo</p>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      placeholder="Jumlah poin (misal: 1000)"
                      value={pointAdjustAmount}
                      onChange={e => setPointAdjustAmount(e.target.value)}
                      className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none"
                    />
                    <button
                      disabled={isAdjustingPoints || !pointAdjustAmount}
                      onClick={async () => {
                        setIsAdjustingPoints(true);
                        await onUpdatePoints(selectedUser.id, parseFloat(pointAdjustAmount));
                        setPointAdjustAmount('');
                        setIsAdjustingPoints(false);
                      }}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {isAdjustingPoints ? 'Proses...' : 'Tambah Poin'}
                    </button>
                  </div>
                  <p className="text-[8px] text-slate-400 italic">Masukkan angka positif untuk menambah, atau negatif untuk mengurangi.</p>
                </div>

                <div className="flex items-end justify-end space-x-3">
                  <button
                    onClick={() => {
                      if (confirm(`Yakin ingin menghapus user ${selectedUser.name}?`)) {
                        onDeleteUser(selectedUser.id);
                        setSelectedUser(null);
                      }
                    }}
                    className="px-6 py-3 bg-rose-50 text-rose-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all border border-rose-100"
                  >
                    <i className="fas fa-trash-alt mr-2"></i>
                    Hapus User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB KEUANGAN */}
        {activeTab === 'finance' && (
          <div className="space-y-10">
            <div className="p-8 bg-indigo-600 rounded-[3rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10"><i className="fas fa-coins text-8xl"></i></div>
              <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-6">Sistem Monetisasi</h4>
                <div className="flex flex-col md:flex-row gap-6 items-end">
                  <div className="flex-1">
                    <p className="text-[10px] font-bold mb-2 opacity-80 uppercase tracking-widest">Rate Poin per Unique View</p>
                    <input type="number" step="0.0001" value={tempRate} onChange={e => setTempRate(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-6 text-2xl font-black outline-none focus:ring-4 focus:ring-white/10 transition-all" />
                  </div>
                  <button onClick={() => onUpdateViewRate(parseFloat(tempRate))} className="bg-white text-indigo-600 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Update</button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <i className="fas fa-receipt mr-2 text-indigo-400"></i> Top-Up Poin ({topUps.length})
                </h4>
                {topUps.map(t => (
                  <div key={t.id} className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-black text-slate-800 text-sm leading-none">{t.userName}</p>
                      <p className="text-[10px] text-slate-400 font-black uppercase mt-2">{t.points.toLocaleString()} Poin • Rp {t.price.toLocaleString()}</p>
                    </div>
                    <button onClick={() => onApproveTopUp(t.id)} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100">Verif</button>
                  </div>
                ))}
                {topUps.length === 0 && <p className="text-center py-4 text-slate-300 italic text-xs">Semua transaksi beres.</p>}
              </section>

              <section className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <i className="fas fa-wallet mr-2 text-rose-400"></i> Penarikan Dana ({withdraws.length})
                </h4>
                {withdraws.map(w => (
                  <div key={w.id} className="p-6 bg-white border border-slate-100 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="font-black text-slate-800 text-sm leading-none">{w.userName}</p>
                      <p className="text-[10px] text-rose-500 font-black uppercase mt-2">{w.amount.toLocaleString()} Poin • {w.method} ({w.account})</p>
                    </div>
                    <button onClick={() => onApproveWithdraw(w.id)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest">Cairkan</button>
                  </div>
                ))}
                {withdraws.length === 0 && <p className="text-center py-4 text-slate-300 italic text-xs">Tidak ada antrean.</p>}
              </section>
            </div>
          </div>
        )}

        {/* TAB PROMOSI */}
        {activeTab === 'promo' && (
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pengajuan Spotlight ({pendingPromos.length})</h4>
            {pendingPromos.map(p => (
              <div key={p.id} className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] flex items-center justify-between">
                <div className="flex-1 mr-8">
                  <h5 className="font-black text-slate-800 mb-1 leading-snug">"{p.title}"</h5>
                  <p className="text-[10px] text-indigo-600/70 font-black uppercase tracking-widest">Oleh: {allUsers[p.userId]?.name || 'User'}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => onRejectPromo(p.id)} className="px-6 py-3 bg-white text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border">Tolak</button>
                  <button onClick={() => onApprovePromo(p.id)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">Approve</button>
                </div>
              </div>
            ))}
            {pendingPromos.length === 0 && <p className="text-center py-12 text-slate-300 italic text-sm font-bold uppercase tracking-widest">Tidak ada pengajuan Spotlight.</p>}
          </div>
        )}

        {/* TAB LAPORAN */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aduan Konten ({reports.length})</h4>
            {reports.map(rep => (
              <div key={rep.id} className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-widest mb-1">Alasan: {rep.reason}</p>
                    <h5 className="font-black text-slate-800 text-lg leading-tight">"{rep.postTitle}"</h5>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Reporter: {rep.reporterName}</p>
                  </div>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => onDeletePost(rep.postId, rep.id)} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-100">Hapus Permanen</button>
                  <button onClick={() => onDismissReport(rep.id)} className="px-10 py-4 bg-white text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-200">Abaikan</button>
                </div>
              </div>
            ))}
            {reports.length === 0 && <p className="text-center py-12 text-slate-300 italic text-sm font-bold uppercase tracking-widest">Feed bersih dari laporan.</p>}
          </div>
        )}

        {/* TAB IKLAN */}
        {activeTab === 'ads' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center px-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banner Iklan Aktif ({ads.length})</h4>
              <button
                onClick={() => { setAdToEdit(null); setIsAdEditorOpen(true); }}
                className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center space-x-2"
              >
                <i className="fas fa-plus"></i>
                <span>Tambah Iklan</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ads.map(a => (
                <div key={a.id} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-6">
                    <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${a.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {a.isActive ? 'Tayang' : 'Mati'}
                    </span>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Posisi: {a.position}</span>
                  </div>
                  {a.imageUrl && <img src={a.imageUrl} className="w-full h-24 object-cover rounded-2xl mb-4 border border-slate-50" alt="" />}
                  <h5 className="font-black text-slate-800 mb-2 leading-snug">{a.title}</h5>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mb-8 leading-relaxed font-medium">{a.description}</p>
                  <div className="flex space-x-2">
                    <button onClick={() => onToggleAd(a.id)} className="flex-1 py-3 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-100">{a.isActive ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    <button onClick={() => { setAdToEdit(a); setIsAdEditorOpen(true); }} className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center transition-all hover:bg-indigo-100"><i className="fas fa-edit text-xs"></i></button>
                    <button onClick={() => onDeleteAd(a.id)} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center transition-all hover:bg-rose-100"><i className="fas fa-trash-alt text-xs"></i></button>
                  </div>
                </div>
              ))}
            </div>
            {ads.length === 0 && <p className="text-center py-12 text-slate-200 italic font-black uppercase tracking-widest">Belum ada pariwara.</p>}
          </div>
        )}
      </div>

      <AdEditorModal
        isOpen={isAdEditorOpen}
        onClose={() => setIsAdEditorOpen(false)}
        onSave={(ad) => { onSaveAd(ad); setIsAdEditorOpen(false); }}
        adToEdit={adToEdit}
      />
    </div>
  );
};
