export type FaceHandFeedbackState =
  | "guide_hand"
  | "guide_action"
  | "hold"
  | "good"
  | "complete";

export interface FaceHandRepConfig {
  poseId: string;
  handTarget:
    | "cheek_left"
    | "cheek_right"
    | "forehead"
    | "chin"
    | "jaw_left"
    | "jaw_right"
    | "eye_left"
    | "eye_right"
    | "temple_left"
    | "temple_right"
    | "nose_bridge"
    | "lips"
    | "between_brows"
    | "neck_left"
    | "neck_right";
  requiredBlendshape?: string;
  blendshapeThreshold?: number;
  proximityThreshold: number;
  holdDurationMs: number;
  repTarget: number;
  feedbackKey: string;
  barLabelKey: string;
}

export interface FaceHandRepResult {
  reps: number;
  target: number;
  handNearFace: boolean;
  holdProgress: number;
  isComplete: boolean;
  progress: number;
  feedbackKey: string;
  feedbackState: FaceHandFeedbackState;
  currentProximity: number;
  barLabelKey: string;
}

const FACE_REGION_LANDMARKS: Record<string, number[]> = {
  cheek_left: [234, 93, 132],
  cheek_right: [454, 323, 361],
  forehead: [10, 151, 9],
  chin: [152, 175, 199],
  jaw_left: [172, 136, 150],
  jaw_right: [397, 365, 379],
  eye_left: [33, 133, 159],
  eye_right: [263, 362, 386],
  temple_left: [54, 103, 67],
  temple_right: [284, 332, 297],
  nose_bridge: [6, 197, 195],
  lips: [13, 14, 0],
  between_brows: [9, 168, 8],
  neck_left: [234, 177, 147],
  neck_right: [454, 401, 376],
};

const HAND_FINGERTIP_INDICES = [4, 8, 12, 16, 20];
const HAND_PALM_INDEX = 0;

function calculateDistance2D(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function getClosestHandToFaceRegion(
  hands: { landmarks: { x: number; y: number; z: number }[] }[],
  faceLandmarks: { x: number; y: number; z: number }[],
  region: string,
): { distance: number; handIndex: number } | null {
  const regionIndices = FACE_REGION_LANDMARKS[region];
  if (!regionIndices || hands.length === 0 || faceLandmarks.length === 0) return null;

  const regionCenter = {
    x: regionIndices.reduce((sum, i) => sum + (faceLandmarks[i]?.x ?? 0), 0) / regionIndices.length,
    y: regionIndices.reduce((sum, i) => sum + (faceLandmarks[i]?.y ?? 0), 0) / regionIndices.length,
  };

  let minDist = Infinity;
  let bestHand = 0;

  for (let h = 0; h < hands.length; h++) {
    const hand = hands[h];
    for (const tipIdx of HAND_FINGERTIP_INDICES) {
      const tip = hand.landmarks[tipIdx];
      if (!tip) continue;
      const dist = calculateDistance2D(tip, regionCenter);
      if (dist < minDist) {
        minDist = dist;
        bestHand = h;
      }
    }
    const palm = hand.landmarks[HAND_PALM_INDEX];
    if (palm) {
      const dist = calculateDistance2D(palm, regionCenter);
      if (dist < minDist) {
        minDist = dist;
        bestHand = h;
      }
    }
  }

  return { distance: minDist, handIndex: bestHand };
}

export const FACE_HAND_EXERCISE_CONFIGS: Record<string, FaceHandRepConfig> = {
  face_hand_cheek_massage: {
    poseId: "face_hand_cheek_massage",
    handTarget: "cheek_right",
    proximityThreshold: 0.08,
    holdDurationMs: 2000,
    repTarget: 5,
    feedbackKey: "feedbackCheekMassage",
    barLabelKey: "cheekMassageLevel",
  },

  face_hand_forehead_smooth: {
    poseId: "face_hand_forehead_smooth",
    handTarget: "forehead",
    proximityThreshold: 0.08,
    holdDurationMs: 3000,
    repTarget: 5,
    feedbackKey: "feedbackForeheadSmooth",
    barLabelKey: "foreheadSmoothLevel",
  },

  face_hand_jaw_release: {
    poseId: "face_hand_jaw_release",
    handTarget: "chin",
    requiredBlendshape: "jawOpen",
    blendshapeThreshold: 0.3,
    proximityThreshold: 0.08,
    holdDurationMs: 2500,
    repTarget: 5,
    feedbackKey: "feedbackJawRelease",
    barLabelKey: "jawReleaseLevel",
  },
  face_hand_eye_press: {
    poseId: "face_hand_eye_press",
    handTarget: "eye_left",
    proximityThreshold: 0.08,
    holdDurationMs: 2000,
    repTarget: 5,
    feedbackKey: "feedbackEyePress",
    barLabelKey: "eyePressLevel",
  },
  face_hand_temple_massage: {
    poseId: "face_hand_temple_massage",
    handTarget: "temple_left",
    proximityThreshold: 0.08,
    holdDurationMs: 2500,
    repTarget: 5,
    feedbackKey: "feedbackTempleMassage",
    barLabelKey: "templeMassageLevel",
  },
  face_hand_nose_bridge: {
    poseId: "face_hand_nose_bridge",
    handTarget: "nose_bridge",
    proximityThreshold: 0.08,
    holdDurationMs: 2000,
    repTarget: 5,
    feedbackKey: "feedbackNoseBridge",
    barLabelKey: "noseBridgeLevel",
  },
  face_hand_chin_lift: {
    poseId: "face_hand_chin_lift",
    handTarget: "chin",
    proximityThreshold: 0.08,
    holdDurationMs: 3000,
    repTarget: 5,
    feedbackKey: "feedbackChinLift",
    barLabelKey: "chinLiftLevel",
  },
  face_hand_lip_press: {
    poseId: "face_hand_lip_press",
    handTarget: "lips",
    requiredBlendshape: "mouthPressLeft",
    blendshapeThreshold: 0.25,
    proximityThreshold: 0.08,
    holdDurationMs: 2000,
    repTarget: 5,
    feedbackKey: "feedbackLipPress",
    barLabelKey: "lipPressLevel",
  },
  face_hand_brow_smooth: {
    poseId: "face_hand_brow_smooth",
    handTarget: "between_brows",
    proximityThreshold: 0.08,
    holdDurationMs: 2500,
    repTarget: 5,
    feedbackKey: "feedbackBrowSmooth",
    barLabelKey: "browSmoothLevel",
  },
  face_hand_neck_side: {
    poseId: "face_hand_neck_side",
    handTarget: "neck_left",
    proximityThreshold: 0.1,
    holdDurationMs: 3000,
    repTarget: 5,
    feedbackKey: "feedbackNeckSide",
    barLabelKey: "neckSideLevel",
  },
  face_hand_cheek_lift: {
    poseId: "face_hand_cheek_lift",
    handTarget: "cheek_left",
    proximityThreshold: 0.08,
    holdDurationMs: 2500,
    repTarget: 5,
    feedbackKey: "feedbackCheekLift",
    barLabelKey: "cheekLiftLevel",
  },
  face_hand_jaw_side: {
    poseId: "face_hand_jaw_side",
    handTarget: "jaw_left",
    requiredBlendshape: "jawRight",
    blendshapeThreshold: 0.12,
    proximityThreshold: 0.08,
    holdDurationMs: 2500,
    repTarget: 5,
    feedbackKey: "feedbackJawSide",
    barLabelKey: "jawSideLevel",
  },
  face_hand_eye_brow_lift: {
    poseId: "face_hand_eye_brow_lift",
    handTarget: "forehead",
    requiredBlendshape: "eyeWideLeft",
    blendshapeThreshold: 0.3,
    proximityThreshold: 0.08,
    holdDurationMs: 2000,
    repTarget: 5,
    feedbackKey: "feedbackEyeBrowLift",
    barLabelKey: "eyeBrowLiftLevel",
  },
};

function createFaceHandRepCounter(poseId: string, customRepTarget?: number) {
  const config = FACE_HAND_EXERCISE_CONFIGS[poseId];
  if (!config) return null;

  const target = customRepTarget && customRepTarget > 0 ? customRepTarget : config.repTarget;
  let reps = 0;
  let holdStartTime = 0;
  let isHolding = false;
  let currentProximity = 0;

  function update(
    hands: { landmarks: { x: number; y: number; z: number }[] }[],
    faceLandmarks: { x: number; y: number; z: number }[],
    blendshapes?: Map<string, number>,
  ): FaceHandRepResult {
    if (reps >= target) {
      return {
        reps: target,
        target,
        handNearFace: false,
        holdProgress: 1,
        isComplete: true,
        progress: 1,
        feedbackKey: config.feedbackKey,
        feedbackState: "complete",
        currentProximity: 0,
        barLabelKey: config.barLabelKey,
      };
    }

    const closest = getClosestHandToFaceRegion(hands, faceLandmarks, config.handTarget);
    currentProximity = closest ? 1 - Math.min(closest.distance / 0.2, 1) : 0;

    const handNearFace = closest !== null && closest.distance < config.proximityThreshold;

    let blendshapeOk = true;
    if (config.requiredBlendshape && blendshapes) {
      const val = blendshapes.get(config.requiredBlendshape) ?? 0;
      blendshapeOk = val >= (config.blendshapeThreshold ?? 0.3);
    }

    const conditionMet = handNearFace && blendshapeOk;

    let holdProgress = 0;
    let feedbackState: FaceHandFeedbackState = "guide_hand";

    if (conditionMet) {
      if (!isHolding) {
        isHolding = true;
        holdStartTime = Date.now();
      }

      const elapsed = Date.now() - holdStartTime;
      holdProgress = Math.min(elapsed / config.holdDurationMs, 1);

      if (elapsed >= config.holdDurationMs) {
        reps++;
        isHolding = false;
        holdStartTime = 0;
        feedbackState = reps >= target ? "complete" : "good";
      } else {
        feedbackState = "hold";
      }
    } else {
      if (isHolding) {
        isHolding = false;
        holdStartTime = 0;
      }

      if (handNearFace && !blendshapeOk) {
        feedbackState = "guide_action";
      } else {
        feedbackState = "guide_hand";
      }
    }

    return {
      reps,
      target,
      handNearFace,
      holdProgress,
      isComplete: reps >= target,
      progress: Math.min(reps / target, 1),
      feedbackKey: config.feedbackKey,
      feedbackState,
      currentProximity,
      barLabelKey: config.barLabelKey,
    };
  }

  function reset() {
    reps = 0;
    holdStartTime = 0;
    isHolding = false;
    currentProximity = 0;
  }

  return { update, reset, getConfig: () => config };
}

export { createFaceHandRepCounter };
