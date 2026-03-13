import { useState } from "react";
import StepOne from "./components/StepOne";
import StepTwo from "./components/StepTwo";
import StepThree from "./components/StepThree";

export type Tone = "casual" | "professional" | "humorous";

export interface StoryInput {
  keyword: string;
  companyName: string;
  tone: Tone;
}

export default function App() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [storyInput, setStoryInput] = useState<StoryInput>({
    keyword: "",
    companyName: "",
    tone: "casual",
  });
  const [images, setImages] = useState<string[]>([]);
  const [article, setArticle] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [photoAnalysis, setPhotoAnalysis] = useState<any[]>([]);
  const [loadingMessage, setLoadingMessage] = useState<string>("생성 중...");

  const handleStepOneNext = (data: StoryInput) => {
    setStoryInput(data);
    setStep(2);
  };

  const handleStepTwoGenerate = async (uploadedImages: string[]) => {
    setImages(uploadedImages);
    setIsLoading(true);
    setError("");
    setArticle("");
    setTitle("");

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

    try {
      const response = await fetch(`${BACKEND_URL}/api/generate-story`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: storyInput.keyword,
          companyName: storyInput.companyName,
          tone: storyInput.tone,
          images: uploadedImages,
        }),
      });

      if (!response.ok || !response.body) throw new Error("서버 응답 오류");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let generatedTitle = "";
      let bodyText = "";
      let movedToStep3 = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith("data: ")) {
            try {
              const payload = JSON.parse(line.slice(6));

              if (currentEvent === "title" && payload.title) {
                generatedTitle = payload.title;
                setTitle(generatedTitle);
                if (!movedToStep3) {
                  movedToStep3 = true;
                  setIsLoading(false);
                  setStep(3);
                }
              } else if (currentEvent === "chunk" && payload.text !== undefined) {
                bodyText += payload.text;
                setArticle(`# ${generatedTitle}\n\n${bodyText}`);
              } else if (currentEvent === "status" && payload.message) {
                setLoadingMessage(payload.message);
              } else if (currentEvent === "photo_analysis" && payload.photos) {
                setPhotoAnalysis(payload.photos);
              } else if (currentEvent === "error" && payload.error) {
                throw new Error(payload.error);
              } else if (currentEvent === "done") {
                // 완료 — 아무것도 안 해도 됨
              }
              currentEvent = "";
            } catch (e: any) {
              if (e.message && !e.message.includes("JSON")) throw e;
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "알 수 없는 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setStoryInput({ keyword: "", companyName: "", tone: "casual" });
    setImages([]);
    setArticle("");
    setTitle("");
    setError("");
    setPhotoAnalysis([]);
    setLoadingMessage("생성 중...");
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-body">
      {/* Header */}
      <header className="border-b border-stone-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-stone-950 font-bold text-sm">✈</div>
            <span className="text-lg font-display font-semibold tracking-wide text-amber-400">TripStory AI</span>
          </div>
          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step === s ? "bg-amber-500 text-stone-950" :
                  step > s ? "bg-amber-700 text-amber-200" :
                  "bg-stone-800 text-stone-500"
                }`}>{s}</div>
                {s < 3 && <div className={`w-8 h-px transition-all duration-300 ${step > s ? "bg-amber-600" : "bg-stone-700"}`} />}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-6 py-10">
        {step === 1 && <StepOne onNext={handleStepOneNext} defaultValues={storyInput} />}
        {step === 2 && (
          <StepTwo
            onGenerate={handleStepTwoGenerate}
            onBack={() => setStep(1)}
            isLoading={isLoading}
            loadingMessage={loadingMessage}
            error={error}
          />
        )}
        {step === 3 && (
          <StepThree
            article={article}
            title={title}
            onReset={handleReset}
            isStreaming={isLoading}
            photoAnalysis={photoAnalysis}
          />
        )}
      </main>
    </div>
  );
}
