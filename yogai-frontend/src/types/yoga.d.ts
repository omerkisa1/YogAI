export interface APIResponse<T = unknown> {
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
}

export interface YogaPlan {
  id: string;
  plan: BilingualPlan;
  level: string;
  duration: number;
  focus_area: string;
  is_favorite: boolean;
  is_pinned: boolean;
  created_at: string;
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
  expected_range: number[];
  actual_angle: number;
  rule_type: string;
  score?: number;
  penalty?: number;
  triggered?: boolean;
  status: string;
  feedback_en?: string;
  feedback_tr?: string;
}

export interface AnalyzeResponse {
  pose_id: string;
  overall_accuracy: number;
  target_score: number;
  fault_penalty: number;
  rules: RuleResult[];
  feedback_en?: string;
  feedback_tr?: string;
}

export interface GeneratePlanRequest {
  level: string;
  duration: number;
  focus_area?: string;
  preferences?: string;
}

export interface GeneratePlanResponse {
  id: string;
  plan: BilingualPlan;
  level: string;
  duration: number;
  focus_area: string;
  is_favorite: boolean;
  is_pinned: boolean;
  created_at: string;
}

export interface PlansListResponse {
  plans: YogaPlan[];
  count: number;
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
  platform?: string;
  last_login_at?: string;
  auth_provider?: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyzablePose {
  pose_id: string;
  name_en: string;
  name_tr: string;
  category: string;
  difficulty: number;
  target_area: string;
  instructions_en: string;
  instructions_tr: string;
}
