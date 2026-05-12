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
    feedbackCheekPuff: {
      guide: "Puff both cheeks out with air",
      hold: "Hold the puff!",
      good: "Well done!",
    },
    feedbackEyeWide: {
      guide: "Open your eyes as wide as possible",
      hold: "Hold them wide!",
      good: "Great!",
    },
    feedbackEyeBlink: {
      guide: "Slowly close both eyes fully",
      hold: "Hold them closed!",
      good: "Good blink!",
    },
    feedbackFrown: {
      guide: "Pull the corners of your mouth downward",
      hold: "Hold the frown!",
      good: "Nice!",
    },
    feedbackNoseScrunch: {
      guide: "Wrinkle your nose upward",
      hold: "Keep scrunching!",
      good: "Well done!",
    },
    feedbackBrowOuterRaise: {
      guide: "Lift only the outer parts of your brows",
      hold: "Hold them up!",
      good: "Good!",
    },
    feedbackMouthStretch: {
      guide: "Stretch the corners of your mouth sideways",
      hold: "Hold the stretch!",
      good: "Nice stretch!",
    },
    feedbackLipRoll: {
      guide: "Roll both lips inward over your teeth",
      hold: "Hold the roll!",
      good: "Well done!",
    },
    feedbackJawForward: {
      guide: "Thrust your lower jaw forward",
      hold: "Hold it forward!",
      good: "Good!",
    },
    feedbackUpperLipRaise: {
      guide: "Curl your upper lip upward",
      hold: "Hold it up!",
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
    feedbackCheekPuff: {
      guide: "Her iki yanağınızı havayla şişirin",
      hold: "Şişirmeyi tutun!",
      good: "Aferin!",
    },
    feedbackEyeWide: {
      guide: "Gözlerinizi olabildiğince geniş açın",
      hold: "Geniş tutun!",
      good: "Harika!",
    },
    feedbackEyeBlink: {
      guide: "Her iki gözünüzü yavaşça tam kapatın",
      hold: "Kapalı tutun!",
      good: "İyi kırpma!",
    },
    feedbackFrown: {
      guide: "Ağzınızın köşelerini aşağı çekin",
      hold: "Somurtmayı tutun!",
      good: "Güzel!",
    },
    feedbackNoseScrunch: {
      guide: "Burnunuzu yukarı kıvırın",
      hold: "Kıvırmayı tutun!",
      good: "Aferin!",
    },
    feedbackBrowOuterRaise: {
      guide: "Yalnızca kaşların dış kısmını kaldırın",
      hold: "Yukarıda tutun!",
      good: "İyi!",
    },
    feedbackMouthStretch: {
      guide: "Ağzınızın köşelerini yanlara gerin",
      hold: "Germeyi tutun!",
      good: "İyi germe!",
    },
    feedbackLipRoll: {
      guide: "Dudakları dişlerin üzerine içeri yuvarlayın",
      hold: "Yuvarlayı tutun!",
      good: "Aferin!",
    },
    feedbackJawForward: {
      guide: "Alt çenenizi öne uzatın",
      hold: "Öne tutun!",
      good: "İyi!",
    },
    feedbackUpperLipRaise: {
      guide: "Üst dudağınızı yukarı kaldırın",
      hold: "Yukarıda tutun!",
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
    feedbackEyePress: {
      guide_hand: "Place your fingertips around your eye area",
      guide_action: "Apply light pressure",
      hold: "Hold gently...",
      good: "Good rep!",
    },
    feedbackTempleMassage: {
      guide_hand: "Place your fingertips on your temples",
      guide_action: "Apply gentle circular pressure",
      hold: "Hold and breathe...",
      good: "Nice!",
    },
    feedbackNoseBridge: {
      guide_hand: "Place two fingers on your nose bridge",
      guide_action: "Apply gentle pressure",
      hold: "Hold the press...",
      good: "Well done!",
    },
    feedbackChinLift: {
      guide_hand: "Place your hand under your chin",
      guide_action: "Apply gentle upward pressure",
      hold: "Hold and lift...",
      good: "Good rep!",
    },
    feedbackLipPress: {
      guide_hand: "Place two fingers lightly on your lips",
      guide_action: "Press your lips against your fingers",
      hold: "Hold the press...",
      good: "Nice!",
    },
    feedbackBrowSmooth: {
      guide_hand: "Place your fingertips between your eyebrows",
      guide_action: "Apply gentle outward pressure",
      hold: "Hold and smooth...",
      good: "Well done!",
    },
    feedbackNeckSide: {
      guide_hand: "Place your hand on the side of your neck",
      guide_action: "Tilt your head gently away",
      hold: "Hold the stretch...",
      good: "Good stretch!",
    },
    feedbackCheekLift: {
      guide_hand: "Place your fingertips on your left cheek",
      guide_action: "Squint that eye slightly while pressing",
      hold: "Hold and lift...",
      good: "Nice rep!",
    },
    feedbackJawSide: {
      guide_hand: "Place your hand on the right side of your jaw",
      guide_action: "Slide jaw right against your hand",
      hold: "Hold the position...",
      good: "Well done!",
    },
    feedbackEyeBrowLift: {
      guide_hand: "Place your palm on your forehead",
      guide_action: "Open your eyes wide while pressing up",
      hold: "Hold wide-eyed...",
      good: "Great!",
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
    feedbackEyePress: {
      guide_hand: "Parmak uçlarınızı göz çevrenize koyun",
      guide_action: "Hafif baskı uygulayın",
      hold: "Nazikçe tutun...",
      good: "Güzel tekrar!",
    },
    feedbackTempleMassage: {
      guide_hand: "Parmak uçlarınızı şakaklarınıza koyun",
      guide_action: "Nazik dairesel baskı uygulayın",
      hold: "Tutun ve nefes alın...",
      good: "Güzel!",
    },
    feedbackNoseBridge: {
      guide_hand: "İki parmağınızı burun kemiğinize koyun",
      guide_action: "Hafifçe bastırın",
      hold: "Bastırmayı tutun...",
      good: "Aferin!",
    },
    feedbackChinLift: {
      guide_hand: "Elinizi çenenizin altına koyun",
      guide_action: "Hafifçe yukarı bastırın",
      hold: "Tutun ve kaldırın...",
      good: "Güzel tekrar!",
    },
    feedbackLipPress: {
      guide_hand: "İki parmağınızı dudaklarınıza koyun",
      guide_action: "Dudaklarınızı parmaklarınıza bastırın",
      hold: "Bastırmayı tutun...",
      good: "Güzel!",
    },
    feedbackBrowSmooth: {
      guide_hand: "Parmak uçlarınızı kaşlar arasına koyun",
      guide_action: "Hafifçe dışa doğru bastırın",
      hold: "Tutun ve düzleştirin...",
      good: "Aferin!",
    },
    feedbackNeckSide: {
      guide_hand: "Elinizi boynunuzun yan tarafına koyun",
      guide_action: "Başınızı nazikçe karşı tarafa eğin",
      hold: "Germeyi tutun...",
      good: "İyi germe!",
    },
    feedbackCheekLift: {
      guide_hand: "Parmak uçlarınızı sol yanağınıza koyun",
      guide_action: "O gözü hafifçe kısarken yukarı itin",
      hold: "Tutun ve kaldırın...",
      good: "Güzel tekrar!",
    },
    feedbackJawSide: {
      guide_hand: "Elinizi çenenizin sağ tarafına koyun",
      guide_action: "Çeneyi elinize karşı sağa kaydırın",
      hold: "Pozisyonu tutun...",
      good: "Aferin!",
    },
    feedbackEyeBrowLift: {
      guide_hand: "Avucunuzu alnınıza koyun",
      guide_action: "Yukarı basarken gözlerinizi geniş açın",
      hold: "Geniş gözlü tutun...",
      good: "Harika!",
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
