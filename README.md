# 성장·사춘기 코호트 보호자 설문 (v0.2)

건양대학교병원 소아청소년과 「디지털 행동, 생활습관 요인과 소아 성장/사춘기 변화의 연관성 평가를 위한 전향적 파일럿 코호트 연구」(IRB KYUH 2026-09-027)의 보호자용 모바일 설문입니다. 문항은 **CRF 자료사전 v0.2**(2026-10-21)와 1:1로 대응합니다.

## 구조

```
보호자 휴대폰 ──▶ baseline.html / followup.html   (GitHub Pages: 화면만)
                        │  POST (JSON, text/plain)
                        ▼
                 backend/Code.gs                    (Google Apps Script 웹 앱: 검증·저장)
                        │
                        ▼
                 Google 시트                         탭: baseline_0.2 · followup_0.2 · participants
```

- GitHub에는 **화면(코드)만** 올라갑니다. 응답은 연구자 Google 계정의 시트에만 쌓입니다.
- 이름·생년월일·연락처·차트번호는 받지 않습니다. 연구 번호(GP-001 형식)와 참여 코드만 씁니다.
- 참여 코드는 확인에만 쓰고 시트의 응답 탭에는 저장하지 않습니다.

## 파일 구성

```
index.html                 연구진용 시작 페이지 (설문 선택, 보호자용 링크 만들기)
baseline.html              첫 방문 설문 (등록 시 1회)
followup.html              정기 설문 (3개월마다)
assets/js/config.js        설정 — 저장 주소, 키, 연구 번호 형식 등
assets/js/questions.js     문항 정의 — 문항을 고칠 때는 이 파일만 수정
assets/js/flatten.js       응답 → 시트 열 변환 규칙
assets/js/survey.js        설문 동작
assets/css/style.css       디자인
backend/Code.gs            Google Apps Script 수신부 (tools/make-backend.js가 생성)
docs/sheet-columns.csv     시트 열 ↔ 문항 대응표 (자동 생성)
tools/make-backend.js      문항이 바뀌면 Code.gs·대응표를 다시 만드는 도구
tools/Code.template.gs     Code.gs의 원본 틀
CHANGELOG.md               문항 변경 이력
```

## 설치 순서 (약 30분)

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
2. 휴대폰으로 열어 시험 응답을 제출하고, 접수번호가 보이는지, 시트의 `followup_0.2` 탭에 행이 생겼는지 확인합니다.
3. 시험 행을 지우고, `participants` 탭에서 GP-150의 `active`를 `FALSE`로 바꿔 둡니다.

## 보호자에게 보내는 링크

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

## 시트에 저장되는 방식

- 탭 이름은 `설문종류_버전`입니다(`baseline_0.2`, `followup_0.2`). `FORM_VERSION`을 올리면 새 탭이 생겨 버전이 다른 응답의 열이 섞이지 않습니다.
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

척도 3종(스마트폰 과의존, CSHQ, NQ)은 원문 자리만 있습니다. `questions.js`의 해당 문항 `items: []`에 원문을 넣으면 표시됩니다.
- 스마트폰 과의존 척도: 공공누리 제4유형(출처표시·비상업·변경금지). 원문 9문항을 고치지 말고 그대로.
- CSHQ: 개발자(Owens) 허락 후 번역 문항 사용.
- NQ: 한국영양학회 아동용 원문과 문항별 보기 확인.
- 공개 저장소에 올리면 척도 원문도 공개됩니다.

## 운영 전 확인할 것

- **자료 저장 장소(가장 중요).** 이 구조에서는 응답이 Google(국외 클라우드)에 저장됩니다. 연구계획서·DMP에는 가명 연구자료를 원내 보안 저장공간에 보관한다고 되어 있으므로, 이 방식을 쓰려면 IRB 변경심의와 DMP 수정이 필요할 수 있습니다. 기관 승인 도구(REDCap 등)나 병원 내부 서버가 있으면 그쪽이 우선입니다. 그 경우 `SUBMIT_URL`만 바꾸면 화면은 그대로 쓸 수 있습니다(같은 JSON을 받는 주소 필요).
- **공개 범위.** 무료 GitHub 계정은 공개 저장소에서만 Pages를 쓸 수 있고, Pages 사이트는 인터넷에 공개됩니다([GitHub Pages 안내](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)). 페이지에는 검색엔진 수집을 막는 `noindex`를 넣었습니다.
- **보안 수준.** `STUDY_KEY`는 누구나 볼 수 있습니다. 실제 보호 장치는 대상자별 참여 코드입니다. 코드가 든 링크는 해당 보호자에게만 보내세요.
- **Google 계정.** 시트와 Apps Script를 만든 계정이 데이터 소유자입니다. 2단계 인증을 켜고, 시트 공유 범위를 연구진으로 제한하세요.

## 로컬에서 확인하기

`baseline.html`을 더블클릭해 브라우저로 열면 데모 모드로 동작합니다(인터넷이 없으면 글꼴만 기본 글꼴로 보입니다).
