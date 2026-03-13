import { useState, useRef, useCallback } from "react";

interface Props {
  onGenerate: (images: string[]) => void;
  onBack: () => void;
  isLoading: boolean;
  loadingMessage?: string;
  error: string;
}

const TOTAL_SLOTS = 14;

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX = 1024;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
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

export default function StepTwo({ onGenerate, onBack, isLoading, loadingMessage = "생성 중...", error }: Props) {
  const [images, setImages] = useState<(string | null)[]>(Array(TOTAL_SLOTS).fill(null));
  const [dragOver, setDragOver] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSlotRef = useRef<number>(-1);

  const uploadedCount = images.filter(Boolean).length;
  const canGenerate = uploadedCount > 0;

  const handleFiles = useCallback(async (files: FileList, slotIndex: number) => {
    const newImages = [...images];
    let idx = slotIndex;
    for (let i = 0; i < files.length && idx < TOTAL_SLOTS; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      try {
        const compressed = await compressImage(file);
        newImages[idx] = compressed;
        idx++;
      } catch (e) {
        console.error("이미지 압축 실패:", e);
      }
    }
    setImages(newImages);
  }, [images]);

  const handleSlotClick = (index: number) => {
    activeSlotRef.current = index;
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files, activeSlotRef.current >= 0 ? activeSlotRef.current : 0);
    }
    e.target.value = "";
  };

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOver(null);
    handleFiles(e.dataTransfer.files, index);
  }, [handleFiles]);

  const removeImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);
  };

  const handleReset = () => setImages(Array(TOTAL_SLOTS).fill(null));

  const handleGenerate = () => {
    const validImages = images.filter(Boolean) as string[];
    onGenerate(validImages);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-amber-600 mb-2 text-center">사진 업로드</h1>
        <p className="text-gray-500 text-sm text-center">
          Claude AI가 사진을 직접 분석하여 생생한 후기를 작성합니다.
          <span className="text-amber-500 ml-1">{uploadedCount}/{TOTAL_SLOTS}장 업로드됨</span>
        </p>
      </div>

      {/* 이미지 그리드 */}
      <div className="grid grid-cols-4 gap-3 mb-6 sm:grid-cols-5 md:grid-cols-7">
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => !img && handleSlotClick(i)}
            onDragOver={e => { e.preventDefault(); setDragOver(i); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={e => handleDrop(e, i)}
            className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
              img
                ? "border-amber-500/40"
                : dragOver === i
                ? "border-amber-400 bg-amber-500/10 scale-105"
                : "border-gray-200 bg-gray-50 hover:border-amber-300 hover:bg-amber-50"
            }`}
          >
            {img ? (
              <>
                <img src={img} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                  <button
                    onClick={(e) => removeImage(i, e)}
                    className="opacity-0 hover:opacity-100 w-6 h-6 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold"
                  >×</button>
                </div>
                <div className="absolute bottom-1 left-1 w-5 h-5 bg-amber-500/80 rounded-full flex items-center justify-center text-stone-950 text-xs font-bold">
                  {i + 1}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <span className="text-xl mb-1">+</span>
                <span className="text-xs">{i + 1}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {/* 에러 */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="mb-6 p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
          <div className="text-amber-600 text-sm font-medium mb-2">✨ Claude AI가 사진을 분석하고 기사를 작성 중입니다...</div>
          <div className="text-gray-400 text-xs">{loadingMessage === "사진 분석 중..." ? "📷 사진 순서 분석 중..." : "✍️ 글 생성 중... 잠시만 기다려주세요."}</div>
          <div className="mt-3 flex justify-center gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="flex-none px-6 py-3 rounded-xl border border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-600 transition disabled:opacity-50 text-sm"
        >
          ← 이전
        </button>
        <button
          onClick={handleReset}
          disabled={isLoading || uploadedCount === 0}
          className="flex-none px-6 py-3 rounded-xl border border-stone-700 text-stone-400 hover:text-stone-200 hover:border-stone-600 transition disabled:opacity-50 text-sm"
        >
          초기화
        </button>
        <button
          onClick={handleGenerate}
          disabled={!canGenerate || isLoading}
          className={`flex-1 py-3 rounded-xl font-semibold text-sm tracking-wide transition-all duration-200 ${
            canGenerate && !isLoading
              ? "bg-amber-500 text-white hover:bg-amber-400 shadow-lg shadow-amber-500/20"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {isLoading ? "AI 작성 중..." : `✨ 감각적인 후기 생성 (${uploadedCount}장)`}
        </button>
      </div>
    </div>
  );
}
