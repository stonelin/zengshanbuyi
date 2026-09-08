import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import knowledgeTreeData from '../../data/knowledge_tree.json';
import quizzesData from '../../data/quizzes.json';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  BookOpen, 
  RotateCcw, 
  ChevronRight, 
  HelpCircle,
  Trophy,
  Flame,
  Bookmark,
  Filter
} from 'lucide-react';

export default function KnowledgeMastery({ 
  onSelectChapter, 
  onSelectCase, 
  onSelectConcept, 
  isNoviceMode 
}) {
  const [activeStageId, setActiveStageId] = useState('stage_0');
  const [quizCategoryFilter, setQuizCategoryFilter] = useState('ALL');
  const [isMistakeMode, setIsMistakeMode] = useState(false);

  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userScore, setUserScore] = useState(0);
  const [mistakeList, setMistakeList] = useState([]);
  const [completedStages, setCompletedStages] = useState(['stage_0']);

  // 分类列表
  const quizCategories = useMemo(() => {
    const cats = new Set(quizzesData.map(q => q.category || '综合'));
    return ['ALL', ...Array.from(cats)];
  }, []);

  // 当前生效的题目池
  const activeQuizPool = useMemo(() => {
    if (isMistakeMode) {
      return mistakeList.length > 0 ? mistakeList : quizzesData;
    }
    if (quizCategoryFilter === 'ALL') {
      return quizzesData;
    }
    return quizzesData.filter(q => q.category === quizCategoryFilter);
  }, [isMistakeMode, mistakeList, quizCategoryFilter]);

  const currentStage = knowledgeTreeData.find(s => s.id === activeStageId) || knowledgeTreeData[0];
  const safeIndex = activeQuizPool.length > 0 ? (currentQuizIndex % activeQuizPool.length) : 0;
  const currentQuiz = activeQuizPool[safeIndex] || quizzesData[0];

  // 提交作答
  const handleSelectOption = (index) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQuiz) return;
    setIsAnswerSubmitted(true);

    const isCorrect = selectedOption === currentQuiz.correct_index;
    if (isCorrect) {
      setUserScore(prev => prev + 20);
      // 触发轻量金色烟花微动效
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#C0392B', '#D4AF37', '#2E7D32']
      });

      // 如果在错题模式中答对了，从错题列表中移除
      if (isMistakeMode) {
        setMistakeList(prev => prev.filter(item => item.id !== currentQuiz.id));
      }
    } else {
      if (!mistakeList.some(item => item.id === currentQuiz.id)) {
        setMistakeList(prev => [...prev, currentQuiz]);
      }
    }
  };

  // 下一道题
  const handleNextQuiz = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCurrentQuizIndex(prev => prev + 1);
  };

  // 重新开始当前阶段
  const handleRestart = () => {
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setCurrentQuizIndex(0);
    setUserScore(0);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 顶部能力画像与总览 */}
      <div className="bg-white border border-[#EAE6DC] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 text-[#C0392B] rounded-2xl border border-amber-200/60 shadow-2xs">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-serif-sc text-[#1F2421]">五阶认知进阶树与考核</h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#C0392B]/10 text-[#C0392B]">
                积分: {userScore}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              布鲁姆认知阶梯 · 即时双向归因复盘 · 间隔遗忘复习调度
            </p>
          </div>
        </div>

        {/* 错题本模式切换按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (mistakeList.length > 0) {
                setIsMistakeMode(!isMistakeMode);
                setCurrentQuizIndex(0);
                setSelectedOption(null);
                setIsAnswerSubmitted(false);
              }
            }}
            disabled={mistakeList.length === 0}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isMistakeMode
                ? 'bg-red-50 text-[#C0392B] border-red-300 shadow-2xs ring-2 ring-red-400/20'
                : mistakeList.length > 0
                  ? 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200 cursor-pointer'
                  : 'bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>{isMistakeMode ? '退出错题模式' : `错题强化本 (${mistakeList.length})`}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 左侧：水墨进阶树导航 (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#EAE6DC] rounded-2xl p-4 shadow-sm space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 px-2 py-1">
            🏔️ 易学修养五阶进阶路径
          </h3>

          <div className="space-y-1.5">
            {knowledgeTreeData.map((stage, idx) => {
              const isActive = stage.id === activeStageId && !isMistakeMode;
              const isCompleted = completedStages.includes(stage.id);

              return (
                <button
                  key={stage.id}
                  onClick={() => {
                    setIsMistakeMode(false);
                    setActiveStageId(stage.id);
                    setCurrentQuizIndex(idx * 3);
                    setSelectedOption(null);
                    setIsAnswerSubmitted(false);
                  }}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-amber-50/80 border-amber-300 shadow-xs ring-1 ring-amber-400/40'
                      : 'bg-stone-50/50 border-stone-200/60 hover:bg-stone-100/60'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 text-stone-600'
                  }`}>
                    {idx}
                  </div>

                  <div className="flex-1 truncate">
                    <div className={`text-xs font-bold truncate ${isActive ? 'text-[#C0392B]' : 'text-stone-900'}`}>
                      {stage.title}
                    </div>
                    <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 阶段技能画像卡 */}
          <div className="mt-4 p-4 rounded-xl bg-[#FBF9F5] border border-[#EAE6DC]">
            <div className="text-xs font-bold text-stone-700 mb-2">🎯 当前阶段核心技能画像</div>
            <div className="flex flex-wrap gap-1.5">
              {currentStage.key_skills.map((skill, i) => (
                <span key={i} className="px-2 py-0.5 text-[11px] rounded bg-stone-200 text-stone-800 font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* 右侧：通关测验答题工作台 (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-[#EAE6DC] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* 测验进度与分类过滤 */}
          <div className="border-b border-stone-200 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400 block font-medium">
                  {isMistakeMode ? '🚩 错题巩固模式' : `${currentStage.title} · 关卡测试`}
                </span>
                <h3 className="text-lg sm:text-xl font-bold font-serif-sc text-[#1F2421] mt-0.5">
                  {currentQuiz.title || '理法与卦象诊断题'}
                </h3>
              </div>

              <span className="text-xs font-mono px-3 py-1 bg-stone-100 rounded-full text-stone-700 font-bold">
                第 {safeIndex + 1} / {activeQuizPool.length} 题
              </span>
            </div>

            {/* 题目专题分类切换 */}
            {!isMistakeMode && (
              <div className="flex flex-wrap gap-1 pt-1">
                {quizCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => {
                      setQuizCategoryFilter(cat);
                      setCurrentQuizIndex(0);
                      setSelectedOption(null);
                      setIsAnswerSubmitted(false);
                    }}
                    className={`px-2.5 py-1 text-[11px] rounded-lg transition-all ${
                      quizCategoryFilter === cat
                        ? 'bg-stone-900 text-white font-bold'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                    }`}
                  >
                    {cat === 'ALL' ? '全部专题' : cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 题目题干 */}
          <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#EAE6DC]">
            <div className="text-xs font-bold text-[#C0392B] mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 题目背景与诊断
            </div>
            <p className="text-sm sm:text-base font-medium text-stone-900 leading-relaxed">
              {currentQuiz.question}
            </p>
          </div>

          {/* 选项列表 */}
          <div className="space-y-3">
            {currentQuiz.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = isAnswerSubmitted && idx === currentQuiz.correct_index;
              const isWrong = isAnswerSubmitted && isSelected && idx !== currentQuiz.correct_index;

              let style = 'bg-stone-50 hover:bg-stone-100 text-stone-800 border-stone-200/80';
              if (isSelected && !isAnswerSubmitted) {
                style = 'bg-amber-50 border-[#C0392B] text-stone-900 font-bold ring-2 ring-[#C0392B]/20';
              } else if (isCorrect) {
                style = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-500/20';
              } else if (isWrong) {
                style = 'bg-red-50 border-red-300 text-red-950 line-through';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswerSubmitted}
                  className={`w-full flex items-center justify-between p-4 rounded-xl text-left border transition-all text-xs sm:text-sm cursor-pointer ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-white border border-stone-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
                  {isWrong && <XCircle className="w-5 h-5 text-red-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* 操作按钮 */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleRestart}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors text-xs flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> 重新开始
            </button>

            {!isAnswerSubmitted ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedOption === null}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md cursor-pointer ${
                  selectedOption === null
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-[#C0392B] hover:bg-[#A93226] text-white active:scale-95'
                }`}
              >
                确认提交答案
              </button>
            ) : (
              <button
                onClick={handleNextQuiz}
                className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>下一道题</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 答题后三段式深度错因与歌诀解析 (Answer Explanation) */}
          {isAnswerSubmitted && (
            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <Flame className="w-4 h-4 text-[#C0392B]" /> 考点精义与三段式闭环解析
              </div>

              {/* 核心歌诀/法则 */}
              {currentQuiz.rule && (
                <div className="p-3 rounded-xl bg-white border border-amber-200/60 font-serif-sc text-xs text-stone-800 italic">
                  “{currentQuiz.rule}”
                </div>
              )}

              <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
                {currentQuiz.explanation}
              </p>

              {/* 直达原著章节与案例 */}
              <div className="pt-2 border-t border-amber-200/40 flex flex-wrap gap-2">
                <button
                  onClick={() => onSelectConcept('旬空')}
                  className="text-xs text-[#C0392B] hover:underline font-medium cursor-pointer"
                >
                  📖 查阅相关易理法则穿透 →
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
