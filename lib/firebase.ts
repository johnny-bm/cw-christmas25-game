import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyArYZSVQdexBaE3mKNSOBC3M7ldD19LESo",
  authDomain: "cw-game-a42eb.firebaseapp.com",
  projectId: "cw-game-a42eb",
  storageBucket: "cw-game-a42eb.firebasestorage.app",
  messagingSenderId: "767941381110",
  appId: "1:767941381110:web:46e8d3d816ac6c6d6c95d7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
