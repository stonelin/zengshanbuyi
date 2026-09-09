import React, { useState, useEffect } from 'react';
import { Search, X, BookOpen, Compass, Library, BookMarked, ArrowRight } from 'lucide-react';
import chaptersData from '../../data/chapters.json';
import termsData from '../../data/terms.json';

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectChapter,
  onSelectConcept,
  onSwitchTab
}) {
  const [query, setQuery] = useState('');

  // 键盘 Esc 关闭与 ⌘K 打开监听
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // 筛选章节
  const matchedChapters = q ? chaptersData.filter(ch => 
    ch.title.toLowerCase().includes(q) || 
    ch.volume.toLowerCase().includes(q) ||
    ch.category.toLowerCase().includes(q) ||
    (ch.summary && ch.summary.toLowerCase().includes(q))
  ).slice(0, 4) : [];

  // 筛选术语
  const matchedTerms = q ? termsData.filter(t =>
    t.name.toLowerCase().includes(q) ||
    (t.aliases || []).some(a => a.toLowerCase().includes(q)) ||
    t.category.toLowerCase().includes(q) ||
    (t.literalTranslation && t.literalTranslation.toLowerCase().includes(q))
  ).slice(0, 4) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white border border-[#EAE6DC] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 搜索框 */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-200 bg-stone-50/50">
          <Search className="w-5 h-5 text-stone-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索典籍篇章、六爻术语法则 (如: 旬空, 官运, 火地晋)..."
            className="w-full bg-transparent text-sm sm:text-base text-stone-900 placeholder-stone-400 focus:outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-stone-400 hover:text-stone-700">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-stone-400 border border-stone-200 rounded bg-white font-mono">
            ESC
          </kbd>
        </div>

        {/* 搜索结果区域 */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          
          {/* 快捷导航 (未输入时显示) */}
          {!q && (
            <div>
              <div className="text-xs font-semibold text-stone-400 mb-2 uppercase tracking-wider">
                ⚡ 快捷功能通道
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { onSwitchTab('cases'); onClose(); }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-amber-50/60 border border-stone-200/60 text-left text-sm transition-all"
                >
                  <BookMarked className="w-4 h-4 text-[#C0392B]" />
                  <div>
                    <div className="font-bold text-stone-800">实例库</div>
                    <div className="text-xs text-stone-500">按标签筛选古籍实例</div>
                  </div>
                </button>
                <button
                  onClick={() => { onSwitchTab('paipan'); onClose(); }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-amber-50/60 border border-stone-200/60 text-left text-sm transition-all"
                >
                  <Compass className="w-4 h-4 text-[#C0392B]" />
                  <div>
                    <div className="font-bold text-stone-800">铜钱排盘推演台</div>
                    <div className="text-xs text-stone-500">摇卦、装卦与生克流向</div>
                  </div>
                </button>
                <button
                  onClick={() => { onSwitchTab('reader'); onClose(); }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-amber-50/60 border border-stone-200/60 text-left text-sm transition-all"
                >
                  <BookOpen className="w-4 h-4 text-[#C0392B]" />
                  <div>
                    <div className="font-bold text-stone-800">典籍精读</div>
                    <div className="text-xs text-stone-500">原文、直译与讲解</div>
                  </div>
                </button>
                <button
                  onClick={() => { onSwitchTab('terms'); onClose(); }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-stone-50 hover:bg-amber-50/60 border border-stone-200/60 text-left text-sm transition-all"
                >
                  <Library className="w-4 h-4 text-[#C0392B]" />
                  <div>
                    <div className="font-bold text-stone-800">术语总览</div>
                    <div className="text-xs text-stone-500">按分类查阅全部术语</div>
                  </div>
                </button>
              </div>

              <div className="mt-4 text-xs font-semibold text-stone-400 mb-2 uppercase tracking-wider">
                🔥 热门理法快速查阅
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['旬空', '月破', '反吟伏吟', '进神退神', '随鬼入墓', '用神', '原神忌神', '暗动'].map((name) => (
                  <button
                    key={name}
                    onClick={() => { onSelectConcept(name); onClose(); }}
                    className="px-3 py-1 rounded-lg text-xs bg-stone-100 hover:bg-[#C0392B]/10 hover:text-[#C0392B] border border-stone-200 text-stone-700 transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 术语结果 */}
          {matchedTerms.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-[#C0392B] mb-2 flex items-center gap-1.5">
                <Library className="w-3.5 h-3.5" /> 易学理法与核心术语 ({matchedTerms.length})
              </div>
              <div className="space-y-1">
                {matchedTerms.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { onSelectConcept(t.id); onClose(); }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/60 text-left text-xs transition-colors group"
                  >
                    <div>
                      <span className="font-bold text-stone-900 group-hover:text-[#C0392B] mr-2">{t.name}</span>
                      <span className="text-stone-500 line-clamp-1">{t.literalTranslation}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-[#C0392B] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 典籍章节结果 */}
          {matchedChapters.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-stone-600 mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> 增删卜易原著章节 ({matchedChapters.length})
              </div>
              <div className="space-y-1">
                {matchedChapters.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => { onSelectChapter(ch.id); onClose(); }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-100 text-left text-xs transition-colors group"
                  >
                    <div>
                      <span className="font-bold text-stone-900 group-hover:text-[#C0392B] mr-2">{ch.title}</span>
                      <span className="text-stone-400">[{ch.volume}]</span>
                    </div>
                    <span className="text-stone-400 text-[11px] group-hover:text-stone-700">进入精读 →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 未匹配到结果 */}
          {q && matchedChapters.length === 0 && matchedTerms.length === 0 && (
            <div className="py-12 text-center text-stone-400 text-sm">
              未找到与 “{query}” 匹配的内容，尝试换个词或者输入拼音搜索。
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
