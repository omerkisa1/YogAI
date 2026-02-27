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
  description: string;
  total_duration: number;
  poses: PoseItem[];
}

export interface PoseItem {
  name: string;
  duration_seconds: number;
  description: string;
  difficulty: string;
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
