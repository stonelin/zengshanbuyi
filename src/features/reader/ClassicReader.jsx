import React, { useState, useMemo } from 'react';
import chaptersData from '../../data/chapters.json';
import { CORE_CONCEPT_NAMES } from '../../lib/conceptService';
import {
  BookOpen,
  Search,
  ChevronRight,
  Sparkles,
  FileText,
  HelpCircle,
  Flame,
  Bookmark,
  Scroll,
  Compass
} from 'lucide-react';

export default function ClassicReader({
  selectedChapterId,
  onSelectChapter,
  onSelectConcept
}) {
  const [chapterSearch, setChapterSearch] = useState('');
  const [selectedVolumeFilter, setSelectedVolumeFilter] = useState('ALL');

  // 当前选中的章节对象
  const currentChapter = useMemo(() => {
    if (selectedChapterId) {
      return chaptersData.find(c => c.id === selectedChapterId) || chaptersData[0];
    }
    return chaptersData[0];
  }, [selectedChapterId]);

  // 分卷筛选与检索
  const filteredChapters = useMemo(() => {
    return chaptersData.filter(ch => {
      const matchVolume = selectedVolumeFilter === 'ALL' || ch.volume.includes(selectedVolumeFilter);
      const matchSearch = !chapterSearch.trim() || 
        ch.title.toLowerCase().includes(chapterSearch.toLowerCase()) ||
        ch.category.toLowerCase().includes(chapterSearch.toLowerCase()) ||
        (ch.summary && ch.summary.toLowerCase().includes(chapterSearch.toLowerCase()));
      return matchVolume && matchSearch;
    });
  }, [selectedVolumeFilter, chapterSearch]);

  // 渲染带有概念穿透高亮的正文 (按长度降序排列，优先匹配较长术语)
  const sortedConceptNames = useMemo(() => {
    return [...CORE_CONCEPT_NAMES].sort((a, b) => b.length - a.length);
  }, []);

  const conceptRegex = useMemo(() => {
    const escaped = sortedConceptNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    return new RegExp(`(${escaped.join('|')})`, 'g');
  }, [sortedConceptNames]);

  const renderHighlightedText = (text) => {
    if (!text) return null;

    const parts = text.split(conceptRegex);

    return parts.map((part, i) => {
      if (CORE_CONCEPT_NAMES.includes(part)) {
        return (
          <button
            key={i}
            onClick={() => onSelectConcept(part)}
            className="inline-flex items-center text-[#C0392B] font-bold border-b border-dashed border-[#C0392B]/60 hover:bg-[#C0392B]/10 rounded-[2px] px-0.5 transition-colors cursor-pointer"
            title={`点击穿透查看术语：${part}`}
          >
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // 检查段落是否为装卦盘面或卦象图解
  const isDiagramBlock = (text) => {
    if (!text) return false;
    return (
      text.includes('━━━') ||
      text.includes('━ ━') ||
      text.includes('○→') ||
      text.includes('×→') ||
      (text.includes('宫：') && (text.includes('世') || text.includes('应') || text.includes('六冲') || text.includes('六合')))
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 左侧：章节导航目录栏 (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#EAE6DC] rounded-2xl p-4 shadow-sm space-y-4 max-h-[85vh] flex flex-col">
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold font-serif-sc text-[#1F2421] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C0392B]" /> 增删卜易篇章导航
              </h3>
              <span className="text-xs text-stone-400 font-mono">共 134 章</span>
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={chapterSearch}
                onChange={(e) => setChapterSearch(e.target.value)}
                placeholder="搜索章节或主题 (如: 黄金策, 官运, 疾病)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C0392B]"
              />
            </div>
          </div>

          {/* 分卷标签切换 */}
          <div className="flex flex-wrap gap-1 border-b border-stone-100 pb-2">
            {[
              { id: 'ALL', label: '全部' },
              { id: '卷首', label: '卷首' },
              { id: '卷之一', label: '卷一·筑基' },
              { id: '卷之二', label: '卷二·深造' },
              { id: '卷之三', label: '卷三·精进上' },
              { id: '卷之四', label: '卷四·精进下' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedVolumeFilter(tab.id)}
                className={`px-2 py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
                  selectedVolumeFilter === tab.id
                    ? 'bg-[#1F2421] text-white font-bold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 章节列表 (可滚动) */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {filteredChapters.map((ch) => {
              const isSelected = currentChapter.id === ch.id;
              return (
                <button
                  key={ch.id}
                  onClick={() => onSelectChapter(ch.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/80 text-[#1F2421] border border-amber-300 shadow-xs font-bold'
                      : 'hover:bg-stone-50 text-stone-700 border border-transparent'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="text-xs truncate">{ch.title}</div>
                    <div className="text-[10px] text-stone-400 font-normal mt-0.5">
                      {ch.volume} · {ch.category}
                    </div>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-[#C0392B]' : 'text-stone-300'}`} />
                </button>
              );
            })}
          </div>

        </div>

        {/* 右侧：章节精读与双注视图 (8 cols - 限制阅读工效宽度) */}
        <div className="lg:col-span-8 bg-white border border-[#EAE6DC] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* 章节头部与典籍印章 */}
          <div className="border-b border-stone-200 pb-5 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1">
                <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-semibold">{currentChapter.volume}</span>
                <span>•</span>
                <span className="text-stone-600 font-medium">{currentChapter.category}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif-sc text-[#1F2421] tracking-wide mt-1">
                {currentChapter.title}
              </h2>
            </div>

            <div className="hidden sm:flex flex-col items-center justify-center p-2 rounded-xl border border-red-200 bg-red-50/50 text-[#C0392B] select-none">
              <span className="text-[10px] font-serif-sc font-bold">野鹤定本</span>
              <span className="text-[9px] text-red-700/70 font-mono">李文辉序</span>
            </div>
          </div>

          {/* 白话大意与核心速记卡片 */}
          {currentChapter.summary && (
            <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#EAE6DC] shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>白话导读与核心心法</span>
              </div>
              <p className="text-stone-700 text-sm leading-relaxed">
                {currentChapter.summary}
              </p>
            </div>
          )}

          {/* 核心研读要旨 */}
          {currentChapter.key_points && currentChapter.key_points.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-2.5">
                📌 本章研读要旨
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentChapter.key_points.map((kp, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 rounded-xl bg-stone-50 text-xs text-stone-800 border border-stone-200/60 shadow-2xs">
                    <span className="text-[#C0392B] font-bold mt-0.5">•</span>
                    <span className="leading-relaxed">{renderHighlightedText(kp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 原文精读区域 (限宽 max-w-3xl 保证舒适阅读工效) */}
          <div className="space-y-4 max-w-3xl">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> 古籍原文与注疏
            </h4>
            
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-stone-200 font-serif-sc text-stone-900 text-sm sm:text-base leading-loose space-y-5 shadow-2xs">
              {currentChapter.full_text ? (
                currentChapter.full_text.split('\n\n').map((para, idx) => {
                  const pTrim = para.trim();
                  if (!pTrim) return null;

                  // 1. 结构化装卦盘面识别 (专业古典排盘卡片)
                  if (isDiagramBlock(pTrim)) {
                    return (
                      <div key={idx} className="my-5 p-5 rounded-2xl bg-[#FBF9F5] border border-amber-300/70 shadow-sm space-y-2.5 not-italic font-sans">
                        <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <Compass className="w-4 h-4 text-[#C0392B]" /> 📜 原著装卦与动变图示
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold font-mono">
                            古籍排盘
                          </span>
                        </div>
                        <div className="p-4 rounded-xl bg-white border border-stone-200/80 font-mono text-xs sm:text-sm text-stone-900 leading-relaxed overflow-x-auto whitespace-pre shadow-2xs">
                          {pTrim}
                        </div>
                      </div>
                    );
                  }

                  // 2. 野鹤秘传按语识别
                  if (pTrim.startsWith('野鹤曰：') || pTrim.startsWith('野鹤曰:')) {
                    return (
                      <div key={idx} className="my-5 p-5 rounded-2xl bg-amber-50/80 border-l-4 border-[#C0392B] text-stone-900 not-italic font-sans text-sm shadow-xs">
                        <div className="text-xs font-bold text-[#C0392B] mb-1.5 flex items-center gap-1.5">
                          <Flame className="w-4 h-4" /> 野鹤秘传辨谬按语
                        </div>
                        <p className="leading-relaxed text-stone-800">{renderHighlightedText(pTrim)}</p>
                      </div>
                    );
                  }

                  // 3. 李文辉评语识别
                  if (pTrim.startsWith('李文辉曰：') || pTrim.startsWith('李文辉曰:')) {
                    return (
                      <div key={idx} className="my-5 p-5 rounded-2xl bg-stone-100 border-l-4 border-stone-500 text-stone-800 font-sans text-sm shadow-xs">
                        <div className="text-xs font-bold text-stone-700 mb-1.5 flex items-center gap-1.5">
                          <Scroll className="w-4 h-4 text-stone-600" /> 李文辉定本评注
                        </div>
                        <p className="leading-relaxed">{renderHighlightedText(pTrim)}</p>
                      </div>
                    );
                  }

                  // 4. 常规古籍正文段落
                  return (
                    <p key={idx} className="leading-loose text-justify indent-8 text-stone-800">
                      {renderHighlightedText(pTrim)}
                    </p>
                  );
                })
              ) : (
                <p className="text-stone-500 italic">本章正文详见各篇分卷目录。</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
