
import React, { useState, useRef } from 'react';
import { User } from '../types';

interface ProfileEditorProps {
  user: User;
  onSave: (updatedUser: User) => void;
  onCancel: () => void;
}

export const ProfileEditor: React.FC<ProfileEditorProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState<User>({ ...user });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran file terlalu besar. Maksimal 2MB.");
        return;
      }

      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-2xl mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-700">
      <div className="p-8 md:p-12">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-user-edit"></i>
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Edit Profil</h2>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center mb-8">
            <div 
              className="relative group cursor-pointer"
              onClick={triggerFileInput}
            >
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-indigo-50 shadow-xl relative bg-gray-100">
                <img 
                  src={formData.avatar} 
                  alt="Avatar Preview" 
                  className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-30' : 'opacity-100'}`}
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-circle-notch fa-spin text-indigo-600"></i>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <i className="fas fa-camera text-white text-xl"></i>
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-4 font-black uppercase tracking-[0.2em]">Klik untuk ganti foto</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700 transition-all"
                placeholder="Nama Anda"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Username</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">@</span>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username.replace('@', '')}
                  onChange={(e) => setFormData(prev => ({...prev, username: `@${e.target.value}`}))}
                  className="w-full pl-10 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-gray-700 transition-all"
                  placeholder="username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Bio Singkat</label>
              <textarea 
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-gray-700 transition-all resize-none"
                placeholder="Ceritakan sedikit tentang Anda..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-8">
            <button 
              type="button"
              onClick={onCancel}
              className="px-8 py-4 rounded-2xl text-gray-400 font-black text-sm hover:text-gray-600 transition-colors"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={isUploading}
              className="px-10 py-4 bg-indigo-600 text-white rounded-[1.25rem] font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 hover:-translate-y-1 active:scale-95 disabled:opacity-50"
            >
              Simpan Perbarui
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
