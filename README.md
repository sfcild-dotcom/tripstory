# TripStory AI — 호치민 출장후기 자동 생성
> Claude Vision API 기반으로 사진 분석 + AI 기사 자동 작성

---

## 🚀 빠른 시작

### 1. 의존성 설치
```bash
npm install
```

### 2. Claude API 키 설정
[Anthropic Console](https://console.anthropic.com)에서 API 키 발급 후:

```bash
# 방법 A: 환경변수 직접 설정
export ANTHROPIC_API_KEY=sk-ant-api03-...

# 방법 B: .env 파일 생성
echo "ANTHROPIC_API_KEY=sk-ant-api03-..." > .env
```

### 3. 백엔드 서버 실행
```bash
ANTHROPIC_API_KEY=sk-ant-... node server.js
# 또는 .env 설정 후:
npm start
```

### 4. 프론트엔드 개발 서버 실행 (새 터미널)
```bash
npm run dev
```

### 5. 브라우저 접속
```
http://localhost:5181
```

---

## 🌐 프로덕션 배포

```bash
# 빌드
npm run build

# 프론트엔드 정적 파일 서빙 (server.js에 추가하거나 별도 서버 사용)
# dist/ 폴더를 Nginx, Vercel, Netlify 등으로 서빙
```

백엔드 URL을 환경변수로 지정:
```bash
VITE_BACKEND_URL=https://your-backend.com npm run build
```

---

## 🔑 환경변수 목록

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `ANTHROPIC_API_KEY` | **필수** Claude API 키 | - |
| `PORT` | 백엔드 포트 | `8000` |
| `VITE_BACKEND_URL` | 백엔드 URL (빌드 시) | `http://localhost:8000` |

---

## ✨ 주요 변경사항 (v2.0)

- ❌ OpenAI API 제거
- ✅ **Claude API (claude-sonnet-4-20250514)** 적용
- ✅ **Vision 기능**: 업로드된 사진을 Claude가 직접 분석
- ✅ 사진 분위기·장소를 기사에 자연스럽게 반영
- ✅ 더미 응답 완전 제거 → 실제 AI 생성
- ✅ 글쓰기 톤(편안/전문/유머) 백엔드 프롬프트에 반영
- ✅ 에러 메시지 한국어 개선

---

## 📁 파일 구조

```
trip-story-web/
├── server.js              # ← Claude API 백엔드 (핵심 변경)
├── src/
│   ├── App.tsx
│   ├── index.css
│   └── components/
│       ├── StepOne.tsx    # 키워드/톤 입력
│       ├── StepTwo.tsx    # 사진 업로드 (14장)
│       └── StepThree.tsx  # 기사 표시/다운로드
├── package.json
├── vite.config.ts
└── README.md
```

---

## 💡 사용 팁

- 사진은 **1장 이상**이면 기사 생성 가능 (최대 14장)
- 해상도가 높은 사진일수록 Claude가 더 정확하게 분석
- 생성 시간: 사진 수에 따라 **20~60초** 소요
- API 비용: 사진 14장 기준 약 $0.05~0.10 per 생성
