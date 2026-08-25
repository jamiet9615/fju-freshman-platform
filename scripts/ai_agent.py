#!/usr/bin/env python3
"""
輔大新生全攻略 - 人機協同 AI Agent 自動對時腳本
=================================================

用途
----
由「接班代理人」手動觸發（本機執行或 GitHub Actions 手動 workflow_dispatch），
抓取輔大官方網頁 → 交給 Gemini 擷取最新時程 → 覆寫 data/schedule.json。
前端會讀取這份 JSON 自動更新甘特圖與代辦清單。

為何是「人機協同、低算力」？
--------------------------
不在背景 24 小時輪詢爬網，只有真人按下按鈕（或每學期手動排程一次）才執行，
一次呼叫即完成，省算力也省 API 費用。

安裝
----
    pip install requests google-generativeai

執行
----
    export GEMINI_API_KEY="你的_Gemini_API_金鑰"
    python scripts/ai_agent.py

金鑰申請：https://aistudio.google.com/app/apikey
"""

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
import google.generativeai as genai

# --- 設定 ---------------------------------------------------------------
SCHEDULE_PATH = Path(__file__).resolve().parent.parent / "data" / "schedule.json"
MODEL_NAME = "gemini-2.5-flash"

SOURCES = [
    {"name": "輔大新生專區", "url": "https://fjcuadm.fju.edu.tw/speed.php?id=2"},
    {"name": "學校行事曆", "url": "http://www.secretariat.fju.edu.tw/article.jsp?articleID=8"},
    {"name": "選課資訊網", "url": "https://course.fju.edu.tw/"},
]

HEADERS = {"User-Agent": "Mozilla/5.0 (FJU-Freshman-Agent)"}


# --- 工具函式 -----------------------------------------------------------
def html_to_text(html: str) -> str:
    """移除 script/style 與所有標籤，壓縮空白，截斷長度以節省 token。"""
    html = re.sub(r"<script[\s\S]*?</script>", " ", html, flags=re.I)
    html = re.sub(r"<style[\s\S]*?</style>", " ", html, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", html)
    text = text.replace("&nbsp;", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:8000]


def crawl() -> str:
    docs = []
    for src in SOURCES:
        try:
            resp = requests.get(src["url"], headers=HEADERS, timeout=20)
            resp.encoding = resp.apparent_encoding or "utf-8"
            docs.append(f"# 來源：{src['name']} ({src['url']})\n{html_to_text(resp.text)}")
            print(f"[agent] 已抓取 {src['name']}", file=sys.stderr)
        except Exception as exc:  # noqa: BLE001
            print(f"[agent] 抓取失敗 {src['url']}: {exc}", file=sys.stderr)
            docs.append(f"# 來源：{src['name']}（抓取失敗）")
    return "\n\n---\n\n".join(docs)


def load_current() -> dict:
    with open(SCHEDULE_PATH, "r", encoding="utf-8") as fh:
        return json.load(fh)


def build_prompt(current: dict, documents: str) -> str:
    from datetime import datetime
    year = datetime.now().year
    
    return f"""你是一位輔仁大學的學務分析專家兼智慧時程管理助理。
請綜合下方所有官方網頁的純文字內容（包含新生專區、行事曆與選課資訊網），分析並維護新生的時程表（gantt）與代辦事項（todos）。

【絕對必填的核心項目（不得遺漏）】
1. **選課相關**：包含全人課程選填志願、初選、加退選等時間。
2. **學雜費繳納**：網頁中提到的學費繳交期限（如 8/1 – 8/31）。
3. **基本資料填寫與註冊**：包含新生基本資料填寫、學歷文件繳交期限（如 10/13 前）。
4. **考試與典禮**：開學典禮、期中考、期末考週。

【維護規則】
- 務必從文本中擷取上述所有關鍵時程，補入 `gantt` 陣列中。
- 日期格式必須嚴格使用 `YYYY-MM-DD`。若文本中有明確起訖日，請確實對應 `start` 與 `end`。

請「只」回傳符合下列結構的 JSON（不要加註解或 markdown code fence）：
{{
  "gantt": [
    {{"id": "course-selection", "label": "選課時間", "start": "YYYY-MM-DD", "end": "YYYY-MM-DD"}}
  ],
  "todos": [{{"text": "一句簡短的新生必做事項"}}],
  "summary": "一到兩句話的更新重點摘要"
}}

現有資料（請以此為基礎進行增補，切勿漏掉選課與繳費）：
{json.dumps({"gantt": current["gantt"], "todos": current["todos"]}, ensure_ascii=False, indent=2)}

官方網頁內容：
{documents}
"""

def call_gemini(prompt: str) -> dict:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("[agent] 錯誤：未設定 GEMINI_API_KEY 環境變數", file=sys.stderr)
        sys.exit(1)

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(MODEL_NAME)
    resp = model.generate_content(
        prompt,
        generation_config={"response_mime_type": "application/json"},
    )
    return json.loads(resp.text)


def merge_and_save(current: dict, extracted: dict) -> dict:
    ts = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    updated = {
        "updatedAt": ts,
        "updatedBy": "ai-agent",
        "gantt": [
            {
                "id": g["id"],
                "label": g["label"],
                "start": g["start"],
                "end": g["end"],
            }
            for g in extracted.get("gantt", current["gantt"])
        ],
        "todos": [
            {"id": f"ai-{i}", "text": t["text"]}
            for i, t in enumerate(extracted.get("todos", []))
        ]
        or current["todos"],
    }
    with open(SCHEDULE_PATH, "w", encoding="utf-8") as fh:
        json.dump(updated, fh, ensure_ascii=False, indent=2)
    return updated


def main() -> None:
    print("[agent] 開始人機協同對時…", file=sys.stderr)
    current = load_current()
    documents = crawl()
    prompt = build_prompt(current, documents)
    extracted = call_gemini(prompt)
    updated = merge_and_save(current, extracted)
    print("[agent] 對時完成，摘要：", extracted.get("summary", "(無)"), file=sys.stderr)
    print(json.dumps(updated, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
