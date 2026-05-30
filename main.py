import os
from dotenv import load_dotenv

from hawk_scraper import HawkScraper
from hawk_analyzer import HawkAnalyzer, DevelopmentCase

load_dotenv()


def _print_case(case: DevelopmentCase) -> None:
    units_str = f"{case.units}戸" if case.units is not None else "戸数不明"
    sale_str = "分譲" if case.is_for_sale else ("賃貸" if case.is_for_sale is False else "不明")
    print(f"[{case.priority.upper()}] {case.title}")
    print(f"  {case.prefecture} | {units_str} | {sale_str}")
    if case.summary:
        print(f"  {case.summary}")
    print(f"  出典: {case.source_name}")
    print(f"  URL : {case.url}")
    print()


def main() -> None:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("エラー: GEMINI_API_KEY が未設定です。")
        print(".env ファイルに GEMINI_API_KEY=<your_key> を追加してください。")
        return

    scraper = HawkScraper("hawk_config.yaml")
    scrape_results = scraper.run()

    analyzer = HawkAnalyzer(api_key=api_key)
    all_cases: list[DevelopmentCase] = []

    for result in scrape_results:
        if not result.success or not result.text:
            continue
        cases = analyzer.analyze(
            source_id=result.source_id,
            source_name=result.source_name,
            prefecture=result.prefecture,
            url=result.url,
            page_text=result.text,
        )
        all_cases.extend(cases)

    high_priority = analyzer.filter_high_priority(all_cases)

    print("=" * 50)
    print("HAWK 案件レポート")
    print("=" * 50)
    print(f"解析総数: {len(all_cases)} 件 / 注目案件: {len(high_priority)} 件\n")

    if not high_priority:
        print("（注目案件はありませんでした）")
        return

    order = {"high": 0, "medium": 1, "low": 2}
    for case in sorted(high_priority, key=lambda c: order.get(c.priority, 9)):
        _print_case(case)


if __name__ == "__main__":
    main()
