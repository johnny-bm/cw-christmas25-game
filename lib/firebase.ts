import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBA_862UUG17V6-fjLafN5WwuLQqrjTewE",
  authDomain: "cw-internal-game.firebaseapp.com",
  projectId: "cw-internal-game",
  storageBucket: "cw-internal-game.firebasestorage.app",
  messagingSenderId: "206902423956",
  appId: "1:206902423956:web:ac7217d6c797f77e3edf81"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
