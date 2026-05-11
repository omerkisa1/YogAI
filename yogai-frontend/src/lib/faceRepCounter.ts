type RepState = "idle" | "open" | "closing";

interface FaceRepConfig {
  blendshapeName: string;
  enterThreshold: number;
  exitThreshold: number;
  repTarget: number;
}

interface FaceRepResult {
  reps: number;
  target: number;
  currentValue: number;
  state: RepState;
  isComplete: boolean;
  progress: number;
}

const FACE_EXERCISE_CONFIGS: Record<string, FaceRepConfig> = {
  face_jaw_open: {
    blendshapeName: "jawOpen",
    enterThreshold: 0.45,
    exitThreshold: 0.08,
    repTarget: 10,
  },
  face_brow_raise: {
    blendshapeName: "browInnerUp",
    enterThreshold: 0.35,
    exitThreshold: 0.08,
    repTarget: 10,
  },
  face_wide_smile: {
    blendshapeName: "mouthSmileLeft",
    enterThreshold: 0.55,
    exitThreshold: 0.12,
    repTarget: 12,
  },
  face_lip_pucker: {
    blendshapeName: "mouthPucker",
    enterThreshold: 0.45,
    exitThreshold: 0.1,
    repTarget: 12,
  },
  face_eye_wide: {
    blendshapeName: "eyeWideLeft",
    enterThreshold: 0.4,
    exitThreshold: 0.1,
    repTarget: 10,
  },
  face_eye_squeeze: {
    blendshapeName: "eyeSquintLeft",
    enterThreshold: 0.55,
    exitThreshold: 0.12,
    repTarget: 10,
  },
  face_mouth_o: {
    blendshapeName: "mouthFunnel",
    enterThreshold: 0.4,
    exitThreshold: 0.08,
    repTarget: 10,
  },
  face_jaw_slide_right: {
    blendshapeName: "jawRight",
    enterThreshold: 0.3,
    exitThreshold: 0.06,
    repTarget: 8,
  },
  face_jaw_slide_left: {
    blendshapeName: "jawLeft",
    enterThreshold: 0.3,
    exitThreshold: 0.06,
    repTarget: 8,
  },
  face_brow_furrow: {
    blendshapeName: "browDownLeft",
    enterThreshold: 0.35,
    exitThreshold: 0.08,
    repTarget: 10,
  },
};

const FACE_BAR_LABELS: Record<string, string> = {
  face_jaw_open: "jawOpenLevel",
  face_brow_raise: "browRaiseLevel",
  face_wide_smile: "smileLevel",
  face_lip_pucker: "puckerLevel",
  face_eye_wide: "eyeWideLevel",
  face_eye_squeeze: "eyeSqueezeLevel",
  face_mouth_o: "mouthOLevel",
  face_jaw_slide_right: "jawSlideLevel",
  face_jaw_slide_left: "jawSlideLevel",
  face_brow_furrow: "browFurrowLevel",
};

const MIN_REP_INTERVAL_MS = 400;

function createFaceRepCounter(poseId: string, customTarget?: number) {
  const config = FACE_EXERCISE_CONFIGS[poseId];
  if (!config) return null;

  const target = customTarget || config.repTarget;
  let state: RepState = "idle";
  let reps = 0;
  let currentValue = 0;
  let smoothedValue = 0;
  let lastRepTime = 0;
  const alpha = 0.6;

  function update(blendshapes: Map<string, number>): FaceRepResult {
    const raw = blendshapes.get(config.blendshapeName) ?? 0;

    smoothedValue = smoothedValue * (1 - alpha) + raw * alpha;
    currentValue = smoothedValue;

    switch (state) {
      case "idle":
        if (smoothedValue >= config.enterThreshold) {
          state = "open";
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
        }
        break;

      case "closing":
        state = "idle";
        break;
    }

    return {
      reps,
      target,
      currentValue: smoothedValue,
      state,
      isComplete: reps >= target,
      progress: Math.min(reps / target, 1),
    };
  }

  function reset() {
    state = "idle";
    reps = 0;
    currentValue = 0;
    smoothedValue = 0;
    lastRepTime = 0;
  }

  return { update, reset, getConfig: () => config };
}

export { createFaceRepCounter, FACE_EXERCISE_CONFIGS, FACE_BAR_LABELS };
export type { FaceRepResult, FaceRepConfig };
