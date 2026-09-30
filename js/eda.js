/**
 * ETF Exploratory Data Analysis (EDA) Engine
 * Processes, normalizes, categorizes, and calculates quantitative statistics
 */

const ETF_EDA = {
  // Brand dictionary
  BRAND_MAP: [
    { prefix: 'KODEX', brand: 'KODEX', issuer: '삼성자산운용', color: '#1d4ed8' },
    { prefix: 'TIGER', brand: 'TIGER', issuer: '미래에셋자산운용', color: '#ea580c' },
    { prefix: 'RISE', brand: 'RISE', issuer: 'KB자산운용', color: '#eab308' },
    { prefix: 'KBSTAR', brand: 'RISE', issuer: 'KB자산운용', color: '#eab308' },
    { prefix: 'ACE', brand: 'ACE', issuer: '한국투자신탁운용', color: '#0284c7' },
    { prefix: 'KINDEX', brand: 'ACE', issuer: '한국투자신탁운용', color: '#0284c7' },
    { prefix: 'SOL', brand: 'SOL', issuer: '신한자산운용', color: '#2563eb' },
    { prefix: 'PLUS', brand: 'PLUS', issuer: '한화자산운용', color: '#f97316' },
    { prefix: 'ARIRANG', brand: 'PLUS', issuer: '한화자산운용', color: '#f97316' },
    { prefix: 'KOSEF', brand: 'KIWOOM', issuer: '키움투자자산운용', color: '#ec4899' },
    { prefix: '히어로즈', brand: 'KIWOOM', issuer: '키움투자자산운용', color: '#ec4899' },
    { prefix: 'KIWOOM', brand: 'KIWOOM', issuer: '키움투자자산운용', color: '#ec4899' },
    { prefix: '1Q', brand: '1Q', issuer: '하나자산운용', color: '#10b981' },
    { prefix: 'TIMEFOLIO', brand: 'TIME', issuer: '타임폴리오자산운용', color: '#8b5cf6' },
    { prefix: 'TIME', brand: 'TIME', issuer: '타임폴리오자산운용', color: '#8b5cf6' },
    { prefix: 'HANARO', brand: 'HANARO', issuer: 'NH-Amundi자산운용', color: '#14b8a6' },
    { prefix: 'KoAct', brand: 'KoAct', issuer: '삼성액티브자산운용', color: '#6366f1' },
    { prefix: 'WON', brand: 'WON', issuer: '우리자산운용', color: '#06b6d4' },
    { prefix: 'WOORI', brand: 'WON', issuer: '우리자산운용', color: '#06b6d4' },
    { prefix: 'UNICORN', brand: 'UNICORN', issuer: '현대자산운용', color: '#a855f7' },
    { prefix: '에셋플러스', brand: '에셋플러스', issuer: '에셋플러스자산운용', color: '#f43f5e' },
    { prefix: 'TRUSTON', brand: 'TRUSTON', issuer: '트러스톤자산운용', color: '#64748b' }
  ],

  /**
   * Determine Brand & Issuer from ETF Name
   */
  resolveBrand(name) {
    const trimmed = (name || '').trim();
    for (const b of this.BRAND_MAP) {
      if (trimmed.startsWith(b.prefix)) {
        return b;
      }
    }
    const firstWord = trimmed.split(' ')[0] || '기타';
    return { prefix: firstWord, brand: firstWord, issuer: '기타 운용사', color: '#94a3b8' };
  },

  /**
   * Determine Major Asset Class from etfType and Name
   */
  resolveCategory(etfType, name) {
    const type = (etfType || '').trim();
    const nm = (name || '').trim();

    if (type.includes('국내주식')) return '국내주식형';
    if (type.includes('해외주식')) return '해외주식형';
    if (type.includes('국내채권')) return '국내채권형';
    if (type.includes('해외채권')) return '해외채권형';
    if (type.includes('파생') || nm.includes('레버리지') || nm.includes('인버스')) return '파생/레버리지';
    if (type.includes('혼합')) return '혼합자산형';
    if (type.includes('상품') || type.includes('부동산') || type.includes('통화')) return '상품/원자재/기타';
    return '기타';
  },

  /**
   * Extract Theme Tags
   */
  extractTags(name) {
    const tags = [];
    const nm = name.toUpperCase();

    if (nm.includes('반도체') || nm.includes('AI') || nm.includes('빅테크') || nm.includes('엔비디아') || nm.includes('소프트웨어')) {
      tags.push('반도체/AI');
    }
    if (nm.includes('2차전지') || nm.includes('배터리') || nm.includes('전기차') || nm.includes('EV')) {
      tags.push('2차전지');
    }
    if (nm.includes('배당') || nm.includes('인컴') || nm.includes('커버드콜') || nm.includes('프리미엄') || nm.includes('고배당')) {
      tags.push('배당/월배당');
    }
    if (nm.includes('S&P500') || nm.includes('나스닥100') || nm.includes('미국나스닥') || nm.includes('미국S&P') || nm.includes('다우존스')) {
      tags.push('미국대표');
    }
    if (nm.includes('200') || nm.includes('코스피') || nm.includes('코스닥150') || nm.includes('KRX300')) {
      tags.push('국내대표');
    }
    if (nm.includes('CD금리') || nm.includes('KOFR') || nm.includes('국고채') || nm.includes('미국채') || nm.includes('채권') || nm.includes('머니마켓')) {
      tags.push('채권/금리');
    }
    if (nm.includes('바이오') || nm.includes('헬스케어') || nm.includes('제약')) {
      tags.push('바이오');
    }
    if (nm.includes('방산') || nm.includes('우주') || nm.includes('조선') || nm.includes('원자력') || nm.includes('전력')) {
      tags.push('방산/인프라');
    }
    if (nm.includes('밸류업') || nm.includes('지주사') || nm.includes('우선주')) {
      tags.push('밸류업');
    }
    if (nm.includes('레버리지') || nm.includes('2X')) {
      tags.push('레버리지');
    }
    if (nm.includes('인버스') || nm.includes('-2X') || nm.includes('-1X')) {
      tags.push('인버스');
    }
    if (nm.includes('액티브')) {
      tags.push('액티브');
    }
    if (nm.includes('(H)')) {
      tags.push('환헤지(H)');
    }

    return tags;
  },

  /**
   * Normalize an entire raw item list
   */
  normalizeItems(rawItems) {
    if (!Array.isArray(rawItems)) return [];

    return rawItems.map(item => {
      const currentPrice = parseFloat(item.currentPrice) || 0;
      const changePrice = parseFloat(item.changePrice) || 0;
      const changeRate = parseFloat(item.changeRate) || 0;
      const tradingVolume = parseFloat(item.tradingVolume) || 0;
      const tradingValue = parseFloat(item.tradingValue) || 0;
      const totalNetAssets = parseFloat(item.totalNetAssets) || 0;
      const iNav = parseFloat(item.iNav) || 0;

      // Disparity (괴리율) = (Current Price - iNAV) / iNAV * 100
      let disparity = 0;
      if (iNav > 0 && currentPrice > 0) {
        disparity = ((currentPrice - iNav) / iNav) * 100;
      }

      const returnRate1m = item.returnRate1m != null && item.returnRate1m !== '' ? parseFloat(item.returnRate1m) : null;
      const returnRate3m = item.returnRate3m != null && item.returnRate3m !== '' ? parseFloat(item.returnRate3m) : null;
      const returnRate6m = item.returnRate6m != null && item.returnRate6m !== '' ? parseFloat(item.returnRate6m) : null;

      const brandInfo = this.resolveBrand(item.itemName);
      const category = this.resolveCategory(item.etfType, item.itemName);
      const tags = this.extractTags(item.itemName);

      return {
        itemCode: item.itemCode,
        itemName: item.itemName,
        currentPrice,
        changePrice,
        changeRate,
        priceMovement: item.priceMovement || 'steady',
        tradingVolume,
        tradingValue,
        tradingValueEok: tradingValue / 1e8, // 억원
        totalNetAssets,
        aumCho: totalNetAssets / 1e12, // 조원
        aumEok: totalNetAssets / 1e8,  // 억원
        etfType: item.etfType || '기타',
        iNav,
        disparity,
        absDisparity: Math.abs(disparity),
        returnRate1m,
        returnRate3m,
        returnRate6m,
        brand: brandInfo.brand,
        issuer: brandInfo.issuer,
        brandColor: brandInfo.color,
        category,
        tags
      };
    });
  },

  /**
   * Descriptive Statistics Helpers
   */
  mean(arr) {
    if (!arr.length) return 0;
    return arr.reduce((acc, v) => acc + v, 0) / arr.length;
  },

  median(arr) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  },

  /**
   * Top-level Market Summary Statistics
   */
  calculateMarketSummary(items) {
    const totalCount = items.length;
    if (totalCount === 0) return null;

    let totalAUM = 0;
    let totalTradingValue = 0;
    let risingCount = 0;
    let fallingCount = 0;
    let steadyCount = 0;

    const r1m = [];
    const r3m = [];
    const r6m = [];
    const disparities = [];

    items.forEach(it => {
      totalAUM += it.totalNetAssets;
      totalTradingValue += it.tradingValue;

      if (it.changeRate > 0) risingCount++;
      else if (it.changeRate < 0) fallingCount++;
      else steadyCount++;

      if (it.returnRate1m != null) r1m.push(it.returnRate1m);
      if (it.returnRate3m != null) r3m.push(it.returnRate3m);
      if (it.returnRate6m != null) r6m.push(it.returnRate6m);
      if (it.iNav > 0) disparities.push(it.absDisparity);
    });

    // Concentration ratio (CR5, CR10)
    const sortedByAum = [...items].sort((a, b) => b.totalNetAssets - a.totalNetAssets);
    const top5Aum = sortedByAum.slice(0, 5).reduce((s, it) => s + it.totalNetAssets, 0);
    const top10Aum = sortedByAum.slice(0, 10).reduce((s, it) => s + it.totalNetAssets, 0);

    const highDisparityCount = items.filter(it => it.iNav > 0 && Math.abs(it.disparity) >= 1.0).length;

    return {
      totalCount,
      totalAumCho: totalAUM / 1e12,
      totalTradingValueEok: totalTradingValue / 1e8,
      marketBreadth: {
        risingCount,
        fallingCount,
        steadyCount,
        risingPct: ((risingCount / totalCount) * 100).toFixed(1),
        fallingPct: ((fallingCount / totalCount) * 100).toFixed(1),
        steadyPct: ((steadyCount / totalCount) * 100).toFixed(1)
      },
      returnStats: {
        r1m: {
          mean: this.mean(r1m),
          median: this.median(r1m),
          min: r1m.length ? Math.min(...r1m) : 0,
          max: r1m.length ? Math.max(...r1m) : 0,
          winRate: r1m.length ? (r1m.filter(v => v > 0).length / r1m.length) * 100 : 0
        },
        r3m: {
          mean: this.mean(r3m),
          median: this.median(r3m),
          min: r3m.length ? Math.min(...r3m) : 0,
          max: r3m.length ? Math.max(...r3m) : 0
        },
        r6m: {
          mean: this.mean(r6m),
          median: this.median(r6m),
          min: r6m.length ? Math.min(...r6m) : 0,
          max: r6m.length ? Math.max(...r6m) : 0,
          winRate: r6m.length ? (r6m.filter(v => v > 0).length / r6m.length) * 100 : 0
        }
      },
      disparityStats: {
        meanAbsDisparity: this.mean(disparities),
        highDisparityCount,
        highDisparityPct: ((highDisparityCount / totalCount) * 100).toFixed(1)
      },
      concentration: {
        cr5: totalAUM > 0 ? (top5Aum / totalAUM) * 100 : 0,
        cr10: totalAUM > 0 ? (top10Aum / totalAUM) * 100 : 0
      }
    };
  },

  /**
   * Aggregate by Brand / Issuer
   */
  getBrandAnalytics(items) {
    const brandMap = {};
    let totalMarketAum = 0;

    items.forEach(it => {
      totalMarketAum += it.totalNetAssets;
      if (!brandMap[it.brand]) {
        brandMap[it.brand] = {
          brand: it.brand,
          issuer: it.issuer,
          color: it.brandColor,
          count: 0,
          totalAum: 0,
          totalTradingValue: 0,
          returns1m: [],
          returns6m: []
        };
      }
      const b = brandMap[it.brand];
      b.count++;
      b.totalAum += it.totalNetAssets;
      b.totalTradingValue += it.tradingValue;
      if (it.returnRate1m != null) b.returns1m.push(it.returnRate1m);
      if (it.returnRate6m != null) b.returns6m.push(it.returnRate6m);
    });

    const result = Object.values(brandMap).map(b => ({
      brand: b.brand,
      issuer: b.issuer,
      color: b.color,
      count: b.count,
      aumCho: b.totalAum / 1e12,
      tradingValueEok: b.totalTradingValue / 1e8,
      marketShare: totalMarketAum > 0 ? (b.totalAum / totalMarketAum) * 100 : 0,
      avgReturn1m: this.mean(b.returns1m),
      avgReturn6m: this.mean(b.returns6m)
    }));

    return result.sort((a, b) => b.aumCho - a.aumCho);
  },

  /**
   * Aggregate by Major Asset Category
   */
  getCategoryAnalytics(items) {
    const catMap = {};
    let totalMarketAum = 0;

    items.forEach(it => {
      totalMarketAum += it.totalNetAssets;
      if (!catMap[it.category]) {
        catMap[it.category] = {
          category: it.category,
          count: 0,
          totalAum: 0,
          totalTradingValue: 0,
          returns1m: [],
          returns6m: []
        };
      }
      const c = catMap[it.category];
      c.count++;
      c.totalAum += it.totalNetAssets;
      c.totalTradingValue += it.tradingValue;
      if (it.returnRate1m != null) c.returns1m.push(it.returnRate1m);
      if (it.returnRate6m != null) c.returns6m.push(it.returnRate6m);
    });

    const result = Object.values(catMap).map(c => ({
      category: c.category,
      count: c.count,
      aumCho: c.totalAum / 1e12,
      tradingValueEok: c.totalTradingValue / 1e8,
      share: totalMarketAum > 0 ? (c.totalAum / totalMarketAum) * 100 : 0,
      avgReturn1m: this.mean(c.returns1m),
      avgReturn6m: this.mean(c.returns6m)
    }));

    return result.sort((a, b) => b.aumCho - a.aumCho);
  },

  /**
   * Return Distribution Bins
   */
  getReturnHistogram(items, period = '1m') {
    const key = period === '6m' ? 'returnRate6m' : period === '3m' ? 'returnRate3m' : 'returnRate1m';
    const bins = [
      { label: '-20% 이하', min: -Infinity, max: -20, count: 0, color: '#be123c' },
      { label: '-20% ~ -10%', min: -20, max: -10, count: 0, color: '#e11d48' },
      { label: '-10% ~ -5%', min: -10, max: -5, count: 0, color: '#f43f5e' },
      { label: '-5% ~ 0%', min: -5, max: 0, count: 0, color: '#fb7185' },
      { label: '0% ~ +5%', min: 0, max: 5, count: 0, color: '#34d399' },
      { label: '+5% ~ +10%', min: 5, max: 10, count: 0, color: '#10b981' },
      { label: '+10% ~ +20%', min: 10, max: 20, count: 0, color: '#059669' },
      { label: '+20% 이상', min: 20, max: Infinity, count: 0, color: '#047857' }
    ];

    items.forEach(it => {
      const val = it[key];
      if (val != null) {
        for (const b of bins) {
          if (val >= b.min && val < b.max) {
            b.count++;
            break;
          }
        }
      }
    });

    return bins;
  },

  /**
   * Disparity Outliers (괴리율 이상치)
   */
  getDisparityOutliers(items, limit = 8) {
    const valid = items.filter(it => it.iNav > 0 && Math.abs(it.disparity) > 0.05);
    const sorted = [...valid].sort((a, b) => b.disparity - a.disparity);

    const highestPremium = sorted.slice(0, limit); // 고평가/과열
    const highestDiscount = sorted.slice(-limit).reverse(); // 저평가/할인

    return {
      highestPremium,
      highestDiscount
    };
  },

  /**
   * Theme Analytics
   */
  getThemeAnalytics(items) {
    const themeList = [
      '반도체/AI', '2차전지', '배당/월배당', '미국대표', '국내대표',
      '채권/금리', '바이오', '방산/인프라', '밸류업', '레버리지', '인버스', '액티브'
    ];

    const result = themeList.map(theme => {
      const matched = items.filter(it => it.tags.includes(theme));
      const aum = matched.reduce((s, it) => s + it.totalNetAssets, 0);
      const r1m = matched.map(it => it.returnRate1m).filter(v => v != null);
      const r6m = matched.map(it => it.returnRate6m).filter(v => v != null);

      return {
        theme,
        count: matched.length,
        aumCho: aum / 1e12,
        avgReturn1m: this.mean(r1m),
        avgReturn6m: this.mean(r6m)
      };
    });

    return result.sort((a, b) => b.aumCho - a.aumCho);
  },

  /**
   * Scatter Plot Data (1M vs 6M Return)
   */
  getScatterData(items) {
    return items
      .filter(it => it.returnRate1m != null && it.returnRate6m != null && it.totalNetAssets > 1e10)
      .map(it => ({
        x: it.returnRate1m,
        y: it.returnRate6m,
        r: Math.max(3, Math.min(22, Math.sqrt(it.aumCho) * 4.5)),
        name: it.itemName,
        code: it.itemCode,
        brand: it.brand,
        aumCho: it.aumCho.toFixed(2),
        category: it.category
      }));
  }
};

window.ETF_EDA = ETF_EDA;
