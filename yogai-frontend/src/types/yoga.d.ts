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
  plan_name: string;
  total_duration: number;
  focus_area: string;
  exercises: ExerciseItem[];
}

export interface ExerciseItem {
  name: string;
  duration: string;
  description: string;
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
