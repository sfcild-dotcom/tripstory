const express = require("express");
const cors = require("cors");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();
const PORT = process.env.PORT || 8000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// ─── Anthropic Client ─────────────────────────────────────────────────────────
// API 키는 환경변수로 설정: ANTHROPIC_API_KEY=sk-ant-...
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── 키워드 타입 분류 ─────────────────────────────────────────────────────────
// flight: 항공 관련 (비즈니스클래스, 항공, 비행 등)
// hotel : 숙소 브랜드명 또는 숙소 일반명
// general: 기타
function classifyKeyword(keyword) {
  if (!keyword) return "general";
  const k = keyword.toLowerCase();
  if (
    k.includes("비즈니스클래스") || k.includes("퍼스트클래스") ||
    k.includes("항공") || k.includes("비행") || k.includes("flight") ||
    k.includes("클래스") || k.includes("라운지")
  ) return "flight";
  if (
    k.includes("호텔") || k.includes("숙소") || k.includes("리조트") ||
    ["노보텔","롯데","힐튼","메리어트","하얏트","쉐라톤","인터컨티넨탈","풀만","소피텔"]
      .some(b => k.includes(b))
  ) return "hotel";
  return "general";
}

// ─── 키워드가 실제로 의미하는 콘텐츠 맥락 설명 생성 ─────────────────────────
// GPT 분석 반영: 키워드 의미와 콘텐츠 주제가 불일치할 때 맥락 오류 방지
function buildKeywordContext(keyword, companyName, keywordType) {
  if (keywordType === "flight") {
    return `
[키워드 맥락 가이드 - 매우 중요]
메인 키워드 "${keyword}"는 항공 비즈니스 클래스 좌석 등급을 의미합니다.
이 키워드는 반드시 아래 맥락에서만 사용하세요:

✅ 올바른 사용 (반드시 공항·기내·비행 장면에서만):
- "인천공항에서 ${keyword}로 체크인하니 라운지 이용권이 주어졌어요."
- "${keyword} 좌석에 앉자 넓은 공간과 리클라이닝이 인상적이었죠."
- "${keyword} 덕분에 장거리 비행의 피로를 최소화할 수 있었어요."

❌ 절대 금지 — 호텔·루프탑·조식·라운지에 이 키워드를 붙이는 것 완전 금지:
- "${keyword}의 루프탑 바" → 루프탑은 호텔 시설, 키워드 사용 금지
- "${keyword}의 다이닝홀" → 조식은 호텔 시설, 키워드 사용 금지
- "${keyword} 덕분에 호텔 서비스가 좋았다" → 인과 오류, 금지
- "${keyword} 못지않은 프리미엄" → 비교 형태도 금지
- "라운지에서도 ${keyword} 수준" → 금지

글의 서사 구조 (반드시 준수):
- 1~4번 문단: 공항 라운지 → 기내 탑승 → 기내 서비스 → 기내식 (${keyword} 키워드 이 구간에서만)
- 5번 문단: 호치민 도착 + ${companyName} 이동 (키워드 1회 사용 가능: "비행을 마치고")
- 6번 문단 이후: 호텔 체험 중심, 키워드 완전 퇴장
- 키워드가 남은 경우 8번 또는 11번 문단에서 "그때 ${keyword}의 여운이~" 형태로만 1회 허용`;
  }
  if (keywordType === "hotel") {
    return `
[키워드 맥락 가이드]
메인 키워드 "${keyword}"는 호텔/숙소를 의미합니다.
글 전체에서 ${companyName} 숙박 경험과 연결하여 자연스럽게 사용하세요.`;
  }
  return `
[키워드 맥락 가이드]
메인 키워드 "${keyword}"를 글의 주제인 ${companyName} 체험과 자연스럽게 연결하세요.
키워드를 억지로 삽입하지 말고, 문장 흐름 속에서 의미가 통하는 위치에만 사용하세요.`;
}

// ─── 제목 생성 ─────────────────────────────────────────────────────────────────
// 규칙: 업체명 + 키워드 + 긍정 훅 문장 (느낌표 금지, 원숫자 없음)
// 키워드 앞에 ① 원숫자를 붙여서 제목에도 노출
function generateTitle(keyword, companyName, keywordType) {
  const templates = {
    flight: [
      `${companyName} ①${keyword}, 호치민 출장에서 찾은 완벽한 쉼`,
      `${companyName} ①${keyword}와 함께한 호치민 비즈니스 여정`,
      `${companyName} ①${keyword} 타고 떠난 호치민 출장의 모든 것`,
      `${companyName} ①${keyword}로 시작된 호치민 출장 특별한 기억`,
    ],
    hotel: [
      `${companyName} ①${keyword}, 호치민 출장 베이스캠프로 완벽한 선택`,
      `${companyName} ①${keyword}로 완성한 호치민 비즈니스 여행`,
      `${companyName} ①${keyword}, 호치민 출장을 특별하게 만든 선택`,
    ],
    general: [
      `${companyName} ①${keyword}, 호치민 출장 후기의 모든 것`,
      `${companyName} ①${keyword}로 완성된 호치민 비즈니스 여행`,
      `${companyName} ①${keyword}, 호치민 출장의 특별한 기억`,
    ],
  };
  const list = templates[keywordType] || templates.general;
  return list[Math.floor(Math.random() * list.length)];
}

// ─── 이미지 블록 생성 헬퍼 ───────────────────────────────────────────────────
function buildImageContents(images) {
  return images.slice(0, 14).map((imgData) => {
    const match = imgData.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    return { type: "image", source: { type: "base64", media_type: match[1], data: match[2] } };
  }).filter(Boolean);
}



async function generateArticleWithClaude(keyword, companyName, keywordType, images, tone, onChunk = null) {

  const toneGuide = {
    casual:       "발랄 70% + 전문성 30%. 친구에게 출장 이야기를 들려주듯 생생하고 밝게.",
    professional: "신뢰감 있고 격식 있게. 비즈니스 출장객 관점의 실용 정보 강조.",
    humorous:     "발랄하되 가벼운 상황 유머 2~3회만. 억지 농담·과장 금지.",
  };
  const toneDesc = toneGuide[tone] || toneGuide.casual;
  const imageContents = buildImageContents(images);
  const totalPhotos = imageContents.length; // 실제 업로드된 사진 수

  // ── 사진을 16문단에 자동 분배 ─────────────────────────────────────────────
  // 사진 없는 고정 문단: 1(서론), 16(결론)
  // 나머지 14문단에 사진을 순서대로 1장씩 배정
  // 사진이 14장 미만이면 뒷문단부터 null로 채움
  const photoSlots = [null, ...Array.from({length: 14}, (_, i) => i < totalPhotos ? i : null), null];
  // photoSlots[paraNum - 1] = 해당 문단에 쓸 imageContents 인덱스 (0-based), null이면 사진 없음

  // ── 키워드 배치 계획 (타입별) ─────────────────────────────────────────────
  const keywordPlanFlight = {
    1:  { circle: "②", rule: `탑승 전 설렘 문맥. 예: "이번에 ②${keyword}를 선택하기로 했어요."` },
    3:  { circle: "③", rule: `기내 좌석 직접 서술. 예: "③${keyword} 좌석에 앉으니 넓은 공간이 인상적이었어요."` },
    5:  { circle: "④", rule: `비행 마친 후 문맥. 예: "④${keyword} 덕분에 피로 없이 도착할 수 있었어요."` },
    9:  { circle: "⑤", rule: `반드시 회상 형태로만. 예: "칵테일을 홀짝이다 ⑤${keyword}에서 마시던 샴페인이 문득 떠올랐어요."` },
    16: { circle: "⑥", rule: `여정 회고 문맥. 예: "⑥${keyword}로 시작된 이번 출장이 오래 기억에 남을 것 같아요."` },
  };
  const keywordPlanHotel = {
    1:  { circle: "②", rule: `숙소 선택 이유 문맥. 예: "이번 출장엔 ②${keyword}를 선택했어요."` },
    6:  { circle: "③", rule: `호텔 로비·체크인 직접 서술. 예: "③${keyword} 로비에 들어서니 세련된 분위기가 느껴졌어요."` },
    10: { circle: "④", rule: `루프탑·편의시설 문맥. 예: "④${keyword} 루프탑에서 바라본 야경이 정말 멋졌죠."` },
    13: { circle: "⑤", rule: `라운지·조식 문맥. 예: "⑤${keyword} 프리미어 라운지는 기대 이상이었어요."` },
    16: { circle: "⑥", rule: `여정 회고. 예: "⑥${keyword}에서의 하루하루가 정말 특별했어요."` },
  };
  const keywordPlanGeneral = {
    1:  { circle: "②", rule: `서론 자연스러운 문맥. 예: "이번 출장의 핵심 키워드는 ②${keyword}였어요."` },
    4:  { circle: "③", rule: `본문 중반 첫 번째 등장.` },
    9:  { circle: "④", rule: `본문 중반 두 번째 등장.` },
    13: { circle: "⑤", rule: `본문 후반 등장.` },
    16: { circle: "⑥", rule: `결론 회고 문맥.` },
  };
  const keywordPlan = keywordType === "flight" ? keywordPlanFlight
                    : keywordType === "hotel"  ? keywordPlanHotel
                    : keywordPlanGeneral;

  // ── 문단 장면 정의 (타입별) ───────────────────────────────────────────────
  const sceneFlight = [
    "서론 — 출장 출발 설렘, 키워드(비즈니스클래스) 선택 이유. 반드시 ②키워드 포함. 230자 이상 필수.",
    "공항 비즈니스 라운지 — 탑승 전 대기",
    "기내 좌석·서비스 — 탑승 직후 감동. ③키워드 포함 필수.",
    "기내식·기내 음료",
    "호치민 도착·호텔 외관 첫인상. ④키워드 포함 필수.",
    "호텔 로비·체크인",
    "객실 내부",
    "욕실",
    "루프탑 바 공간·분위기. ⑤키워드는 반드시 회상 형태로만.",
    "루프탑 야경·칵테일",
    "조식 음료·티코너",
    "조식 다이닝홀 전경",
    "프리미어 라운지 음식·푸드바",
    "프리미어 라운지 공간",
    "프리미어 라운지 입구·전경",
    "결론 — 전체 여정 회고, 재방문 의사. ⑥키워드 포함 필수. 230자 이상 필수.",
  ];
  const sceneHotel = [
    "서론 — 출장 출발 설렘, 숙소(키워드) 선택 이유. 반드시 ②키워드 포함. 230자 이상 필수.",
    "공항 출발 전 — 탑승 대기 분위기",
    "기내·이동 중 — 비행 경험",
    "기내식·기내 음료",
    "호치민 도착·호텔 외관 첫인상",
    "호텔 로비·체크인. ③키워드 포함 필수.",
    "객실 내부",
    "욕실",
    "루프탑 바 공간·분위기",
    "루프탑 야경·칵테일. ④키워드 포함 필수.",
    "조식 음료·티코너",
    "조식 다이닝홀 전경",
    "프리미어 라운지 음식·푸드바. ⑤키워드 포함 필수.",
    "프리미어 라운지 공간",
    "프리미어 라운지 입구·전경",
    "결론 — 전체 여정 회고, 재방문 의사. ⑥키워드 포함 필수. 230자 이상 필수.",
  ];
  const sceneGeneral = [
    "서론 — 출장 출발 설렘, 키워드 관련 기대감. 반드시 ②키워드 포함. 230자 이상 필수.",
    "공항 출발 전 — 탑승 대기 분위기",
    "기내·이동 중 — 비행 경험",
    "기내식·기내 음료. ③키워드 포함 필수.",
    "호치민 도착·호텔 외관 첫인상",
    "호텔 로비·체크인",
    "객실 내부",
    "욕실",
    "루프탑 바 공간·분위기. ④키워드 포함 필수.",
    "루프탑 야경·칵테일",
    "조식 음료·티코너",
    "조식 다이닝홀 전경",
    "프리미어 라운지 음식·푸드바. ⑤키워드 포함 필수.",
    "프리미어 라운지 공간",
    "프리미어 라운지 입구·전경",
    "결론 — 전체 여정 회고, 재방문 의사. ⑥키워드 포함 필수. 230자 이상 필수.",
  ];
  const sceneList = keywordType === "flight" ? sceneFlight
                  : keywordType === "hotel"  ? sceneHotel
                  : sceneGeneral;

  const paragraphDefs = sceneList.map((scene, i) => ({
    num: i + 1,
    scene,
    chars: (i === 0 || i === 15) ? "5문장 230자 이상" : "4문장 130자 이상",
  }));

  // ── system 프롬프트 ────────────────────────────────────────────────────────
  const systemPrompt = `당신은 호치민 출장 후기 전문 작성 AI입니다. 지금 16문단 중 1개 문단만 작성합니다.

규칙:
- 어미: ~요/~죠 70%, ~습니다 20%, 기타 10%
- 같은 어미 2회 연속 금지
- 금지 어미: ~했다 / ~이다 / ~하였다
- 마크다운(# ** *) 절대 금지
- 느낌표(!) 금지
- 부정적 내용 금지
- "사진에서~" "이 사진은~" 직접 언급 금지
- 문단 번호로 시작하지 말 것 — 본문만 출력
- 톤: ${toneDesc}`;

  // ── 문단별 순차 생성 ──────────────────────────────────────────────────────
  const paragraphs = [];
  const photoAnalysisRows = []; // 분석표용

  for (const def of paragraphDefs) {
    const imgIndex = photoSlots[def.num - 1]; // 0-based 인덱스 or null
    const imgBlock = (imgIndex !== null) ? imageContents[imgIndex] : null;
    const kw = keywordPlan[def.num];

    // 키워드 지시
    const kwInstruction = kw
      ? `【키워드 필수】이 문단에 반드시 ${kw.circle}${keyword} 포함.
규칙: ${kw.rule}`
      : `【키워드 금지】이 문단에 키워드(${keyword}) 사용 금지.`;

    let userPrompt = "";

    if (imgBlock) {
      // 사진 있는 문단: Claude가 직접 보고 판단
      userPrompt = `호치민 출장 후기 ${def.num}번 문단입니다.

【장면】${def.scene}
【분량】${def.chars}
【업체명】${companyName}
${kwInstruction}

【사진 처리 규칙 — 필수】
첨부된 사진을 직접 보고 아래 중 하나를 선택하세요:

(A) 사진 내용이 이 문단 장면과 일치하거나 관련 있으면:
  → 사진에 보이는 것을 구체적으로 묘사하세요. 사진에 없는 내용은 추가하지 마세요.

(B) 사진 내용이 이 문단 장면과 다르면 (예: 기내 사진인데 호텔 문단):
  → 사진 속 장면을 1~2문장 회상으로 자연스럽게 언급한 뒤, 현재 장면으로 전환하세요.
  → 회상 이후에도 사진에 없는 내용을 지어내지 마세요.

【절대 금지】
- 사진에 없는 음식·물건·장소 날조
- 느낌표(!) 사용
- 마크다운(** # *) 사용
- 문단 번호로 시작

본문 텍스트만 출력하세요.`;
    } else {
      // 사진 없는 문단
      userPrompt = `호치민 출장 후기 ${def.num}번 문단입니다.

【장면】${def.scene}
【분량】${def.chars}
【업체명】${companyName}
${kwInstruction}

【절대 금지】
- 느낌표(!) 사용
- 마크다운(** # *) 사용
- 문단 번호로 시작

본문 텍스트만 출력하세요.`;
    }

    const msgContent = imgBlock
      ? [imgBlock, { type: "text", text: userPrompt }]
      : [{ type: "text", text: userPrompt }];

    console.log(`[문단 ${def.num}/16] 사진=${imgIndex !== null ? imgIndex + 1 : '없음'} 키워드=${kw ? kw.circle : '없음'}`);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: "user", content: msgContent }],
    });

    const text = response.content.find(b => b.type === "text")?.text?.trim() || "";
    paragraphs.push(`${def.num}. ${text}`);

    // 분석표 데이터 수집
    if (imgIndex !== null) {
      photoAnalysisRows.push({ num: imgIndex + 1, paragraph: def.num, scene: def.scene.split("—")[0].trim() });
    }

    if (onChunk) onChunk(`${def.num}. ${text}\n\n`);
  }

  return { article: paragraphs.join("\n\n"), photoRows: photoAnalysisRows };
}

// ─── API 엔드포인트 (SSE 스트리밍) ─────────────────────────────────────────────
app.post("/api/generate-story", async (req, res) => {
  const keyword = req.body.keyword || req.body.userKeywords || "";
  const companyName = req.body.companyName || "";
  const images = req.body.images || [];
  const tone = req.body.tone || "casual";

  if (!keyword || !companyName) {
    return res.status(400).json({ success: false, error: "키워드와 회사명은 필수입니다." });
  }

  // SSE 헤더 설정
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);

  try {
    const keywordType = classifyKeyword(keyword);
    const title = generateTitle(keyword, companyName, keywordType);
    console.log(`[스트리밍 시작] 키워드: ${keyword}, 회사: ${companyName}, 이미지: ${images.length}장`);

    // 제목 먼저 전송
    send("title", { title, keywordType });

    // 글 생성 (사진을 각 문단에서 직접 분석)
    send("status", { message: "글 생성 중..." });
    const result = await generateArticleWithClaude(keyword, companyName, keywordType, images, tone, (chunk) => {
      send("chunk", { text: chunk });
    });

    // 글 완성 후 분석표 전송
    send("photo_analysis", { photos: result.photoRows });

    send("done", { success: true });
    console.log(`[스트리밍 완료] 제목: ${title}`);
  } catch (err) {
    console.error("[에러]", err);
    const msg = err.message?.includes("API key") || err.status === 401
      ? "Anthropic API 키가 설정되지 않았습니다."
      : `기사 생성 중 오류: ${err.message}`;
    send("error", { error: msg });
  } finally {
    res.end();
  }
});

// 헬스체크
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`✅ 백엔드 서버 실행 중: http://localhost:${PORT}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("⚠️  경고: ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다!");
    console.warn("   실행 방법: ANTHROPIC_API_KEY=sk-ant-... node server.js");
  }
});
