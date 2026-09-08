import React from 'react';
import { X, BookOpen, Compass, ExternalLink, ScrollText } from 'lucide-react';
import { getRelatedChaptersForTerm, getRelatedCasesForTerm, getRelatedTermsForTerm } from '../../lib/termService';

export default function TermModal({ term, onClose, onSelectChapter, onSelectTerm }) {
  if (!term) return null;

  const relatedChapters = getRelatedChaptersForTerm(term);
  const relatedCases = getRelatedCasesForTerm(term);
  const relatedTerms = getRelatedTermsForTerm(term);

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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-2xl font-bold font-serif-sc text-[#1F2421]">{term.name}</h2>
                {term.aliases && term.aliases.length > 0 && (
                  <span className="text-xs text-stone-400">又作：{term.aliases.join('、')}</span>
                )}
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-stone-100 text-stone-700">
                  {term.category}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">《增删卜易》术语</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 是什么：原文 + 直译 + 讲解 */}
        <div className="mt-5 space-y-3">
          {term.originalText && (
            <div className="p-4 rounded-xl bg-[#FBF9F5] border border-[#EAE6DC]">
              <div className="text-[11px] font-semibold text-stone-500 mb-1.5">【原文】</div>
              <p className="text-stone-800 font-serif-sc text-sm leading-relaxed">{term.originalText}</p>
            </div>
          )}
          {term.literalTranslation && (
            <div className="pl-4 border-l-2 border-stone-200">
              <div className="text-[11px] font-semibold text-stone-400 mb-1">【直译】</div>
              <p className="text-stone-500 text-sm leading-relaxed">{term.literalTranslation}</p>
            </div>
          )}
          {term.explanation && (
            <div className="p-4 rounded-xl bg-amber-50/50 border-l-4 border-[#C0392B]">
              <div className="text-[11px] font-semibold text-amber-800 mb-1.5">【讲解】</div>
              <p className="text-stone-800 text-sm leading-relaxed">{term.explanation}</p>
            </div>
          )}
          {term.sectDisagreement && (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-2">
              <ScrollText className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
              <p className="text-xs text-stone-600 leading-relaxed">{term.sectDisagreement}</p>
            </div>
          )}
        </div>

        {/* 看例子：关联实例 */}
        {relatedCases.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1">
              📖 看例子 ({relatedCases.length})
            </h4>
            <div className="space-y-1.5">
              {relatedCases.map((c) => (
                <div key={c.id} className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/60 text-xs">
                  <div className="font-medium text-stone-800">{c.title}</div>
                  <div className="text-stone-500 mt-0.5 line-clamp-2">{c.summary}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 相关术语 */}
        {relatedTerms.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">相关术语</h4>
            <div className="flex flex-wrap gap-1.5">
              {relatedTerms.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onSelectTerm && onSelectTerm(t.id)}
                  className="px-3 py-1 rounded-lg text-xs bg-stone-100 hover:bg-[#C0392B]/10 hover:text-[#C0392B] border border-stone-200 text-stone-700 transition-colors cursor-pointer"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 关联典籍章节 */}
        {relatedChapters.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" /> 出自章节
            </h4>
            <div className="grid grid-cols-1 gap-2">
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
            className="px-5 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            关闭浮窗
          </button>
        </div>

      </div>
    </div>
  );
}
