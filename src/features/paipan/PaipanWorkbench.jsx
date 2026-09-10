import React, { useState, useEffect } from 'react';
import {
  tossThreeCoins,
  assemblePaipanBoard,
  ALL_HEXAGRAMS,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  BRANCH_WUXING,
  findHexagramByName,
  getMonthBrokenBranch
} from '../../lib/paipanEngine';
import YaoLine from '../../components/common/YaoLine';
import PaipanCardLayout from '../../components/common/PaipanCardLayout';
import { 
  RotateCcw, 
  Sparkles, 
  Flame, 
  Zap, 
  Info, 
  Compass, 
  CheckCircle2, 
  HelpCircle,
  Eye,
  Sliders
} from 'lucide-react';

export default function PaipanWorkbench({ onSelectConcept }) {
  const [activeMode, setActiveMode] = useState('coins'); // 'coins' | 'manual'
  
  // 排盘参数配置
  const [question, setQuestion] = useState('占求财吉凶');
  const [monthBranch, setMonthBranch] = useState('卯');
  const [dayStem, setDayStem] = useState('戊');
  const [dayBranch, setDayBranch] = useState('辰');
  const [yongShenKey, setYongShenKey] = useState('妻财');

  // 铜钱摇卦状态
  const [coinSteps, setCoinSteps] = useState([]);
  const [isFlipping, setIsFlipping] = useState(false);
  const [lastTossResult, setLastTossResult] = useState(null);

  // 手动/指定卦象模式状态
  const [selectedHexName, setSelectedHexName] = useState('火地晋');
  const [manualMovingLines, setManualMovingLines] = useState([false, false, false, true, false, false]);

  // 选中的爻（用于生克显微镜）
  const [activeYaoIndex, setActiveYaoIndex] = useState(4);

  // 初始化一次默认排盘：直接由默认卦名装卦，保证下拉显示的卦与盘面一致
  useEffect(() => {
    if (coinSteps.length === 0) {
      const hex = findHexagramByName(selectedHexName);
      if (hex) {
        setCoinSteps(hex.lines.map((l, idx) => ({ yinYang: l.yin_yang, isMoving: manualMovingLines[idx] })));
      }
    }
  }, []);

  // 切到手动模式时若六爻不全（如刚重置过摇卦），按当前选中的卦名补齐
  useEffect(() => {
    if (activeMode !== 'manual' || coinSteps.length === 6) return;
    const hex = findHexagramByName(selectedHexName);
    if (hex) {
      setCoinSteps(hex.lines.map((l, idx) => ({ yinYang: l.yin_yang, isMoving: manualMovingLines[idx] })));
    }
  }, [activeMode]);

  // 执行一次摇铜钱
  const handleTossCoin = () => {
    if (isFlipping || coinSteps.length >= 6) return;
    setIsFlipping(true);
    
    setTimeout(() => {
      const toss = tossThreeCoins();
      setLastTossResult(toss);
      setCoinSteps(prev => [...prev, { yinYang: toss.yinYang, isMoving: toss.isMoving }]);
      setIsFlipping(false);
      setActiveYaoIndex(coinSteps.length + 1);
    }, 500);
  };

  // 重置摇卦
  const handleResetCoins = () => {
    setCoinSteps([]);
    setLastTossResult(null);
    setActiveYaoIndex(1);
  };

  // 快捷从 64 卦列表中选择
  const handleSelectPredefinedGua = (name) => {
    const hex = findHexagramByName(name);
    if (!hex) return;
    setSelectedHexName(name);
    const newSteps = hex.lines.map((l, idx) => ({
      yinYang: l.yin_yang,
      isMoving: manualMovingLines[idx]
    }));
    setCoinSteps(newSteps);
  };

  // 组装当前看板数据：六爻未装齐时不出盘（避免拿一个硬编码卦象冒充用户的卦）
  const isBoardReady = coinSteps.length === 6;
  const boardData = isBoardReady
    ? assemblePaipanBoard({ rawLines: coinSteps, monthBranch, dayStem, dayBranch, question, yongShenKey })
    : null;

  const activeYao = boardData ? (boardData.yaos.find(y => y.index === activeYaoIndex) || boardData.yaos[0]) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 顶部控制与模式切换 */}
      <div className="bg-white border border-[#EAE6DC] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* 起卦模式切换器 */}
        <div className="flex items-center gap-2 bg-stone-100 p-1.5 rounded-xl border border-stone-200/60">
          <button
            onClick={() => setActiveMode('coins')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeMode === 'coins'
                ? 'bg-white text-[#1F2421] shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            🪙 铜钱手摇起卦
          </button>
          <button
            onClick={() => setActiveMode('manual')}
            className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              activeMode === 'manual'
                ? 'bg-white text-[#1F2421] shadow-xs font-bold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            ⚡ 指定干支与卦象
          </button>
        </div>

        {/* 占问事由与用神设定 */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500 font-medium">事由:</span>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm border border-stone-200 rounded-lg bg-stone-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C0392B]"
              placeholder="输入占问事由..."
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-stone-500 font-medium">用神:</span>
            <select
              value={yongShenKey}
              onChange={(e) => setYongShenKey(e.target.value)}
              className="px-2.5 py-1.5 text-xs sm:text-sm border border-stone-200 rounded-lg bg-stone-50 font-medium text-stone-800 focus:outline-none"
            >
              <option value="妻财">妻财 (财运/商业/妻子)</option>
              <option value="官鬼">官鬼 (功名/事业/官职/丈夫/疾病鬼神)</option>
              <option value="父母">父母 (文书/学业/房产/尊长/雨水)</option>
              <option value="子孙">子孙 (子嗣/福神/医药/解忧/克官鬼)</option>
              <option value="兄弟">兄弟 (同辈/竞争/破财/劫财)</option>
            </select>
          </div>
        </div>

      </div>

      {/* 模式 A：古韵青铜钱 3D 拟物摇卦互动区 */}
      {activeMode === 'coins' && (
        <div className="bg-white border border-[#EAE6DC] rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* 3枚乾隆通宝铜钱拟物展示区 */}
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-4 sm:gap-6 py-4">
                {[0, 1, 2].map((idx) => {
                  const isBack = lastTossResult?.coins?.[idx] === 1;
                  return (
                    <div
                      key={idx}
                      className={`relative w-18 h-18 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                        isFlipping ? 'animate-coin-flip' : ''
                      } ${
                        isBack
                          ? 'bg-gradient-to-br from-[#F5D77F] via-[#D4A745] to-[#8C6226] ring-2 ring-amber-600/50 shadow-[0_8px_16px_rgba(180,130,40,0.3)]'
                          : 'bg-gradient-to-br from-[#E2DDD5] via-[#B8B0A2] to-[#736B5E] ring-2 ring-stone-500/50 shadow-[0_8px_16px_rgba(80,80,80,0.25)]'
                      }`}
                    >
                      {/* 外圈凸起边框 */}
                      <div className="absolute inset-1 rounded-full border border-black/20" />

                      {/* 中间内凹方孔 */}
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-[#FBF9F5] border-2 border-black/30 shadow-inner flex items-center justify-center" />

                      {/* 铜钱铭文（上下左右） */}
                      {isBack ? (
                        <div className="absolute inset-0 text-[10px] sm:text-xs font-serif-sc font-bold text-amber-950 flex flex-col justify-between items-center py-1 select-none pointer-events-none drop-shadow-xs">
                          <span>乾</span>
                          <div className="w-full flex justify-between px-1">
                            <span>宝</span>
                            <span>通</span>
                          </div>
                          <span>隆</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 text-[10px] sm:text-xs font-serif-sc font-bold text-stone-900 flex flex-col justify-between items-center py-1 select-none pointer-events-none drop-shadow-xs">
                          <span>通</span>
                          <div className="w-full flex justify-between px-2">
                            <span>字</span>
                            <span>背</span>
                          </div>
                          <span>宝</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 摇卦操作按钮 */}
              <div className="flex items-center gap-3 mt-3">
                <button
                  onClick={handleTossCoin}
                  disabled={isFlipping || coinSteps.length >= 6}
                  className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-md cursor-pointer ${
                    coinSteps.length >= 6
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-[#C0392B] hover:bg-[#A93226] text-white active:scale-95'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {coinSteps.length === 0 
                      ? '掷第 1 次 (初爻)' 
                      : coinSteps.length < 6 
                        ? `掷第 ${coinSteps.length + 1} 次 (${['初', '二', '三', '四', '五', '上'][coinSteps.length]}爻)` 
                        : '六爻排盘已就绪'}
                  </span>
                </button>

                <button
                  onClick={handleResetCoins}
                  className="p-2.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                  title="重置重新摇卦"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 装卦步进看板 */}
            <div className="flex-1 w-full bg-[#FBF9F5] border border-[#EAE6DC] rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
                <span className="text-xs font-bold text-stone-700">六爻装卦步进流 (初爻至上爻)</span>
                <span className="text-xs font-mono text-[#C0392B] font-bold">{coinSteps.length} / 6 爻</span>
              </div>

              {/* 6步状态指示 */}
              <div className="grid grid-cols-6 gap-2 text-center">
                {['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'].map((label, idx) => {
                  const step = coinSteps[idx];
                  return (
                    <div 
                      key={idx} 
                      className={`p-2 rounded-xl border text-xs transition-all flex flex-col items-center justify-center ${
                        step 
                          ? step.isMoving 
                            ? 'bg-red-50 border-red-300 text-[#C0392B] font-bold ring-1 ring-red-400/40 shadow-xs' 
                            : 'bg-white border-stone-300 text-stone-800 shadow-2xs'
                          : 'bg-stone-100 border-dashed border-stone-200 text-stone-400'
                      }`}
                    >
                      <div className="text-[10px] text-stone-400 mb-1">{label}</div>
                      
                      {/* 矢量爻象 */}
                      {step ? (
                        <div className="my-1">
                          <YaoLine yinYang={step.yinYang} isMoving={step.isMoving} size="sm" compact />
                        </div>
                      ) : (
                        <div className="h-4 flex items-center justify-center text-stone-300 font-mono">···</div>
                      )}

                      <div className="text-[10px] font-semibold mt-0.5">
                        {step ? (step.isMoving ? '◯动' : '静') : '待掷'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 pt-2 border-t border-stone-200/60 text-[11px] text-stone-600 leading-relaxed flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                <span>
                  💡 <strong>铜钱口诀</strong>：一背为少阳(⚊单)，两背为少阴(⚋拆)，三背为老阳(⚊◯重动变阴)，全字为老阴(⚋✕交动变阳)。
                </span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 天时设定：两种起卦模式共用（摇卦同样要能定月建与日辰） */}
      <div className="bg-white border border-[#EAE6DC] rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 月令选择：每个选项显示该月自身所冲之支 */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">月令 (月建):</label>
            <select
              value={monthBranch}
              onChange={(e) => setMonthBranch(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50"
            >
              {EARTHLY_BRANCHES.map(b => (
                <option key={b} value={b}>{b}月 (破{getMonthBrokenBranch(b)})</option>
              ))}
            </select>
          </div>

          {/* 日干支选择 */}
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">日辰干支:</label>
            <div className="flex gap-2">
              <select
                value={dayStem}
                onChange={(e) => setDayStem(e.target.value)}
                className="w-1/2 px-2 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50"
              >
                {HEAVENLY_STEMS.map(s => <option key={s} value={s}>{s}日</option>)}
              </select>
              <select
                value={dayBranch}
                onChange={(e) => setDayBranch(e.target.value)}
                className="w-1/2 px-2 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50"
              >
                {EARTHLY_BRANCHES.map(b => <option key={b} value={b}>{b}日</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 模式 B：手动指定卦象 */}
      {activeMode === 'manual' && (
        <div className="bg-white border border-[#EAE6DC] rounded-2xl p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 gap-4">

            {/* 64卦快速选择 */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">快速选择 64 卦:</label>
              <select
                value={selectedHexName}
                onChange={(e) => handleSelectPredefinedGua(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50 font-medium"
              >
                {ALL_HEXAGRAMS.map(hex => (
                  <option key={hex.hexagram_id} value={hex.name}>
                    {hex.palace} · {hex.name} ({hex.generation})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* 动爻勾选开关 */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600">动爻设定 (点击勾选发动):</span>
            <div className="flex items-center gap-2">
              {['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'].map((label, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const next = [...manualMovingLines];
                    next[idx] = !next[idx];
                    setManualMovingLines(next);
                    if (coinSteps.length === 6) {
                      setCoinSteps(prev => prev.map((item, i) => i === idx ? { ...item, isMoving: next[idx] } : item));
                    }
                  }}
                  className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium cursor-pointer ${
                    manualMovingLines[idx]
                      ? 'bg-[#C0392B] text-white font-bold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {label} {manualMovingLines[idx] ? '◯动' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 主看板：全景六爻排盘与推演显微镜 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 左侧/主栏：排盘大看板 (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-2">
          {isBoardReady ? (
            <PaipanCardLayout
              board={boardData}
              activeYaoIndex={activeYaoIndex}
              onYaoClick={(yao) => setActiveYaoIndex(yao.index)}
            />
          ) : (
            <div className="bg-white border border-dashed border-[#EAE6DC] rounded-2xl p-10 text-center">
              <p className="text-sm font-bold font-serif-sc text-stone-700">尚未装齐六爻</p>
              <p className="text-xs text-stone-500 mt-1.5">
                已掷 {coinSteps.length} / 6 爻，摇满六爻后自动出盘；也可切到「指定干支与卦象」直接选卦。
              </p>
            </div>
          )}
          <div className="px-1 flex items-center justify-between text-xs text-stone-500">
            <span>💡 提示：点击任意一行爻象，右侧将自动展开生克显微镜深度推演。</span>
            <span className="font-mono text-stone-400">八宫纳甲定本</span>
          </div>
        </div>

        {/* 右侧：生克推演显微镜 (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#EAE6DC] rounded-2xl shadow-sm p-6 flex flex-col justify-between">
          
          {!activeYao ? (
            <div className="py-12 text-center">
              <p className="text-sm font-bold font-serif-sc text-stone-700">等待装卦</p>
              <p className="text-xs text-stone-500 mt-1.5">六爻装齐后，这里会展开该爻的生克推演。</p>
            </div>
          ) : (
          <div>
            {/* 显微镜头部 */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-50 text-[#C0392B] border border-amber-200/60 shadow-2xs">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold font-serif-sc text-stone-900">
                    生克推演显微镜
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    聚焦：第 {activeYao.index} 爻 · {activeYao.relative} {activeYao.ganzhi}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {activeYao.tags.map((t, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700"
                  >
                    {t.text}
                  </span>
                ))}
              </div>
            </div>

            {/* 四大生克维度评判 */}
            <div className="mt-4 space-y-3">
              
              {/* 1. 月建旺衰 */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/60">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600 mb-1">
                  <span>📅 月令力量 ({boardData.dateGanzhi.month})</span>
                  <span className="text-[#C0392B] font-bold">
                    {activeYao.wangShuai}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {activeYao.branch === boardData.dateGanzhi.monthBroken ? (
                    <span className="text-red-600 font-semibold">
                      ⚠️ 逢月破！与月建相冲，力量大伤。若休囚无气则为真空破，纵动也难当。
                    </span>
                  ) : (
                    `月建为${boardData.dateGanzhi.monthBranch}${BRANCH_WUXING[boardData.dateGanzhi.monthBranch]}，对该爻五行${activeYao.element}具有生克主权。`
                  )}
                </p>
              </div>

              {/* 2. 日辰生克与冲合 */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/60">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600 mb-1">
                  <span>☀️ 日辰生克 ({boardData.dateGanzhi.day})</span>
                  <span className="text-amber-800 font-bold">
                    {boardData.dateGanzhi.xunKong.includes(activeYao.branch) ? '逢旬空' : '得日照临'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {boardData.dateGanzhi.xunKong.includes(activeYao.branch) ? (
                    <span className="text-amber-800">
                      💡 旬空之爻出空有用。若得日生、自身旺相，出空之时即可应验。
                    </span>
                  ) : (
                    `日辰司百日之柄，对该爻提供稳固的生克支撑。`
                  )}
                </p>
              </div>

              {/* 3. 动爻与变卦动变 */}
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/60">
                <div className="flex items-center justify-between text-xs font-semibold text-stone-600 mb-1">
                  <span>⚡ 动变状态</span>
                  <span className="text-[#C0392B] font-bold">
                    {activeYao.isMoving ? '主动发动' : '安静无为'}
                  </span>
                </div>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {activeYao.isMoving ? (
                    activeYao.bianYao?.dynamicTrend ? (
                      `动而化出 ${activeYao.bianYao.relative}${activeYao.bianYao.branch} (${activeYao.bianYao.dynamicTrend})，能量显著变化。`
                    ) : (
                      `动爻能生克静爻，是断卦吉凶先机所在。`
                    )
                  ) : (
                    `静爻守常，受动爻与日月统摄。`
                  )}
                </p>
              </div>

              {/* 4. 野鹤断语心法 */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60">
                <div className="text-xs font-bold text-amber-900 mb-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[#C0392B]" /> 野鹤老人断易秘诀
                </div>
                <p className="text-xs text-amber-950 font-serif-sc italic leading-relaxed">
                  “凡断卦，首重用神。用神旺相，动化吉神，虽休囚亦无碍；用神衰绝，动化凶神，虽生扶难救。”
                </p>
              </div>

            </div>
          </div>
          )}

          {/* 关联法则跳转 */}
          <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-stone-400">想要深入学习？</span>
            <button
              onClick={() => onSelectConcept('用神')}
              className="text-[#C0392B] hover:underline font-bold cursor-pointer"
            >
              查阅《用神章》与经典卦例 →
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
