import authConfig from './firebase-auth'
import firebase from '@firebase/app'
import '@firebase/firestore'
import '@firebase/auth'
import '@firebase/storage'

firebase.initializeApp(authConfig)

const db = firebase.firestore()
const auth = firebase.auth()
const ehanlinAuth = async () => {
  let token = ''
  let ehanlinUser = ''
  if (window.ehanlinUser) {
    return window.ehanlinUser
  }

  if (window.location.host.indexOf('localhost') >= 0) {
    try {
      await $.ajax({
        url: 'http://labs.ehanlin.com.tw/coach-web/token.js',
        dataType: 'script',
      })
      token = window.ehanlinToken
      ehanlinUser = window.ehanlinUser
    } catch (error) {
      console.error(error)
    }
  } else {
    let result = await $.get('/coach-web/token')
    token = result.token
    ehanlinUser = result.user
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