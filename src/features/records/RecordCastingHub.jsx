import React, { useEffect, useMemo, useState } from 'react';
import { assemblePaipanBoard, resolveLineFromBackCount, resolveYongShen, WORLD_LINE_EVENTS } from '../../lib/paipanEngine';
import { resolveGanzhiFromDate } from '../../lib/ganzhiCalendar';
import { createRecord, loadRecords, saveRecord, updateRecord, deleteRecord, matchCasesForRecord } from '../../lib/recordService';
import { castInputSchema, CASE_EVENT_TYPES } from '../../lib/schema';
import PaipanCardLayout from '../../components/common/PaipanCardLayout';
import LunarDateTimePicker, { toLocalValue } from '../../components/common/LunarDateTimePicker';
import YaoLine from '../../components/common/YaoLine';
import casesData from '../../data/cases_v2.json';
import { formatRecordText } from '../../lib/boardTextExport';
import { copyTextToClipboard } from '../../lib/clipboard';
import { Dices, Save, ChevronDown, ChevronUp, Trash2, Copy, Check, ExternalLink } from 'lucide-react';

// 记录列表里展示用：起卦时间优先，旧记录回退到保存时间
function formatCastTime(record) {
  const raw = record.castAt || record.createdAt;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-CN', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// 以世爻为用的事类（如出行）没有固定六亲用神，盘面用神位显示"以世爻为用"
function yongShenFallbackFor(eventType, tags) {
  return tags?.yongShen || (WORLD_LINE_EVENTS.includes(eventType) ? '世爻' : null);
}

const YAO_LABELS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
const MATCH_PREVIEW_LIMIT = 6;
const MATCH_GROUPS = [
  { key: 'sameKeyPoint', label: '同要点' },
  { key: 'sameEventAndStatus', label: '同事类 + 同用神状态' },
  { key: 'samePatterns', label: '同格局' }
];
const BACK_COUNT_OPTIONS = [
  { value: 0, label: '0 背（老阴 ✕ 动）' },
  { value: 1, label: '1 背（少阳 静）' },
  { value: 2, label: '2 背（少阴 静）' },
  { value: 3, label: '3 背（老阳 ◯ 动）' }
];

export default function RecordCastingHub({ onSelectCase }) {
  const [eventType, setEventType] = useState(CASE_EVENT_TYPES[0]);
  const [isCustomEvent, setIsCustomEvent] = useState(false);
  const [customEventType, setCustomEventType] = useState('');
  const [question, setQuestion] = useState('');
  const [castAtValue, setCastAtValue] = useState(() => toLocalValue(new Date()));
  const [tosses, setTosses] = useState([null, null, null, null, null, null]);
  const [myJudgment, setMyJudgment] = useState('');
  const [formError, setFormError] = useState('');
  const [preview, setPreview] = useState(null); // { board, resolution, eventType, question }
  const [saveMessage, setSaveMessage] = useState('');

  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // 删除二次确认
  const [editSavedId, setEditSavedId] = useState(null); // 回填保存反馈
  const [copiedId, setCopiedId] = useState(null); // 复制反馈：'preview' 或 record.id
  const [editBuffers, setEditBuffers] = useState({}); // id -> { actualOutcome, reflection }

  useEffect(() => {
    setRecords(loadRecords());
  }, []);

  const effectiveEventType = isCustomEvent ? customEventType.trim() : eventType;

  // 起卦时间对应的农历与年月日干支（月建按节气定，随输入框实时更新）
  const castAtGanzhi = useMemo(() => {
    const date = new Date(castAtValue);
    if (Number.isNaN(date.getTime())) return null;
    return resolveGanzhiFromDate(date);
  }, [castAtValue]);

  const handleGenerate = () => {
    setFormError('');
    setSaveMessage('');
    setPreview(null);

    if (!effectiveEventType) {
      setFormError('占问事类必填。');
      return;
    }
    if (tosses.some(t => t === null)) {
      setFormError('请把六次背数（初爻至上爻）都填上。');
      return;
    }

    const castAt = new Date(castAtValue);
    const inputCheck = castInputSchema.safeParse({
      eventType: effectiveEventType,
      question: question || undefined,
      tosses: tosses.map(backCount => ({ backCount })),
      castAt: castAt.toISOString()
    });
    if (!inputCheck.success) {
      setFormError('起卦输入不合法：' + inputCheck.error.issues.map(i => i.message).join('；'));
      return;
    }

    const ganzhi = resolveGanzhiFromDate(castAt);
    const rawLines = tosses.map(backCount => resolveLineFromBackCount(backCount));

    let board = assemblePaipanBoard({
      rawLines,
      monthBranch: ganzhi.monthBranch,
      dayStem: ganzhi.dayStem,
      dayBranch: ganzhi.dayBranch,
      question: question || effectiveEventType,
      yongShenKey: ''
    });

    const resolution = resolveYongShen(effectiveEventType, board);
    if (resolution.key) {
      board = assemblePaipanBoard({
        rawLines,
        monthBranch: ganzhi.monthBranch,
        dayStem: ganzhi.dayStem,
        dayBranch: ganzhi.dayBranch,
        question: question || effectiveEventType,
        yongShenKey: resolution.key
      });
    }

    setPreview({ board, resolution, eventType: effectiveEventType, question, yearGanzhi: ganzhi.yearGanzhi });
  };

  const handleSaveRecord = () => {
    if (!preview) return;
    const record = createRecord({
      eventType: preview.eventType,
      question: preview.question,
      board: preview.board,
      resolution: preview.resolution,
      myJudgment,
      castAt: new Date(castAtValue).toISOString()
    });
    const next = saveRecord(record);
    setRecords(next);
    setSaveMessage('已存入卦例库。');
    setMyJudgment('');
    setPreview(null);
    setTosses([null, null, null, null, null, null]);
  };

  const previewMatches = useMemo(() => {
    if (!preview) return null;
    const draftRecord = { tags: { eventType: preview.eventType, yongShenStatus: [], patterns: preview.board.patterns } };
    return matchCasesForRecord(draftRecord, casesData);
  }, [preview]);

  const hasAnyMatch = previewMatches && (
    previewMatches.sameKeyPoint.length + previewMatches.sameEventAndStatus.length + previewMatches.samePatterns.length > 0
  );

  const startEdit = (record) => {
    setExpandedId(prev => (prev === record.id ? null : record.id));
    setEditBuffers(prev => ({
      ...prev,
      [record.id]: prev[record.id] || { actualOutcome: record.actualOutcome || '', reflection: record.reflection || '' }
    }));
  };

  const handleSaveEdit = (record) => {
    const buf = editBuffers[record.id] || {};
    const next = updateRecord(record.id, {
      actualOutcome: buf.actualOutcome || undefined,
      reflection: buf.reflection || undefined
    });
    setRecords(next);
    setEditSavedId(record.id);
    setTimeout(() => setEditSavedId(prev => (prev === record.id ? null : prev)), 2000);
  };

  const handleCopyRecord = async (record) => {
    const ok = await copyTextToClipboard(
      formatRecordText(record, yongShenFallbackFor(record.eventType, record.tags))
    );
    if (!ok) return;
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(prev => (prev === record.id ? null : prev)), 2000);
  };

  const handleCopyPreview = async () => {
    if (!preview) return;
    const draft = {
      eventType: preview.eventType,
      question: preview.question,
      board: preview.board,
      castAt: new Date(castAtValue).toISOString(),
      myJudgment,
      tags: { yongShen: preview.resolution.key || undefined }
    };
    const ok = await copyTextToClipboard(
      formatRecordText(draft, yongShenFallbackFor(preview.eventType, draft.tags))
    );
    if (!ok) return;
    setCopiedId('preview');
    setTimeout(() => setCopiedId(prev => (prev === 'preview' ? null : prev)), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

      {/* 起卦输入表单 */}
      <div className="bg-white border border-[#EAE6DC] rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-bold font-serif-sc text-stone-900">起卦记录</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">占问事类（必填）:</label>
            {!isCustomEvent ? (
              <select
                value={eventType}
                onChange={(e) => {
                  if (e.target.value === '__custom__') { setIsCustomEvent(true); return; }
                  setEventType(e.target.value);
                }}
                className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50"
              >
                {CASE_EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="__custom__">自定义…</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customEventType}
                  onChange={(e) => setCustomEventType(e.target.value)}
                  placeholder="输入事类"
                  className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50"
                />
                <button onClick={() => setIsCustomEvent(false)} className="text-xs text-stone-500 hover:text-stone-800 shrink-0 cursor-pointer">取消</button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">具体问题（可选）:</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="一行文字，仅作记录"
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 mb-1">起卦时间:</label>
            <LunarDateTimePicker value={castAtValue} onChange={setCastAtValue} />
            {castAtGanzhi && (
              <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-[#FBF9F5] border border-[#EAE6DC] text-[11px] text-stone-600 flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>农历 <strong className="text-stone-900 font-serif-sc">{castAtGanzhi.lunarDate}</strong></span>
                <span className="text-stone-300">|</span>
                <span>{castAtGanzhi.yearGanzhi}年</span>
                <span>{castAtGanzhi.monthGanzhi}月</span>
                <span>{castAtGanzhi.dayGanzhi}日</span>
                <span className="text-stone-400">（月建 {castAtGanzhi.monthBranch}，按节气定）</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-2">六次背数（初爻至上爻，逐次输入）:</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {YAO_LABELS.map((label, idx) => {
              const val = tosses[idx];
              const line = val !== null ? resolveLineFromBackCount(val) : null;
              return (
                <div key={idx} className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-stone-400">{label}</span>
                  <select
                    value={val === null ? '' : val}
                    onChange={(e) => {
                      const next = [...tosses];
                      next[idx] = e.target.value === '' ? null : Number(e.target.value);
                      setTosses(next);
                    }}
                    className="w-full text-xs border border-stone-200 rounded-lg px-1 py-1 bg-white"
                  >
                    <option value="">背数…</option>
                    {BACK_COUNT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <div className="h-4 flex items-center">
                    {line ? <YaoLine yinYang={line.yinYang} isMoving={line.isMoving} size="sm" compact /> : <span className="text-stone-300 text-xs">···</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {formError && <p className="text-xs text-red-600">{formError}</p>}

        <button
          onClick={handleGenerate}
          className="px-5 py-2 rounded-xl font-bold text-sm bg-[#C0392B] hover:bg-[#A93226] text-white flex items-center gap-2 cursor-pointer"
        >
          <Dices className="w-4 h-4" /> 生成排盘
        </button>
      </div>

      {/* 排盘结果预览 + 存档 */}
      {preview && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              onClick={handleCopyPreview}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                copiedId === 'preview'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
              }`}
              title="复制盘面与判断（纯文本，便于粘给其他 AI 追问）"
            >
              {copiedId === 'preview' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedId === 'preview' ? '已复制' : '复制盘面'}
            </button>
          </div>

          <PaipanCardLayout
            board={preview.board}
            yongShenFallback={yongShenFallbackFor(preview.eventType, { yongShen: preview.resolution.key })}
          />

          {preview.resolution.note && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
              💡 用神取法（{preview.eventType}）：{preview.resolution.note}
            </div>
          )}

          {hasAnyMatch && (
            <div className="bg-white border border-[#EAE6DC] rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-stone-700">按标签匹配的书中实例</h4>
              {MATCH_GROUPS.map(group => {
                const list = previewMatches[group.key];
                if (!list?.length) return null;
                return (
                  <div key={group.key} className="space-y-1.5">
                    <div className="text-[11px] text-stone-500">{group.label}：{list.length} 条{list.length > MATCH_PREVIEW_LIMIT ? `（列出前 ${MATCH_PREVIEW_LIMIT} 条）` : ''}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {list.slice(0, MATCH_PREVIEW_LIMIT).map(c => (
                        <button
                          key={c.id}
                          onClick={() => onSelectCase && onSelectCase(c.id)}
                          disabled={!onSelectCase}
                          className={`text-left px-2.5 py-1.5 rounded-lg bg-stone-50 border border-stone-200/60 text-xs transition-all group ${
                            onSelectCase ? 'hover:bg-amber-50/80 hover:border-[#C0392B]/30 cursor-pointer' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-stone-800 group-hover:text-[#C0392B] truncate">{c.title}</span>
                            {onSelectCase && <ExternalLink className="w-3 h-3 text-stone-400 group-hover:text-[#C0392B] shrink-0" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="bg-white border border-[#EAE6DC] rounded-2xl p-4 space-y-2">
            <label className="block text-xs font-semibold text-stone-600">我的判断（起卦当时写，事前）:</label>
            <textarea
              value={myJudgment}
              onChange={(e) => setMyJudgment(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50"
              placeholder="趁还没看结果，先写下自己的判断…"
            />
            <button
              onClick={handleSaveRecord}
              className="px-4 py-1.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" /> 存入卦例库
            </button>
          </div>
        </div>
      )}
      {saveMessage && <p className="text-xs text-emerald-700">{saveMessage}</p>}

      {/* 我的卦例库 */}
      <div className="bg-white border border-[#EAE6DC] rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#EAE6DC] flex items-center justify-between">
          <h3 className="text-base font-bold font-serif-sc text-stone-900">我的卦例库</h3>
          <span className="text-xs text-stone-400">{records.length} 条</span>
        </div>
        {records.length === 0 ? (
          <p className="px-5 py-6 text-xs text-stone-400">还没有存过卦例，起一卦试试。</p>
        ) : (
          <div className="divide-y divide-stone-100">
            {records.map(r => (
              <div key={r.id}>
                <button
                  onClick={() => startEdit(r)}
                  className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-900 truncate">
                      {r.board.benGua.full_name}{r.board.bianGua ? ` 之 ${r.board.bianGua.full_name}` : ''}
                      <span className="ml-2 text-xs text-stone-400 font-normal">{r.eventType}</span>
                    </div>
                    <div className="text-xs text-stone-500 truncate">
                      <span className="font-mono">{formatCastTime(r)}</span>
                      <span className="mx-1.5 text-stone-300">·</span>
                      <span>{r.board.dateGanzhi.month} {r.board.dateGanzhi.day}日</span>
                      {r.question && <><span className="mx-1.5 text-stone-300">·</span>{r.question}</>}
                    </div>
                  </div>
                  {expandedId === r.id ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
                </button>

                {expandedId === r.id && (
                  <div className="px-5 pb-5 space-y-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleCopyRecord(r)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                          copiedId === r.id
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100 hover:text-stone-900'
                        }`}
                        title="复制这条卦例（纯文本，便于粘给其他 AI 追问）"
                      >
                        {copiedId === r.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedId === r.id ? '已复制' : '复制卦例'}
                      </button>
                    </div>
                    <PaipanCardLayout board={r.board} yongShenFallback={yongShenFallbackFor(r.eventType, r.tags)} />
                    {r.myJudgment && (
                      <p className="text-xs text-stone-600"><strong className="text-stone-800">我的判断：</strong>{r.myJudgment}</p>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">应验结果（事后回填）:</label>
                      <textarea
                        value={editBuffers[r.id]?.actualOutcome || ''}
                        onChange={(e) => setEditBuffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], actualOutcome: e.target.value } }))}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-600 mb-1">复盘（判断偏差在哪、哪条规则用错了）:</label>
                      <textarea
                        value={editBuffers[r.id]?.reflection || ''}
                        onChange={(e) => setEditBuffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], reflection: e.target.value } }))}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg bg-stone-50"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleSaveEdit(r)}
                        className="px-4 py-1.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> 保存
                      </button>
                      {editSavedId === r.id && <span className="text-xs text-emerald-700">已保存</span>}

                      {/* 删除需点两次确认：卦例存在本地，删掉找不回 */}
                      {confirmDeleteId === r.id ? (
                        <span className="flex items-center gap-2 text-xs">
                          <span className="text-red-700">确定删除这条卦例？</span>
                          <button
                            onClick={() => {
                              setRecords(deleteRecord(r.id));
                              setConfirmDeleteId(null);
                              setExpandedId(null);
                            }}
                            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                          >
                            确认删除
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1.5 rounded-lg font-medium text-xs text-stone-500 hover:bg-stone-100 cursor-pointer"
                          >
                            取消
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(r.id)}
                          className="px-3 py-1.5 rounded-lg font-medium text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> 删除
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
