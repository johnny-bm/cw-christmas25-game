import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyArYZSVQdexBaE3mKNSOBC3M7ldD19LESo",
  authDomain: "cw-game-a42eb.firebaseapp.com",
  projectId: "cw-game-a42eb",
  storageBucket: "cw-game-a42eb.firebasestorage.app",
  messagingSenderId: "767941381110",
  appId: "1:767941381110:web:d06274637ddd92226c95d7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
