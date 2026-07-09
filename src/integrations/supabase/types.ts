export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_key: string
          description: string | null
          icon: string | null
          id: string
          name: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_key: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_key?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      challenges: {
        Row: {
          challenge_date: string
          challenge_key: string
          completed: boolean
          created_at: string
          description: string
          id: string
          progress: number
          reward_points: number
          target: number
          title: string
          user_id: string
        }
        Insert: {
          challenge_date: string
          challenge_key: string
          completed?: boolean
          created_at?: string
          description: string
          id?: string
          progress?: number
          reward_points?: number
          target: number
          title: string
          user_id: string
        }
        Update: {
          challenge_date?: string
          challenge_key?: string
          completed?: boolean
          created_at?: string
          description?: string
          id?: string
          progress?: number
          reward_points?: number
          target?: number
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      health_entries: {
        Row: {
          active_minutes: number
          bmi: number | null
          created_at: string
          distance_km: number
          entry_date: string
          id: string
          sleep_hours: number
          steps: number
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          active_minutes?: number
          bmi?: number | null
          created_at?: string
          distance_km?: number
          entry_date: string
          id?: string
          sleep_hours?: number
          steps?: number
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          active_minutes?: number
          bmi?: number | null
          created_at?: string
          distance_km?: number
          entry_date?: string
          id?: string
          sleep_hours?: number
          steps?: number
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string
          created_at: string
          current_score: number
          current_streak: number
          date_of_birth: string | null
          days_above_900: number
          email: string | null
          gender: string | null
          height_cm: number | null
          highest_country_rank: number | null
          highest_global_rank: number | null
          id: string
          is_active: boolean
          last_active_date: string | null
          level: number
          longest_streak: number
          name: string
          onboarded: boolean
          personal_best_score: number
          updated_at: string
          weight_kg: number | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          country?: string
          created_at?: string
          current_score?: number
          current_streak?: number
          date_of_birth?: string | null
          days_above_900?: number
          email?: string | null
          gender?: string | null
          height_cm?: number | null
          highest_country_rank?: number | null
          highest_global_rank?: number | null
          id: string
          is_active?: boolean
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          name?: string
          onboarded?: boolean
          personal_best_score?: number
          updated_at?: string
          weight_kg?: number | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          country?: string
          created_at?: string
          current_score?: number
          current_streak?: number
          date_of_birth?: string | null
          days_above_900?: number
          email?: string | null
          gender?: string | null
          height_cm?: number | null
          highest_country_rank?: number | null
          highest_global_rank?: number | null
          id?: string
          is_active?: boolean
          last_active_date?: string | null
          level?: number
          longest_streak?: number
          name?: string
          onboarded?: boolean
          personal_best_score?: number
          updated_at?: string
          weight_kg?: number | null
          xp?: number
        }
        Relationships: []
      }
      score_history: {
        Row: {
          active_minutes_score: number
          activity_score: number
          bmi_score: number
          change_delta: number
          change_reasons: Json
          consistency_score: number
          created_at: string
          current_score: number
          distance_score: number
          id: string
          personal_best: number
          score_date: string
          sleep_score: number
          user_id: string
        }
        Insert: {
          active_minutes_score?: number
          activity_score?: number
          bmi_score?: number
          change_delta?: number
          change_reasons?: Json
          consistency_score?: number
          created_at?: string
          current_score: number
          distance_score?: number
          id?: string
          personal_best: number
          score_date: string
          sleep_score?: number
          user_id: string
        }
        Update: {
          active_minutes_score?: number
          activity_score?: number
          bmi_score?: number
          change_delta?: number
          change_reasons?: Json
          consistency_score?: number
          created_at?: string
          current_score?: number
          distance_score?: number
          id?: string
          personal_best?: number
          score_date?: string
          sleep_score?: number
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
