import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

if (!getApps().length) {
  try {
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    initializeApp({
      projectId: firebaseConfig.projectId,
    });
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
