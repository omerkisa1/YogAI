export interface APIResponse<T> {
  status: number;
  message: string;
  data?: T;
}

export interface BilingualExercise {
  pose_id: string;
  name_en: string;
  name_tr: string;
  duration_min: number;
  instructions_en: string;
  instructions_tr: string;
  benefit_en: string;
  benefit_tr: string;
  target_area: string;
  category: string;
  is_analyzable: boolean;
}

export interface BilingualPlan {
  title_en: string;
  title_tr: string;
  focus_area: string;
  difficulty: string;
  total_duration_min: number;
  description_en: string;
  description_tr: string;
  is_favorite: boolean;
  is_pinned: boolean;
  exercises: BilingualExercise[];
  analyzable_pose_count: number;
  total_pose_count: number;
  source?: "ai" | "custom";
}

export interface YogaPlan {
  id: string;
  plan_en: BilingualPlan;
  plan_tr: BilingualPlan;
  created_at: string;
  updated_at?: string;
  level?: string;
  duration?: number;
  focus_area?: string;
  source?: string;
  is_favorite?: boolean;
  is_pinned?: boolean;
}

export interface GeneratePlanRequest {
  level: string;
  duration: number;
  focus_area: string;
  preferences?: string;
  injuries?: string[];
}

export interface CustomPlanRequest {
  title: string;
  exercises: { pose_id: string; duration_min: number }[];
}

export interface CustomPlanResponse {
  plan: YogaPlan;
  warnings?: string[];
}

export interface LandmarkRule {
  joint: string;
  point_a: number;
  point_b: number;
  point_c: number;
  angle_min: number;
  angle_max: number;
  weight: number;
  rule_type: string;
  feedback_en: string;
  feedback_tr: string;
}

export interface Pose {
  pose_id: string;
  name_en: string;
  name_tr: string;
  category: string;
  difficulty: number;
  target_area: string;
  instructions_en: string;
  instructions_tr: string;
  contraindications: string[];
  landmark_rules: LandmarkRule[];
  is_analyzable: boolean;
  analysis_kind: "body" | "face" | "face_hand";
  metric_type: "accuracy" | "reps";
  rep_target: number;
}

export interface PoseLandmark {
  index: number;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface AnalyzePoseRequest {
  pose_id: string;
  landmarks: PoseLandmark[];
}

export interface RuleResult {
  joint: string;
  rule_type: string;
  expected_range: [number, number];
  actual_angle: number;
  score: number;
  triggered: boolean;
  penalty: number;
  status: string;
  feedback_en: string;
  feedback_tr: string;
}

export interface AnalyzeResponse {
  pose_id: string;
  overall_accuracy: number;
  target_score: number;
  fault_penalty: number;
  rules: RuleResult[];
}

export interface UserProfile {
  display_name: string;
  birth_year: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  fitness_level: string;
  injuries: string[];
  goals: string[];
  preferred_duration: number;
  profile_image_url: string;
  platform: string;
  auth_provider: string;
  last_login_at: string;
  created_at: string;
  updated_at: string;
}

export interface TrainingSessionStart {
  session_id: string;
  status: string;
}

export interface TrainingSession {
  id: string;
  plan_id: string;
  plan_title?: string;
  status: string;
  started_at: string;
  completed_at?: string | null;
  average_accuracy: number;
  total_duration_sec: number;
  pose_count: number;
  results?: PoseResult[];
}

export interface PoseResult {
  pose_id: string;
  accuracy: number;
  duration_seconds: number;
  completed_at: string;
}

export interface TrainingStats {
  total_sessions: number;
  total_duration_sec: number;
  average_accuracy: number;
  current_streak: number;
}
