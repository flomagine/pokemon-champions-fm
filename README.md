# Pokémon Champions FM Selection Simulator

포켓몬 챔피언스 M-B 싱글 전용 선출·선봉·현재 대면 복구 도구입니다.

현재 애플리케이션 구조 버전은 **v5.0 SE modular refactor**, 전투 데이터 기준판은 **v4.3**입니다.

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
- `src/data`: 포켓몬·기술·특성·메타 표본 데이터
- `src/core`: 타입·내구·특성·스피드·대면·선출 도메인 엔진
- `src/ui`: DOM 렌더링과 사용자 입력
- `src/main.js`: 의존성 연결과 애플리케이션 시작점
- `tests`: 도메인 회귀 테스트
- `docs/ARCHITECTURE.md`: 설계 원칙과 계층 구조
- `docs/DEVELOPMENT.md`: 수정 위치와 검증 절차
- `archive/v4.3-single-file.html`: 리팩터링 전 원본 보관본

## 핵심 클래스

- `TypeSystem`
- `DefenseEngine`
- `AbilityEngine`
- `MatchupEngine`
- `SpeedEngine`
- `SelectionEngine`
- `SimulatorApp`

UI는 도메인 엔진을 호출하지만, 도메인 엔진은 UI를 참조하지 않습니다. 메타 데이터와 판정 알고리즘도 분리되어 있어 데이터 갱신이 화면 코드에 영향을 주지 않도록 구성했습니다.
