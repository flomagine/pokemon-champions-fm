// Recovery/status usage snapshots are kept outside the decision algorithms.
// M-B single battle snapshots refreshed through 2026-07-24.

export const RELIABLE_RECOVERY_MOVES=new Set([
  '게으름피우기','HP회복','알낳기','날개쉬기','달의불빛','달빛','아침햇살','광합성','우유마시기','힘흡수','희망사항'
]);

export const DRAIN_RECOVERY_MOVES=new Set([
  '파라볼라차지','기가드레인','드레인펀치','흡혈','휘적휘적포'
]);

export const CLOCK_MOVES=new Set([
  '맹독','도깨비불','씨뿌리기','소금절이','하품','열탕','전기자석파'
]);

export const ANTI_STALL_MOVES=Object.freeze({
  '도발':{kind:'hardControl',weight:1},
  '트릭':{kind:'itemControl',weight:.72},
  '앙코르':{kind:'moveControl',weight:.62}
});

export const STALL_META=Object.freeze({
  '찌리배리':Object.freeze({
    confidence:'높음',updated:'2026-07-24 11:30 KST',
    reliableRecovery:{move:'게으름피우기',usage:.906,heal:.5},drainRecovery:{move:'파라볼라차지',usage:.523},
    passiveRecovery:{item:'먹다남은음식',usage:.665},statusClock:{move:'맹독',usage:.83,kind:'toxic'},
    typeControl:{move:'물붓기',usage:.937},pivot:{move:'볼트체인지',usage:.676},requiredAxis:'physical',requiredTypes:['땅'],
    breakerThreshold:1.1,breakGradeCap:4,threatBonus:1.15,
    note:'게으름피우기와 먹다남은음식·파라볼라차지로 체력을 되돌리면서 맹독으로 교환 시간을 제한한다. 물붓기까지 있어 땅 타입 공격수도 반복 후출 카운터로 보지 않는다.'
  }),
  '더시마사리':Object.freeze({
    confidence:'높음',updated:'2026-07-21 17:00 KST',
    reliableRecovery:{move:'HP회복',usage:.962,heal:.5},passiveRecovery:{item:'먹다남은음식',usage:.575},
    statusClock:{move:'맹독',usage:.931,kind:'toxic'},pivot:{move:'재생력 교체',usage:.957},requiredAxis:'either',requiredTypes:[],
    breakerThreshold:1.18,breakGradeCap:4,threatBonus:1.3,
    note:'HP회복과 맹독이 거의 고정이며 재생력으로 교체 피해를 복구한다. 엉겨붙기·토치카·흑안개가 함께 있어 단발성 칩과 랭크업만으로는 안정적으로 해체되지 않는다.'
  }),
  '하마돈':Object.freeze({
    confidence:'높음',updated:'2026-07-23 19:30 KST',
    reliableRecovery:{move:'게으름피우기',usage:.592,heal:.5},passiveRecovery:{item:'먹다남은음식',usage:.327},
    statusClock:{move:'하품',usage:.939,kind:'sleep'},pivot:{move:'날려버리기',usage:.494},requiredAxis:'special',requiredTypes:[],
    breakerThreshold:1.02,breakGradeCap:4,threatBonus:1.05,
    note:'하품으로 교체를 강요하고 스텔스록·날려버리기로 누적 피해를 만든다. 물리타점만으로 버티는 구도보다 특수 약점 압박과 함정 턴 차단이 우선이다.'
  }),
  '야도란':Object.freeze({
    confidence:'높음',updated:'2026-07-23 02:00 KST',
    reliableRecovery:{move:'게으름피우기',usage:.89,heal:.5},passiveRecovery:{item:'먹다남은음식',usage:.35},
    statusClock:{move:'열탕',usage:.855,kind:'burn'},pivot:{move:'재생력 교체',usage:.7},requiredAxis:'special',requiredTypes:[],
    breakerThreshold:1.08,breakGradeCap:4,threatBonus:1.15,
    note:'게으름피우기와 열탕 화상, 철벽·바디프레스로 물리축을 봉쇄한다. 물리 공격수를 반복 투입하면 화상과 방어 상승 때문에 돌파력이 급격히 사라진다.'
  }),
  '아머까오':Object.freeze({
    confidence:'높음',updated:'2026-07-21 14:00 KST',
    reliableRecovery:{move:'날개쉬기',usage:.981,heal:.5},passiveRecovery:{item:'먹다남은음식',usage:.4},
    statusClock:{move:'철벽',usage:.65,kind:'defenseSetup'},pivot:{move:'유턴',usage:.641},requiredAxis:'special',requiredTypes:['불꽃','전기'],
    breakerThreshold:1.05,breakGradeCap:4,threatBonus:1.0,
    note:'날개쉬기와 철벽·바디프레스로 물리축을 막고 유턴으로 불리한 대면을 탈출한다. 특수 불꽃·전기 압박이 없으면 회복과 피벗을 동시에 허용한다.'
  }),
  '블래키':Object.freeze({
    confidence:'높음',updated:'2026-07-24 16:30 KST',
    reliableRecovery:{move:'희망사항',usage:.806,heal:.5},passiveRecovery:{item:'먹다남은음식',usage:.876},
    statusClock:{move:'맹독',usage:.633,kind:'toxic'},pivot:{move:'방어',usage:.82},requiredAxis:'special',requiredTypes:[],
    breakerThreshold:1.05,breakGradeCap:4,threatBonus:1.1,
    note:'희망사항과 방어로 자신 또는 동료를 복구하고 맹독·하품으로 시간을 번다. 회복 턴을 앙코르·트릭으로 묶거나 현재 물리투자형을 특수 고화력으로 밀어야 한다.'
  })
});
