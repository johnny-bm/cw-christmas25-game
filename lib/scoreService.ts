// Score service - uses Firebase when available, falls back to localStorage

import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

export interface ScoreEntry {
  id: string;
  player_name: string;
  distance: number;
  max_combo?: number;
  grinch_score?: number;
  elf_score?: number;
  email?: string;
  prize_selection?: 'consultation' | 'discount';
  created_at: string;
}

class ScoreService {
  private readonly STORAGE_KEY = 'escapeTheDeadline_scores';
  private readonly MAX_SCORES = 10;

  private get scoresCollection() {
    return collection(db, "scores");
  }

  // Firebase version of getTopScores
  async getTopScores(limitCount: number = 10): Promise<ScoreEntry[]> {
    try {
      const q = query(
        this.scoresCollection,
        orderBy("distance", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      const scores: ScoreEntry[] = snapshot.docs.map((doc) => {
        const data = doc.data() as any;
        return {
          id: doc.id,
          player_name: data.player_name,
          distance: data.distance,
          max_combo: data.max_combo,
          grinch_score: data.grinch_score,
          elf_score: data.elf_score,
          email: data.email, // Note: email is not displayed in UI, only stored
          prize_selection: data.prize_selection,
          created_at: data.created_at ?? new Date().toISOString(),
        };
      });

      return scores;
    } catch (error) {
      console.error("Error loading scores from Firebase:", error);
      // fall back to local storage
      return this.getLocalScores(limitCount);
    }
  }

  // Firebase version of saveScore
  async saveScore(playerName: string, distance: number, maxCombo?: number, grinchScore?: number, elfScore?: number, email?: string, prizeSelection?: 'consultation' | 'discount'): Promise<ScoreEntry> {
    const newScore: ScoreEntry = {
      id: Date.now().toString(),
      player_name: playerName,
      distance,
      max_combo: maxCombo,
      grinch_score: grinchScore,
      elf_score: elfScore,
      email: email,
      prize_selection: prizeSelection,
      created_at: new Date().toISOString(),
    };

    try {
      const docData: any = {
        player_name: playerName,
        distance,
        max_combo: maxCombo ?? 0,
        grinch_score: grinchScore ?? 0,
        elf_score: elfScore ?? 0,
        created_at: newScore.created_at,
      };
      
      // Only include email if provided
      if (email && email.trim()) {
        docData.email = email.trim();
      }
      
      // Only include prize selection if provided
      if (prizeSelection) {
        docData.prize_selection = prizeSelection;
      }
      
      const docRef = await addDoc(this.scoresCollection, docData);

      return { ...newScore, id: docRef.id };
    } catch (error) {
      console.error("Error saving score to Firebase:", error);
      // fall back to local storage
      return this.saveLocalScore(playerName, distance, maxCombo, grinchScore, elfScore, email, prizeSelection);
    }
  }

  // Check if a score makes it to the leaderboard
  async isTopScore(distance: number): Promise<boolean> {
    const topScores = await this.getTopScores(this.MAX_SCORES);
    
    if (topScores.length < this.MAX_SCORES) {
      return true;
    }
    
    return distance > topScores[topScores.length - 1].distance;
  }

  // Check if a score is in top 3 and get position
  async getTop3Position(distance: number): Promise<{ isTop3: boolean; position: number | null }> {
    const topScores = await this.getTopScores(3);
    
    if (topScores.length === 0) {
      return { isTop3: true, position: 1 };
    }
    
    // Check if score would be in top 3
    for (let i = 0; i < topScores.length; i++) {
      if (distance > topScores[i].distance) {
        return { isTop3: true, position: i + 1 };
      }
    }
    
    // Check if score equals the 3rd place (or if there are fewer than 3 scores)
    if (topScores.length < 3) {
      return { isTop3: true, position: topScores.length + 1 };
    }
    
    // If score equals 3rd place, it's still top 3
    if (distance === topScores[2].distance) {
      return { isTop3: true, position: 3 };
    }
    
    return { isTop3: false, position: null };
  }

  // Get total count of scores
  async getTotalCount(): Promise<number> {
    try {
      // Get all scores from Firebase (without limit to count them)
      const snapshot = await getDocs(this.scoresCollection);
      return snapshot.size;
    } catch (error) {
      console.error("Error getting total count from Firebase:", error);
      // fall back to local storage
      return this.getLocalScoresCount();
    }
  }

  // Helper: Get scores from localStorage
  private getLocalScores(limit: number): ScoreEntry[] {
    try {
      const scoresJson = localStorage.getItem(this.STORAGE_KEY);
      if (!scoresJson) return [];
      
      const scores: ScoreEntry[] = JSON.parse(scoresJson);
      return scores
        .sort((a, b) => b.distance - a.distance)
        .slice(0, limit);
    } catch (error) {
      console.error('Error loading local scores:', error);
      return [];
    }
  }

  // Helper: Get total count from localStorage
  private getLocalScoresCount(): number {
    try {
      const scoresJson = localStorage.getItem(this.STORAGE_KEY);
      if (!scoresJson) return 0;
      
      const scores: ScoreEntry[] = JSON.parse(scoresJson);
      return scores.length;
    } catch (error) {
      console.error('Error getting local scores count:', error);
      return 0;
    }
  }

  // Helper: Save score to localStorage
  private saveLocalScore(playerName: string, distance: number, maxCombo?: number, grinchScore?: number, elfScore?: number, email?: string, prizeSelection?: 'consultation' | 'discount'): ScoreEntry {
    const newScore: ScoreEntry = {
      id: Date.now().toString(),
      player_name: playerName,
      distance: distance,
      max_combo: maxCombo,
      grinch_score: grinchScore,
      elf_score: elfScore,
      email: email,
      prize_selection: prizeSelection,
      created_at: new Date().toISOString()
    };

    const scoresJson = localStorage.getItem(this.STORAGE_KEY);
    const scores: ScoreEntry[] = scoresJson ? JSON.parse(scoresJson) : [];
    
    scores.push(newScore);
    
    // Keep only top scores
    const topScores = scores
      .sort((a, b) => b.distance - a.distance)
      .slice(0, this.MAX_SCORES);
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(topScores));
    
    return newScore;
  }
}

export const scoreService = new ScoreService();
