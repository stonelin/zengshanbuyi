// 一次性迁移：按当前引擎重算 cases_v2.json 里每条 board 的派生字段（yaos / patterns）。
// 不从 cases.json 原始草稿重排——手工修正过盘面的条目必须保住人工结果，所以改为
// 拿已存 board 自身的爻象（yinYang + isMoving）与干支重跑一遍 assemblePaipanBoard，
// 卦象与日月干支原样不动，只让 tags / shenSha / bianYao / patterns 跟上新规则。
// 跑完校验本卦变卦名不得改变，有变即说明该条 board 自身不自洽，单独列出不写入。
import { readFileSync, writeFileSync } from 'node:fs';
import { assemblePaipanBoard } from '../src/lib/paipanEngine.js';

const DRY_RUN = process.argv.includes('--dry-run');
const path = new URL('../src/data/cases_v2.json', import.meta.url);
const cases = JSON.parse(readFileSync(path, 'utf-8'));

const mismatches = [];
let patternChanged = 0;
let tagChanged = 0;

for (const item of cases) {
  const board = item.board;
  const fresh = assemblePaipanBoard({
    rawLines: board.yaos.map(y => ({ yinYang: y.yinYang, isMoving: y.isMoving })),
    monthBranch: board.dateGanzhi.monthBranch,
    dayStem: board.dateGanzhi.dayStem,
    dayBranch: board.dateGanzhi.dayBranch,
    question: board.question,
    yongShenKey: board.yongShenKey
  });

  if (fresh.benGua.full_name !== board.benGua.full_name
    || (fresh.bianGua?.full_name ?? null) !== (board.bianGua?.full_name ?? null)) {
    mismatches.push(`${item.id}: 存 ${board.benGua.full_name}之${board.bianGua?.full_name ?? '—'}，重排得 ${fresh.benGua.full_name}之${fresh.bianGua?.full_name ?? '—'}`);
    continue;
  }

  if ([...board.patterns].sort().join(',') !== [...fresh.patterns].sort().join(',')) patternChanged++;
  if (JSON.stringify(board.yaos.map(y => y.tags)) !== JSON.stringify(fresh.yaos.map(y => y.tags))) tagChanged++;

  board.yaos = fresh.yaos;
  board.patterns = fresh.patterns;
  if (item.tags?.patterns) item.tags.patterns = fresh.patterns;
}

console.log(`总条目 ${cases.length}；patterns 变化 ${patternChanged} 条；爻标签变化 ${tagChanged} 条`);
if (mismatches.length) {
  console.log(`\n⚠️ ${mismatches.length} 条 board 自身不自洽，已跳过不写入：`);
  mismatches.forEach(m => console.log('  ' + m));
}
if (DRY_RUN) {
  console.log('\n(dry-run，未写入)');
} else {
  writeFileSync(path, JSON.stringify(cases, null, 2) + '\n', 'utf-8');
  console.log('\n已写回 src/data/cases_v2.json');
}
