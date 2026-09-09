import { BRANCH_WUXING, STEM_WUXING } from './paipanEngine.js';

export const WUXING_COLOR_MAP = {
  '木': {
    name: '木',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    tag: 'bg-emerald-100/80 text-emerald-900',
    dot: 'bg-emerald-600',
    border: 'border-emerald-300',
    label: '松柏木'
  },
  '火': {
    name: '火',
    badge: 'bg-rose-50 text-rose-800 border-rose-200',
    tag: 'bg-rose-100/80 text-rose-900',
    dot: 'bg-rose-600',
    border: 'border-rose-300',
    label: '枫叶火'
  },
  '土': {
    name: '土',
    badge: 'bg-amber-50 text-amber-900 border-amber-200',
    tag: 'bg-amber-100/80 text-amber-900',
    dot: 'bg-amber-700',
    border: 'border-amber-300',
    label: '厚德土'
  },
  '金': {
    name: '金',
    badge: 'bg-slate-100 text-slate-800 border-slate-300',
    tag: 'bg-slate-200/80 text-slate-900',
    dot: 'bg-slate-600',
    border: 'border-slate-400',
    label: '明曜金'
  },
  '水': {
    name: '水',
    badge: 'bg-sky-50 text-sky-800 border-sky-200',
    tag: 'bg-sky-100/80 text-sky-900',
    dot: 'bg-sky-600',
    border: 'border-sky-300',
    label: '幽渊水'
  }
};

export function getWuxingForGanzhi(ganzhi) {
  if (!ganzhi) return '木';
  // 取末尾地支五行
  const branch = ganzhi[ganzhi.length - 1];
  if (BRANCH_WUXING[branch]) return BRANCH_WUXING[branch];
  const stem = ganzhi[0];
  if (STEM_WUXING[stem]) return STEM_WUXING[stem];
  return '木';
}

export function getWuxingStyle(elementOrGanzhi) {
  const wuxing = ['木', '火', '土', '金', '水'].includes(elementOrGanzhi)
    ? elementOrGanzhi
    : getWuxingForGanzhi(elementOrGanzhi);
  return WUXING_COLOR_MAP[wuxing] || WUXING_COLOR_MAP['木'];
}

// 旺相休囚死配色：旺/相为吉色（偏绿），休/囚/死依次转暖到警示色，平为中性灰。
// 只取 getWangXiangStatus() 返回字符串的首字判断，格式固定为 "旺 (同我为旺)" 这类。
export const WANGSHUAI_COLOR_MAP = {
  '旺': 'text-emerald-700 font-bold',
  '相': 'text-teal-600 font-semibold',
  '休': 'text-amber-600',
  '囚': 'text-orange-600',
  '死': 'text-red-600',
  '平': 'text-stone-500'
};

export function getWangShuaiStyle(wangShuai) {
  const key = wangShuai ? wangShuai[0] : '平';
  return WANGSHUAI_COLOR_MAP[key] || WANGSHUAI_COLOR_MAP['平'];
}
