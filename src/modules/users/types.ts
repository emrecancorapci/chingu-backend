export interface UserBody {
  email: string;
  password: string;
  username: string;
  role: 'admin' | 'user';
}
