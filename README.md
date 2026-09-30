# 📊 K-ETF Market Radar | 네이버 증권 실시간 ETF 종합 EDA 대시보드

네이버 증권 ETF 실시간 API(`https://stock.naver.com/api/stockSecurity/etfs/v2/domestic?listingType=aumDesc&size=100&index=1`)를 통해 국내 전체 상장 ETF(**1,070+ 종목**)를 실시간으로 연동하여 종합적인 **탐색적 데이터 분석(EDA)** 및 투자 인사이트를 제공하는 **정적 웹 대시보드**입니다.

GitHub Pages, Vercel, Netlify 등 정적 호스팅 서비스에 즉시 배포할 수 있도록 순수 HTML/CSS/JavaScript(Vanilla Stack)로 구축되었습니다.

---

## 🚀 주요 기능 (Key Features)

### 1. ⚡ 실시간 네이버 증권 API 스트리밍 연동 & 스마트 폴백
- **실시간 스트리밍 수집**: 대시보드 상단의 `실시간 새로고침` 버튼을 누르면 브라우저에서 네이버 증권 API 페이지(1~12 페이지)를 비동기 스트리밍으로 순회 수집하며 진행률(0~100%)을 실시간 프로그레스 바로 표시합니다.
- **다중 폴백(Triple Fallback) 안전망**:
  1. `Direct Fetch`: 동일 출처 및 API 직접 호출
  2. `CORS Proxy Fallback`: 정적 브라우저 환경에서 발생할 수 있는 CORS 제한을 자동 감지하여 프록시로 우회 연동
  3. `Embedded / Local Snapshot`: 네트워크 연결이 없거나 로컬 파일(`file:///`)로 바로 열었을 때도 0초 즉시 로딩 지원

### 2. 📈 거시 시장 핵심 지표 요약 (Market Overview KPIs)
- **총 순자산총액 (Market AUM)**: 약 134조 원 규모 및 상위 10개 ETF 집중도(CR10) 실시간 산출
- **당일 등락 현황 (Market Breadth)**: 상승 / 하락 / 보합 종목 수 및 비율 시각화 바
- **당일 총 거래대금 (Trading Liquidity)**: 시장 전체 유동성 및 최대 거래대금 종목 추적
- **수익률 스펙트럼 (Return Spectrum)**: 1개월 / 3개월 / 6개월 시장 평균 수익률, 중앙값(Median), 상승 승률(Win Rate %)
- **iNAV 평균 절대 괴리율 (Disparity Alert)**: 실시간 추정 순자산가치 대비 괴리율 및 1% 초과 고괴리율 주의 종목 수 집계

### 3. 📊 종합 EDA 시각화 분석 센터 (6개 인터랙티브 탭)
- **1. 운용사(브랜드) 점유율**: TIGER, KODEX, RISE, ACE, SOL, PLUS 등 운용사별 AUM 도넛 차트 및 과점 구조(CR2) 분석
- **2. 자산군/유형별 분석**: 국내주식형, 해외주식형, 국내채권형, 해외채권형, 파생/레버리지, 혼합자산 등의 AUM과 종목 수 비교
- **3. 수익률 분포 분석 (Histogram)**: 1M / 3M / 6M 구간별 수익률 정규분포 및 왜도(Skewness), 극단값 EDA
- **4. 모멘텀 사분면 (1M vs 6M)**: 단기(1개월)와 중기(6개월) 수익률을 X/Y 축으로 매핑하고 순자산 크기로 버블 크기를 조절한 모멘텀 분석
- **5. 괴리율 리스크 탐지**: iNAV 대비 고평가(프리미엄) 및 저평가(할인) 이상치 종목 감지
- **6. 주요 테마 성과**: 반도체/AI, 2차전지, 배당/월배당, 미국대표, 국내대표, 채권/금리, 방산, 밸류업 등 테마별 성과 비교

### 4. 🔍 ETF 종목 정밀 탐색기 (Deep Dive Explorer)
- **실시간 검색**: 종목명, 종목코드(6자리), 운용사명 실시간 필터링
- **원클릭 인기 프리셋**: `🔥 오늘 상승`, `📈 1M 플러스`, `🚀 6M +30% 이상`, `⚠️ 괴리율 1% 초과 주의`, `💎 1조 이상 대형 ETF`
- **멀티 필터**: 운용사(12개사), 자산군(8개 분류), 핵심 테마(12개 태그) 필터 버튼
- **헤더 클릭 정렬**: 순자산, 거래대금, 등락률, 괴리율, 기간별 수익률 오름차순/내림차순 정렬
- **종목 상세 모달**: 종목 클릭 시 상세 지표 및 네이버 증권 종목 페이지 바로가기 링크 제공
- **데이터 내보내기**: 분석 결과 `CSV 다운로드`, `JSON 다운로드`, `분석 리포트 클립보드 복사` 지원

---

## 📁 프로젝트 구조

```
etfdashboard/
├── index.html            # 메인 대시보드 HTML (시맨틱 구조 & 반응형 레이아웃)
├── css/
│   └── style.css         # 다크 테마 & 글래스모피즘 파이낸셜 터미널 스타일
├── js/
│   ├── default_data.js   # 로컬 오프라인 즉시 로딩용 초기 스냅샷 데이터
│   ├── api.js            # 네이버 증권 API 실시간 스트리밍 & CORS 폴백 엔진
│   ├── eda.js            # 통계 집계, 정규화 및 정량적 EDA 연산 엔진
│   ├── charts.js         # Chart.js 시각화 탭 및 인사이트 생성 엔진
│   └── app.js            # 전체 UI 이벤트 제어, 필터링, 정렬, 모달, 내보내기
├── data/
│   └── etfs.json         # 1,070+ 개 ETF 전체 데이터셋 (JSON)
├── fetch_etf.py          # Python 기반 실시간 데이터 배치 수집 스크립트 (uv 지원)
└── README.md             # 프로젝트 안내서
```

---

## 💻 로컬 실행 방법

### 방법 1. 브라우저에서 직접 열기 (설치 불필요)
- `index.html` 파일을 더블 클릭하여 크롬, 엣지, 웨일 등 모던 웹 브라우저에서 바로 열 수 있습니다. (내장 스냅샷 데이터가 즉시 로드됩니다.)

### 방법 2. 로컬 웹 서버 실행 (uv 사용)
프로젝트 폴더에서 `uv` 명령어로 간단한 로컬 웹 서버를 실행할 수 있습니다:

```powershell
uv run python -m http.server 8088
```
브라우저에서 `http://127.0.0.1:8088`에 접속합니다.

---

## 🐍 데이터 갱신 스크립트 (fetch_etf.py)

터미널에서 직접 최신 ETF 데이터를 수집하여 `data/etfs.json`과 `js/default_data.js`를 갱신하려면 다음 명령어를 실행합니다:

```powershell
uv run python fetch_etf.py
```

---

## 🌐 정적 웹 호스팅 배포 안내 (GitHub Pages)

1. GitHub 저장소를 생성하고 이 폴더의 파일들을 커밋 & 푸시합니다:
   ```bash
   git init
   git add .
   git commit -m "feat: Initial commit for K-ETF Market Radar EDA Dashboard"
   git branch -M main
   git remote add origin https://github.com/<사용자명>/<저장소명>.git
   git push -u origin main
   ```
2. 저장소의 **Settings** -> **Pages** 로 이동합니다.
3. **Build and deployment**의 Source를 `Deploy from a branch`로 선택하고, Branch를 `main` / `/(root)`로 설정 후 **Save**합니다.
4. 배포 완료 후 제공되는 URL(예: `https://<사용자명>.github.io/<저장소명>/`)로 전 세계 어디서나 접속할 수 있습니다!
