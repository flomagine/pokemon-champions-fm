# Development Guide

## 변경 순서

1. 요구사항을 한 문장으로 고정합니다.
2. 데이터 변경인지 규칙 변경인지 UI 변경인지 분류합니다.
3. 가장 안쪽 계층부터 수정합니다: `data → core → ui`.
4. 기존 사례를 깨뜨리지 않도록 `tests/domain.test.mjs`에 회귀 테스트를 먼저 추가합니다.
5. `npm test`와 JavaScript 문법 검사를 통과시킨 뒤 `main`에 반영합니다.

## 수정 위치

### 포켓몬·메가폼·메타 표본

- 기본 도감과 우리 파티: `src/data/pokemon-data.js`
- 성격·노력치·특성·기술·스피드 표본: `src/data/meta-data.js`

UI 파일에 포켓몬 수치나 채용률을 직접 적지 않습니다.

### 타입과 방어 투자

- 타입 배율: `src/core/type-system.js`
- 물리막이·특수막이·혼합내구 판단: `src/core/defense-engine.js`

### 특성과 기술 효과

- 무효·반감·위력 변화·우선기 차단·교체 방해: `src/core/ability-engine.js`

### 행동순서와 실제 대면

- 실수치 스피드, 스카프, 랭크, 우선도, 변환자재 이후 타입: `src/core/speed-engine.js`
- 후출·선대면·돌파축 종합 평가: `src/core/matchup-engine.js`

### 선출과 선봉

- 상대 3마리 시나리오, 선봉 확률, 우리 60개 계획 평가: `src/core/selection-engine.js`

### 화면

- DOM 이벤트·렌더링: `src/ui/simulator-app.js`
- 표시 전용 포맷: `src/ui/formatters.js`
- 스타일: `assets/styles.css`

## 의존성 규칙

```text
src/data  ←  src/core  ←  src/ui  ←  src/main.js
```

- `src/data`는 다른 계층을 import하지 않습니다.
- `src/core`는 DOM을 읽지 않습니다.
- `src/ui`는 계산 규칙을 재구현하지 않습니다.
- `src/main.js`는 객체 생성과 의존성 연결만 담당합니다.

## 테스트 기준

현재 회귀 테스트는 다음을 고정합니다.

- 기본 포켓몬 235종, 합법 메가 75폼, 신규 메가 32폼 데이터 무결성
- 복합 타입 상성
- 찌리배리의 특수내구 투자 방향
- 개굴닌자의 선공 오물웨이브·변환자재 이후 누리레느 문포스 반감
- 235종 전체 대면 프로필 생성
- 상대 6마리 입력 시 우리 선출 20조합 × 선봉 3개, 총 60개 계획 생성

새 버그가 발견되면 수정 코드보다 먼저 그 상황을 재현하는 테스트를 추가하는 것을 원칙으로 합니다.

## 검증 명령

```bash
npm test
find src -name '*.js' -print0 | xargs -0 -n1 node --check
```

브라우저 검증에서는 다음을 확인합니다.

1. 초기 화면과 235종 매뉴얼이 렌더링되는가
2. 샘플 상대를 불러온 뒤 추천 선출 3마리와 상대별 6행이 생성되는가
3. 현재 대면 복구에서 속도·우선도·타입 변화가 표시되는가
4. 콘솔 오류가 없는가
