export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      meetings: {
        Row: {
          actions_log: Json
          attendees: Json
          created_at: string
          date: string
          id: string
          purpose: string | null
          quarter: string
          sections: Json
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          actions_log?: Json
          attendees?: Json
          created_at?: string
          date: string
          id?: string
          purpose?: string | null
          quarter: string
          sections?: Json
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          actions_log?: Json
          attendees?: Json
          created_at?: string
          date?: string
          id?: string
          purpose?: string | null
          quarter?: string
          sections?: Json
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      resourcing_analytics: {
        Row: {
          created_at: string
          current_staff: number
          id: string
          ideal_staff: number
          meeting_id: string | null
          month: string
          onboarding_staff: number
          probation_staff: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_staff?: number
          id?: string
          ideal_staff?: number
          meeting_id?: string | null
          month: string
          onboarding_staff?: number
          probation_staff?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_staff?: number
          id?: string
          ideal_staff?: number
          meeting_id?: string | null
          month?: string
          onboarding_staff?: number
          probation_staff?: number
          updated_at?: string
        }
        Relationships: []
      }
      spot_check_analytics: {
        Row: {
          created_at: string
          id: string
          meeting_id: string | null
          monthly_data: Json
          passed_frequency: number
          probation_frequency: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          passed_frequency?: number
          probation_frequency?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          passed_frequency?: number
          probation_frequency?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_documents_analytics: {
        Row: {
          active_fully_compliant: number
          active_pending_documents: number
          created_at: string
          id: string
          meeting_id: string | null
          onboarding_fully_compliant: number
          onboarding_pending_documents: number
          updated_at: string
        }
        Insert: {
          active_fully_compliant?: number
          active_pending_documents?: number
          created_at?: string
          id?: string
          meeting_id?: string | null
          onboarding_fully_compliant?: number
          onboarding_pending_documents?: number
          updated_at?: string
        }
        Update: {
          active_fully_compliant?: number
          active_pending_documents?: number
          created_at?: string
          id?: string
          meeting_id?: string | null
          onboarding_fully_compliant?: number
          onboarding_pending_documents?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff_training_analytics: {
        Row: {
          created_at: string
          id: string
          mandatory_compliant: number
          mandatory_pending: number
          meeting_id: string | null
          specialist_compliant: number
          specialist_pending: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mandatory_compliant?: number
          mandatory_pending?: number
          meeting_id?: string | null
          specialist_compliant?: number
          specialist_pending?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mandatory_compliant?: number
          mandatory_pending?: number
          meeting_id?: string | null
          specialist_compliant?: number
          specialist_pending?: number
          updated_at?: string
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
