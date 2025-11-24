// Score service - uses Supabase when available, falls back to localStorage

import { supabase, isSupabaseConfigured } from './supabase';

export interface ScoreEntry {
  id: string;
  player_name: string;
  distance: number;
  max_combo?: number;
  created_at: string;
}

class ScoreService {
  private readonly STORAGE_KEY = 'escapeTheDeadline_scores';
  private readonly MAX_SCORES = 10;

  // Check if Supabase is configured
  isConfigured(): boolean {
    return isSupabaseConfigured && supabase !== null;
  }

  // Get top scores
  async getTopScores(limit: number = 10): Promise<ScoreEntry[]> {
    try {
      // Try Supabase first
      if (this.isConfigured()) {
        const { data, error } = await supabase
          .from('scores')
          .select('*')
          .order('distance', { ascending: false })
          .limit(limit);

        if (error) {
          console.error('Supabase error:', error);
          // Fall back to localStorage on error
          return this.getLocalScores(limit);
        }

        return data || [];
      }

      // Use localStorage if Supabase not configured
      return this.getLocalScores(limit);
    } catch (error) {
      console.error('Error loading scores:', error);
      return this.getLocalScores(limit);
    }
  }

  // Get total count of scores
  async getTotalCount(): Promise<number> {
    try {
      // Try Supabase first
      if (this.isConfigured()) {
        const { count, error } = await supabase
          .from('scores')
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.error('Supabase error:', error);
          // Fall back to localStorage on error
          return this.getLocalScoresCount();
        }

        return count || 0;
      }

      // Use localStorage if Supabase not configured
      return this.getLocalScoresCount();
    } catch (error) {
      console.error('Error getting total count:', error);
      return this.getLocalScoresCount();
    }
  }

  // Save a new score
  async saveScore(playerName: string, distance: number, maxCombo?: number): Promise<ScoreEntry> {
    try {
      const newScore: ScoreEntry = {
        id: Date.now().toString(),
        player_name: playerName,
        distance: distance,
        max_combo: maxCombo,
        created_at: new Date().toISOString()
      };

      // Try Supabase first
      if (this.isConfigured()) {
        const { data, error } = await supabase
          .from('scores')
          .insert({
            player_name: playerName,
            distance: distance,
            max_combo: maxCombo || 0
          })
          .select()
          .single();

        if (error) {
          console.error('Supabase error:', error);
          // Fall back to localStorage on error
          return this.saveLocalScore(playerName, distance, maxCombo);
        }

        return data;
      }

      // Use localStorage if Supabase not configured
      return this.saveLocalScore(playerName, distance, maxCombo);
    } catch (error) {
      console.error('Error saving score:', error);
      throw error;
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
  private saveLocalScore(playerName: string, distance: number, maxCombo?: number): ScoreEntry {
    const newScore: ScoreEntry = {
      id: Date.now().toString(),
      player_name: playerName,
      distance: distance,
      max_combo: maxCombo,
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