// ───────────────────────────────────────────────────────────
//  API 호출 서비스 (Claude Backend 연동)
//  기존 Gemini 파싱 로직 → Claude 백엔드 응답 형식으로 교체
// ───────────────────────────────────────────────────────────

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export interface GenerateResult {
  success: boolean;
  article: string;
  title: string;
  keywordType: string;
  error?: string;
}

/**
 * 이미지를 base64로 변환
 */
async function compressToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1024;
        let w = img.width,
          h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 메인 API 호출 함수
 * - 이미지 File[] 또는 이미 변환된 base64 string[] 모두 수신 가능
 */
export async function generateTripStory(
  images: (File | string)[],
  userKeywords: string,
  companyName: string,
  tone: string = "casual"
): Promise<GenerateResult> {
  // File 객체는 base64로 변환
  const base64Images: string[] = await Promise.all(
    images.map(async (img) => {
      if (typeof img === "string") return img; // 이미 base64
      return compressToBase64(img);
    })
  );

  console.log("[Trip Story] Sending request to backend...", {
    keyword: userKeywords,
    companyName,
    tone,
    imageCount: base64Images.length,
  });

  const response = await fetch(`${BACKEND_URL}/api/generate-story`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keyword: userKeywords,
      userKeywords, // 하위 호환
      companyName,
      tone,
      images: base64Images,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`서버 오류 (${response.status}): ${errText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || "기사 생성에 실패했습니다.");
  }

  // ✅ Claude 백엔드 응답 형식: { success, article, title, keywordType }
  return {
    success: true,
    article: data.article,
    title: data.title,
    keywordType: data.keywordType,
  };
}
