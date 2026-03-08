import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  updatePassword as firebaseUpdatePassword,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { AuthService, AuthUser } from './AuthService';

export class FirebaseAuthService implements AuthService {
  async signIn(email: string, password: string): Promise<AuthUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Sync the role stored in PostgreSQL into Firebase custom claims.
    // This is necessary for users created via seed data or whose claims
    // were never set (e.g. the bootstrap admin).
    try {
      const token = await user.getIdToken();
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile/sync-claims`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      // Force-refresh so the next getIdToken() returns a token with the updated role claim.
      await user.getIdToken(true);
    } catch {
      // Non-fatal: if sync fails (e.g. user not in DB yet) proceed with login anyway.
    }

    return this.mapUser(user);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    return firebaseOnAuthStateChanged(auth, async (user) => {
      if (user) {
        callback(await this.mapUser(user));
      } else {
        callback(null);
      }
    });
  }

  async getIdToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (user) {
      await firebaseUpdatePassword(user, newPassword);
    } else {
      throw new Error('No authenticated user');
    }
  }

  private async mapUser(firebaseUser: FirebaseUser): Promise<AuthUser> {
    const tokenResult = await firebaseUser.getIdTokenResult();
    const role = tokenResult.claims.role as string | undefined || "STUDENT";
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      role: role
    };
  }
}
