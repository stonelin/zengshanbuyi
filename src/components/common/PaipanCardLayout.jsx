import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getWuxingStyle, getWangShuaiStyle } from '../../lib/wuxingHelper';
import { explainPattern, explainWangShuai, explainYaoTag } from '../../lib/patternExplain';
import { RELATIVES } from '../../lib/schema';
import YaoLine from './YaoLine';
import Tooltip from './Tooltip';

const TAG_STYLES = {
  danger: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  primary: 'bg-stone-800 text-white border-stone-800',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

// 悬浮解释气泡的正文：一句成因 + 若干条盘面依据。
function ExplainBody({ title, detail }) {
  if (!detail) return null;
  return (
    <span className="block">
      <span className="block font-semibold text-white/95 mb-1">{title}</span>
      <span className="block text-white/85">{detail.why}</span>
      {detail.evidence.length > 0 && (
        <span className="block mt-1.5 pt-1.5 border-t border-white/15 text-white/70 font-mono">
          {detail.evidence.map((e, idx) => (
            <span key={idx} className="block">{e}</span>
          ))}
        </span>
      )}
    </span>
  );
}

// "死 (月克我为死)" → ['死', '月克我为死']，旺衰主字与释义分开排版。
function splitWangShuai(wangShuai) {
  const match = /^(\S+)\s*(?:[(（](.*)[)）])?$/.exec(wangShuai || '');
  if (!match) return [wangShuai || '', ''];
  return [match[1], match[2] || ''];
}

// 六爻排盘看板共享渲染组件：模拟排盘工作台 / 实例库 / 卦例记录 共用同一份盘面样式。
// 只负责按 board（paipanEngine.assemblePaipanBoard 的输出）渲染，不持有起卦/输入状态。
export default function PaipanCardLayout({
  board,
  onYaoClick,
  activeYaoIndex,
  collapsibleConclusion = false,
  defaultConclusionOpen = true,
  yongShenFallback = null // 已校对实例的 board.yongShenKey 多为占位字面量"用神"，由调用方（如实例库）补真实六亲
}) {
  const [isConclusionOpen, setIsConclusionOpen] = useState(defaultConclusionOpen);
  if (!board) return null;

  // 只有落在六亲枚举内的值才是可用的用神六亲，否则退到调用方给的标注
  const yongShenKey = RELATIVES.includes(board.yongShenKey)
    ? board.yongShenKey
    : (RELATIVES.includes(yongShenFallback) ? yongShenFallback : null);
  const isShiYongShen = board.yongShenKey === '世爻' || yongShenFallback === '世爻';

  const showConclusion = !collapsibleConclusion || isConclusionOpen;
  // 整卦无伏神时不保留伏神列，把宽度让给爻象与变卦。
  const hasHiddenSpirit = board.yaos.some(y => y.hiddenSpirit);

  return (
    <div className="bg-white border border-[#EAE6DC] rounded-2xl shadow-sm overflow-hidden flex flex-col">
      {/* 天时与卦名头部 */}
      <div className="p-5 bg-[#FBF9F5] border-b border-[#EAE6DC]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-xl font-bold font-serif-sc text-[#1F2421] flex items-center gap-2">
              <span>{board.benGua.full_name}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-stone-200 text-stone-700 font-sans font-normal">
                {board.benGua.palace}（{board.benGua.palaceElement}）· {board.benGua.generation}
              </span>
              {board.bianGua && (
                <>
                  <span className="text-stone-400 text-sm">之</span>
                  <span className="text-[#C0392B]">{board.bianGua.full_name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-md bg-red-50 text-[#C0392B] font-sans font-normal border border-red-100">
                    {board.bianGua.palace}（{board.bianGua.palaceElement}）
                  </span>
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
          <div className={`px-5 pb-3 flex flex-wrap items-center gap-2 ${collapsibleConclusion ? '' : 'pt-3'}`}>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white">
              用神：{yongShenKey || (isShiYongShen ? '以世爻为用' : '未标注')}
            </span>
            {board.patterns.map((p, idx) => {
              const detail = explainPattern(p, board);
              return (
                <Tooltip key={idx} placement="bottom" align="start" content={detail ? <ExplainBody title={p} detail={detail} /> : null}>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700 border border-stone-200 ${
                      detail ? 'cursor-help border-dashed hover:bg-stone-200' : ''
                    }`}
                  >
                    {p}
                  </span>
                </Tooltip>
              );
            })}
          </div>
        )}
      </div>

      {/* 六爻装配列表 (从上爻到初爻渲染) */}
      <div className="p-3 flex-1 flex flex-col gap-1.5">
        {[...board.yaos].reverse().map((yao) => {
          const isSelected = activeYaoIndex === yao.index;
          const isYongShen = !!yongShenKey && yao.relative === yongShenKey;
          const wuxingStyle = getWuxingStyle(yao.element);
          const [wsLabel, wsReason] = splitWangShuai(yao.wangShuai);
          const wsDetail = explainWangShuai(yao, board);

          return (
            <div
              key={yao.index}
              onClick={() => onYaoClick && onYaoClick(yao)}
              className={`relative overflow-hidden ${yao.isShi || yao.isYing ? 'pl-5' : 'pl-3'} pr-3 py-2 rounded-xl transition-all border flex items-start gap-2 sm:gap-3 ${onYaoClick ? 'cursor-pointer' : ''} ${
                isSelected
                  ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/40 shadow-xs'
                  : yao.isShi
                    ? 'bg-[#C0392B]/[0.05] border-stone-200/60 hover:bg-[#C0392B]/[0.09]'
                    : yao.isYing
                      ? 'bg-amber-500/[0.06] border-stone-200/60 hover:bg-amber-500/[0.11]'
                      : 'bg-stone-50/60 border-stone-200/60 hover:bg-stone-100/70'
              }`}
            >
              {/* 世应标识竖条：与选中高亮并存 */}
              {(yao.isShi || yao.isYing) && (
                <span
                  aria-hidden
                  className={`absolute left-0 top-0 bottom-0 w-1 ${yao.isShi ? 'bg-[#C0392B]' : 'bg-amber-500'}`}
                />
              )}

              {/* 六神：固定窄列 */}
              <div className={`w-9 shrink-0 pt-0.5 text-[11px] font-semibold text-center leading-tight ${
                yao.isShi ? 'text-[#C0392B]' : yao.isYing ? 'text-amber-700' : 'text-stone-500'
              }`}>
                {yao.liuShen}
              </div>

              {/* 伏神：整卦有伏神时才保留该列 */}
              {hasHiddenSpirit && (
                <div className="w-[86px] shrink-0 pt-0.5 text-[10px] leading-tight">
                  {yao.hiddenSpirit && (
                    <span title="伏神" className="inline-block px-1 py-0.5 rounded bg-stone-100 text-stone-500 whitespace-nowrap">
                      伏 {yao.hiddenSpirit.relative}{yao.hiddenSpirit.stem_branch}
                    </span>
                  )}
                </div>
              )}

              {/* 主体：本卦爻象 + 变卦同排，旺衰标签自动对齐到爻象左缘 */}
              <div className="flex-1 min-w-0 max-w-[34rem] flex flex-col gap-1">
                <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
                  <YaoLine yinYang={yao.yinYang} isMoving={yao.isMoving} size="md" />
                  <span className={`text-sm shrink-0 ${
                    yao.isMoving ? 'font-bold text-[#C0392B]' : (yao.isShi || yao.isYing) ? 'font-bold text-stone-900' : 'font-medium text-stone-900'
                  }`}>
                    {yao.relative}
                  </span>
                  <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded border font-mono font-semibold ${wuxingStyle.badge}`}>
                    {yao.ganzhi}{yao.element}
                  </span>
                  {yao.isShi && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-[#C0392B] text-white">世</span>
                  )}
                  {yao.isYing && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-600 text-white">应</span>
                  )}
                  {isYongShen && (
                    <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-600 text-white">用</span>
                  )}

                  {/* 变卦变爻：整块右对齐，强制单行不竖排 */}
                  {yao.bianYao && (
                    <span className="ml-auto flex items-center gap-1 whitespace-nowrap text-xs">
                      <span className="text-[#C0392B] font-bold">➯</span>
                      <YaoLine yinYang={yao.bianYao.yinYang} size="sm" compact />
                      <span className="font-medium text-stone-700">
                        {yao.bianYao.relative}{yao.bianYao.branch}{yao.bianYao.element}
                      </span>
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
                    </span>
                  )}
                </div>

                {/* 该爻旺衰与状态标签条 */}
                <div className="flex flex-wrap items-center gap-1">
                  <Tooltip align="start" content={wsDetail ? <ExplainBody title={wsReason ? `${wsLabel}（${wsReason}）` : wsLabel} detail={wsDetail} /> : null}>
                    <span className={`text-[11px] ${wsDetail ? 'cursor-help border-b border-dotted border-stone-300' : ''} ${getWangShuaiStyle(yao.wangShuai)}`}>
                      {wsLabel}
                    </span>
                  </Tooltip>
                  {yao.tags.map((t, idx) => {
                    const tagDetail = explainYaoTag(t.text, yao, board);
                    return (
                      <Tooltip key={idx} align="start" content={tagDetail ? <ExplainBody title={t.text} detail={tagDetail} /> : null}>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${TAG_STYLES[t.type] || TAG_STYLES.info} ${
                            tagDetail ? 'cursor-help' : ''
                          }`}
                        >
                          {t.text}
                        </span>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
