# 部署與交班指引

輔大新生全攻略：Next.js 前端 + JSON 資料 + 人機協同 AI Agent（Gemini）。

## 架構總覽

```
使用者 ──▶ Next.js 前端（甘特圖 / 手風琴 / 代辦清單）
                │  讀取
                ▼
         data/schedule.json  ◀── 寫入 ── 管理員後台 / AI Agent
                ▲
                │ 更新時程
     ┌──────────┴───────────┐
     │ 即時：/api/ai-sync     │ ← 後台按鈕，AI SDK + Gemini（AI Gateway）
     │ 排程：scripts/ai_agent │ ← Python，GitHub Actions 手動觸發
     └──────────────────────┘
```

- **管理密碼**：`1150912`（後台登入與所有寫入 API 皆會驗證）。
- **時程資料**：`data/schedule.json`，甘特圖與代辦清單皆由它驅動。

---

## 方案 A：部署到 Vercel（推薦，前端 + 即時 AI 對時）

1. 將專案推上 GitHub，於 [vercel.com](https://vercel.com) 匯入。
2. 即時 AI 對時使用 Vercel AI Gateway，Google (Gemini) 為零設定供應商，通常免額外金鑰即可運作。
3. 部署完成後：一般使用者看攻略；接班代理人點右上「管理員登入」→ 輸入密碼 → 「啟動 AI Agent 自動對時」。

> ⚠️ **重要：Serverless 檔案系統唯讀。**
> 在正式的 Vercel 環境中，`/api/schedule` 與 `/api/ai-sync` 寫回 `schedule.json`
> 只在該次請求的記憶體中有效，重新部署後即消失。若要「永久」保存每年交班的時程，
> 請改用下方 **方案 B** 的 GitHub Actions（把結果 commit 回 repo），或改接資料庫。

本地 / v0 沙盒環境檔案系統可寫，後台儲存與即時對時會直接更新 `schedule.json`，適合開發預覽。

---

## 方案 B：GitHub Actions 跑 Python Agent（零成本、可永久保存）

最適合這個玩具專案的「低算力、永久保存」做法：

1. 到 Google AI Studio 申請金鑰：<https://aistudio.google.com/app/apikey>
2. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
   - Name：`GEMINI_API_KEY`
   - Value：你的金鑰
3. 交班代理人要對時時：**Actions 分頁 → 「AI Agent 自動對時」→ Run workflow**。
4. Workflow 會爬網、呼叫 Gemini、把新的 `data/schedule.json` **commit 回 repo**，
   Vercel 偵測到 push 後自動重新部署，前端即顯示最新時程。

因為只在手動觸發時跑一次，不做背景輪詢，算力與費用都極低。

---

## 本機手動執行 Python Agent

```bash
pip install -r scripts/requirements.txt
export GEMINI_API_KEY="你的金鑰"
python scripts/ai_agent.py      # 會就地更新 data/schedule.json
```

---

## 每年交班檢查清單

1. 把 repo / Vercel 專案的管理權移交給新代理人。
2. 更新後台密碼：搜尋程式碼中的 `1150912`（`app/api/schedule/route.ts`、
   `app/api/ai-sync/route.ts`、`components/admin-modal.tsx`）改成新年度密碼。
3. 執行一次 AI 對時（方案 A 按鈕或方案 B workflow）讓時程校準到新學年。
4. 確認甘特圖的三項時程（選課 / 基本資料 / 學雜費）日期正確。
```
