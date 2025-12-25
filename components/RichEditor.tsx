
import React, { useState, useRef, useEffect } from 'react';
import { generateAICaption, generateAITitle } from '../services/geminiService';

interface RichEditorProps {
  onPublish: (title: string, content: string, caption: string) => void;
  onSaveDraft: (title: string, content: string, caption: string) => void;
  onCancel: () => void;
  onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
  initialData?: { title: string, content: string, caption: string, coverImage?: string };
}

export const RichEditor: React.FC<RichEditorProps> = ({ onPublish, onSaveDraft, onCancel, onNotify, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [caption, setCaption] = useState(initialData?.caption || '');
  const [coverImage, setCoverImage] = useState(initialData?.coverImage || '');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Initialize content once on mount or when initialData changes fundamentally (e.g. switching drafts)
  useEffect(() => {
    if (editorRef.current && (!isInitialized.current || initialData?.content !== undefined)) {
      editorRef.current.innerHTML = initialData?.content || '';
      isInitialized.current = true;
    }
  }, [initialData?.content]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleAiAssist = async () => {
    const content = editorRef.current?.innerText || '';
    if (!content.trim() || content.length < 20) {
      onNotify('Tulis minimal beberapa kalimat agar AI bisa membantu!', 'info');
      return;
    }

    setIsAiLoading(true);
    try {
      const [newTitle, newCaption] = await Promise.all([
        generateAITitle(content),
        generateAICaption(content)
      ]);
      setTitle(newTitle);
      setCaption(newCaption);
      onNotify('AI telah meramu judul dan caption untukmu!', 'success');
    } catch (err) {
      onNotify('Gagal menghubungi asisten AI.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handlePublish = () => {
    const content = editorRef.current?.innerHTML || '';
    if (!title.trim() || !content.replace(/<[^>]*>/g, '').trim()) {
      onNotify('Judul dan isi tulisan wajib diisi!', 'error');
      return;
    }
    onPublish(title, content, caption, coverImage);
  };

  const handleSaveDraft = () => {
    const content = editorRef.current?.innerHTML || '';
    if (!title.trim()) {
      onNotify('Judul wajib diisi untuk menyimpan draf!', 'error');
      return;
    }
    onSaveDraft(title, content, caption, coverImage);
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl mx-auto overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-700">
      <div className="p-8 md:p-12 space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <i className="fas fa-pen-nib"></i>
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">VOꓘE up Now!</h2>
          </div>
          <button onClick={onCancel} className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            placeholder="Ketik judul yang kuat di sini..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-4xl font-black border-none focus:ring-0 placeholder-gray-200 text-gray-900 leading-tight outline-none"
          />
          <div className="flex items-center space-x-2">
            <span className="text-indigo-400 font-black">#</span>
            <input
              type="text"
              placeholder="caption atau tagar..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="flex-1 text-indigo-600 font-bold border-none focus:ring-0 placeholder-indigo-200 text-sm outline-none"
            />
          </div>
          <div className="flex items-center space-x-2 border-t border-gray-50 pt-2">
            <i className="fas fa-image text-slate-300 text-xs"></i>
            <input
              type="text"
              placeholder="Link Gambar Sampul (opsional)..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="flex-1 text-slate-500 font-medium border-none focus:ring-0 placeholder-slate-200 text-xs outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-1 border-y border-gray-100 py-3 sticky top-0 bg-white z-10">
          <div className="flex bg-gray-50 p-1 rounded-xl mr-4">
            <button onClick={() => execCommand('bold')} className="w-10 h-10 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center font-black text-sm transition-all" title="Tebal">B</button>
            <button onClick={() => execCommand('italic')} className="w-10 h-10 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center italic text-sm transition-all" title="Miring">I</button>
            <button onClick={() => execCommand('underline')} className="w-10 h-10 rounded-lg hover:bg-white hover:shadow-sm flex items-center justify-center underline text-sm transition-all" title="Garis Bawah">U</button>
          </div>
          <button onClick={() => execCommand('insertUnorderedList')} className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-500" title="Daftar"><i className="fas fa-list-ul"></i></button>
          <button onClick={() => execCommand('formatBlock', 'blockquote')} className="w-10 h-10 rounded-xl hover:bg-gray-50 flex items-center justify-center text-gray-500" title="Kutipan"><i className="fas fa-quote-left text-xs"></i></button>

          <div className="flex-1" />

          <button
            onClick={handleAiAssist}
            disabled={isAiLoading}
            className="flex items-center space-x-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-2xl text-xs font-black hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-50 active:scale-95"
          >
            {isAiLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-wand-sparkles"></i>}
            <span>{isAiLoading ? 'Meramu...' : 'Bantuan AI'}</span>
          </button>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning={true}
          data-placeholder="Tuliskan ide brilian Anda, jangan biarkan kertas ini kosong..."
          className="rich-editor min-h-[450px] text-xl text-gray-700 outline-none leading-relaxed prose prose-indigo max-w-none focus:ring-0"
        />

        <div className="flex flex-col md:flex-row justify-end items-center space-y-4 md:space-y-0 md:space-x-6 pt-8 border-t border-gray-50">
          <p className="text-xs text-gray-400 font-bold hidden md:block">Disimpan ke database</p>
          <div className="flex flex-col sm:flex-row w-full md:w-auto space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 rounded-2xl text-gray-400 font-black text-sm hover:text-gray-600 transition-colors bg-gray-50 md:bg-transparent w-full md:w-auto"
            >
              Batal
            </button>
            <button
              onClick={handleSaveDraft}
              className="px-6 py-3 bg-emerald-100 text-emerald-700 border-2 border-emerald-200 rounded-2xl font-black text-sm hover:bg-emerald-200 transition-colors w-full md:w-auto shadow-sm"
              style={{ display: 'block' }}
            >
              Simpan Draf
            </button>
            <button
              onClick={handlePublish}
              className="px-8 py-4 bg-gradient-to-r from-[#0EA5E9] to-[#2563EB] text-white rounded-[1.25rem] font-black text-sm hover:shadow-2xl hover:scale-105 transition-all shadow-xl shadow-cyan-100 active:scale-95 w-full md:w-auto"
            >
              Terbitkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
