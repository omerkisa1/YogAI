"use client";

import { useApp } from "@/components/layout/AppProvider";
import type { FaceFeedbackState } from "@/lib/faceRepCounter";

interface Props {
  feedbackState: FaceFeedbackState;
  feedbackKey: string;
}

const FEEDBACK_MESSAGES: Record<
  string,
  Record<string, { guide: string; hold: string; good: string }>
> = {
  en: {
    feedbackJawOpen: {
      guide: "Open your mouth wide",
      hold: "Great, hold it open!",
      good: "Nice rep!",
    },
    feedbackBrowRaise: {
      guide: "Raise your eyebrows high",
      hold: "Hold them up!",
      good: "Good one!",
    },
    feedbackWideSmile: {
      guide: "Smile as wide as you can",
      hold: "Hold that smile!",
      good: "Beautiful smile!",
    },
    feedbackLipPucker: {
      guide: "Pucker your lips like a kiss",
      hold: "Hold the pucker!",
      good: "Perfect!",
    },
    feedbackEyeWide: {
      guide: "Open your eyes wide, look surprised",
      hold: "Hold them wide!",
      good: "Great!",
    },
    feedbackEyeSqueeze: {
      guide: "Squeeze both eyes shut tightly",
      hold: "Keep squeezing!",
      good: "Well done!",
    },
    feedbackMouthO: {
      guide: "Make an O shape with your mouth",
      hold: "Hold the O shape!",
      good: "Nice!",
    },
    feedbackJawSlideRight: {
      guide: "Slide your jaw to the right",
      hold: "Hold it there!",
      good: "Good slide!",
    },
    feedbackJawSlideLeft: {
      guide: "Slide your jaw to the left",
      hold: "Hold it there!",
      good: "Good slide!",
    },
    feedbackBrowFurrow: {
      guide: "Furrow your brows, look angry",
      hold: "Keep furrowing!",
      good: "Nice!",
    },
  },
  tr: {
    feedbackJawOpen: {
      guide: "Ağzınızı sonuna kadar açın",
      hold: "Harika, açık tutun!",
      good: "Güzel tekrar!",
    },
    feedbackBrowRaise: {
      guide: "Kaşlarınızı yukarı kaldırın",
      hold: "Yukarıda tutun!",
      good: "İyi!",
    },
    feedbackWideSmile: {
      guide: "Olabildiğince geniş gülümseyin",
      hold: "Gülümsemeyi tutun!",
      good: "Harika gülümseme!",
    },
    feedbackLipPucker: {
      guide: "Dudaklarınızı öpücük gibi büzün",
      hold: "Büzmeyi tutun!",
      good: "Mükemmel!",
    },
    feedbackEyeWide: {
      guide: "Gözlerinizi şaşırmış gibi açın",
      hold: "Açık tutun!",
      good: "Güzel!",
    },
    feedbackEyeSqueeze: {
      guide: "İki gözünüzü sıkıca kapatın",
      hold: "Sıkı tutun!",
      good: "Aferin!",
    },
    feedbackMouthO: {
      guide: "Ağzınızla O şekli yapın",
      hold: "O şeklini tutun!",
      good: "Güzel!",
    },
    feedbackJawSlideRight: {
      guide: "Çenenizi sağa kaydırın",
      hold: "Orada tutun!",
      good: "İyi kayma!",
    },
    feedbackJawSlideLeft: {
      guide: "Çenenizi sola kaydırın",
      hold: "Orada tutun!",
      good: "İyi kayma!",
    },
    feedbackBrowFurrow: {
      guide: "Kaşlarınızı çatın, kızgın bakın",
      hold: "Çatık tutun!",
      good: "Güzel!",
    },
  },
};

export default function FaceFeedbackBanner({ feedbackState, feedbackKey }: Props) {
  const { locale } = useApp();
  const lang = locale === "tr" ? "tr" : "en";
  const messages = FEEDBACK_MESSAGES[lang]?.[feedbackKey];

  if (!messages || feedbackState === "complete") return null;

  const text =
    feedbackState === "guide"
      ? messages.guide
      : feedbackState === "hold"
        ? messages.hold
        : messages.good;

  const bgColor =
    feedbackState === "guide"
      ? "bg-white/10"
      : feedbackState === "hold"
        ? "bg-green-500/20"
        : "bg-green-500/30";

  const textColor =
    feedbackState === "guide" ? "text-white/70" : "text-green-300";

  const icon = feedbackState === "guide" ? "👆" : feedbackState === "hold" ? "✊" : "✅";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-2 transition-all duration-150 ${bgColor}`}
    >
      <span className="text-lg">{icon}</span>
      <span className={`text-sm font-medium transition-all duration-150 ${textColor}`}>{text}</span>
    </div>
  );
}
