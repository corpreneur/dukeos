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
      addon_orders: {
        Row: {
          addon_id: string
          created_at: string
          customer_id: string
          id: string
          job_id: string | null
          price_cents: number
          status: string
          subscription_id: string | null
        }
        Insert: {
          addon_id: string
          created_at?: string
          customer_id: string
          id?: string
          job_id?: string | null
          price_cents?: number
          status?: string
          subscription_id?: string | null
        }
        Update: {
          addon_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          job_id?: string | null
          price_cents?: number
          status?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addon_orders_addon_id_fkey"
            columns: ["addon_id"]
            isOneToOne: false
            referencedRelation: "service_addons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_orders_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addon_orders_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      gate_verifications: {
        Row: {
          admin_alerted: boolean
          ai_response: Json | null
          confidence_score: number | null
          created_at: string
          gate_detected: boolean
          id: string
          job_id: string
          job_proof_id: string
          latch_secure: boolean
          verified_at: string
        }
        Insert: {
          admin_alerted?: boolean
          ai_response?: Json | null
          confidence_score?: number | null
          created_at?: string
          gate_detected?: boolean
          id?: string
          job_id: string
          job_proof_id: string
          latch_secure?: boolean
          verified_at?: string
        }
        Update: {
          admin_alerted?: boolean
          ai_response?: Json | null
          confidence_score?: number | null
          created_at?: string
          gate_detected?: boolean
          id?: string
          job_id?: string
          job_proof_id?: string
          latch_secure?: boolean
          verified_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gate_verifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gate_verifications_job_proof_id_fkey"
            columns: ["job_proof_id"]
            isOneToOne: false
            referencedRelation: "job_proofs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_proofs: {
        Row: {
          created_at: string
          id: string
          image_url: string
          job_id: string
          proof_type: Database["public"]["Enums"]["proof_type"]
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          job_id: string
          proof_type: Database["public"]["Enums"]["proof_type"]
          uploaded_by: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          job_id?: string
          proof_type?: Database["public"]["Enums"]["proof_type"]
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_proofs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address_id: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          scheduled_date: string
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
          subscription_id: string
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          address_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          subscription_id: string
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          address_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          scheduled_date?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          subscription_id?: string
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "service_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          metadata: Json | null
          read: boolean
          sent_at: string
          title: string | null
          type: string
          user_id: string
        }
        Insert: {
          body: string
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          sent_at?: string
          title?: string | null
          type: string
          user_id: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          read?: boolean
          sent_at?: string
          title?: string | null
          type?: string
          user_id?: string
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
      service_addons: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          price_cents: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          price_cents?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          price_cents?: number
        }
        Relationships: []
      }
      service_addresses: {
        Row: {
          city: string
          created_at: string
          customer_id: string
          density_score: number | null
          id: string
          label: string
          lat: number | null
          lng: number | null
          state: string
          street: string
          updated_at: string
          zip: string
        }
        Insert: {
          city: string
          created_at?: string
          customer_id: string
          density_score?: number | null
          id?: string
          label?: string
          lat?: number | null
          lng?: number | null
          state?: string
          street: string
          updated_at?: string
          zip: string
        }
        Update: {
          city?: string
          created_at?: string
          customer_id?: string
          density_score?: number | null
          id?: string
          label?: string
          lat?: number | null
          lng?: number | null
          state?: string
          street?: string
          updated_at?: string
          zip?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          active: boolean
          address_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          customer_id: string
          frequency: string
          id: string
          num_dogs: number
          plan: string
          price_cents: number
          started_at: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id: string
          frequency?: string
          id?: string
          num_dogs?: number
          plan?: string
          price_cents?: number
          started_at?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string
          frequency?: string
          id?: string
          num_dogs?: number
          plan?: string
          price_cents?: number
          started_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "service_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      tech_locations: {
        Row: {
          heading: number | null
          id: string
          lat: number
          lng: number
          speed: number | null
          technician_id: string
          updated_at: string
        }
        Insert: {
          heading?: number | null
          id?: string
          lat: number
          lng: number
          speed?: number | null
          technician_id: string
          updated_at?: string
        }
        Update: {
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          speed?: number | null
          technician_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      technician_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          technician_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          technician_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          technician_id?: string
        }
        Relationships: []
      }
      technician_skills: {
        Row: {
          certified: boolean
          created_at: string
          expires_at: string | null
          id: string
          skill: string
          technician_id: string
        }
        Insert: {
          certified?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          skill: string
          technician_id: string
        }
        Update: {
          certified?: boolean
          created_at?: string
          expires_at?: string | null
          id?: string
          skill?: string
          technician_id?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          id: string
          job_id: string
          notes: string | null
          technician_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          job_id: string
          notes?: string | null
          technician_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          job_id?: string
          notes?: string | null
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      weather_alerts: {
        Row: {
          affected_zip: string | null
          alert_date: string
          auto_reschedule: boolean
          created_at: string
          description: string
          dismissed: boolean
          id: string
          severity: string
        }
        Insert: {
          affected_zip?: string | null
          alert_date: string
          auto_reschedule?: boolean
          created_at?: string
          description: string
          dismissed?: boolean
          id?: string
          severity?: string
        }
        Update: {
          affected_zip?: string | null
          alert_date?: string
          auto_reschedule?: boolean
          created_at?: string
          description?: string
          dismissed?: boolean
          id?: string
          severity?: string
        }
        Relationships: []
      }
      yard_issues: {
        Row: {
          created_at: string
          id: string
          issue_type: string
          job_id: string
          notes: string | null
          photo_url: string | null
          resolved: boolean
          technician_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_type: string
          job_id: string
          notes?: string | null
          photo_url?: string | null
          resolved?: boolean
          technician_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_type?: string
          job_id?: string
          notes?: string | null
          photo_url?: string | null
          resolved?: boolean
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "yard_issues_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_remove_user_role: {
        Args: {
          remove_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      admin_set_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "technician" | "customer" | "manager"
      job_status: "scheduled" | "in_progress" | "completed" | "cancelled"
      proof_type: "before" | "after"
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
      app_role: ["admin", "technician", "customer", "manager"],
      job_status: ["scheduled", "in_progress", "completed", "cancelled"],
      proof_type: ["before", "after"],
    },
  },
} as const
