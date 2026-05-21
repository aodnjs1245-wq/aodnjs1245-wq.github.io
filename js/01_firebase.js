/* =========================
   Firebase 초기화
========================= */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-storage.js";

/* Firebase 설정 */
const firebaseConfig = {
    apiKey: "AIzaSyDaBjVsaXHsXg_nHprYkp67KcT_U8_C0w8",
    authDomain: "seohwan-web.firebaseapp.com",
    projectId: "seohwan-web",
    storageBucket: "seohwan-web.firebasestorage.app",
    messagingSenderId: "993044337668",
    appId: "1:993044337668:web:2678eb83c298ad669e1151",
    measurementId: "G-NTLGSN7K3X"
};

/* Firebase 시작 */
const app = initializeApp(firebaseConfig);

/* 서비스 객체 */
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/* 전역 등록 */
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDB = db;
window.firebaseStorage = storage;

export { app, auth, db, storage };