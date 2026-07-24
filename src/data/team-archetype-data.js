// Team-level role evidence. Exact snapshots are separated from inference rules.
// M-B single battle snapshots were refreshed on 2026-07-24.

export const ROLE_LABELS=Object.freeze({
  recoveryWall:'회복막이',physicalWall:'물리막이',specialWall:'특수막이',mixedWall:'혼합막이',
  statusSpreader:'상태이상 시계',sleepForcer:'수면·강제교체',hazardSetter:'함정 설치',hazardRemover:'함정 제거',
  pivot:'교체 주도권',regenerator:'재생력 코어',trapper:'교체 억제',antiSetup:'랭크업 차단',
  phazer:'강제 교체',protector:'방어 반복',cleric:'회복 지원',itemControl:'도구 제어',
  setupWincon:'랭크업 승리축',revengeKiller:'복수 처리',physicalBreaker:'물리 돌파',specialBreaker:'특수 돌파',
  screenSetter:'벽 전개',weatherSetter:'날씨 전개',spinBlocker:'제거 차단'
});

export const ROLE_MOVES=Object.freeze({
  reliableRecovery:new Set(['게으름피우기','HP회복','알낳기','날개쉬기','달의불빛','달빛','아침햇살','광합성','우유마시기','힘흡수','희망사항']),
  status:new Set(['맹독','도깨비불','전기자석파','독가루','수면가루','씨뿌리기','소금절이','열탕','찬물끼얹기']),
  sleep:new Set(['하품','수면가루','버섯포자','최면술']),
  hazards:new Set(['스텔스록','압정','독압정','끈적끈적네트','비검천중파','암석액스']),
  removal:new Set(['안개제거','고속스핀','정리정돈']),
  pivot:new Set(['유턴','볼트체인지','막말내뱉기','퀵턴','텔레포트']),
  trap:new Set(['엉겨붙기','소용돌이','회오리불꽃','조이기','검은눈빛','블록']),
  antiSetup:new Set(['흑안개','클리어스모그','날려버리기','울부짖기','드래곤테일','배대뒤치기']),
  phaze:new Set(['날려버리기','울부짖기','드래곤테일','배대뒤치기']),
  protect:new Set(['방어','판별','토치카','킹실드','니들가드']),
  cleric:new Set(['희망사항','아로마테라피','치료방울','정글힐','초승달의기도']),
  itemControl:new Set(['트릭','바꿔치기','탁쳐서떨구기']),
  setup:new Set(['칼춤','용의춤','나비춤','명상','벌크업','철벽','망각술','코스믹파워','비축하기','껍질깨기','나쁜음모','저주']),
  screens:new Set(['리플렉터','빛의장막','오로라베일']),
  weather:new Set(['비바라기','쾌청','모래바람','설경'])
});

export const EXACT_ROLE_SNAPSHOTS=Object.freeze({
  '찌리배리':Object.freeze({updated:'2026-07-24 11:30 KST',confidence:'높음',roles:{specialWall:.98,recoveryWall:.98,statusSpreader:.95,pivot:.72,itemControl:0},moves:['물붓기','게으름피우기','맹독','볼트체인지','파라볼라차지'],note:'물붓기·회복·맹독으로 타입과 교환 시간을 동시에 제어'}),
  '더시마사리':Object.freeze({updated:'2026-07-21 17:00 KST',confidence:'높음',roles:{mixedWall:.96,recoveryWall:1,statusSpreader:.98,regenerator:.96,trapper:.56,protector:.52,antiSetup:.5,hazardSetter:.2},moves:['HP회복','맹독','엉겨붙기','토치카','흑안개','독압정'],note:'재생력으로 칩을 복구하며 맹독·교체 억제·흑안개를 겸하는 막이 코어'}),
  '하마돈':Object.freeze({updated:'2026-07-23 19:30 KST',confidence:'높음',roles:{physicalWall:.9,recoveryWall:.6,sleepForcer:.94,hazardSetter:.76,phazer:.5,antiSetup:.5,weatherSetter:.98},moves:['지진','하품','스텔스록','게으름피우기','날려버리기'],note:'하품과 날려버리기로 교체를 강요하고 스텔스록 피해를 누적'}),
  '야도란':Object.freeze({updated:'2026-07-23 02:00 KST',confidence:'높음',roles:{physicalWall:.94,recoveryWall:.89,statusSpreader:.86,regenerator:.7,setupWincon:.66,antiSetup:.15},moves:['게으름피우기','열탕','철벽','바디프레스','명상'],note:'물리 공격을 받아내며 화상·철벽으로 물리축을 봉쇄'}),
  '아머까오':Object.freeze({updated:'2026-07-21 14:00 KST',confidence:'높음',roles:{physicalWall:.94,recoveryWall:.98,pivot:.64,setupWincon:.65,hazardRemover:.07,itemControl:.07},moves:['날개쉬기','바디프레스','철벽','유턴','벌크업','도발','안개제거'],note:'날개쉬기·철벽으로 물리축을 막고 유턴으로 유리 대면을 반복'}),
  '블래키':Object.freeze({updated:'2026-07-24 16:30 KST',confidence:'높음',roles:{physicalWall:.9,recoveryWall:.84,statusSpreader:.63,sleepForcer:.36,protector:.82,cleric:.81},moves:['속임수','방어','희망사항','맹독','하품','달빛'],note:'희망사항·방어로 자신과 동료를 복구하며 맹독 또는 하품으로 시간을 번다'})
});

export const ARCHETYPE_LABELS=Object.freeze({
  fullStall:'완전 막이 사이클',semiStall:'세미 스톨',regenStall:'재생력 막이 사이클',hazardStall:'함정·강제교체 스톨',
  bulkyBalance:'내구 밸런스',pivotBalance:'피벗 밸런스',hazardOffense:'함정 공격',screenOffense:'벽 전개 공격',
  weatherOffense:'날씨 공격',hyperOffense:'대면 공격',standardBalance:'표준 밸런스'
});

export const ROLE_WEIGHTS=Object.freeze({
  recoveryWall:2.2,statusSpreader:1.5,hazardSetter:1.35,regenerator:1.7,trapper:1.25,antiSetup:1.2,
  physicalWall:1.1,specialWall:1.1,mixedWall:1.35,cleric:1.25,phazer:1.15,protector:.7,
  setupWincon:1.1,physicalBreaker:.8,specialBreaker:.8,pivot:.75,hazardRemover:.6
});
