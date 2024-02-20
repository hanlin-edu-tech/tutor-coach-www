import authConfig from './firebase-auth'
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, onSnapshot, where, orderBy, getDocs } from 'firebase/firestore';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { AuthText } from '../util/modal-text'

const app = initializeApp(authConfig);

const db = getFirestore(app);
const auth = getAuth(app);
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
    await signInWithCustomToken(auth, token)
  } catch (error) {
    console.error(error)
  }

  return ehanlinUser
}

export {
  db,
  collection,
  query,
  onSnapshot,
  where,
  orderBy,
  getDocs,
  auth,
  ehanlinAuth
}
