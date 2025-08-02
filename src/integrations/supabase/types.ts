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
      actions: {
        Row: {
          assignee: string
          company_id: string
          created_at: string
          due_date: string
          id: string
          meeting_date: string | null
          meeting_title: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee: string
          company_id: string
          created_at?: string
          due_date: string
          id?: string
          meeting_date?: string | null
          meeting_title?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee?: string
          company_id?: string
          created_at?: string
          due_date?: string
          id?: string
          meeting_date?: string | null
          meeting_title?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      actions_log: {
        Row: {
          action_id: string
          action_text: string
          audit_trail: Json | null
          closed: boolean
          closed_date: string | null
          comment: string
          company_id: string
          created_at: string
          due_date: string
          id: string
          item_title: string
          mentioned_attendee: string
          session_id: string | null
          source_id: string | null
          source_type: string | null
          status: string
          timestamp: string
          updated_at: string
        }
        Insert: {
          action_id: string
          action_text: string
          audit_trail?: Json | null
          closed?: boolean
          closed_date?: string | null
          comment: string
          company_id: string
          created_at?: string
          due_date: string
          id?: string
          item_title: string
          mentioned_attendee: string
          session_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          timestamp: string
          updated_at?: string
        }
        Update: {
          action_id?: string
          action_text?: string
          audit_trail?: Json | null
          closed?: boolean
          closed_date?: string | null
          comment?: string
          company_id?: string
          created_at?: string
          due_date?: string
          id?: string
          item_title?: string
          mentioned_attendee?: string
          session_id?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          timestamp?: string
          updated_at?: string
        }
        Relationships: []
      }
      analytics_backups: {
        Row: {
          analytics_type: string
          company_id: string
          created_at: string
          data_snapshot: Json
          id: string
          meeting_id: string | null
          source: string
          timestamp: string
          updated_at: string
        }
        Insert: {
          analytics_type: string
          company_id: string
          created_at?: string
          data_snapshot?: Json
          id?: string
          meeting_id?: string | null
          source?: string
          timestamp?: string
          updated_at?: string
        }
        Update: {
          analytics_type?: string
          company_id?: string
          created_at?: string
          data_snapshot?: Json
          id?: string
          meeting_id?: string | null
          source?: string
          timestamp?: string
          updated_at?: string
        }
        Relationships: []
      }
      care_notes_analytics: {
        Row: {
          company_id: string
          created_at: string
          id: string
          meeting_id: string | null
          monthly_data: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_notes_analytics_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      care_plan_analytics: {
        Row: {
          company_id: string
          created_at: string
          frequencies: Json
          id: string
          meeting_id: string | null
          monthly_data: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          frequencies?: Json
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          frequencies?: Json
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          updated_at?: string
        }
        Relationships: []
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
      dashboard_data: {
        Row: {
          company_id: string
          created_at: string
          data_content: Json
          data_type: string
          id: string
          meeting_id: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data_content?: Json
          data_type: string
          id?: string
          meeting_id?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data_content?: Json
          data_type?: string
          id?: string
          meeting_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feedback_analytics: {
        Row: {
          company_id: string
          created_at: string
          id: string
          meeting_id: string | null
          monthly_data: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      incidents_analytics: {
        Row: {
          company_id: string
          created_at: string
          id: string
          meeting_id: string | null
          monthly_data: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          monthly_data?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_analytics_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      key_documents: {
        Row: {
          company_id: string
          created_at: string
          due_date: string | null
          id: string
          name: string
          notes: string | null
          session_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          name: string
          notes?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          name?: string
          notes?: string | null
          session_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      medication_analytics: {
        Row: {
          company_id: string
          created_at: string
          id: string
          monthly_data: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          monthly_data?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          monthly_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      meeting_headers: {
        Row: {
          attendees: Json
          company_id: string
          created_at: string
          id: string
          meeting_date: string
          purpose: string
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: Json
          company_id: string
          created_at?: string
          id?: string
          meeting_date?: string
          purpose?: string
          title?: string
          updated_at?: string
        }
        Update: {
          attendees?: Json
          company_id?: string
          created_at?: string
          id?: string
          meeting_date?: string
          purpose?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_sessions: {
        Row: {
          attendees: Json | null
          company_id: string
          created_at: string
          id: string
          meeting_date: string
          meeting_quarter: string
          meeting_year: number
          purpose: string | null
          session_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          company_id: string
          created_at?: string
          id?: string
          meeting_date: string
          meeting_quarter: string
          meeting_year: number
          purpose?: string | null
          session_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          meeting_date?: string
          meeting_quarter?: string
          meeting_year?: number
          purpose?: string | null
          session_id?: string
          title?: string | null
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
          permission: Database["public"]["Enums"]["user_permission"]
          role: Database["public"]["Enums"]["user_role"]
          team_member_id: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["user_permission"]
          role?: Database["public"]["Enums"]["user_role"]
          team_member_id?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["user_permission"]
          role?: Database["public"]["Enums"]["user_role"]
          team_member_id?: string | null
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
          {
            foreignKeyName: "profiles_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      quarterly_reports: {
        Row: {
          analytics_data: Json | null
          company_id: string
          created_at: string
          id: string
          quarter: string
          report_content: string
          updated_at: string
          year: number
        }
        Insert: {
          analytics_data?: Json | null
          company_id: string
          created_at?: string
          id?: string
          quarter: string
          report_content: string
          updated_at?: string
          year: number
        }
        Update: {
          analytics_data?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          quarter?: string
          report_content?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      spot_check_analytics: {
        Row: {
          company_id: string
          created_at: string
          id: string
          meeting_id: string | null
          metrics: Json
          monthly_data: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          metrics?: Json
          monthly_data?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          metrics?: Json
          monthly_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      staff_documents_analytics: {
        Row: {
          company_id: string
          created_at: string
          documents_data: Json
          id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          documents_data?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          documents_data?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_training_analytics: {
        Row: {
          company_id: string
          created_at: string
          id: string
          training_data: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          training_data?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          training_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      subsection_data: {
        Row: {
          actions: Json | null
          company_id: string
          created_at: string
          id: string
          item_id: string
          last_reviewed: string | null
          metadata: Json | null
          observation: string | null
          section_id: string
          session_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          company_id: string
          created_at?: string
          id?: string
          item_id: string
          last_reviewed?: string | null
          metadata?: Json | null
          observation?: string | null
          section_id: string
          session_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          item_id?: string
          last_reviewed?: string | null
          metadata?: Json | null
          observation?: string | null
          section_id?: string
          session_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      supervision_analytics: {
        Row: {
          company_id: string
          created_at: string
          id: string
          meeting_id: string | null
          metrics: Json
          monthly_data: Json
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          metrics?: Json
          monthly_data?: Json
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          metrics?: Json
          monthly_data?: Json
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          company_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          permission: Database["public"]["Enums"]["user_permission"]
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          permission?: Database["public"]["Enums"]["user_permission"]
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          permission?: Database["public"]["Enums"]["user_permission"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_team_members_company"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_companies: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          team_member_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          team_member_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          team_member_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_companies_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_companies_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_permission: {
        Args: {
          required_permission: Database["public"]["Enums"]["user_permission"]
        }
        Returns: boolean
      }
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_permission: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_permission"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_permission: "read" | "edit" | "company_admin"
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
      user_permission: ["read", "edit", "company_admin"],
      user_role: ["admin", "user"],
    },
  },
} as const
