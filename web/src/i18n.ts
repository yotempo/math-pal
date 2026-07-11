import { createContext, useContext } from 'react';

// Admin-panel i18n. The kid-facing UI stays English (it matches the study
// language); the admin panel is bilingual since the project is open source.
// The choice is per-device (localStorage), defaulting to the browser language.

export type AdminLang = 'zh' | 'en';

const zh = {
  loading: '載入中...',
  adminTitle: '👨‍👧 家長後台',
  pinPrompt: '請輸入 PIN 碼（預設 1234，可在設定中修改）',
  enter: '進入',
  backHome: '← 回首頁',
  wrongPin: 'PIN 錯誤',

  tabOverview: '總覽',
  tabQuestions: '題庫',
  tabRewards: '獎品',
  tabRedemptions: '兌換審核',
  tabChats: 'AI 對話',
  tabSettings: '設定',

  weekTitle: '本週狀況',
  currentPoints: '目前積分',
  answered7d: '近 7 天答題',
  accuracy: '正確率',
  pendingRedemptions: '待審核兌換',
  deltaPlaceholder: '±積分',
  reasonPlaceholder: '原因（例如：主動幫忙做家事）',
  adjustPoints: '調整積分',
  parentAdjust: '家長調整',
  topicAccuracy: '各主題正確率（首次作答）',
  colTopic: '主題',
  colKind: '類型',
  colCount: '題數',
  kindWord: '應用題',
  kindArith: '算術',
  redNote: '紅色 = 正確率低於 70%，AI 家教會自動針對弱項多加引導。',
  recentAttempts: '近 7 天作答紀錄',
  colTime: '時間',
  colQuestion: '題目',
  colGiven: '作答',
  colResult: '結果',
  colElapsed: '耗時',
  colAvgTime: '平均耗時',
  idleTag: '🛌 掛機',
  slowTag: '🐢 偏慢',
  correctAnswerLabel: '正解',
  slowNote: '🐢 = 這個主題比她同難度的平均速度慢很多（視為弱項，AI 家教與出題都會照顧）。耗時超過 15 分鐘視為掛機，照樣記錄但不列入統計。',
  attemptNo: '（第{0}次）',
  pointsLedger: '積分紀錄',

  genTitle: '🤖 AI 出題',
  genDesc: 'AI 生成後會由另一個獨立 AI「盲解」驗證答案（看不到出題者的答案），再進待審核區——你批准後才會出現在題目池裡。',
  topicAuto: '主題：自動（優先弱項）',
  diffAuto: '難度：自動',
  diffN: '難度 {0}',
  themeRandom: '風格：隨機',
  countN: '{0} 題',
  generate: '生成',
  generating: '生成中…',
  genProgress: '生成 + 盲解驗證中（{0}/{1} 完成）…本地模型每題約 1-3 分鐘，可以先去別的分頁，回來看結果。',
  genFailed: '生成失敗',
  verifiedPass: '✅ 盲解驗證通過',
  solverFailedMsg: '⚠️ 盲解執行失敗（AI 連線問題）— 請自行驗算後再上架',
  mismatch: '⚠️ 盲解不一致（出題者答 {0}，解題者答 {1}）— 建議自己算過或刪除',
  answerLabel: '答案',
  genDone: '已放入下方題庫（待審核），確認沒問題後按「上架」。',

  qBankTitle: '應用題題庫（{0} 題{1}）',
  pendingSuffix: '，{0} 題 AI 待審核',
  addQuestion: '＋ 新增題目',
  editQuestion: '編輯題目',
  newQuestion: '新增應用題',
  fieldPrompt: '題目（英文——配合小孩的學習語言）',
  fieldAnswerType: '答案格式',
  typeNumber: '數字',
  typeFraction: '分數',
  typeText: '文字（如 5:15 PM）',
  fieldDifficulty: '難度 (1-5)',
  fieldTheme: '風格主題',
  fieldActive: '啟用',
  statusActive: '啟用',
  statusInactive: '停用',
  statusPending: '待審核',
  hintN: '提示 {0}（由淺到深）',
  fieldExplanation: '詳解（答對後顯示）',
  save: '儲存',
  cancel: '取消',
  publish: '上架',
  edit: '編輯',
  del: '刪除',
  confirmDelete: '確定刪除這一題？作答紀錄會保留。',
  confirmUnverified: '這一題「盲解驗證」沒有通過——建議先自己算一遍確認答案正確。仍要上架嗎？',
  saveFailed: '儲存失敗',
  deleteFailed: '刪除失敗',
  publishFailed: '上架失敗',
  badgeVerified: 'AI ✓已驗證',
  badgeUnverified: 'AI ⚠️未驗證',
  colStatus: '狀態',

  rewardsTitle: '獎品清單',
  rewardNamePlaceholder: '獎品名稱（英文顯示給小孩）',
  add: '新增',
  colName: '名稱',
  colCost: '積分',
  listed: '上架',
  unlisted: '下架',
  confirmDeleteReward: '刪除這個獎品？',

  redemptionsTitle: '兌換申請',
  colReward: '獎品',
  statusPendingR: '⏳ 待審核',
  statusApproved: '✅ 已批准',
  statusRejected: '↩️ 已退回',
  approve: '批准',
  rejectRefund: '退回並退還積分',
  noRedemptions: '還沒有兌換申請。',

  chatsDesc: '小孩和 AI 夥伴的每一句對話都會記錄在這裡（最新在前）。AI 被設定為只談數學、不給答案、離題會轉回來。',
  noChats: '還沒有對話紀錄。',
  studentLabel: '學生',
  offlineHint: '（離線提示）',

  curriculumTitle: '📚 課程範圍',
  curriculumDesc: '勾選 = 小孩目前會遇到的主題，全站生效（練習、應用題、挑戰關卡、AI 出題）。開學後可以把複習範圍取消勾選，只留進度內的主題。記得按下方「儲存設定」。',
  checkAll: '全部勾選',
  uncheckAll: '全部取消',
  kindBoth: '計算＋應用題',
  kindWordOnly: '應用題',
  kindArithOnly: '計算',
  atLeastOne: '至少要勾選一個主題才能儲存。',

  aiEngineTitle: 'AI 夥伴引擎',
  aiInUse: '使用的 AI',
  keySet: ' ✓ 已設定金鑰',
  keyUnset: ' ✗ 未設定金鑰',
  modelSuffix: '模型',
  ollamaLabel: 'Ollama（本地）',
  noKeyNeeded: '（免金鑰）',
  aiKeyNote: 'API 金鑰放在伺服器的 server/.env（ANTHROPIC_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY / OLLAMA_BASE_URL），不會存進資料庫。切換後立即生效，不用重啟。目前狀態：',
  aiFallbackLabel: '備用 AI（主要 AI 失敗時自動改用）',
  fallbackNone: '無',
  aiBudgetLabel: '每月付費 AI 預算上限（USD，0 = 不限）',
  aiUsageLine: '本月估計已用 ${0}／預算 {1}',
  aiUsageUnlimited: '不限',
  aiUsageNote: '費用為字元數換算的估算值（僅供參考）。達到上限後付費 AI 自動暫停到月底，本地 Ollama 不受影響。',

  coinTitle: '💰 金幣發行曲線',
  coinDesc: '獎品定價保持不變（例如漫畫永遠 2000 金幣），但隨著她「累積賺到」的金幣越多，每筆獎勵會依倍率縮水——用來控制拿到獎品的節奏（預設：第一本 ~10 天、第二本 ~15 天、之後 ~20 天）。階段以累積賺到的總數判定，花掉不會重置。',
  coinPhase: '第 {0} 階段',
  coinUntil: '累積到（金幣）',
  coinUntilFinal: '之後（無上限）',
  coinMult: '發行倍率',
  coinStatus: '目前：第 {0} 階段（倍率 ×{1}）｜累積已賺 {2} 金幣｜近 7 天平均每日入帳 {3} 金幣',

  basicTitle: '基本設定',
  studentName: '小孩名字',
  buddyName: 'AI 夥伴名字',
  baseDifficulty: '基準難度 (1-5)',
  tutorLang: 'AI 回覆語言',
  interestsLabel: '興趣（給 AI 出題/鼓勵用）',
  adminPin: '後台 PIN',
  saveSettings: '儲存設定',
  savedOk: '已儲存 ✓',
  autoDiffNote: '系統會依近期正確率自動微調難度（正確率 >85% 升一級，<50% 降一級）。',

  notesTitle: '給 AI 家教的備註',
  notesDesc: '這些備註會提供給 AI 家教參考，例如：「最近在學分數除法，多鼓勵她畫圖」。',

  langLabel: '介面語言',
};

const en: Record<keyof typeof zh, string> = {
  loading: 'Loading...',
  adminTitle: '👨‍👧 Parent Admin',
  pinPrompt: 'Enter the PIN (default 1234 — change it in Settings)',
  enter: 'Enter',
  backHome: '← Home',
  wrongPin: 'Wrong PIN',

  tabOverview: 'Overview',
  tabQuestions: 'Questions',
  tabRewards: 'Rewards',
  tabRedemptions: 'Redemptions',
  tabChats: 'AI Chats',
  tabSettings: 'Settings',

  weekTitle: 'This Week',
  currentPoints: 'Points',
  answered7d: 'Answered (7 days)',
  accuracy: 'Accuracy',
  pendingRedemptions: 'Pending redemptions',
  deltaPlaceholder: '±points',
  reasonPlaceholder: 'Reason (e.g. helped with chores)',
  adjustPoints: 'Adjust points',
  parentAdjust: 'Parent adjustment',
  topicAccuracy: 'Accuracy by Topic (first attempts)',
  colTopic: 'Topic',
  colKind: 'Type',
  colCount: 'Count',
  kindWord: 'Word problems',
  kindArith: 'Drills',
  redNote: 'Red = accuracy below 70%. The AI tutor automatically gives extra guidance on weak topics.',
  recentAttempts: 'Last 7 Days Log',
  colTime: 'Time',
  colQuestion: 'Question',
  colGiven: 'Answer given',
  colResult: 'Result',
  colElapsed: 'Time spent',
  colAvgTime: 'Avg time',
  idleTag: '🛌 idle',
  slowTag: '🐢 slow',
  correctAnswerLabel: 'Answer',
  slowNote: '🐢 = takes much longer than her same-difficulty average (treated as a weak spot by the AI tutor and generator). Over 15 minutes counts as idle — recorded, but excluded from stats.',
  attemptNo: ' (try {0})',
  pointsLedger: 'Points History',

  genTitle: '🤖 AI Question Generator',
  genDesc: 'After generating, a separate AI "blind-solves" each problem (without seeing the claimed answer) to cross-check it. Problems land in a pending queue — nothing reaches the student until you publish it.',
  topicAuto: 'Topic: auto (weak topics first)',
  diffAuto: 'Difficulty: auto',
  diffN: 'Level {0}',
  themeRandom: 'Theme: random',
  countN: '{0} problem(s)',
  generate: 'Generate',
  generating: 'Generating…',
  genProgress: 'Generating + blind-solve verifying ({0}/{1} done)… Local models take ~1-3 min per problem. Feel free to switch tabs and come back.',
  genFailed: 'Generation failed',
  verifiedPass: '✅ Blind-solve verified',
  solverFailedMsg: '⚠️ Blind-solve errored (AI connection issue) — check the math yourself before publishing',
  mismatch: '⚠️ Blind-solve mismatch (author: {0}, solver: {1}) — verify the math yourself or delete',
  answerLabel: 'Answer',
  genDone: 'Added to the bank below as pending. Review, then press "Publish".',

  qBankTitle: 'Word Problem Bank ({0} problems{1})',
  pendingSuffix: ', {0} pending AI review',
  addQuestion: '+ Add problem',
  editQuestion: 'Edit Problem',
  newQuestion: 'New Word Problem',
  fieldPrompt: "Problem (in English — the kid's study language)",
  fieldAnswerType: 'Answer format',
  typeNumber: 'Number',
  typeFraction: 'Fraction',
  typeText: 'Text (e.g. 5:15 PM)',
  fieldDifficulty: 'Difficulty (1-5)',
  fieldTheme: 'Theme',
  fieldActive: 'Active',
  statusActive: 'Active',
  statusInactive: 'Inactive',
  statusPending: 'Pending review',
  hintN: 'Hint {0} (gentle → specific)',
  fieldExplanation: 'Explanation (shown after solving)',
  save: 'Save',
  cancel: 'Cancel',
  publish: 'Publish',
  edit: 'Edit',
  del: 'Delete',
  confirmDelete: 'Delete this problem? Attempt history is kept.',
  confirmUnverified: 'This problem FAILED blind-solve verification — check the math yourself first. Publish anyway?',
  saveFailed: 'Save failed',
  deleteFailed: 'Delete failed',
  publishFailed: 'Publish failed',
  badgeVerified: 'AI ✓verified',
  badgeUnverified: 'AI ⚠️unverified',
  colStatus: 'Status',

  rewardsTitle: 'Rewards',
  rewardNamePlaceholder: 'Reward name (shown to the kid)',
  add: 'Add',
  colName: 'Name',
  colCost: 'Cost',
  listed: 'Listed',
  unlisted: 'Unlisted',
  confirmDeleteReward: 'Delete this reward?',

  redemptionsTitle: 'Redemption Requests',
  colReward: 'Reward',
  statusPendingR: '⏳ Pending',
  statusApproved: '✅ Approved',
  statusRejected: '↩️ Returned',
  approve: 'Approve',
  rejectRefund: 'Return & refund points',
  noRedemptions: 'No redemption requests yet.',

  chatsDesc: 'Every message between the student and the AI buddy is logged here (newest first). The AI is instructed to stay on math, never reveal answers, and redirect off-topic chat.',
  noChats: 'No chats yet.',
  studentLabel: 'Student',
  offlineHint: ' (offline hint)',

  curriculumTitle: '📚 Curriculum Scope',
  curriculumDesc: 'Checked = topics the student currently sees. Applies everywhere: drills, word problems, challenge levels, and AI generation. When school starts, uncheck the review group and keep only in-progress topics. Remember to press "Save settings" below.',
  checkAll: 'Check all',
  uncheckAll: 'Uncheck all',
  kindBoth: 'drills + word',
  kindWordOnly: 'word problems',
  kindArithOnly: 'drills',
  atLeastOne: 'At least one topic must stay checked.',

  aiEngineTitle: 'AI Buddy Engine',
  aiInUse: 'Active AI',
  keySet: ' ✓ key set',
  keyUnset: ' ✗ no key',
  modelSuffix: 'model',
  ollamaLabel: 'Ollama (local)',
  noKeyNeeded: ' (no key needed)',
  aiKeyNote: 'API keys live in server/.env (ANTHROPIC_API_KEY / GEMINI_API_KEY / OPENAI_API_KEY / OLLAMA_BASE_URL) and are never stored in the database. Switching takes effect immediately. Current status: ',
  aiFallbackLabel: 'Backup AI (used automatically when the active one fails)',
  fallbackNone: 'None',
  aiBudgetLabel: 'Monthly paid-AI budget cap (USD, 0 = unlimited)',
  aiUsageLine: 'Est. spend this month: ${0} / budget {1}',
  aiUsageUnlimited: 'unlimited',
  aiUsageNote: 'Costs are character-count estimates (informational). When the cap is hit, paid AI pauses until next month; local Ollama is never affected.',

  coinTitle: '💰 Coin Issuance Curve',
  coinDesc: 'Reward prices stay fixed (a manga is always 2000 coins), but each reward shrinks by the phase multiplier as her LIFETIME earnings grow — pacing how fast rewards are reached (default: 1st in ~10 days, 2nd ~15, later ~20). Phases key on lifetime earned; spending never resets them.',
  coinPhase: 'Phase {0}',
  coinUntil: 'Until lifetime (coins)',
  coinUntilFinal: 'Afterwards (no cap)',
  coinMult: 'Multiplier',
  coinStatus: 'Now: phase {0} (×{1}) | lifetime earned {2} | avg {3} coins/day (7d)',

  basicTitle: 'General',
  studentName: "Kid's name",
  buddyName: 'AI buddy name',
  baseDifficulty: 'Base difficulty (1-5)',
  tutorLang: 'AI reply language',
  interestsLabel: 'Interests (for AI problems & encouragement)',
  adminPin: 'Admin PIN',
  saveSettings: 'Save settings',
  savedOk: 'Saved ✓',
  autoDiffNote: 'Difficulty auto-adjusts with recent accuracy (>85% moves up a level, <50% moves down).',

  notesTitle: 'Notes for the AI Tutor',
  notesDesc: 'These notes are passed to the AI tutor. E.g. "She is learning fraction division — encourage her to draw pictures."',

  langLabel: 'Language',
};

export const ADMIN_STRINGS: Record<AdminLang, typeof zh> = { zh, en };
export type StringKey = keyof typeof zh;

const LANG_STORAGE_KEY = 'mathpal_admin_lang';

export function getAdminLang(): AdminLang {
  const saved = localStorage.getItem(LANG_STORAGE_KEY);
  if (saved === 'zh' || saved === 'en') return saved;
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function saveAdminLang(lang: AdminLang) {
  localStorage.setItem(LANG_STORAGE_KEY, lang);
}

export function translate(lang: AdminLang, key: StringKey, ...args: (string | number)[]): string {
  let s: string = ADMIN_STRINGS[lang][key] ?? key;
  args.forEach((a, i) => { s = s.replaceAll(`{${i}}`, String(a)); });
  return s;
}

export interface I18n {
  lang: AdminLang;
  t: (key: StringKey, ...args: (string | number)[]) => string;
  setLang: (lang: AdminLang) => void;
}

export const I18nContext = createContext<I18n>({
  lang: 'zh',
  t: (k) => k,
  setLang: () => {},
});

export function useT(): I18n {
  return useContext(I18nContext);
}

// Bilingual labels coming from the server (curriculum groups/topics)
export function pickLabel(label: { zh: string; en: string } | string | undefined, lang: AdminLang): string {
  if (!label) return '';
  if (typeof label === 'string') return label;
  return label[lang] ?? label.zh;
}
