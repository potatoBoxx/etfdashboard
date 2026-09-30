/**
 * Naver Securities ETF API Client
 * Supports Direct Fetch, CORS Proxy Fallback, and Local Snapshot loading
 */

const ETF_API = {
  BASE_URL: 'https://stock.naver.com/api/stockSecurity/etfs/v2/domestic?listingType=aumDesc&size=100&index=',
  CORS_PROXY: 'https://api.allorigins.win/raw?url=',

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
        console.log('Loaded from data/etfs.json:', json.items.length, 'items');
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

    throw new Error('초기 데이터를 불러올 수 없습니다. 실시간 데이터 동기화를 시도해주세요.');
  },

  /**
   * Fetch single page with direct or proxy fallback
   */
  async fetchPage(page, useProxy = false) {
    const targetUrl = `${this.BASE_URL}${page}`;
    const fetchUrl = useProxy ? `${this.CORS_PROXY}${encodeURIComponent(targetUrl)}` : targetUrl;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const resp = await fetch(fetchUrl, {
        signal: controller.signal,
        headers: useProxy ? {} : { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        throw new Error(`HTTP Error ${resp.status}`);
      }

      const data = await resp.json();
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      // If direct fetch failed (e.g. CORS), fallback to proxy once
      if (!useProxy) {
        console.warn(`Direct fetch failed for page ${page}, switching to CORS Proxy...`, err);
        return await this.fetchPage(page, true);
      }
      throw err;
    }
  },

  /**
   * Fetch all ETFs live from Naver Securities API
   * Calls onProgress({ page, totalPages, count, totalCount })
   */
  async fetchAllLive(onProgress) {
    let allItems = [];
    let page = 1;
    let totalCount = 1171; // approximate
    let hasNext = true;
    let usedProxy = false;

    // Test page 1 first to determine proxy necessity
    let firstPageData;
    try {
      firstPageData = await this.fetchPage(1, false);
    } catch (e) {
      console.log('Direct fetch not permitted by browser CORS, using CORS Proxy...');
      usedProxy = true;
      firstPageData = await this.fetchPage(1, true);
    }

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
          const pageData = await this.fetchPage(page, usedProxy);
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
          // gentle delay to avoid burst throttling
          await new Promise(r => setTimeout(r, 60));
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
      source: usedProxy ? 'live_proxy' : 'live_direct',
      updatedAt: nowStr,
      totalCount: allItems.length,
      items: allItems
    };
  }
};

window.ETF_API = ETF_API;
