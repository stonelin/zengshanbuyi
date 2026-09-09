import React, { useState } from 'react';
import { X, BookOpen, ScrollText, AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import PaipanCardLayout from '../../components/common/PaipanCardLayout';
import { getRelatedTermsForCase } from '../../lib/caseService';
import { formatCaseText } from '../../lib/boardTextExport';
import { copyTextToClipboard } from '../../lib/clipboard';

export default function CaseDetailModal({ caseItem, onClose, onSelectTerm, onSelectChapter }) {
  const [isDiagramOpen, setIsDiagramOpen] = useState(false);
  const [copyState, setCopyState] = useState('idle'); // idle | done | failed
  if (!caseItem) return null;

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(formatCaseText(caseItem));
    setCopyState(ok ? 'done' : 'failed');
    setTimeout(() => setCopyState('idle'), 2000);
  };

  const relatedTerms = getRelatedTermsForCase(caseItem);
  const verified = caseItem.tags?.verified;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 sm:pt-12 bg-stone-900/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white border border-[#EAE6DC] rounded-2xl shadow-2xl mb-8"
        onClick={(e) => e.stopPropagation()}
      >

        {/* 顶部标题 */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-stone-100 px-6 md:px-8 py-4 rounded-t-2xl flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold font-serif-sc text-[#1F2421]">{caseItem.title}</h2>
              {verified && (
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${verified === '应验' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                  {verified}
                </span>
              )}
            </div>
            {caseItem.chapterTitle && (
              <button
                onClick={() => { if (onSelectChapter && caseItem.chapterId) { onClose(); onSelectChapter(caseItem.chapterId); } }}
                className="text-xs text-stone-500 hover:text-[#C0392B] mt-0.5 flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" /> {caseItem.chapterTitle}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleCopy}
              title="复制原文与盘面（纯文本，便于粘给其他 AI 追问）"
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                copyState === 'done'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : copyState === 'failed'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              {copyState === 'done' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copyState === 'done' ? '已复制' : copyState === 'failed' ? '复制失败' : '复制'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 md:p-8 pt-5 space-y-5">

          {caseItem.disputed?.isDisputed && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">{caseItem.disputed.note || '与常规取法不一致，需留意。'}</p>
            </div>
          )}

          {/* 原文 */}
          <div className="space-y-3">
            {caseItem.originalText?.diagram && (
              <div className="rounded-xl bg-[#FBF9F5] border border-[#EAE6DC] overflow-hidden">
                <button
                  onClick={() => setIsDiagramOpen(prev => !prev)}
                  className="w-full flex items-center justify-between px-4 py-2.5 text-left cursor-pointer hover:bg-stone-100/60 transition-colors"
                >
                  <span className="text-[11px] font-semibold text-stone-500">
                    【原文卦图】（结构化盘面已在下方，此处仅供逐字校对）
                  </span>
                  {isDiagramOpen ? <ChevronUp className="w-3.5 h-3.5 text-stone-400" /> : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />}
                </button>
                {isDiagramOpen && (
                  <pre className="px-4 pb-4 text-xs text-stone-800 font-serif-sc leading-relaxed whitespace-pre-wrap">{caseItem.originalText.diagram}</pre>
                )}
              </div>
            )}
            {caseItem.originalText?.verdict && (
              <div className="p-4 rounded-xl bg-amber-50/50 border-l-4 border-[#C0392B]">
                <div className="text-[11px] font-semibold text-amber-800 mb-1.5">【野鹤断语】</div>
                <p className="text-stone-800 text-sm leading-relaxed">{caseItem.originalText.verdict}</p>
              </div>
            )}
            {caseItem.originalText?.analysis && (
              <div className="pl-4 border-l-2 border-stone-200">
                <div className="text-[11px] font-semibold text-stone-400 mb-1">【解析】</div>
                <p className="text-stone-600 text-sm leading-relaxed">{caseItem.originalText.analysis}</p>
              </div>
            )}
          </div>

          {/* 盘面卡片 */}
          <PaipanCardLayout
            board={caseItem.board}
            collapsibleConclusion
            defaultConclusionOpen
            yongShenFallback={caseItem.tags?.yongShen}
          />

          {/* 小结与要点 */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/60 space-y-2">
            <div className="text-[11px] font-semibold text-stone-500">【小结】</div>
            <p className="text-sm text-stone-800 leading-relaxed font-medium">{caseItem.summary}</p>
            {caseItem.tags?.keyPoints?.length > 0 && (
              <ul className="mt-1 space-y-1">
                {caseItem.tags.keyPoints.map((kp, idx) => (
                  <li key={idx} className="text-xs text-stone-600 flex items-start gap-1.5">
                    <span className="text-stone-400 mt-0.5">·</span>
                    <span>{kp}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 相关术语 */}
          {relatedTerms.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1">
                <ScrollText className="w-3.5 h-3.5" /> 相关术语
              </h4>
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

        </div>

        <div className="px-6 md:px-8 pb-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
          >
            关闭
          </button>
        </div>

      </div>
    </div>
  );
}
