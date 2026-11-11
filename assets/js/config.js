/*
 * 설정 파일 — 배포 전에 이 파일만 고치면 됩니다.
 * 자세한 설명은 README.md의 "설정" 항목을 보세요.
 */
window.SURVEY_CONFIG = {
  STUDY_NAME: '성장·사춘기 코호트',
  FORM_VERSION: '0.5',            // 자료사전 버전과 맞춤 (CRF 자료사전 v0.5). 내보낸 파일 이름과 각 응답에 함께 기록됩니다.

  // 'demo' : "시제품" 표시와 "연구진 보기" 스위치를 보여 줌
  // 'live' : 보호자용 실제 운영 모드
  MODE: 'live',

  // 응답 저장 방식 (v0.5, 2026-11-11 결정 대기 중 권장안)
  // 'device' : 이 기기(외래 iPad)에만 저장. 인터넷으로 보내지 않음. 연구진이 data.html에서 CSV로 내보냄
  // 'server' : 아래 SUBMIT_URL(Google Apps Script)로 전송 (v0.4까지의 방식)
  SAVE_MODE: 'device',

  // 자료 관리 화면(data.html)에 들어갈 때 묻는 숫자. 보호자가 실수로 여는 것을 막는 용도이며 보안 장치는 아닙니다
  // (이 파일은 공개되어 있습니다). 실제 보호는 iPad 암호·잠금으로 합니다. 비우면 묻지 않습니다.
  STAFF_PIN: '2130',

  // Google Apps Script 웹 앱 주소(https://script.google.com/macros/s/…/exec).
  // 비워 두면 데모 모드: 서버로 보내지 않고, 제출 화면에서 저장될 내용만 보여 줍니다.
  // SAVE_MODE가 'device'이면 쓰지 않습니다. (v0.4 주소: https://script.google.com/macros/s/AKfycbzjzS7bsaL0Y52zZt-vbxU_yH3TI4GPnsoR8qRHlsrXYmhjLWhLzXwGu11bC9eI88Bb/exec)
  SUBMIT_URL: '',

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
  SAVE_DRAFT: true,               // 공용 iPad: 제출하면 지워지고, 첫 화면의 "처음부터 새로 작성"으로도 지울 수 있음
  DRAFT_MAX_MIN: 120,             // 작성 중 응답을 이 시간(분)이 지나면 버림 → 다음 보호자에게 앞사람 응답이 보이지 않게

  // (v0.3부터 사용 안 함) 척도 3종은 첫 방문 1회 종이 응답 → 연구진이 scales.html로 입력(2026-10-28 결정).
  // 정기 설문에 연 1회 문항을 다시 붙이려면 방문 차수를 넣으세요. 예: ['12', '24', '36']
  ANNUAL_VISITS: [],

  CONTACT: '건양대학교병원 소아청소년과 연구팀 042-612-2130',
};
