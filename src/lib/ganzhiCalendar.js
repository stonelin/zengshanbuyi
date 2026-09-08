// 起卦时间 → 干支年月日。月建按节气定（getMonthZhiExact），不用农历名义月份代替，
// 与设计要求"月建按节气定，不能用农历月份代替"一致。委托给 lunar-javascript 做节气/干支的天文换算，
// 不自己手推公式（节气交接日附近容易算错）。
import { Lunar } from 'lunar-javascript';

export function resolveGanzhiFromDate(date) {
  const lunar = Lunar.fromDate(date);
  return {
    yearGanzhi: lunar.getYearGanExact() + lunar.getYearZhiExact(),
    monthBranch: lunar.getMonthZhiExact(),
    dayStem: lunar.getDayGanExact(),
    dayBranch: lunar.getDayZhiExact(),
    dayGanzhi: lunar.getDayGanExact() + lunar.getDayZhiExact()
  };
}
