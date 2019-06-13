import authConfig from './firebase-auth'
import firebase from '@firebase/app'
import '@firebase/firestore'
import '@firebase/auth'
import '@firebase/storage'

firebase.initializeApp(authConfig)

const db = firebase.firestore()
const auth = firebase.auth()
const fireStoreAuth = async () => {
  if (window.hasOwnProperty('ehanlinToken')) {
    const token = window.ehanlinToken
    try {
      await auth.signInWithCustomToken(token)
    } catch (error) {
      console.error(error)
    }
  }
}

export {
  firebase,
  db,
  auth,
  fireStoreAuth
}