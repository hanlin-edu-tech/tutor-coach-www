import authConfig from './firebase-auth'
import firebase from '@firebase/app'
import '@firebase/firestore'
import '@firebase/auth'
import '@firebase/storage'
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
        url: 'http://www.tbbt.com.tw/coach-web/token.js',
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
    console.error(error)
  }

  if (!ehanlinUser) {
    $('.popup-unlogin').removeClass("hide")
    throw AuthText.WARNING
  }

  try {
    await auth.signInWithCustomToken(token)
  } catch (error) {
    console.error(error)
  }

  return ehanlinUser
}

export {
  firebase,
  db,
  auth,
  ehanlinAuth
}