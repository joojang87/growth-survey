/*
 * 문항 정의 — CRF 자료사전 v0.2 (2026-10-21)
 * 문항을 고칠 때는 이 파일만 수정하세요. id는 자료사전의 변수명과 같아야 합니다.
 *
 * t(유형): single 하나 고르기 | multi 여러 개 고르기 | number 숫자 | text 글
 *          pairNum 두 칸 숫자 | pairSingle 두 줄 고르기 | pairClock 두 칸 시각 고르기
 *          age 나이(세·개월) | multiDetail 여러 개 + 세부 | sports 운동 목록 | scale 척도 | calc 자동 계산
 * forms : 이 문항을 보여 줄 설문(baseline 첫 방문, followup 정기). 없으면 섹션 설정을 따름
 * show  : 보여 줄 조건 (s = 지금까지의 응답, form = 설문 종류)
 * p     : 우선순위(핵심·권장·선택) — 연구진 보기에서만 보임
 */
(function () {
const WD = ['주중 (월–금)', '주말 (토·일)'];
const D07 = ['0', '1', '2', '3', '4', '5', '6', '7'];
const TIMES = '0회,1–2회,3–4회,5–6회,7회 이상'.split(',');

window.SURVEY = {
WD,
SPORTS: ['태권도', '수영', '줄넘기', '축구', '농구', '발레·무용', '인라인·스케이트', '체조·주짓수', '자전거', '기타'],
INTENSITY: ['가볍게 (숨이 차지 않음)', '보통 (숨이 약간 참)', '힘들게 (말하기 힘들 만큼 숨차고 땀이 남)'],
SECTIONS: [

/* ---------- 시작 ---------- */
{ key: 'intro', forms: ['baseline', 'followup'], title: '시작하기',
  lead: { baseline: '처음 한 번만 답하는 설문입니다. 아이가 태어날 때부터 지금까지의 생활을 여쭙니다. 약 20–25분 걸리고, 중간에 닫아도 이 기기에서 이어서 할 수 있습니다.',
          followup: '3개월마다 방문 1주 전에 받는 설문입니다. 모든 질문은 "지난 7일"을 기준으로 답해 주세요. 약 10분 걸립니다.' },
  qs: [
  { id: 'participant_id', t: 'text', q: '연구 번호', h: '연구진이 알려 드린 번호입니다(예: GP-007). 문자로 받은 링크로 들어오셨다면 이미 채워져 있습니다.', ph: 'GP-000', p: '핵심', fromUrl: 'id', meta: true },
  { id: 'access_code', t: 'text', q: '참여 코드', h: '연구진이 알려 드린 6자리 코드입니다. 링크로 들어오셨다면 이미 채워져 있습니다.', ph: '예: K7Q2MX', p: '핵심', fromUrl: 'c', secret: true, show: () => !!(window.SURVEY_CONFIG.REQUIRE_CODE && window.SURVEY_CONFIG.SUBMIT_URL) },
  { id: 'visit_month', t: 'single', q: '이번 방문은 등록 후 몇 개월째인가요?', o: ['3','6','9','12','15','18','21','24','27','30','33','36'], suffix: '개월', p: '핵심', forms: ['followup'], fromUrl: 'v', meta: true, h: '12·24·36개월에는 1년에 한 번 하는 질문이 추가됩니다.' },
  { id: 'respondent', t: 'single', q: '응답하시는 분은 아이와 어떤 관계인가요?', o: ['어머니', '아버지', '조부모', '기타'], p: '핵심' },
  { id: 'child_sex', t: 'single', q: '아이의 성별', o: ['남아', '여아'], p: '핵심', fromUrl: 'sex' },
]},

/* ---------- 몸의 변화 (맨 앞) ---------- */
{ key: 'signs', forms: ['baseline', 'followup'], title: '아이 몸의 변화',
  lead: { baseline: '지금 아이 몸에서 보이는 변화를 먼저 여쭙니다.', followup: '지난 방문 이후 새로 보인 변화를 먼저 여쭙니다.' },
  qs: [
  { id: 'signs', t: 'multi', q: { baseline: '지금 아이 몸에서 보이는 변화가 있나요?', followup: '지난 방문 이후 아이 몸에서 새로 본 변화가 있나요?' },
    oBy: s => s.child_sex === '남아' ? ['고환이 커진 것 같음', '음모', '겨드랑이 털', '어른 같은 땀 냄새', '여드름'] : ['가슴 멍울(몽우리)', '음모', '겨드랑이 털', '어른 같은 땀 냄새', '여드름'],
    none: '없음', p: '핵심', h: '하나라도 보이면 연구진이 연락드려 진찰 일정을 앞당길 수 있습니다.' },
  { id: 'signs_when', t: 'text', q: '언제쯤부터 보였나요?', ph: '예: 2주 전부터', p: '권장', show: s => Array.isArray(s.signs) && s.signs.length && !s.signs.includes('없음') },
]},

/* ---------- B1 출생 ---------- */
{ key: 'birth', forms: ['baseline'], title: '태어날 때와 아기 때', lead: '모자수첩을 옆에 두시면 편합니다.', qs: [
  { id: 'gest_weeks', t: 'number', q: '임신 몇 주에 태어났나요?', u: '주', min: 22, max: 44, unknown: true, p: '핵심' },
  { id: 'birth_weight', t: 'number', q: '태어날 때 몸무게', u: 'g', min: 400, max: 6000, unknown: true, p: '핵심', h: '예: 3.2 kg이면 3200' },
  { id: 'birth_length', t: 'number', q: '태어날 때 키', u: 'cm', min: 30, max: 65, step: 0.1, unknown: true, p: '선택' },
  { id: 'multiple_birth', t: 'single', q: '쌍둥이 이상으로 태어났나요?', o: ['아니요', '예'], p: '권장' },
  { id: 'feeding_6mo', t: 'single', q: '생후 6개월까지 주로 어떻게 먹였나요?', o: ['모유만', '모유와 분유를 함께', '분유만', '기억나지 않음'], p: '핵심' },
]},

/* ---------- B2 가족 ---------- */
{ key: 'family', forms: ['baseline'], title: '가족', lead: '부모님 정보는 아이의 예상 키와 사춘기 시기를 함께 보기 위해 여쭙니다.', qs: [
  { id: 'parent_height', t: 'pairNum', q: '부모님의 키', labels: ['아버지', '어머니'], u: 'cm', step: 0.1, p: '핵심' },
  { id: 'parent_height_src', t: 'single', q: '위의 키는', o: ['최근에 잰 값', '대략 알고 있는 값'], p: '핵심' },
  { id: 'parent_weight', t: 'pairNum', q: '부모님의 현재 몸무게', labels: ['아버지', '어머니'], u: 'kg', step: 0.1, p: '권장' },
  { id: 'mother_menarche', t: 'number', q: '어머니의 첫 생리(초경) 나이', u: '세', min: 8, max: 18, unknown: true, p: '핵심' },
  { id: 'mother_menarche_grade', t: 'single', q: '나이가 기억나지 않으면, 몇 학년 때였나요?', o: ['초4 이전', '초5', '초6', '중1', '중2', '중3 이후', '모름'], p: '핵심', show: s => s.mother_menarche === '모름' },
  { id: 'parent_timing', t: 'pairSingle', q: '부모님의 사춘기는 또래에 비해 어땠나요?', labels: ['아버지', '어머니'], o: ['빨랐음', '비슷함', '늦었음', '모름'], p: '핵심', h: '아버지는 키가 갑자기 크거나 변성기가 온 시기를 떠올려 주세요.' },
  { id: 'sibling_cpp', t: 'single', q: '형제자매 중 성조숙증 진단이나 치료를 받은 아이가 있나요?', o: ['없음', '있음', '형제자매 없음'], p: '핵심' },
  { id: 'sibling_cpp_who', t: 'text', q: '누가, 몇 살 때인가요?', ph: '예: 누나, 8세에 치료 시작', p: '핵심', show: s => s.sibling_cpp === '있음' },
]},

/* ---------- B3 가정 ---------- */
{ key: 'home', forms: ['baseline'], title: '가정 환경', lead: '"응답하지 않음"을 고르셔도 연구 참여에는 영향이 없습니다.', qs: [
  { id: 'parent_edu', t: 'pairSingle', q: '부모님의 최종 학력', labels: ['아버지', '어머니'], o: ['고졸 이하', '전문대졸', '대졸', '대학원졸', '응답하지 않음'], p: '핵심' },
  { id: 'caregiver', t: 'single', q: '평일 낮에 아이를 주로 돌보는 분', o: ['어머니', '아버지', '조부모', '돌봄 선생님', '기관(유치원·돌봄교실)', '기타'], p: '권장' },
  { id: 'dual_income', t: 'single', q: '부모님이 모두 일을 하시나요?', o: ['예', '아니요', '응답하지 않음'], p: '권장' },
  { id: 'income', t: 'single', q: '한 달 가구 소득', o: ['300만 원 미만', '300–500만 원', '500–700만 원', '700–1,000만 원', '1,000만 원 이상', '응답하지 않음'], p: '선택' },
  { id: 'family_structure', t: 'single', q: '아이와 함께 사는 가족', o: ['부모 모두', '어머니만', '아버지만', '조부모와 함께', '기타', '응답하지 않음'], p: '선택' },
]},

/* ---------- B4 환경 ---------- */
{ key: 'env', forms: ['baseline'], title: '생활 환경', qs: [
  { id: 'prenatal_smoke', t: 'single', q: '임신 중 담배 연기에 노출된 적이 있나요?', o: ['없음', '간접흡연(주변 사람)', '어머니가 직접 흡연', '모름'], p: '권장' },
  { id: 'home_smoke', t: 'single', q: '집 안이나 차 안에서 아이 가까이 담배를 피우는 사람이 있나요?', o: ['없음', '주 1–2회', '주 3회 이상', '거의 매일'], p: '핵심', h: '전자담배도 포함합니다.' },
  { id: 'plastic_micro', t: 'single', q: '아이 음식을 플라스틱 용기째 전자레인지에 데우는 일', o: ['거의 없음', '주 1–2회', '주 3회 이상'], p: '선택' },
  { id: 'essential_oil', t: 'single', q: '라벤더·티트리 오일이 들어간 로션, 샴푸, 디퓨저를 아이에게 쓰나요?', o: ['아니요', '예', '모름'], p: '선택' },
  { id: 'essential_oil_what', t: 'text', q: '어떤 제품인가요?', ph: '제품 이름', p: '선택', show: s => s.essential_oil === '예' },
  { id: 'child_cosmetics', t: 'single', q: '어린이 화장품·매니큐어·향수를 쓰나요?', o: ['안 씀', '가끔(월 1–3회)', '자주(주 1회 이상)'], p: '선택' },
]},

/* ---------- B5 보조제 ---------- */
{ key: 'supp', forms: ['baseline'], title: '건강기능식품·한약', lead: '먹인 적이 있는 것을 모두 골라 주세요.', qs: [
  { id: 'supplements', t: 'multiDetail', q: '지금 먹거나 먹은 적이 있는 것', o: ['홍삼', '한약', '키 성장 영양제', '칼슘·비타민D', '종합비타민', '유산균', '기타'], none: '먹인 적 없음', p: '핵심' },
]},

/* ---------- C1 수면 ---------- */
{ key: 'sleep', forms: ['baseline', 'followup'], title: '잠', lead: '지난 7일을 떠올려 주세요. 평일과 주말이 다르면 따로 골라 주세요.', week: true, qs: [
  { id: 'sleep_onset', t: 'pairClock', q: '실제로 잠드는 시각', from: '19:00', to: '02:00', p: '핵심', h: '잠자리에 누운 시각이 아니라 실제로 잠든 시각입니다.' },
  { id: 'wake_time', t: 'pairClock', q: '아침에 일어나는 시각', from: '05:00', to: '11:00', p: '핵심' },
  { id: '_sleep_calc', t: 'calc' },
  { id: 'nap_days', t: 'single', q: '낮잠을 잔 날', o: D07, suffix: '일', p: '권장' },
  { id: 'nap_min', t: 'number', q: '낮잠은 한 번에 보통 몇 분 잤나요?', u: '분', min: 5, max: 240, p: '권장', show: s => s.nap_days && s.nap_days !== '0' },
  { id: 'waking_nights', t: 'single', q: '자다가 깬 밤은 며칠이었나요?', o: D07, suffix: '일', p: '핵심', h: '화장실, 악몽 등 이유는 상관없습니다.' },
  { id: 'waking_count', t: 'single', q: '깬 밤에는 보통 몇 번 깼나요?', o: ['1번', '2번', '3번 이상'], p: '권장', show: s => s.waking_nights && s.waking_nights !== '0' },
  { id: 'snore_freq', t: 'single', q: '코를 고는 밤', o: ['안 골았음', '주 1–2밤', '주 3–4밤', '주 5밤 이상', '모름'], p: '핵심' },
  { id: 'apnea_seen', t: 'single', q: '자다가 숨을 멈추거나 헐떡이는 것을 본 적이 있나요?', o: ['아니요', '예', '모름'], p: '핵심' },
  { id: 'mouth_breath', t: 'single', q: '입을 벌리고 자거나 입으로 숨을 쉬나요?', o: ['아니요', '예', '모름'], p: '권장' },
  { id: 'room_light', t: 'single', q: '잘 때 방의 불빛', o: ['완전히 깜깜함', '작은 수면등·무드등', '다른 방 불빛이 들어옴', '불을 켜고 잠', 'TV나 기기 화면이 켜진 채'], p: '핵심' },
  { id: 'device_bedroom', t: 'multi', q: '아이가 자는 방에 있는 것', o: ['스마트폰', '태블릿', 'TV', '게임기·컴퓨터'], none: '없음', p: '핵심' },
  { id: 'cosleep', t: 'single', q: '아이는 보통 어디서 자나요?', o: ['혼자 방에서', '부모와 같은 방, 다른 침대', '부모와 같은 침대', '형제와 같은 방'], p: '권장' },
]},

/* ---------- C2 화면 ---------- */
{ key: 'digital', forms: ['baseline', 'followup'], title: '휴대폰과 화면', lead: '지난 7일 기준입니다. 공부용과 놀이용을 모두 포함해 주세요.', week: true, qs: [
  { id: 'own_phone', t: 'single', q: '아이 전용 휴대폰이 있나요?', o: ['없음', '키즈폰(기능 제한)', '스마트폰'], p: '핵심' },
  { id: 'own_phone_new', t: 'single', q: '지난 설문 이후 새로 생긴 휴대폰인가요?', o: ['아니요', '예'], p: '핵심', forms: ['followup'], show: s => s.own_phone && s.own_phone !== '없음' },
  { id: 'own_phone_age', t: 'age', q: '처음 갖게 된 나이', p: '핵심', show: (s, form) => s.own_phone && s.own_phone !== '없음' && (form === 'baseline' || s.own_phone_new === '예') },
  { id: 'own_phone_st', t: 'number', q: '아이 휴대폰의 지난 7일 하루 평균 사용시간', u: '분', min: 0, max: 1440, p: '핵심', guide: true,
    h: '휴대폰의 스크린타임(아이폰) 또는 디지털 웰빙(안드로이드)에서 확인한 값을 적어 주세요. 예: 1시간 25분 → 85', show: s => s.own_phone && s.own_phone !== '없음' },
  { id: 'own_phone_st_src', t: 'single', q: '위 시간은', o: ['앱에서 확인한 값', '대략 추정한 값'], p: '핵심', show: s => s.own_phone && s.own_phone !== '없음' },
  { id: 'tablet', t: 'single', q: '아이가 쓰는 태블릿(아이패드 등)', o: ['안 씀', '아이 전용 태블릿', '가족 공용 태블릿'], p: '핵심' },
  { id: 'tablet_min', t: 'pairNum', q: '태블릿 하루 평균 사용시간', labels: WD, u: '분', p: '핵심', guide: true, show: s => s.tablet && s.tablet !== '안 씀',
    h: '아이 전용 태블릿이면 스크린타임·디지털 웰빙에서 확인해 주세요.' },
  { id: 'tablet_src', t: 'single', q: '위 시간은', o: ['앱에서 확인한 값', '대략 추정한 값'], p: '권장', show: s => s.tablet === '아이 전용 태블릿' },
  { id: 'parent_phone', t: 'pairNum', q: '아이가 부모님 휴대폰을 빌려 쓴 시간 (하루 평균)', labels: WD, u: '분', p: '핵심', h: '대략 적어 주세요. 안 썼으면 0' },
  { id: 'tv', t: 'pairNum', q: 'TV 시청 (하루 평균)', labels: WD, u: '분', p: '핵심', h: 'TV로 보는 유튜브·넷플릭스도 포함합니다.' },
  { id: 'game_pc', t: 'pairNum', q: '게임기·컴퓨터 (하루 평균)', labels: WD, u: '분', p: '권장' },
  { id: 'prebed_1h', t: 'pairSingle', q: '잠들기 전 1시간 동안 화면을 본 시간', labels: WD, o: ['안 봄', '15분 이하', '16–30분', '31–45분', '46–60분'], p: '핵심', h: '휴대폰, 태블릿, TV를 모두 포함합니다.' },
  { id: 'house_rules', t: 'single', q: '집에서 정한 사용 규칙이 있나요? (시간 제한, 자기 전 금지 등)', o: ['있음', '없음'], p: '선택' },
]},

/* ---------- C3 활동 ---------- */
{ key: 'activity', forms: ['baseline', 'followup'], title: '몸을 움직이는 시간', lead: '지난 7일 기준입니다.', week: true, qs: [
  { id: 'mvpa_days', t: 'single', q: '숨이 차거나 땀이 날 만큼 움직인 시간이 하루 합쳐 60분 이상이었던 날', o: D07, suffix: '일', p: '핵심', h: '뛰어놀기, 운동, 자전거, 빠르게 걷기를 모두 합쳐 주세요.' },
  { id: 'outdoor', t: 'pairNum', q: '바깥(실외)에서 노는 시간 (하루 평균)', labels: WD, u: '분', p: '핵심' },
  { id: 'sport_grid', t: 'sports', q: '정기적으로 하는 운동', h: '학원·방과후 수업을 포함해, 정해진 날 하는 운동을 모두 추가해 주세요.', p: '핵심' },
  { id: 'commute', t: 'single', q: '유치원·학교에 오가는 방법', o: ['주로 걸어서', '자전거·킥보드', '차로', '통학버스'], p: '권장' },
  { id: 'commute_min', t: 'number', q: '걷거나 자전거로 오가는 시간 (하루 합계)', u: '분', min: 0, max: 180, p: '권장', show: s => ['주로 걸어서', '자전거·킥보드'].includes(s.commute) },
  { id: 'study_sitting', t: 'number', q: '학원·학습지·숙제처럼 앉아서 공부하는 시간 (평일 하루 평균)', u: '분', min: 0, max: 720, p: '핵심', h: '화면을 보는 공부도 포함합니다.' },
]},

/* ---------- C4 식습관 ---------- */
{ key: 'diet', forms: ['baseline', 'followup'], title: '먹는 것', lead: '지난 7일 동안 몇 번 먹었는지 여쭙니다. 정확하지 않아도 괜찮습니다.', week: true, qs: [
  { id: 'breakfast_days', t: 'single', q: '아침을 먹은 날', o: D07, suffix: '일', p: '핵심', h: '우유 한 잔만 마신 날은 빼 주세요.' },
  { id: 'ssb', t: 'number', q: '단 음료를 마신 총 잔 수', u: '잔', min: 0, max: 60, p: '핵심', h: '탄산음료, 과일주스, 이온음료, 초코·딸기우유, 요구르트 음료. 1잔 = 종이컵 1컵(약 200 mL)' },
  { id: 'dairy', t: 'single', q: '흰 우유·치즈·요구르트 (하루 평균)', o: ['거의 안 먹음', '1번', '2번', '3번 이상'], p: '권장' },
  { id: 'red_meat', t: 'single', q: '소고기·돼지고기 요리', o: TIMES, p: '핵심' },
  { id: 'processed_meat', t: 'single', q: '햄·소시지·베이컨·너겟', o: TIMES, p: '핵심' },
  { id: 'fried_fast', t: 'single', q: '튀김·패스트푸드·배달음식', o: TIMES, p: '핵심' },
  { id: 'instant', t: 'single', q: '라면 등 인스턴트 식품', o: TIMES, p: '권장' },
  { id: 'soy', t: 'single', q: '두유·두부·콩 음식', o: TIMES, p: '권장' },
  { id: 'fruit', t: 'single', q: '과일 (하루 평균)', o: ['거의 안 먹음', '1번', '2번 이상'], p: '핵심' },
  { id: 'veg', t: 'single', q: '채소 반찬 (끼니 기준, 하루 평균)', o: ['거의 안 먹음', '1끼', '2끼', '3끼'], p: '핵심' },
  { id: 'sweets', t: 'single', q: '과자·사탕·초콜릿·빵', o: TIMES, p: '권장' },
  { id: 'late_snack', t: 'single', q: '저녁 식사 후 야식을 먹은 날', o: D07, suffix: '일', p: '권장' },
]},

/* ---------- C5 변화 ---------- */
{ key: 'change', forms: ['followup'], title: '지난 방문 이후', lead: '지난 방문 이후 3개월 동안의 변화를 여쭙니다.', qs: [
  { id: 'supp_change', t: 'single', q: '건강기능식품이나 한약을 새로 시작하거나 끊었나요?', o: ['변화 없음', '새로 시작', '끊음'], p: '핵심' },
  { id: 'supp_change_what', t: 'text', q: '무엇을, 언제부터(언제까지)?', ph: '예: 키 성장 영양제, 9월부터', p: '핵심', show: s => s.supp_change && s.supp_change !== '변화 없음' },
  { id: 'illness', t: 'single', q: '입원하거나 크게 아팠던 적, 새로 먹기 시작한 약이 있나요?', o: ['없음', '있음'], p: '핵심', h: '바르는 스테로이드 연고나 호르몬이 든 약도 알려 주세요.' },
  { id: 'illness_what', t: 'text', q: '어떤 일이었나요?', ph: '병명, 약 이름, 기간', p: '핵심', show: s => s.illness === '있음' },
  { id: 'life_event', t: 'multi', q: '생활에 큰 변화가 있었나요?', o: ['이사', '입학·전학', '동생 출생', '가족 구성 변화', '기타'], none: '없음', p: '선택' },
]},

/* ---------- 연 1회 척도 ---------- */
{ key: 'scales', forms: ['baseline', 'followup'], annual: true, title: '1년에 한 번 하는 질문', lead: '등록할 때와 매년 한 번만 답합니다.', qs: [
  { id: 'NIA_SAS_child', t: 'scale', q: '스마트폰 사용 (스마트폰 과의존 척도, 유아동 관찰자용)', n: 9, o: ['전혀 그렇지 않다', '그렇지 않다', '그렇다', '매우 그렇다'], p: '핵심',
    h: '[연구진] 한국지능정보사회진흥원 척도, 공공누리 제4유형(출처표시·비상업·변경금지). 원문 9문항을 그대로 넣으세요.', items: [] },
  { id: 'CSHQ', t: 'scale', q: '아이의 수면 습관 (CSHQ)', n: 33, preview: 4, o: ['대부분(주 5–7일)', '가끔(주 2–4일)', '거의 안 함(주 0–1일)'], p: '권장',
    h: '[연구진] 개발자 허락 후 번역 문항 33개를 넣으세요.', items: [] },
  { id: 'NQ_C', t: 'scale', q: '아이의 식생활 (어린이 영양지수 NQ)', n: 19, preview: 4, o: ['보기 1', '보기 2', '보기 3', '보기 4', '보기 5'], p: '핵심',
    h: '[연구진] 한국영양학회 원문 19문항과 문항별 보기를 넣으세요.', items: [] },
]},
],
};
})();
