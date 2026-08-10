export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: number;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  confirmPassword?: string;
  fullName?: string;
}

export interface AuthResult {
  user: User | null;
  session: AuthSession | null;
  requiresEmailConfirmation?: boolean;
}

export interface AuthError {
  message: string;
  field?: string;
}
