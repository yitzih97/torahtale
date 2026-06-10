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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      affiliate_applications: {
        Row: {
          audience: string
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          payout_email: string
          phone: string | null
          social_link: string | null
          status: string
          updated_at: string
        }
        Insert: {
          audience: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          payout_email: string
          phone?: string | null
          social_link?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          audience?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          payout_email?: string
          phone?: string | null
          social_link?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      book_reviews: {
        Row: {
          approved: boolean
          book_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved?: boolean
          book_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved?: boolean
          book_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      books: {
        Row: {
          art_style: string | null
          child_id: string | null
          child_name: string | null
          cover_image_url: string | null
          created_at: string
          id: string
          language: string | null
          order_number: string | null
          pages_data: Json | null
          questions: Json | null
          shipping_data: Json | null
          status: string
          story_data: Json | null
          torah_portion: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          art_style?: string | null
          child_id?: string | null
          child_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          language?: string | null
          order_number?: string | null
          pages_data?: Json | null
          questions?: Json | null
          shipping_data?: Json | null
          status?: string
          story_data?: Json | null
          torah_portion?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          art_style?: string | null
          child_id?: string | null
          child_name?: string | null
          cover_image_url?: string | null
          created_at?: string
          id?: string
          language?: string | null
          order_number?: string | null
          pages_data?: Json | null
          questions?: Json | null
          shipping_data?: Json | null
          status?: string
          story_data?: Json | null
          torah_portion?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          age: number | null
          art_style: string | null
          created_at: string
          description: string | null
          gender: string | null
          id: string
          name: string
          photo_url: string | null
          user_id: string
        }
        Insert: {
          age?: number | null
          art_style?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          name: string
          photo_url?: string | null
          user_id: string
        }
        Update: {
          age?: number | null
          art_style?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          name?: string
          photo_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contact_tickets: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      site_assets: {
        Row: {
          asset_key: string
          created_at: string | null
          id: string
          image_url: string | null
          prompt_used: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          asset_key: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          prompt_used?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_key?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          prompt_used?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          category: string
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string
        }
        Insert: {
          category: string
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: string
        }
        Update: {
          category?: string
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          art_style: string | null
          canceled_at: string | null
          child_id: string | null
          child_name: string | null
          created_at: string
          frequency: string
          id: string
          language: string | null
          next_delivery_date: string | null
          price_per_week: number
          shipping_data: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          art_style?: string | null
          canceled_at?: string | null
          child_id?: string | null
          child_name?: string | null
          created_at?: string
          frequency?: string
          id?: string
          language?: string | null
          next_delivery_date?: string | null
          price_per_week?: number
          shipping_data?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          art_style?: string | null
          canceled_at?: string | null
          child_id?: string | null
          child_name?: string | null
          created_at?: string
          frequency?: string
          id?: string
          language?: string | null
          next_delivery_date?: string | null
          price_per_week?: number
          shipping_data?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
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
      site_assets_public: {
        Row: {
          asset_key: string | null
          created_at: string | null
          id: string | null
          image_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          asset_key?: string | null
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          asset_key?: string | null
          created_at?: string | null
          id?: string | null
          image_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
