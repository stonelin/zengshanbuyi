import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';
import { getTermsGroupedByCategory } from '../../lib/termService';

export default function TermsOverview({ onSelectTerm }) {
  const groups = useMemo(() => getTermsGroupedByCategory(), []);
  const [openCategories, setOpenCategories] = useState(() => new Set(groups.map(g => g.category)));
  const [query, setQuery] = useState('');

  const toggleCategory = (category) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const q = query.trim().toLowerCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div>
        <h3 className="text-lg font-bold font-serif-sc text-stone-900">术语总览</h3>
        <p className="text-xs text-stone-500 mt-1">按分类折叠，随时查阅——不是学习主线，只是查字典。</p>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-white border border-[#EAE6DC] rounded-xl">
        <Search className="w-4 h-4 text-stone-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索术语名或别名…"
          className="w-full text-sm bg-transparent focus:outline-none"
        />
      </div>

      <div className="space-y-3">
        {groups.map(({ category, terms }) => {
          const filtered = q
            ? terms.filter(t => t.name.toLowerCase().includes(q) || (t.aliases || []).some(a => a.toLowerCase().includes(q)))
            : terms;
          if (q && filtered.length === 0) return null;
          const isOpen = openCategories.has(category);

          return (
            <div key={category} className="bg-white border border-[#EAE6DC] rounded-2xl overflow-hidden">
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <span className="text-sm font-bold font-serif-sc text-stone-900">{category}</span>
                <span className="flex items-center gap-2 text-xs text-stone-400">
                  {filtered.length} 条
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filtered.map(t => (
                    <button
                      key={t.id}
                      onClick={() => onSelectTerm(t.id)}
                      className="flex flex-col items-start p-3 rounded-xl bg-stone-50 hover:bg-amber-50/70 border border-stone-200/60 hover:border-amber-300 text-left transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-stone-900">{t.name}</span>
                        {t.aliases && t.aliases.length > 0 && (
                          <span className="text-[10px] text-stone-400">（{t.aliases.join('、')}）</span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2">{t.literalTranslation}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
