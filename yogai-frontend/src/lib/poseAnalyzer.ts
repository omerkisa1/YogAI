// src/lib/poseAnalyzer.ts
// Pure client-side pose analysis — no React dependency, no backend calls, fully testable.

export interface LandmarkPoint {
  index: number;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface LandmarkRule {
  joint: string;
  point_a: number;
  point_b: number;
  point_c: number;
  angle_min: number;
  angle_max: number;
  weight: number;
  rule_type: string; // "target" | "fault"
  feedback_en: string;
  feedback_tr: string;
}

export interface RuleResult {
  joint: string;
  rule_type: string;
  expected_range: [number, number];
  actual_angle: number;
  score: number;
  triggered: boolean;
  penalty: number;
  status: string; // "good" | "needs_improvement" | "poor" | "fault_detected" | "ok" | "low_visibility"
  feedback_en: string;
  feedback_tr: string;
}

export interface AnalyzeResult {
  pose_id: string;
  overall_accuracy: number;
  target_score: number;
  fault_penalty: number;
  rules: RuleResult[];
}

/** Degrees of tolerance outside the target range before score hits 0 */
const TOLERANCE = 15.0;

/**
 * Calculates the angle at vertex B formed by points A–B–C.
 * Returns a value in [0, 180] degrees.
 */
function calculateAngle(a: LandmarkPoint, b: LandmarkPoint, c: LandmarkPoint): number {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * (180.0 / Math.PI));
  if (angle > 180.0) {
    angle = 360.0 - angle;
  }
  return angle;
}

/**
 * Scores how well the actual angle fits the expected range.
 * Inside range → 100. Linear decay to 0 over TOLERANCE degrees outside.
 */
function scoreRule(actual: number, angleMin: number, angleMax: number): number {
  if (actual >= angleMin && actual <= angleMax) return 100.0;
  const deviation = Math.min(
    Math.abs(actual - angleMin),
    Math.abs(actual - angleMax),
  );
  if (deviation >= TOLERANCE) return 0.0;
  return (1.0 - deviation / TOLERANCE) * 100.0;
}

/**
 * Analyzes a pose entirely on the client side.
 * Receives rules fetched once from the backend and per-frame landmark data
 * produced by MediaPipe. Returns a scored result with per-rule breakdown.
 * Never makes network requests.
 */
export function analyzePoseClientSide(
  poseId: string,
  rules: LandmarkRule[],
  landmarks: LandmarkPoint[],
): AnalyzeResult {
  const lm = new Map<number, LandmarkPoint>();
  for (const p of landmarks) {
    lm.set(p.index, p);
  }

  const results: RuleResult[] = [];
  let targetWeightSum = 0;
  let targetScoreSum = 0;
  let faultPenalty = 0;

  for (const rule of rules) {
    const a = lm.get(rule.point_a);
    const b = lm.get(rule.point_b);
    const c = lm.get(rule.point_c);

    if (
      !a ||
      !b ||
      !c ||
      a.visibility < 0.5 ||
      b.visibility < 0.5 ||
      c.visibility < 0.5
    ) {
      results.push({
        joint: rule.joint,
        rule_type: rule.rule_type || "target",
        expected_range: [rule.angle_min, rule.angle_max],
        actual_angle: 0,
        score: 0,
        triggered: false,
        penalty: 0,
        status: "low_visibility",
        feedback_en: "",
        feedback_tr: "",
      });
      continue;
    }

    const angle = calculateAngle(a, b, c);
    const ruleType = rule.rule_type || "target";

    const rr: RuleResult = {
      joint: rule.joint,
      rule_type: ruleType,
      expected_range: [rule.angle_min, rule.angle_max],
      actual_angle: Math.round(angle * 10) / 10,
      score: 0,
      triggered: false,
      penalty: 0,
      status: "",
      feedback_en: "",
      feedback_tr: "",
    };

    if (ruleType === "target") {
      const score = scoreRule(angle, rule.angle_min, rule.angle_max);
      rr.score = Math.round(score * 10) / 10;
      targetWeightSum += rule.weight;
      targetScoreSum += score * rule.weight;

      if (score >= 90) {
        rr.status = "good";
      } else if (score >= 60) {
        rr.status = "needs_improvement";
        rr.feedback_en = rule.feedback_en;
        rr.feedback_tr = rule.feedback_tr;
      } else {
        rr.status = "poor";
        rr.feedback_en = rule.feedback_en;
        rr.feedback_tr = rule.feedback_tr;
      }
    } else if (ruleType === "fault") {
      if (angle >= rule.angle_min && angle <= rule.angle_max) {
        rr.triggered = true;
        rr.penalty = rule.weight * 100;
        rr.status = "fault_detected";
        rr.feedback_en = rule.feedback_en;
        rr.feedback_tr = rule.feedback_tr;
        faultPenalty += rr.penalty;
      } else {
        rr.triggered = false;
        rr.status = "ok";
      }
    }

    results.push(rr);
  }

  let targetScore = targetWeightSum > 0 ? targetScoreSum / targetWeightSum : 0;
  let overall = Math.max(0, Math.min(100, targetScore - faultPenalty));

  return {
    pose_id: poseId,
    overall_accuracy: Math.round(overall * 10) / 10,
    target_score: Math.round(targetScore * 10) / 10,
    fault_penalty: Math.round(faultPenalty * 10) / 10,
    rules: results,
  };
}
