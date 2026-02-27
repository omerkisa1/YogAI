export interface APIResponse<T = unknown> {
  status: number;
  message: string;
  data?: T;
}

export interface YogaPlan {
  id: string;
  plan_en: PlanDetail;
  plan_tr: PlanDetail;
  level: string;
  duration: number;
  focus_area: string;
  is_favorite: boolean;
  is_pinned: boolean;
  created_at: string;
}

export interface PlanDetail {
  title: string;
  focus_area: string;
  difficulty: string;
  total_duration_min: number;
  is_favorite: boolean;
  is_pinned: boolean;
  description: string;
  exercises: ExerciseItem[];
}

export interface ExerciseItem {
  name: string;
  duration_min: number;
  instructions: string;
  focus_point: string;
  benefit: string;
}

export interface PoseAnalysis {
  pose_name: string;
  alignment_tips: string[];
  common_mistakes: string[];
  modifications: string[];
  benefits: string[];
}

export interface GeneratePlanRequest {
  level: string;
  duration: number;
  focus_area?: string;
  preferences?: string;
  language?: string;
}

export interface AnalyzePoseRequest {
  pose_name: string;
  description: string;
}

export interface GeneratePlanResponse {
  plan_id: string;
  plan_en: PlanDetail;
  plan_tr: PlanDetail;
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
  created_at: string;
  updated_at: string;
}
