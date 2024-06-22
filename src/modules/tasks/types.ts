export interface TaskBody {
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | null;
  userId: string;
  completed_at: number | null;
  due_date: number | null;
  created_at: number;
  updated_at: number;
}
