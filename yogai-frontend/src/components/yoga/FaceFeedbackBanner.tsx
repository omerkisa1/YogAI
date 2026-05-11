"use client";

import { useApp } from "@/components/layout/AppProvider";
import type { FaceFeedbackState } from "@/lib/faceRepCounter";
import type { FaceHandFeedbackState } from "@/lib/faceHandRepCounter";

export type FaceBannerVariant = "face" | "face_hand";

interface Props {
  variant?: FaceBannerVariant;
  feedbackState: FaceFeedbackState | FaceHandFeedbackState;
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
    feedbackFishLips: {
      guide: "Suck in cheeks and push lips forward",
      hold: "Hold the fish face!",
      good: "Good one!",
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
    feedbackFishLips: {
      guide: "Yanaklarınızı çekin, dudaklarınızı öne itin",
      hold: "Balık yüzünü tutun!",
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

const HAND_FEEDBACK_MESSAGES: Record<
  string,
  Record<
    string,
    {
      guide_hand: string;
      guide_action: string;
      hold: string;
      good: string;
    }
  >
> = {
  en: {
    feedbackCheekMassage: {
      guide_hand: "Place your fingertips on your cheek",
      guide_action: "Press gently",
      hold: "Hold... keep pressing",
      good: "Good rep!",
    },
    feedbackForeheadSmooth: {
      guide_hand: "Place your palm on your forehead",
      guide_action: "Apply gentle pressure",
      hold: "Hold... smoothing",
      good: "Nice!",
    },
    feedbackJawRelease: {
      guide_hand: "Place your hand under your chin",
      guide_action: "Now open your mouth",
      hold: "Hold open with hand support",
      good: "Well done!",
    },
  },
  tr: {
    feedbackCheekMassage: {
      guide_hand: "Parmak uçlarınızı yanağınıza koyun",
      guide_action: "Hafifçe bastırın",
      hold: "Tutun... bastırmaya devam edin",
      good: "Güzel tekrar!",
    },
    feedbackForeheadSmooth: {
      guide_hand: "Avucunuzu alnınıza koyun",
      guide_action: "Hafifçe bastırın",
      hold: "Tutun... düzleştiriliyor",
      good: "Güzel!",
    },
    feedbackJawRelease: {
      guide_hand: "Elinizi çenenizin altına koyun",
      guide_action: "Şimdi ağzınızı açın",
      hold: "Elle destekleyerek açık tutun",
      good: "Aferin!",
    },
  },
};

export default function FaceFeedbackBanner({
  variant = "face",
  feedbackState,
  feedbackKey,
}: Props) {
  const { locale } = useApp();
  const lang = locale === "tr" ? "tr" : "en";

  if (feedbackState === "complete") return null;

  if (variant === "face_hand") {
    const m = HAND_FEEDBACK_MESSAGES[lang]?.[feedbackKey];
    if (!m) return null;
    const text =
      feedbackState === "guide_hand"
        ? m.guide_hand
        : feedbackState === "guide_action"
          ? m.guide_action
          : feedbackState === "hold"
            ? m.hold
            : feedbackState === "good"
              ? m.good
              : null;
    if (!text) return null;

    const bgColor =
      feedbackState === "guide_hand"
        ? "bg-white/10"
        : feedbackState === "guide_action"
          ? "bg-amber-500/20"
          : feedbackState === "hold"
            ? "bg-green-500/20"
            : "bg-green-500/30";

    const textColor =
      feedbackState === "guide_hand"
        ? "text-white/70"
        : feedbackState === "guide_action"
          ? "text-amber-200"
          : "text-green-300";

    const icon =
      feedbackState === "guide_hand"
        ? "👆"
        : feedbackState === "guide_action"
          ? "✋"
          : feedbackState === "hold"
            ? "✊"
            : "✅";

    return (
      <div className={`flex items-center gap-3 rounded-xl px-4 py-2 ${bgColor}`}>
        <span className="text-lg">{icon}</span>
        <span className={`text-sm font-medium ${textColor}`}>{text}</span>
      </div>
    );
  }

  const messages = FEEDBACK_MESSAGES[lang]?.[feedbackKey];
  if (!messages) return null;

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
    <div className={`flex items-center gap-3 rounded-xl px-4 py-2 ${bgColor}`}>
      <span className="text-lg">{icon}</span>
      <span className={`text-sm font-medium ${textColor}`}>{text}</span>
    </div>
  );
}
