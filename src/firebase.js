import {initializeApp} from "firebase/app"
import {getFirestore} from "firebase/firestore"
import {getStorage} from "firebase/storage"
import {getAuth} from "firebase/auth"

const firebaseConfig = {
    apiKey: "AIzaSyDt01C-FAbMmfvuyw-iCh3SieD59Zkzkfw",
    authDomain: "blogs-react-app.firebaseapp.com",
    projectId: "blogs-react-app",
    storageBucket: "blogs-react-app.appspot.com",
    messagingSenderId: "650993883811",
    appId: "1:650993883811:web:0951a4ffb30e3e61573d16"
  };

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db = getFirestore(app)
  const storage = getStorage(app)

  export {auth,db, storage}