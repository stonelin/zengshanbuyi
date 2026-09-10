// 起卦时间 → 干支年月日。月建按节气定（getMonthZhiExact），不用农历名义月份代替，
// 与设计要求"月建按节气定，不能用农历月份代替"一致。委托给 lunar-javascript 做节气/干支的天文换算，
// 不自己手推公式（节气交接日附近容易算错）。
import { Lunar, Solar } from 'lunar-javascript';

export function resolveGanzhiFromDate(date) {
  const lunar = Lunar.fromDate(date);
  return {
    yearGanzhi: lunar.getYearGanExact() + lunar.getYearZhiExact(),
    // 月干支同样取节气口径（getMonthInGanZhiExact），与 monthBranch 同源
    monthGanzhi: lunar.getMonthInGanZhiExact(),
    monthBranch: lunar.getMonthZhiExact(),
    dayStem: lunar.getDayGanExact(),
    dayBranch: lunar.getDayZhiExact(),
    dayGanzhi: lunar.getDayGanExact() + lunar.getDayZhiExact(),
    // 农历日期（闰月由 getMonth() 为负判定），仅作展示，排盘一律用上面的干支
    lunarDate: `${lunar.getYearInChinese()}年${lunar.getMonth() < 0 ? '闰' : ''}${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`
  };
}

// 日历面板用：某公历月的 6×7 网格（周日起，含上/下月补位）。
// 每格带农历日文本——初一显示农历月名、节气日显示节气名，便于一眼看出月建何时换。
export function buildLunarMonthGrid(year, month, today = new Date()) {
  const firstDay = new Date(year, month - 1, 1);
  const gridStart = new Date(year, month - 1, 1 - firstDay.getDay());
  const todayYmd = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const lunar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar();
    const jieQi = lunar.getJieQi();
    const isFirstLunarDay = lunar.getDay() === 1;
    return {
      date,
      day: date.getDate(),
      inMonth: date.getMonth() === month - 1,
      isToday: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}` === todayYmd,
      jieQi,
      isFirstLunarDay,
      // 优先级：节气 > 农历初一（显示月名）> 农历日
      subText: jieQi || (isFirstLunarDay ? `${lunar.getMonth() < 0 ? '闰' : ''}${lunar.getMonthInChinese()}月` : lunar.getDayInChinese())
    };
  });
}
