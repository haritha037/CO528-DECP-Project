import { AuthService } from './AuthService';
import { FirebaseAuthService } from './FirebaseAuthService';

export const authService: AuthService = new FirebaseAuthService();
