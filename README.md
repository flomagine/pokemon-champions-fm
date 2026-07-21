
# Pokémon Champions FM Selection Simulator

포켓몬 챔피언스 M-B 싱글 전용 선출·선봉·현재 대면 복구 도구입니다.

## 바로 열기

GitHub Pages가 활성화된 뒤 아래 주소를 북마크하면 됩니다.

- https://flomagine.github.io/pokemon-champions-fm/
- 도메인 회귀 테스트 화면: 저장소를 내려받아 `npm test`

## 로컬에서 열기

ES Module을 사용하므로 `index.html`을 파일로 더블클릭하지 말고 로컬 서버를 사용합니다.

```bash
python -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

## 구조

- `src/data`: 포켓몬·메타 데이터
- `src/core`: 타입/내구/특성/스피드/대면/선출 엔진
- `src/ui`: 화면과 입력 처리
- `tests`: 회귀 테스트
- `docs/ARCHITECTURE.md`: 설계 원칙과 의존 방향

## 검증

```bash
npm test
```

현재 버전: **v5.0 SE modular refactor**
