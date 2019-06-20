import authConfig from './firebase-auth'
import firebase from '@firebase/app'
import '@firebase/firestore'
import '@firebase/auth'
import '@firebase/storage'
import showModal from '../util/show-modal'
import { AuthText } from '../util/modal-text'

firebase.initializeApp(authConfig)

const db = firebase.firestore()
const auth = firebase.auth()
const ehanlinAuth = async () => {
  let token = ''
  let ehanlinUser = ''

  if (window.ehanlinUser) {
    return window.ehanlinUser
  }

  try {
    if (window.location.host.indexOf('localhost') >= 0) {
      await $.ajax({
        url: 'http://labs.ehanlin.com.tw/coach-web/token.js',
        dataType: 'script',
      })
      token = window.ehanlinToken
      ehanlinUser = window.ehanlinUser
    } else {
      let result = await $.get('/coach-web/token')
      token = result.token
      ehanlinUser = result.user
    }
  } catch (error) {
    console.error(error.message)
  }

  if (!ehanlinUser) {
    showModal(AuthText.WARNING)
    throw AuthText.WARNING
  }

  try {
    await auth.signInWithCustomToken(token)
  } catch (error) {
    console.error(error.message)
  }

  return ehanlinUser
}

export {
  firebase,
  db,
  auth,
  ehanlinAuth
}