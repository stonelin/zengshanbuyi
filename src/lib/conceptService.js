import conceptsData from '../data/concepts.json' with { type: 'json' };
import chaptersData from '../data/chapters.json' with { type: 'json' };
import casesData from '../data/cases.json' with { type: 'json' };

// 构建快速索引映射
const conceptMap = new Map();
conceptsData.forEach(c => {
  conceptMap.set(c.id, c);
  conceptMap.set(c.name, c);
});

export function getAllConcepts() {
  return conceptsData;
}

export function getConceptByIdOrName(key) {
  if (!key) return null;
  return conceptMap.get(key) || null;
}

// 获取概念关联的所有章节详情
export function getRelatedChaptersForConcept(concept) {
  if (!concept || !concept.typical_cases) return [];
  // 查找在典型案例或规则中关联的章节
  return chaptersData.filter(ch => {
    return ch.key_points.some(kp => kp.includes(concept.name)) || 
           ch.title.includes(concept.name) ||
           (concept.rules && concept.rules.some(r => ch.title.includes(r.slice(0, 4))));
  }).slice(0, 4);
}

// 获取概念关联的所有案例
export function getRelatedCasesForConcept(concept) {
  if (!concept) return [];
  return casesData.filter(c => {
    return (c.diagram && c.diagram.includes(concept.name)) ||
           (c.analysis && c.analysis.includes(concept.name)) ||
           (c.verdict && c.verdict.includes(concept.name)) ||
           (c.title && c.title.includes(concept.name));
  }).slice(0, 6);
}

// 全局高频核心术语列表 (用于正文高亮穿透)
export const CORE_CONCEPT_NAMES = conceptsData.map(c => c.name);
