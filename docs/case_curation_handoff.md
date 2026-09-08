# 实例库校对录入 —— 工作手册与进度存档

> 面向：一个**全新的、没有本次会话记忆**的 Claude 会话（或者你自己）接手继续做
> `src/data/cases_v2.json` 的录入。读完这份文档应该能直接从中断处继续，不需要
> 重新摸索一遍规则。
>
> 背景一句话：项目已从"教学产品"重定位为个人研习工具（详见
> `docs/design_system/` 里带"⚠️ 已废弃"标记之外的规范，以及本文档描述的
> `terms`/`cases`/`records` 数据模型）。当前在做的是"实施顺序"第 3 步——把
> 《增删卜易》原著里的实战卦例，从粗糙的自动抽取结果，逐条校对、结构化，
> 写成 `caseSchema`（见 `src/lib/schema.js`）定义的格式。

---

## 1. 现在的进度

- **已完成 57 条**（`src/data/cases_v2.json` 里有 58 条记录，但其中
  `case_015` 实际上是遗漏未做，不是已完成——见下方"已知缺口"）。
- 已完成的 ID：`case_002` 到 `case_055`（不含 `case_001`，也不含
  `case_015`），加上从边界识别问题里顺手捞回来的"bonus"案例：
  `case_019b` `case_020b` `case_020c` `case_036b` `case_040b`
  `case_047` `case_048` `case_049` `case_050`。
- `case_001` **明确排除**：核实后它不是野鹤老人原著案例，是现代注者"蓝按"
  引用别人（刘汶德）的举例，用来说明"变出式"写法。用户已明确决定
  实例库只收原著案例，不收现代编者按语里的举例。
- `src/data/cases.json` 里一共有 **323** 条自动抽取的草稿（`case_001` 到
  `case_323`），是本轮录入的原始素材来源，但里面的 `verdict`/`analysis`
  等切分字段**不可信**，见第 3 节。

### 已知缺口（下次先补）

1. **`case_015`（午月戊辰日 占妹临产吉凶）被遗漏了**——早期读过原文上下文
   但整理批次时忘了写入，不是主动排除。下次接手时**优先把它补上**。
2. 以下几个"顺手发现但没有独立日期可结构化"的原著例子还留在原文里没有
   录入，属于可选的"锦上添花"，不影响主线进度：
   - "五行相克章"例二（否之讼，克处逢生）、例三（需之乾，人口不安）——
     混在 `case_009` 的 raw_text 里，因为例二/例三的引导语（"同日……妹占
     兄官事"、"又如：……因新迁住宅，人口不安，占得"）里日期和"占"字之间
     插了描述性短语，切分正则认不出来。
   - "六神章"里"戊子日（旬空：午未）占生产，得'剥之观'"——这条**连月份
     都没写**，切分正则完全抓不到，原文本身也丢了这个案例（既不在
     `cases.json` 里，也没被误并入相邻案例），需要手工从
     `scratch/raw_text.txt` 里摘。

---

## 2. 干活的具体流程（每条案例）

### 2.1 工具

- `python3 <定位脚本>`：给定 `case_id`，从 `src/data/cases.json` 里取出
  `raw_text` 的前 60 字，在 `scratch/raw_text.txt` 里定位它的原文位置，
  打印"定位前 800 字上下文" + "cases.json 里存的完整 raw_text"。**这个脚本
  这次会话是现写的，没有保存在仓库里**，下次接手需要重新写一个（很短，
  参考下面的等价 Python）：

  ```python
  import json, sys
  cases = json.load(open('src/data/cases.json'))
  raw = open('scratch/raw_text.txt').read()
  c = next(x for x in cases if x['id'] == sys.argv[1])
  pos = raw.find(c['raw_text'][:60])
  print(f"=== {c['id']} : {c['title']} (chapter: {c['chapter_title']}) ===")
  print(f"found at char pos {pos}")
  print("--- CONTEXT BEFORE (800 chars) ---")
  print(raw[max(0, pos-800):pos])
  print("--- RAW_TEXT (from json, full) ---")
  print(c['raw_text'])
  ```

- 每一批案例写一个一次性的 `build_cases_v2_batchN.mjs` 脚本（不进仓库，
  写在 scratch 目录跑完就丢），大致结构：
  1. 读 `src/data/cases.json`（原始草稿）和当前的 `src/data/cases_v2.json`
     （已完成的存量）。
  2. 对每条新案例手写一个 entry：`id / title / question / verdict /
     analysis / tags / summary / disputed`（`verdict`/`analysis` 是**你自己
     重新从原文摘录、判断边界的**，不是照抄 `cases.json` 里的字段）。
  3. 调用 `resolveCaseBoard(rawCaseObj)` 生成 `board` 草稿；如果是"一事
     两占"的案例，或者 `resolveCaseBoard` 因为 diagram 里混了两卦而算错，
     改用手写 `assemblePaipanBoard({ rawLines, monthBranch, dayStem,
     dayBranch, question, yongShenKey })` 直接构造（下面第 4 节有例子）。
  4. 用 `caseSchema.safeParse(caseObj)` 校验，`OK`/`SCHEMA FAIL` 都打印
     出来，人工确认全 `OK` 再写文件。
  5. `fs.writeFileSync('src/data/cases_v2.json', ...)`。

  **写之前一定要看一眼 `git status`**：如果上一次脚本跑到一半失败过、
  已经部分写入了 `cases_v2.json`，重跑会导致这批案例被追加两次。保险做法
  是先 `git diff --stat src/data/cases_v2.json` 确认没有未提交的部分写入，
  或者干脆 `git checkout -- src/data/cases_v2.json` 回到上一次提交的干净
  状态再跑。

- 跑完一批后：
  ```bash
  node scripts/test_engine.js   # 看"测试项 8"是不是全绿
  npm run build                 # 确认没有语法/类型问题
  ```

### 2.2 判断步骤（人工核对，这是真正花时间的部分）

对每一个 `case_id`：

1. **定位原文，读上下文**，判断：
   - 这是野鹤老人原著案例，还是现代编者按语（`[乾按]` `[居士按]`
     `[蓝按]` 等方括号标记段落）里的举例？后者不收。
   - `case_raw`（也就是 `cases.json` 里存的 `raw_text`）有没有把**下一段
     无关内容**（比如章节末尾的通论文字、下一个案例）粘连进来？
     常见于"章末最后一个案例"，因为切分正则找不到下一个边界就一直吃到
     章节结尾。
   - `case_raw` 有没有**漏吞**别的案例？比如同一段落里出现了第二次
     "自占"/"又占"/日期格式不标准（`(寅卯空)` 而不是
     `(旬空：寅卯)`）、或者日期和"占"字之间插了描述性短语——这些都会让
     切分正则漏判，要么整条案例完全没进 `cases.json`（要靠原文手工补，
     见第 1 节"已知缺口"），要么被错误地粘连进前一条/后一条案例的
     `raw_text` 里（可以顺手拆出来当"bonus"案例，用 `case_XXXb` 这样的
     ID，参考已有的 9 个 bonus 案例）。
2. **手写 `verdict`/`analysis`**：`verdict` 是野鹤老人的断语（一般以
   "断曰"/"余曰"起，或者是问答体的完整论断），`analysis` 是额外的补充
   说理（不是每条都有，没有就不填这个字段，`caseObj.analysis` 用
   `undefined` 让 schema 的 `.optional()` 生效）。
3. **调用引擎生成 `board` 草稿**，跟原文逐项核对：
   - 本卦、变卦卦名对不对（这个现在应该基本可靠，见第 3 节的历史 bug）。
   - 用神取法：原文用哪个六亲断的？是不是跟 `resolveYongShen` 的映射
     一致（`求财→妻财 功名→官鬼 婚姻→妻财 疾病→官鬼`，`出行`类不取
     固定六亲，以世爻自身论）？很多案例的用神取法比这几条映射复杂
     （比如占他人事、占父母/子女/兄弟直接取对应六亲），不必强行套
     `EVENT_YONGSHEN_MAP`，`tags.yongShen` 按案例实际情况手写就好，
     `eventType` 字段也允许自定义（不在 `CASE_EVENT_TYPES` 八类里的，
     直接写贴切的中文短语，比如"开业""延师""随任""比试搏艺"）。
   - 神煞/旺衰/格局（`board.patterns`、每个 `yao.tags`、`yao.wangShuai`）
     跟原文描述的关键结论是否一致。**不需要逐爻逐字通篇复核**，只要
     核心断语依赖的那几个点（用神状态、主要格局）对得上就行——这是
     spec 自己定的验证深度（"重点核对用神取法、神煞、旺衰"），不是要
     把每一个附带信息都验证一遍。
4. **发现不一致时**：
   - 如果原文没有点名具体的变卦六亲（比如只说"化出寅木"，没说这是
     "官鬼寅"还是"父母寅"），那不影响，不用管。
   - 如果原文**明确点名了变卦六亲**，且断语的推理逻辑**依赖**这个六亲
     身份（比如"世爻变鬼"这种文字游戏），而引擎按纳甲算出来的六亲不一样
     ——这是本轮反复出现的"变卦六亲系统性偏差"（怀疑是原书扫描/排版时
     变卦六亲栏错位，不是野鹤老人原文有误，因为用"乾为天"这个标准卦
     验证过纳甲算法本身是对的）。这种情况下**手工覆盖**
     `board.yaos[i].bianYao.relative`（改成原文说的那个），并在
     `disputed.note` 里写清楚为什么改、改了哪一爻。已经出现过 3 次：
     `case_022`（1爻→官鬼）、`case_036b`（6爻→官鬼）、`case_046`
     （6爻→父母）。
   - 如果发现的是**引擎能力缺口**（不是数据错，是这条规则引擎压根没实现），
     先判断这是不是"多个案例反复印证、原文给出清晰公式"的那种（值得
     现在补引擎），还是"只有孤例、规则本身存疑"的那种（记 `disputed`，
     不猜公式）。这轮补过的规则见第 3 节，判断标准是：**至少两个独立
     案例，或者原文本身/`[乾按]`编者按语给出了明确公式**，才动手实现；
     光凭一个案例的措辞猜公式，风险太大，宁可先存疑。
5. **写 `tags`（A/B/C/D 四组）和 `summary`**（一句话讲清楚这个案例在
   教什么、可迁移的规则是什么）。
6. **`verified` 字段的准确含义**：指"野鹤老人的断语（包括应期）后来是否
   被证实"，**跟占问者是否称心如意没有关系**。断语说"必死"结果真的死了，
   算 `应验`，不是 `不验`。第一批做的时候在 `case_006`/`case_007` 上搞反过，
   后来发现改了——**这是一个真实踩过的坑，注意别再犯**。原文没有给出
   明确"果……"确认句的（有些只是即时推演，没写后续），`verified` 字段
   就不填（`undefined`），不要强行猜一个。

---

## 3. 这轮踩出来的引擎 bug 和新增能力（都已提交，接手时是最新状态）

处理案例的过程中，靠真实案例倒逼出来好几个 `src/lib/paipanEngine.js` 的
真 bug 和缺口，都已经修好/补上，**接手时不用重新验证这些**，但要知道
它们存在过，因为文档里很多 `disputed` 说明会提到：

1. `findHexagramByName` 遇到查不到的简写会静默兜底成"乾为天"，导致
   `resolveCaseBoard` 反推出错误的本卦——已改为直接从 `diagram` 文本里
   "X宫：Y"这一行读全名。
2. `resolveCaseBoard` 曾经靠扫描 `diagram` 文本里的"○/×/动/→"符号判定
   动爻，会产生假阳性（古籍"变出式"写法会把变卦全六爻都写出来，符号
   位置不完全等于"这一爻真的动了"）——已改为纯粹比较本卦/变卦阴阳。
3. 新增格局判断（这几项之前 Step 3 时特意没做，是这轮案例校对时原文
   给出清晰依据后才补的）：
   - `六冲变六合` `六合变六合` `六冲变六冲` `六合变六冲`（本卦/变卦
     是否六合六冲的四种组合）
   - `反吟(爻)`（其实就是 `化冲`，一开始没意识到是同一个概念）
   - `反吟(内卦)` `反吟(外卦)` `反吟(内外)` / `伏吟(内卦)` `伏吟(外卦)`
     `伏吟(内外)`——**这是"反伏章"给出结构性例卦后才敢做的**：内卦
     （1-3爻）或外卦（4-6爻）三条线的阴阳组合整体变了（不是"没动"），
     且变卦对应位置的地支要么全部是本卦地支的六冲支（反吟），要么
     全部原地不动（伏吟，只是阴阳互换）。用了三个原文自带答案的例卦
     （观变坤/巽变观/无妄变大壮）加一个案例自己的断语（`case_044`
     "但内卦反吟"）交叉验证过，还专门排除了"半卦压根没变，被误判成
     伏吟"的假阳性。
   - `化来` `化去` `变生` `比和`（本卦/变卦所属宫位的五行生克关系，
     `[乾按]` 有正式定义："变卦生主卦为变生；变卦与主卦所属五行相同为
     比和；变卦克主卦为变克……凡变生、变比和为吉，变克为凶"——`化来`
     `化去` 是案例正文自己的叫法，`化来`＝`变克`）。
   - 十二长生四阶：`长生(日)` `帝旺(日)` `绝(日)`（挂在每个 `yao.tags`
     上，跟 `入墓(日墓)` 一起），只做"日辰"维度，只做野鹤老人自己说
     "验证过"的四阶（`长生/旺/墓/绝`），不做其余八阶（沐浴冠带临官衰
     病胎养）。土行墓库原来因"辰/戌两说都有"存疑没做，这次靠原文的
     "水土同寄"表确认是辰，已订正 `MUKU_MAP`。
4. **重要操作习惯**：给引擎加新的判定逻辑之后，如果这个逻辑是挂在
   `board.yaos[i]` 这一层（每爻的 tag、`bianYao` 字段），**光靠重跑
   `resolvePatterns(board)` 刷新已入库案例的 `board.patterns` 是不够的**
   ——因为 `resolvePatterns` 只是读 `board.yaos` 现成的数据做汇总，
   `yao.tags` 本身是在 `assemblePaipanBoard` 里算的，不会被
   `resolvePatterns` 重新计算。正确做法是**从 `cases.json` 的原始数据
   重新跑一遍完整的 `resolveCaseBoard`（或者手写 `assemblePaipanBoard`
   调用），整个 `board` 对象替换掉**。这次因为疏忽先只刷新了
   `patterns`，后来才发现漏了 per-yao 的新 tag，返工过一次。批量重跑时
   **千万别忘了把已经手工覆盖过 `bianYao.relative` 的那几条（`case_022`
   `case_036b` `case_046`）的覆盖重新打一遍**，批量重算会把手工改的值
   冲掉——这次也真的漏过一次，靠三条逐一核对才发现。
5. **明确没做、以后也不建议轻易做的**：
   - 三刑（寅刑巳/巳刑申/申刑寅/子刑卯……）：`case_037` 遇到过，原文
     自己说"独犯三刑，得验者少……占过数十年来，只验一卦"，应验率存疑，
     且 spec 没有把它列为必做项，不实现。
   - 三合局"虚一待用"的动静细分（`case_026`/`case_027` 都出现"内少
     X字"的表述，疑似要求"局"里至少几个字是发动的，静止存在的字不
     直接算数）：只碰到过这两个案例，措辞本身也含糊，没有把握，
     记 `disputed`，不改 `detectSanHeGroups`。
   - `bianYao` 是否月破：`case_048` 提到"目下月破"是指变爻本身，
     `bianYao` 对象目前没有这个字段，只在 `summary` 里文字说明，没有
     补字段（信息完整性优化，优先级不高，等以后有更多案例反复需要
     再考虑）。

---

## 4. `board` 手工构造的写法（用于"一事两占"或 diagram 混了多卦的情况）

```js
import { assemblePaipanBoard, findHexagramByName } from '/home/ubuntu/yi/src/lib/paipanEngine.js';

function build(benName, bianNameOrNull, monthBranch, dayStem, dayBranch, question, yongShenKey) {
  const ben = findHexagramByName(benName);
  const rawLines = bianNameOrNull
    ? (() => {
        const bian = findHexagramByName(bianNameOrNull);
        return ben.lines.map((l, idx) => ({ yinYang: l.yin_yang, isMoving: bian.lines[idx].yin_yang !== l.yin_yang }));
      })()
    : ben.lines.map(l => ({ yinYang: l.yin_yang, isMoving: false })); // 纯静卦
  return assemblePaipanBoard({ rawLines, monthBranch, dayStem, dayBranch, question, yongShenKey: yongShenKey || '' });
}
```

**"一事两占"案例**（原文里"命之再占"这种，本章"旬空章""反伏章"里出现
了好几次）的处理方式：`board` 取**第二次（最终判断依据的那次）起卦**，
第一次起卦的卦画和讨论保留在 `originalText.verdict`/`originalText.analysis`
的引文里，不单独结构化。`disputed.note` 里说明"本例包含两次起卦"。
`chapterId`/`chapterTitle` 沿用同一章节里相邻已确认案例的值（因为这类
bonus 案例往往没有自己的 `raw` 对象可以取 `chapter_id`）。

`tags.guaName` 字段建议写成"A之B（第二次起卦；第一次起卦为C之D，见
originalText）"这样，方便以后 UI 展示时不丢信息。

---

## 5. 接下来具体要做什么

1. 先补 `case_015`。
2. 从 `case_056` 继续往后做，一直到 `case_323`（`src/data/cases.json`
   里的最大编号）。建议还是保持"一次读 6~10 条上下文，交叉验证，写一批，
   跑测试，提交"的节奏，每批提交一次 git commit（参考这次会话的提交
   历史，`git log --oneline` 能看到每批的 commit message 写法，信息量
   建议保持同等详细程度，方便以后回溯"这条案例当时是怎么判断的"）。
3. 每批完成后记得：
   - 更新 `scripts/test_engine.js` 里的 `MANUAL_BOARD_CASE_IDS`（凡是
     `board` 不是直接从 `cases.json` 原始条目 `resolveCaseBoard` 出来的
     ——包括 bonus 案例和"一事两占"取第二次起卦的——都要加进去，否则
     回归测试会去拿它对应的 `raw` 条目重算，对不上）。
   - `node scripts/test_engine.js` 确认"测试项 8"全绿。
   - `npm run build` 确认没有语法问题。
4. 全部 323 条（减去 `case_001` 和其余确认为编者按语的条目）做完之后，
   下一步是把 `src/data/cases_v2.json` 接入实际的 UI（目前完全没有
   界面在用它——`RecordCastingHub.jsx` 里的 `matchCasesForRecord` 已经
   在读 `cases.json`，但因为 `tags` 字段是空的所以匹配永远是空结果；
   接完 `cases_v2.json` 之后要把这个匹配逻辑指过去），以及做实例库自己
   的浏览/筛选界面（`docs/design_system/04_case_deduction_game_spec.md`
   已标记废弃，新界面要按当时讨论的"三、实例模块"那版设计来做——四组
   标签筛选、盘面卡片+原文+小结+相关，不是盲推游戏）。
