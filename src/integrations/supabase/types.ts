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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          company_id: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: string
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_day_reset: string | null
          last_minute_reset: string | null
          last_request_at: string | null
          name: string
          organization_id: string
          permissions: Json | null
          rate_limit_per_day: number | null
          rate_limit_per_minute: number | null
          requests_this_minute: number | null
          requests_today: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_day_reset?: string | null
          last_minute_reset?: string | null
          last_request_at?: string | null
          name: string
          organization_id: string
          permissions?: Json | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          requests_this_minute?: number | null
          requests_today?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_day_reset?: string | null
          last_minute_reset?: string | null
          last_request_at?: string | null
          name?: string
          organization_id?: string
          permissions?: Json | null
          rate_limit_per_day?: number | null
          rate_limit_per_minute?: number | null
          requests_this_minute?: number | null
          requests_today?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          automation_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          current_step: number | null
          error_message: string | null
          id: string
          results: Json | null
          started_at: string | null
          status: string
          total_steps: number | null
          trigger_event: string
        }
        Insert: {
          automation_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          current_step?: number | null
          error_message?: string | null
          id?: string
          results?: Json | null
          started_at?: string | null
          status?: string
          total_steps?: number | null
          trigger_event: string
        }
        Update: {
          automation_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          current_step?: number | null
          error_message?: string | null
          id?: string
          results?: Json | null
          started_at?: string | null
          status?: string
          total_steps?: number | null
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_executions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions: Json | null
          created_at: string
          executions_count: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          created_at?: string
          executions_count?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          created_at?: string
          executions_count?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          domain: string | null
          email: string | null
          id: string
          industry: string | null
          name: string
          notes: string | null
          organization_id: string | null
          phone: string | null
          size: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          domain?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          size?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          domain?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          size?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_tags_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string | null
          lead_score: number | null
          notes: string | null
          organization_id: string | null
          phone: string | null
          position: string | null
          source: string | null
          status: string | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name?: string | null
          lead_score?: number | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string | null
          lead_score?: number | null
          notes?: string | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          source?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          channel: string
          contact_id: string | null
          created_at: string
          id: string
          last_message_at: string | null
          organization_id: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          organization_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          organization_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          company_id: string | null
          contact_id: string | null
          created_at: string
          currency: string | null
          expected_close_date: string | null
          id: string
          notes: string | null
          organization_id: string | null
          probability: number | null
          stage_id: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          probability?: number | null
          stage_id?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          expected_close_date?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          probability?: number | null
          stage_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          click_count: number | null
          content: string | null
          created_at: string
          id: string
          name: string
          open_count: number | null
          organization_id: string | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          click_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          name: string
          open_count?: number | null
          organization_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          click_count?: number | null
          content?: string | null
          created_at?: string
          id?: string
          name?: string
          open_count?: number | null
          organization_id?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          contact_id: string | null
          created_at: string
          data: Json
          form_id: string
          id: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          data?: Json
          form_id: string
          id?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          data?: Json
          form_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          created_at: string
          description: string | null
          fields: Json | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          settings: Json | null
          submissions_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          settings?: Json | null
          submissions_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          settings?: Json | null
          submissions_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_count: number | null
          errors: Json | null
          field_mapping: Json | null
          file_name: string
          id: string
          organization_id: string | null
          processed_rows: number | null
          status: string | null
          success_count: number | null
          total_rows: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          errors?: Json | null
          field_mapping?: Json | null
          file_name: string
          id?: string
          organization_id?: string | null
          processed_rows?: number | null
          status?: string | null
          success_count?: number | null
          total_rows?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_count?: number | null
          errors?: Json | null
          field_mapping?: Json | null
          file_name?: string
          id?: string
          organization_id?: string | null
          processed_rows?: number | null
          status?: string | null
          success_count?: number | null
          total_rows?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inbound_webhooks: {
        Row: {
          created_at: string
          description: string | null
          endpoint_id: string
          field_mapping: Json | null
          headers_to_capture: string[] | null
          id: string
          is_active: boolean | null
          last_request_at: string | null
          name: string
          organization_id: string
          payload_format: string | null
          requests_count: number | null
          secret_token: string
          target_action: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          endpoint_id?: string
          field_mapping?: Json | null
          headers_to_capture?: string[] | null
          id?: string
          is_active?: boolean | null
          last_request_at?: string | null
          name: string
          organization_id: string
          payload_format?: string | null
          requests_count?: number | null
          secret_token?: string
          target_action?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          endpoint_id?: string
          field_mapping?: Json | null
          headers_to_capture?: string[] | null
          id?: string
          is_active?: boolean | null
          last_request_at?: string | null
          name?: string
          organization_id?: string
          payload_format?: string | null
          requests_count?: number | null
          secret_token?: string
          target_action?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_webhooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scoring_rules: {
        Row: {
          created_at: string
          event_type: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string | null
          points: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id?: string | null
          points?: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string | null
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_scoring_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_type: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_type?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          organization_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          organization_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          organization_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_integrations: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          integration_type: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          integration_type: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          integration_type?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_integrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["org_role"]
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          permission_profile_id: string | null
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          permission_profile_id?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          permission_profile_id?: string | null
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_permission_profile_id_fkey"
            columns: ["permission_profile_id"]
            isOneToOne: false
            referencedRelation: "permission_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_onboarding: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          organization_id: string
          step_first_contact_completed: boolean | null
          step_pipeline_completed: boolean | null
          step_profile_completed: boolean | null
          step_team_completed: boolean | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          organization_id: string
          step_first_contact_completed?: boolean | null
          step_pipeline_completed?: boolean | null
          step_profile_completed?: boolean | null
          step_team_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          step_first_contact_completed?: boolean | null
          step_pipeline_completed?: boolean | null
          step_profile_completed?: boolean | null
          step_team_completed?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_onboarding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          plan: string | null
          plan_id: string | null
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          plan?: string | null
          plan_id?: string | null
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          plan?: string | null
          plan_id?: string | null
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          organization_id: string | null
          permissions: Json
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          organization_id?: string | null
          permissions?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          organization_id?: string | null
          permissions?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string | null
          position: number
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          position?: number
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          max_automations: number | null
          max_contacts: number | null
          max_emails_per_month: number | null
          max_forms: number | null
          max_users: number | null
          max_whatsapp_messages: number | null
          name: string
          price_monthly: number | null
          price_yearly: number | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_automations?: number | null
          max_contacts?: number | null
          max_emails_per_month?: number | null
          max_forms?: number | null
          max_users?: number | null
          max_whatsapp_messages?: number | null
          name: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          max_automations?: number | null
          max_contacts?: number | null
          max_emails_per_month?: number | null
          max_forms?: number | null
          max_users?: number | null
          max_whatsapp_messages?: number | null
          name?: string
          price_monthly?: number | null
          price_yearly?: number | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          organization_id: string | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          earned_at: string
          id: string
          metadata: Json | null
          organization_id: string | null
          points: number
          user_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          points?: number
          user_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          points?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          automations_created: number
          contacts_created: number
          created_at: string
          current_streak: number
          deals_won: number
          emails_sent: number
          id: string
          last_activity_date: string | null
          level: number
          longest_streak: number
          organization_id: string | null
          tasks_completed: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          automations_created?: number
          contacts_created?: number
          created_at?: string
          current_streak?: number
          deals_won?: number
          emails_sent?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          organization_id?: string | null
          tasks_completed?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          automations_created?: number
          contacts_created?: number
          created_at?: string
          current_streak?: number
          deals_won?: number
          emails_sent?: number
          id?: string
          last_activity_date?: string | null
          level?: number
          longest_streak?: number
          organization_id?: string | null
          tasks_completed?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_gamification_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          organization_id: string | null
          payload: Json
          processed: boolean | null
          processed_at: string | null
          source: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          organization_id?: string | null
          payload: Json
          processed?: boolean | null
          processed_at?: string | null
          source: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          processed?: boolean | null
          processed_at?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          processed_at: string | null
          request_body: Json | null
          request_headers: Json | null
          response_body: Json | null
          status: string
          status_code: number | null
          webhook_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          status?: string
          status_code?: number | null
          webhook_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          request_body?: Json | null
          request_headers?: Json | null
          response_body?: Json | null
          status?: string
          status_code?: number | null
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "inbound_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campaign_recipients: {
        Row: {
          campaign_id: string
          contact_id: string | null
          created_at: string
          delivered_at: string | null
          error_message: string | null
          id: string
          name: string | null
          phone_number: string
          read_at: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          contact_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          name?: string | null
          phone_number: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Update: {
          campaign_id?: string
          contact_id?: string | null
          created_at?: string
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          name?: string | null
          phone_number?: string
          read_at?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          daily_limit: number | null
          delay_between_messages: number | null
          description: string | null
          id: string
          media_url: string | null
          message_content: string
          message_type: string
          messages_delivered: number | null
          messages_failed: number | null
          messages_per_minute: number | null
          messages_read: number | null
          messages_sent: number | null
          name: string
          organization_id: string
          paused_at: string | null
          scheduled_at: string | null
          started_at: string | null
          status: string
          target_filters: Json | null
          target_type: string
          total_recipients: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          daily_limit?: number | null
          delay_between_messages?: number | null
          description?: string | null
          id?: string
          media_url?: string | null
          message_content: string
          message_type?: string
          messages_delivered?: number | null
          messages_failed?: number | null
          messages_per_minute?: number | null
          messages_read?: number | null
          messages_sent?: number | null
          name: string
          organization_id: string
          paused_at?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          target_filters?: Json | null
          target_type?: string
          total_recipients?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          daily_limit?: number | null
          delay_between_messages?: number | null
          description?: string | null
          id?: string
          media_url?: string | null
          message_content?: string
          message_type?: string
          messages_delivered?: number | null
          messages_failed?: number | null
          messages_per_minute?: number | null
          messages_read?: number | null
          messages_sent?: number | null
          name?: string
          organization_id?: string
          paused_at?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          status?: string
          target_filters?: Json | null
          target_type?: string
          total_recipients?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_group_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          group_id: string
          id: string
          member_id: string | null
          phone_number: string
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          group_id: string
          id?: string
          member_id?: string | null
          phone_number: string
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          group_id?: string
          id?: string
          member_id?: string | null
          phone_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_group_events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_group_events_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_group_members"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_group_members: {
        Row: {
          contact_id: string | null
          created_at: string
          group_id: string
          id: string
          is_admin: boolean | null
          joined_at: string
          left_at: string | null
          name: string | null
          phone_number: string
          status: string
          updated_at: string
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          group_id: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string
          left_at?: string | null
          name?: string | null
          phone_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          group_id?: string
          id?: string
          is_admin?: boolean | null
          joined_at?: string
          left_at?: string | null
          name?: string | null
          phone_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_group_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_group_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_active: boolean | null
          media_url: string | null
          message_type: string
          name: string
          organization_id: string
          target_groups: string[] | null
          trigger_event: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          media_url?: string | null
          message_type?: string
          name: string
          organization_id: string
          target_groups?: string[] | null
          trigger_event?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          media_url?: string | null
          message_type?: string
          name?: string
          organization_id?: string
          target_groups?: string[] | null
          trigger_event?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_group_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_groups: {
        Row: {
          created_at: string
          description: string | null
          external_group_id: string | null
          group_type: string
          id: string
          invite_link: string | null
          is_active: boolean | null
          is_admin: boolean | null
          member_count: number | null
          name: string
          organization_id: string
          settings: Json | null
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_group_id?: string | null
          group_type?: string
          id?: string
          invite_link?: string | null
          is_active?: boolean | null
          is_admin?: boolean | null
          member_count?: number | null
          name: string
          organization_id: string
          settings?: Json | null
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_group_id?: string | null
          group_type?: string
          id?: string
          invite_link?: string | null
          is_active?: boolean | null
          is_admin?: boolean | null
          member_count?: number | null
          name?: string
          organization_id?: string
          settings?: Json | null
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_groups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          buttons: Json | null
          category: string | null
          content: string
          created_at: string
          external_template_id: string | null
          footer_text: string | null
          header_content: string | null
          header_type: string | null
          id: string
          language: string | null
          name: string
          organization_id: string
          status: string | null
          updated_at: string
          variables: Json | null
        }
        Insert: {
          buttons?: Json | null
          category?: string | null
          content: string
          created_at?: string
          external_template_id?: string | null
          footer_text?: string | null
          header_content?: string | null
          header_type?: string | null
          id?: string
          language?: string | null
          name: string
          organization_id: string
          status?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Update: {
          buttons?: Json | null
          category?: string | null
          content?: string
          created_at?: string
          external_template_id?: string | null
          footer_text?: string | null
          header_content?: string | null
          header_type?: string | null
          id?: string
          language?: string | null
          name?: string
          organization_id?: string
          status?: string | null
          updated_at?: string
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points: {
        Args: {
          _action: string
          _org_id: string
          _points: number
          _user_id: string
        }
        Returns: undefined
      }
      check_plan_limit: {
        Args: { _current_count?: number; _org_id: string; _resource: string }
        Returns: Json
      }
      create_organization_with_owner: {
        Args: { org_name: string; org_slug: string }
        Returns: string
      }
      get_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_role"]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_permission: {
        Args: {
          _action: string
          _module: string
          _org_id: string
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_automation_executions: {
        Args: { automation_id: string }
        Returns: undefined
      }
      is_org_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_action:
        | "view"
        | "create"
        | "edit"
        | "delete"
        | "export"
        | "import"
        | "manage"
      app_module:
        | "contacts"
        | "companies"
        | "pipeline"
        | "tasks"
        | "inbox"
        | "email"
        | "whatsapp"
        | "automations"
        | "lead_scoring"
        | "forms"
        | "analytics"
        | "integrations"
        | "settings"
        | "organization"
        | "admin"
      app_role: "admin" | "moderator" | "user"
      org_role: "owner" | "admin" | "member" | "viewer"
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
      app_action: [
        "view",
        "create",
        "edit",
        "delete",
        "export",
        "import",
        "manage",
      ],
      app_module: [
        "contacts",
        "companies",
        "pipeline",
        "tasks",
        "inbox",
        "email",
        "whatsapp",
        "automations",
        "lead_scoring",
        "forms",
        "analytics",
        "integrations",
        "settings",
        "organization",
        "admin",
      ],
      app_role: ["admin", "moderator", "user"],
      org_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
