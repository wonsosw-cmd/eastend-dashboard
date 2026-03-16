/**
 * EASTEND Dashboard 자동화 Google Apps Script
 * 기능:
 * 1. Google Sheet에서 데이터 읽기
 * 2. 대시보드 데이터 구조로 변환
 * 3. Google Drive에서 HTML 템플릿 읽기
 * 4. 데이터를 템플릿에 주입
 * 5. 최종 HTML을 GitHub Pages로 푸시
 * 6. 백업 복사본을 Google Drive에 저장
 * 7. 매일 10:30 AM KST에 자동 실행
 */

// ==================== 설정 ====================
const CONFIG = {
  SHEET_ID: '1GvaFMIVhRwjIfbw5u5bx49twdflBCXK9',
  SHEET_NAME: '2026_클로드 업로드용_세로형',
  TEMPLATE_GITHUB_URL: 'https://raw.githubusercontent.com/wonsosw-cmd/eastend-dashboard/main/template.html',
  VIEWS_DATA_GITHUB_URL: 'https://raw.githubusercontent.com/wonsosw-cmd/eastend-dashboard/main/views_data.json',
  BACKUP_FOLDER_ID: '19jE-gm8fnVGTjGdtE9NpiyWrkFEzFvnP',

  // GitHub 설정
  GITHUB_TOKEN: 'GITHUB_TOKEN_PLACEHOLDER',
  GITHUB_REPO: 'wonsosw-cmd/eastend-dashboard',
  GITHUB_FILE: 'index.html',
  GITHUB_BRANCH: 'main',

  // 데이터 행/열 설정
  HEADER_ROW_INDEX: 9, // 0-indexed (10번째 행)
  DATA_START_ROW_INDEX: 10, // 0-indexed (11번째 행부터)
  STORE_CODE_COL: 0, // A열
  DATE_START_COL: 6, // G열 (7번째 열부터 날짜)
};

// 매장 코드별 정보 매핑
var STORE_MAP = {
  'C010': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'더현대서울'},
  'C020': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'롯데 노원점'},
  'C019': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'롯데 대전점'},
  'C008': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'롯데 부산본점'},
  'C021': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'롯데 안산점'},
  'C015': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'롯데 인천점'},
  'C018': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'롯데월드몰'},
  'C017': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'신세계 대전점'},
  'C016': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'신세계 의정부점'},
  'C005': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'한남FSS'},
  'C014': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'현대 울산점'},
  'C002': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'현대 중동점'},
  'C009': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'현대 천호점'},
  'C013': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'현대 킨텍스점'},
  'C001': {brand:'시티브리즈',channel:'오프라인',distribution:'정상',store:'현대 판교점'},
  'C004': {brand:'시티브리즈',channel:'오프라인',distribution:'아울렛',store:'현대 송도'},
  'C007': {brand:'시티브리즈',channel:'오프라인',distribution:'아울렛',store:'커넥트부산'},
  'C006': {brand:'시티브리즈',channel:'오프라인',distribution:'아울렛',store:'신세계 파주점'},
  'C011': {brand:'시티브리즈',channel:'오프라인',distribution:'아울렛',store:'롯데 동부산점'},
  'C012': {brand:'시티브리즈',channel:'오프라인',distribution:'아울렛',store:'더팩토리 기흥점'},
  'C999': {brand:'시티브리즈',channel:'오프라인',distribution:'행사',store:'행사'},
  'A003': {brand:'아티드',channel:'오프라인',distribution:'정상',store:'롯데 부산본점'},
  'A005': {brand:'아티드',channel:'오프라인',distribution:'정상',store:'신세계 의정부점'},
  'A002': {brand:'아티드',channel:'오프라인',distribution:'정상',store:'신세계 타임점'},
  'A004': {brand:'아티드',channel:'오프라인',distribution:'정상',store:'현대 판교점'},
  'A006': {brand:'아티드',channel:'오프라인',distribution:'아울렛',store:'더팩토리 기흥점'},
  'A001': {brand:'아티드',channel:'오프라인',distribution:'정상',store:'현대 판교 (ATD)'},
  'A999': {brand:'아티드',channel:'오프라인',distribution:'행사',store:'행사'},
  'K000': {brand:'아티드',channel:'온라인',distribution:'온라인',store:'자사몰'},
  'K004': {brand:'아티드',channel:'온라인',distribution:'온라인',store:'W컨셉'},
  'K001': {brand:'아티드',channel:'온라인',distribution:'온라인',store:'29cm'},
  'K006': {brand:'아티드',channel:'온라인',distribution:'온라인',store:'지그재그'},
  'K002': {brand:'아티드',channel:'온라인',distribution:'온라인',store:'에이블리'},
  'K003': {brand:'아티드',channel:'온라인',distribution:'온라인',store:'브론테'},
  'K005': {brand:'아티드',channel:'온라인',distribution:'온라인',store:'기타'},
  'O000': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'자사몰'},
  'O004': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'W컨셉'},
  'O001': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'29cm'},
  'O006': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'지그재그'},
  'O002': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'무신사'},
  'O007': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'롯데온'},
  'O008': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'하고'},
  'O009': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'네이버'},
  'O010': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'EQL'},
  'O011': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'카카오선물하기'},
  'O005': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'브론테'},
  'O999': {brand:'시티브리즈',channel:'온라인',distribution:'온라인',store:'기타'}
};

// 3월 목표값
var MARCH_TARGETS = {
  total: 4231,
  offline: 1083,
  online: 3148,
  cb_off: 885,
  at_off: 198,
  cb_on: 2080,
  at_on: 1068
};

// 매출 환율
var REVENUE_RATES = {
  online: 0.75,
  offline: 0.90
};

// 고정 주간 데이터 (S3용) - 하드코딩된 차트 데이터
var WEEKLY_BY_VIEW = {
  total: [
    {date: '3/3', cur: 451, prev: 438},
    {date: '3/4', cur: 489, prev: 512},
    {date: '3/5', cur: 521, prev: 495},
    {date: '3/6', cur: 512, prev: 518},
    {date: '3/7', cur: 498, prev: 502},
    {date: '3/8', cur: 515, prev: 481},
    {date: '3/9', cur: 543, prev: 528}
  ],
  offline: [
    {date: '3/3', cur: 125, prev: 138},
    {date: '3/4', cur: 145, prev: 162},
    {date: '3/5', cur: 155, prev: 145},
    {date: '3/6', cur: 142, prev: 148},
    {date: '3/7', cur: 138, prev: 142},
    {date: '3/8', cur: 148, prev: 135},
    {date: '3/9', cur: 165, prev: 158}
  ],
  online: [
    {date: '3/3', cur: 326, prev: 300},
    {date: '3/4', cur: 344, prev: 350},
    {date: '3/5', cur: 366, prev: 350},
    {date: '3/6', cur: 370, prev: 370},
    {date: '3/7', cur: 360, prev: 360},
    {date: '3/8', cur: 367, prev: 346},
    {date: '3/9', cur: 378, prev: 370}
  ],
  cb_off: [
    {date: '3/3', cur: 102, prev: 113},
    {date: '3/4', cur: 118, prev: 132},
    {date: '3/5', cur: 126, prev: 118},
    {date: '3/6', cur: 116, prev: 121},
    {date: '3/7', cur: 113, prev: 116},
    {date: '3/8', cur: 121, prev: 110},
    {date: '3/9', cur: 135, prev: 129}
  ],
  at_off: [
    {date: '3/3', cur: 23, prev: 25},
    {date: '3/4', cur: 27, prev: 30},
    {date: '3/5', cur: 29, prev: 27},
    {date: '3/6', cur: 26, prev: 27},
    {date: '3/7', cur: 25, prev: 26},
    {date: '3/8', cur: 27, prev: 25},
    {date: '3/9', cur: 30, prev: 29}
  ],
  cb_on: [
    {date: '3/3', cur: 216, prev: 199},
    {date: '3/4', cur: 228, prev: 232},
    {date: '3/5', cur: 242, prev: 232},
    {date: '3/6', cur: 245, prev: 245},
    {date: '3/7', cur: 239, prev: 239},
    {date: '3/8', cur: 243, prev: 229},
    {date: '3/9', cur: 250, prev: 245}
  ],
  at_on: [
    {date: '3/3', cur: 110, prev: 101},
    {date: '3/4', cur: 116, prev: 118},
    {date: '3/5', cur: 124, prev: 118},
    {date: '3/6', cur: 125, prev: 125},
    {date: '3/7', cur: 121, prev: 121},
    {date: '3/8', cur: 124, prev: 117},
    {date: '3/9', cur: 128, prev: 125}
  ]
};

// ==================== 메인 파이프라인 함수 ====================

/**
 * 메인 파이프라인 함수 - 전체 자동화 프로세스 실행
 */
function dailyPipeline() {
  try {
    Logger.log('=== EASTEND Dashboard 파이프라인 시작 ===');
    Logger.log('실행 시간: ' + new Date().toString());

    // 1. Google Sheet에서 데이터 읽기
    Logger.log('1단계: Sheet에서 데이터 읽기...');
    var sheetData = readSheetData();
    Logger.log('  - ' + sheetData.rows.length + '개 매장의 데이터 읽음');

    // 2. 대시보드 데이터 구조로 변환
    Logger.log('2단계: 데이터 변환...');
    var viewsData = transformToViewsData(sheetData);
    Logger.log('  - ' + Object.keys(viewsData).length + '개 뷰 생성됨');

    // 3. Google Drive에서 HTML 템플릿 읽기
    Logger.log('3단계: HTML 템플릿 읽기...');
    var htmlTemplate = readHtmlTemplate();
    Logger.log('  - 템플릿 로드 완료');

    // 4. 데이터를 템플릿에 주입
    Logger.log('4단계: 데이터를 템플릿에 주입...');
    var finalHtml = injectDataToTemplate(htmlTemplate, viewsData);
    Logger.log('  - 주입 완료');

    // 5. GitHub에 푸시
    Logger.log('5단계: GitHub에 파일 푸시...');
    pushToGitHub(finalHtml);
    Logger.log('  - GitHub 푸시 완료');

    // 6. Google Drive에 백업 저장
    Logger.log('6단계: Google Drive에 백업 저장...');
    saveBackupToDrive(finalHtml);
    Logger.log('  - 백업 저장 완료');

    Logger.log('=== 파이프라인 완료 (성공) ===\n');

  } catch (error) {
    Logger.log('ERROR: ' + error.toString());
    Logger.log('스택: ' + error.stack);
    // 에러 알림 (선택사항)
    sendErrorNotification(error);
  }
}

// ==================== 데이터 읽기 ====================

/**
 * Google Sheet에서 데이터를 읽음
 * @returns {Object} {rows: Array, headers: Array, dateColumns: Array}
 */
function readSheetData() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
      throw new Error('Sheet "' + CONFIG.SHEET_NAME + '" not found');
    }

    // 전체 데이터 범위 가져오기
    var data = sheet.getDataRange().getValues();

    // 헤더 행 (0-indexed)
    var headerRow = data[CONFIG.HEADER_ROW_INDEX];
    Logger.log('  - 헤더: ' + headerRow.slice(0, 8).toString());

    // 날짜 열 추출
    var dateColumns = [];
    for (var i = CONFIG.DATE_START_COL; i < headerRow.length; i++) {
      var headerVal = headerRow[i];
      if (headerVal instanceof Date) {
        dateColumns.push({
          index: i,
          date: headerVal,
          dateStr: formatDateForDisplay(headerVal)
        });
      }
    }
    Logger.log('  - 날짜 열: ' + dateColumns.length + '개 (컬럼 ' + CONFIG.DATE_START_COL + '부터)');

    // 데이터 행 추출
    var rows = [];
    for (var i = CONFIG.DATA_START_ROW_INDEX; i < data.length; i++) {
      var row = data[i];
      var storeCode = row[CONFIG.STORE_COL] ? String(row[CONFIG.STORE_COL]).trim() : '';

      if (!storeCode || !STORE_MAP[storeCode]) {
        continue; // 유효하지 않은 매장 코드 건너뛰기
      }

      var storeInfo = STORE_MAP[storeCode];
      var rowData = {
        storeCode: storeCode,
        brand: storeInfo.brand,
        channel: storeInfo.channel,
        distribution: storeInfo.distribution,
        store: storeInfo.store,
        dailyValues: {}
      };

      // 각 날짜별 값 추출
      for (var j = 0; j < dateColumns.length; j++) {
        var colIndex = dateColumns[j].index;
        var dateStr = dateColumns[j].dateStr;
        var value = row[colIndex];

        // 수치로 변환 (0이면 0, 없으면 0)
        var numValue = parseFloat(value) || 0;
        rowData.dailyValues[dateStr] = numValue;
      }

      rows.push(rowData);
    }

    Logger.log('  - 데이터 행: ' + rows.length + '개');

    return {
      rows: rows,
      headers: headerRow,
      dateColumns: dateColumns,
      today: new Date()
    };

  } catch (error) {
    throw new Error('readSheetData 실패: ' + error.toString());
  }
}

// ==================== 데이터 변환 ====================

/**
 * Sheet 데이터를 뷰별 대시보드 구조로 변환
 * @param {Object} sheetData - Sheet에서 읽은 데이터
 * @returns {Object} views_data 구조
 */
function transformToViewsData(sheetData) {
  try {
    var today = new Date();
    var currentMonth = today.getMonth() + 1; // 1-12
    var currentYear = today.getFullYear();

    // 현재 달의 모든 일자 추출
    var currentMonthDates = sheetData.dateColumns.filter(function(col) {
      return col.date.getFullYear() === currentYear &&
             (col.date.getMonth() + 1) === currentMonth;
    });

    // 현재 주 (월-일) 추출
    var currentWeekData = getCurrentWeekData(sheetData, today);
    var previousWeekData = getPreviousWeekData(sheetData, today);

    // 7개 뷰 초기화
    var viewsData = {
      total: initializeView('총매출'),
      offline: initializeView('오프라인'),
      online: initializeView('온라인'),
      cb_off: initializeView('시티브리즈 오프라인'),
      at_off: initializeView('아티드 오프라인'),
      cb_on: initializeView('시티브리즈 온라인'),
      at_on: initializeView('아티드 온라인')
    };

    // S1 데이터 계산 (누적 매출, 목표 대비)
    computeS1Data(viewsData, sheetData, currentMonthDates, today);

    // S2 데이터 계산 (주간 일일 데이터)
    computeS2Data(viewsData, sheetData, currentWeekData, previousWeekData);

    // S3 데이터: WEEKLY_BY_VIEW 사용
    computeS3Data(viewsData);

    // S4 데이터 계산 (매장 계층 구조)
    computeS4Data(viewsData, sheetData, currentWeekData, previousWeekData);

    return viewsData;

  } catch (error) {
    throw new Error('transformToViewsData 실패: ' + error.toString());
  }
}

/**
 * 뷰 객체 초기화
 */
function initializeView(name) {
  return {
    name: name,
    s1: {
      curCum: 0,      // 누적값
      curRev: 0,      // 누적 매출
      target: 0,      // 목표값
      rate: 0,        // 달성률
      comparison: {}  // 비교 데이터
    },
    s2: {
      current: [],    // 현재 주
      previous: []    // 이전 주
    },
    s3: [],           // WEEKLY_BY_VIEW에서 가져옴
    s4: {
      current: [],    // 현재 주 매장 데이터
      previous: []    // 이전 주 매장 데이터
    }
  };
}

/**
 * S1 데이터 계산 (누적 매출, 목표 대비)
 */
function computeS1Data(viewsData, sheetData, currentMonthDates, today) {
  try {
    // 각 뷰별로 집계
    for (var storeIdx = 0; storeIdx < sheetData.rows.length; storeIdx++) {
      var row = sheetData.rows[storeIdx];
      var brand = row.brand;
      var channel = row.channel;
      var distribution = row.distribution;

      // 이번 달 누적값 계산
      var storeMonthlySum = 0;
      for (var i = 0; i < currentMonthDates.length; i++) {
        var dateStr = currentMonthDates[i].dateStr;
        storeMonthlySum += row.dailyValues[dateStr] || 0;
      }

      // 각 뷰에 추가
      // total
      viewsData.total.s1.curCum += storeMonthlySum;

      // 채널별
      if (channel === '오프라인') {
        viewsData.offline.s1.curCum += storeMonthlySum;
      } else if (channel === '온라인') {
        viewsData.online.s1.curCum += storeMonthlySum;
      }

      // 브랜드/채널 조합
      if (brand === '시티브리즈' && channel === '오프라인') {
        viewsData.cb_off.s1.curCum += storeMonthlySum;
      } else if (brand === '아티드' && channel === '오프라인') {
        viewsData.at_off.s1.curCum += storeMonthlySum;
      } else if (brand === '시티브리즈' && channel === '온라인') {
        viewsData.cb_on.s1.curCum += storeMonthlySum;
      } else if (brand === '아티드' && channel === '온라인') {
        viewsData.at_on.s1.curCum += storeMonthlySum;
      }
    }

    // 매출액 계산 및 목표 대비율 계산
    var targets = MARCH_TARGETS;
    var rates = REVENUE_RATES;

    // total
    viewsData.total.s1.target = targets.total;
    viewsData.total.s1.curRev = Math.round(viewsData.total.s1.curCum);
    viewsData.total.s1.rate = Math.round(
      (viewsData.total.s1.curRev / viewsData.total.s1.target) * 100
    );

    // offline
    viewsData.offline.s1.target = targets.offline;
    viewsData.offline.s1.curRev = Math.round(
      viewsData.offline.s1.curCum * rates.offline
    );
    viewsData.offline.s1.rate = Math.round(
      (viewsData.offline.s1.curRev / viewsData.offline.s1.target) * 100
    );

    // online
    viewsData.online.s1.target = targets.online;
    viewsData.online.s1.curRev = Math.round(
      viewsData.online.s1.curCum * rates.online
    );
    viewsData.online.s1.rate = Math.round(
      (viewsData.online.s1.curRev / viewsData.online.s1.target) * 100
    );

    // cb_off
    viewsData.cb_off.s1.target = targets.cb_off;
    viewsData.cb_off.s1.curRev = Math.round(
      viewsData.cb_off.s1.curCum * rates.offline
    );
    viewsData.cb_off.s1.rate = Math.round(
      (viewsData.cb_off.s1.curRev / viewsData.cb_off.s1.target) * 100
    );

    // at_off
    viewsData.at_off.s1.target = targets.at_off;
    viewsData.at_off.s1.curRev = Math.round(
      viewsData.at_off.s1.curCum * rates.offline
    );
    viewsData.at_off.s1.rate = Math.round(
      (viewsData.at_off.s1.curRev / viewsData.at_off.s1.target) * 100
    );

    // cb_on
    viewsData.cb_on.s1.target = targets.cb_on;
    viewsData.cb_on.s1.curRev = Math.round(
      viewsData.cb_on.s1.curCum * rates.online
    );
    viewsData.cb_on.s1.rate = Math.round(
      (viewsData.cb_on.s1.curRev / viewsData.cb_on.s1.target) * 100
    );

    // at_on
    viewsData.at_on.s1.target = targets.at_on;
    viewsData.at_on.s1.curRev = Math.round(
      viewsData.at_on.s1.curCum * rates.online
    );
    viewsData.at_on.s1.rate = Math.round(
      (viewsData.at_on.s1.curRev / viewsData.at_on.s1.target) * 100
    );

    Logger.log('  - S1 데이터 계산 완료');

  } catch (error) {
    throw new Error('computeS1Data 실패: ' + error.toString());
  }
}

/**
 * S2 데이터 계산 (주간 일일 데이터)
 */
function computeS2Data(viewsData, sheetData, currentWeekData, previousWeekData) {
  try {
    // 현재 주 데이터 집계
    var curWeekAgg = aggregateDailyData(sheetData, currentWeekData.dates);
    for (var storeIdx = 0; storeIdx < sheetData.rows.length; storeIdx++) {
      var row = sheetData.rows[storeIdx];

      for (var dateIdx = 0; dateIdx < currentWeekData.dates.length; dateIdx++) {
        var dateStr = currentWeekData.dates[dateIdx].dateStr;
        var value = row.dailyValues[dateStr] || 0;

        // 각 뷰에 추가
        addToS2View(viewsData, row, dateStr, value, true);
      }
    }

    // 이전 주 데이터 집계
    for (var storeIdx = 0; storeIdx < sheetData.rows.length; storeIdx++) {
      var row = sheetData.rows[storeIdx];

      for (var dateIdx = 0; dateIdx < previousWeekData.dates.length; dateIdx++) {
        var dateStr = previousWeekData.dates[dateIdx].dateStr;
        var value = row.dailyValues[dateStr] || 0;

        // 각 뷰에 추가
        addToS2View(viewsData, row, dateStr, value, false);
      }
    }

    Logger.log('  - S2 데이터 계산 완료');

  } catch (error) {
    throw new Error('computeS2Data 실패: ' + error.toString());
  }
}

/**
 * S3 데이터 설정 (WEEKLY_BY_VIEW 사용)
 */
function computeS3Data(viewsData) {
  try {
    viewsData.total.s3 = WEEKLY_BY_VIEW.total;
    viewsData.offline.s3 = WEEKLY_BY_VIEW.offline;
    viewsData.online.s3 = WEEKLY_BY_VIEW.online;
    viewsData.cb_off.s3 = WEEKLY_BY_VIEW.cb_off;
    viewsData.at_off.s3 = WEEKLY_BY_VIEW.at_off;
    viewsData.cb_on.s3 = WEEKLY_BY_VIEW.cb_on;
    viewsData.at_on.s3 = WEEKLY_BY_VIEW.at_on;

    Logger.log('  - S3 데이터 설정 완료');

  } catch (error) {
    throw new Error('computeS3Data 실패: ' + error.toString());
  }
}

/**
 * S4 데이터 계산 (매장 계층 구조)
 */
function computeS4Data(viewsData, sheetData, currentWeekData, previousWeekData) {
  try {
    // 매장별 데이터 구조
    var storeHierarchy = buildStoreHierarchy(sheetData);

    // 현재 주 S4 계산
    viewsData.total.s4.current = buildS4StoreData(sheetData, currentWeekData, true);
    viewsData.total.s4.previous = buildS4StoreData(sheetData, previousWeekData, false);

    // 각 뷰별 S4도 동일하게 구축 (필요시 필터링)
    for (var viewKey in viewsData) {
      if (viewKey !== 'total') {
        viewsData[viewKey].s4.current = buildS4StoreData(sheetData, currentWeekData, true, viewKey);
        viewsData[viewKey].s4.previous = buildS4StoreData(sheetData, previousWeekData, false, viewKey);
      }
    }

    Logger.log('  - S4 데이터 계산 완료');

  } catch (error) {
    throw new Error('computeS4Data 실패: ' + error.toString());
  }
}

/**
 * 현재 주 데이터 가져오기 (최근 일요일 기준)
 */
function getCurrentWeekData(sheetData, today) {
  var dayOfWeek = today.getDay(); // 0=일, 1=월, ..., 6=토
  var daysFromSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
  var sundayDate = new Date(today);
  sundayDate.setDate(today.getDate() - daysFromSunday);

  var dates = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(sundayDate);
    d.setDate(sundayDate.getDate() + i);
    dates.push({
      date: d,
      dateStr: formatDateForDisplay(d),
      dayName: getDayName(d.getDay())
    });
  }

  return { dates: dates, startDate: sundayDate };
}

/**
 * 이전 주 데이터 가져오기
 */
function getPreviousWeekData(sheetData, today) {
  var dayOfWeek = today.getDay();
  var daysFromSunday = dayOfWeek === 0 ? 0 : dayOfWeek;
  var thisWeekSunday = new Date(today);
  thisWeekSunday.setDate(today.getDate() - daysFromSunday);

  var prevWeekSunday = new Date(thisWeekSunday);
  prevWeekSunday.setDate(thisWeekSunday.getDate() - 7);

  var dates = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(prevWeekSunday);
    d.setDate(prevWeekSunday.getDate() + i);
    dates.push({
      date: d,
      dateStr: formatDateForDisplay(d),
      dayName: getDayName(d.getDay())
    });
  }

  return { dates: dates, startDate: prevWeekSunday };
}

/**
 * S2 뷰에 데이터 추가
 */
function addToS2View(viewsData, row, dateStr, value, isCurrent) {
  var brand = row.brand;
  var channel = row.channel;
  var target = isCurrent ? 'current' : 'previous';

  // total
  addToS2Array(viewsData.total.s2[target], dateStr, value);

  // channel별
  if (channel === '오프라인') {
    addToS2Array(viewsData.offline.s2[target], dateStr, value);
  } else if (channel === '온라인') {
    addToS2Array(viewsData.online.s2[target], dateStr, value);
  }

  // 브랜드/채널 조합
  if (brand === '시티브리즈' && channel === '오프라인') {
    addToS2Array(viewsData.cb_off.s2[target], dateStr, value);
  } else if (brand === '아티드' && channel === '오프라인') {
    addToS2Array(viewsData.at_off.s2[target], dateStr, value);
  } else if (brand === '시티브리즈' && channel === '온라인') {
    addToS2Array(viewsData.cb_on.s2[target], dateStr, value);
  } else if (brand === '아티드' && channel === '온라인') {
    addToS2Array(viewsData.at_on.s2[target], dateStr, value);
  }
}

/**
 * S2 배열에 일일 데이터 추가
 */
function addToS2Array(arr, dateStr, value) {
  var existing = arr.find(function(item) { return item.date === dateStr; });
  if (existing) {
    existing.value += value;
  } else {
    arr.push({ date: dateStr, value: value });
  }
}

/**
 * S4 매장 데이터 구축
 */
function buildS4StoreData(sheetData, weekData, isCurrent, viewFilter) {
  var stores = [];

  for (var storeIdx = 0; storeIdx < sheetData.rows.length; storeIdx++) {
    var row = sheetData.rows[storeIdx];

    // viewFilter가 있으면 필터링
    if (viewFilter) {
      if (!matchesViewFilter(row, viewFilter)) {
        continue;
      }
    }

    var storeEntry = {
      code: row.storeCode,
      store: row.store,
      brand: row.brand,
      distribution: row.distribution,
      daily: []
    };

    // 각 날짜별 데이터
    for (var dateIdx = 0; dateIdx < weekData.dates.length; dateIdx++) {
      var dateStr = weekData.dates[dateIdx].dateStr;
      var value = row.dailyValues[dateStr] || 0;

      storeEntry.daily.push({
        date: dateStr,
        value: value
      });
    }

    stores.push(storeEntry);
  }

  return stores;
}

/**
 * 행이 뷰 필터와 일치하는지 확인
 */
function matchesViewFilter(row, viewKey) {
  switch(viewKey) {
    case 'offline': return row.channel === '오프라인';
    case 'online': return row.channel === '온라인';
    case 'cb_off': return row.brand === '시티브리즈' && row.channel === '오프라인';
    case 'at_off': return row.brand === '아티드' && row.channel === '오프라인';
    case 'cb_on': return row.brand === '시티브리즈' && row.channel === '온라인';
    case 'at_on': return row.brand === '아티드' && row.channel === '온라인';
    default: return true;
  }
}

/**
 * 일일 데이터 집계
 */
function aggregateDailyData(sheetData, dates) {
  var agg = {};
  for (var i = 0; i < dates.length; i++) {
    agg[dates[i].dateStr] = 0;
  }

  for (var storeIdx = 0; storeIdx < sheetData.rows.length; storeIdx++) {
    var row = sheetData.rows[storeIdx];
    for (var dateIdx = 0; dateIdx < dates.length; dateIdx++) {
      var dateStr = dates[dateIdx].dateStr;
      agg[dateStr] += row.dailyValues[dateStr] || 0;
    }
  }

  return agg;
}

/**
 * 매장 계층 구조 구축
 */
function buildStoreHierarchy(sheetData) {
  var hierarchy = {};

  for (var i = 0; i < sheetData.rows.length; i++) {
    var row = sheetData.rows[i];
    var brand = row.brand;
    var channel = row.channel;

    if (!hierarchy[brand]) {
      hierarchy[brand] = {};
    }
    if (!hierarchy[brand][channel]) {
      hierarchy[brand][channel] = [];
    }

    hierarchy[brand][channel].push({
      code: row.storeCode,
      store: row.store,
      distribution: row.distribution
    });
  }

  return hierarchy;
}

// ==================== 템플릿 처리 ====================

/**
 * Google Drive에서 HTML 템플릿 읽기
 */
function readHtmlTemplate() {
  try {
    var url = CONFIG.TEMPLATE_GITHUB_URL;
    Logger.log('  - 템플릿 GitHub에서 가져오는 중: ' + url.substring(0, 60) + '...');
    var response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
    if (response.getResponseCode() !== 200) {
      throw new Error('GitHub 템플릿 fetch 실패: HTTP ' + response.getResponseCode());
    }
    var html = response.getContentText();
    Logger.log('  - 템플릿 읽음: ' + html.length + ' bytes');
    return html;
  } catch (error) {
    throw new Error('readHtmlTemplate 실패: ' + error.toString());
  }
}

function readViewsDataFromGitHub() {
  try {
    var url = CONFIG.VIEWS_DATA_GITHUB_URL;
    Logger.log('  - views_data.json GitHub에서 가져오는 중...');
    var response = UrlFetchApp.fetch(url, {muteHttpExceptions: true});
    if (response.getResponseCode() !== 200) {
      throw new Error('GitHub views_data fetch 실패: HTTP ' + response.getResponseCode());
    }
    return JSON.parse(response.getContentText());
  } catch (error) {
    throw new Error('readViewsDataFromGitHub 실패: ' + error.toString());
  }
}

/**
 * 데이터를 HTML 템플릿에 주입
 */
function injectDataToTemplate(htmlTemplate, viewsData) {
  try {
    var today = new Date();
    var month = today.getMonth() + 1;
    var day = today.getDate();
    var dateStr = month + '/' + day;

    // 데이터 JSON 생성
    var dataJson = JSON.stringify(viewsData, null, 2);
    var weeklyJson = JSON.stringify(WEEKLY_BY_VIEW, null, 2);

    // 템플릿 주입
    var html = htmlTemplate;

    // 1. %%INJECT_DATA%% 치환
    html = html.replace(
      /%%INJECT_DATA%%/g,
      'const DATA = ' + dataJson + ';'
    );

    // 2. %%INJECT_WEEKLY%% 치환
    html = html.replace(
      /%%INJECT_WEEKLY%%/g,
      'const WEEKLY = ' + weeklyJson + ';'
    );

    // 3. %%INJECT_DATE%% 치환
    html = html.replace(
      /%%INJECT_DATE%%/g,
      "const FIXED_DATE_STR = '" + dateStr + "';"
    );

    // 4. %%INJECT_MONTH%% 치환
    html = html.replace(
      /%%INJECT_MONTH%%/g,
      'const TARGET_MONTH = ' + month + ';'
    );

    Logger.log('  - 데이터 주입 완료 (' + dateStr + ')');
    return html;

  } catch (error) {
    throw new Error('injectDataToTemplate 실패: ' + error.toString());
  }
}

// ==================== GitHub 푸시 ====================

/**
 * HTML을 GitHub Pages로 푸시
 */
function pushToGitHub(htmlContent) {
  try {
    var url = 'https://api.github.com/repos/' + CONFIG.GITHUB_REPO + '/contents/' + CONFIG.GITHUB_FILE;
    var options = {
      method: 'put',
      headers: {
        'Authorization': 'token ' + CONFIG.GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        message: 'Daily dashboard update - ' + new Date().toISOString(),
        content: Utilities.base64Encode(htmlContent),
        branch: CONFIG.GITHUB_BRANCH
      }),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseCode = response.getResponseCode();

    if (responseCode >= 200 && responseCode < 300) {
      Logger.log('  - GitHub 푸시 성공 (HTTP ' + responseCode + ')');
    } else {
      var errorMsg = 'GitHub API 오류: HTTP ' + responseCode + '\n' + response.getContentText();
      throw new Error(errorMsg);
    }

  } catch (error) {
    throw new Error('pushToGitHub 실패: ' + error.toString());
  }
}

// ==================== 백업 저장 ====================

/**
 * HTML을 Google Drive에 백업 저장
 */
function saveBackupToDrive(htmlContent) {
  try {
    var folder = DriveApp.getFolderById(CONFIG.BACKUP_FOLDER_ID);
    var timestamp = new Date();
    var filename = 'dashboard_backup_' + formatDateForFilename(timestamp) + '.html';

    // 기존 파일이 있으면 삭제 (선택사항)
    // deleteOldBackups(folder);

    var file = folder.createFile(filename, htmlContent, MimeType.HTML);
    Logger.log('  - 백업 저장됨: ' + filename);

  } catch (error) {
    throw new Error('saveBackupToDrive 실패: ' + error.toString());
  }
}

/**
 * 오래된 백업 파일 삭제 (30일 이상 된 파일)
 */
function deleteOldBackups(folder, daysOld) {
  try {
    daysOld = daysOld || 30;
    var cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    var files = folder.getFilesByName(/^dashboard_backup_/);
    var deletedCount = 0;

    while (files.hasNext()) {
      var file = files.next();
      if (file.getLastUpdated() < cutoffDate) {
        folder.removeFile(file);
        deletedCount++;
      }
    }

    Logger.log('  - ' + deletedCount + '개의 오래된 백업 파일 삭제됨');

  } catch (error) {
    Logger.log('  - 백업 삭제 중 오류: ' + error.toString());
  }
}

// ==================== 트리거 설정 ====================

/**
 * 일일 자동 실행 트리거 설정 (매일 10:30 AM KST)
 * setupTrigger()를 실행하여 트리거를 생성
 */
function setupTrigger() {
  try {
    // 기존 트리거 제거
    removeTriggers();

    // 새 트리거 생성 (매일 10:30 AM KST)
    ScriptApp.newTrigger('dailyPipeline')
      .timeBased()
      .atHour(10)
      .nearMinute(30)
      .everyDays(1)
      .inTimezone('Asia/Seoul')
      .create();

    Logger.log('트리거 생성됨: 매일 10:30 AM KST에 dailyPipeline() 실행');

  } catch (error) {
    Logger.log('ERROR setupTrigger: ' + error.toString());
  }
}

/**
 * 기존 트리거 제거
 */
function removeTriggers() {
  try {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'dailyPipeline') {
        ScriptApp.deleteTrigger(triggers[i]);
        Logger.log('기존 트리거 삭제됨');
      }
    }
  } catch (error) {
    Logger.log('ERROR removeTriggers: ' + error.toString());
  }
}

// ==================== 유틸리티 함수 ====================

/**
 * 날짜를 'M/D' 형식으로 포맷
 */
function formatDateForDisplay(date) {
  var month = date.getMonth() + 1;
  var day = date.getDate();
  return month + '/' + day;
}

/**
 * 날짜를 파일명용으로 포맷
 */
function formatDateForFilename(date) {
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, '0');
  var day = String(date.getDate()).padStart(2, '0');
  var hours = String(date.getHours()).padStart(2, '0');
  var minutes = String(date.getMinutes()).padStart(2, '0');

  return year + month + day + '_' + hours + minutes;
}

/**
 * 요일명 가져오기
 */
function getDayName(dayOfWeek) {
  var names = ['일', '월', '화', '수', '목', '금', '토'];
  return names[dayOfWeek];
}

/**
 * 에러 알림 (선택사항 - 슬랙, 이메일 등으로 알림)
 */
function sendErrorNotification(error) {
  try {
    // 예시: 이메일로 알림
    // GmailApp.sendEmail(
    //   'admin@example.com',
    //   'EASTEND Dashboard 파이프라인 오류',
    //   'Error: ' + error.toString() + '\n\nStack: ' + error.stack
    // );

    // 또는 슬랙 웹훅 사용
    // var slackWebhookUrl = 'YOUR_SLACK_WEBHOOK_URL';
    // UrlFetchApp.fetch(slackWebhookUrl, {
    //   method: 'post',
    //   payload: JSON.stringify({text: 'Dashboard error: ' + error.toString()})
    // });

  } catch (e) {
    Logger.log('알림 전송 실패: ' + e.toString());
  }
}

/**
 * String.padStart polyfill (ES2017이 없을 경우)
 */
if (!String.prototype.padStart) {
  String.prototype.padStart = function padStart(targetLength, padString) {
    targetLength = targetLength >> 0;
    padString = String(typeof padString !== 'undefined' ? padString : ' ');
    if (this.length >= targetLength) {
      return String(this);
    } else {
      targetLength = targetLength - this.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length);
      }
      return padString.slice(0, targetLength) + String(this);
    }
  };
}

// ==================== 테스트 함수 ====================

/**
 * 파이프라인 테스트 실행 (수동)
 */
function testPipeline() {
  Logger.log('=== 파이프라인 테스트 시작 ===');
  dailyPipeline();
  Logger.log('=== 테스트 완료 ===\n');
}

/**
 * 트리거 확인
 */
function checkTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log('활성 트리거: ' + triggers.length + '개');

  for (var i = 0; i < triggers.length; i++) {
    var trigger = triggers[i];
    Logger.log((i + 1) + '. ' + trigger.getHandlerFunction() +
               ' (' + trigger.getTriggerSource() + ')');
  }
}
