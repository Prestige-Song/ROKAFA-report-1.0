import React, { useState, useEffect, useCallback, useRef } from "react";
import { Plane, Radio, CheckCircle2, Clock, Users, ShieldCheck, LogOut, ChevronRight, Eye, RotateCcw } from "lucide-react";

/* ---------------------------------------------------------
   토큰
   bg-deep #0B121C / panel #141E2B / line #223244
   accent  #2F6FA5 (공군 블루)  active #5EEAD4 (시안)
   text-primary #E7EEF5 / text-muted #7C8FA3
--------------------------------------------------------- */

const DEFAULT_STATUS = "정예관";
const DATA_KEY = "nameplate_data"; // { board: {...}, log: [...] } 를 한 키에 통합 (동시 쓰기 실패 방지)

const STATUS = [
  { id: "정예관", label: "정예관", color: "#8B7CD9", bg: "#8B7CD91A", isDefault: true },
  { id: "정기", label: "정기외출", color: "#5EEAD4", bg: "#5EEAD41A" },
  { id: "특별외출", label: "특별외출", color: "#5EC4EA", bg: "#5EC4EA1A" },
  { id: "특별외박", label: "특별외박", color: "#3A8FD1", bg: "#3A8FD11A" },
  { id: "청원휴가", label: "청원휴가", color: "#D97BC4", bg: "#D97BC41A" },
  { id: "파견", label: "파견", color: "#C97B3E", bg: "#C97B3E1A" },
  { id: "자발적잔류", label: "자발적 잔류", color: "#4CAF7D", bg: "#4CAF7D1A" },
  { id: "국외", label: "국외", color: "#E2574C", bg: "#E2574C1A" },
  { id: "단재관", label: "단재관", color: "#E8A33D", bg: "#E8A33D1A" },
  { id: "도서관", label: "도서관", color: "#2F6FA5", bg: "#2F6FA51A" },
];

/* ---------------------------------------------------------
   생도 로그인 명단 (대조용)
   형식: "기수|중대|이름(한글)|전화번호(숫자11)" 줄바꿈 구분
   대조 규칙: 기수·중대는 숫자만, 이름은 한글만, 전화번호는 숫자만 비교
--------------------------------------------------------- */
const CADET_ROSTER = `78|1|고신후|01021950537
77|1|김도현|01049774636
76|1|강지완|01065743322
75|1|고유준|01044100213
78|1|구민석|01095897011
77|1|김명수|01086108370
76|1|기운찬|01031498300
75|1|구강민|01068661887
78|1|권준영|01025477453
77|1|김민겸|01025290535
76|1|김기민|01031142649
75|1|구윤호|01066178857
78|1|김도현|01048061924
77|1|김민서|01045563625
76|1|김도헌|01064641933
75|1|김명재|01039775553
78|1|김민재|01090405759
77|1|김현진|01066522713
76|1|김동휘|01063838094
75|1|김병호|01021283461
78|1|김부성|01041198726
77|1|문소윤|01022187449
76|1|김성민|01039343458
75|1|김상준|01093798769
78|1|김선욱|01094016916
77|1|박세은|01028663226
76|1|김재환|01028984577
75|1|김승범|01079280031
78|1|백경민|01050386942
77|1|박정현|01093490936
76|1|김현준|01063195784
75|1|남경현|01091541164
78|1|송새찬|01093532448
77|1|송유찬|01095977577
76|1|김희윤|01075115175
75|1|박도건|01041768521
78|1|알리|01032679959
77|1|심형섭|01077650252
76|1|박광호|01066002047
75|1|박채리|01050448041
78|1|윤시우|01062375508
77|1|양지욱|01088957259
76|1|박현준|01086062084
75|1|서승우|01052930776
78|1|윤여령|01058312582
77|1|우무트|01081823608
76|1|백대현|01024954489
75|1|성재현|01035274253
78|1|이동건|01089527383
77|1|유동현|01052539143
76|1|백동호|01024207446
75|1|여지윤|01021081550
78|1|이민영|01044009794
77|1|유찬영|01059537156
76|1|성우빈|01035887917
75|1|오동준|01066892303
78|1|이소영|01028620133
77|1|이영범|01047906078
76|1|오연택|01056484268
75|1|윤도빈|01099968962
78|1|이솔민|01062867278
77|1|이윤준|01040308905
76|1|이강혁|01059158205
75|1|이윤성|01088395244
78|1|이정관|01021976470
77|1|이의진|01048772105
76|1|이승민|01085946987
75|1|이하늘|01064133934
78|1|임보배|01025513706
77|1|이준호|01063448202
76|1|전창현|01096705856
75|1|장유석|01083930124
78|1|임우진|01030386407
77|1|임경민|01045357012
76|1|정성윤|01064385291
75|1|정희재|01066398910
78|1|장민서|01040972975
77|1|장지원|01085718254
76|1|정솔미|01063785331
75|1|조정희|01048231042
78|1|정현욱|01086981037
77|1|정지윤|01051203017
76|1|조원재|01040093247
75|1|한상원|01088254623
78|1|조은성|01049302422
77|1|조민수|01021229077
76|1|차민경|01054342798
75|1|허민유|01075608712
78|1|조인우|01062862980
77|1|조정원|01026408042
76|1|최무관|01036268704
75|1|홍진승|01086683881
78|1|천태민|01053967646
77|1|천은탁|01089574226
76|1|최준영|01040947914
75|1|황승빈|01075317363
78|1|최동윤|01024876305
77|1|최로이|01071000603
76|1|홍준형|01059099067
75|1|황정우|01056825526
78|1|황지우|01047937627
77|1|하재원|01093331130
76|2|강양원|01092067240
75|2|강민철|01098425859
78|2|강준|01083519030
77|1|하진관|01035708972
76|2|강지현|01090933857
75|2|길세진|01023385590
78|2|김도현|01076894953
77|1|홍지현|01029236126
76|2|김선우|01023718202
75|2|김민석|01045409470
78|2|김민서|01040774632
77|1|황원준|01077634022
76|2|김우섭|01082996685
75|2|김연우|01046794176
78|2|김세준|01090710511
77|2|강범준|01097706102
76|2|김태현|01026364226
75|2|김재민|01031527197
78|2|김유민|01048909802
77|2|김동현|01084662279
76|2|박성준|01062878031
75|2|김준서|01064810526
78|2|김준성|01064454425
77|2|김용준|01064684706
76|2|박수민|01098146497
75|2|김지호|01086951886
78|2|문정우|01040074682
77|2|김우철|01094652302
76|2|박시온|01094575510
75|2|김지환|01091769702
78|2|박호준|01056977425
77|2|김재현|01065582853
76|2|박하균|01096345391
75|2|김호현|01047118762
78|2|배정원|01021047751
77|2|김태완|01076071275
76|2|손준영|01022410785
75|2|노유래|01020418553
78|2|배형준|01096270951
77|2|김하진|01086726614
76|2|송준호|01087096801
75|2|박기태|01041170453
78|2|이도훈|01082008858
77|2|남승우|01028777268
76|2|안드레|01059556280
75|2|박도현|01034150779
78|2|이수민|01064517923
77|2|류윤상|01075972676
76|2|여태환|01023606446
75|2|박준현|01084541241
78|2|이시우|01029000451
77|2|박상우|01038820442
76|2|이나영|01037213409
75|2|배영윤|01042337819
78|2|이우재|01035053702
77|2|박소연|01025660720
76|2|이민기|01048286185
75|2|서현준|01031272214
78|2|이정호|01064647377
77|2|배문정|01095455463
76|2|이민서|01028132516
75|2|손서정|01079257743
78|2|이정후|01033250672
77|2|서준우|01040112834
76|2|이상현|01085272503
75|2|아놉|01033060147
78|2|이주현|01021969233
77|2|신동환|01089086839
76|2|이승헌|01022466717
75|2|이다은|01067982055
78|2|이준서|01031688279
77|2|안쭝|01068686230
76|2|이예준|01094476093
75|2|이성재|01091362306
78|2|임유훈|01073472257
77|2|양승준|01040851775
76|2|이요한|01072141128
75|2|이주엽|01062603853
78|2|장율|01037204965
77|2|우나연|01086871594
76|2|이인성|01091034993
75|2|이준희|01030195851
78|2|전우현|01096373537
77|2|우오상|01046285898
76|2|이현서|01031428570
75|2|임재언|01037891729
78|2|정수민|01031334720
77|2|윤주원|01048978286
76|2|이효산|01030384330
75|2|정지훈|01042768879
78|2|정한서|01089453372
77|2|이근오|01092019897
76|2|장동주|01032671143
75|2|조무겸|01051003746
78|2|정효주|01098145171
77|2|이산하|01044370988
76|2|장서윤|01030768256
75|2|최승빈|01050044564
78|2|최재혁|01050332808
77|2|이성원|01042296263
76|2|조성찬|01035192131
75|2|최윤준|01056917044
78|3|강민재|01076955364
77|2|이승준|01048945391
76|2|주재성|01040335351
75|3|강민정|01027559536
78|3|권지영|01086134849
77|2|이준우|01074261671
76|3|권도윤|01042661484
75|3|강소미|01053456472
78|3|김동연|01093204641
77|2|임재헌|01054022247
76|3|김경민|01044416255
75|3|구재호|01021249395
78|3|김동하|01081389897
77|2|장서영|01042252752
76|3|김다온|01086461825
75|3|권민환|01034482671
78|3|김민재|01083355292
77|2|전지수|01055500871
76|3|김도원|01033481028
75|3|권순수|01059550927
78|3|김정민|01089092307
77|2|조강민|01097110477
76|3|김명현|01092882840
75|3|권우진|01042216301
78|3|김지후|01046753445
77|2|최준혁|01096312245
76|3|김민석|01085650765
75|3|권준규|01024477711
78|3|배재원|01042002821
77|3|강동우|01059091403
76|3|박예원|01026226583
75|3|김강민|01026464025
78|3|브엉렁|01097456686
77|3|권성현|01033834027
76|3|박희성|01053376597
75|3|김대경|01080066978
78|3|오승제|01092225187
77|3|김진표|01053138475
76|3|배상현|01076635621
75|3|김무현|01038157857
78|3|이동현|01064230435
77|3|김진호|01075967428
76|3|손승호|01056715562
75|3|김범수|01033808832
78|3|이민서|01081274354
77|3|김휘헌|01021238239
76|3|손태원|01040666297
75|3|김우진|01051702329
78|3|이상훈|01090523118
77|3|다와|01057329050
76|3|유동훈|01097784412
75|3|김윤구|01093288569
78|3|이서현|01040287040
77|3|박가인|01026556873
76|3|유원준|01035975212
75|3|김태영|01033667254
78|3|이재현|01037991114
77|3|박동현|01049666909
76|3|윤서현|01086443235
75|3|박강|01094955579
78|3|이제윤|01023717759
77|3|박상민|01048037682
76|3|이진성|01086820974
75|3|박서준|01087874026
78|3|이준석|01046691305
77|3|박채원|01064988201
76|3|임재열|01047961481
75|3|박해송|01093901442
78|3|이창민|01098932550
77|3|손성원|01040959071
76|3|조민수|01057664532
75|3|변진우|01081935859
78|3|임태균|01057899538
77|3|신동민|01088210244
76|3|조진흠|01040382961
75|3|엄정웅|01085744951
78|3|장주희|01024553901
77|3|양진서|01063119179
76|3|최유민|01020051842
75|3|여민주|01038041619
78|3|정진우|01055923876
77|3|옥인수|01026683707
76|3|최찬욱|01094789219
75|3|유수민|01090187231
78|3|정현우|01052475479
77|3|우형준|01028880268
76|3|하지훈|01064028471
75|3|윤동현|01026023029
78|3|정현준|01055478461
77|3|이규민|01059067580
76|3|허진우|01096787814
75|3|이도경|01020895863
78|3|최서형|01048907381
77|3|이연호|01072118452
76|3|홍정민|01049445296
75|3|이정환|01077474820
78|3|한승민|01030774471
77|3|이재운|01027078691
76|3|홍준영|01062725714
75|3|정연우|01092897122
78|3|허나영|01065845130
77|3|이정우|01050226763
76|3|홍해원|01071411449
75|3|정주원|01047980158
78|3|황상윤|01087409560
77|3|이준범|01025606271
76|4|강정엽|01037845953
75|3|정태영|01047166018
78|4|강민승|01036120933
77|3|정인준|01068991464
76|4|공수혁|01088273931
75|3|최지현|01071528592
78|4|강지운|01037605128
77|3|지현우|01094250428
76|4|김민아|01040985299
75|4|곽동윤|01089775159
78|4|강진형|01028310454
77|3|진민혁|01064607995
76|4|김예찬|01090812710
75|4|김선우|01042391325
78|4|고경민|01085490182
77|3|최태온|01088699628
76|4|김우진|01066192873
75|4|김성훈|01023208187
78|4|김도현|01057125074
77|4|강다현|01094887769
76|4|김하은|01020434504
75|4|김재완|01093070032
78|4|김시윤|01024600081
77|4|강민성|01024923043
76|4|문준영|01032362495
75|4|김주혁|01052584475
78|4|김시은|01082952824
77|4|강혜원|01093988129
76|4|문창균|01026924022
75|4|김찬진|01059506288
78|4|김용석|01028886410
77|4|권하늘|01072870820
76|4|박경재|01072628803
75|4|김태범|01045117614
78|4|김우빈|01040583596
77|4|김강민|01082503376
76|4|박순후|01092867728
75|4|김하준|01076135257
78|4|김희수|01026871024
77|4|김성철|01040839987
76|4|박진한|01044689114
75|4|김혜민|01073020507
78|4|박유담|01076708426
77|4|김수민|01031392135
76|4|배준성|01066945828
75|4|김홍민|01099066413
78|4|박한영|01024183057
77|4|김태영|01020988560
76|4|백종원|01092637748
75|4|박성진|01071972526
78|4|송지후|01085281324
77|4|모리수|01039697518
76|4|변상원|01073642525
75|4|배무혁|01056158542
78|4|송채민|01039067674
77|4|박세린|01062202574
76|4|빌군|01039716330
75|4|선경진|01059672305
78|4|양현모|01086859755
77|4|방지완|01082472497
76|4|서승우|01071954899
75|4|손모경|01099114758
78|4|오서준|01066728602
77|4|서동현|01031023314
76|4|서태하|01035211032
75|4|손형래|01049045064
78|4|이동욱|01035301687
77|4|송영현|01055354418
76|4|양서영|01065962737
75|4|송주연|01040381477
78|4|이은성|01073703936
77|4|신승주|01074392233
76|4|윤승욱|01041535836
75|4|신용규|01067734023
78|4|이은재|01096494872
77|4|오태준|01073373218
76|4|임승연|01088723208
75|4|안시원|01027897579
78|4|이지혁|01065953607
77|4|오현택|01074013224
76|4|임지섭|01033065413
75|4|이근우|01096327101
78|4|이형주|01094821374
77|4|이광민|01089941719
76|4|장준서|01063642535
75|4|이재원|01076137103
78|4|장준민|01075434769
77|4|이유빈|01083636452
76|4|정가온|01023083502
75|4|이준서|01030059127
78|4|조은규|01034991874
77|4|이재원|01026208892
76|4|정시우|01029926446
75|4|이현준|01056899042
78|4|최지훈|01091952648
77|4|이지한|01022747244
76|4|정태진|01027225055
75|4|장완|01071326772
78|4|홍은서|01044342635
77|4|이태경|01038583238
76|4|조한양|01056158594
75|4|제릭|01021865334
78|5|강민찬|01059588117
77|4|정원우|01062822280
76|4|황하현|01037003646
75|4|조재혁|01056861081
78|5|김나현|01089215960
77|4|정준서|01048650776
76|5|김경수|01021719502
75|4|최은우|01046911774
78|5|김도원|01083722815
77|4|최현준|01063058563
76|5|김경완|01066751930
75|4|최진영|01079274226
78|5|김민재|01085275647
77|4|홍우현|01053281329
76|5|김상윤|01086112458
75|4|홍민주|01077975209
78|5|김정우|01046797477
77|5|권기주|01055450135
76|5|김석진|01074436612
75|5|강경민|01041746113
78|5|김정윤|01026909057
77|5|김소연|01020878460
76|5|김은지|01054868048
75|5|김건|01062905942
78|5|김준형|01072427238
77|5|김우주|01077116946
76|5|김재겸|01093749881
75|5|김결|01057980028
78|5|김지승|01086854505
77|5|김주환|01050995078
76|5|김정언|01049002125
75|5|김경민|01033799762
78|5|김찬민|01094364082
77|5|김태현|01034637270
76|5|김현서|01034206692
75|5|김승은|01092790475
78|5|김하린|01071617507
77|5|김현우|01066322328
76|5|나우진|01033979604
75|5|김호준|01099158732
78|5|김현준|01042935080
77|5|김혜원|01065195458
76|5|문리산|01055806975
75|5|바야르|01079342428
78|5|박민근|01051828521
77|5|노준희|01091518839
76|5|박근|01031266859
75|5|박영호|01064734332
78|5|박정빈|01087234469
77|5|박성욱|01088405607
76|5|박송현|01062551039
75|5|신승효|01083943390
78|5|박종현|01088446860
77|5|박예건|01071303764
76|5|박진서|01045360943
75|5|심성욱|01049462061
78|5|안수만|01092172652
77|5|박채연|01071770794
76|5|박태준|01062055873
75|5|심용섭|01083275428
78|5|양승호|01030911793
77|5|사공민|01096739710
76|5|박현진|01042106201
75|5|윤예주|01038853375
78|5|유건우|01076712414
77|5|서일교|01076878115
76|5|서형욱|01065434771
75|5|이경태|01050573168
78|5|이민준|01046768242
77|5|송인서|01095852560
76|5|설지환|01030367482
75|5|이수호|01088583253
78|5|이승현|01093424338
77|5|수파윗|01098921831
76|5|오시영|01059226835
75|5|이연우|01054076917
78|5|이채솔|01068238353
77|5|여진환|01055594265
76|5|우재혁|01050593602
75|5|이지성|01021078624
78|5|진재영|01083877132
77|5|오도규|01094512639
76|5|윤지성|01059608710
75|5|이태하|01023938653
78|5|최승현|01029017140
77|5|용석현|01040869845
76|5|이준호|01079214006
75|5|임재국|01095487511
78|5|한강산|01083565257
77|5|윤강민|01036319408
76|5|전유찬|01034454206
75|5|임찬영|01067526119
78|5|한서진|01048256199
77|5|윤경환|01093952952
76|5|정해준|01091872521
75|5|정광웅|01035711858
78|5|한승수|01021460236
77|5|이서준|01062397651
76|5|정현우|01050694479
75|5|정민수|01024137396
78|5|허범준|01055106175
77|5|이재진|01076259803
76|5|진두연|01047211952
75|5|정범수|01046459706
78|5|황희태|01037326740
77|5|인용찬|01054609882
76|5|최은서|01020633247
75|5|정우현|01072288035
78|6|강규민|01083687404
77|5|정예준|01043637079
76|5|하야토|01091488422
75|5|한지민|01045135969
78|6|김가온|01028514839
77|5|정현준|01034213736
76|6|김윤상|01053655025
75|6|강지호|01045831581
78|6|김규민|01055925846
77|5|조정환|01082660688
76|6|김준호|01042380633
75|6|권영준|01058972070
78|6|김재엽|01076887021
77|5|주현우|01021824599
76|6|김희수|01023386292
75|6|김대겸|01087680061
78|6|김준구|01059158579
77|5|하희수|01048488536
76|6|민경민|01053484895
75|6|김대호|01055085161
78|6|김지원|01056732700
77|6|김경원|01041265737
76|6|박하은|01054236576
75|6|김선제|01091849903
78|6|김태훈|01091838851
77|6|김규민|01063692427
76|6|배준우|01048090468
75|6|김성재|01094343305
78|6|김현수|01097756117
77|6|김서진|01091257349
76|6|서민균|01085871874
75|6|김용민|01075694706
78|6|껀빠미|01067268596
77|6|김성민|01040990769
76|6|성우현|01085630445
75|6|김정원|01098149130
78|6|나동형|01099113361
77|6|김아영|01062996835
76|6|신해|01030062506
75|6|김준태|01055709353
78|6|노연암|01052358348
77|6|김체량|01075980719
76|6|엄태현|01077376583
75|6|김지환|01066021538
78|6|박관호|01037552034
77|6|남우현|01094117235
76|6|오수창|01095926020
75|6|김태오|01057718372
78|6|박서현|01051029369
77|6|박동연|01027806523
76|6|윤성민|01087310469
75|6|김현수|01040834106
78|6|박재성|01095690339
77|6|박서준|01085232393
76|6|윤준식|01099456486
75|6|박도현|01091930475
78|6|박지한|01075121181
77|6|박소율|01029597511
76|6|이남규|01024717041
75|6|박윤준|01082628420
78|6|박진서|01075966595
77|6|박재우|01045629148
76|6|임정민|01023636729
75|6|박준우|01041373897
78|6|오승엽|01039159624
77|6|서준호|01073728607
76|6|임태경|01054989574
75|6|박준혁|01029371190
78|6|왕연정|01021664736
77|6|송석원|01044870963
76|6|장동건|01098238975
75|6|방장현|01053872237
78|6|이서연|01023621296
77|6|알렌|01021859777
76|6|전성재|01035533962
75|6|이승준|01029947908
78|6|이우진|01063899661
77|6|오민규|01059099926
76|6|정요한|01094559388
75|6|이아현|01034545848
78|6|이정윤|01032908670
77|6|유진우|01044267030
76|6|정재홍|01036527480
75|6|이주원|01073193266
78|6|이준혁|01099866497
77|6|윤성환|01052266846
76|6|정진혁|01031256441
75|6|임도훈|01039169639
78|6|이희원|01027865005
77|6|이성원|01034677726
76|6|정희윤|01023930215
75|6|정서윤|01029848842
78|6|주동연|01031047118
77|6|이시우|01092943612
76|6|조익찬|01038409650
75|6|정석호|01094858274
78|6|차윤우|01041251566
77|6|이연우|01098030059
76|6|최재원|01086336175
75|6|정진규|01041628393
78|6|한재경|01029937283
77|6|임다운|01065064651
76|7|김도현|01079181436
75|6|채희락|01038952452
78|7|곽승민|01082218613
77|6|장성현|01098823147
76|7|김병한|01039348209
75|6|탁인규|01038769852
78|7|군빌렉|01081780602
77|6|장지용|01085542778
76|7|김주하|01033823406
75|6|하동우|01053846445
78|7|김강현|01094855312
77|6|정재목|01076404905
76|7|김채현|01039364750
75|7|곽경환|01020790447
78|7|김동현|01076573185
77|6|최주호|01052701526
76|7|남서윤|01062745762
75|7|곽송주|01083361407
78|7|김민준|01064063131
77|6|최현준|01074843684
76|7|레하이|01058903915
75|7|김규민|01096863679
78|7|김성환|01054312865
77|6|호원희|01080812119
76|7|류건우|01031738811
75|7|김재민|01077092802
78|7|김이안|01059348834
77|7|강병준|01042022016
76|7|명기환|01045298113
75|7|김형주|01059192225
78|7|김진원|01094737445
77|7|김도현|01089021350
76|7|박신재|01076696548
75|7|박정현|01077105282
78|7|류노아|01047893027
77|7|김민석|01037829036
76|7|박은하|01025962969
75|7|서요한|01022253841
78|7|박규민|01027305976
77|7|김재용|01084326551
76|7|신재형|01090036853
75|7|유해승|01071010082
78|7|박세린|01028683640
77|7|김지호|01029430271
76|7|유승윤|01022356457
75|7|이도은|01059100118
78|7|박준영|01040278703
77|7|김하영|01089346642
76|7|윤준근|01068990958
75|7|이동현|01068663774
78|7|박태윤|01086973136
77|7|김호진|01097181499
76|7|이승훈|01028543508
75|7|이석민|01020181110
78|7|신민근|01040223946
77|7|남우찬|01040428250
76|7|이준희|01040264112
75|7|이승근|01049186935
78|7|옥선재|01037645088
77|7|박강산|01075605369
76|7|이찬형|01022559142
75|7|이시원|01032521574
78|7|우해민|01052921336
77|7|백준성|01076105068
76|7|이한세|01082778392
75|7|이재무|01040300656
78|7|이로운|01040522133
77|7|서강인|01055826275
76|7|정우혁|01091097223
75|7|이종화|01034268115
78|7|이수호|01084251160
77|7|손현성|01040051293
76|7|주보민|01099172511
75|7|장효진|01084061720
78|7|이우교|01090797939
77|7|안유성|01098199432
76|7|최휴리|01048503120
75|7|전종민|01058263048
78|7|이현승|01068013855
77|7|양요진|01065886045
76|7|하지영|01029237411
75|7|정다령|01030730760
78|7|장동환|01048428253
77|7|원재호|01093160246
76|7|허준호|01032773040
75|7|정석진|01064365718
78|7|장희철|01073306184
77|7|윤채우|01073534626
76|8|강요환|01032141549
75|7|조우진|01071333068
78|7|정승헌|01021781234
77|7|윤하은|01096434673
76|8|권혁빈|01063220707
75|7|천종환|01091721749
78|7|정인|01039744402
77|7|이건후|01077460950
76|8|김동하|01053683837
75|7|최지웅|01094222332
78|7|정찬|01064793693
77|7|이경민|01097303797
76|8|김민승|01048980300
75|8|김민주|01043692133
78|7|최시우|01082438559
77|7|이서진|01047989432
76|8|김수진|01030497040
75|8|김성환|01038151878
78|7|한재현|01068781174
77|7|이윤민|01057968596
76|8|김수환|01020056297
75|8|김시아|01087095733
78|7|한태희|01056930832
77|7|이재원|01076224714
76|8|김영준|01097627225
75|8|김재우|01073401064
78|7|홍명원|01022782944
77|7|장은강|01064718548
76|8|김재민|01057566718
75|8|김현욱|01025576864
78|8|강민재|01032823903
77|7|정수현|01035306776
76|8|김현중|01090697342
75|8|노현서|01065874163
78|8|강성우|01058038477
77|7|정정우|01059119081
76|8|김환수|01071238399
75|8|노호균|01056332670
78|8|김도현|01053421915
77|7|정현희|01053360837
76|8|디에고|01080726344
75|8|뚜언닷|01074610403
78|8|김동규|01076603497
77|7|황해빈|01033839658
76|8|박민혁|01045345022
75|8|문덕준|01028889686
78|8|김슬찬|01024375953
77|8|강민성|01027471479
76|8|박주환|01072884037
75|8|박건|01034786757
78|8|김한빛|01054691025
77|8|고은채|01064610824
76|8|백찬욱|01086075508
75|8|박성현|01098819449
78|8|김현진|01036327861
77|8|권준형|01066298830
76|8|유연우|01079135303
75|8|박수진|01085082821
78|8|나윤서|01072024641
77|8|권지혁|01028797724
76|8|이동욱|01028625315
75|8|박신우|01076443005
78|8|박건영|01095501251
77|8|김리하|01035254922
76|8|이영호|01059223236
75|8|박종현|01083883659
78|8|박규진|01027266474
77|8|김민준|01094601790
76|8|이우진|01049272071
75|8|배정우|01045759901
78|8|박재인|01040294185
77|8|김서우|01030851753
76|8|이찬우|01089993318
75|8|성기원|01045134481
78|8|부성환|01098309841
77|8|김영진|01083083115
76|8|이찬호|01059500135
75|8|손민수|01038191447
78|8|서명원|01064251570
77|8|김의현|01039243420
76|8|장민규|01082582129
75|8|신동혁|01085885897
78|8|서민정|01079633342
77|8|김재현|01084483050
76|8|정현재|01045895774
75|8|신승이|01033507569
78|8|양시혁|01083763650
77|8|김지승|01064062616
76|8|최영민|01050596615
75|8|여운|01098359872
78|8|윤세현|01063024042
77|8|김지태|01049050950
76|8|최지안|01084560367
75|8|오현석|01036103442
78|8|이승렬|01032856268
77|8|김진성|01039291923
76|8|한준원|01036879533
75|8|유다민|01041344047
78|8|이재윤|01054731284
77|8|김효준|01045993475
75|8|이장욱|01087714835
78|8|이준혁|01063983882
77|8|박동현|01087139389
75|8|이지민|01071305883
78|8|이지석|01035302383
77|8|박채원|01093780480
75|8|장동준|01093569535
78|8|정우영|01064944376
77|8|배준현|01021870455
75|8|전영준|01066493421
78|8|조건혁|01049353161
77|8|서근우|01027319265
75|8|조재현|01028981796
78|8|최효원|01033582397
77|8|서한윤|01032410479
75|8|최창훈|01064518088
78|8|카릴|01097555509
77|8|성준원|01041396553
78|8|황주원|01085841694
77|8|소리찬|01091731256
77|8|신우원|01039661526
77|8|오주현|01058337643
77|8|유하빈|01099095941
77|8|이규현|01032782940
77|8|이진호|01099462329
77|8|인서연|01051062838
77|8|임지섭|01092149586
77|8|전현서|01048198834`;

const onlyDigits = (s) => (s || "").replace(/[^0-9]/g, "");
const onlyHangul = (s) => (s || "").replace(/[^가-힣]/g, "");
const normPhone = (s) => {
  let x = onlyDigits(s);
  if (x.length === 10 && x.startsWith("10")) x = "0" + x;
  return x;
};
const CADET_SET = (() => {
  const set = new Set();
  CADET_ROSTER.split("\n").forEach((line) => {
    const [c, m, n, p] = line.split("|");
    if (!c) return;
    set.add([onlyDigits(c), onlyDigits(m), onlyHangul(n), normPhone(p)].join("|"));
  });
  return set;
})();
const matchCadet = ({ cohort, company, name, phone }) =>
  CADET_SET.has([onlyDigits(cohort), onlyDigits(company), onlyHangul(name), normPhone(phone)].join("|"));

/* 명단 파싱: 현황판 초기 채움용 (key는 로그인 key와 동일: cadet-<정규화전화>) */
const CADET_LIST = CADET_ROSTER.split("\n")
  .map((line) => {
    const [c, m, n, p] = line.split("|");
    if (!c) return null;
    const phone = normPhone(p);
    return { key: `cadet-${phone}`, cohort: onlyDigits(c), company: onlyDigits(m), name: onlyHangul(n), phone };
  })
  .filter(Boolean);

const OFFICER_ROSTER = ``;
const OFFICER_SET = (() => {
  const set = new Set();
  OFFICER_ROSTER.split("\n").forEach((line) => {
    const [g, pos, rank, n] = line.split("|");
    if (!g) return;
    set.add([onlyDigits(g), onlyHangul(n)].join("|"));
  });
  return set;
})();
const matchOfficer = ({ gunbun, name }) =>
  OFFICER_SET.size === 0 || OFFICER_SET.has([onlyDigits(gunbun), onlyHangul(name)].join("|"));

const statusOf = (id) => STATUS.find((s) => s.id === id) || STATUS[0];
/* 관리 권한: 훈육요원 */
const isManager = (identity) => !!identity && identity.role === "훈육요원";
const fmtTime = (ts) =>
  ts ? new Date(ts).toLocaleString("ko-KR", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "-";

function useInterval(callback, delay) {
  const ref = useRef(callback);
  useEffect(() => { ref.current = callback; }, [callback]);
  useEffect(() => {
    const id = setInterval(() => ref.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

/* 저장 실패 시 짧게 재시도 (일시적 오류/경합 대비) */
async function setWithRetry(key, value, shared, retries = 2) {
  let lastErr = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const result = await window.storage.set(key, value, shared);
      if (result) return result;
      lastErr = new Error("storage.set returned empty result");
    } catch (e) {
      lastErr = e;
    }
    if (i < retries) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
  }
  throw lastErr || new Error("storage.set failed");
}

async function getData() {
  try {
    const res = await window.storage.get(DATA_KEY, true);
    const parsed = res && res.value ? JSON.parse(res.value) : null;
    return parsed || { board: {}, log: [] };
  } catch (e) {
    return { board: {}, log: [] };
  }
}

export default function App() {
  const [identity, setIdentity] = useState(null);
  const [loadingIdentity, setLoadingIdentity] = useState(true);
  const [board, setBoard] = useState({});
  const [log, setLog] = useState([]);
  const [tab, setTab] = useState("board");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  /* ---- identity 로드 ---- */
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("identity", false);
        if (res && res.value) setIdentity(JSON.parse(res.value));
      } catch (e) {}
      setLoadingIdentity(false);
    })();
  }, []);

  /* ---- 데이터 로드 (현황판 + 로그, 한 번에). board가 비면 명단 전원을 정예관으로 채움 ---- */
  const loadData = useCallback(async () => {
    let data = await getData();
    if (Object.keys(data.board).length === 0 && CADET_LIST.length > 0) {
      const seeded = { board: {}, log: data.log || [] };
      const now = Date.now();
      CADET_LIST.forEach((c) => {
        seeded.board[c.key] = {
          name: c.name, cohort: c.cohort, company: c.company, phone: c.phone,
          status: DEFAULT_STATUS, updatedAt: now, updatedBy: "system",
        };
      });
      // 저장을 시도하되, 실패하더라도 화면에는 채워진 명단을 즉시 표시
      try { await setWithRetry(DATA_KEY, JSON.stringify(seeded), true); }
      catch (e) { console.error("명단 초기 채움 저장 실패(화면에는 표시):", e); }
      data = seeded;
    }
    setBoard(data.board);
    setLog(data.log);
  }, []);

  useEffect(() => {
    (async () => { await loadData(); setReady(true); })();
  }, [loadData]);

  useInterval(loadData, 4000);

  /* ---- 최초 등록 시 기본 상태(정예관) 심기 ---- */
  useEffect(() => {
    if (!identity || identity.role !== "생도" || !ready) return;
    if (!board[identity.key]) {
      (async () => {
        try {
          const data = await getData();
          if (!data.board[identity.key]) {
            data.board[identity.key] = {
              name: identity.name, cohort: identity.cohort, company: identity.company, phone: identity.phone || "",
              status: DEFAULT_STATUS, updatedAt: Date.now(), updatedBy: "system",
            };
            await setWithRetry(DATA_KEY, JSON.stringify(data), true);
            setBoard(data.board);
            setLog(data.log);
          }
        } catch (e) { console.error("초기 등록 실패:", e); }
      })();
    }
  }, [identity, ready, board]);

  const registerIdentity = async (fields) => {
    // 명단 대조: 일치하지 않으면 로그인 차단
    const ok = fields.role === "생도" ? matchCadet(fields) : matchOfficer(fields);
    if (!ok) return false;
    await window.storage.set("identity", JSON.stringify(fields), false);
    setIdentity(fields);
    return true;
  };

  const switchIdentity = async () => {
    try { await window.storage.delete("identity", false); } catch (e) {}
    setIdentity(null);
  };

  /* 신고 = 즉시 현황판 반영. 관리자(훈육요원·당직 생도)는 로그를 보고 확인만 한다. */
  const submitReport = async (newStatus, reason) => {
    if (!window.storage) { showToast("저장소를 사용할 수 없습니다. 잠시 후 다시 시도해주세요."); return; }
    try {
      const data = await getData();
      const previousStatus = (data.board[identity.key] && data.board[identity.key].status) || DEFAULT_STATUS;

      data.board[identity.key] = {
        name: identity.name, cohort: identity.cohort, company: identity.company, phone: identity.phone || "",
        status: newStatus, updatedAt: Date.now(), updatedBy: identity.name,
      };
      data.log.unshift({
        id: `${identity.key}-${Date.now()}`,
        key: identity.key, name: identity.name, cohort: identity.cohort, company: identity.company,
        fromStatus: previousStatus, toStatus: newStatus, reason: reason || "",
        timestamp: Date.now(), ackBy: null, ackAt: null,
      });
      data.log = data.log.slice(0, 300);

      await setWithRetry(DATA_KEY, JSON.stringify(data), true);
      setBoard(data.board);
      setLog(data.log);
      showToast(`'${statusOf(newStatus).label}'(으)로 명패이동보고를 완료했습니다.`);
    } catch (e) {
      console.error("submitReport failed:", e);
      showToast(`보고 처리에 실패했습니다. (${e && e.message ? e.message : "알 수 없는 오류"})`);
    }
  };

  /* 관리자가 '확인' 버튼을 누르면 로그에 확인자/시각만 기록 (현황판에는 영향 없음) */
  const acknowledge = async (entryId) => {
    try {
      const data = await getData();
      data.log = data.log.map((r) => (r.id === entryId ? { ...r, ackBy: identity.name, ackAt: Date.now() } : r));
      await setWithRetry(DATA_KEY, JSON.stringify(data), true);
      setLog(data.log);
    } catch (e) {
      console.error("acknowledge failed:", e);
      showToast("확인 처리에 실패했습니다.");
    }
  };

  /* 관리자 전용: 전체 현황판 + 보고 이력을 처음 상태로 초기화 (되돌릴 수 없음) */
  const resetAll = async () => {
    try {
      const empty = { board: {}, log: [] };
      await setWithRetry(DATA_KEY, JSON.stringify(empty), true);
      setBoard({});
      setLog([]);
      setConfirmingReset(false);
      showToast("전체 현황판과 보고 이력이 초기화되었습니다.");
    } catch (e) {
      console.error("resetAll failed:", e);
      showToast(`초기화에 실패했습니다. (${e && e.message ? e.message : "알 수 없는 오류"})`);
    }
  };

  if (loadingIdentity) return <Shell><CenterNote text="불러오는 중..." /></Shell>;
  if (!identity) return <Shell><Onboarding onSubmit={registerIdentity} /></Shell>;

  const myStatus = (board[identity.key] && board[identity.key].status) || DEFAULT_STATUS;
  const myLastReport = log.find((r) => r.key === identity.key);
  const unackedCount = log.filter((r) => !r.ackBy).length;

  return (
    <Shell>
      <Header identity={identity} onSwitch={switchIdentity} unackedCount={unackedCount} />
      <Tabs tab={tab} setTab={setTab} identity={identity} unackedCount={unackedCount} />
      <div style={{ padding: "18px 20px 40px" }}>
        {!ready && <CenterNote text="현황판 불러오는 중..." />}
        {ready && tab === "board" && <BoardView board={board} />}
        {ready && tab === "mine" && identity.role === "생도" && (
          <MyReport myStatus={myStatus} myLastReport={myLastReport} onSubmit={submitReport} />
        )}
        {ready && tab === "log" && isManager(identity) && (
          <LogView
            log={log}
            onAck={acknowledge}
            confirmingReset={confirmingReset}
            onRequestReset={() => setConfirmingReset(true)}
            onCancelReset={() => setConfirmingReset(false)}
            onConfirmReset={resetAll}
          />
        )}
      </div>
      {toast && <Toast text={toast} />}
    </Shell>
  );
}

/* ---------------- Shell / layout pieces ---------------- */

function Shell({ children }) {
  return (
    <div
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: "#0B121C",
        color: "#E7EEF5",
        minHeight: "560px",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid #223244",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        .kaf-display { font-family: 'Rajdhani', sans-serif; letter-spacing: 0.02em; }
        .kaf-mono { font-family: 'JetBrains Mono', monospace; }
        button { font-family: inherit; cursor: pointer; }
        input, select { font-family: inherit; }
        ::selection { background: #5EEAD440; }
      `}</style>
      {children}
    </div>
  );
}

function CenterNote({ text }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 400, color: "#7C8FA3" }}>
      {text}
    </div>
  );
}

function Toast({ text }) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#141E2B",
        border: "1px solid #223244",
        color: "#E7EEF5",
        padding: "10px 18px",
        borderRadius: 10,
        fontSize: 13,
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        zIndex: 50,
        maxWidth: "80%",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

const inputStyle = {
  width: "100%", boxSizing: "border-box", background: "#0B121C", border: "1px solid #223244",
  borderRadius: 8, padding: "10px 12px", color: "#E7EEF5", fontSize: 14, marginBottom: 12, outline: "none",
};
const labelStyle = { fontSize: 12, color: "#7C8FA3", display: "block", marginBottom: 6 };

function Onboarding({ onSubmit }) {
  const [role, setRole] = useState("생도");
  const [name, setName] = useState("");
  const [cohort, setCohort] = useState("");     // 기수
  const [company, setCompany] = useState("");   // 중대
  const [phone, setPhone] = useState("");       // 전화번호 (생도 식별자)
  const [position, setPosition] = useState("");   // 직책 (훈육요원)
  const [gunbun, setGunbun] = useState("");       // 군번 (훈육요원)
  const [rank, setRank] = useState("");           // 계급 (훈육요원)
  const [error, setError] = useState("");         // 명단 불일치 메시지

  const isCadet = role === "생도";
  const valid = isCadet
    ? cohort.trim() && company.trim() && name.trim() && phone.trim()
    : gunbun.trim() && position.trim() && rank.trim() && name.trim();

  const handleSubmit = async () => {
    if (!valid) return;
    setError("");
    const fields = isCadet
      ? {
          role: "생도", name: name.trim(), cohort: cohort.trim(), company: company.trim(),
          phone: phone.trim(), key: `cadet-${normPhone(phone)}`,
        }
      : {
          role: "훈육요원", name: name.trim(), gunbun: gunbun.trim(), rank: rank.trim(),
          position: position.trim(), key: `officer-${onlyDigits(gunbun)}`,
        };
    const ok = await onSubmit(fields);
    if (!ok) setError("정보가 일치하지 않습니다!");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 560, padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, color: "#5EEAD4" }}>
        <Plane size={22} />
        <span className="kaf-display" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.12em", color: "#7C8FA3" }}>
          ROKAFA · REPORTING SYSTEM
        </span>
      </div>
      <h1 className="kaf-display" style={{ fontSize: 28, fontWeight: 700, margin: "6px 0 22px" }}>
        명패이동보고 시스템
      </h1>

      <div style={{ width: 340, background: "#141E2B", border: "1px solid #223244", borderRadius: 12, padding: 22 }}>
        <label style={labelStyle}>역할</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {["생도", "훈육요원"].map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setError(""); }}
              style={{
                flex: 1, padding: "9px 0", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: role === r ? "1px solid #5EEAD4" : "1px solid #223244",
                background: role === r ? "#5EEAD41A" : "transparent",
                color: role === r ? "#5EEAD4" : "#7C8FA3",
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {isCadet ? (
          <>
            <label style={labelStyle}>기수</label>
            <input value={cohort} onChange={(e) => setCohort(e.target.value)} placeholder="예: 78" style={inputStyle} />
            <label style={labelStyle}>중대</label>
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="예: 1" style={inputStyle} />
            <label style={labelStyle}>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 김공사" style={inputStyle} />
            <label style={labelStyle}>전화번호</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="예: 01012345678" style={{ ...inputStyle, marginBottom: 20 }} />
          </>
        ) : (
          <>
            <label style={labelStyle}>군번</label>
            <input value={gunbun} onChange={(e) => setGunbun(e.target.value)} placeholder="예: 7자리" style={inputStyle} />
            <label style={labelStyle}>직책</label>
            <input value={position} onChange={(e) => setPosition(e.target.value)} placeholder="예: 1중대장" style={inputStyle} />
            <label style={labelStyle}>계급</label>
            <input value={rank} onChange={(e) => setRank(e.target.value)} placeholder="예: 대위" style={inputStyle} />
            <label style={labelStyle}>이름</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 김공사" style={{ ...inputStyle, marginBottom: 20 }} />
          </>
        )}

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 12, padding: "9px 12px",
            borderRadius: 8, background: "#E2574C1A", border: "1px solid #E2574C55", color: "#E2574C",
            fontSize: 12.5, fontWeight: 600,
          }}>
            {error}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={!valid}
          style={{
            width: "100%", padding: "11px 0", borderRadius: 8, border: "none",
            background: valid ? "#2F6FA5" : "#22324480",
            color: "#fff", fontWeight: 600, fontSize: 14,
          }}
        >
          시작하기
        </button>
      </div>
      <p style={{ fontSize: 11, color: "#7C8FA3", marginTop: 14, textAlign: "center", maxWidth: 320 }}>
        입력한 정보는 이 기기에만 저장됩니다. 명단에 등록된 인원만 로그인할 수 있으며,
        생도의 신고는 별도 승인 없이 즉시 현황판에 반영됩니다.
      </p>
    </div>
  );
}

function LiveClock() {
  const [now, setNow] = useState(Date.now());
  useInterval(() => setNow(Date.now()), 1000);
  const d = new Date(now);
  const text = d.toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit", weekday: "short",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
  return (
    <div className="kaf-mono" style={{ fontSize: 11.5, color: "#5EEAD4", letterSpacing: "0.02em" }}>
      {text}
    </div>
  );
}

function Header({ identity, onSwitch, unackedCount }) {
  const isCadet = identity.role === "생도";
  const manager = isManager(identity);
  const mainLine = isCadet
    ? `${identity.cohort}.${identity.company}.${identity.name}`
    : `${identity.rank} ${identity.name}`;
  const subLine = isCadet
    ? "생도"
    : `${identity.position} · ${identity.gunbun}`;
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid #223244",
        background: "linear-gradient(180deg, #101a26 0%, #0B121C 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: "#2F6FA51A", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #2F6FA555" }}>
          <Plane size={17} color="#5EEAD4" />
        </div>
        <div>
          <div className="kaf-display" style={{ fontWeight: 700, fontSize: 17, lineHeight: 1 }}>명패이동보고</div>
          <div style={{ fontSize: 10.5, color: "#7C8FA3", marginTop: 3, letterSpacing: "0.06em" }}>공군사관학교 · REAL-TIME BOARD</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <LiveClock />
        {manager && unackedCount > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#E8A33D1A", color: "#E8A33D", padding: "5px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
            <Eye size={13} /> 미확인 {unackedCount}
          </div>
        )}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }} className={isCadet ? "kaf-mono" : ""}>{mainLine}</div>
          <div style={{ fontSize: 10, color: manager ? "#8B7CD9" : "#7C8FA3" }}>{subLine}</div>
        </div>
        <button
          onClick={onSwitch}
          title="계정 전환"
          style={{ background: "transparent", border: "1px solid #223244", borderRadius: 8, padding: 8, color: "#7C8FA3", display: "flex" }}
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}

function Tabs({ tab, setTab, identity, unackedCount }) {
  const items = [{ id: "board", label: "전체 현황판", icon: Users }];
  if (identity.role === "생도") items.push({ id: "mine", label: "본인 보고 상태", icon: Radio });
  if (isManager(identity)) items.push({ id: "log", label: `보고 확인 (${unackedCount})`, icon: ShieldCheck });

  return (
    <div style={{ display: "flex", gap: 6, padding: "12px 20px 0" }}>
      {items.map((it) => {
        const Icon = it.icon;
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => setTab(it.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: "8px 8px 0 0",
              border: "1px solid #223244", borderBottom: active ? "1px solid #0B121C" : "1px solid #223244",
              background: active ? "#141E2B" : "transparent",
              color: active ? "#E7EEF5" : "#7C8FA3", fontSize: 13, fontWeight: 600, marginBottom: -1, zIndex: active ? 2 : 1,
            }}
          >
            <Icon size={13} /> {it.label}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- Board ---------------- */

function BoardView({ board }) {
  const CARD_LIMIT = 120; // 상태별 명패 렌더 상한(성능). 초과분은 전체보기로 조회
  const [cohortF, setCohortF] = useState("전체");
  const [companyF, setCompanyF] = useState("전체");
  const [sortBy, setSortBy] = useState("time"); // time | name
  const [focused, setFocused] = useState(null); // 클릭한 상태 id (전체화면), null이면 그리드

  const allEntries = Object.entries(board);
  const totalAll = allEntries.length;

  // 필터 옵션 (board에 실제 존재하는 값 기준, 숫자 오름차순)
  const cohorts = Array.from(new Set(allEntries.map(([, v]) => v.cohort).filter(Boolean)))
    .sort((a, b) => Number(b) - Number(a)); // 기수는 높은 기수부터
  const companies = Array.from(new Set(allEntries.map(([, v]) => v.company).filter(Boolean)))
    .sort((a, b) => Number(a) - Number(b));

  if (totalAll === 0) {
    return <CenterNote text="현황판을 불러오는 중입니다. 잠시만 기다려 주세요." />;
  }

  const entries = allEntries.filter(([, v]) =>
    (cohortF === "전체" || v.cohort === cohortF) &&
    (companyF === "전체" || v.company === companyF)
  );

  const sortMembers = (arr) =>
    [...arr].sort((a, b) =>
      sortBy === "name"
        ? (a[1].name || "").localeCompare(b[1].name || "", "ko")
        : b[1].updatedAt - a[1].updatedAt
    );

  const chip = (active) => ({
    padding: "5px 11px", borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: "pointer",
    border: active ? "1px solid #5EEAD4" : "1px solid #223244",
    background: active ? "#5EEAD41A" : "transparent",
    color: active ? "#5EEAD4" : "#7C8FA3",
  });

  const renderCard = (key, v, s) => {
    const cell = { fontSize: 10.5, lineHeight: 1.2, padding: "3px 4px", textAlign: "center", borderBottom: "1px solid #22324488" };
    return (
      <div
        key={key}
        title={`${v.cohort}기 ${v.company}중대 ${v.name}${v.phone ? " · " + v.phone : ""} · ${fmtTime(v.updatedAt)}`}
        style={{
          width: 74, background: "#0B121C", border: `1px solid ${s.color}55`,
          borderTop: `3px solid ${s.color}`, borderRadius: 4, overflow: "hidden", color: "#E7EEF5",
        }}
      >
        <div className="kaf-mono" style={{ ...cell, color: "#7C8FA3" }}>{v.cohort}</div>
        <div className="kaf-mono" style={{ ...cell, color: "#7C8FA3" }}>{v.company}</div>
        <div style={{ ...cell, fontWeight: 600 }}>{v.name}</div>
        <div className="kaf-mono" style={{ ...cell, color: "#7C8FA3", borderBottom: "none", fontSize: 9 }}>{v.phone || "-"}</div>
      </div>
    );
  };

  const filterBar = (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#7C8FA3", minWidth: 30 }}>기수</span>
        <button onClick={() => setCohortF("전체")} style={chip(cohortF === "전체")}>전체</button>
        {cohorts.map((o) => (
          <button key={o} onClick={() => setCohortF(o)} style={chip(cohortF === o)}>{o}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#7C8FA3", minWidth: 30 }}>중대</span>
        <button onClick={() => setCompanyF("전체")} style={chip(companyF === "전체")}>전체</button>
        {companies.map((o) => (
          <button key={o} onClick={() => setCompanyF(o)} style={chip(companyF === o)}>{o}</button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 11, color: "#7C8FA3", minWidth: 30 }}>정렬</span>
        <button onClick={() => setSortBy("time")} style={chip(sortBy === "time")}>시간순</button>
        <button onClick={() => setSortBy("name")} style={chip(sortBy === "name")}>이름순</button>
      </div>
    </div>
  );

  /* ---- 전체화면: 특정 상태만 크게 (상한 없이 전원 표시) ---- */
  if (focused) {
    const s = statusOf(focused);
    const members = sortMembers(entries.filter(([, v]) => v.status === s.id));
    return (
      <div>
        <button
          onClick={() => setFocused(null)}
          style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 14, padding: "8px 14px", borderRadius: 8,
            border: "1px solid #223244", background: "transparent", color: "#7C8FA3", fontSize: 13, fontWeight: 600,
          }}
        >
          ← 전체 현황판으로
        </button>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: s.bg, border: `1px solid ${s.color}55`, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 11, height: 11, borderRadius: 4, background: s.color }} />
            <span className="kaf-display" style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.label}</span>
          </div>
          <span className="kaf-mono" style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{members.length}명</span>
        </div>
        {filterBar}
        <div style={{ fontSize: 11, color: "#7C8FA3", marginBottom: 12 }}>표시 {members.length}명</div>
        {members.length === 0 ? (
          <span style={{ fontSize: 12, color: "#7C8FA355" }}>해당 인원이 없습니다.</span>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {members.map(([key, v]) => renderCard(key, v, s))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {filterBar}
      <div style={{ fontSize: 11, color: "#7C8FA3", marginBottom: 14, display: "flex", justifyContent: "space-between" }}>
        <span>표시 {entries.length}명 · 전체 {totalAll}명</span>
        <span className="kaf-mono">실시간 갱신 · 4s</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
        {STATUS.map((s) => {
          const members = sortMembers(entries.filter(([, v]) => v.status === s.id));
          return (
            <div key={s.id} style={{ background: "#141E2B", border: "1px solid #223244", borderRadius: 10, overflow: "hidden" }}>
              <div
                onClick={() => setFocused(s.id)}
                title="클릭하면 이 항목만 전체화면으로 봅니다"
                style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid #223244", background: s.bg }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: s.color }}>{s.label}</span>
                </div>
                <span className="kaf-mono" style={{ fontSize: 11, color: s.color }}>{members.length}</span>
              </div>
              <div style={{ padding: 8, minHeight: 46, display: "flex", flexWrap: "wrap", gap: 6 }}>
                {members.length === 0 && <span style={{ fontSize: 11, color: "#7C8FA355", padding: "6px 4px" }}>없음</span>}
                {members.slice(0, CARD_LIMIT).map(([key, v]) => renderCard(key, v, s))}
                {members.length > CARD_LIMIT && (
                  <button
                    onClick={() => setFocused(s.id)}
                    style={{ width: "100%", textAlign: "left", background: "transparent", border: "none", fontSize: 11, color: "#5EEAD4", padding: "6px 4px", fontWeight: 600 }}
                  >
                    +{members.length - CARD_LIMIT}명 더 · 클릭해 전체 보기
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- 생도: 나의 신고 (즉시 반영) ---------------- */

function MyReport({ myStatus, myLastReport, onSubmit }) {
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState("");
  const cur = statusOf(myStatus);

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background: "#141E2B", border: "1px solid #223244", borderRadius: 10, padding: 16, marginBottom: 18 }}>
        <div style={{ fontSize: 11, color: "#7C8FA3", marginBottom: 8 }}>현재 상태</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: 4, background: cur.color }} />
          <span className="kaf-display" style={{ fontSize: 20, fontWeight: 700 }}>{cur.label}</span>
        </div>
        {myLastReport && (
          <div style={{ fontSize: 11, color: "#7C8FA3", marginTop: 10 }} className="kaf-mono">
            최근 보고: {fmtTime(myLastReport.timestamp)}
            {myLastReport.ackBy ? ` · ${myLastReport.ackBy} 확인함` : " · 확인 대기"}
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: "#7C8FA3", marginBottom: 10 }}>
        이동할 상태를 선택하면 즉시 현황판에 반영됩니다
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px,1fr))", gap: 8, marginBottom: 14 }}>
        {STATUS.filter((s) => s.id !== myStatus).map((s) => (
          <button
            key={s.id}
            onClick={() => setSelected(s.id)}
            style={{
              display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8,
              border: selected === s.id ? `1px solid ${s.color}` : "1px solid #223244",
              background: selected === s.id ? s.bg : "#141E2B", color: "#E7EEF5", fontSize: 13, fontWeight: 500,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 3, background: s.color }} />
            {s.label}
          </button>
        ))}
      </div>
      {selected && (
        <>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="사유 (선택)"
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <button
            onClick={() => { onSubmit(selected, reason); setSelected(null); setReason(""); }}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8,
              border: "none", background: "#2F6FA5", color: "#fff", fontSize: 13, fontWeight: 600,
            }}
          >
            <Radio size={14} /> '{statusOf(selected).label}'로 명패이동보고 <ChevronRight size={14} />
          </button>
        </>
      )}
    </div>
  );
}

/* ---------------- 관리자: 보고 확인 (읽기 전용 + 확인 표시) ---------------- */

function LogView({ log, onAck, confirmingReset, onRequestReset, onCancelReset, onConfirmReset }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 620 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
        {!confirmingReset ? (
          <button
            onClick={onRequestReset}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7,
              border: "1px solid #E2574C55", background: "transparent", color: "#E2574C", fontSize: 12, fontWeight: 600,
            }}
          >
            <RotateCcw size={13} /> 전체 초기화
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#E2574C0F", border: "1px solid #E2574C55", borderRadius: 8, padding: "8px 10px" }}>
            <span style={{ fontSize: 12, color: "#E2574C" }}>모든 생도의 현황판과 보고 이력이 삭제됩니다. 되돌릴 수 없습니다.</span>
            <button
              onClick={onConfirmReset}
              style={{ padding: "6px 10px", borderRadius: 6, border: "none", background: "#E2574C", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0 }}
            >
              초기화 확정
            </button>
            <button
              onClick={onCancelReset}
              style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #223244", background: "transparent", color: "#7C8FA3", fontSize: 12, flexShrink: 0 }}
            >
              취소
            </button>
          </div>
        )}
      </div>
      {log.length === 0 && <CenterNote text="접수된 보고가 없습니다." />}
      {log.map((r) => {
        const from = statusOf(r.fromStatus);
        const to = statusOf(r.toStatus);
        return (
          <div
            key={r.id}
            style={{
              background: "#141E2B", border: `1px solid ${r.ackBy ? "#223244" : "#E8A33D55"}`,
              borderRadius: 10, padding: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontSize: 10.5, color: "#7C8FA3" }}>{r.cohort} · {r.company}</span>
                <span style={{ fontSize: 12, color: from.color }}>{from.label}</span>
                <ChevronRight size={12} color="#7C8FA3" />
                <span style={{ fontSize: 12, color: to.color, fontWeight: 600 }}>{to.label}</span>
              </div>
              <div style={{ fontSize: 10.5, color: "#7C8FA3" }} className="kaf-mono">
                {fmtTime(r.timestamp)}{r.reason ? ` · 사유: ${r.reason}` : ""}
              </div>
            </div>
            {r.ackBy ? (
              <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#4CAF7D", fontSize: 11.5, flexShrink: 0 }}>
                <CheckCircle2 size={14} /> {r.ackBy} 확인
              </div>
            ) : (
              <button
                onClick={() => onAck(r.id)}
                style={{
                  flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7,
                  border: "1px solid #5EEAD4", background: "#5EEAD41A", color: "#5EEAD4", fontSize: 12, fontWeight: 600,
                }}
              >
                <Eye size={13} /> 확인
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
