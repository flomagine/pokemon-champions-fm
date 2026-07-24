// Recovery/status usage snapshots are kept outside the decision algorithms.
// Bellibolt snapshot: OP.GG Pokémon Champions single battle, updated 2026-07-24 11:30 KST.

export const RELIABLE_RECOVERY_MOVES=new Set([
  '게으름피우기','HP회복','알낳기','날개쉬기','달의불빛','아침햇살','광합성','우유마시기','치유소원','힘흡수'
]);

export const DRAIN_RECOVERY_MOVES=new Set([
  '파라볼라차지','기가드레인','드레인펀치','흡혈','휘적휘적포'
]);

export const CLOCK_MOVES=new Set([
  '맹독','도깨비불','씨뿌리기','소금절이'
]);

export const ANTI_STALL_MOVES=Object.freeze({
  '도발':{kind:'hardControl',weight:1},
  '트릭':{kind:'itemControl',weight:.72},
  '앙코르':{kind:'moveControl',weight:.62}
});

export const STALL_META=Object.freeze({
  '찌리배리':Object.freeze({
    confidence:'높음',
    updated:'2026-07-24 11:30 KST',
    reliableRecovery:{move:'게으름피우기',usage:.906,heal:.5},
    drainRecovery:{move:'파라볼라차지',usage:.523},
    passiveRecovery:{item:'먹다남은음식',usage:.665},
    statusClock:{move:'맹독',usage:.83,kind:'toxic'},
    typeControl:{move:'물붓기',usage:.937},
    pivot:{move:'볼트체인지',usage:.676},
    requiredAxis:'physical',
    requiredTypes:['땅'],
    breakerThreshold:1.1,
    breakGradeCap:4,
    threatBonus:1.15,
    note:'게으름피우기와 먹다남은음식·파라볼라차지로 체력을 되돌리면서 맹독으로 교환 시간을 제한한다. 물붓기까지 있어 땅 타입 공격수도 반복 후출 카운터로 보지 않는다.'
  })
});
