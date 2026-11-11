# 성장·사춘기 코호트 보호자 설문 (v0.5 · 외래 iPad)

건양대학교병원 소아청소년과 「디지털 행동, 생활습관 요인과 소아 성장/사춘기 변화의 연관성 평가를 위한 전향적 파일럿 코호트 연구」(IRB KYUH 2026-09-027)의 보호자 설문입니다. 문항은 CRF 자료사전과 1:1로 대응합니다. 척도 3종은 보호자가 종이로 작성하고 연구진이 `scales.html`로 입력합니다.

## 구조 (v0.5, `SAVE_MODE: 'device'`)

```
외래 iPad (홈 화면 앱 "성장코호트")
  ├─ baseline.html  첫 방문 설문  ─┐
  ├─ followup.html  정기 설문     ─┼─▶ iPad 안의 IndexedDB에만 저장 (인터넷 전송 없음)
  ├─ scales.html    척도 입력     ─┘
  └─ data.html      자료 관리 ──▶ CSV·JSON 파일 ("파일에 저장") ──▶ 원내 보안 저장공간
GitHub Pages: 화면 코드만 내려받는 곳(응답 자료 없음). sw.js가 화면을 iPad에 보관해 오프라인에서도 열림
```

- 응답은 **iPad 밖으로 나가지 않습니다.** GitHub에는 화면 코드만 있습니다.
- 이름·생년월일·연락처·차트번호는 받지 않습니다. 연구 번호(GP-001 형식)만 씁니다.
- v0.4까지의 Google Apps Script·시트 방식은 `SAVE_MODE: 'server'`로 되돌릴 수 있습니다(아래 "Google 시트 방식" 참고).

## 외래 iPad 운영

**처음 한 번**
1. iPad Safari에서 `index.html`(GitHub Pages 주소)을 열고 공유 버튼 → **홈 화면에 추가**. 이후에는 홈 화면 아이콘으로만 엽니다.
   - Safari 탭과 홈 화면 앱은 저장공간이 서로 다릅니다. Safari 탭의 자료는 7일 넘게 사이트를 열지 않으면 지워질 수 있습니다(WebKit 정책). 홈 화면 앱으로 쓰고, 정기적으로 내보내세요.
2. 아이콘으로 연 뒤 각 설문 화면을 한 번씩 열어 두면 오프라인에서도 열립니다.
3. iPad 암호를 켜고 연구 전용으로 씁니다.

**외래에서**
1. 설문을 열고 연구 번호(정기 설문은 방문 개월도)를 입력한 뒤 보호자에게 건넵니다.
2. 제출하면 "저장되었습니다"와 접수번호가 나옵니다. 같은 번호·설문·방문이 이미 있으면 "중복"으로 표시해 저장합니다.
3. 작성 중 응답은 2시간(`DRAFT_MAX_MIN`)이 지나면 버려져 다음 보호자에게 보이지 않습니다.

**자료 옮기기 (외래 후 또는 매주)**
1. `data.html`(연구진 번호 `STAFF_PIN`) → 설문 종류별 **CSV** 또는 **전체 백업 JSON** → "파일에 저장".
2. 파일을 원내 보안 저장공간으로 옮깁니다. CSV 열은 v0.4 시트와 같고(앞쪽에 접수번호·저장 시각·설문·버전·연구 번호·방문·시작·제출·중복), 끝의 `raw_json`에 원응답이 있습니다.
3. 옮긴 것을 확인한 뒤 **내보낸 응답 지우기**로 iPad에서 지웁니다.

- `STAFF_PIN`은 보호자가 실수로 자료 화면을 여는 것을 막는 용도일 뿐 보안 장치가 아닙니다(설정 파일이 공개되어 있음). 실제 보호는 iPad 잠금·기기 관리로 합니다.
- 화면 파일을 고치면 `sw.js`의 `VERSION`을 올려야 iPad가 새 파일을 받습니다. 새 버전은 인터넷에 연결된 상태에서 앱을 한 번 열면 받아집니다.

## 파일 구성

```
index.html                 시작 페이지 (설문 선택, iPad 준비 안내)
baseline.html              첫 방문 설문 (등록 시 1회)
followup.html              정기 설문 (3개월마다, 외래)
scales.html                첫 방문 척도 입력 (연구진용, 종이 설문지 결과)
data.html                  자료 관리 (연구진용) — 목록, CSV·JSON 내보내기, 지우기
sw.js, manifest.webmanifest  오프라인 동작·홈 화면 앱 설정
assets/js/config.js        설정 — 저장 방식, 연구진 번호, 연구 번호 형식 등
assets/js/questions.js     문항 정의 — 문항을 고칠 때는 이 파일만 수정
assets/js/flatten.js       응답 → 열 변환 규칙 (CSV·시트 공통)
assets/js/scoring.js       척도 자동 채점 (스마트폰 과의존·CSHQ·영양지수)
assets/js/localstore.js    iPad 저장(IndexedDB)
assets/js/survey.js        설문 동작
assets/css/style.css       디자인
backend/Code.gs            (server 방식일 때만) Google Apps Script 수신부
docs/sheet-columns.csv     열 ↔ 문항 대응표 (자동 생성)
tools/make-backend.js      문항이 바뀌면 Code.gs·대응표를 다시 만드는 도구
CHANGELOG.md               변경 이력
```

## Google 시트 방식 (v0.4까지, `SAVE_MODE: 'server'`일 때만)

### 설치 순서 (약 30분)

### A. Google 시트 + Apps Script
1. Google Drive에서 새 스프레드시트를 만듭니다(예: `코호트설문_응답`).
2. 메뉴 **확장 프로그램 → Apps Script**를 열고, 기본 코드를 지운 뒤 `backend/Code.gs` 전체를 붙여 넣습니다.
3. 맨 위 설정의 `STUDY_KEY`를 임의의 문자열로 바꾸고 저장합니다.
4. 편집기 위쪽 함수 목록에서 `setupParticipants`를 고르고 **실행**합니다(처음 한 번 권한 승인 필요). 시트에 `participants` 탭이 생기고 GP-001 ~ GP-150의 6자리 참여 코드가 만들어집니다.
5. **배포 → 새 배포 → 유형: 웹 앱**
   - 실행 사용자: **나**
   - 액세스 권한: **모든 사용자** (보호자가 로그인 없이 제출해야 하므로)
6. 표시되는 **웹 앱 URL**(`https://script.google.com/macros/s/…/exec`)을 복사합니다. -> https://script.google.com/macros/s/AKfycbzjzS7bsaL0Y52zZt-vbxU_yH3TI4GPnsoR8qRHlsrXYmhjLWhLzXwGu11bC9eI88Bb/exec
7. 브라우저에서 그 URL을 열어 `survey endpoint alive`가 보이면 정상입니다.

### B. GitHub Pages
1. GitHub에서 새 저장소를 만듭니다(예: `growth-survey`).
2. `assets/js/config.js`를 고칩니다.
   - `SUBMIT_URL`: A-6에서 복사한 웹 앱 URL
   - `STUDY_KEY`: A-3과 같은 값
   - `MODE`: 실제 운영 시 `'live'` (시제품 표시와 "연구진 보기" 숨김)
3. 이 폴더의 파일을 모두 저장소에 올립니다(`.nojekyll` 포함).
4. 저장소 **Settings → Pages → Branch: `main` / `(root)` → Save**.
5. 1–2분 뒤 `https://<계정>.github.io/growth-survey/`에서 열립니다.

### C. 동작 확인
1. `index.html`의 "보호자용 링크 만들기"에 `GP-150`과 그 참여 코드를 넣어 링크를 만듭니다.
2. 휴대폰으로 열어 시험 응답을 제출하고, 접수번호가 보이는지, 시트의 `followup_0.3` 탭에 행이 생겼는지 확인합니다. `scales.html`도 같은 번호로 한 번 시험합니다(`scales_0.3` 탭).
3. 시험 행을 지우고, `participants` 탭에서 GP-150의 `active`를 `FALSE`로 바꿔 둡니다.

### 보호자에게 보내는 링크 (server 방식)

```
https://<계정>.github.io/growth-survey/followup.html?id=GP-007&c=K7Q2MX&v=6&sex=여아
```

| 값 | 뜻 |
|---|---|
| `id` | 연구 번호 |
| `c` | 참여 코드 (`participants` 탭) |
| `v` | 방문 차수(등록 후 개월). 정기 설문만 |
| `sex` | 아이 성별(남아/여아). "몸의 변화" 보기에 씀 |

- `index.html`의 "보호자용 링크 만들기"로 만들 수 있습니다. 이름·생년월일·전화번호는 링크에 넣지 마세요.
- 링크 없이 들어오면 연구 번호와 참여 코드를 직접 입력해야 시작할 수 있습니다.
- 참여를 끝낸 대상자는 `participants` 탭의 `active`를 `FALSE`로 바꾸면 더 이상 제출할 수 없습니다.

### 시트에 저장되는 방식 (server 방식)

- 탭 이름은 `설문종류_버전`입니다(`baseline_0.3`, `followup_0.3`, `scales_0.3`). `FORM_VERSION`을 올리면 새 탭이 생겨 버전이 다른 응답의 열이 섞이지 않습니다.
- 응답 1건 = 1행. 앞쪽 고정 열: `receipt`(접수번호), `server_time`, `form`, `form_version`, `participant_id`, `visit_month`, `started_at`, `submitted_at`, `duplicate_of`.
- 문항 열은 `docs/sheet-columns.csv`를 보세요. 한 문항이 여러 칸이면 접미사를 붙입니다(주중·주말 `_wd`/`_we`, 아버지·어머니 `_father`/`_mother`, 척도 `_1`…`_n`, 운동은 개수 `_n`과 상세 `_json`).
- 마지막 `raw_json` 열에 응답 원자료 전체를 남겨 둡니다.
- 같은 번호·같은 차수로 다시 제출하면 **막지 않고 저장**하며, `duplicate_of`에 이전 접수번호를 적습니다. 분석 규칙(예: 마지막 응답 채택)은 분석계획서에 정하세요.
- `=`, `+`, `-`, `@`로 시작하는 글은 시트 수식으로 실행되지 않도록 앞에 `'`를 붙여 저장합니다.

## 설정 (`assets/js/config.js`)

| 항목 | 설명 |
|---|---|
| `SUBMIT_URL` | Apps Script 웹 앱 주소. 비워 두면 데모 모드(전송 안 함, 저장될 값만 표시) |
| `STUDY_KEY` | Code.gs와 같은 값. 페이지 소스에 보이므로 스팸 거르기 용도 |
| `PID_PATTERN` | 연구 번호 형식. Code.gs의 `PID_RE`와 같게 |
| `REQUIRE_CODE` | 참여 코드 확인 여부. Code.gs와 같게 |
| `MODE` | `'demo'` 또는 `'live'`. 운영 중에도 주소 끝에 `?debug=1`을 붙이면 연구진 보기가 켜짐 |
| `TIME_STEP_MIN` | 잠든 시각·일어난 시각 선택 간격(분). 기본 10분 |
| `SAVE_DRAFT` | 작성 중인 응답을 그 기기에 임시 저장(제출하면 삭제). 공용 태블릿이면 `false` |
| `FORM_VERSION` | 문항 버전. 바꾸면 시트에 새 탭이 생김 |

## 문항 고치기

1. `assets/js/questions.js`를 고칩니다. `id`는 자료사전 변수명과 같아야 합니다.
2. `node tools/make-backend.js`를 실행해 `backend/Code.gs`와 `docs/sheet-columns.csv`를 다시 만듭니다.
3. `config.js`의 `FORM_VERSION`을 올리고, 자료사전과 `CHANGELOG.md`도 고칩니다.
4. Apps Script 편집기에 새 `Code.gs`를 붙여 넣고(맨 위 `STUDY_KEY` 다시 입력), **배포 관리 → 편집 → 새 버전**으로 재배포합니다. 웹 앱 URL은 그대로입니다.

## 첫 방문 척도 (v0.4~)

척도 3종(스마트폰 과의존 9문항, CSHQ 한국어판 52번까지, 영양지수(학령기 어린이, 식약처 공식 개정판) 19문항)은 **첫 방문에 한 번, 보호자가 종이로** 작성합니다(2026-10-28 결정).
1. 보호자에게 「첫방문_척도설문지_v0.2.docx」를 인쇄해 드립니다(연구 번호를 위에 적음).
2. 연구진이 `scales.html?id=GP-007&c=참여코드`를 열고 체크된 번호를 그대로 입력합니다. 빈 문항과 두 칸 체크 문항은 비워 두고 메모에 적습니다.
3. 마지막 화면에서 자동 채점 결과를 확인하고 제출합니다. 원응답과 점수가 함께 iPad에 저장되고, 자료 관리의 "척도 입력 CSV"로 내보냅니다.

- 화면과 저장소에는 척도 원문을 싣지 않습니다(문항 번호와 짧은 표지만). 공개 저장소에 원문을 넣지 마세요.
- 채점 규칙은 `assets/js/scoring.js`와 「첫방문_척도_채점입력안내_v0.3.docx」에 있습니다. 영양지수 점수는 공식 가중치·등급 기준을 받을 때까지 비워 두고(`NQ_WEIGHTS_READY = false`) 원응답만 저장합니다. 하위척도·총점은 결측 문항이 하나라도 있으면 비워 둡니다. 원응답이 남아 있으므로 규칙을 바꾸면 다시 계산할 수 있습니다.
- 사용 허락: 스마트폰 과의존 척도는 공공누리 제4유형(변경금지), CSHQ는 개발자(Owens) 허락, 영양지수는 개발 연구진·한국영양학회(필요하면 식약처) 확인이 필요합니다.

## 운영 전 확인할 것

- **자료 저장 장소(가장 중요).** 이 구조에서는 응답이 Google(국외 클라우드)에 저장됩니다. 연구계획서·DMP에는 가명 연구자료를 원내 보안 저장공간에 보관한다고 되어 있으므로, 이 방식을 쓰려면 IRB 변경심의와 DMP 수정이 필요할 수 있습니다. 기관 승인 도구(REDCap 등)나 병원 내부 서버가 있으면 그쪽이 우선입니다. 그 경우 `SUBMIT_URL`만 바꾸면 화면은 그대로 쓸 수 있습니다(같은 JSON을 받는 주소 필요).
- **공개 범위.** 무료 GitHub 계정은 공개 저장소에서만 Pages를 쓸 수 있고, Pages 사이트는 인터넷에 공개됩니다([GitHub Pages 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)). 페이지에는 검색엔진 수집을 막는 `noindex`를 넣었습니다.
- **보안 수준.** `STUDY_KEY`는 누구나 볼 수 있습니다. 실제 보호 장치는 대상자별 참여 코드입니다. 코드가 든 링크는 해당 보호자에게만 보내세요.
- **Google 계정.** 시트와 Apps Script를 만든 계정이 데이터 소유자입니다. 2단계 인증을 켜고, 시트 공유 범위를 연구진으로 제한하세요.

## 로컬에서 확인하기

`baseline.html`을 더블클릭해 브라우저로 열면 데모 모드로 동작합니다(인터넷이 없으면 글꼴만 기본 글꼴로 보입니다).
