import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { buildLunarMonthGrid, resolveGanzhiFromDate } from '../../lib/ganzhiCalendar';

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

const pad = n => String(n).padStart(2, '0');

// 'YYYY-MM-DDTHH:mm' ←→ Date：沿用 datetime-local 的取值格式，调用方无需改动
export function toLocalValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalValue(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

// 起卦时间选择器：日历格内嵌农历与节气，面板底部常驻年月日干支。
// 自绘而非用原生 datetime-local，是因为原生日历无法显示农历/节气，而月建正是按节气换的。
export default function LunarDateTimePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = parseLocalValue(value);
  const [viewYear, setViewYear] = useState((selected || new Date()).getFullYear());
  const [viewMonth, setViewMonth] = useState((selected || new Date()).getMonth() + 1); // 1-12
  const containerRef = useRef(null);

  // 面板外点击关闭
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  // 每次展开时回到选中日期所在月
  useEffect(() => {
    if (!isOpen || !selected) return;
    setViewYear(selected.getFullYear());
    setViewMonth(selected.getMonth() + 1);
  }, [isOpen]);

  const grid = useMemo(() => buildLunarMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);
  const ganzhi = useMemo(() => (selected ? resolveGanzhiFromDate(selected) : null), [value]);

  const shiftMonth = (delta) => {
    const base = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(base.getFullYear());
    setViewMonth(base.getMonth() + 1);
  };

  const pickDate = (date) => {
    const next = new Date(date);
    if (selected) next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    onChange(toLocalValue(next));
  };

  const pickTime = (timeText) => {
    const [hh, mm] = timeText.split(':').map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return;
    const next = selected ? new Date(selected) : new Date();
    next.setHours(hh, mm, 0, 0);
    onChange(toLocalValue(next));
  };

  const goToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
    onChange(toLocalValue(now));
  };

  const selectedYmd = selected
    ? `${selected.getFullYear()}-${selected.getMonth() + 1}-${selected.getDate()}`
    : '';

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50 hover:bg-white hover:border-stone-300 transition-colors cursor-pointer text-left"
      >
        <span className="font-mono text-stone-900">
          {selected ? `${selected.getFullYear()}/${pad(selected.getMonth() + 1)}/${pad(selected.getDate())} ${pad(selected.getHours())}:${pad(selected.getMinutes())}` : '选择起卦时间'}
        </span>
        <CalendarDays className="w-4 h-4 text-stone-400 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-40 mt-1.5 w-[21rem] max-w-[calc(100vw-2rem)] right-0 bg-white border border-[#EAE6DC] rounded-xl shadow-lg p-3">
          {/* 年月导航 */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => shiftMonth(-1)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-stone-900">{viewYear} 年 {viewMonth} 月</span>
              <button type="button" onClick={goToday} className="text-[11px] px-1.5 py-0.5 rounded text-[#C0392B] hover:bg-red-50 cursor-pointer">
                今天
              </button>
            </div>
            <button type="button" onClick={() => shiftMonth(1)} className="p-1.5 rounded-lg text-stone-500 hover:bg-stone-100 cursor-pointer">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEK_LABELS.map(w => (
              <div key={w} className="text-center text-[10px] font-semibold text-stone-400 py-1">{w}</div>
            ))}
          </div>

          {/* 日期格：上行公历，下行农历日 / 农历月名 / 节气 */}
          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((cell, idx) => {
              const isSelected = selectedYmd === `${cell.date.getFullYear()}-${cell.date.getMonth() + 1}-${cell.date.getDate()}`;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => pickDate(cell.date)}
                  className={`py-1 rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#C0392B] text-white'
                      : cell.isToday
                        ? 'bg-amber-50 border border-amber-300'
                        : 'hover:bg-stone-100 border border-transparent'
                  } ${cell.inMonth ? '' : 'opacity-35'}`}
                >
                  <span className={`text-xs leading-tight ${isSelected ? 'font-bold' : 'text-stone-800'}`}>{cell.day}</span>
                  <span
                    className={`text-[9px] leading-tight truncate max-w-full px-0.5 ${
                      isSelected
                        ? 'text-white/85'
                        : cell.jieQi
                          ? 'text-[#C0392B] font-semibold'
                          : cell.isFirstLunarDay ? 'text-stone-600 font-semibold' : 'text-stone-400'
                    }`}
                  >
                    {cell.subText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 时间 */}
          <div className="mt-2.5 pt-2.5 border-t border-stone-100 flex items-center gap-2">
            <span className="text-xs text-stone-500">时刻</span>
            <input
              type="time"
              value={selected ? `${pad(selected.getHours())}:${pad(selected.getMinutes())}` : ''}
              onChange={(e) => pickTime(e.target.value)}
              className="px-2 py-1 text-sm border border-stone-200 rounded-lg bg-stone-50 font-mono"
            />
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ml-auto px-3 py-1 text-xs font-semibold rounded-lg bg-stone-800 text-white hover:bg-stone-900 cursor-pointer"
            >
              完成
            </button>
          </div>

          {/* 选中日期的农历与年月日干支 */}
          {ganzhi && (
            <div className="mt-2 px-2.5 py-2 rounded-lg bg-[#FBF9F5] border border-[#EAE6DC] text-[11px] text-stone-600 space-y-0.5">
              <div>农历 <strong className="text-stone-900 font-serif-sc">{ganzhi.lunarDate}</strong></div>
              <div className="flex flex-wrap gap-x-2">
                <span>{ganzhi.yearGanzhi}年</span>
                <span>{ganzhi.monthGanzhi}月</span>
                <span>{ganzhi.dayGanzhi}日</span>
                <span className="text-stone-400">（月建 {ganzhi.monthBranch}，按节气定）</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
