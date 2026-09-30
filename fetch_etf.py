import urllib.request
import json
import os
import time

def fetch_all_etfs():
    base_url = "https://stock.naver.com/api/stockSecurity/etfs/v2/domestic?listingType=aumDesc&size=100&index="
    all_items = []
    page = 1
    total_count = None
    
    print("Starting ETF data collection from Naver Securities API...")
    while True:
        url = f"{base_url}{page}"
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://finance.naver.com/'
        })
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if total_count is None:
                    total_count = int(data.get("totalCount", 0))
                    print(f"Total ETFs according to API: {total_count}")
                
                items = data.get("items", [])
                if not items:
                    break
                
                all_items.extend(items)
                print(f"Page {page:02d}: fetched {len(items)} items (accumulated: {len(all_items)} / {total_count})")
                
                if not data.get("hasNext") or len(all_items) >= total_count:
                    break
                
                page += 1
                time.sleep(0.1)
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            break

    print(f"Successfully collected {len(all_items)} ETFs!")
    
    os.makedirs("data", exist_ok=True)
    os.makedirs("js", exist_ok=True)
    out_path = os.path.join("data", "etfs.json")
    payload = {
        "updatedAt": time.strftime("%Y-%m-%d %H:%M:%S"),
        "totalCount": len(all_items),
        "items": all_items
    }
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"Saved to {out_path} ({os.path.getsize(out_path) / 1024:.1f} KB)")

    js_path = os.path.join("js", "default_data.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("window.__INITIAL_ETF_DATA__ = " + json.dumps(payload, ensure_ascii=False) + ";\n")
    print(f"Saved embedded snapshot to {js_path} ({os.path.getsize(js_path) / 1024:.1f} KB)")

if __name__ == "__main__":
    fetch_all_etfs()
