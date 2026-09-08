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

    case_split_pattern = re.compile(
        r'(?=(?:(?:如|例|曾有|又如|又|某)\s*[：:\s]*)?(?:[正二三四五六七八九十冬腊子丑寅卯辰巳午未申酉戌亥]月\s*[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日|正月\s*[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日|(?:春|夏|秋|冬)\s*[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]日)\s*(?:[（\(]旬空[：:\s]*[子丑寅卯辰巳午未申酉戌亥]{2}[）\)])?\s*[,，、\s]*占[^\n]+)'
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

def generate_concepts():
    return [
        {
            'id': 'c_yongshen',
            'name': '用神',
            'pinyin': 'yòng shén',
            'category': '定用与六亲',
            'definition': '占卦时所测人事的核心代表爻。占父母长辈取父母爻，占求财妻妾取妻财爻，占功名官讼疾病取官鬼爻，占子孙医药取子孙爻，占兄弟朋友取兄弟爻，自占吉凶取世爻。',
            'book_quote': '父母为用神，凡占父母、祖父母、师长、家宅、文章等，皆以父母为用神；官鬼为用神，凡占功名、官府、疾病、盗贼等；妻财为用神，凡占求财、买卖、妻妾、仆役等；子孙为用神，凡占子孙、医药、解忧避祸等；兄弟为用神，凡占兄弟、朋友、同类等。',
            'rules': [
                '用神宜旺相，喜日月生扶，动爻生合，忌日月刑冲克害及忌神动克。',
                '卦无用神须寻伏神，伏于本宫卦相应爻位之下。',
                '用神多现者，取临日月、发动、持世、有生扶或旬空月破者为准。'
            ]
        },
        {
            'id': 'c_yuanshen_jishen',
            'name': '元神与忌神',
            'pinyin': 'yuán shén & jì shén',
            'category': '动静生克',
            'definition': '生用神之爻为元神，克用神之爻为忌神。生忌神（克元神）之爻为仇神。',
            'book_quote': '生用神者为元神，克用神者为忌神，克元神生忌神者为仇神。元神宜旺动生用，忌神宜休囚静止或动而受制。',
            'rules': [
                '元神虽现，若休囚旬空月破，或动化绝化退化克，则无力生用神。',
                '忌神虽动，若动化绝、化克、化退、入墓，或受日辰动爻克制，则凶而不凶。',
                '克处逢生：忌神动克用神，若卦中又有元神同动，形成连环相生，反凶为吉。'
            ]
        },
        {
            'id': 'c_yuejiang',
            'name': '月将（月建）',
            'pinyin': 'yuè jiàng',
            'category': '日月当权',
            'definition': '占卦当月之月令地支。掌一月之提纲，操司权之主宰，司三旬之令，万卦之纲领。',
            'book_quote': '月将掌一月之权，逢空不空，遇伤无害。爻临月建，为卦中之至旺；月建生爻，爻得长生旺相；月建克爻，爻受月克休囚。',
            'rules': [
                '爻临月建，名为月将当权，纵逢动爻克制，亦难为害（遇克不克）。',
                '爻与月建相冲，谓之月破；静爻受月破为百无所用，动爻月破逢生扶填实仍有用。'
            ]
        },
        {
            'id': 'c_richen',
            'name': '日辰',
            'pinyin': 'rì chén',
            'category': '日月当权',
            'definition': '占卦当日之天干地支。日辰与月建同功同权，管当日之吉凶，亦操终身之祸福。',
            'book_quote': '日辰同功于月将，能生克冲合动静各爻。旺相静爻受日辰冲之，为暗动，暗动者如发动作福作祸；休囚静爻受日冲为日破。',
            'rules': [
                '日辰冲旺相静爻为【暗动】，冲休囚静爻为【日破】。',
                '日辰合爻为合起（旺静被合）或合绊（动爻被日辰合住暂时不能动）。',
                '爻逢日生则旺，逢日克则衰，爻临日辰为日建，同日月之威。'
            ]
        },
        {
            'id': 'c_xunkong',
            'name': '旬空',
            'pinyin': 'xún kōng',
            'category': '核心断卦法则',
            'definition': '天干十位配地支十二位，每旬所余二支为旬空。空亡之妙，似有若无，实有到底全空，亦有出空填实之时。',
            'book_quote': '野鹤曰：诸书皆以月将当权，逢空不空，遇伤无害。此书以增克制，空亦为空，伤亦为害。然旬空之法，有动不为空、受生不为空、临日月不为空；只有休囚无气又受克害、动化绝化克者，方为真真空也。',
            'rules': [
                '【动不为空】：爻发动者，出空之日即应吉凶。',
                '【旺不为空】：临日月或受日月动爻生扶者，出空填实或逢冲之日有用。',
                '【真真空】：爻静休囚无气，又受日月动爻重叠刑克，或动化绝化破者，到底全空。'
            ]
        },
        {
            'id': 'c_yuepo',
            'name': '月破',
            'pinyin': 'yuè pò',
            'category': '核心断卦法则',
            'definition': '爻之五行地支与当月月建相冲者为月破。如正月建寅冲申爻，申即为月破。',
            'book_quote': '野鹤曰：古法以月破百无所用。余考之不然，动爻月破，出月即破，填实亦破，合之亦破。逢日辰动爻生扶，值出月实破之日，反见大吉；惟静而休囚受克者，方为真破到底。',
            'rules': [
                '静爻休囚无气而月破，逢克无救，为彻底破散，百无所用。',
                '动爻临月破，虽在当月无力，出月逢值日或逢合日即可发用（应期常在出月或合破、填破之时）。'
            ]
        },
        {
            'id': 'c_jinshen_tuishen',
            'name': '进神与退神',
            'pinyin': 'jìn shén & tuì shén',
            'category': '动变神煞',
            'definition': '动爻变出同类五行且地支前进者为进神（亥化子、寅化卯、巳化午、申化酉、丑化辰、辰化未、未化戌）；后退者为退神（子化亥、卯化寅、午化巳、酉化申、辰化丑、戌化未、未化辰）。',
            'book_quote': '进神者，如春木之荣，随日而长；退神者，如秋叶之凋，随风而坠。进退之理，动变之纲领也。',
            'rules': [
                '吉神化进神，吉事益吉，福禄倍增；凶神化进神，凶祸愈深。',
                '吉神化退神，吉事渐消，最终难就；凶神化退神，凶事消散，逢凶化吉。',
                '动爻旺相化进神者为真进，休囚旬空化进者需待出空逢旺方进。'
            ]
        },
        {
            'id': 'c_suigui_rumu',
            'name': '随鬼入墓',
            'pinyin': 'suí guǐ rù mù',
            'category': '核心断卦法则',
            'definition': '官鬼代表祸患灾疾，墓库代表幽暗闭塞。世爻或用神与官鬼同入墓库，或自化鬼入墓。',
            'book_quote': '野鹤曰：古法有随鬼入墓之说，学者多惑。余阅四十余载，随鬼入墓者有三：一者用神临鬼动而入墓；二者用神临日辰动而入墓；三者用神自化鬼入墓。自占病讼最忌之，余占无妨。',
            'rules': [
                '占自身疾病、官非、牢狱，最忌世爻随鬼入墓或世动化鬼入墓，主凶危难解。',
                '占求官功名，官鬼为用神，官爻旺相入墓者，遇冲墓之日月即得升迁，不可概以随鬼入墓论凶。'
            ]
        },
        {
            'id': 'c_fufan_yin',
            'name': '反吟与伏吟',
            'pinyin': 'fǎn yín & fú yín',
            'category': '卦变格局',
            'definition': '卦变相冲为反吟（如乾变坤、坤变乾、震变巽等爻位对冲）；卦变同支为伏吟（如乾变震，地支皆为子寅辰、午申戌）。',
            'book_quote': '反吟者，反复呻吟之象；伏吟者，伏枕呻吟之态。卦逢反吟，事多反复变幻；卦逢伏吟，忧郁不展，迁延难决。',
            'rules': [
                '反吟之卦，内外皆反，事主往返翻腾，成而又败，败而又成。',
                '伏吟之卦，内外皆伏，人情忧郁，进退两难，占病占讼最所不喜。'
            ]
        },
        {
            'id': 'c_dufa_liangxian',
            'name': '独发与两现',
            'pinyin': 'dú fā & liǎng xiàn',
            'category': '动变神煞',
            'definition': '卦中唯有一爻发动者为独发（一爻动），卦意全在此动爻之中；用神在卦中两处出现者为两现。',
            'book_quote': '独发易见，众动难寻。一爻独发，吉凶全在动爻生克变易之间。用神两现，舍其休囚取其旺相，舍其静爻取其动爻，舍其无气取其有生。',
            'rules': [
                '【独发】：卦中只有一爻动，动必有因，此爻即为全卦之枢机与动因。',
                '【两现】：用神出现两处，优先取发动的爻；若皆静，取持世或临日月者；若无，取旬空月破有变者。'
            ]
        }
    ]

def generate_quizzes():
    return [
        {
            'id': 'quiz_01',
            'title': '父近病吉凶与应期推演',
            'case_ref': '辰月 戊申日 占父近病',
            'question': '辰月 戊申日 (旬空：寅卯)，占父近病，得“乾为天”六冲卦化“风天小畜”卦。父母戌土持世，动化妻财辛卯木。请判断此病吉凶与应期？',
            'options': [
                '大凶，父母戌土动化卯木回头克，且临月破，危在旦夕。',
                '大吉，近病逢六冲即愈；世爻戌土虽动化卯木回头克，但辰月冲之，戌土为月破，辰日冲动卯木，卯戌作合，反凶为吉，巳日必愈。',
                '平平，需等到来年秋天戌月方能痊愈。',
                '凶兆，乾宫六冲变小畜，六冲无救。'
            ],
            'correct_index': 1,
            'explanation': '《增删卜易》【克处逢生章】经典卦例：野鹤曰：“近病逢冲即愈，此卦乃乾为天六冲之卦，父病必愈。戌土世爻动化卯木回头克，幸得辰月冲戌为月破，辰日冲卯木，卯戌相合，克处逢生，巳日冲合填实，立愈。”',
            'rule': '近病逢六冲卦必愈；动化回头克若得月日冲合，乃克处逢生之妙格。'
        },
        {
            'id': 'quiz_02',
            'title': '自占重病：大过化鼎之吉凶',
            'case_ref': '巳月 乙未日 自占病',
            'question': '巳月 乙未日 (旬空：辰巳)，自占病，得“泽风大过”游魂卦化“火风鼎”卦。初爻妻财丑土动化巳火，六爻未土动化巳火子孙。如何论断？',
            'options': [
                '必死无疑，因游魂卦主魂魄离散，且财动生鬼。',
                '当即痊愈，因巳月子孙当权，巳火回头生世爻。',
                '吉兆，自占病以世爻为用。世临酉金官鬼，初爻丑土、六爻未土齐动生世，虽月令巳火克世，幸得丑未二土同动通关生金，且动化子孙巳火生土，化险为夷，巳日大愈。',
                '大凶，因丑未相冲，变卦为鼎卦，水火相煎。'
            ],
            'correct_index': 2,
            'explanation': '《增删卜易》【动静生克章】野鹤老人论断：世爻酉金虽为巳月所克，喜得卦中丑土未土两财齐动，土动生金，贪生忘克，反凶为吉，逢巳日子孙当旺之日病除。',
            'rule': '克处逢生与动爻连环通关：忌神克用，若有生用之神大动，则忌神转生元神，元神复生用神。'
        },
        {
            'id': 'quiz_03',
            'title': '占父官事已拟重罪能否得赦',
            'case_ref': '卯月 戊辰日 占父官事已拟重罪',
            'question': '卯月 戊辰日 (旬空：戌亥)，占父官事，已拟重罪。得“泽地萃”卦化“天火同人”卦。初爻未土父母动化戌土进神。如何断此重罪案情？',
            'options': [
                '父必获重罪，因父母动化戌土落入旬空，进神无力。',
                '父得赦免无罪，因父母爻为用神，未土动化戌土乃【进神】，进神得辰日冲动戌土出空，又得日辰生扶，神旺罪散，后逢恩赦。',
                '大凶，官鬼卯木临月建当令克世，不可解救。',
                '案情延宕，必须等待三年后戌年方结。'
            ],
            'correct_index': 1,
            'explanation': '《增删卜易》【进神退神章】：未土父母动化戌土，乃大进神。戌虽旬空，辰日冲之则实，用神旺相化进，主父罪化凶为吉，果蒙恩免罪。',
            'rule': '进神得日月生扶冲实，如春苗得雨，凶灾化为吉庆。'
        },
        {
            'id': 'quiz_04',
            'title': '自占病同人之旅卦断法',
            'case_ref': '丑月 戊子日 自占病',
            'question': '丑月 戊子日 (旬空：午未)，自占病，得“天火同人”归魂卦化“火山旅”六合卦。世爻同人卦二爻官鬼丑土临日克，但应爻九五戌土子孙动化巳火生之。请问病势如何？',
            'options': [
                '大凶，子孙化绝，子水克官鬼。',
                '大吉，用神世爻持丑土官鬼，自占病官鬼持世乃宿疾，喜子孙戌土动化巳火回头生，子孙动而制鬼，又六合化解，午日出空必愈。',
                '久病难痊，归魂化六合主绵延不绝。',
                '无妨，无需服药自愈。'
            ],
            'correct_index': 1,
            'explanation': '《增删卜易》【生旺墓绝章】经典案例：自占病得子孙动来生扶与制化，应爻戌土子孙化巳火生之，至午日冲开子水、补旺巳午火，立见康复。',
            'rule': '自占病喜子孙发动，子孙动则克制病魔，六合化六合亦主病体回春。'
        },
        {
            'id': 'quiz_05',
            'title': '申月戊子日 占行人在何处',
            'case_ref': '申月 戊子日 占行人在何处',
            'question': '申月 戊子日 (旬空：午未)，占行人何日归，得“地风升”化“地水师”。用神兄弟持世还是在外？',
            'options': [
                '行人已在归途，用神在初爻动化父母，申日必至。',
                '行人不归，因官鬼持世。',
                '行人已远走他乡，用神落空。',
                '行人受阻于官府，无法动身。'
            ],
            'correct_index': 0,
            'explanation': '《增删卜易》【行人章】野鹤断法：初爻动变，初爻为足、为动，用神得日辰生合，动化回头生，出空逢值之日人必回抵。',
            'rule': '占行人以用神动静为归期，初爻动变或用神化进者，动身极速。'
        }
    ]

def generate_knowledge_tree():
    return [
        {
            'id': 'stage_0',
            'title': '第一阶：入门筑基与起卦装卦',
            'description': '掌握八卦象数、铜钱起卦法、浑天甲子纳甲法、安世应与定六亲歌诀。',
            'chapters': ['ch_001', 'ch_002', 'ch_003', 'ch_004', 'ch_005', 'ch_006', 'ch_007', 'ch_008', 'ch_009'],
            'key_skills': ['手摇铜钱起卦', '八宫纳甲排盘', '安六亲与定世应', '识动爻与辨变卦']
        },
        {
            'id': 'stage_1',
            'title': '第二阶：干支五行与用神生克',
            'description': '确立用神、辨元神忌神仇神、掌握五行相生相克与克处逢生之妙谛。',
            'chapters': ['ch_010', 'ch_011', 'ch_012', 'ch_013', 'ch_014', 'ch_015', 'ch_016', 'ch_017'],
            'key_skills': ['精准取用神', '辨别元神与忌神力量', '克处逢生通关法则', '四时旺相休囚死']
        },
        {
            'id': 'stage_2',
            'title': '第三阶：日月司权与神煞吉凶',
            'description': '领会月将（月建）、日辰之至高提纲，融会六神、六合、三合、六冲、三刑六害与暗动动散。',
            'chapters': ['ch_018', 'ch_019', 'ch_020', 'ch_021', 'ch_022', 'ch_023', 'ch_024', 'ch_025', 'ch_026', 'ch_027'],
            'key_skills': ['月将当权逢伤无害', '日辰同功与暗动辨析', '三合局与六合六冲吉凶', '动散与冲散之分']
        },
        {
            'id': 'stage_3',
            'title': '第四阶：核心断卦玄机（野鹤秘传）',
            'description': '深入野鹤老人辨乱反正之核心秘诀：旬空真空、月破出破、进神退神、随鬼入墓、独发与两现。',
            'chapters': ['ch_028', 'ch_029', 'ch_030', 'ch_031', 'ch_032', 'ch_033', 'ch_034', 'ch_035', 'ch_036', 'ch_037', 'ch_038', 'ch_039', 'ch_040', 'ch_041'],
            'key_skills': ['旬空动不为空精解', '月破逢合出月有用', '进神退神动变四法', '随鬼入墓三种实战断法', '独发易见一爻定乾坤']
        },
        {
            'id': 'stage_4',
            'title': '第五阶：黄金策千金赋通释与分类大占',
            'description': '研读刘诚意原著、野鹤增删之《黄金策·千金赋》，全面覆盖身命、终身财福、寿元功名等大宗之占。',
            'chapters': ['ch_042', 'ch_043', 'ch_044', 'ch_045', 'ch_046', 'ch_047', 'ch_048', 'ch_049'],
            'key_skills': ['千金赋百句全解', '终身身命与寿元推断', '功名有无与求官品级', '终身财福格局']
        },
        {
            'id': 'stage_5',
            'title': '第六阶：分类人事精进占断',
            'description': '全面实战：学业科考、商贾买卖、婚姻胎产、官非词讼、疾病医药、出行行人、阳宅家宅、阴宅茔葬。',
            'chapters': ['ch_050', 'ch_060', 'ch_070', 'ch_080', 'ch_090', 'ch_100', 'ch_110', 'ch_120', 'ch_130'],
            'key_skills': ['近病久病断法', '买卖求财赢亏时机', '官司输赢与避害之道', '家宅阳宅六神吉凶', '寻地立穴与祖茔修补']
        }
    ]

def main():
    toc_text, body_text = load_raw_text()
    chapters = parse_volumes_and_chapters(body_text)
    cases = parse_all_cases(chapters, body_text)
    concepts = generate_concepts()
    knowledge_tree = generate_knowledge_tree()
    quizzes = generate_quizzes()

    os.makedirs('src/data', exist_ok=True)
    
    with open('src/data/chapters.json', 'w', encoding='utf-8') as f:
        json.dump(chapters, f, ensure_ascii=False, indent=2)
        
    with open('src/data/cases.json', 'w', encoding='utf-8') as f:
        json.dump(cases, f, ensure_ascii=False, indent=2)

    with open('src/data/concepts.json', 'w', encoding='utf-8') as f:
        json.dump(concepts, f, ensure_ascii=False, indent=2)

    with open('src/data/knowledge_tree.json', 'w', encoding='utf-8') as f:
        json.dump(knowledge_tree, f, ensure_ascii=False, indent=2)

    with open('src/data/quizzes.json', 'w', encoding='utf-8') as f:
        json.dump(quizzes, f, ensure_ascii=False, indent=2)

    print(f"Successfully generated:")
    print(f"- Chapters: {len(chapters)}")
    print(f"- Cases: {len(cases)}")
    print(f"- Concepts: {len(concepts)}")
    print(f"- Knowledge Tree Stages: {len(knowledge_tree)}")
    print(f"- Quizzes: {len(quizzes)}")

if __name__ == '__main__':
    main()
