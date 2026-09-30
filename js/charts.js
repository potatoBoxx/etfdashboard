/**
 * Chart.js Visualization Center for ETF EDA
 * Manages reactive charts and analytical insights
 */

const ETF_CHARTS = {
  currentChart: null,
  activeTab: 'brand',
  activePeriod: '1m',

  // Chart theme defaults
  chartDefaults: {
    color: '#94a3b8',
    font: {
      family: "'Pretendard', sans-serif",
      size: 11
    }
  },

  init() {
    if (window.Chart) {
      Chart.defaults.color = this.chartDefaults.color;
      Chart.defaults.font.family = this.chartDefaults.font.family;
      Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
      Chart.defaults.plugins.tooltip.borderColor = 'rgba(56, 189, 248, 0.4)';
      Chart.defaults.plugins.tooltip.borderWidth = 1;
      Chart.defaults.plugins.tooltip.padding = 10;
      Chart.defaults.plugins.tooltip.boxPadding = 4;
    }
  },

  destroyCurrent() {
    if (this.currentChart) {
      this.currentChart.destroy();
      this.currentChart = null;
    }
  },

  /**
   * Render chart according to active tab
   */
  renderActive(items) {
    this.destroyCurrent();
    const canvas = document.getElementById('mainChartCanvas');
    if (!canvas || !window.Chart) return;

    const ctx = canvas.getContext('2d');

    switch (this.activeTab) {
      case 'brand':
        this.renderBrandChart(ctx, items);
        break;
      case 'asset':
        this.renderAssetChart(ctx, items);
        break;
      case 'returns':
        this.renderReturnsChart(ctx, items);
        break;
      case 'scatter':
        this.renderScatterChart(ctx, items);
        break;
      case 'disparity':
        this.renderDisparityChart(ctx, items);
        break;
      case 'theme':
        this.renderThemeChart(ctx, items);
        break;
      default:
        this.renderBrandChart(ctx, items);
    }
  },

  /**
   * 1. Brand Ecosystem Chart
   */
  renderBrandChart(ctx, items) {
    const brands = ETF_EDA.getBrandAnalytics(items);
    const topBrands = brands.slice(0, 9);
    const otherAum = brands.slice(9).reduce((s, b) => s + b.aumCho, 0);

    const labels = topBrands.map(b => `${b.brand} (${b.marketShare.toFixed(1)}%)`);
    const data = topBrands.map(b => b.aumCho);
    const bgColors = topBrands.map(b => b.color);

    if (otherAum > 0) {
      labels.push(`기타 운용사 (${(otherAum / brands.reduce((s, b) => s + b.aumCho, 0) * 100).toFixed(1)}%)`);
      data.push(otherAum);
      bgColors.push('#475569');
    }

    this.currentChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: bgColors,
          borderColor: '#0f172a',
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { boxWidth: 12, padding: 14 }
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const val = ctx.raw || 0;
                return ` 순자산(AUM): ${val.toFixed(2)}조 원`;
              }
            }
          }
        },
        cutout: '62%'
      }
    });

    // Update Insights
    const cr2 = ((topBrands[0].aumCho + topBrands[1].aumCho) / brands.reduce((s, b) => s + b.aumCho, 0) * 100).toFixed(1);
    const bestBrand = [...brands].filter(b => b.count >= 10).sort((a, b) => b.avgReturn6m - a.avgReturn6m)[0];

    this.updateInsights('운용사 생태계 EDA 인사이트', [
      `<strong>양강 과점 구조 (CR2 = ${cr2}%):</strong> 국내 ETF 시장 순자산의 절반 이상을 <strong>${topBrands[0].brand}</strong>(${topBrands[0].aumCho.toFixed(1)}조원)와 <strong>${topBrands[1].brand}</strong>(${topBrands[1].aumCho.toFixed(1)}조원)가 차지하고 있습니다.`,
      `<strong>중위권 경쟁 심화:</strong> KB의 <strong>${topBrands[2].brand}</strong>, 한투의 <strong>${topBrands[3].brand}</strong>, 신한의 <strong>${topBrands[4].brand}</strong> 등이 월배당 및 테마형 상품을 앞세워 맹추격 중입니다.`,
      `<strong>6개월 평균 수익률 1위 운용사:</strong> 10개 이상 상장 기준 <strong>${bestBrand ? bestBrand.brand : 'TIGER'}</strong> (평균 6M 수익률 +${bestBrand ? bestBrand.avgReturn6m.toFixed(1) : 0}%)`
    ]);
  },

  /**
   * 2. Asset Allocation Chart
   */
  renderAssetChart(ctx, items) {
    const cats = ETF_EDA.getCategoryAnalytics(items);

    this.currentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: cats.map(c => c.category),
        datasets: [
          {
            label: '순자산총액 (조원)',
            data: cats.map(c => c.aumCho),
            backgroundColor: '#38bdf8',
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            label: '종목 수 (개)',
            data: cats.map(c => c.count),
            backgroundColor: '#a855f7',
            borderRadius: 4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: '순자산총액 (조원)' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: '종목 수 (개)' },
            grid: { drawOnChartArea: false }
          }
        },
        plugins: {
          legend: { position: 'top' }
        }
      }
    });

    const topCat = cats[0] || { category: '국내주식형', aumCho: 0, share: 0 };
    const secondCat = cats[1] || { category: '해외주식형', aumCho: 0, share: 0 };

    this.updateInsights('자산군 배분 EDA 인사이트', [
      `<strong>최대 자산군:</strong> <strong>${topCat.category}</strong>이 ${topCat.aumCho.toFixed(1)}조원(${topCat.share.toFixed(1)}%)으로 여전히 가장 큰 비중을 차지합니다.`,
      `<strong>해외주식형 약진:</strong> 미국 S&P500, 나스닥100, 반도체 테마를 필두로 <strong>${secondCat.category}</strong>(${secondCat.aumCho.toFixed(1)}조원)의 자금 유입이 가속화되고 있습니다.`,
      `<strong>금리/파킹형 채권 ETF:</strong> CD금리 및 KOFR 등 무위험 단기 파킹형 채권 ETF가 단일 종목 기준 수조 원대 AUM을 형성하며 시장 안전판 역할을 수행 중입니다.`
    ]);
  },

  /**
   * 3. Return Distribution Histogram
   */
  renderReturnsChart(ctx, items) {
    const bins = ETF_EDA.getReturnHistogram(items, this.activePeriod);
    const periodLabel = this.activePeriod === '6m' ? '6개월' : this.activePeriod === '3m' ? '3개월' : '1개월';

    this.currentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bins.map(b => b.label),
        datasets: [{
          label: `${periodLabel} 수익률 구간별 종목 수`,
          data: bins.map(b => b.count),
          backgroundColor: bins.map(b => b.color),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: { display: true, text: '종목 수 (개)' }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    const summary = ETF_EDA.calculateMarketSummary(items);
    const stat = this.activePeriod === '6m' ? summary.returnStats.r6m : this.activePeriod === '3m' ? summary.returnStats.r3m : summary.returnStats.r1m;

    this.updateInsights(`${periodLabel} 수익률 분포 인사이트`, [
      `<strong>평균 vs 중앙값:</strong> 평균 수익률은 <strong>${stat.mean >= 0 ? '+' : ''}${stat.mean.toFixed(2)}%</strong>, 중앙값(Median)은 <strong>${stat.median >= 0 ? '+' : ''}${stat.median.toFixed(2)}%</strong>입니다.`,
      `<strong>수익률 극단값:</strong> 최고 성과 <strong>+${stat.max.toFixed(1)}%</strong>부터 최저 <strong>${stat.min.toFixed(1)}%</strong>까지 극심한 종목별 양극화가 나타납니다.`,
      `<strong>상승 종목 비율:</strong> 전체 ETF 중 플러스 수익률을 기록한 비율은 <strong>${(stat.winRate || 0).toFixed(1)}%</strong>입니다.`
    ]);
  },

  /**
   * 4. Momentum Scatter Plot (1M vs 6M)
   */
  renderScatterChart(ctx, items) {
    const scatterData = ETF_EDA.getScatterData(items);

    this.currentChart = new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: [{
          label: 'ETF 종목 (버블 크기: 순자산)',
          data: scatterData,
          backgroundColor: function (context) {
            const raw = context.raw;
            if (!raw) return 'rgba(56, 189, 248, 0.5)';
            if (raw.x > 0 && raw.y > 0) return 'rgba(16, 185, 129, 0.6)'; // 지속 상승
            if (raw.x > 0 && raw.y < 0) return 'rgba(56, 189, 248, 0.6)'; // 반등/턴어라운드
            if (raw.x < 0 && raw.y > 0) return 'rgba(245, 158, 11, 0.6)'; // 단기 조정
            return 'rgba(244, 63, 94, 0.6)'; // 지속 하락
          },
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { display: true, text: '1개월 수익률 (%)' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          y: {
            title: { display: true, text: '6개월 수익률 (%)' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              title: (ctx) => ctx[0].raw.name,
              label: (ctx) => {
                const r = ctx.raw;
                return [
                  `종목코드: ${r.code} (${r.brand})`,
                  `1개월: ${r.x}% | 6개월: ${r.y}%`,
                  `순자산(AUM): ${r.aumCho}조 원`
                ];
              }
            }
          },
          legend: { display: false }
        }
      }
    });

    this.updateInsights('모멘텀 사분면 분석 인사이트', [
      `<strong>우상단 (초록, 지속 강세):</strong> 1개월과 6개월 모두 플러스로 모멘텀이 강하게 유지되는 종목군(AI·반도체, 미국 빅테크, 고배당 등).`,
      `<strong>우하단 (하늘, 턴어라운드):</strong> 6개월 하락 후 최근 1개월 반등에 성공한 바닥권 전환 후보군.`,
      `<strong>좌하단 (빨강, 지속 약세):</strong> 1개월 및 6개월 연속 하락세를 지속하는 주의 종목군(레버리지 역방향, 침체 섹터 등).`
    ]);
  },

  /**
   * 5. Disparity (괴리율) Outlier Chart
   */
  renderDisparityChart(ctx, items) {
    const outliers = ETF_EDA.getDisparityOutliers(items, 6);
    const combined = [...outliers.highestPremium, ...outliers.highestDiscount];

    const labels = combined.map(it => `${it.itemName.slice(0, 12)}..`);
    const data = combined.map(it => it.disparity);
    const colors = combined.map(it => it.disparity >= 0 ? '#f59e0b' : '#38bdf8');

    this.currentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: '괴리율 (%) = (현재가 - iNAV) / iNAV',
          data: data,
          backgroundColor: colors,
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: { display: true, text: '괴리율 (%)' }
          },
          y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const item = combined[ctx.dataIndex];
                return [
                  `괴리율: ${item.disparity.toFixed(2)}%`,
                  `현재가: ${item.currentPrice.toLocaleString()}원 | iNAV: ${item.iNav.toLocaleString()}원`,
                  `거래량: ${item.tradingVolume.toLocaleString()}주`
                ];
              }
            }
          }
        }
      }
    });

    this.updateInsights('괴리율(Disparity) 리스크 탐지', [
      `<strong>괴리율 과열 주의 (골드 바):</strong> 현재가가 iNAV(실시간 추정 순자산가치) 대비 프리미엄이 붙어 고평가된 상태입니다. LP의 호가 공급 부족이나 일시적 매수 쏠림에 주의해야 합니다.`,
      `<strong>괴리율 할인 기회/저평가 (하늘색 바):</strong> 시장가격이 실제 자산가치보다 낮게 거래되는 종목입니다.`,
      `<strong>해외자산 시차 효과:</strong> 해외 시장이 휴장 중이거나 시차가 있는 경우 선물 가격 변동으로 일시적 괴리율 확대가 발생할 수 있습니다.`
    ]);
  },

  /**
   * 6. Theme Analytics Chart
   */
  renderThemeChart(ctx, items) {
    const themes = ETF_EDA.getThemeAnalytics(items);

    this.currentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: themes.map(t => t.theme),
        datasets: [
          {
            label: '순자산총액 (조원)',
            data: themes.map(t => t.aumCho),
            backgroundColor: '#6366f1',
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            label: '6개월 평균 수익률 (%)',
            data: themes.map(t => t.avgReturn6m),
            backgroundColor: '#10b981',
            borderRadius: 4,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
          y: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: '순자산총액 (조원)' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: '6개월 평균 수익률 (%)' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });

    const topThemeByReturn = [...themes].sort((a, b) => b.avgReturn6m - a.avgReturn6m)[0];

    this.updateInsights('핵심 테마별 성과 비교 인사이트', [
      `<strong>최대 자금 집결 테마:</strong> AUM 규모 기준으로 <strong>${themes[0].theme}</strong>과 <strong>${themes[1].theme}</strong>에 기관 및 개인 자금이 가장 두텁게 형성되어 있습니다.`,
      `<strong>6개월 수익률 선도 테마:</strong> <strong>${topThemeByReturn ? topThemeByReturn.theme : '반도체/AI'}</strong> (평균 6M 수익률 +${topThemeByReturn ? topThemeByReturn.avgReturn6m.toFixed(1) : 0}%)가 압도적인 모멘텀을 주도하고 있습니다.`,
      `<strong>월배당 / 커버드콜 붐:</strong> 안정적인 현금 흐름을 선호하는 투자자 증가로 커버드콜 및 월분배형 ETF 종목 수와 자산 규모가 급증했습니다.`
    ]);
  },

  /**
   * Helper to update insight list in the right card
   */
  updateInsights(title, bullets) {
    const titleEl = document.getElementById('chartInsightsTitle');
    const listEl = document.getElementById('chartInsightsList');
    if (titleEl) titleEl.innerHTML = title;
    if (listEl) {
      listEl.innerHTML = bullets.map(b => `<li>${b}</li>`).join('');
    }
  }
};

window.ETF_CHARTS = ETF_CHARTS;
