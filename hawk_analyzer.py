import json
import re
from dataclasses import dataclass
from typing import Optional

import google.generativeai as genai


@dataclass
class DevelopmentCase:
    source_id: str
    source_name: str
    prefecture: str
    url: str
    title: str
    units: Optional[int]
    is_for_sale: Optional[bool]
    priority: str
    summary: str


_SYSTEM_PROMPT = """あなたは不動産開発情報の分析専門家です。
与えられたWebページのテキストから不動産開発案件を抽出し、必ず以下のJSON形式のみで回答してください。
余分な説明文は不要です。

{
  "cases": [
    {
      "title": "案件名",
      "units": 総戸数(整数、不明ならnull),
      "is_for_sale": 分譲か否か(true=分譲, false=賃貸, null=不明),
      "summary": "案件概要（100文字以内）",
      "priority": "high/medium/low"
    }
  ]
}

優先度の基準:
- high  : 総戸数50戸以上 かつ 分譲マンション
- medium: 総戸数50戸以上だが賃貸/不明、または大規模開発で戸数不明
- low   : 総戸数50戸未満、または賃貸専用と明確に判別できるもの

案件が複数あれば全て抽出し、見つからなければ cases を空配列にしてください。"""


class HawkAnalyzer:
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash", min_units: int = 50):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        self.min_units = min_units

    def analyze(
        self,
        source_id: str,
        source_name: str,
        prefecture: str,
        url: str,
        page_text: str,
    ) -> list[DevelopmentCase]:
        if not page_text or len(page_text.strip()) < 50:
            return []

        prompt = (
            f"{_SYSTEM_PROMPT}\n\n"
            f"【{source_name}（{prefecture}）】\nURL: {url}\n\n"
            f"--- ページ内容 ---\n{page_text[:4000]}\n--- ここまで ---"
        )

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,
                    max_output_tokens=1024,
                ),
            )
            raw = response.text.strip()
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if not match:
                return []

            data = json.loads(match.group())
        except Exception:
            return []

        cases: list[DevelopmentCase] = []
        for item in data.get("cases", []):
            units: Optional[int] = item.get("units")
            is_for_sale: Optional[bool] = item.get("is_for_sale")

            # 50戸閾値で優先度を上書き
            if units is not None:
                if units >= self.min_units and is_for_sale is not False:
                    priority = "high"
                elif units >= self.min_units:
                    priority = "medium"
                else:
                    priority = "low"
            else:
                priority = item.get("priority", "low")

            cases.append(
                DevelopmentCase(
                    source_id=source_id,
                    source_name=source_name,
                    prefecture=prefecture,
                    url=url,
                    title=item.get("title", "（タイトル不明）"),
                    units=units,
                    is_for_sale=is_for_sale,
                    priority=priority,
                    summary=item.get("summary", ""),
                )
            )

        return cases

    def filter_high_priority(self, cases: list[DevelopmentCase]) -> list[DevelopmentCase]:
        return [c for c in cases if c.priority in ("high", "medium")]
