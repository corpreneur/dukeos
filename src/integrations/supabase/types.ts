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
      service_addresses: {
        Row: {
          city: string
          created_at: string
          customer_id: string
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
          cancelled_at: string | null
          created_at: string
          customer_id: string
          frequency: string
          id: string
          plan: string
          price_cents: number
          started_at: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address_id: string
          cancelled_at?: string | null
          created_at?: string
          customer_id: string
          frequency?: string
          id?: string
          plan?: string
          price_cents?: number
          started_at?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address_id?: string
          cancelled_at?: string | null
          created_at?: string
          customer_id?: string
          frequency?: string
          id?: string
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
      app_role: "admin" | "technician" | "customer"
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
      app_role: ["admin", "technician", "customer"],
      job_status: ["scheduled", "in_progress", "completed", "cancelled"],
      proof_type: ["before", "after"],
    },
  },
} as const
