export interface JwtPayload {
  id: string;
  username: string;
  role: 'admin' | 'user';
}

export interface RequestParams {
  [key: string]: string;
}

export interface Data<T> {
  data: T;
}

export interface ErrorResponse {
  message: string;
  errors?: string[];
}
