import time
import yaml
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from bs4 import BeautifulSoup


@dataclass
class ScrapeResult:
    source_id: str
    source_name: str
    prefecture: str
    url: str
    category: str
    text: str
    success: bool
    error: str = ""


_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}


def _scrape_one(source: dict, timeout: int) -> ScrapeResult:
    url = source["url"]
    base = dict(
        source_id=source["id"],
        source_name=source["name"],
        prefecture=source["prefecture"],
        url=url,
        category=source["category"],
        text="",
        success=False,
    )
    try:
        resp = requests.get(url, headers=_HEADERS, timeout=timeout)
        resp.raise_for_status()
        resp.encoding = resp.apparent_encoding

        soup = BeautifulSoup(resp.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.decompose()

        lines = [ln for ln in soup.get_text(separator="\n", strip=True).splitlines() if ln.strip()]
        return ScrapeResult(**{**base, "text": "\n".join(lines), "success": True})

    except requests.Timeout:
        return ScrapeResult(**{**base, "error": "タイムアウト（10秒超過）"})
    except requests.HTTPError as e:
        return ScrapeResult(**{**base, "error": f"HTTP {e.response.status_code}"})
    except Exception as e:
        return ScrapeResult(**{**base, "error": str(e)})


class HawkScraper:
    def __init__(self, config_path: str = "hawk_config.yaml"):
        with open(config_path, "r", encoding="utf-8") as f:
            config = yaml.safe_load(f)
        self.sources: list[dict] = config["sources"]
        self.timeout: int = config["settings"]["timeout"]
        self.max_workers: int = config["settings"]["max_workers"]

    def run(self, verbose: bool = True) -> list[ScrapeResult]:
        if verbose:
            print(f"[HAWK] スクレイピング開始: {len(self.sources)} 件を並列処理 "
                  f"(workers={self.max_workers}, timeout={self.timeout}s)")

        start = time.time()
        results: list[ScrapeResult] = []

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {
                executor.submit(_scrape_one, src, self.timeout): src
                for src in self.sources
            }
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                if verbose:
                    tag = "OK" if result.success else f"NG: {result.error}"
                    print(f"  [{tag}] {result.source_name} ({result.prefecture})")

        elapsed = time.time() - start
        ok = sum(1 for r in results if r.success)
        if verbose:
            print(f"\n[HAWK] 完了: {ok}/{len(results)} 件成功 ({elapsed:.1f}秒)\n")

        return results
