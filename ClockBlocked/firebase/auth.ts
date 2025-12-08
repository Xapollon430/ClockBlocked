import {
  getAuth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
} from "@react-native-firebase/auth";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "@react-native-firebase/firestore";

export type User = {
  uid: string;
  email: string | null;
};

export const configureGoogleSignIn = () => {
  GoogleSignin.configure({
    webClientId:
      "213976273353-ioajf2p318slnnmqpb1m3g1rc6lq6hvu.apps.googleusercontent.com",
    offlineAccess: true,
  });
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    // Check if your device supports Google Play Services
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    // Get the user's ID token
    const signInResult = await GoogleSignin.signIn();

    if (!signInResult?.data?.idToken) {
      throw new Error("No ID token received from Google Sign-In");
    }

    const idToken = signInResult.data.idToken;

    // Create a Google credential with the token
    const auth = getAuth();
    const googleCredential = GoogleAuthProvider.credential(idToken);

    // Sign in the user with the credential
    const userCredential = await signInWithCredential(auth, googleCredential);

    const user = userCredential.user;

    if (!user) {
      throw new Error("No user returned from Firebase");
    }

    const userData = {
      uid: user.uid,
      email: user.email,
    };

    // Create user document in Firestore if it doesn't exist
    const db = getFirestore();
    const userDoc = await getDoc(doc(db, "users", user.uid));
    console.log(userDoc);
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
      });
    }

    return userData;
  } catch (error: any) {
    console.error("Google Sign-In Error:", error);
    throw new Error(error.message || "Failed to sign in with Google");
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await GoogleSignin.signOut();
    const auth = getAuth();
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error("Sign Out Error:", error);
    throw new Error(error.message || "Failed to sign out");
  }
};
