import React from 'react';
import { Compass, BookOpen, NotebookPen, Search, Library, BookMarked } from 'lucide-react';
import { getAllCases } from '../../lib/caseService';

const CASE_COUNT = getAllCases().length;

export default function Header({
  activeTab,
  setActiveTab,
  onOpenSearch
}) {
  const navTabs = [
    { id: 'paipan', label: '智能排盘', icon: Compass },
    { id: 'records', label: '卦例记录', icon: NotebookPen },
    { id: 'cases', label: '实例库', icon: BookMarked },
    { id: 'reader', label: '典籍精读', icon: BookOpen },
    { id: 'terms', label: '术语总览', icon: Library }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#FBF9F5]/95 backdrop-blur-sm border-b border-[#EAE6DC] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 flex-nowrap gap-2">
          
          {/* Logo & Brand (No Wrap) */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0" 
            onClick={() => setActiveTab('paipan')}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#1F2421] text-[#FBF9F5] flex items-center justify-center shadow-sm border border-stone-800 shrink-0">
              <span className="font-serif-sc text-lg sm:text-xl font-bold text-[#C0392B]">易</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h1 className="text-base sm:text-lg font-bold font-serif-sc tracking-wide text-[#1F2421] whitespace-nowrap">
                  增删卜易
                </h1>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#C0392B]/10 text-[#C0392B] border border-[#C0392B]/20 whitespace-nowrap hidden sm:inline-block">
                  数字研习
                </span>
              </div>
              <p className="text-[10px] text-stone-500 hidden md:block whitespace-nowrap">
                野鹤宗风 · {CASE_COUNT} 例古籍卦例动态推演
              </p>
            </div>
          </div>

          {/* Desktop Navigation Tabs (Sleek & Single-line) */}
          <nav className="hidden md:flex items-center gap-1 bg-stone-200/60 p-1 rounded-xl border border-stone-300/40 shrink-0">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#1F2421] shadow-xs font-bold border border-stone-200/60'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#C0392B]' : 'text-stone-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls (No Wrap) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Quick Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs text-stone-600 bg-white hover:bg-stone-50 border border-[#EAE6DC] rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap"
              title="全局搜索 (Ctrl+K)"
            >
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline text-stone-500">搜索</span>
              <kbd className="hidden lg:inline-block px-1 py-0.2 text-[10px] font-mono bg-stone-100 border border-stone-200 rounded text-stone-400">
                ⌘K
              </kbd>
            </button>

          </div>

        </div>

        {/* Mobile Tab Bar */}
        <div className="md:hidden flex items-center justify-around py-1.5 border-t border-stone-200/60 overflow-x-auto">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-[11px] font-medium transition-all ${
                  isActive ? 'text-[#C0392B] font-bold' : 'text-stone-500'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
