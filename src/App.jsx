import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import CommandPalette from './components/common/CommandPalette';
import ConceptModal from './components/common/ConceptModal';
import PaipanWorkbench from './features/paipan/PaipanWorkbench';
import ClassicReader from './features/reader/ClassicReader';
import { getConceptByIdOrName } from './lib/conceptService';

export default function App() {
  const [activeTab, setActiveTab] = useState('paipan');
  const [selectedChapterId, setSelectedChapterId] = useState('ch_001');
  const [activeConcept, setActiveConcept] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 全局快捷键 ⌘K / Ctrl+K 监听
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 跨模块导航处理器
  const handleSelectChapter = (chapterId) => {
    setSelectedChapterId(chapterId);
    setActiveTab('reader');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectConcept = (conceptKey) => {
    const cp = getConceptByIdOrName(conceptKey);
    if (cp) {
      setActiveConcept(cp);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1F2421] flex flex-col selection:bg-[#C0392B]/20 selection:text-[#C0392B]">
      
      {/* 全局顶栏 */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* 核心功能主视口 */}
      <main className="flex-1">
        {activeTab === 'paipan' && (
          <PaipanWorkbench
            onSelectConcept={handleSelectConcept}
          />
        )}

        {activeTab === 'reader' && (
          <ClassicReader
            selectedChapterId={selectedChapterId}
            onSelectChapter={handleSelectChapter}
            onSelectConcept={handleSelectConcept}
          />
        )}
      </main>

      {/* 全局底部 Footer */}
      <footer className="border-t border-[#EAE6DC] bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-stone-500 space-y-2">
          <div className="flex items-center justify-center gap-2 font-serif-sc font-bold text-stone-800 text-sm">
            <span>增删卜易 · 数字化研习系统</span>
            <span className="text-[#C0392B]">•</span>
            <span>野鹤宗风传习</span>
          </div>
          <p>
            自用研习工具 · 排盘推演 · 典籍精读
          </p>
          <div className="text-[11px] text-stone-400">
            Based on 《增删卜易》李文辉序定本 · 全书结构化数据库驱动
          </div>
        </div>
      </footer>

      {/* 术语概念穿透模态框 */}
      <ConceptModal
        concept={activeConcept}
        onClose={() => setActiveConcept(null)}
        onSelectChapter={handleSelectChapter}
      />

      {/* 全局 Command Palette 搜索框 (⌘K) */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectChapter={handleSelectChapter}
        onSelectConcept={handleSelectConcept}
        onSwitchTab={setActiveTab}
      />

    </div>
  );
}
