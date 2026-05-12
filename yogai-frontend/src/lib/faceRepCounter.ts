type RepState = "idle" | "open" | "closing";

export type FaceFeedbackState = "guide" | "hold" | "good" | "complete";

interface FaceRepConfig {
  blendshapeNames: string[];
  aggregation: "max" | "average";
  enterThreshold: number;
  exitThreshold: number;
  repTarget: number;
  feedbackKey: string;
  barLabelKey: string;
}

interface FaceRepResult {
  reps: number;
  target: number;
  currentValue: number;
  state: RepState;
  isComplete: boolean;
  progress: number;
  feedbackKey: string;
  feedbackState: FaceFeedbackState;
  barLabelKey: string;
}

function readBlendshapeValue(blendshapes: Map<string, number>, config: FaceRepConfig): number {
  if (config.blendshapeNames.length === 1) {
    return blendshapes.get(config.blendshapeNames[0]) ?? 0;
  }

  const values = config.blendshapeNames.map((name) => blendshapes.get(name) ?? 0);

  if (config.aggregation === "max") {
    return Math.max(...values);
  }

  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

const FACE_EXERCISE_CONFIGS: Record<string, FaceRepConfig> = {
  face_jaw_open: {
    blendshapeNames: ["jawOpen"],
    aggregation: "max",
    enterThreshold: 0.45,
    exitThreshold: 0.08,
    repTarget: 10,
    feedbackKey: "feedbackJawOpen",
    barLabelKey: "jawOpenLevel",
  },
  face_brow_raise: {
    blendshapeNames: ["browInnerUp"],
    aggregation: "max",
    enterThreshold: 0.35,
    exitThreshold: 0.08,
    repTarget: 10,
    feedbackKey: "feedbackBrowRaise",
    barLabelKey: "browRaiseLevel",
  },
  face_wide_smile: {
    blendshapeNames: ["mouthSmileLeft", "mouthSmileRight"],
    aggregation: "average",
    enterThreshold: 0.5,
    exitThreshold: 0.12,
    repTarget: 12,
    feedbackKey: "feedbackWideSmile",
    barLabelKey: "smileLevel",
  },
  face_lip_pucker: {
    blendshapeNames: ["mouthPucker"],
    aggregation: "max",
    enterThreshold: 0.4,
    exitThreshold: 0.1,
    repTarget: 12,
    feedbackKey: "feedbackLipPucker",
    barLabelKey: "puckerLevel",
  },
  face_fish_lips: {
    blendshapeNames: ["mouthPucker", "mouthShrugLower"],
    aggregation: "average",
    enterThreshold: 0.35,
    exitThreshold: 0.08,
    repTarget: 10,
    feedbackKey: "feedbackFishLips",
    barLabelKey: "fishLipsLevel",
  },
  face_eye_squeeze: {
    blendshapeNames: ["eyeSquintLeft", "eyeSquintRight"],
    aggregation: "average",
    enterThreshold: 0.45,
    exitThreshold: 0.25,
    repTarget: 10,
    feedbackKey: "feedbackEyeSqueeze",
    barLabelKey: "eyeSqueezeLevel",
  },
  face_mouth_o: {
    blendshapeNames: ["mouthFunnel", "mouthPucker"],
    aggregation: "max",
    enterThreshold: 0.3,
    exitThreshold: 0.06,
    repTarget: 10,
    feedbackKey: "feedbackMouthO",
    barLabelKey: "mouthOLevel",
  },
  face_jaw_slide_right: {
    blendshapeNames: ["jawRight"],
    aggregation: "max",
    enterThreshold: 0.02,
    exitThreshold: 0.005,
    repTarget: 8,
    feedbackKey: "feedbackJawSlideRight",
    barLabelKey: "jawSlideLevel",
  },
  face_jaw_slide_left: {
    blendshapeNames: ["jawLeft"],
    aggregation: "max",
    enterThreshold: 0.02,
    exitThreshold: 0.005,
    repTarget: 8,
    feedbackKey: "feedbackJawSlideLeft",
    barLabelKey: "jawSlideLevel",
  },
  face_brow_furrow: {
    blendshapeNames: ["browDownLeft", "browDownRight"],
    aggregation: "average",
    enterThreshold: 0.3,
    exitThreshold: 0.06,
    repTarget: 10,
    feedbackKey: "feedbackBrowFurrow",
    barLabelKey: "browFurrowLevel",
  },
  face_cheek_puff: {
    blendshapeNames: ["cheekPuff", "mouthPressLeft", "mouthPressRight"],
    aggregation: "max",
    enterThreshold: 0.06,
    exitThreshold: 0.02,
    repTarget: 10,
    feedbackKey: "feedbackCheekPuff",
    barLabelKey: "cheekPuffLevel",
  },
  face_eye_wide: {
    blendshapeNames: ["eyeWideLeft", "eyeWideRight"],
    aggregation: "average",
    enterThreshold: 0.28,
    exitThreshold: 0.07,
    repTarget: 10,
    feedbackKey: "feedbackEyeWide",
    barLabelKey: "eyeWideLevel",
  },
  face_eye_blink: {
    blendshapeNames: ["eyeBlinkLeft", "eyeBlinkRight"],
    aggregation: "average",
    enterThreshold: 0.55,
    exitThreshold: 0.1,
    repTarget: 15,
    feedbackKey: "feedbackEyeBlink",
    barLabelKey: "eyeBlinkLevel",
  },
  face_frown: {
    blendshapeNames: ["mouthFrownLeft", "mouthFrownRight"],
    aggregation: "average",
    enterThreshold: 0.018,
    exitThreshold: 0.004,
    repTarget: 10,
    feedbackKey: "feedbackFrown",
    barLabelKey: "frownLevel",
  },
  face_lip_roll: {
    blendshapeNames: ["mouthRollLower", "mouthRollUpper"],
    aggregation: "average",
    enterThreshold: 0.3,
    exitThreshold: 0.06,
    repTarget: 10,
    feedbackKey: "feedbackLipRoll",
    barLabelKey: "lipRollLevel",
  },
  face_upper_lip_raise: {
    blendshapeNames: ["mouthUpperUpLeft", "mouthUpperUpRight"],
    aggregation: "average",
    enterThreshold: 0.35,
    exitThreshold: 0.08,
    repTarget: 10,
    feedbackKey: "feedbackUpperLipRaise",
    barLabelKey: "upperLipRaiseLevel",
  },
};

const MIN_REP_INTERVAL_MS = 400;

function createFaceRepCounter(poseId: string, customTarget?: number) {
  const config = FACE_EXERCISE_CONFIGS[poseId];
  if (!config) return null;

  const target = customTarget || config.repTarget;
  let state: RepState = "idle";
  let reps = 0;
  let smoothedValue = 0;
  let lastRepTime = 0;
  const smoothAlpha = 0.85;

  function update(blendshapes: Map<string, number>): FaceRepResult {
    if (reps >= target) {
      return {
        reps: target,
        target,
        currentValue: 0,
        state: "idle",
        isComplete: true,
        progress: 1,
        feedbackKey: config.feedbackKey,
        feedbackState: "complete",
        barLabelKey: config.barLabelKey,
      };
    }

    const raw = readBlendshapeValue(blendshapes, config);

    smoothedValue = smoothedValue * (1 - smoothAlpha) + raw * smoothAlpha;
    const displayValue = raw;

    let feedbackState: FaceFeedbackState = "guide";

    switch (state) {
      case "idle":
        if (smoothedValue >= config.enterThreshold) {
          state = "open";
          feedbackState = "hold";
        } else {
          feedbackState = "guide";
        }
        break;

      case "open":
        if (smoothedValue < config.exitThreshold) {
          const now = Date.now();
          if (now - lastRepTime > MIN_REP_INTERVAL_MS) {
            reps++;
            lastRepTime = now;
          }
          state = reps >= target ? "idle" : "closing";
          feedbackState = reps >= target ? "complete" : "good";
        } else {
          feedbackState = "hold";
        }
        break;

      case "closing":
        state = "idle";
        feedbackState = "guide";
        break;
    }

    return {
      reps,
      target,
      currentValue: displayValue,
      state,
      isComplete: reps >= target,
      progress: Math.min(reps / target, 1),
      feedbackKey: config.feedbackKey,
      feedbackState,
      barLabelKey: config.barLabelKey,
    };
  }

  function reset() {
    state = "idle";
    reps = 0;
    smoothedValue = 0;
    lastRepTime = 0;
  }

  return { update, reset, getConfig: () => config };
}

export { createFaceRepCounter, FACE_EXERCISE_CONFIGS };
export type { FaceRepResult, FaceRepConfig };
