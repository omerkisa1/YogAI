export interface APIResponse<T = unknown> {
  status: number;
  message: string;
  data?: T;
}

export interface YogaPlan {
  id: string;
  plan: PlanDetail;
  level: string;
  duration: number;
  focus_area: string;
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
}

export interface AnalyzePoseRequest {
  pose_name: string;
  description: string;
}

export interface GeneratePlanResponse {
  plan_id: string;
  plan: PlanDetail;
}

export interface PlansListResponse {
  plans: YogaPlan[];
  count: number;
}
