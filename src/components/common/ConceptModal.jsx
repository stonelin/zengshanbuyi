import React from 'react';
import { X, BookOpen, Compass, ExternalLink, Sparkles } from 'lucide-react';
import { getRelatedChaptersForConcept } from '../../lib/conceptService';

export default function ConceptModal({ concept, onClose, onSelectChapter }) {
  if (!concept) return null;

  const relatedChapters = getRelatedChaptersForConcept(concept);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white border border-[#EAE6DC] rounded-2xl shadow-2xl p-6 md:p-8">
        
        {/* 顶部标题与分类 */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-[#C0392B] rounded-xl border border-amber-200/60">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold font-serif-sc text-[#1F2421]">{concept.name}</h2>
                <span className="text-xs text-stone-400 font-mono">[{concept.pinyin || ''}]</span>
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-stone-100 text-stone-700">
                  {concept.category}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">《增删卜易》核心理法与断卦法则</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 极简定义 */}
        <div className="mt-5 p-4 rounded-xl bg-[#FBF9F5] border border-[#EAE6DC]">
          <div className="text-xs font-semibold text-stone-500 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C0392B]" /> 核心释义
          </div>
          <p className="text-stone-800 leading-relaxed text-sm md:text-base font-medium">
            {concept.definition}
          </p>
        </div>

        {/* 原著歌诀与名言 */}
        {concept.book_quote && (
          <div className="mt-4 p-4 rounded-xl bg-amber-50/50 border border-amber-200/50">
            <div className="text-xs font-semibold text-amber-800 mb-1">📜 野鹤老人原著论断</div>
            <p className="text-stone-800 font-serif-sc text-sm leading-relaxed italic">
              “{concept.book_quote}”
            </p>
          </div>
        )}

        {/* 断卦关键规则 */}
        {concept.rules && concept.rules.length > 0 && (
          <div className="mt-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              ⚖️ 实战断卦要点 (Rules)
            </h4>
            <ul className="space-y-1.5">
              {concept.rules.map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-stone-700">
                  <span className="text-[#C0392B] font-bold mt-0.5">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 关联典籍章节 */}
        {relatedChapters.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> 关联典籍章节 ({relatedChapters.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {relatedChapters.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => {
                    onClose();
                    if (onSelectChapter) onSelectChapter(ch.id);
                  }}
                  className="flex items-center justify-between p-2.5 text-left rounded-lg bg-stone-50 hover:bg-amber-50/80 border border-stone-200/60 transition-all text-xs group"
                >
                  <span className="font-medium text-stone-800 group-hover:text-[#C0392B] truncate">{ch.title}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#C0392B] shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 底部按钮 */}
        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors"
          >
            关闭浮窗
          </button>
        </div>

      </div>
    </div>
  );
}
