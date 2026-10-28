/*
 * 설정 파일 — 배포 전에 이 파일만 고치면 됩니다.
 * 자세한 설명은 README.md의 "설정" 항목을 보세요.
 */
window.SURVEY_CONFIG = {
  STUDY_NAME: '성장·사춘기 코호트',
  FORM_VERSION: '0.2',            // 자료사전 버전과 맞춤 (CRF 자료사전 v0.2). 바꾸면 시트에 새 탭이 생깁니다.

  // 'demo' : "시제품" 표시와 "연구진 보기" 스위치를 보여 줌
  // 'live' : 보호자용 실제 운영 모드
  MODE: 'live',

  // Google Apps Script 웹 앱 주소(https://script.google.com/macros/s/…/exec).
  // 비워 두면 데모 모드: 서버로 보내지 않고, 제출 화면에서 저장될 내용만 보여 줍니다.
  SUBMIT_URL: 'https://script.google.com/macros/s/AKfycbzjzS7bsaL0Y52zZt-vbxU_yH3TI4GPnsoR8qRHlsrXYmhjLWhLzXwGu11bC9eI88Bb/exec',

  // Code.gs의 STUDY_KEY와 같은 값. 페이지 소스에 보이므로 보안 장치가 아니라 무작위 스팸을 거르는 용도입니다.
  STUDY_KEY: 'growth cohort 2026-01',

  // 연구 번호 형식 (Code.gs의 PID_RE와 같게)
  PID_PATTERN: '^GP-\\d{3}$',
  PID_EXAMPLE: 'GP-001',

  // 대상자별 참여 코드를 요구할지 (Code.gs의 REQUIRE_CODE와 같게). 코드는 시트의 'participants' 탭에서 관리.
  // SUBMIT_URL이 비어 있는 데모 모드에서는 묻지 않습니다.
  REQUIRE_CODE: true,

  // 잠든 시각·일어난 시각 선택 간격(분). 10 → 21:00, 21:10, 21:20 …
  TIME_STEP_MIN: 10,

  // 작성 중인 응답을 이 기기 브라우저에 임시 저장(제출하면 삭제). 공용 태블릿이면 false 권장.
  SAVE_DRAFT: true,

  // 12·24·36개월 정기 설문에는 연 1회 척도를 붙입니다.
  ANNUAL_VISITS: ['12', '24', '36'],

  CONTACT: '건양대학교병원 소아청소년과 연구팀 042-612-2130',
};
