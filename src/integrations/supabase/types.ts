export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }

  public: {
    Tables: {
      match_attendance: {
        Row: {
          id: string
          match_id: string
          player_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at: string
        }

        Insert: {
          id?: string
          match_id: string
          player_id: string
          status: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }

        Update: {
          id?: string
          match_id?: string
          player_id?: string
          status?: Database["public"]["Enums"]["attendance_status"]
          updated_at?: string
        }

        Relationships: []
      }

      match_goals: {
        Row: {
          goals: number
          id: string
          match_id: string
          player_id: string
        }

        Insert: {
          goals?: number
          id?: string
          match_id: string
          player_id: string
        }

        Update: {
          goals?: number
          id?: string
          match_id?: string
          player_id?: string
        }

        Relationships: [
          {
            foreignKeyName: "match_goals_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_goals_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }

      match_participations: {
        Row: {
          id: string
          match_id: string
          player_id: string
        }

        Insert: {
          id?: string
          match_id: string
          player_id: string
        }

        Update: {
          id?: string
          match_id?: string
          player_id?: string
        }

        Relationships: [
          {
            foreignKeyName: "match_participations_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participations_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }

      matches: {
        Row: {
          created_at: string
          id: string
          location: string | null
          match_date: string
          notes: string | null
          opponent: string
          opponent_score: number
          our_score: number
        }

        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          match_date: string
          notes?: string | null
          opponent: string
          opponent_score?: number
          our_score?: number
        }

        Update: {
          created_at?: string
          id?: string
          location?: string | null
          match_date?: string
          notes?: string | null
          opponent?: string
          opponent_score?: number
          our_score?: number
        }

        Relationships: []
      }

      players: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          jersey_number: number | null
          name: string
          nickname: string | null
          photo_url: string | null
          position: string | null
          user_id: string | null
        }

        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          jersey_number?: number | null
          name: string
          nickname?: string | null
          photo_url?: string | null
          position?: string | null
          user_id?: string | null
        }

        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          jersey_number?: number | null
          name?: string
          nickname?: string | null
          photo_url?: string | null
          position?: string | null
          user_id?: string | null
        }

        Relationships: []
      }

      team_settings: {
        Row: {
          description: string | null
          founded_year: number | null
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }

        Insert: {
          description?: string | null
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }

        Update: {
          description?: string | null
          founded_year?: number | null
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }

        Relationships: []
      }

      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }

        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }

        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }

        Relationships: []
      }
    }

    Views: {
      [_ in never]: never
    }

    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }

        Returns: boolean
      }
    }

    Enums: {
      app_role: "admin" | "user"
      attendance_status: "vou" | "nao_vou" | "talvez"
    }

    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      attendance_status: ["vou", "nao_vou", "talvez"],
    },
  },
} as const