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
        Relationships: [
          {
            foreignKeyName: "actions_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "analytics_backups_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      base_fields: {
        Row: {
          created_at: string
          field_config: Json | null
          field_type: string
          id: string
          is_required: boolean | null
          name: string
          position: number | null
          table_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_config?: Json | null
          field_type: string
          id?: string
          is_required?: boolean | null
          name: string
          position?: number | null
          table_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_config?: Json | null
          field_type?: string
          id?: string
          is_required?: boolean | null
          name?: string
          position?: number | null
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_fields_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "base_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      base_records: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          deleted_at: string | null
          id: string
          position: number | null
          table_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          id?: string
          position?: number | null
          table_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          deleted_at?: string | null
          id?: string
          position?: number | null
          table_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "base_records_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "base_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      base_tables: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          settings: Json | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          settings?: Json | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          settings?: Json | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "base_tables_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      base_views: {
        Row: {
          created_at: string
          created_by: string | null
          filters: Json | null
          groups: Json | null
          id: string
          is_default: boolean | null
          name: string
          settings: Json | null
          sorts: Json | null
          table_id: string
          updated_at: string
          view_type: string | null
          visible_fields: Json | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          groups?: Json | null
          id?: string
          is_default?: boolean | null
          name: string
          settings?: Json | null
          sorts?: Json | null
          table_id: string
          updated_at?: string
          view_type?: string | null
          visible_fields?: Json | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          filters?: Json | null
          groups?: Json | null
          id?: string
          is_default?: boolean | null
          name?: string
          settings?: Json | null
          sorts?: Json | null
          table_id?: string
          updated_at?: string
          view_type?: string | null
          visible_fields?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "base_views_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "base_tables"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "care_notes_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
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
      care_plan_overview: {
        Row: {
          company_id: string
          created_at: string
          high_risk: number
          id: string
          low_risk: number
          medium_risk: number
          meeting_id: string | null
          na_risk: number
          overdue: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          high_risk?: number
          id?: string
          low_risk?: number
          medium_risk?: number
          meeting_id?: string | null
          na_risk?: number
          overdue?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          high_risk?: number
          id?: string
          low_risk?: number
          medium_risk?: number
          meeting_id?: string | null
          na_risk?: number
          overdue?: number
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          base_enabled: boolean | null
          cqc_personal_care: boolean | null
          created_at: string
          dynamic_panel_colour: boolean | null
          home_office_cos: boolean | null
          id: string
          logo_url: string | null
          name: string
          ofsted_supported_accommodation: boolean | null
          services: string[] | null
          slug: string | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          base_enabled?: boolean | null
          cqc_personal_care?: boolean | null
          created_at?: string
          dynamic_panel_colour?: boolean | null
          home_office_cos?: boolean | null
          id?: string
          logo_url?: string | null
          name: string
          ofsted_supported_accommodation?: boolean | null
          services?: string[] | null
          slug?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          base_enabled?: boolean | null
          cqc_personal_care?: boolean | null
          created_at?: string
          dynamic_panel_colour?: boolean | null
          home_office_cos?: boolean | null
          id?: string
          logo_url?: string | null
          name?: string
          ofsted_supported_accommodation?: boolean | null
          services?: string[] | null
          slug?: string | null
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
        Relationships: [
          {
            foreignKeyName: "dashboard_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      data_audit_trail: {
        Row: {
          company_id: string
          data_size: number | null
          error_message: string | null
          id: string
          meeting_id: string | null
          metadata: Json | null
          operation: string
          success: boolean
          table_name: string
          timestamp: string
          user_id: string | null
        }
        Insert: {
          company_id: string
          data_size?: number | null
          error_message?: string | null
          id?: string
          meeting_id?: string | null
          metadata?: Json | null
          operation: string
          success?: boolean
          table_name: string
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          company_id?: string
          data_size?: number | null
          error_message?: string | null
          id?: string
          meeting_id?: string | null
          metadata?: Json | null
          operation?: string
          success?: boolean
          table_name?: string
          timestamp?: string
          user_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "feedback_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      global_subsection_evidence: {
        Row: {
          created_at: string
          id: string
          item_id: string
          linked_evidence_refs: Json
          section_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          linked_evidence_refs?: Json
          section_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          linked_evidence_refs?: Json
          section_id?: string
          updated_at?: string
          updated_by?: string | null
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
            foreignKeyName: "incidents_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          panel_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          panel_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          panel_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_categories_panel_id_fkey"
            columns: ["panel_id"]
            isOneToOne: false
            referencedRelation: "inspection_panels"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_company_responses: {
        Row: {
          comment: string | null
          company_id: string
          created_at: string
          evidence_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          company_id: string
          created_at?: string
          evidence_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          company_id?: string
          created_at?: string
          evidence_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_company_responses_evidence_id_fkey"
            columns: ["evidence_id"]
            isOneToOne: false
            referencedRelation: "inspection_evidence"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_evidence: {
        Row: {
          category_id: string
          created_at: string
          evidence_text: string
          id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          evidence_text: string
          id?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          evidence_text?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_evidence_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inspection_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_panels: {
        Row: {
          created_at: string
          id: string
          name: string
          rating: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          rating?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          rating?: string
          updated_at?: string
        }
        Relationships: []
      }
      key_documents: {
        Row: {
          comment: string | null
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
          comment?: string | null
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
          comment?: string | null
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
        Relationships: [
          {
            foreignKeyName: "key_documents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_service_users: {
        Row: {
          backup_staff_ids: Json
          company_id: string
          created_at: string
          forecast_hours: Json
          gender_preference: string
          id: string
          location: string
          manager: string | null
          name: string
          preferences: Json
          primary_staff_ids: Json
          staff_allocations: Json
          support_needs: Json
          typical_weekly_hours: number
          updated_at: string
        }
        Insert: {
          backup_staff_ids?: Json
          company_id: string
          created_at?: string
          forecast_hours?: Json
          gender_preference?: string
          id?: string
          location?: string
          manager?: string | null
          name: string
          preferences?: Json
          primary_staff_ids?: Json
          staff_allocations?: Json
          support_needs?: Json
          typical_weekly_hours?: number
          updated_at?: string
        }
        Update: {
          backup_staff_ids?: Json
          company_id?: string
          created_at?: string
          forecast_hours?: Json
          gender_preference?: string
          id?: string
          location?: string
          manager?: string | null
          name?: string
          preferences?: Json
          primary_staff_ids?: Json
          staff_allocations?: Json
          support_needs?: Json
          typical_weekly_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_service_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      matching_staff: {
        Row: {
          company_id: string
          contract_type: string
          created_at: string
          forecast_hours: Json
          gender: string
          id: string
          location: string
          manager: string | null
          name: string
          status: string
          typical_weekly_hours: number
          updated_at: string
        }
        Insert: {
          company_id: string
          contract_type?: string
          created_at?: string
          forecast_hours?: Json
          gender?: string
          id?: string
          location?: string
          manager?: string | null
          name: string
          status?: string
          typical_weekly_hours?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          contract_type?: string
          created_at?: string
          forecast_hours?: Json
          gender?: string
          id?: string
          location?: string
          manager?: string | null
          name?: string
          status?: string
          typical_weekly_hours?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matching_staff_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "medication_analytics_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_backups: {
        Row: {
          backup_data: Json
          backup_type: string
          company_id: string
          created_at: string
          created_by: string | null
          data_type: string
          id: string
          meeting_date: string
          meeting_id: string
          metadata: Json | null
        }
        Insert: {
          backup_data: Json
          backup_type: string
          company_id: string
          created_at?: string
          created_by?: string | null
          data_type: string
          id?: string
          meeting_date: string
          meeting_id: string
          metadata?: Json | null
        }
        Update: {
          backup_data?: Json
          backup_type?: string
          company_id?: string
          created_at?: string
          created_by?: string | null
          data_type?: string
          id?: string
          meeting_date?: string
          meeting_id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      meeting_email_reminders: {
        Row: {
          company_id: string
          created_at: string
          error: string | null
          html: string
          id: string
          send_at: string
          sent_at: string | null
          status: string
          subject: string
          to_email: string
        }
        Insert: {
          company_id: string
          created_at?: string
          error?: string | null
          html: string
          id?: string
          send_at: string
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
        }
        Update: {
          company_id?: string
          created_at?: string
          error?: string | null
          html?: string
          id?: string
          send_at?: string
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      meeting_email_tracking: {
        Row: {
          attendees: Json
          company_id: string
          created_at: string
          dashboard_data: Json | null
          follow_up_scheduled_for: string
          follow_up_sent_at: string | null
          id: string
          meeting_date: string
          meeting_title: string
          sent_at: string
          updated_at: string
        }
        Insert: {
          attendees?: Json
          company_id: string
          created_at?: string
          dashboard_data?: Json | null
          follow_up_scheduled_for: string
          follow_up_sent_at?: string | null
          id?: string
          meeting_date: string
          meeting_title: string
          sent_at?: string
          updated_at?: string
        }
        Update: {
          attendees?: Json
          company_id?: string
          created_at?: string
          dashboard_data?: Json | null
          follow_up_scheduled_for?: string
          follow_up_sent_at?: string | null
          id?: string
          meeting_date?: string
          meeting_title?: string
          sent_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_email_tracking_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "meeting_headers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "meeting_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_summaries: {
        Row: {
          company_id: string
          created_at: string
          id: string
          meeting_date: string
          summary_text: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          meeting_date: string
          summary_text?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          meeting_date?: string
          summary_text?: string
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
          document_url: string | null
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
          document_url?: string | null
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
          document_url?: string | null
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
        Relationships: [
          {
            foreignKeyName: "quarterly_reports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      resourcing_overview: {
        Row: {
          active: number
          company_id: string
          created_at: string
          id: string
          meeting_id: string | null
          on_probation: number
          onboarding: number
          required_staffing_level: number
          updated_at: string
        }
        Insert: {
          active?: number
          company_id: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          on_probation?: number
          onboarding?: number
          required_staffing_level?: number
          updated_at?: string
        }
        Update: {
          active?: number
          company_id?: string
          created_at?: string
          id?: string
          meeting_id?: string | null
          on_probation?: number
          onboarding?: number
          required_staffing_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      service_subsection_tags: {
        Row: {
          created_at: string
          id: string
          item_id: string
          section_id: string
          service: string
          tags: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          section_id: string
          service: string
          tags?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          section_id?: string
          service?: string
          tags?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      service_user_document_analytics: {
        Row: {
          company_id: string
          created_at: string
          id: string
          incomplete_documents: number
          meeting_id: string | null
          total_service_users: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          incomplete_documents?: number
          meeting_id?: string | null
          total_service_users?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          incomplete_documents?: number
          meeting_id?: string | null
          total_service_users?: number
          updated_at?: string
        }
        Relationships: []
      }
      shared_tables: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          password_hash: string | null
          share_token: string
          share_type: string
          table_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          password_hash?: string | null
          share_token?: string
          share_type: string
          table_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          password_hash?: string | null
          share_token?: string
          share_type?: string
          table_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_tables_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "base_tables"
            referencedColumns: ["id"]
          },
        ]
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
      subsection_data: {
        Row: {
          actions: Json | null
          company_id: string
          created_at: string
          id: string
          item_id: string
          last_reviewed: string | null
          lessons_learned: string | null
          metadata: Json | null
          observation: string | null
          section_id: string
          session_id: string | null
          status: string | null
          trends_themes: string | null
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          company_id: string
          created_at?: string
          id?: string
          item_id: string
          last_reviewed?: string | null
          lessons_learned?: string | null
          metadata?: Json | null
          observation?: string | null
          section_id: string
          session_id?: string | null
          status?: string | null
          trends_themes?: string | null
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          item_id?: string
          last_reviewed?: string | null
          lessons_learned?: string | null
          metadata?: Json | null
          observation?: string | null
          section_id?: string
          session_id?: string | null
          status?: string | null
          trends_themes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subsection_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "team_members_company_id_fkey"
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
      user_sessions: {
        Row: {
          browser_tab_id: string
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          last_active: string
          session_token: string
          user_id: string
        }
        Insert: {
          browser_tab_id: string
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_active?: string
          session_token: string
          user_id: string
        }
        Update: {
          browser_tab_id?: string
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_active?: string
          session_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          color: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          position: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          position?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          position?: number | null
          updated_at?: string
        }
        Relationships: []
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
      cleanup_old_sessions: { Args: never; Returns: undefined }
      ensure_user_setup_complete: {
        Args: { user_email: string }
        Returns: undefined
      }
      generate_slug: { Args: { input_text: string }; Returns: string }
      get_user_accessible_company_ids: { Args: never; Returns: string[] }
      get_user_company_id: { Args: never; Returns: string }
      get_user_permission: {
        Args: never
        Returns: Database["public"]["Enums"]["user_permission"]
      }
      invalidate_other_company_sessions: {
        Args: {
          p_company_id: string
          p_current_session_token: string
          p_user_id: string
        }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
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
