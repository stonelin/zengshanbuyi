import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getWuxingStyle } from '../../lib/wuxingHelper';
import YaoLine from './YaoLine';

const TAG_STYLES = {
  danger: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  primary: 'bg-stone-800 text-white border-stone-800',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

// 六爻排盘看板共享渲染组件：智能排盘工作台 / 实例库 / 卦例记录 共用同一份盘面样式。
// 只负责按 board（paipanEngine.assemblePaipanBoard 的输出）渲染，不持有起卦/输入状态。
export default function PaipanCardLayout({
  board,
  onYaoClick,
  activeYaoIndex,
  collapsibleConclusion = false,
  defaultConclusionOpen = true
}) {
  const [isConclusionOpen, setIsConclusionOpen] = useState(defaultConclusionOpen);
  if (!board) return null;

  const showConclusion = !collapsibleConclusion || isConclusionOpen;

  return (
    <div className="bg-white border border-[#EAE6DC] rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* 天时与卦名头部 */}
      <div className="p-5 bg-[#FBF9F5] border-b border-[#EAE6DC]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold font-serif-sc text-[#1F2421] flex items-center gap-2">
              <span>{board.benGua.full_name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-stone-200 text-stone-700 font-sans font-normal">
                {board.benGua.palace} · {board.benGua.generation}
              </span>
              {board.bianGua && (
                <>
                  <span className="text-stone-400 text-sm">之</span>
                  <span className="text-[#C0392B]">{board.bianGua.full_name}</span>
                </>
              )}
            </h3>
            {board.question && (
              <p className="text-xs text-stone-600 mt-1">
                占事：<strong className="text-stone-900">{board.question}</strong>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 font-medium shadow-2xs">
              📅 月建: <strong className="text-stone-900">{board.dateGanzhi.month}</strong>
              <span className="text-red-600 ml-1">(破:{board.dateGanzhi.monthBroken})</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 font-medium shadow-2xs">
              ☀️ 日辰: <strong className="text-stone-900">{board.dateGanzhi.day}</strong>
              <span className="text-amber-700 ml-1">(空:{board.dateGanzhi.xunKong.join('')})</span>
            </span>
          </div>
        </div>
      </div>

      {/* 结论区：用神标注 + 格局（可折叠，默认展开） */}
      <div className="border-b border-[#EAE6DC]">
        {collapsibleConclusion && (
          <button
            onClick={() => setIsConclusionOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            <span>结论区（用神 · 格局）</span>
            {isConclusionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
        {showConclusion && (
          <div className="px-5 pb-3 flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white">
              用神：{board.yongShenKey || '未指定'}
            </span>
            {board.patterns.map((p, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200">
                {p}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 六爻装配列表 (从上爻到初爻渲染) */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        {[...board.yaos].reverse().map((yao) => {
          const isSelected = activeYaoIndex === yao.index;
          const isYongShen = yao.relative === board.yongShenKey;
          const wuxingStyle = getWuxingStyle(yao.element);

          return (
            <div
              key={yao.index}
              onClick={() => onYaoClick && onYaoClick(yao)}
              className={`p-3 rounded-xl transition-all border ${onYaoClick ? 'cursor-pointer' : ''} ${
                isSelected
                  ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                  : 'bg-stone-50/60 border-stone-200/60 hover:bg-stone-100/70'
              }`}
            >
              <div className="grid grid-cols-12 items-center">
                {/* 六神 (2 cols) */}
                <div className="col-span-2 text-xs font-semibold text-stone-600">{yao.liuShen}</div>

                {/* 伏神 (2 cols) */}
                <div className="col-span-2 text-[11px] text-stone-400 font-medium truncate">
                  {yao.hiddenSpirit ? (
                    <span title="伏神" className="px-1 py-0.5 rounded bg-stone-100 text-stone-600">
                      [伏] {yao.hiddenSpirit.relative}{yao.hiddenSpirit.stem_branch}
                    </span>
                  ) : ''}
                </div>

                {/* 本卦爻象与干支六亲 (5 cols) */}
                <div className="col-span-5 flex items-center gap-2.5 flex-wrap">
                  <YaoLine yinYang={yao.yinYang} isMoving={yao.isMoving} size="md" />
                  <span className={`text-xs sm:text-sm font-medium ${yao.isMoving ? 'font-bold text-[#C0392B]' : 'text-stone-900'}`}>
                    {yao.relative}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border font-mono font-semibold ${wuxingStyle.badge}`}>
                    {yao.ganzhi}
                  </span>
                  {yao.isShi && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#C0392B] text-white">世</span>
                  )}
                  {yao.isYing && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-600 text-white">应</span>
                  )}
                  {isYongShen && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-600 text-white">用</span>
                  )}
                </div>

                {/* 变卦变爻 (3 cols) */}
                <div className="col-span-3 flex items-center gap-1.5 text-xs text-stone-600 justify-end">
                  {yao.bianYao ? (
                    <>
                      <span className="text-[#C0392B] font-bold">➯</span>
                      <YaoLine yinYang={yao.bianYao.yinYang} size="sm" compact />
                      <span className="font-medium text-stone-800">{yao.bianYao.relative}{yao.bianYao.branch}</span>
                      {yao.bianYao.dynamicTrend && yao.bianYao.dynamicTrend !== '变爻' && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-red-100 text-[#C0392B] font-bold">
                          {yao.bianYao.dynamicTrend}
                        </span>
                      )}
                      {yao.bianYao.heChong && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-sky-100 text-sky-700 font-bold">
                          {yao.bianYao.heChong}
                        </span>
                      )}
                      {yao.bianYao.isKong && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">化空</span>
                      )}
                      {yao.bianYao.isRuMu && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">化墓</span>
                      )}
                    </>
                  ) : (
                    <span className="text-stone-300">--</span>
                  )}
                </div>
              </div>

              {/* 该爻旺衰与状态标签条 */}
              <div className="mt-1.5 pl-[calc(16.66%+16.66%)] flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-stone-500">{yao.wangShuai}</span>
                {yao.tags.map((t, idx) => (
                  <span
                    key={idx}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${TAG_STYLES[t.type] || TAG_STYLES.info}`}
                  >
                    {t.text}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
