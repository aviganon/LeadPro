import * as admin from 'firebase-admin'

function initAdmin(): admin.app.App {
  if (admin.apps.length > 0) return admin.app()

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  if (raw) {
    const cred = JSON.parse(raw) as admin.ServiceAccount
    admin.initializeApp({ credential: admin.credential.cert(cred) })
  } else {
    admin.initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    })
  }
  return admin.app()
}

export function getAdminAuth(): admin.auth.Auth {
  return initAdmin().auth()
}

export function getAdminFirestore(): admin.firestore.Firestore {
  return initAdmin().firestore()
}
