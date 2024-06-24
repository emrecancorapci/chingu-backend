export interface ErrorResponse {
  message: string;
}

export interface JwtPayload {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export interface Id {
  id: string;
}

export interface TableDate {
  created_at: number;
  updated_at: number;
}

export interface AuthLocal {
  user: JwtPayload;
}
