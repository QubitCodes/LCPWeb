import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : {};

        if (Object.keys(serviceAccount).length === 0) {
            console.warn('FIREBASE_SERVICE_ACCOUNT_KEY is missing in environment variables. Firebase Admin not initialized.');
            // Skip initialization to prevent unwanted crashes during development where firebase might not be needed
        } else {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: "https://lcpapp-acbc3-default-rtdb.firebaseio.com"
            });
        }
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

export const firebaseAdmin = admin;
