import casesData from '../data/cases_v2.json' with { type: 'json' };
import termsData from '../data/terms.json' with { type: 'json' };

// 四组标签筛选对应 schema.js 里 caseTagsSchema 的 A/B/C/D 分组注释：
// A 出处与要点 / B 事类 / C 取用 / D 盘面。facet 只从实际已校对数据里统计出现过的值，
// 不用枚举全集——避免筛选面板列出一堆当前 0 条命中的空选项。
export function getAllCases() {
  return casesData;
}

export function getCaseById(id) {
  return casesData.find(c => c.id === id) || null;
}

function countBy(values) {
  const map = new Map();
  values.forEach(v => {
    if (v === undefined || v === null || v === '') return;
    map.set(v, (map.get(v) || 0) + 1);
  });
  return [...map.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'zh'));
}

export function getCaseFacets() {
  return {
    chapterTitle: countBy(casesData.map(c => c.chapterTitle)),
    eventType: countBy(casesData.map(c => c.tags?.eventType)),
    verified: countBy(casesData.map(c => c.tags?.verified)),
    yongShen: countBy(casesData.map(c => c.tags?.yongShen)),
    yongShenStatus: countBy(casesData.flatMap(c => c.tags?.yongShenStatus || [])),
    movingCount: countBy(casesData.map(c => c.tags?.movingCount)),
    patterns: countBy(casesData.flatMap(c => c.tags?.patterns || []))
  };
}

// filters: { chapterTitle: string[], eventType: string[], verified: string[],
//            yongShen: string[], yongShenStatus: string[], movingCount: string[], patterns: string[] }
// 组内 OR（命中任一即算这组通过），组间 AND；空数组视为该组不筛选。
export function filterCases(filters, query) {
  const q = (query || '').trim().toLowerCase();
  return casesData.filter(c => {
    if (q) {
      const haystack = [c.title, c.question, c.summary, ...(c.tags?.keyPoints || [])].join(' ').toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (filters.chapterTitle?.length && !filters.chapterTitle.includes(c.chapterTitle)) return false;
    if (filters.eventType?.length && !filters.eventType.includes(c.tags?.eventType)) return false;
    if (filters.verified?.length && !filters.verified.includes(c.tags?.verified)) return false;
    if (filters.yongShen?.length && !filters.yongShen.includes(c.tags?.yongShen)) return false;
    if (filters.yongShenStatus?.length) {
      const s = c.tags?.yongShenStatus || [];
      if (!filters.yongShenStatus.some(v => s.includes(v))) return false;
    }
    if (filters.movingCount?.length && !filters.movingCount.includes(c.tags?.movingCount)) return false;
    if (filters.patterns?.length) {
      const p = c.tags?.patterns || [];
      if (!filters.patterns.some(v => p.includes(v))) return false;
    }
    return true;
  });
}

// 关联术语：与 termService.getRelatedCasesForTerm 互为反向查询，同样靠术语名/别名
// 是否出现在案例小结或要点文本里匹配，不单独维护关联表。
export function getRelatedTermsForCase(caseItem) {
  if (!caseItem) return [];
  const haystack = [caseItem.summary, ...(caseItem.tags?.keyPoints || [])].join(' ');
  return termsData.filter(t => {
    const names = [t.name, ...(t.aliases || [])];
    return names.some(n => haystack.includes(n));
  }).slice(0, 8);
}
