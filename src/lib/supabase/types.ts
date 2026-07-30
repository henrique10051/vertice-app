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
      agenda_tasks: {
        Row: {
          category: string
          created_at: string | null
          days_of_week: string[] | null
          description: string | null
          due_date: string
          duration_minutes: number
          id: string
          is_recurring: boolean
          routine_period: string | null
          status: string | null
          title: string
          tracker_id: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          days_of_week?: string[] | null
          description?: string | null
          due_date: string
          duration_minutes?: number
          id?: string
          is_recurring?: boolean
          routine_period?: string | null
          status?: string | null
          title: string
          tracker_id?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          days_of_week?: string[] | null
          description?: string | null
          due_date?: string
          duration_minutes?: number
          id?: string
          is_recurring?: boolean
          routine_period?: string | null
          status?: string | null
          title?: string
          tracker_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agenda_tasks_tracker_id_fkey"
            columns: ["tracker_id"]
            isOneToOne: false
            referencedRelation: "custom_trackers"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage: {
        Row: {
          message_count: number
          period_month: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          message_count?: number
          period_month: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          message_count?: number
          period_month?: string
          updated_at?: string | null
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
      budgets: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          id: string
          month: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          id?: string
          month: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          id?: string
          month?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_tracker_entries: {
        Row: {
          created_at: string
          date: string
          id: string
          task_id: string | null
          tracker_id: string
          updated_at: string
          user_id: string
          values: Json
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          task_id?: string | null
          tracker_id: string
          updated_at?: string
          user_id: string
          values: Json
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          task_id?: string | null
          tracker_id?: string
          updated_at?: string
          user_id?: string
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "custom_tracker_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agenda_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_tracker_entries_tracker_id_fkey"
            columns: ["tracker_id"]
            isOneToOne: false
            referencedRelation: "custom_trackers"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_trackers: {
        Row: {
          category: string | null
          category_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          fields_schema: Json | null
          frequency: string | null
          habit_id: string | null
          id: string
          is_habit: boolean
          name: string
          scheduled_time: string | null
          updated_at: string | null
          user_id: string
          validation: Json | null
          view_type: string | null
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          fields_schema?: Json | null
          frequency?: string | null
          habit_id?: string | null
          id?: string
          is_habit?: boolean
          name: string
          scheduled_time?: string | null
          updated_at?: string | null
          user_id: string
          validation?: Json | null
          view_type?: string | null
        }
        Update: {
          category?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          fields_schema?: Json | null
          frequency?: string | null
          habit_id?: string | null
          id?: string
          is_habit?: boolean
          name?: string
          scheduled_time?: string | null
          updated_at?: string | null
          user_id?: string
          validation?: Json | null
          view_type?: string | null
        }
        Relationships: []
      }
      exercises: {
        Row: {
          created_at: string | null
          id: string
          muscle_group: string | null
          name: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          muscle_group?: string | null
          name: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          muscle_group?: string | null
          name?: string
          user_id?: string | null
          video_url?: string | null
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
      installment_purchases: {
        Row: {
          category: string
          created_at: string | null
          description: string
          id: string
          installment_amount: number
          installments_total: number
          start_month: string
          total_amount: number
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          id?: string
          installment_amount: number
          installments_total: number
          start_month: string
          total_amount: number
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          installment_amount?: number
          installments_total?: number
          start_month?: string
          total_amount?: number
          user_id?: string
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
      news_cache: {
        Row: {
          articles: Json
          category: string
          fetched_at: string
        }
        Insert: {
          articles?: Json
          category: string
          fetched_at?: string
        }
        Update: {
          articles?: Json
          category?: string
          fetched_at?: string
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
            foreignKeyName: "pomodoro_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "custom_trackers"
            referencedColumns: ["id"]
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
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_list: {
        Row: {
          author: string | null
          cover_url: string | null
          created_at: string | null
          google_books_id: string | null
          id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          author?: string | null
          cover_url?: string | null
          created_at?: string | null
          google_books_id?: string | null
          id?: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          author?: string | null
          cover_url?: string | null
          created_at?: string | null
          google_books_id?: string | null
          id?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: []
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
          abacatepay_bill_id: string | null
          abacatepay_status: string | null
          access_source: string
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          abacatepay_bill_id?: string | null
          abacatepay_status?: string | null
          access_source?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          abacatepay_bill_id?: string | null
          abacatepay_status?: string | null
          access_source?: string
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      tracker_logs: {
        Row: {
          content: Json
          created_at: string
          id: string
          task_id: string | null
          tracker_id: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          task_id?: string | null
          tracker_id: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          task_id?: string | null
          tracker_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracker_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agenda_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracker_logs_tracker_id_fkey"
            columns: ["tracker_id"]
            isOneToOne: false
            referencedRelation: "custom_trackers"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          created_at: string | null
          id: string
          items: Json
          summary: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          items?: Json
          summary: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          items?: Json
          summary?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          created_at: string | null
          date: string
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_sets: {
        Row: {
          created_at: string | null
          exercise_id: string
          id: string
          reps: number
          rpe: number | null
          session_id: string
          set_number: number
          user_id: string
          weight_kg: number
        }
        Insert: {
          created_at?: string | null
          exercise_id: string
          id?: string
          reps: number
          rpe?: number | null
          session_id: string
          set_number?: number
          user_id: string
          weight_kg: number
        }
        Update: {
          created_at?: string | null
          exercise_id?: string
          id?: string
          reps?: number
          rpe?: number | null
          session_id?: string
          set_number?: number
          user_id?: string
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      consume_ai_usage: {
        Args: { p_limit: number }
        Returns: {
          allowed: boolean
          limit: number
          used: number
        }[]
      }
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
