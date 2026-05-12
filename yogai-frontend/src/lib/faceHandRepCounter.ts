export type FaceHandFeedbackState =
  | "guide_hand"
  | "guide_action"
  | "guide_motion"
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
  motionType?: "hold" | "circular" | "sweep";
  motionAngleTarget?: number;
  sweepTarget?: string;
  sweepDistanceRatio?: number;
  acceptBothHands?: boolean;
  stabilizeMs?: number;
  cooldownMs?: number;
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

type Point2D = { x: number; y: number };
type Landmark = { x: number; y: number; z: number };
type HandPayload = { landmarks: Landmark[] };

type InternalPhase = "guide_hand" | "stabilizing" | "active" | "cooldown";

const CIRCULAR_NOISE_GATE_DEG = 1.5;
const CIRCULAR_MIN_RADIUS = 0.015;

function calculateDistance2D(p1: Point2D, p2: Point2D): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

function getFaceRegionCenter(faceLandmarks: Landmark[], region: string): Point2D | null {
  const indices = FACE_REGION_LANDMARKS[region];
  if (!indices || faceLandmarks.length === 0) return null;
  return {
    x: indices.reduce((sum, i) => sum + (faceLandmarks[i]?.x ?? 0), 0) / indices.length,
    y: indices.reduce((sum, i) => sum + (faceLandmarks[i]?.y ?? 0), 0) / indices.length,
  };
}

function getFaceWidth(faceLandmarks: Landmark[]): number {
  const left = faceLandmarks[54];
  const right = faceLandmarks[284];
  if (!left || !right) return 0.3;
  return Math.max(calculateDistance2D(left, right), 0.05);
}

function getClosestHandInfo(
  hands: HandPayload[],
  faceLandmarks: Landmark[],
  region: string,
): { distance: number; handIndex: number; point: Point2D } | null {
  const regionIndices = FACE_REGION_LANDMARKS[region];
  if (!regionIndices || hands.length === 0 || faceLandmarks.length === 0) return null;

  const regionCenter: Point2D = {
    x: regionIndices.reduce((sum, i) => sum + (faceLandmarks[i]?.x ?? 0), 0) / regionIndices.length,
    y: regionIndices.reduce((sum, i) => sum + (faceLandmarks[i]?.y ?? 0), 0) / regionIndices.length,
  };

  let minDist = Infinity;
  let bestHand = 0;
  let bestPoint: Point2D = { x: 0, y: 0 };

  for (let h = 0; h < hands.length; h++) {
    const hand = hands[h];
    for (const tipIdx of HAND_FINGERTIP_INDICES) {
      const tip = hand.landmarks[tipIdx];
      if (!tip) continue;
      const dist = calculateDistance2D(tip, regionCenter);
      if (dist < minDist) {
        minDist = dist;
        bestHand = h;
        bestPoint = { x: tip.x, y: tip.y };
      }
    }
    const palm = hand.landmarks[HAND_PALM_INDEX];
    if (palm) {
      const dist = calculateDistance2D(palm, regionCenter);
      if (dist < minDist) {
        minDist = dist;
        bestHand = h;
        bestPoint = { x: palm.x, y: palm.y };
      }
    }
  }

  return { distance: minDist, handIndex: bestHand, point: bestPoint };
}

export const FACE_HAND_EXERCISE_CONFIGS: Record<string, FaceHandRepConfig> = {
  face_hand_cheek_massage: {
    poseId: "face_hand_cheek_massage",
    handTarget: "cheek_right",
    proximityThreshold: 0.09,
    holdDurationMs: 2000,
    repTarget: 5,
    feedbackKey: "feedbackCheekMassage",
    barLabelKey: "cheekMassageLevel",
    motionType: "circular",
    motionAngleTarget: 330,
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 800,
  },
  face_hand_forehead_smooth: {
    poseId: "face_hand_forehead_smooth",
    handTarget: "forehead",
    proximityThreshold: 0.09,
    holdDurationMs: 3000,
    repTarget: 5,
    feedbackKey: "feedbackForeheadSmooth",
    barLabelKey: "foreheadSmoothLevel",
    motionType: "sweep",
    sweepTarget: "temple_left",
    sweepDistanceRatio: 0.28,
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 800,
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
    motionType: "hold",
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 600,
  },
  face_hand_eye_press: {
    poseId: "face_hand_eye_press",
    handTarget: "eye_left",
    proximityThreshold: 0.08,
    holdDurationMs: 2000,
    repTarget: 5,
    feedbackKey: "feedbackEyePress",
    barLabelKey: "eyePressLevel",
    motionType: "hold",
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 600,
  },
  face_hand_temple_massage: {
    poseId: "face_hand_temple_massage",
    handTarget: "temple_left",
    proximityThreshold: 0.09,
    holdDurationMs: 2500,
    repTarget: 5,
    feedbackKey: "feedbackTempleMassage",
    barLabelKey: "templeMassageLevel",
    motionType: "circular",
    motionAngleTarget: 330,
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 800,
  },
  face_hand_nose_bridge: {
    poseId: "face_hand_nose_bridge",
    handTarget: "nose_bridge",
    proximityThreshold: 0.08,
    holdDurationMs: 2000,
    repTarget: 5,
    feedbackKey: "feedbackNoseBridge",
    barLabelKey: "noseBridgeLevel",
    motionType: "hold",
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 600,
  },
  face_hand_chin_lift: {
    poseId: "face_hand_chin_lift",
    handTarget: "chin",
    proximityThreshold: 0.08,
    holdDurationMs: 3000,
    repTarget: 5,
    feedbackKey: "feedbackChinLift",
    barLabelKey: "chinLiftLevel",
    motionType: "hold",
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 600,
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
    motionType: "hold",
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 600,
  },
  face_hand_brow_smooth: {
    poseId: "face_hand_brow_smooth",
    handTarget: "between_brows",
    proximityThreshold: 0.09,
    holdDurationMs: 2500,
    repTarget: 5,
    feedbackKey: "feedbackBrowSmooth",
    barLabelKey: "browSmoothLevel",
    motionType: "sweep",
    sweepTarget: "temple_left",
    sweepDistanceRatio: 0.28,
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 800,
  },
  face_hand_neck_side: {
    poseId: "face_hand_neck_side",
    handTarget: "neck_left",
    proximityThreshold: 0.1,
    holdDurationMs: 3000,
    repTarget: 5,
    feedbackKey: "feedbackNeckSide",
    barLabelKey: "neckSideLevel",
    motionType: "hold",
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 600,
  },
  face_hand_cheek_lift: {
    poseId: "face_hand_cheek_lift",
    handTarget: "cheek_left",
    proximityThreshold: 0.08,
    holdDurationMs: 2500,
    repTarget: 5,
    feedbackKey: "feedbackCheekLift",
    barLabelKey: "cheekLiftLevel",
    motionType: "hold",
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 600,
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
    motionType: "hold",
    acceptBothHands: false,
    stabilizeMs: 300,
    cooldownMs: 600,
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
    motionType: "hold",
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 600,
  },
  face_hand_jawline_sculpt: {
    poseId: "face_hand_jawline_sculpt",
    handTarget: "chin",
    proximityThreshold: 0.10,
    holdDurationMs: 2000,
    repTarget: 8,
    feedbackKey: "feedbackJawlineSculpt",
    barLabelKey: "jawlineSculptLevel",
    motionType: "sweep",
    sweepTarget: "jaw_right",
    sweepDistanceRatio: 0.25,
    acceptBothHands: true,
    stabilizeMs: 300,
    cooldownMs: 800,
  },
};

function createFaceHandRepCounter(poseId: string, customRepTarget?: number) {
  const config = FACE_HAND_EXERCISE_CONFIGS[poseId];
  if (!config) return null;

  const target = customRepTarget && customRepTarget > 0 ? customRepTarget : config.repTarget;
  const motionType = config.motionType ?? "hold";
  const stabilizeMs = config.stabilizeMs ?? 300;
  const cooldownMs = config.cooldownMs ?? 800;

  let reps = 0;
  let currentProximity = 0;
  let phase: InternalPhase = "guide_hand";
  let phaseStart = 0;

  let prevAngleRad: number | null = null;
  let cumulativeAngleDeg = 0;

  let sweepStartPos: Point2D | null = null;

  let holdStartTime = 0;

  function resetMotionState() {
    prevAngleRad = null;
    cumulativeAngleDeg = 0;
    sweepStartPos = null;
    holdStartTime = 0;
  }

  function initActivePhase(handPoint: Point2D) {
    resetMotionState();
    if (motionType === "sweep") {
      sweepStartPos = { x: handPoint.x, y: handPoint.y };
    }
    if (motionType === "hold") {
      holdStartTime = Date.now();
    }
  }

  function update(
    hands: HandPayload[],
    faceLandmarks: Landmark[],
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

    const closest = getClosestHandInfo(hands, faceLandmarks, config.handTarget);
    currentProximity = closest ? 1 - Math.min(closest.distance / 0.2, 1) : 0;
    const handNearFace = closest !== null && closest.distance < config.proximityThreshold;

    let blendshapeOk = true;
    if (config.requiredBlendshape && blendshapes) {
      const val = blendshapes.get(config.requiredBlendshape) ?? 0;
      blendshapeOk = val >= (config.blendshapeThreshold ?? 0.3);
    }

    const conditionMet = handNearFace && blendshapeOk;

    if (!conditionMet) {
      if (phase === "cooldown") {
        phase = "guide_hand";
        phaseStart = 0;
        resetMotionState();
      } else if (phase !== "guide_hand") {
        phase = "guide_hand";
        phaseStart = 0;
        resetMotionState();
      }

      const feedbackState: FaceHandFeedbackState =
        handNearFace && !blendshapeOk ? "guide_action" : "guide_hand";

      return {
        reps,
        target,
        handNearFace,
        holdProgress: 0,
        isComplete: false,
        progress: reps / target,
        feedbackKey: config.feedbackKey,
        feedbackState,
        currentProximity,
        barLabelKey: config.barLabelKey,
      };
    }

    const now = Date.now();

    if (phase === "guide_hand") {
      phase = "stabilizing";
      phaseStart = now;
      resetMotionState();
    }

    if (phase === "stabilizing") {
      if (now - phaseStart < stabilizeMs) {
        return {
          reps,
          target,
          handNearFace,
          holdProgress: 0,
          isComplete: false,
          progress: reps / target,
          feedbackKey: config.feedbackKey,
          feedbackState: "guide_hand",
          currentProximity,
          barLabelKey: config.barLabelKey,
        };
      }
      phase = "active";
      phaseStart = now;
      initActivePhase(closest!.point);
    }

    if (phase === "cooldown") {
      if (now - phaseStart < cooldownMs) {
        return {
          reps,
          target,
          handNearFace,
          holdProgress: 1,
          isComplete: false,
          progress: reps / target,
          feedbackKey: config.feedbackKey,
          feedbackState: "good",
          currentProximity,
          barLabelKey: config.barLabelKey,
        };
      }
      phase = "active";
      phaseStart = now;
      initActivePhase(closest!.point);
    }

    let holdProgress = 0;
    let feedbackState: FaceHandFeedbackState = "guide_motion";

    if (motionType === "hold") {
      const elapsed = now - holdStartTime;
      holdProgress = Math.min(elapsed / config.holdDurationMs, 1);

      if (elapsed >= config.holdDurationMs) {
        reps++;
        phase = "cooldown";
        phaseStart = now;
        resetMotionState();
        feedbackState = reps >= target ? "complete" : "good";
      } else {
        feedbackState = "hold";
      }
    } else if (motionType === "circular") {
      const center = getFaceRegionCenter(faceLandmarks, config.handTarget);
      if (center && closest) {
        const { point } = closest;
        const radius = calculateDistance2D(point, center);
        const currentAngle = Math.atan2(point.y - center.y, point.x - center.x);

        if (prevAngleRad !== null && radius >= CIRCULAR_MIN_RADIUS) {
          let delta = currentAngle - prevAngleRad;
          while (delta > Math.PI) delta -= 2 * Math.PI;
          while (delta < -Math.PI) delta += 2 * Math.PI;
          const deltaDeg = Math.abs(delta) * (180 / Math.PI);
          if (deltaDeg >= CIRCULAR_NOISE_GATE_DEG) {
            cumulativeAngleDeg += deltaDeg;
          }
        }
        prevAngleRad = currentAngle;

        const angleTarget = config.motionAngleTarget ?? 330;
        holdProgress = Math.min(cumulativeAngleDeg / angleTarget, 1);

        if (cumulativeAngleDeg >= angleTarget) {
          reps++;
          phase = "cooldown";
          phaseStart = now;
          resetMotionState();
          feedbackState = reps >= target ? "complete" : "good";
        } else if (cumulativeAngleDeg > 20) {
          feedbackState = "hold";
        } else {
          feedbackState = "guide_motion";
        }
      }
    } else if (motionType === "sweep") {
      if (closest && sweepStartPos) {
        const { point } = closest;
        const currentDist = calculateDistance2D(point, sweepStartPos);

        const faceWidth = getFaceWidth(faceLandmarks);
        const sweepRatio = config.sweepDistanceRatio ?? 0.25;
        const sweepThreshold = faceWidth * sweepRatio;

        holdProgress = sweepThreshold > 0 ? Math.min(currentDist / sweepThreshold, 1) : 0;

        if (currentDist >= sweepThreshold) {
          reps++;
          phase = "cooldown";
          phaseStart = now;
          resetMotionState();
          feedbackState = reps >= target ? "complete" : "good";
        } else if (currentDist > 0.008) {
          feedbackState = "hold";
        } else {
          feedbackState = "guide_motion";
        }
      } else {
        feedbackState = "guide_motion";
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
    currentProximity = 0;
    phase = "guide_hand";
    phaseStart = 0;
    resetMotionState();
  }

  return { update, reset, getConfig: () => config };
}

export { createFaceHandRepCounter };
