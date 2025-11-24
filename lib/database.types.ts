export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      scores: {
        Row: {
          id: string
          player_name: string
          distance: number
          created_at: string
        }
        Insert: {
          id?: string
          player_name: string
          distance: number
          created_at?: string
        }
        Update: {
          id?: string
          player_name?: string
          distance?: number
          created_at?: string
        }
      }
    }
  }
}
