# -*- coding: utf-8 -*-
import os
import re
import json

def load_raw_text():
    with open('scratch/raw_text.txt', 'r', encoding='utf-8') as f:
        text = f.read()
    target = '增删卜易序\n野鹤曰：'
    body_pos = text.find(target)
    if body_pos == -1:
        p1 = text.find('增删卜易序')
        body_pos = text.find('增删卜易序', p1 + 10)
    return text[:body_pos], text[body_pos:]

def clean_lines(text):
    lines = []
    for line in text.splitlines():
        line_s = line.strip()
        if re.match(r'^\d+$', line_s):
            continue
        if line_s == '\x0c':
            continue
        lines.append(line)
    return '\n'.join(lines)

def parse_volumes_and_chapters(body_text):
    body_text = clean_lines(body_text)
    lines = body_text.splitlines()
    
    vol_markers = [
        ('增删卜易序', '卷首·导引'),
        ('增删卜易【卷之一】', '卷之一·筑基之学'),
        ('增删卜易【卷之二】', '卷之二·深造之论'),
        ('增删卜易【卷之三】', '卷之三·精进之术（上）'),
        ('增删卜易【卷之四】', '卷之四·精进之术（下）'),
    ]
    
    vol_spans = []
    for marker, name in vol_markers:
        pos = body_text.find(marker)
        if pos != -1:
            vol_spans.append((pos, name))
    vol_spans.sort()
    
    def get_volume_for_pos(p):
        cur = '卷首·导引'
        for vpos, vname in vol_spans:
            if p >= vpos:
                cur = vname
            else:
                break
        return cur

    chapter_defs = []
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if (line == '增删卜易序' or 
            line.startswith('增删《黄金策·千金赋》') or 
            ((line.endswith('章') or '章第' in line) and len(line) <= 32 and not any(line.startswith(x) for x in ['如', '见', '此', '亦', '若', '按', '注', '且', '虽', '或', '俱', '故', '又', '乃', '但', '之', '因', '是', '即']))):
            title = line
            if title.startswith('增删《黄金策·千金赋》'):
                title = '增删黄金策千金赋章'
            chapter_defs.append((i, title))
        i += 1

    chapters = []
    for c_idx in range(len(chapter_defs)):
        start_line_idx, title = chapter_defs[c_idx]
        end_line_idx = chapter_defs[c_idx + 1][0] if c_idx + 1 < len(chapter_defs) else len(lines)
        
        ch_lines = lines[start_line_idx:end_line_idx]
        ch_text = '\n'.join(ch_lines).strip()
        
        vol_name = get_volume_for_pos(body_text.find(ch_text[:50]))
        
        category = '基础导引'
        if '卷首' in vol_name:
            category = '入门筑基'
        elif '卷之一' in vol_name:
            if any(k in title for k in ['生克', '月将', '日辰', '六神', '六合', '三合', '六冲', '三刑', '六害', '暗动', '动散']):
                category = '动静生克与神煞'
            elif any(k in title for k in ['旬空', '月破', '生旺墓绝', '飞伏', '进神', '随鬼', '独发', '反伏', '两现']):
                category = '核心断卦法则'
            else:
                category = '八卦与用神基石'
        elif '卷之二' in vol_name:
            if '千金赋' in title:
                category = '千金赋通释'
            elif any(k in title for k in ['天时', '身命', '财福', '功名', '寿元', '趋避']):
                category = '终身与大宗占断'
            elif any(k in title for k in ['学业', '求名', '童试', '科考', '乡试', '升迁', '在任']):
                category = '功名官运'
            else:
                category = '商贾求财与家眷'
        elif '卷之三' in vol_name:
            if any(k in title for k in ['疾病', '痘疹', '病源', '鬼神', '延医', '医占']):
                category = '疾病医药'
            elif any(k in title for k in ['婚姻', '纳宠', '胎孕', '产妇', '产期']):
                category = '婚姻胎产'
            elif any(k in title for k in ['词讼', '避讼', '争竞', '重罪', '防非']):
                category = '官非词讼'
            else:
                category = '仕途与公务'
        else:
            if any(k in title for k in ['出行', '舟行', '行人']):
                category = '出行行人'
            elif any(k in title for k in ['家宅', '买宅', '旧宅', '同居', '官衙']):
                category = '家宅阳宅'
            else:
                category = '茔葬阴宅与风水'

        comments = []
        comment_matches = re.findall(r'(\[?(?:乾按|居士按|蓝按|李我平曰|李文辉曰|李我平鉴定|觉子按|注)\]?[：:\s][^\n]+(?:\n(?![如例【\[\d]|(?:乾|坎|艮|震|巽|离|坤|兑)宫|.*章).*)*)', ch_text)
        for cm in comment_matches:
            if len(cm.strip()) > 5:
                comments.append(cm.strip())

        rhymes = []
        rhyme_matches = re.findall(r'((?:[^\n]{4,7}[，,][^\n]{4,7}[。.]\n?){2,})', ch_text)
        for rm in rhyme_matches:
            if len(rm.strip()) > 15 and not '如：' in rm and not '宫：' in rm:
                rhymes.append(rm.strip())

        key_points = []
        kp_matches = re.findall(r'(?:野鹤曰[：:]|李我平曰[：:]|断曰[：:]|诀曰[：:]|按曰[：:])([^\n。！？]+[。！？])', ch_text)
        for kp in kp_matches[:5]:
            kp_s = kp.strip()
            if len(kp_s) > 8:
                key_points.append(kp_s)

        first_few_lines = [l.strip() for l in ch_lines[1:8] if l.strip() and not l.strip().startswith('[') and not l.strip().startswith('如：')]
        summary = ' '.join(first_few_lines[:2])
        if not summary:
            summary = f'《增删卜易》{vol_name}之【{title}】，详述六爻占断核心准则与野鹤老人辨疑精要。'

        ch_id = f'ch_{c_idx+1:03d}'
        chapters.append({
            'id': ch_id,
            'index': c_idx + 1,
            'title': title,
            'volume': vol_name,
            'category': category,
            'summary': summary[:200],
            'key_points': key_points if key_points else [f'掌握【{title}】在《增删卜易》体系中的核心要旨与原著卦理。'],
            'commentaries': comments,
            'rhymes': rhymes,
            'full_text': ch_text,
            'case_ids': []
        })

    return chapters

def parse_all_cases(chapters, body_text):
    cases = []
    case_counter = 0

    # 占问动词不止"占"一种：自占/又占/复占/再占/仍占 都是新案例的起点，
    # 原正则只认裸"占"，会把这些漏判为上一案例的延续文字，把好几个独立案例拼进同一条。
    case_split_pattern = re.compile(
        r'(?=(?:(?:如|例|曾有|又如|又|某)\s*[：:\s]*)?(?:[正二三四五六七八九十冬腊子丑寅卯辰巳午未申酉戌亥]月\s*[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日|正月\s*[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日|(?:春|夏|秋|冬)\s*[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日)\s*(?:[（\(]旬空[：:\s]*[子丑寅卯辰巳午未申酉戌亥]{2}[）\)])?\s*[,，、\s]*(?:自|又|复|再|仍)?占[^\n]+)'
    )

    for ch in chapters:
        ch_text = ch['full_text']
        has_gua = any(p in ch_text for p in ['乾宫：', '坎宫：', '艮宫：', '震宫：', '巽宫：', '离宫：', '坤宫：', '兑宫：'])
        if not has_gua and not '占' in ch_text:
            continue

        splits = list(case_split_pattern.finditer(ch_text))
        if not splits:
            continue

        for i_s, match in enumerate(splits):
            start = match.start()
            end = splits[i_s + 1].start() if i_s + 1 < len(splits) else len(ch_text)
            case_raw = ch_text[start:end].strip()

            if len(case_raw) < 40 or not ('宫：' in case_raw or '得“' in case_raw or '得' in case_raw or '断曰' in case_raw or '曰：' in case_raw):
                continue

            case_counter += 1
            case_id = f'case_{case_counter:03d}'
            ch['case_ids'].append(case_id)

            date_match = re.search(r'([正二三四五六七八九十冬腊子丑寅卯辰巳午未申酉戌亥]月|春|夏|秋|冬)\s*([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日)', case_raw)
            month = date_match.group(1) if date_match else '未详'
            day = date_match.group(2) if date_match else '未详'
            
            xun_match = re.search(r'旬空[：:\s]*([子丑寅卯辰巳午未申酉戌亥]{2})', case_raw)
            xun_kong = xun_match.group(1) if xun_match else ''

            q_match = re.search(r'占([^\n。，得“]+)', case_raw)
            question = ('占' + q_match.group(1).strip()) if q_match else '占事'
            question = re.sub(r'^[，,\s]+', '', question)

            gua_names_match = re.search(r'得[“\"「]?([^”\"」\s，。]+)[”\"」]?(?:卦)?', case_raw)
            gua_pair = gua_names_match.group(1) if gua_names_match else ''

            primary_gua = ''
            changed_gua = ''
            if '之' in gua_pair:
                parts = gua_pair.split('之')
                primary_gua = parts[0]
                changed_gua = parts[1]
            elif gua_pair:
                primary_gua = gua_pair

            diagram_lines = []
            analysis_lines = []
            verdict_lines = []
            for line in case_raw.splitlines():
                line_s = line.strip()
                if any(p in line_s for p in ['乾宫：', '坎宫：', '艮宫：', '震宫：', '巽宫：', '离宫：', '坤宫：', '兑宫：']) or any(s in line_s for s in ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武']) or '━━━' in line_s or '━ ━' in line_s:
                    diagram_lines.append(line)
                else:
                    if any(k in line_s for k in ['断曰', '余曰', '野鹤曰', '李我平曰', '按曰', '果于', '后于', '应于', '至']):
                        verdict_lines.append(line)
                    else:
                        analysis_lines.append(line)

            diagram_text = '\n'.join(diagram_lines)
            verdict_text = '\n'.join(verdict_lines)
            analysis_text = '\n'.join(analysis_lines)

            querent_type = '自身'
            if any(k in question for k in ['父', '母', '叔', '伯', '尊长', '师']):
                querent_type = '父母尊长'
            elif any(k in question for k in ['子', '女', '儿', '孙', '胎', '产', '痘']):
                querent_type = '子嗣后代'
            elif any(k in question for k in ['妻', '妾', '财', '买卖', '求财', '店铺', '货', '营运', '银']):
                querent_type = '妻财求财'
            elif any(k in question for k in ['兄', '弟', '姐', '妹', '朋友', '同袍']):
                querent_type = '兄弟同辈'
            elif any(k in question for k in ['官', '名', '功名', '升迁', '试', '职', '讼', '病', '鬼']):
                querent_type = '官鬼功名'

            title = f'{month}{day} {question}'

            cases.append({
                'id': case_id,
                'chapter_id': ch['id'],
                'chapter_title': ch['title'],
                'volume': ch['volume'],
                'category': ch['category'],
                'title': title,
                'month': month,
                'day': day,
                'xun_kong': xun_kong,
                'question': question,
                'querent_type': querent_type,
                'gua_name': gua_pair,
                'primary_gua': primary_gua,
                'changed_gua': changed_gua,
                'diagram': diagram_text,
                'verdict': verdict_text if verdict_text else '见原著断语解析。',
                'analysis': analysis_text if analysis_text else case_raw,
                'raw_text': case_raw
            })

    return cases

def main():
    # 只重建 chapters.json / cases.json —— 这两个是从 raw_text.txt 机械解析出来的原始草稿，
    # 后续人工校对/打标签在 cases.json 上直接进行。concepts.json 已经是手工维护、超出
    # generate_concepts() 覆盖范围的数据，knowledge_tree.json / quizzes.json 对应的教学产品
    # 模块已废弃（不再生成），不要覆盖或复活它们。
    toc_text, body_text = load_raw_text()
    chapters = parse_volumes_and_chapters(body_text)
    cases = parse_all_cases(chapters, body_text)

    os.makedirs('src/data', exist_ok=True)

    with open('src/data/chapters.json', 'w', encoding='utf-8') as f:
        json.dump(chapters, f, ensure_ascii=False, indent=2)

    with open('src/data/cases.json', 'w', encoding='utf-8') as f:
        json.dump(cases, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated:")
    print(f"- Chapters: {len(chapters)}")
    print(f"- Cases: {len(cases)}")

if __name__ == '__main__':
    main()
