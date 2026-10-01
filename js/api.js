/**
 * Naver Securities ETF API Client
 * Supports Direct Fetch, CORS Proxy Fallback, and Local/Remote Snapshot loading
 */

const ETF_API = {
  BASE_URL: 'https://stock.naver.com/api/stockSecurity/etfs/v2/domestic?listingType=aumDesc&size=100&index=',
  CORS_PROXIES: [
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy?quest='
  ],

  /**
   * Load initial data:
   * 1. window.__INITIAL_ETF_DATA__ (instantaneous, offline-safe)
   * 2. fetch('data/etfs.json')
   */
  async loadInitialData() {
    if (window.__INITIAL_ETF_DATA__ && window.__INITIAL_ETF_DATA__.items) {
      console.log('Loaded from embedded initial snapshot:', window.__INITIAL_ETF_DATA__.items.length, 'items');
      return {
        source: 'embedded',
        updatedAt: window.__INITIAL_ETF_DATA__.updatedAt || new Date().toLocaleString('ko-KR'),
        totalCount: window.__INITIAL_ETF_DATA__.totalCount || window.__INITIAL_ETF_DATA__.items.length,
        items: window.__INITIAL_ETF_DATA__.items
      };
    }

    try {
      const resp = await fetch('data/etfs.json');
      if (resp.ok) {
        const json = await resp.json();
        return {
          source: 'local_file',
          updatedAt: json.updatedAt || new Date().toLocaleString('ko-KR'),
          totalCount: json.totalCount || json.items.length,
          items: json.items
        };
      }
    } catch (err) {
      console.warn('Could not load data/etfs.json via fetch:', err);
    }

    throw new Error('초기 데이터를 불러올 수 없습니다.');
  },

  /**
   * Fetch latest snapshot directly from GitHub / repository with cache buster
   */
  async fetchLatestSnapshot() {
    const urls = [
      `data/etfs.json?nocache=${Date.now()}`,
      `https://raw.githubusercontent.com/potatoBoxx/etfdashboard/main/data/etfs.json?nocache=${Date.now()}`
    ];

    for (const u of urls) {
      try {
        const resp = await fetch(u, { cache: 'no-store' });
        if (resp.ok) {
          const json = await resp.json();
          if (json && json.items && json.items.length > 0) {
            return {
              source: 'remote_snapshot',
              updatedAt: json.updatedAt || new Date().toLocaleString('ko-KR'),
              totalCount: json.totalCount || json.items.length,
              items: json.items
            };
          }
        }
      } catch (e) {
        console.warn('Snapshot fetch failed for:', u, e);
      }
    }
    return null;
  },

  /**
   * Fetch single page with short timeout
   */
  async fetchPage(page, proxyIndex = -1) {
    const targetUrl = `${this.BASE_URL}${page}`;
    const fetchUrl = proxyIndex >= 0 && proxyIndex < this.CORS_PROXIES.length
      ? `${this.CORS_PROXIES[proxyIndex]}${encodeURIComponent(targetUrl)}`
      : targetUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4초 타임아웃

    try {
      const resp = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: proxyIndex >= 0 ? {} : { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        throw new Error(`HTTP Error ${resp.status}`);
      }

      const data = await resp.json();
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      // Try next proxy
      if (proxyIndex < this.CORS_PROXIES.length - 1) {
        return await this.fetchPage(page, proxyIndex + 1);
      }
      throw err;
    }
  },

  /**
   * Fetch all ETFs live from Naver Securities API
   */
  async fetchAllLive(onProgress) {
    let allItems = [];
    let page = 1;
    let totalCount = 1171;
    let hasNext = true;

    // Test page 1
    const firstPageData = await this.fetchPage(1, -1);

    if (firstPageData && firstPageData.items) {
      totalCount = parseInt(firstPageData.totalCount || 1171, 10);
      const estPages = Math.ceil(totalCount / 100);
      allItems.push(...firstPageData.items);

      if (onProgress) {
        onProgress({
          page: 1,
          totalPages: estPages,
          count: allItems.length,
          totalCount: totalCount,
          percent: Math.min(100, Math.round((allItems.length / totalCount) * 100))
        });
      }

      hasNext = firstPageData.hasNext && allItems.length < totalCount;
      page = 2;

      while (hasNext && page <= 25) {
        try {
          const pageData = await this.fetchPage(page, -1);
          if (!pageData.items || pageData.items.length === 0) break;

          allItems.push(...pageData.items);

          if (onProgress) {
            onProgress({
              page: page,
              totalPages: estPages,
              count: allItems.length,
              totalCount: totalCount,
              percent: Math.min(100, Math.round((allItems.length / totalCount) * 100))
            });
          }

          if (!pageData.hasNext || allItems.length >= totalCount) {
            break;
          }

          page++;
          await new Promise(r => setTimeout(r, 50));
        } catch (err) {
          console.error(`Error on page ${page}:`, err);
          break;
        }
      }
    }

    const nowStr = new Date().toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });

    return {
      source: 'live_api',
      updatedAt: nowStr,
      totalCount: allItems.length,
      items: allItems
    };
  }
};

window.ETF_API = ETF_API;
