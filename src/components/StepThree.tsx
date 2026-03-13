import { useState } from "react";

interface PhotoRow {
  num: number;
  actual: string;
  expected: string;
  match: "일치" | "부분일치" | "불일치";
  flashback: string;
}

interface Props {
  article: string;
  title: string;
  onReset: () => void;
  isStreaming?: boolean;
  photoAnalysis?: PhotoRow[];
}

export default function StepThree({ article, title, onReset, isStreaming = false, photoAnalysis = [] }: Props) {
  const [copied, setCopied] = useState(false);

  // 마크다운 기본 렌더링 (# 제목, 원숫자 문단)
  const renderArticle = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("# ")) {
        return (
          <h1 key={i} className="text-2xl font-display font-bold text-amber-400 mb-6 leading-snug">
            {line.replace("# ", "")}
          </h1>
        );
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-xl font-semibold text-amber-300 mt-6 mb-3">{line.replace("## ", "")}</h2>;
      }
      if (line.match(/^[①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭]/)) {
        return (
          <p key={i} className="text-gray-700 leading-relaxed mb-4 border-l-2 border-amber-300 pl-4">
            {line}
          </p>
        );
      }
      if (line.trim() === "") return <div key={i} className="mb-2" />;
      return <p key={i} className="text-gray-600 leading-relaxed mb-3">{line}</p>;
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(article);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const blob = new Blob([article], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.slice(0, 30)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([article], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const charCount = article.replace(/\s/g, "").length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-amber-600 mb-1">
            {isStreaming ? "✍️ 기사 작성 중..." : "기사 생성 완료!"}
          </h1>
          <p className="text-gray-400 text-sm">
            {isStreaming
              ? `${charCount.toLocaleString()}자 생성 중...`
              : `총 ${charCount.toLocaleString()}자 · Claude AI Vision 분석 완료`}
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex-none px-4 py-2 rounded-lg border border-stone-700 text-gray-400 hover:text-gray-700 hover:border-stone-600 transition text-sm"
        >
          ↩ 처음부터
        </button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            copied
              ? "bg-green-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {copied ? "✓ 복사됨!" : "📋 복사"}
        </button>
        <button
          onClick={handleDownloadMd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 text-sm font-medium transition"
        >
          ⬇ Markdown
        </button>
        <button
          onClick={handleDownloadTxt}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-800 text-stone-300 hover:bg-stone-700 text-sm font-medium transition"
        >
          ⬇ TXT
        </button>
      </div>

      {/* 기사 본문 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="prose prose-invert max-w-none">
          {renderArticle(article)}
          {isStreaming && (
            <span className="inline-block w-0.5 h-5 bg-amber-400 ml-0.5 animate-pulse align-middle" />
          )}
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-center text-xs text-gray-400">
        💡 기사는 Claude AI가 업로드된 사진을 직접 분석하여 작성했습니다.
      </div>

      {/* 사진 순서 분석표 */}
      {photoAnalysis.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-display font-semibold text-amber-600 mb-3">📷 사진 순서 분석</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-xs">
                  <th className="px-3 py-2 text-left w-12">사진</th>
                  <th className="px-3 py-2 text-left">실제 장면</th>
                  <th className="px-3 py-2 text-left">기대 순서</th>
                  <th className="px-3 py-2 text-center w-20">일치 여부</th>
                  <th className="px-3 py-2 text-left">회상 처리</th>
                </tr>
              </thead>
              <tbody>
                {photoAnalysis.map((row) => (
                  <tr key={row.num} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400 font-mono">{row.num}</td>
                    <td className="px-3 py-2 text-gray-700">{row.actual}</td>
                    <td className="px-3 py-2 text-gray-400">{row.expected}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        row.match === "일치"
                          ? "bg-emerald-900/50 text-emerald-400"
                          : row.match === "부분일치"
                          ? "bg-amber-900/50 text-amber-400"
                          : "bg-red-900/50 text-red-400"
                      }`}>
                        {row.match === "일치" ? "✅ 일치" : row.match === "부분일치" ? "⚠️ 부분" : "❌ 불일치"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-400 text-xs italic">
                      {row.flashback || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {photoAnalysis.length === 0 && !isStreaming && (
        <div className="mt-6 text-center text-gray-400 text-xs">사진 분석 결과를 불러오는 중...</div>
      )}
    </div>
  );
}
