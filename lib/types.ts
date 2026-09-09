// Generated via `mcp__Supabase__generate_typescript_types` against project
// lwajbjjewauvmzpcjryz (Uman2Go). Regenerate rather than hand-edit if the
// schema changes.
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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in: string
          check_out: string
          created_at: string
          currency: string
          extras_total: number
          grow_transaction_id: string | null
          guest_email: string | null
          guest_full_name: string | null
          guest_id: string | null
          guest_phone: string | null
          guests_count: number
          hotel_id: string
          id: string
          invoice_doc_no: number | null
          invoice_id: string | null
          invoice_pdf_url: string | null
          nights: number | null
          payment_confirmed_at: string | null
          platform_fee: number | null
          platform_fee_currency: string
          platform_fee_paid_at: string | null
          price_per_night: number
          room_id: string
          room_pricing_type: string
          selected_extras: Json
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number | null
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in: string
          check_out: string
          created_at?: string
          currency?: string
          extras_total?: number
          grow_transaction_id?: string | null
          guest_email?: string | null
          guest_full_name?: string | null
          guest_id?: string | null
          guest_phone?: string | null
          guests_count?: number
          hotel_id: string
          id?: string
          invoice_doc_no?: number | null
          invoice_id?: string | null
          invoice_pdf_url?: string | null
          nights?: number | null
          payment_confirmed_at?: string | null
          platform_fee?: number | null
          platform_fee_currency?: string
          platform_fee_paid_at?: string | null
          price_per_night: number
          room_id: string
          room_pricing_type?: string
          selected_extras?: Json
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in?: string
          check_out?: string
          created_at?: string
          currency?: string
          extras_total?: number
          grow_transaction_id?: string | null
          guest_email?: string | null
          guest_full_name?: string | null
          guest_id?: string | null
          guest_phone?: string | null
          guests_count?: number
          hotel_id?: string
          id?: string
          invoice_doc_no?: number | null
          invoice_id?: string | null
          invoice_pdf_url?: string | null
          nights?: number | null
          payment_confirmed_at?: string | null
          platform_fee?: number | null
          platform_fee_currency?: string
          platform_fee_paid_at?: string | null
          price_per_night?: number
          room_id?: string
          room_pricing_type?: string
          selected_extras?: Json
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_reviews: {
        Row: {
          comment: string
          created_at: string
          driver_id: string
          driver_rating: number
          id: string
          reviewer_name: string
          vehicle_rating: number
        }
        Insert: {
          comment?: string
          created_at?: string
          driver_id: string
          driver_rating: number
          id?: string
          reviewer_name: string
          vehicle_rating: number
        }
        Update: {
          comment?: string
          created_at?: string
          driver_id?: string
          driver_rating?: number
          id?: string
          reviewer_name?: string
          vehicle_rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "driver_reviews_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_routes: {
        Row: {
          created_at: string
          currency: string
          destination: string
          destination_i18n: Json
          driver_id: string
          id: string
          price: number
          round_trip_price: number | null
          status: string
        }
        Insert: {
          created_at?: string
          currency?: string
          destination: string
          destination_i18n?: Json
          driver_id: string
          id?: string
          price: number
          round_trip_price?: number | null
          status?: string
        }
        Update: {
          created_at?: string
          currency?: string
          destination?: string
          destination_i18n?: Json
          driver_id?: string
          id?: string
          price?: number
          round_trip_price?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_routes_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          contact_name: string | null
          created_at: string
          description: string
          description_i18n: Json
          featured: boolean
          id: string
          name: string
          owner_id: string
          passenger_capacity: number | null
          phone_alt: string | null
          photos: string[]
          slug: string
          status: string
          terms_accepted_at: string | null
          vehicle_type: string
          vehicle_type_i18n: Json
          verified_at: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          description?: string
          description_i18n?: Json
          featured?: boolean
          id?: string
          name: string
          owner_id: string
          passenger_capacity?: number | null
          phone_alt?: string | null
          photos?: string[]
          slug: string
          status?: string
          terms_accepted_at?: string | null
          vehicle_type?: string
          vehicle_type_i18n?: Json
          verified_at?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          description?: string
          description_i18n?: Json
          featured?: boolean
          id?: string
          name?: string
          owner_id?: string
          passenger_capacity?: number | null
          phone_alt?: string | null
          photos?: string[]
          slug?: string
          status?: string
          terms_accepted_at?: string | null
          vehicle_type?: string
          vehicle_type_i18n?: Json
          verified_at?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flight_requests: {
        Row: {
          adults_count: number | null
          budget_estimate: string | null
          children_count: number | null
          created_at: string
          departure_date: string
          email: string | null
          flight_preference: string | null
          full_name: string
          id: string
          luggage_type: string | null
          notes: string
          origin_city: string | null
          passengers_count: number
          phone: string
          preferred_destination: string | null
          return_date: string | null
          status: string
          travel_insurance: boolean
          wants_hotel: boolean
          wants_tour: boolean
          wants_transport: boolean
          wants_vip: boolean
          whatsapp: string | null
        }
        Insert: {
          adults_count?: number | null
          budget_estimate?: string | null
          children_count?: number | null
          created_at?: string
          departure_date: string
          email?: string | null
          flight_preference?: string | null
          full_name: string
          id?: string
          luggage_type?: string | null
          notes?: string
          origin_city?: string | null
          passengers_count?: number
          phone: string
          preferred_destination?: string | null
          return_date?: string | null
          status?: string
          travel_insurance?: boolean
          wants_hotel?: boolean
          wants_tour?: boolean
          wants_transport?: boolean
          wants_vip?: boolean
          whatsapp?: string | null
        }
        Update: {
          adults_count?: number | null
          budget_estimate?: string | null
          children_count?: number | null
          created_at?: string
          departure_date?: string
          email?: string | null
          flight_preference?: string | null
          full_name?: string
          id?: string
          luggage_type?: string | null
          notes?: string
          origin_city?: string | null
          passengers_count?: number
          phone?: string
          preferred_destination?: string | null
          return_date?: string | null
          status?: string
          travel_insurance?: boolean
          wants_hotel?: boolean
          wants_tour?: boolean
          wants_transport?: boolean
          wants_vip?: boolean
          whatsapp?: string | null
        }
        Relationships: []
      }
      home_rental_leads: {
        Row: {
          area: string
          asking_price: string
          capacity: number | null
          created_at: string
          full_name: string
          id: string
          notes: string
          phone: string
          property_type: string
        }
        Insert: {
          area?: string
          asking_price?: string
          capacity?: number | null
          created_at?: string
          full_name: string
          id?: string
          notes?: string
          phone: string
          property_type?: string
        }
        Update: {
          area?: string
          asking_price?: string
          capacity?: number | null
          created_at?: string
          full_name?: string
          id?: string
          notes?: string
          phone?: string
          property_type?: string
        }
        Relationships: []
      }
      hotel_reviews: {
        Row: {
          comment: string
          created_at: string
          host_rating: number
          hotel_id: string
          id: string
          property_rating: number
          reviewer_name: string
        }
        Insert: {
          comment?: string
          created_at?: string
          host_rating: number
          hotel_id: string
          id?: string
          property_rating: number
          reviewer_name: string
        }
        Update: {
          comment?: string
          created_at?: string
          host_rating?: number
          hotel_id?: string
          id?: string
          property_rating?: number
          reviewer_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "hotel_reviews_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      hotels: {
        Row: {
          address: string
          address_i18n: Json
          amenities: string[]
          amenities_i18n: Json
          area: string
          area_i18n: Json
          contact_name: string | null
          created_at: string
          description: string
          description_i18n: Json
          distance_to_kever_meters: number | null
          extra_services: Json
          featured: boolean
          id: string
          name: string
          owner_id: string
          phone_alt: string | null
          photos: string[]
          property_type: string
          slug: string
          status: string
          terms_accepted_at: string | null
          verified_at: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          address?: string
          address_i18n?: Json
          amenities?: string[]
          amenities_i18n?: Json
          area?: string
          area_i18n?: Json
          contact_name?: string | null
          created_at?: string
          description?: string
          description_i18n?: Json
          distance_to_kever_meters?: number | null
          extra_services?: Json
          featured?: boolean
          id?: string
          name: string
          owner_id: string
          phone_alt?: string | null
          photos?: string[]
          property_type?: string
          slug: string
          status?: string
          terms_accepted_at?: string | null
          verified_at?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          address?: string
          address_i18n?: Json
          amenities?: string[]
          amenities_i18n?: Json
          area?: string
          area_i18n?: Json
          contact_name?: string | null
          created_at?: string
          description?: string
          description_i18n?: Json
          distance_to_kever_meters?: number | null
          extra_services?: Json
          featured?: boolean
          id?: string
          name?: string
          owner_id?: string
          phone_alt?: string | null
          photos?: string[]
          property_type?: string
          slug?: string
          status?: string
          terms_accepted_at?: string | null
          verified_at?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hotels_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_requests: {
        Row: {
          created_at: string
          full_name: string
          id: string
          notes: string
          phone: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          notes?: string
          phone: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          notes?: string
          phone?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string
          role: Database["public"]["Enums"]["user_role"]
          terms_accepted_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string
          role?: Database["public"]["Enums"]["user_role"]
          terms_accepted_at?: string | null
        }
        Relationships: []
      }
      provider_applications: {
        Row: {
          availability_notes: string | null
          bed_count: number | null
          created_at: string | null
          duration: string | null
          full_name: string
          group_size: number | null
          id: string
          languages_spoken: string | null
          location: string | null
          max_guests: number | null
          notes: string | null
          passenger_capacity: number | null
          phone: string
          photos: string[] | null
          preferred_language: string | null
          price_estimate: string | null
          provider_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          room_count: number | null
          routes: string | null
          source: string | null
          status: string
          telegram: string | null
          tour_description: string | null
          vehicle_type: string | null
          whatsapp: string | null
        }
        Insert: {
          availability_notes?: string | null
          bed_count?: number | null
          created_at?: string | null
          duration?: string | null
          full_name: string
          group_size?: number | null
          id?: string
          languages_spoken?: string | null
          location?: string | null
          max_guests?: number | null
          notes?: string | null
          passenger_capacity?: number | null
          phone: string
          photos?: string[] | null
          preferred_language?: string | null
          price_estimate?: string | null
          provider_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_count?: number | null
          routes?: string | null
          source?: string | null
          status?: string
          telegram?: string | null
          tour_description?: string | null
          vehicle_type?: string | null
          whatsapp?: string | null
        }
        Update: {
          availability_notes?: string | null
          bed_count?: number | null
          created_at?: string | null
          duration?: string | null
          full_name?: string
          group_size?: number | null
          id?: string
          languages_spoken?: string | null
          location?: string | null
          max_guests?: number | null
          notes?: string | null
          passenger_capacity?: number | null
          phone?: string
          photos?: string[] | null
          preferred_language?: string | null
          price_estimate?: string | null
          provider_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          room_count?: number | null
          routes?: string | null
          source?: string | null
          status?: string
          telegram?: string | null
          tour_description?: string | null
          vehicle_type?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          currency: string
          description: string
          description_i18n: Json
          hotel_id: string
          id: string
          name: string
          photos: string[]
          price_per_night: number
          pricing_type: string
          quantity: number
          status: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string
          description_i18n?: Json
          hotel_id: string
          id?: string
          name: string
          photos?: string[]
          price_per_night: number
          pricing_type?: string
          quantity?: number
          status?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string
          description_i18n?: Json
          hotel_id?: string
          id?: string
          name?: string
          photos?: string[]
          price_per_night?: number
          pricing_type?: string
          quantity?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_hotel_id_fkey"
            columns: ["hotel_id"]
            isOneToOne: false
            referencedRelation: "hotels"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_dates: {
        Row: {
          capacity: number
          created_at: string
          currency: string
          description: string
          description_i18n: Json
          guide_id: string
          id: string
          price: number
          status: string
          title: string
          title_i18n: Json
          tour_date: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string
          description_i18n?: Json
          guide_id: string
          id?: string
          price: number
          status?: string
          title: string
          title_i18n?: Json
          tour_date: string
        }
        Update: {
          capacity?: number
          created_at?: string
          currency?: string
          description?: string
          description_i18n?: Json
          guide_id?: string
          id?: string
          price?: number
          status?: string
          title?: string
          title_i18n?: Json
          tour_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_dates_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "tour_guides"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_guides: {
        Row: {
          contact_name: string | null
          created_at: string
          description: string
          description_i18n: Json
          id: string
          name: string
          owner_id: string
          phone_alt: string | null
          photos: string[]
          slug: string
          status: string
          terms_accepted_at: string | null
          verified_at: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          description?: string
          description_i18n?: Json
          id?: string
          name: string
          owner_id: string
          phone_alt?: string | null
          photos?: string[]
          slug: string
          status?: string
          terms_accepted_at?: string | null
          verified_at?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          description?: string
          description_i18n?: Json
          id?: string
          name?: string
          owner_id?: string
          phone_alt?: string | null
          photos?: string[]
          slug?: string
          status?: string
          terms_accepted_at?: string | null
          verified_at?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tour_guides_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tour_signups: {
        Row: {
          created_at: string
          full_name: string
          guide_id: string
          id: string
          invoice_doc_no: number | null
          invoice_id: string | null
          invoice_pdf_url: string | null
          notes: string
          participants_count: number
          payment_confirmed_at: string | null
          phone: string
          platform_fee: number | null
          platform_fee_currency: string
          platform_fee_paid_at: string | null
          status: string
          tour_date_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          guide_id: string
          id?: string
          invoice_doc_no?: number | null
          invoice_id?: string | null
          invoice_pdf_url?: string | null
          notes?: string
          participants_count?: number
          payment_confirmed_at?: string | null
          phone: string
          platform_fee?: number | null
          platform_fee_currency?: string
          platform_fee_paid_at?: string | null
          status?: string
          tour_date_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          guide_id?: string
          id?: string
          invoice_doc_no?: number | null
          invoice_id?: string | null
          invoice_pdf_url?: string | null
          notes?: string
          participants_count?: number
          payment_confirmed_at?: string | null
          phone?: string
          platform_fee?: number | null
          platform_fee_currency?: string
          platform_fee_paid_at?: string | null
          status?: string
          tour_date_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_signups_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "tour_guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_signups_tour_date_id_fkey"
            columns: ["tour_date_id"]
            isOneToOne: false
            referencedRelation: "tour_dates"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_requests: {
        Row: {
          created_at: string
          departure_date: string
          departure_time: string | null
          destination: string
          driver_id: string | null
          full_name: string
          guests_count: number
          id: string
          invoice_doc_no: number | null
          invoice_id: string | null
          invoice_pdf_url: string | null
          notes: string
          origin: string
          payment_confirmed_at: string | null
          phone: string
          platform_fee: number | null
          platform_fee_currency: string
          platform_fee_paid_at: string | null
          round_trip: boolean
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          departure_date: string
          departure_time?: string | null
          destination: string
          driver_id?: string | null
          full_name: string
          guests_count?: number
          id?: string
          invoice_doc_no?: number | null
          invoice_id?: string | null
          invoice_pdf_url?: string | null
          notes?: string
          origin?: string
          payment_confirmed_at?: string | null
          phone: string
          platform_fee?: number | null
          platform_fee_currency?: string
          platform_fee_paid_at?: string | null
          round_trip?: boolean
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          departure_date?: string
          departure_time?: string | null
          destination?: string
          driver_id?: string | null
          full_name?: string
          guests_count?: number
          id?: string
          invoice_doc_no?: number | null
          invoice_id?: string | null
          invoice_pdf_url?: string | null
          notes?: string
          origin?: string
          payment_confirmed_at?: string | null
          phone?: string
          platform_fee?: number | null
          platform_fee_currency?: string
          platform_fee_paid_at?: string | null
          round_trip?: boolean
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_requests: {
        Row: {
          arrival_date: string
          child_seats: number
          created_at: string
          currency: string
          departure_date: string
          destination: string
          email: string | null
          full_name: string
          hotel_budget: number | null
          id: string
          luggage_count: number | null
          needs_hotel: boolean
          needs_tours: boolean
          needs_transport: boolean
          notes: string | null
          passengers: number
          phone: string
          preferred_currency: string
          pickup_time: string | null
          pickup_location: string | null
          quoted_total: number | null
          rooms_count: number | null
          status: string
          tour_interests: string[]
          trip_type: string
          updated_at: string
          user_id: string | null
          vehicle_class: string
          extra_stops: number
        }
        Insert: {
          arrival_date: string
          child_seats?: number
          created_at?: string
          currency?: string
          departure_date: string
          destination?: string
          email?: string | null
          full_name: string
          hotel_budget?: number | null
          id?: string
          luggage_count?: number | null
          needs_hotel?: boolean
          needs_tours?: boolean
          needs_transport?: boolean
          notes?: string | null
          passengers?: number
          phone: string
          preferred_currency?: string
          pickup_time?: string | null
          pickup_location?: string | null
          quoted_total?: number | null
          rooms_count?: number | null
          status?: string
          tour_interests?: string[]
          trip_type?: string
          updated_at?: string
          user_id?: string | null
          vehicle_class?: string
          extra_stops?: number
        }
        Update: {
          arrival_date?: string
          child_seats?: number
          created_at?: string
          currency?: string
          departure_date?: string
          destination?: string
          email?: string | null
          full_name?: string
          hotel_budget?: number | null
          id?: string
          luggage_count?: number | null
          needs_hotel?: boolean
          needs_tours?: boolean
          needs_transport?: boolean
          notes?: string | null
          passengers?: number
          phone?: string
          preferred_currency?: string
          pickup_time?: string | null
          pickup_location?: string | null
          quoted_total?: number | null
          rooms_count?: number | null
          status?: string
          tour_interests?: string[]
          trip_type?: string
          updated_at?: string
          user_id?: string | null
          vehicle_class?: string
          extra_stops?: number
        }
        Relationships: []
      }
      vip_requests: {
        Row: {
          created_at: string
          full_name: string
          id: string
          notes: string
          phone: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          notes?: string
          phone: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          notes?: string
          phone?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      available_room_ids: {
        Args: { p_check_in: string; p_check_out: string }
        Returns: string[]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "pending_deposit"
        | "deposit_paid"
        | "confirmed"
        | "cancelled"
      user_role: "guest" | "hotel_owner" | "admin" | "driver" | "tour_guide"
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
      booking_status: [
        "pending_deposit",
        "deposit_paid",
        "confirmed",
        "cancelled",
      ],
      user_role: ["guest", "hotel_owner", "admin", "driver", "tour_guide"],
    },
  },
} as const

// Convenience aliases used throughout the app.
export type Hotel = Tables<"hotels">
export type Room = Tables<"rooms">
export type Booking = Tables<"bookings">
export type HotelReview = Tables<"hotel_reviews">
export type Driver = Tables<"drivers">
export type DriverRoute = Tables<"driver_routes">
export type DriverReview = Tables<"driver_reviews">
export type TransportRequest = Tables<"transport_requests">
export type TourGuide = Tables<"tour_guides">
export type TourDate = Tables<"tour_dates">
export type TourSignup = Tables<"tour_signups">
export type Profile = Tables<"profiles">
export type VipRequest = Tables<"vip_requests">
export type InvestmentRequest = Tables<"investment_requests">
export type FlightRequest = Tables<"flight_requests">
export type HomeRentalLead = Tables<"home_rental_leads">
export type ProviderApplication = Tables<"provider_applications">
export type TripRequest = Tables<"trip_requests">
