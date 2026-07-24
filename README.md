# Pokémon Champions FM Selection Simulator

포켓몬 챔피언스 M-B 싱글 전용 선출·선봉·현재 대면 복구 도구입니다.

현재 애플리케이션 버전은 **v5.2 team analysis**, 전투 데이터 기준판은 **v4.3＋2026-07-24 막이 역할 표본**입니다.

## 언제든 웹으로 열기

GitHub Pages를 한 번만 설정하면 아래 주소를 북마크해 계속 사용할 수 있습니다.

- **실행 주소:** https://flomagine.github.io/pokemon-champions-fm/
- **소스 저장소:** https://github.com/flomagine/pokemon-champions-fm

### GitHub Pages 최초 설정

1. 저장소 상단의 `Settings`를 엽니다.
2. 왼쪽 `Pages`를 선택합니다.
3. `Build and deployment`의 `Source`를 `Deploy from a branch`로 선택합니다.
4. Branch는 `main`, 폴더는 `/(root)`를 선택합니다.
5. `Save`를 누릅니다.
6. 저장소의 `Actions`에서 `pages build and deployment`가 초록색 체크가 될 때까지 기다립니다.
7. 위 실행 주소를 열고 북마크합니다.

이후 `main` 브랜치가 갱신되면 같은 주소의 프로그램도 자동으로 갱신됩니다.

## v5.2 팀 분석

상대 여섯 마리를 개별 카운터 목록으로만 보지 않고 하나의 전투 시스템으로 분석합니다.

- 완전 막이 사이클, 세미 스톨, 재생력 스톨, 함정·강제교체 스톨
- 내구 밸런스, 피벗 밸런스, 함정 공격, 벽 전개, 날씨 공격, 대면 공격
- 회복막이, 물리·특수막이, 상태이상, 함정, 제거, 재생력, 피벗, 교체 억제
- 흑안개·천진·날려버리기 같은 랭크업 차단
- 희망사항·방어, 함정＋강제교체, 재생력＋피벗 같은 역할 의존관계

추천 선출은 다음 조건을 별도로 검사합니다.

1. 회복량보다 큰 지속 타점이 있는가
2. 물리막이에는 특수축, 특수막이에는 물리축이 실제로 존재하는가
3. 트릭·앙코르는 직접 돌파가 아니라 일시 제어로 구분되는가
4. 함정 제거가 없을 때 설치자를 초반에 압박할 수 있는가
5. 맹독·화상·하품에 장기전할 대책이 있는가
6. 흑안개·천진 담당을 제거하기 전에 따라큐 칼춤을 승리축으로 잡고 있지 않은가
7. 재생력 코어에 피해를 분산하지 않고 한 대상을 연속 압박할 수 있는가

결과 화면에는 상대 역할 구조, 역할 연결, 해체 우선순위, 선출 세 마리의 담당 임무와 초·중·후반 파훼 순서가 표시됩니다.

## 로컬에서 열기

ES Module을 사용하므로 `index.html`을 파일로 더블클릭하지 말고 로컬 서버를 사용합니다.

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

Node.js가 설치되어 있다면 다음 명령으로 회귀 테스트를 실행할 수 있습니다.

```bash
npm test
```

## 소프트웨어 구조

- `index.html`: 화면의 정적 골격
- `assets/styles.css`: 스타일
- `src/data/pokemon-data.js`: 포켓몬·우리 파티 기본 데이터
- `src/data/meta-data.js`: 특성·스피드·내구 표본
- `src/data/stall-data.js`: 회복막이와 상태이상 표본
- `src/data/team-archetype-data.js`: 팀 역할·아키타입 근거 데이터
- `src/core`: 타입·내구·특성·스피드·대면·선출 도메인 엔진
- `src/core/stall-engine.js`: 회복량·맹독 시계·일시 제어와 지속 돌파 판정
- `src/core/team-analysis-engine.js`: 역할 추론·의존 그래프·해체 계획
- `src/core/selection-engine-v3.js`: 팀 구조를 선출 60계획에 반영
- `src/ui/team-plan-decorator.js`: 역할 구조와 파훼 단계 표시
- `tests`: 도메인·막이·팀 분석 회귀 테스트
- `docs/ARCHITECTURE.md`: 설계 원칙과 계층 구조
- `docs/DEVELOPMENT.md`: 수정 위치와 검증 절차
- `archive/v4.3-single-file.html`: 리팩터링 전 원본 보관본

## 핵심 클래스

- `TypeSystem`
- `DefenseEngine`
- `AbilityEngine`
- `MatchupEngine`
- `StallEngine`
- `TeamAnalysisEngine`
- `SpeedEngine`
- `SelectionEngine`
- `SimulatorApp`

UI는 도메인 엔진을 호출하지만, 도메인 엔진은 UI를 참조하지 않습니다. 최신 표본은 데이터 계층에 두고 판정 규칙과 분리했습니다.
