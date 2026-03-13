import { useState } from "react";
import type { StoryInput, Tone } from "../App";

interface Props {
  onNext: (data: StoryInput) => void;
  defaultValues: StoryInput;
}

const TONES: { value: Tone; label: string; desc: string; emoji: string }[] = [
  { value: "casual", label: "편안한 톤", desc: "친구에게 이야기하듯 생생하게", emoji: "☕" },
  { value: "professional", label: "전문적 톤", desc: "비즈니스 보고서처럼 신뢰감 있게", emoji: "💼" },
  { value: "humorous", label: "유머러스 톤", desc: "위트 있고 재미있게", emoji: "😄" },
];

export default function StepOne({ onNext, defaultValues }: Props) {
  const [keyword, setKeyword] = useState(defaultValues.keyword);
  const [companyName, setCompanyName] = useState(defaultValues.companyName);
  const [tone, setTone] = useState<Tone>(defaultValues.tone);

  const canNext = keyword.trim() && companyName.trim();

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-bold text-amber-600 mb-2 text-center">여행 정보 입력</h1>
        <p className="text-gray-500 text-sm text-center">키워드와 숙소명을 입력하면 AI가 감각적인 출장 후기를 작성해드려요.</p>
      </div>

      <div className="space-y-6">
        {/* 키워드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            여행 키워드 <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="예: 호치민 비즈니스클래스, 베트남 항공"
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
          />
          <p className="text-xs text-gray-400 mt-1">항공편, 숙소명, 여행 테마 등을 입력하세요</p>
        </div>

        {/* 회사명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            숙소 / 브랜드명 <span className="text-amber-500">*</span>
          </label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="예: 노보텔 사이공센터, 롯데호텔 하노이"
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
          />
        </div>

        {/* 톤 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">글쓰기 톤</label>
          <div className="grid grid-cols-3 gap-3">
            {TONES.map(t => (
              <button
                key={t.value}
                onClick={() => setTone(t.value)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                  tone === t.value
                    ? "border-amber-500 bg-amber-50 text-amber-600"
                    : "border-gray-200 bg-white text-gray-500 hover:border-amber-300"
                }`}
              >
                <div className="text-2xl mb-2">{t.emoji}</div>
                <div className="text-sm font-medium">{t.label}</div>
                <div className="text-xs mt-1 text-gray-400">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={() => onNext({ keyword, companyName, tone })}
          disabled={!canNext}
          className={`w-full py-4 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 ${
            canNext
              ? "bg-amber-500 text-white hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          다음 단계 → 사진 업로드
        </button>
      </div>
    </div>
  );
}
