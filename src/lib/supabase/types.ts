// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5'
  }
  public: {
    Tables: {
      agenda_tasks: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          due_date: string
          duration_minutes: number
          id: string
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          description?: string | null
          due_date: string
          duration_minutes?: number
          id?: string
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          due_date?: string
          duration_minutes?: number
          id?: string
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          created_at: string | null
          feature_type: string
          id: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feature_type: string
          id?: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feature_type?: string
          id?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      finance_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          completed_at: string | null
          date: string
          habit_id: string
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          date?: string
          habit_id: string
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          date?: string
          habit_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'habit_logs_habit_id_fkey'
            columns: ['habit_id']
            isOneToOne: false
            referencedRelation: 'habits'
            referencedColumns: ['id']
          },
        ]
      }
      habits: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number
          frequency: string | null
          id: string
          is_completed: boolean | null
          scheduled_time: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          frequency?: string | null
          id?: string
          is_completed?: boolean | null
          scheduled_time?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          frequency?: string | null
          id?: string
          is_completed?: boolean | null
          scheduled_time?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      health_logs: {
        Row: {
          calories_consumed: number | null
          created_at: string | null
          date: string
          id: string
          updated_at: string | null
          user_id: string
          water_intake_ml: number | null
        }
        Insert: {
          calories_consumed?: number | null
          created_at?: string | null
          date?: string
          id?: string
          updated_at?: string | null
          user_id: string
          water_intake_ml?: number | null
        }
        Update: {
          calories_consumed?: number | null
          created_at?: string | null
          date?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          water_intake_ml?: number | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string | null
          created_at: string | null
          current_quantity: number | null
          id: string
          is_on_shopping_list: boolean | null
          min_quantity: number | null
          name: string
          unit: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_quantity?: number | null
          id?: string
          is_on_shopping_list?: boolean | null
          min_quantity?: number | null
          name: string
          unit?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_quantity?: number | null
          id?: string
          is_on_shopping_list?: boolean | null
          min_quantity?: number | null
          name?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plan_limits: {
        Row: {
          max_requests_per_month: number
          max_tokens_per_month: number
          plan_type: string
          price: string
        }
        Insert: {
          max_requests_per_month: number
          max_tokens_per_month: number
          plan_type: string
          price?: string
        }
        Update: {
          max_requests_per_month?: number
          max_tokens_per_month?: number
          plan_type?: string
          price?: string
        }
        Relationships: []
      }
      pomodoro_logs: {
        Row: {
          completed_at: string | null
          duration_minutes: number
          habit_id: string | null
          id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          duration_minutes: number
          habit_id?: string | null
          id?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          duration_minutes?: number
          habit_id?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pomodoro_logs_habit_id_fkey'
            columns: ['habit_id']
            isOneToOne: false
            referencedRelation: 'habits'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          avatar_url: string | null
          consent_accepted_at: string | null
          created_at: string
          dietary_restrictions: string | null
          full_name: string
          gender: string | null
          health_goals: string | null
          height_cm: number | null
          id: string
          is_premium: boolean | null
          onboarding_completed: boolean
          phone_number: string | null
          pomodoro_focus_duration: number
          pomodoro_long_break: number
          pomodoro_short_break: number
          study_roadmap: Json | null
          timezone: string
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          consent_accepted_at?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          full_name?: string
          gender?: string | null
          health_goals?: string | null
          height_cm?: number | null
          id: string
          is_premium?: boolean | null
          onboarding_completed?: boolean
          phone_number?: string | null
          pomodoro_focus_duration?: number
          pomodoro_long_break?: number
          pomodoro_short_break?: number
          study_roadmap?: Json | null
          timezone?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          avatar_url?: string | null
          consent_accepted_at?: string | null
          created_at?: string
          dietary_restrictions?: string | null
          full_name?: string
          gender?: string | null
          health_goals?: string | null
          height_cm?: number | null
          id?: string
          is_premium?: boolean | null
          onboarding_completed?: boolean
          phone_number?: string | null
          pomodoro_focus_duration?: number
          pomodoro_long_break?: number
          pomodoro_short_break?: number
          study_roadmap?: Json | null
          timezone?: string
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'push_subscriptions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      reminder_logs: {
        Row: {
          id: string
          reminder_date: string
          sent_at: string | null
          source_id: string
          source_type: string
        }
        Insert: {
          id?: string
          reminder_date?: string
          sent_at?: string | null
          source_id: string
          source_type: string
        }
        Update: {
          id?: string
          reminder_date?: string
          sent_at?: string | null
          source_id?: string
          source_type?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          mp_preapproval_id: string | null
          mp_status: string | null
          plan_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_preapproval_id?: string | null
          mp_status?: string | null
          plan_type?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          mp_preapproval_id?: string | null
          mp_status?: string | null
          plan_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          date: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      exercises: {
        Row: {
          id: string
          user_id: string | null
          name: string
          muscle_group: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          muscle_group?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          muscle_group?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          date: string
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          notes?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          id: string
          user_id: string
          session_id: string
          exercise_id: string
          set_number: number
          reps: number
          weight_kg: number
          rpe: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          exercise_id: string
          set_number?: number
          reps: number
          weight_kg: number
          rpe?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          exercise_id?: string
          set_number?: number
          reps?: number
          weight_kg?: number
          rpe?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'workout_sets_session_id_fkey'
            columns: ['session_id']
            isOneToOne: false
            referencedRelation: 'workout_sessions'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'workout_sets_exercise_id_fkey'
            columns: ['exercise_id']
            isOneToOne: false
            referencedRelation: 'exercises'
            referencedColumns: ['id']
          },
        ]
      }
      workout_plans: {
        Row: {
          id: string
          user_id: string
          summary: string
          items: Json
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          summary: string
          items?: Json
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          summary?: string
          items?: Json
          created_at?: string | null
        }
        Relationships: []
      }
      reading_list: {
        Row: {
          id: string
          user_id: string
          google_books_id: string | null
          title: string
          author: string | null
          cover_url: string | null
          status: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          google_books_id?: string | null
          title: string
          author?: string | null
          cover_url?: string | null
          status?: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          google_books_id?: string | null
          title?: string
          author?: string | null
          cover_url?: string | null
          status?: string
          created_at?: string | null
        }
        Relationships: []
      }
      news_cache: {
        Row: {
          category: string
          articles: Json
          fetched_at: string
        }
        Insert: {
          category: string
          articles?: Json
          fetched_at?: string
        }
        Update: {
          category?: string
          articles?: Json
          fetched_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      log_ai_usage: {
        Args: { p_feature_type: string; p_tokens_used?: number }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
