import termsData from '../data/terms.json' with { type: 'json' };
import chaptersData from '../data/chapters.json' with { type: 'json' };
import casesData from '../data/cases_v2.json' with { type: 'json' };
import { TERM_CATEGORIES } from './schema.js';

const termMap = new Map();
termsData.forEach(t => {
  termMap.set(t.id, t);
  termMap.set(t.name, t);
  (t.aliases || []).forEach(a => termMap.set(a, t));
});

export function getAllTerms() {
  return termsData;
}

export function getTermByIdOrName(key) {
  if (!key) return null;
  return termMap.get(key) || null;
}

// 按分类折叠的术语总览：固定四组顺序（基础/结构/判断/综合），组内按名称排序
export function getTermsGroupedByCategory() {
  const groups = TERM_CATEGORIES.map(category => ({
    category,
    terms: termsData.filter(t => t.category === category).sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  }));
  return groups.filter(g => g.terms.length > 0);
}

export function getRelatedChaptersForTerm(term) {
  if (!term || !term.sourceChapterId) return [];
  const ch = chaptersData.find(c => c.id === term.sourceChapterId);
  return ch ? [ch] : [];
}

// 关联实例：不手工维护，按术语名/别名是否出现在案例小结或要点里反向匹配
export function getRelatedCasesForTerm(term) {
  if (!term) return [];
  const names = [term.name, ...(term.aliases || [])];
  return casesData.filter(c => {
    const haystack = [c.summary, ...((c.tags && c.tags.keyPoints) || [])].join(' ');
    return names.some(n => haystack.includes(n));
  }).slice(0, 6);
}

export function getRelatedTermsForTerm(term) {
  if (!term || !term.relatedTermIds) return [];
  return term.relatedTermIds.map(id => termMap.get(id)).filter(Boolean);
}

// 全局高频术语名列表（含别名）用于正文高亮穿透，按长度降序供调用方构造正则
export const CORE_TERM_NAMES = termsData.flatMap(t => [t.name, ...(t.aliases || [])]);
