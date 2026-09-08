import React, { useState, useMemo } from 'react';
import casesData from '../../data/cases.json';
import { resolveCaseBoard } from '../../lib/paipanEngine';
import { getWuxingStyle } from '../../lib/wuxingHelper';
import YaoLine from '../../components/common/YaoLine';
import { 
  Search, 
  Sparkles, 
  HelpCircle, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Award, 
  ExternalLink,
  RotateCcw,
  BookOpen,
  Scroll,
  Compass,
  Check
} from 'lucide-react';

export default function CaseDeductionHub({ 
  selectedCaseId, 
  onSelectCase, 
  onSelectChapter, 
  onSelectConcept, 
  isNoviceMode 
}) {
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpressMode, setIsExpressMode] = useState(false);

  // 盲推答题状态
  const [selectedYongShen, setSelectedYongShen] = useState('');
  const [monthDayStatus, setMonthDayStatus] = useState('');
  const [movingStatus, setMovingStatus] = useState('');
  const [predictedOutcome, setPredictedOutcome] = useState('');
  const [showClue, setShowClue] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [userScore, setUserScore] = useState(0);

  // 当前选中的案例对象
  const currentCase = useMemo(() => {
    if (selectedCaseId) {
      return casesData.find(c => c.id === selectedCaseId) || casesData[0];
    }
    return casesData[0];
  }, [selectedCaseId]);

  // 解析当前案例的专业排盘看板数据
  const caseBoardData = useMemo(() => {
    return resolveCaseBoard(currentCase);
  }, [currentCase]);

  // 分类列表
  const categories = useMemo(() => {
    const cats = new Set(casesData.map(c => c.category || '综合实战'));
    return ['ALL', ...Array.from(cats)];
  }, []);

  // 筛选案例列表
  const filteredCases = useMemo(() => {
    return casesData.filter(c => {
      const matchCat = categoryFilter === 'ALL' || c.category === categoryFilter;
      const matchSearch = !searchQuery.trim() || 
        (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.question && c.question.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.gua_name && c.gua_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.chapter_title && c.chapter_title.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [categoryFilter, searchQuery]);

  // 当切换案例时重置作答状态
  const handleCaseChange = (id) => {
    onSelectCase(id);
    setSelectedYongShen('');
    setMonthDayStatus('');
    setMovingStatus('');
    setPredictedOutcome('');
    setShowClue(false);
    setIsRevealed(false);
    setUserScore(0);
  };

  // 提交盲推推断并计算得分
  const handleSubmitDeduction = () => {
    let score = 0;
    if (selectedYongShen) score += 25;
    if (monthDayStatus) score += 25;
    if (movingStatus) score += 25;
    if (predictedOutcome) score += 25;

    setUserScore(score);
    setIsRevealed(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* 左侧：案例分类与检索列表 (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-[#EAE6DC] rounded-2xl p-4 shadow-sm space-y-4 max-h-[85vh] flex flex-col">
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold font-serif-sc text-[#1F2421] flex items-center gap-2">
                <Search className="w-4 h-4 text-[#C0392B]" /> 实战卦例馆
              </h3>
              <span className="text-xs text-stone-400 font-mono">共 {casesData.length} 案</span>
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索卦例事由 (如: 官运, 财运, 疾病, 辰月)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C0392B]"
              />
            </div>
          </div>

          {/* 分类切换 */}
          <div className="flex flex-wrap gap-1 border-b border-stone-100 pb-2">
            {categories.slice(0, 7).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2 py-1 text-[11px] rounded-lg transition-all cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#1F2421] text-white font-bold'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {cat === 'ALL' ? '全部' : cat}
              </button>
            ))}
          </div>

          {/* 案例列表 */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredCases.map((c) => {
              const isSelected = currentCase.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => handleCaseChange(c.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/80 text-[#1F2421] border border-amber-300 shadow-xs font-bold'
                      : 'hover:bg-stone-50 text-stone-700 border border-transparent'
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="text-xs truncate font-medium">
                      {c.title || c.gua_name}
                    </div>
                    <div className="text-[10px] text-stone-400 font-normal mt-0.5 truncate">
                      {c.month} {c.day} · {c.question || c.chapter_title}
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 shrink-0 font-medium">
                    {c.category || '实战'}
                  </span>
                </button>
              );
            })}
          </div>

        </div>

        {/* 右侧：盲推探案工作台 (8 cols - 媲美排盘看板的专业设计) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* 1. 案例排盘主看板 (采用与智能排盘完全一致的东方雅致美学) */}
          <div className="bg-white border border-[#EAE6DC] rounded-2xl shadow-sm overflow-hidden flex flex-col">
            
            {/* 看板天时与卦名头部 */}
            <div className="p-5 bg-[#FBF9F5] border-b border-[#EAE6DC]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-stone-500 font-medium mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold">
                      {currentCase.category || '经典卦例'}
                    </span>
                    <span>•</span>
                    <span className="text-stone-600">{currentCase.volume || '增删卜易'}</span>
                    <span>•</span>
                    <button
                      onClick={() => onSelectChapter(currentCase.chapter_id)}
                      className="text-[#C0392B] hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <BookOpen className="w-3 h-3" /> {currentCase.chapter_title}
                    </button>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold font-serif-sc text-[#1F2421] flex items-center gap-2 mt-1">
                    <span>{caseBoardData?.benGua?.full_name || currentCase.gua_name}</span>
                    {caseBoardData?.benGua && (
                      <span className="text-xs px-2 py-0.5 rounded-md bg-stone-200 text-stone-700 font-sans font-normal">
                        {caseBoardData.benGua.palace} · {caseBoardData.benGua.generation}
                      </span>
                    )}
                    {caseBoardData?.bianGua && (
                      <>
                        <span className="text-stone-400 text-sm">之</span>
                        <span className="text-[#C0392B]">{caseBoardData.bianGua.full_name}</span>
                      </>
                    )}
                  </h3>

                  <div className="p-2.5 mt-2 rounded-xl bg-white border border-stone-200 text-xs sm:text-sm text-stone-800 shadow-2xs">
                    <span className="font-bold text-stone-900 mr-1.5">【求占事由】：</span>
                    <span>{currentCase.question || currentCase.title}</span>
                  </div>
                </div>

                {/* 天时徽章与极速模式切换 */}
                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <span className="px-2 py-1 rounded-lg bg-white border border-stone-200 font-medium shadow-2xs">
                      📅 月建: <strong className="text-stone-900">{caseBoardData?.dateGanzhi.month}</strong> 
                      <span className="text-red-600 ml-1">(破:{caseBoardData?.dateGanzhi.monthBroken})</span>
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-white border border-stone-200 font-medium shadow-2xs">
                      ☀️ 日辰: <strong className="text-stone-900">{caseBoardData?.dateGanzhi.day}</strong>
                      <span className="text-amber-700 ml-1">(空:{caseBoardData?.dateGanzhi.xunKong.join('')})</span>
                    </span>
                  </div>

                  <button
                    onClick={() => setIsExpressMode(!isExpressMode)}
                    className="self-start sm:self-auto px-3 py-1 text-[11px] font-semibold border border-stone-300 rounded-lg bg-white hover:bg-stone-50 text-stone-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    {isExpressMode ? '切换为探案盲推模式' : '极速翻转模式'}
                  </button>
                </div>
              </div>
            </div>

            {/* 六爻装配列表 (媲美排盘看板的专业对齐表格) */}
            <div className="p-4 flex flex-col justify-around gap-2 bg-white">
              {caseBoardData?.yaos ? (
                [...caseBoardData.yaos].reverse().map((yao) => {
                  const wuxingStyle = getWuxingStyle(yao.element);

                  return (
                    <div
                      key={yao.index}
                      className={`grid grid-cols-12 items-center p-2.5 sm:p-3 rounded-xl transition-all border ${
                        yao.isMoving
                          ? 'bg-red-50/40 border-red-200/80 shadow-2xs'
                          : 'bg-stone-50/60 border-stone-200/60'
                      }`}
                    >
                      {/* 六神 (2 cols) */}
                      <div className="col-span-2 text-xs font-semibold text-stone-600">
                        {yao.liuShen}
                      </div>

                      {/* 伏神 (2 cols) */}
                      <div className="col-span-2 text-[11px] text-stone-400 font-medium truncate">
                        {yao.hiddenSpirit ? (
                          <span title="伏神" className="px-1 py-0.5 rounded bg-stone-100 text-stone-600">
                            [伏] {yao.hiddenSpirit.relative}{yao.hiddenSpirit.stem_branch}
                          </span>
                        ) : ''}
                      </div>

                      {/* 本卦爻象与干支六亲 (5 cols) */}
                      <div className="col-span-5 flex items-center gap-2">
                        <YaoLine yinYang={yao.yinYang} isMoving={yao.isMoving} size="md" />
                        
                        <span className={`text-xs sm:text-sm font-medium ${yao.isMoving ? 'font-bold text-[#C0392B]' : 'text-stone-900'}`}>
                          {yao.relative}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded border font-mono font-semibold ${wuxingStyle.badge}`}>
                          {yao.ganzhi}
                        </span>

                        {yao.isShi && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#C0392B] text-white">
                            世
                          </span>
                        )}
                        {yao.isYing && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-600 text-white">
                            应
                          </span>
                        )}
                      </div>

                      {/* 变卦变爻 (3 cols) */}
                      <div className="col-span-3 flex items-center gap-1.5 text-xs text-stone-600 justify-end">
                        {yao.bianYao ? (
                          <>
                            <span className="text-[#C0392B] font-bold">➯</span>
                            <YaoLine yinYang={yao.bianYao.yinYang} size="sm" compact />
                            <span className="font-medium text-stone-800">{yao.bianYao.relative}{yao.bianYao.branch}</span>
                            {yao.bianYao.dynamicTrend && (
                              <span className="text-[10px] px-1 py-0.5 rounded bg-red-100 text-[#C0392B] font-bold">
                                {yao.bianYao.dynamicTrend}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-stone-300">--</span>
                        )}
                      </div>

                    </div>
                  );
                })
              ) : null}
            </div>

          </div>

          {/* 2. 探案脚手架推导工作流 (未揭秘时) */}
          {!isRevealed && !isExpressMode && (
            <div className="bg-white border border-[#EAE6DC] rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <h3 className="text-base font-bold font-serif-sc text-stone-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C0392B]" /> 侦探思考脚手架 (Step-by-Step)
                </h3>
                <button
                  onClick={() => setShowClue(!showClue)}
                  className="text-xs text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{showClue ? '收起线索' : '💡 查看侦探线索提示'}</span>
                </button>
              </div>

              {/* 线索提示抽屉 */}
              {showClue && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 leading-relaxed animate-in fade-in">
                  💡 <strong>野鹤线索</strong>：观察求占事由以何六亲为用神？再辨析月建生克与日辰冲合；重点观察发动之爻是生助用神还是克害用神？动变有无化进化退？
                </div>
              )}

              {/* 第 1 步：定用神 */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5 shadow-2xs">
                <span className="text-xs font-bold text-stone-700">1. 🎯 本案用神应取何六亲？</span>
                <div className="flex flex-wrap gap-2">
                  {['父母', '官鬼', '兄弟', '妻财', '子孙', '世爻'].map(yk => (
                    <button
                      key={yk}
                      onClick={() => setSelectedYongShen(yk)}
                      className={`px-3.5 py-1.5 text-xs rounded-xl transition-all font-medium cursor-pointer ${
                        selectedYongShen === yk
                          ? 'bg-[#C0392B] text-white font-bold shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {yk}
                    </button>
                  ))}
                </div>
              </div>

              {/* 第 2 步：看日月 */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5 shadow-2xs">
                <span className="text-xs font-bold text-stone-700">2. 📅 用神在日月天时下的旺衰状态？</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    '临月建/得月生大旺',
                    '休囚无气',
                    '逢月破大伤',
                    '得日生扶比和',
                    '逢旬空出空有用'
                  ].map(status => (
                    <button
                      key={status}
                      onClick={() => setMonthDayStatus(status)}
                      className={`px-3.5 py-1.5 text-xs rounded-xl transition-all font-medium cursor-pointer ${
                        monthDayStatus === status
                          ? 'bg-[#C0392B] text-white font-bold shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* 第 3 步：察动变 */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5 shadow-2xs">
                <span className="text-xs font-bold text-stone-700">3. ⚡ 动爻产生了何种关键影响？</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    '动化进神 (气势倍增)',
                    '动化退神 (渐衰)',
                    '动爻生助用神',
                    '动爻克伤用神',
                    '独发 / 独静为关键',
                    '安静无动爻'
                  ].map(trend => (
                    <button
                      key={trend}
                      onClick={() => setMovingStatus(trend)}
                      className={`px-3.5 py-1.5 text-xs rounded-xl transition-all font-medium cursor-pointer ${
                        movingStatus === trend
                          ? 'bg-[#C0392B] text-white font-bold shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {trend}
                    </button>
                  ))}
                </div>
              </div>

              {/* 第 4 步：定吉凶 */}
              <div className="p-4 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5 shadow-2xs">
                <span className="text-xs font-bold text-stone-700">4. ⚖️ 你的最终吉凶定断是？</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    '必成 / 升迁 / 得财 / 痊愈 (大吉)',
                    '先阻后成 / 出空应验 (中吉)',
                    '事不成 / 破败 / 忧患难免 (凶)',
                    '终归徒劳 / 虚名虚利 (平)'
                  ].map(out => (
                    <button
                      key={out}
                      onClick={() => setPredictedOutcome(out)}
                      className={`px-3.5 py-1.5 text-xs rounded-xl transition-all font-medium cursor-pointer ${
                        predictedOutcome === out
                          ? 'bg-[#C0392B] text-white font-bold shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {out}
                    </button>
                  ))}
                </div>
              </div>

              {/* 提交推断按钮 */}
              <button
                onClick={handleSubmitDeduction}
                className="w-full py-3.5 rounded-xl bg-[#C0392B] hover:bg-[#A93226] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Award className="w-4 h-4" />
                <span>🚀 提交我的推断 · 揭晓野鹤老人原著断语与应验</span>
              </button>
            </div>
          )}

          {/* 极速模式翻转卡片 */}
          {isExpressMode && !isRevealed && (
            <button
              onClick={() => setIsRevealed(true)}
              className="w-full py-4 rounded-2xl bg-[#1F2421] hover:bg-stone-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>翻转卡片：查看野鹤老人断语与应验结果</span>
            </button>
          )}

          {/* 3. 揭秘阶段：展示野鹤断语、后验与得分复盘 */}
          {isRevealed && (
            <div className="bg-white border border-[#EAE6DC] rounded-2xl p-6 shadow-sm space-y-5 animate-in fade-in duration-300">
              
              {/* 评测得分卡 */}
              {!isExpressMode && (
                <div className="p-5 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-white rounded-xl text-[#C0392B] shadow-2xs border border-amber-200/60">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-amber-950">推演思维评测完成！</div>
                      <div className="text-xs text-amber-800 mt-0.5">
                        思维完整度得分：<strong className="text-base text-[#C0392B]">{userScore} / 100</strong>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsRevealed(false)}
                    className="flex items-center gap-1 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white px-3.5 py-2 rounded-xl border border-amber-200 shadow-2xs transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> 重新推演
                  </button>
                </div>
              )}

              {/* 野鹤老人断语 */}
              <div className="p-6 rounded-2xl bg-white border-2 border-[#C0392B]/20 shadow-xs space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#C0392B]">
                  <Flame className="w-4 h-4" /> 野鹤老人原著断语 (Master Verdict)
                </div>
                <p className="font-serif-sc text-stone-900 text-sm sm:text-base leading-loose">
                  {currentCase.verdict || currentCase.analysis || '野鹤断语详见原文。'}
                </p>
              </div>

              {/* 事后真实应验 (Actual Outcome) */}
              {currentCase.analysis && (
                <div className="p-6 rounded-2xl bg-[#FBF9F5] border border-[#EAE6DC] space-y-2 shadow-2xs">
                  <div className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                    <Scroll className="w-4 h-4 text-stone-500" /> 事后真实应验与断验析理
                  </div>
                  <p className="text-stone-700 text-sm leading-relaxed">
                    {currentCase.analysis}
                  </p>
                </div>
              )}

              {/* 核心法则标签与下一案操作 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-stone-400">本案相关法则:</span>
                  {(currentCase.category ? [currentCase.category, '用神旺衰', '动变生克'] : ['用神旺衰', '月破旬空', '动变生克']).map(tag => (
                    <button
                      key={tag}
                      onClick={() => onSelectConcept(tag)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors cursor-pointer"
                    >
                      {tag} →
                    </button>
                  ))}
                </div>

                {/* 下一案按钮 */}
                <button
                  onClick={() => {
                    const currentIndex = casesData.findIndex(c => c.id === currentCase.id);
                    const nextIndex = (currentIndex + 1) % casesData.length;
                    handleCaseChange(casesData[nextIndex].id);
                  }}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-stone-900 hover:bg-stone-800 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <span>研习下一案</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
