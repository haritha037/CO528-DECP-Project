export interface AuthUser {
  uid: string;
  email: string | null;
  role: string | null;
}

export interface AuthService {
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void;
  getIdToken(): Promise<string | null>;
  updatePassword(newPassword: string): Promise<void>;
}
