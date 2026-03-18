import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { AuthService, AuthUser } from './AuthService';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

class FirebaseAuthServiceImpl implements AuthService {
  async signIn(email: string, password: string): Promise<AuthUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Sync role claims
    try {
      const token = await user.getIdToken();
      console.log(`[AuthService] Syncing claims for ${user.email}...`);
      const response = await fetch(`${API_URL}/api/users/profile/sync-claims`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        console.error(`[AuthService] sync-claims failed: ${response.status}`);
      } else {
        console.log(`[AuthService] sync-claims successful`);
      }
      await user.getIdToken(true);
    } catch (e) {
      console.error(`[AuthService] sync-claims error:`, e);
      // Non-fatal
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

  private async mapUser(firebaseUser: FirebaseUser): Promise<AuthUser> {
    const tokenResult = await firebaseUser.getIdTokenResult();
    const role = (tokenResult.claims.role as string | undefined) || 'STUDENT';
    console.log(`[AuthService] User mapped: ${firebaseUser.email}, UID: ${firebaseUser.uid}, Role: ${role}`);
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      role: role,
    };
  }
}

export const authService = new FirebaseAuthServiceImpl();
