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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      appellations: {
        Row: {
          created_at: string
          id: string
          name: string
          region_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          region_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          region_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appellations_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      grape_varieties: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_year: number | null
          created_at: string
          display_name: string | null
          id: string
          location: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_year?: number | null
          created_at?: string
          display_name?: string | null
          id?: string
          location?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          country_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regions_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      user_friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      wine_cellar: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          quantity: number
          storage_location: string | null
          updated_at: string
          user_id: string
          wine_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          storage_location?: string | null
          updated_at?: string
          user_id: string
          wine_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          quantity?: number
          storage_location?: string | null
          updated_at?: string
          user_id?: string
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wine_cellar_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
        ]
      }
      wine_consumptions: {
        Row: {
          consumed_at: string
          created_at: string
          id: string
          notes: string | null
          quantity: number
          rating_id: string | null
          updated_at: string
          user_id: string
          wine_id: string
        }
        Insert: {
          consumed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          rating_id?: string | null
          updated_at?: string
          user_id: string
          wine_id: string
        }
        Update: {
          consumed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          rating_id?: string | null
          updated_at?: string
          user_id?: string
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wine_consumptions_rating_id_fkey"
            columns: ["rating_id"]
            isOneToOne: false
            referencedRelation: "wine_ratings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wine_consumptions_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
        ]
      }
      wine_grape_composition: {
        Row: {
          created_at: string
          grape_variety_id: string
          id: string
          percentage: number
          updated_at: string
          wine_id: string
        }
        Insert: {
          created_at?: string
          grape_variety_id: string
          id?: string
          percentage: number
          updated_at?: string
          wine_id: string
        }
        Update: {
          created_at?: string
          grape_variety_id?: string
          id?: string
          percentage?: number
          updated_at?: string
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wine_grape_composition_grape_variety_id_fkey"
            columns: ["grape_variety_id"]
            isOneToOne: false
            referencedRelation: "grape_varieties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wine_grape_composition_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
        ]
      }
      wine_ratings: {
        Row: {
          appearance_clarity: string | null
          appearance_color: string | null
          appearance_comments: string | null
          appearance_intensity: string | null
          appearance_viscosity: string | null
          aroma_comments: string | null
          aroma_condition: string | null
          aroma_intensity: string | null
          aroma_primary: string | null
          aroma_secondary: string | null
          aroma_tertiary: string | null
          body: string | null
          color: string | null
          created_at: string
          food_pairing: string | null
          id: string
          palate_acidity: string | null
          palate_balance: string | null
          palate_body: string | null
          palate_comments: string | null
          palate_complexity: string | null
          palate_finish: string | null
          palate_flavor_primary: string | null
          palate_flavor_secondary: string | null
          palate_flavor_tertiary: string | null
          palate_sweetness: string | null
          palate_tannin: string | null
          rating: number
          serving_temp_max: number | null
          serving_temp_min: number | null
          sweetness: string | null
          tasting_date: string | null
          tasting_notes: string | null
          updated_at: string
          user_id: string
          wine_id: string
        }
        Insert: {
          appearance_clarity?: string | null
          appearance_color?: string | null
          appearance_comments?: string | null
          appearance_intensity?: string | null
          appearance_viscosity?: string | null
          aroma_comments?: string | null
          aroma_condition?: string | null
          aroma_intensity?: string | null
          aroma_primary?: string | null
          aroma_secondary?: string | null
          aroma_tertiary?: string | null
          body?: string | null
          color?: string | null
          created_at?: string
          food_pairing?: string | null
          id?: string
          palate_acidity?: string | null
          palate_balance?: string | null
          palate_body?: string | null
          palate_comments?: string | null
          palate_complexity?: string | null
          palate_finish?: string | null
          palate_flavor_primary?: string | null
          palate_flavor_secondary?: string | null
          palate_flavor_tertiary?: string | null
          palate_sweetness?: string | null
          palate_tannin?: string | null
          rating: number
          serving_temp_max?: number | null
          serving_temp_min?: number | null
          sweetness?: string | null
          tasting_date?: string | null
          tasting_notes?: string | null
          updated_at?: string
          user_id: string
          wine_id: string
        }
        Update: {
          appearance_clarity?: string | null
          appearance_color?: string | null
          appearance_comments?: string | null
          appearance_intensity?: string | null
          appearance_viscosity?: string | null
          aroma_comments?: string | null
          aroma_condition?: string | null
          aroma_intensity?: string | null
          aroma_primary?: string | null
          aroma_secondary?: string | null
          aroma_tertiary?: string | null
          body?: string | null
          color?: string | null
          created_at?: string
          food_pairing?: string | null
          id?: string
          palate_acidity?: string | null
          palate_balance?: string | null
          palate_body?: string | null
          palate_comments?: string | null
          palate_complexity?: string | null
          palate_finish?: string | null
          palate_flavor_primary?: string | null
          palate_flavor_secondary?: string | null
          palate_flavor_tertiary?: string | null
          palate_sweetness?: string | null
          palate_tannin?: string | null
          rating?: number
          serving_temp_max?: number | null
          serving_temp_min?: number | null
          sweetness?: string | null
          tasting_date?: string | null
          tasting_notes?: string | null
          updated_at?: string
          user_id?: string
          wine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wine_ratings_wine_id_fkey"
            columns: ["wine_id"]
            isOneToOne: false
            referencedRelation: "wines"
            referencedColumns: ["id"]
          },
        ]
      }
      wines: {
        Row: {
          alcohol_content: number | null
          appellation_id: string | null
          bottle_size: string | null
          cellar_tracker_id: string | null
          country_id: string | null
          created_at: string
          grape_variety_ids: string[] | null
          id: string
          image_url: string | null
          name: string
          producer: string
          region_id: string | null
          updated_at: string
          vintage: number | null
          wine_type: Database["public"]["Enums"]["wine_type"]
        }
        Insert: {
          alcohol_content?: number | null
          appellation_id?: string | null
          bottle_size?: string | null
          cellar_tracker_id?: string | null
          country_id?: string | null
          created_at?: string
          grape_variety_ids?: string[] | null
          id?: string
          image_url?: string | null
          name: string
          producer: string
          region_id?: string | null
          updated_at?: string
          vintage?: number | null
          wine_type: Database["public"]["Enums"]["wine_type"]
        }
        Update: {
          alcohol_content?: number | null
          appellation_id?: string | null
          bottle_size?: string | null
          cellar_tracker_id?: string | null
          country_id?: string | null
          created_at?: string
          grape_variety_ids?: string[] | null
          id?: string
          image_url?: string | null
          name?: string
          producer?: string
          region_id?: string | null
          updated_at?: string
          vintage?: number | null
          wine_type?: Database["public"]["Enums"]["wine_type"]
        }
        Relationships: [
          {
            foreignKeyName: "wines_appellation_id_fkey"
            columns: ["appellation_id"]
            isOneToOne: false
            referencedRelation: "appellations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wines_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wines_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
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
      app_role: "owner" | "admin" | "user"
      wine_body: "light" | "medium" | "full"
      wine_color: "light" | "medium" | "deep"
      wine_sweetness: "bone_dry" | "dry" | "off_dry" | "medium_sweet" | "sweet"
      wine_type:
        | "red"
        | "white"
        | "rose"
        | "sparkling"
        | "dessert"
        | "fortified"
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
      app_role: ["owner", "admin", "user"],
      wine_body: ["light", "medium", "full"],
      wine_color: ["light", "medium", "deep"],
      wine_sweetness: ["bone_dry", "dry", "off_dry", "medium_sweet", "sweet"],
      wine_type: ["red", "white", "rose", "sparkling", "dessert", "fortified"],
    },
  },
} as const
