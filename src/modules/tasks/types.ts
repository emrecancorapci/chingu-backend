export interface TaskBody {
  title: string;
  description: string | null;
  user_id: string;
  priority: 'low' | 'medium' | 'high' | null;
  due_date: number | null;
  completed_at: number | null;
  created_at: number;
  updated_at: number;
}
