/**
 * Main Application Controller for ETF Market Radar EDA Dashboard
 */

const App = {
  rawItems: [],
  normalizedItems: [],
  filteredItems: [],
  currentSummary: null,

  // Table State
  currentPage: 1,
  pageSize: 20,
  sortKey: 'totalNetAssets',
  sortOrder: 'desc',

  // Filters State
  searchQuery: '',
  selectedBrand: 'ALL',
  selectedCategory: 'ALL',
  selectedTag: 'ALL',
  selectedPreset: 'ALL',

  async init() {
    console.log('Initializing ETF EDA Dashboard...');
    ETF_CHARTS.init();
    this.bindEvents();

    try {
      this.showToast('데이터 로딩 중...');
      const data = await ETF_API.loadInitialData();
      this.handleDataLoaded(data);
    } catch (err) {
      console.error('Failed to load initial data:', err);
      this.showToast('로컬 데이터가 없습니다. 실시간 데이터 동기화를 진행합니다.');
      this.handleLiveRefresh();
    }
  },

  handleDataLoaded(data) {
    this.rawItems = data.items;
    this.normalizedItems = ETF_EDA.normalizeItems(this.rawItems);
    this.currentSummary = ETF_EDA.calculateMarketSummary(this.normalizedItems);

    // Update metadata tags
    const timeEl = document.getElementById('lastUpdateTime');
    if (timeEl) timeEl.textContent = `기준: ${data.updatedAt}`;

    const sourceEl = document.getElementById('dataSourceBadge');
    if (sourceEl) {
      if (data.source.startsWith('live')) {
        sourceEl.textContent = '실시간 API 연동';
        sourceEl.className = 'live-status-pill';
      } else {
        sourceEl.textContent = '데이터 스냅샷';
        sourceEl.className = 'kpi-badge badge-neutral';
      }
    }

    // Render KPIs, Filters, Charts, Table
    this.renderKPIs();
    this.populateFilterPills();
    this.applyFilters();
    ETF_CHARTS.renderActive(this.normalizedItems);

    this.showToast(`성공적으로 ${this.normalizedItems.length}개 ETF 데이터를 분석했습니다!`);
  },

  /**
   * Render Top 5 KPI Cards
   */
  renderKPIs() {
    const s = this.currentSummary;
    if (!s) return;

    // 1. Total AUM
    document.getElementById('kpiTotalAum').textContent = `${s.totalAumCho.toFixed(1)}조 원`;
    document.getElementById('kpiAumConcentration').textContent = `상위 10개 집중도 (CR10): ${s.concentration.cr10.toFixed(1)}%`;

    // 2. Market Breadth
    document.getElementById('kpiBreadthValue').textContent = `상승 ${s.marketBreadth.risingCount} / 하락 ${s.marketBreadth.fallingCount}`;
    document.getElementById('kpiBreadthMeta').textContent = `보합 ${s.marketBreadth.steadyCount}개 (${s.marketBreadth.risingPct}% 상승)`;
    const upBar = document.getElementById('breadthUpBar');
    const steadyBar = document.getElementById('breadthSteadyBar');
    const downBar = document.getElementById('breadthDownBar');
    if (upBar && downBar && steadyBar) {
      upBar.style.width = `${s.marketBreadth.risingPct}%`;
      steadyBar.style.width = `${s.marketBreadth.steadyPct}%`;
      downBar.style.width = `${s.marketBreadth.fallingPct}%`;
    }

    // 3. Trading Value
    document.getElementById('kpiTradingValue').textContent = `${(s.totalTradingValueEok / 10000).toFixed(2)}조 원`;
    const topVolumeItem = [...this.normalizedItems].sort((a, b) => b.tradingValue - a.tradingValue)[0];
    document.getElementById('kpiTradingTop').textContent = topVolumeItem ? `최대 거래대금: ${topVolumeItem.itemName.slice(0, 10)}..` : '집계 중';

    // 4. Returns Spectrum
    const r1m = s.returnStats.r1m;
    const sign = r1m.mean >= 0 ? '+' : '';
    const r1mEl = document.getElementById('kpiReturnAvg');
    r1mEl.textContent = `${sign}${r1m.mean.toFixed(2)}%`;
    r1mEl.className = r1m.mean >= 0 ? 'kpi-value val-up' : 'kpi-value val-down';
    document.getElementById('kpiReturnMeta').textContent = `중앙값 ${r1m.median >= 0 ? '+' : ''}${r1m.median.toFixed(2)}% | 승률 ${r1m.winRate.toFixed(1)}%`;

    // 5. Disparity Alert
    document.getElementById('kpiDisparityAvg').textContent = `±${s.disparityStats.meanAbsDisparity.toFixed(2)}%`;
    document.getElementById('kpiDisparityAlert').textContent = `1% 초과 주의 종목: ${s.disparityStats.highDisparityCount}개 (${s.disparityStats.highDisparityPct}%)`;
  },

  /**
   * Populate Dynamic Filter Pills
   */
  populateFilterPills() {
    // Brands
    const brandContainer = document.getElementById('brandPills');
    if (brandContainer) {
      const topBrands = ['ALL', 'KODEX', 'TIGER', 'RISE', 'ACE', 'SOL', 'PLUS', 'KIWOOM', '1Q', 'TIME', 'HANARO', 'KoAct'];
      brandContainer.innerHTML = topBrands.map(b => `
        <button class="filter-pill ${this.selectedBrand === b ? 'active' : ''}" data-filter="brand" data-val="${b}">
          ${b === 'ALL' ? '전체 운용사' : b}
        </button>
      `).join('');
    }

    // Categories
    const catContainer = document.getElementById('catPills');
    if (catContainer) {
      const cats = ['ALL', '국내주식형', '해외주식형', '국내채권형', '해외채권형', '파생/레버리지', '혼합자산형', '상품/원자재/기타'];
      catContainer.innerHTML = cats.map(c => `
        <button class="filter-pill ${this.selectedCategory === c ? 'active' : ''}" data-filter="cat" data-val="${c}">
          ${c === 'ALL' ? '전체 자산군' : c}
        </button>
      `).join('');
    }

    // Tags
    const tagContainer = document.getElementById('tagPills');
    if (tagContainer) {
      const tags = ['ALL', '반도체/AI', '2차전지', '배당/월배당', '미국대표', '국내대표', '채권/금리', '바이오', '방산/인프라', '밸류업', '레버리지', '인버스', '액티브', '환헤지(H)'];
      tagContainer.innerHTML = tags.map(t => `
        <button class="filter-pill ${this.selectedTag === t ? 'active' : ''}" data-filter="tag" data-val="${t}">
          ${t === 'ALL' ? '전체 테마' : t}
        </button>
      `).join('');
    }
  },

  /**
   * Apply Filter Pipeline
   */
  applyFilters() {
    let result = [...this.normalizedItems];

    // Search query
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(it =>
        it.itemName.toLowerCase().includes(q) ||
        it.itemCode.toLowerCase().includes(q) ||
        it.brand.toLowerCase().includes(q)
      );
    }

    // Brand filter
    if (this.selectedBrand !== 'ALL') {
      result = result.filter(it => it.brand === this.selectedBrand);
    }

    // Category filter
    if (this.selectedCategory !== 'ALL') {
      result = result.filter(it => it.category === this.selectedCategory);
    }

    // Tag filter
    if (this.selectedTag !== 'ALL') {
      result = result.filter(it => it.tags.includes(this.selectedTag));
    }

    // Preset filter
    if (this.selectedPreset === 'gainers') {
      result = result.filter(it => it.changeRate > 0);
    } else if (this.selectedPreset === 'r1m_plus') {
      result = result.filter(it => it.returnRate1m != null && it.returnRate1m > 0);
    } else if (this.selectedPreset === 'r6m_surge') {
      result = result.filter(it => it.returnRate6m != null && it.returnRate6m >= 30);
    } else if (this.selectedPreset === 'high_disparity') {
      result = result.filter(it => it.iNav > 0 && Math.abs(it.disparity) >= 1.0);
    } else if (this.selectedPreset === 'mega_aum') {
      result = result.filter(it => it.totalNetAssets >= 1e12); // 1조원 이상
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[this.sortKey];
      let valB = b[this.sortKey];

      if (valA == null) valA = this.sortOrder === 'asc' ? Infinity : -Infinity;
      if (valB == null) valB = this.sortOrder === 'asc' ? Infinity : -Infinity;

      if (typeof valA === 'string') {
        return this.sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return this.sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    this.filteredItems = result;
    this.currentPage = 1;
    this.renderTable();
  },

  /**
   * Render Table and Pagination
   */
  renderTable() {
    const tableBody = document.getElementById('etfTableBody');
    const countBadge = document.getElementById('tableCountBadge');
    if (!tableBody) return;

    if (countBadge) {
      countBadge.textContent = `${this.filteredItems.length.toLocaleString()}개 종목`;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const pageItems = this.filteredItems.slice(startIndex, startIndex + this.pageSize);

    if (pageItems.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="14" style="text-align: center; padding: 3rem; color: var(--text-muted);">
            조건에 부합하는 ETF 종목이 없습니다. 필터를 조정해 보세요.
          </td>
        </tr>
      `;
      this.renderPagination();
      return;
    }

    tableBody.innerHTML = pageItems.map((it, idx) => {
      const rank = startIndex + idx + 1;
      const changeClass = it.changeRate > 0 ? 'val-up' : it.changeRate < 0 ? 'val-down' : 'val-neutral';
      const changePrefix = it.changeRate > 0 ? '+' : '';
      const r1mClass = it.returnRate1m > 0 ? 'val-up' : it.returnRate1m < 0 ? 'val-down' : 'val-neutral';
      const r3mClass = it.returnRate3m > 0 ? 'val-up' : it.returnRate3m < 0 ? 'val-down' : 'val-neutral';
      const r6mClass = it.returnRate6m > 0 ? 'val-up' : it.returnRate6m < 0 ? 'val-down' : 'val-neutral';
      const disparityClass = Math.abs(it.disparity) >= 1.0 ? 'disparity-warning' : (it.disparity > 0 ? 'val-up' : it.disparity < 0 ? 'val-down' : 'val-neutral');

      return `
        <tr class="clickable-row" data-code="${it.itemCode}">
          <td class="cell-num" style="color: var(--text-muted); width: 40px;">${rank}</td>
          <td class="cell-ticker">${it.itemCode}</td>
          <td>
            <div class="cell-name">
              <span>${it.itemName}</span>
            </div>
          </td>
          <td><span class="brand-tag" style="border-left: 3px solid ${it.brandColor};">${it.brand}</span></td>
          <td style="color: var(--text-secondary); font-size: 0.75rem;">${it.category}</td>
          <td class="cell-num" style="font-weight: 600;">${it.currentPrice.toLocaleString()}원</td>
          <td class="cell-num ${changeClass}">${changePrefix}${it.changeRate.toFixed(2)}%</td>
          <td class="cell-num" style="color: var(--text-muted);">${it.iNav > 0 ? it.iNav.toLocaleString() : '-'}</td>
          <td class="cell-num ${disparityClass}">${it.iNav > 0 ? `${it.disparity >= 0 ? '+' : ''}${it.disparity.toFixed(2)}%` : '-'}</td>
          <td class="cell-num ${r1mClass}">${it.returnRate1m != null ? `${it.returnRate1m >= 0 ? '+' : ''}${it.returnRate1m.toFixed(2)}%` : '-'}</td>
          <td class="cell-num ${r3mClass}">${it.returnRate3m != null ? `${it.returnRate3m >= 0 ? '+' : ''}${it.returnRate3m.toFixed(2)}%` : '-'}</td>
          <td class="cell-num ${r6mClass}">${it.returnRate6m != null ? `${it.returnRate6m >= 0 ? '+' : ''}${it.returnRate6m.toFixed(2)}%` : '-'}</td>
          <td class="cell-num" style="font-weight: 700; color: var(--text-bright);">${it.aumEok >= 10000 ? `${(it.aumCho).toFixed(2)}조` : `${Math.round(it.aumEok).toLocaleString()}억`}</td>
          <td class="cell-num" style="color: var(--text-secondary);">${Math.round(it.tradingValueEok).toLocaleString()}억</td>
        </tr>
      `;
    }).join('');

    this.renderPagination();
  },

  /**
   * Render Pagination Controls
   */
  renderPagination() {
    const totalPages = Math.ceil(this.filteredItems.length / this.pageSize) || 1;
    const pageContainer = document.getElementById('paginationControls');
    const pageInfo = document.getElementById('pageInfoText');
    if (!pageContainer) return;

    if (pageInfo) {
      pageInfo.textContent = `페이지 ${this.currentPage} / ${totalPages} (총 ${this.filteredItems.length.toLocaleString()}개)`;
    }

    let buttonsHtml = `
      <button class="page-btn" id="btnPrevPage" ${this.currentPage === 1 ? 'disabled' : ''}>◀</button>
    `;

    // Windowed page buttons
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);

    for (let p = startPage; p <= endPage; p++) {
      buttonsHtml += `
        <button class="page-btn ${this.currentPage === p ? 'active' : ''}" data-page="${p}">${p}</button>
      `;
    }

    buttonsHtml += `
      <button class="page-btn" id="btnNextPage" ${this.currentPage === totalPages ? 'disabled' : ''}>▶</button>
    `;

    pageContainer.innerHTML = buttonsHtml;
  },

  /**
   * Open ETF Detail Modal
   */
  openDetailModal(itemCode) {
    const item = this.normalizedItems.find(it => it.itemCode === itemCode);
    if (!item) return;

    document.getElementById('modalTicker').textContent = `${item.itemCode} | ${item.brand} (${item.issuer})`;
    document.getElementById('modalTitle').textContent = item.itemName;
    document.getElementById('modalPrice').textContent = `${item.currentPrice.toLocaleString()} 원 (${item.changeRate >= 0 ? '+' : ''}${item.changeRate.toFixed(2)}%)`;
    document.getElementById('modalInav').textContent = `${item.iNav.toLocaleString()} 원`;
    document.getElementById('modalDisparity').textContent = `${item.disparity >= 0 ? '+' : ''}${item.disparity.toFixed(2)}%`;
    document.getElementById('modalAum').textContent = `${item.aumCho.toFixed(2)}조 원 (${Math.round(item.aumEok).toLocaleString()}억 원)`;
    document.getElementById('modalTradingValue').textContent = `${Math.round(item.tradingValueEok).toLocaleString()}억 원 (${item.tradingVolume.toLocaleString()} 주)`;
    document.getElementById('modalCategory').textContent = `${item.category} (${item.etfType})`;

    // Returns
    document.getElementById('modalR1m').textContent = item.returnRate1m != null ? `${item.returnRate1m >= 0 ? '+' : ''}${item.returnRate1m.toFixed(2)}%` : '-';
    document.getElementById('modalR3m').textContent = item.returnRate3m != null ? `${item.returnRate3m >= 0 ? '+' : ''}${item.returnRate3m.toFixed(2)}%` : '-';
    document.getElementById('modalR6m').textContent = item.returnRate6m != null ? `${item.returnRate6m >= 0 ? '+' : ''}${item.returnRate6m.toFixed(2)}%` : '-';

    // Disparity status assessment
    const alertBox = document.getElementById('modalDisparityBox');
    if (Math.abs(item.disparity) >= 1.0) {
      alertBox.className = 'modal-data-box disparity-warning';
    } else {
      alertBox.className = 'modal-data-box';
    }

    // External Naver Link
    const linkBtn = document.getElementById('modalNaverLink');
    if (linkBtn) {
      linkBtn.href = `https://finance.naver.com/item/main.naver?code=${item.itemCode}`;
    }

    document.getElementById('etfDetailModal').style.display = 'flex';
  },

  closeDetailModal() {
    document.getElementById('etfDetailModal').style.display = 'none';
  },

  /**
   * Live Streaming Fetch from Naver with Smart Snapshot Fallback
   */
  async handleLiveRefresh() {
    const refreshBtn = document.getElementById('btnLiveRefresh');
    const progressContainer = document.getElementById('fetchProgressContainer');
    const progressBar = document.getElementById('fetchProgressBar');
    const progressText = document.getElementById('fetchProgressText');

    if (refreshBtn) refreshBtn.disabled = true;
    if (progressContainer) progressContainer.style.display = 'block';
    if (progressBar) progressBar.style.width = '15%';
    if (progressText) progressText.textContent = '최신 데이터 저장소 확인 중...';

    // 1단계: 원격 저장소의 최신 스냅샷 확인 (캐시 무효화)
    let snapshotData = null;
    try {
      snapshotData = await ETF_API.fetchLatestSnapshot();
    } catch (e) {
      console.warn('Snapshot fetch error:', e);
    }

    // 2단계: 네이버 증권 API 실시간 수집 시도
    let liveSuccess = false;
    try {
      if (progressBar) progressBar.style.width = '30%';
      if (progressText) progressText.textContent = '네이버 증권 API 실시간 수집 시도 중...';

      const freshData = await ETF_API.fetchAllLive((prog) => {
        if (progressBar) progressBar.style.width = `${prog.percent}%`;
        if (progressText) {
          progressText.textContent = `네이버 증권 API 실시간 수집 중... ${prog.count.toLocaleString()}개 종목 (${prog.page}/${prog.totalPages} 페이지, ${prog.percent}%)`;
        }
      });

      if (freshData && freshData.items && freshData.items.length > 0) {
        liveSuccess = true;
        this.handleDataLoaded(freshData);
        this.showToast(`네이버 증권 실시간 데이터(${freshData.items.length}개 종목) 수집 완료!`);
      }
    } catch (err) {
      console.warn('Live API fetch blocked by browser CORS:', err);
    }

    if (progressContainer) progressContainer.style.display = 'none';
    if (refreshBtn) refreshBtn.disabled = false;

    // 3단계: 실시간 API가 브라우저 보안(CORS)으로 차단된 경우 최신 저장소 데이터로 동기화
    if (!liveSuccess) {
      if (snapshotData && snapshotData.items && snapshotData.items.length > 0) {
        this.handleDataLoaded(snapshotData);
        this.showToast(`최신 배포 데이터셋으로 동기화 완료 (기준: ${snapshotData.updatedAt})`);
      } else {
        this.showToast('브라우저 CORS 제한으로 실시간 API가 차단되었습니다. 저장소 최신 데이터를 로드합니다.');
      }
    }
  },

  /**
   * Export Filtered Data to CSV
   */
  exportToCsv() {
    if (!this.filteredItems.length) return;

    const headers = ['순위', '종목코드', '종목명', '운용사', '자산분류', '현재가', '등락률(%)', 'iNAV', '괴리율(%)', '1개월수익률(%)', '3개월수익률(%)', '6개월수익률(%)', '순자산(억원)', '거래대금(억원)'];
    const rows = this.filteredItems.map((it, idx) => [
      idx + 1,
      `="${it.itemCode}"`,
      `"${it.itemName.replace(/"/g, '""')}"`,
      it.brand,
      it.category,
      it.currentPrice,
      it.changeRate,
      it.iNav,
      it.disparity.toFixed(2),
      it.returnRate1m ?? '',
      it.returnRate3m ?? '',
      it.returnRate6m ?? '',
      Math.round(it.aumEok),
      Math.round(it.tradingValueEok)
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `K-ETF_Market_EDA_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast('CSV 파일이 성공적으로 다운로드되었습니다.');
  },

  /**
   * Export to JSON
   */
  exportToJson() {
    if (!this.filteredItems.length) return;
    const jsonStr = JSON.stringify(this.filteredItems, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `K-ETF_Data_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast('JSON 데이터가 성공적으로 다운로드되었습니다.');
  },

  /**
   * Copy EDA Summary to Clipboard
   */
  copyReport() {
    const s = this.currentSummary;
    if (!s) return;

    const report = `[K-ETF 실시간 시장 EDA 종합 요약]
- 전체 상장 ETF: ${s.totalCount.toLocaleString()}개
- 시장 총 순자산총액: ${s.totalAumCho.toFixed(1)}조 원
- 금일 총 거래대금: ${(s.totalTradingValueEok / 10000).toFixed(2)}조 원
- 시장 등락 현황: 상승 ${s.marketBreadth.risingCount}개 (${s.marketBreadth.risingPct}%) / 하락 ${s.marketBreadth.fallingCount}개 (${s.marketBreadth.fallingPct}%)
- 1개월 평균 수익률: ${s.returnStats.r1m.mean.toFixed(2)}% (상승 승률 ${s.returnStats.r1m.winRate.toFixed(1)}%)
- 6개월 평균 수익률: ${s.returnStats.r6m.mean.toFixed(2)}%
- 평균 절대 괴리율: ±${s.disparityStats.meanAbsDisparity.toFixed(2)}% (1% 초과 고괴리율: ${s.disparityStats.highDisparityCount}개)
- 상위 10개 ETF 순자산 집중도 (CR10): ${s.concentration.cr10.toFixed(1)}%
(출처: 네이버 증권 ETF 실시간 API 종합 EDA 대시보드)`;

    navigator.clipboard.writeText(report).then(() => {
      this.showToast('분석 리포트가 클립보드에 복사되었습니다!');
    });
  },

  showToast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>⚡</span> <span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  /**
   * Bind DOM Events
   */
  bindEvents() {
    // Live Refresh
    document.getElementById('btnLiveRefresh')?.addEventListener('click', () => this.handleLiveRefresh());

    // Export Buttons
    document.getElementById('btnExportCsv')?.addEventListener('click', () => this.exportToCsv());
    document.getElementById('btnExportJson')?.addEventListener('click', () => this.exportToJson());
    document.getElementById('btnCopyReport')?.addEventListener('click', () => this.copyReport());

    // Search Input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.applyFilters();
      });
    }

    // Filter Pills Delegation
    document.querySelector('.filter-bar')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-pill');
      if (!btn) return;

      const type = btn.dataset.filter;
      const val = btn.dataset.val;

      if (type === 'brand') {
        this.selectedBrand = val;
        document.querySelectorAll('#brandPills .filter-pill').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
      } else if (type === 'cat') {
        this.selectedCategory = val;
        document.querySelectorAll('#catPills .filter-pill').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
      } else if (type === 'tag') {
        this.selectedTag = val;
        document.querySelectorAll('#tagPills .filter-pill').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
      } else if (type === 'preset') {
        this.selectedPreset = val;
        document.querySelectorAll('#presetPills .filter-pill').forEach(el => el.classList.remove('active'));
        btn.classList.add('active');
      }

      this.applyFilters();
    });

    // Table Header Sorting
    document.querySelectorAll('.data-table th[data-sort]')?.forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.sort;
        if (this.sortKey === key) {
          this.sortOrder = this.sortOrder === 'desc' ? 'asc' : 'desc';
        } else {
          this.sortKey = key;
          this.sortOrder = 'desc';
        }

        document.querySelectorAll('.data-table th').forEach(el => el.classList.remove('sorted-asc', 'sorted-desc'));
        th.classList.add(this.sortOrder === 'asc' ? 'sorted-asc' : 'sorted-desc');
        this.applyFilters();
      });
    });

    // Page Size Selector
    document.getElementById('pageSizeSelect')?.addEventListener('change', (e) => {
      this.pageSize = parseInt(e.target.value, 10);
      this.currentPage = 1;
      this.renderTable();
    });

    // Pagination Click
    document.getElementById('paginationControls')?.addEventListener('click', (e) => {
      if (e.target.id === 'btnPrevPage') {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderTable();
        }
      } else if (e.target.id === 'btnNextPage') {
        const totalPages = Math.ceil(this.filteredItems.length / this.pageSize);
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderTable();
        }
      } else if (e.target.dataset.page) {
        this.currentPage = parseInt(e.target.dataset.page, 10);
        this.renderTable();
      }
    });

    // Table Row Click -> Modal
    document.getElementById('etfTableBody')?.addEventListener('click', (e) => {
      const row = e.target.closest('tr[data-code]');
      if (row) {
        this.openDetailModal(row.dataset.code);
      }
    });

    // Modal Close
    document.getElementById('modalCloseBtn')?.addEventListener('click', () => this.closeDetailModal());
    document.getElementById('etfDetailModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'etfDetailModal') {
        this.closeDetailModal();
      }
    });

    // EDA Chart Tabs
    document.querySelectorAll('.eda-tabs .tab-btn')?.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.eda-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ETF_CHARTS.activeTab = btn.dataset.tab;

        // Show/hide period buttons for returns chart
        const periodGroup = document.getElementById('returnsPeriodGroup');
        if (periodGroup) {
          periodGroup.style.display = btn.dataset.tab === 'returns' ? 'flex' : 'none';
        }

        ETF_CHARTS.renderActive(this.normalizedItems);
      });
    });

    // Period Select Buttons
    document.querySelectorAll('.period-btn')?.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        ETF_CHARTS.activePeriod = btn.dataset.period;
        ETF_CHARTS.renderActive(this.normalizedItems);
      });
    });
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
