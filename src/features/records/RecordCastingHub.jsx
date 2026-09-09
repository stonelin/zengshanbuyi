import React, { useEffect, useMemo, useState } from 'react';
import { assemblePaipanBoard, resolveLineFromBackCount, resolveYongShen } from '../../lib/paipanEngine';
import { resolveGanzhiFromDate } from '../../lib/ganzhiCalendar';
import { createRecord, loadRecords, saveRecord, updateRecord, deleteRecord, matchCasesForRecord } from '../../lib/recordService';
import { castInputSchema, CASE_EVENT_TYPES } from '../../lib/schema';
import PaipanCardLayout from '../../components/common/PaipanCardLayout';
import YaoLine from '../../components/common/YaoLine';
import casesData from '../../data/cases_v2.json';
import { Dices, Save, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';

const YAO_LABELS = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
const BACK_COUNT_OPTIONS = [
  { value: 0, label: '0 背（老阴 ✕ 动）' },
  { value: 1, label: '1 背（少阳 静）' },
  { value: 2, label: '2 背（少阴 静）' },
  { value: 3, label: '3 背（老阳 ◯ 动）' }
];

function toDatetimeLocalValue(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function RecordCastingHub() {
  const [eventType, setEventType] = useState(CASE_EVENT_TYPES[0]);
  const [isCustomEvent, setIsCustomEvent] = useState(false);
  const [customEventType, setCustomEventType] = useState('');
  const [question, setQuestion] = useState('');
  const [castAtValue, setCastAtValue] = useState(() => toDatetimeLocalValue(new Date()));
  const [tosses, setTosses] = useState([null, null, null, null, null, null]);
  const [myJudgment, setMyJudgment] = useState('');
  const [formError, setFormError] = useState('');
  const [preview, setPreview] = useState(null); // { board, resolution, eventType, question }
  const [saveMessage, setSaveMessage] = useState('');

  const [records, setRecords] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
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
      myJudgment
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
            <input
              type="datetime-local"
              value={castAtValue}
              onChange={(e) => setCastAtValue(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-stone-50 cursor-pointer"
            />
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
          <PaipanCardLayout board={preview.board} />

          {preview.resolution.note && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
              💡 用神取法（{preview.eventType}）：{preview.resolution.note}
            </div>
          )}

          {hasAnyMatch && (
            <div className="bg-white border border-[#EAE6DC] rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-stone-700">按标签匹配的书中实例</h4>
              {previewMatches.sameKeyPoint.length > 0 && <p className="text-xs text-stone-600">同要点：{previewMatches.sameKeyPoint.length} 条</p>}
              {previewMatches.sameEventAndStatus.length > 0 && <p className="text-xs text-stone-600">同事类+同用神状态：{previewMatches.sameEventAndStatus.length} 条</p>}
              {previewMatches.samePatterns.length > 0 && <p className="text-xs text-stone-600">同格局：{previewMatches.samePatterns.length} 条</p>}
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
                    <div className="text-xs text-stone-500 truncate">{r.question || r.board.dateGanzhi.day}</div>
                  </div>
                  {expandedId === r.id ? <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
                </button>

                {expandedId === r.id && (
                  <div className="px-5 pb-5 space-y-3">
                    <PaipanCardLayout board={r.board} />
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
                      <button
                        onClick={() => {
                          setRecords(deleteRecord(r.id));
                          setExpandedId(null);
                        }}
                        className="px-3 py-1.5 rounded-lg font-medium text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> 删除
                      </button>
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
