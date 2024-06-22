export interface ErrorResponse {
  message: string;
}

export interface AuthToken {
  id: string;
  username: string;
  role: "admin" | "user";
}

export interface Id {
  id: string;
}

export interface TableDate {
  created_at: number;
  updated_at: number;
}
