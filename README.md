# Math Pal 🏐

> A self-hosted math practice game for kids, with an AI study buddy that guides
> (Socratic-style, never reveals answers), auto-generated drills, AI-generated
> word problems with blind-solve cross-verification, points & rewards, and a
> parent admin panel. Runs on Claude / Gemini / OpenAI / local Ollama.
> Built by a dad for his daughter — themes and difficulty are configurable.

給小孩的數學學習遊戲。AI 夥伴陪做題、引導思路（蘇格拉底式，不直接給答案），
累積積分向家長兌換獎品。題目主題可圍繞小孩的愛好（預設：排球、排球少年 Haikyuu!!、我的英雄學院）。

## 架構

```
math_pal/
├── server/   Express + SQLite 後端（題庫、判分、積分、AI 家教 API）
│   ├── src/seedData.ts    應用題題庫種子（26 題）+ 獎品 + 關卡
│   ├── src/arithmetic.ts  算術題生成器（8 種主題 × 5 級難度，無限出題）
│   ├── src/tutor.ts       Claude AI 家教（含學生弱項分析、家長備註）
│   └── data/mathpal.db    SQLite 資料庫（自動建立）
└── web/      React (Vite) 前端，iPad 適配
```

## 快速開始

```bash
npm install                          # 安裝所有依賴
cp server/.env.example server/.env   # 填入 ANTHROPIC_API_KEY
npm run dev                          # 同時啟動後端 (8787) + 前端 (5173)
```

iPad 上打開 `http://<電腦或伺服器IP>:5173` 即可使用（vite 已設 `host: true`）。

沒有 API key 時 app 一樣能用 — AI 聊天會自動退回題庫內建提示。

## 功能

**小孩端（英文介面）**
- ⚡ Number Ninja：算術練習，難度可自動調整（正確率 >85% 升級、<50% 降級）
  - Saxon 2 複習：加減/乘/除/分數/小數/百分比/負數/運算順序
  - Saxon 3 先修：次方與開根號/解方程式/比例式/幾何（周長、面積、圓）
- 📖 Story Solver：主題應用題，答錯給漸進式提示，可隨時「Ask Kai」讓 AI 引導思路
- 🏆 Challenge Court：8 個關卡，星級評分 + 通關獎勵積分
- 🎁 Prize Locker：積分兌換獎品（需家長批准）
- 計分：首次答對全額（應用題 難度×3、算術 難度×2），第二次減半，看解答不給分

**家長後台（中文介面，`/admin`，預設 PIN 1234）**
- 總覽：週統計、各主題正確率（弱項標紅）、作答與積分紀錄、手動調整積分
- 題庫：應用題新增/編輯/停用（含提示與詳解）
- 獎品管理 + 兌換審核（退回自動退還積分）
- AI 對話：Elena 與 AI 的每句對話全紀錄，家長可隨時檢查
- 設定：基準難度、AI 語言、興趣關鍵字、PIN、給 AI 家教的備註

**AI 家教（`server/src/tutor.ts`）**
- **四種引擎可切換**（後台「設定 → AI 夥伴引擎」，即時生效）：Claude、Gemini、ChatGPT、本地 Ollama（在家離線用）。金鑰放 `server/.env`，不入資料庫
- 判分永遠由程式碼比對標準答案（`answers.ts`），AI 只負責引導思路，隨時可問
- 讀取近 30 天作答紀錄自動分析弱項（只送聚合標籤進 prompt，不塞歷史錯題）
- 絕不直接給答案；回覆短、適合 10-11 歲；會用她的興趣舉例
- **嚴格限定數學**：三層防護 —— (1) 聊天只能在進行中的題目情境下開啟；(2) 系統提示詞 STRICT SCOPE；(3) 所有對話記錄在後台「AI 對話」分頁供家長檢查（標注哪家 AI 回的）
- ⚠️ 提示詞防護效果與模型大小相關：雲端大模型（Claude/Gemini/GPT）遵守度高；本地小模型（如 llama3 8B）實測會被聊天話題帶偏——本地建議用 gpt-oss:20b 以上，並多翻對話紀錄

## 部署：本地 Docker（家用，目前的方式）

```bash
docker compose up -d --build   # 建置 + 啟動，開機自動復活（restart: unless-stopped）
```

- 單一容器：Express 同時服務 API 和打包好的前端，`http://<電腦IP>:8787` 一個網址搞定
- Elena 的資料存在 named volume `mathpal-data`，重建容器不會消失
  - 備份：`docker cp mathpal:/app/server/data/mathpal.db ./backup.db`
- 容器透過 `host.docker.internal` 連主機上的 Ollama；雲端 AI 金鑰加在 `docker-compose.yml` 的 `environment` 區塊
- **第一次要開防火牆**（以系統管理員 PowerShell 執行一次）：
  ```powershell
  New-NetFirewallRule -DisplayName "Math Pal (LAN 8787)" -Direction Inbound -Protocol TCP -LocalPort 8787 -Action Allow -Profile Private,Domain
  ```
- iPad（同一個 Wi-Fi）打開：`http://<電腦的區網IP>:8787`（用 `ipconfig` 查）
- 改了程式碼要更新：`docker compose up -d --build`

## 部署到 Oracle Cloud（之後）

1. VM 裝 Docker，`git clone` 後同樣 `docker compose up -d --build`
2. 把 `OLLAMA_BASE_URL` 移除或指向可達的位址，改用雲端 AI 金鑰
3. 建議前面加 caddy/nginx 做 HTTPS，並用防火牆限制來源
4. 備份 = 備份 `mathpal-data` volume（一個 SQLite 檔）

## 授權與免責聲明 / License & Disclaimer

程式碼以 [MIT License](LICENSE) 開源。

This is a non-commercial, fan-made educational project. It is not affiliated
with, sponsored, or endorsed by the rights holders of Haikyu!! or My Hero
Academia. Character names appear only as thematic flavor inside original math
problems written for this project; no copyrighted artwork, story text, or other
media is included. All trademarks belong to their respective owners. Themes are
fully configurable — swap in your own kid's interests via the admin panel and
seed data.

## Roadmap

- [x] Phase 2：AI 出題（弱項驅動 + 盲解交叉驗證 + 家長審核上架，見 REQUIREMENTS.md 約束 E）
- [ ] AI 批改開放式解題過程（不只比對數字答案）
- [ ] 每日任務 / 連續練習獎勵
- [ ] Capacitor 打包 iOS / Android
- [ ] 多用戶（如果妹妹弟弟也要玩 😄）
