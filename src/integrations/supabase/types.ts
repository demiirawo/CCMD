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
      care_plan_analytics: {
        Row: {
          care_plans_in_date: number
          care_plans_overdue: number
          company_id: string | null
          created_at: string
          high_frequency: number
          id: string
          low_frequency: number
          medium_frequency: number
          meeting_id: string | null
          monthly_data: Json
          risk_assessments_in_date: number
          risk_assessments_overdue: number
          total_service_users: number
          updated_at: string
        }
        Insert: {
          care_plans_in_date?: number
          care_plans_overdue?: number
          company_id?: string | null
          created_at?: string
          high_frequency?: number
          id?: string
          low_frequency?: number
          medium_frequency?: number
          meeting_id?: string | null
          monthly_data?: Json
          risk_assessments_in_date?: number
          risk_assessments_overdue?: number
          total_service_users?: number
          updated_at?: string
        }
        Update: {
          care_plans_in_date?: number
          care_plans_overdue?: number
          company_id?: string | null
          created_at?: string
          high_frequency?: number
          id?: string
          low_frequency?: number
          medium_frequency?: number
          meeting_id?: string | null
          monthly_data?: Json
          risk_assessments_in_date?: number
          risk_assessments_overdue?: number
          total_service_users?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_plan_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          services: string[] | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          services?: string[] | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          services?: string[] | null
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feedback_analytics: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          meeting_id: string | null
          monthly_data: Json
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          actions_log: Json
          attendees: Json
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "meetings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      resourcing_analytics: {
        Row: {
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "resourcing_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      spot_check_analytics: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          meeting_id: string | null
          monthly_data: Json
          passed_frequency: number
          probation_frequency: number
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          passed_frequency?: number
          probation_frequency?: number
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          passed_frequency?: number
          probation_frequency?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_check_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_documents_analytics: {
        Row: {
          active_fully_compliant: number
          active_pending_documents: number
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
          created_at?: string
          id?: string
          meeting_id?: string | null
          onboarding_fully_compliant?: number
          onboarding_pending_documents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_documents_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_training_analytics: {
        Row: {
          company_id: string | null
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
          company_id?: string | null
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
          company_id?: string | null
          created_at?: string
          id?: string
          mandatory_compliant?: number
          mandatory_pending?: number
          meeting_id?: string | null
          specialist_compliant?: number
          specialist_pending?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_training_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      supervision_analytics: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          meeting_id: string | null
          monthly_data: Json
          passed_frequency: number
          probation_frequency: number
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          passed_frequency?: number
          probation_frequency?: number
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          passed_frequency?: number
          probation_frequency?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supervision_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "admin" | "user"
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
    Enums: {
      user_role: ["admin", "user"],
    },
  },
} as const
