import React, { useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronUp, X, BookMarked } from 'lucide-react';
import { getAllCases, getCaseFacets, filterCases } from '../../lib/caseService';
import CaseDetailModal from './CaseDetailModal';

const EMPTY_FILTERS = {
  chapterTitle: [],
  eventType: [],
  verified: [],
  yongShen: [],
  yongShenStatus: [],
  movingCount: [],
  patterns: []
};

// 四组标签筛选，对应 schema.js caseTagsSchema 的 A/B/C/D 分组：出处与要点 / 事类 / 取用 / 盘面。
const FACET_GROUPS = [
  { title: 'A. 出处', fields: [{ key: 'chapterTitle', label: '章节' }] },
  { title: 'B. 事类', fields: [{ key: 'eventType', label: '占问事类' }, { key: 'verified', label: '应验' }] },
  { title: 'C. 取用', fields: [{ key: 'yongShen', label: '用神六亲' }, { key: 'yongShenStatus', label: '用神状态' }] },
  { title: 'D. 盘面', fields: [{ key: 'movingCount', label: '动爻情况' }, { key: 'patterns', label: '格局' }] }
];

function FacetChips({ options, selected, onToggle }) {
  if (!options.length) return <span className="text-xs text-stone-300">暂无数据</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(({ value, count }) => {
        const isActive = selected.includes(value);
        return (
          <button
            key={value}
            onClick={() => onToggle(value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#C0392B] text-white border-[#C0392B]'
                : 'bg-white text-stone-600 border-stone-200 hover:border-[#C0392B]/40 hover:text-[#C0392B]'
            }`}
          >
            {value} <span className={isActive ? 'text-white/70' : 'text-stone-400'}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function CaseLibrary({ onSelectTerm, onSelectChapter }) {
  const totalCount = useMemo(() => getAllCases().length, []);
  const facets = useMemo(() => getCaseFacets(), []);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [query, setQuery] = useState('');
  const [activeCaseId, setActiveCaseId] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const results = useMemo(() => filterCases(filters, query), [filters, query]);
  const activeCase = useMemo(() => results.find(c => c.id === activeCaseId) || null, [results, activeCaseId]);

  const activeFilterCount = Object.values(filters).reduce((sum, arr) => sum + arr.length, 0);

  const toggleFacetValue = (key, value) => {
    setFilters(prev => {
      const current = prev[key];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [key]: next };
    });
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div>
        <h3 className="text-lg font-bold font-serif-sc text-stone-900 flex items-center gap-2">
          <BookMarked className="w-5 h-5 text-[#C0392B]" /> 实例库
        </h3>
        <p className="text-xs text-stone-500 mt-1">
          共 {totalCount} 条已校对实例（全书 323 条主案例已全部录入，另含书中散见的补充案例），当前筛选命中 {results.length} 条——按出处、事类、取用、盘面四组标签筛选，点开看原文与盘面。
        </p>
      </div>

      {/* 搜索框 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#EAE6DC] rounded-xl">
        <Search className="w-4 h-4 text-stone-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索标题、占问、小结、要点…"
          className="w-full text-sm bg-transparent focus:outline-none"
        />
        {query && (
          <button onClick={() => setQuery('')} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* 筛选面板 */}
      <div className="bg-white border border-[#EAE6DC] rounded-2xl overflow-hidden">
        <button
          onClick={() => setIsFilterOpen(prev => !prev)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          <span className="text-sm font-bold font-serif-sc text-stone-900">标签筛选</span>
          <span className="flex items-center gap-2 text-xs text-stone-400">
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#C0392B]/10 text-[#C0392B] font-semibold">
                已选 {activeFilterCount}
              </span>
            )}
            {isFilterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>
        {isFilterOpen && (
          <div className="px-4 pb-4 space-y-4">
            {FACET_GROUPS.map(group => (
              <div key={group.title} className="space-y-2">
                <div className="text-xs font-semibold text-stone-500">{group.title}</div>
                {group.fields.map(field => (
                  <div key={field.key} className="pl-1">
                    <div className="text-[11px] text-stone-400 mb-1">{field.label}</div>
                    <FacetChips
                      options={facets[field.key]}
                      selected={filters[field.key]}
                      onToggle={(v) => toggleFacetValue(field.key, v)}
                    />
                  </div>
                ))}
              </div>
            ))}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-xs text-stone-500 hover:text-[#C0392B] underline cursor-pointer"
              >
                清空全部筛选
              </button>
            )}
          </div>
        )}
      </div>

      {/* 结果卡片网格 */}
      {results.length === 0 ? (
        <div className="py-16 text-center text-stone-400 text-sm">未找到匹配的实例，换个筛选条件试试。</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {results.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCaseId(c.id)}
              className="text-left p-4 rounded-2xl bg-white border border-[#EAE6DC] hover:border-[#C0392B]/40 hover:shadow-sm transition-all cursor-pointer flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-bold text-stone-900 leading-snug line-clamp-2">{c.title}</h4>
                {c.tags?.verified && (
                  <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${c.tags.verified === '应验' ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-600'}`}>
                    {c.tags.verified}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1 text-[10px]">
                {c.tags?.eventType && (
                  <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">{c.tags.eventType}</span>
                )}
                {c.tags?.guaName && (
                  <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 truncate max-w-[140px]">{c.tags.guaName}</span>
                )}
              </div>
              <p className="text-xs text-stone-500 line-clamp-2">{c.summary}</p>
              {c.tags?.patterns?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-auto pt-1">
                  {c.tags.patterns.slice(0, 3).map((p, idx) => (
                    <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200/60">
                      {p}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <CaseDetailModal
        caseItem={activeCase}
        onClose={() => setActiveCaseId(null)}
        onSelectTerm={onSelectTerm}
        onSelectChapter={onSelectChapter}
      />
    </div>
  );
}
