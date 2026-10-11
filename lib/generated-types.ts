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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          adults_count: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          check_in: string
          check_out: string
          children_count: number
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
          tourist_tax_currency: string
          tourist_tax_per_adult_night: number
          tourist_tax_total: number
        }
        Insert: {
          adults_count?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in: string
          check_out: string
          children_count?: number
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
          tourist_tax_currency?: string
          tourist_tax_per_adult_night?: number
          tourist_tax_total?: number
        }
        Update: {
          adults_count?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          check_in?: string
          check_out?: string
          children_count?: number
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
          tourist_tax_currency?: string
          tourist_tax_per_adult_night?: number
          tourist_tax_total?: number
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
      delkom_assistant_chats: {
        Row: {
          chat_id: number
          connection_id: string
          last_sent: string | null
          last_update: number
          lease_until: string | null
          lease_update: number | null
          paused: boolean
          updated_at: string
        }
        Insert: {
          chat_id: number
          connection_id: string
          last_sent?: string | null
          last_update?: number
          lease_until?: string | null
          lease_update?: number | null
          paused?: boolean
          updated_at?: string
        }
        Update: {
          chat_id?: number
          connection_id?: string
          last_sent?: string | null
          last_update?: number
          lease_until?: string | null
          lease_update?: number | null
          paused?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      driver_pricing: {
        Row: {
          active: boolean
          child_seat_price: number
          created_at: string
          currency: string
          driver_id: string
          extra_stop_price: number
          id: string
          included_wait_minutes: number
          minimum_fare: number
          night_surcharge_pct: number
          peak_surcharge_pct: number
          price_per_km: number
          round_trip_discount_pct: number
          updated_at: string
          vehicle_class: string
          waiting_price_per_minute: number
        }
        Insert: {
          active?: boolean
          child_seat_price?: number
          created_at?: string
          currency?: string
          driver_id: string
          extra_stop_price?: number
          id?: string
          included_wait_minutes?: number
          minimum_fare?: number
          night_surcharge_pct?: number
          peak_surcharge_pct?: number
          price_per_km: number
          round_trip_discount_pct?: number
          updated_at?: string
          vehicle_class?: string
          waiting_price_per_minute?: number
        }
        Update: {
          active?: boolean
          child_seat_price?: number
          created_at?: string
          currency?: string
          driver_id?: string
          extra_stop_price?: number
          id?: string
          included_wait_minutes?: number
          minimum_fare?: number
          night_surcharge_pct?: number
          peak_surcharge_pct?: number
          price_per_km?: number
          round_trip_discount_pct?: number
          updated_at?: string
          vehicle_class?: string
          waiting_price_per_minute?: number
        }
        Relationships: [
          {
            foreignKeyName: "driver_pricing_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "drivers"
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
      exchange_rates: {
        Row: {
          base_currency: string
          fetched_at: string
          quote_currency: string
          rate: number
          source: string
        }
        Insert: {
          base_currency: string
          fetched_at?: string
          quote_currency: string
          rate: number
          source?: string
        }
        Update: {
          base_currency?: string
          fetched_at?: string
          quote_currency?: string
          rate?: number
          source?: string
        }
        Relationships: []
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
      organized_tour_bookings: {
        Row: {
          created_at: string
          full_name: string
          id: string
          notes: string
          participants: number
          phone: string
          status: string
          tour_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          notes?: string
          participants: number
          phone: string
          status?: string
          tour_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          notes?: string
          participants?: number
          phone?: string
          status?: string
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organized_tour_bookings_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "organized_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      organized_tours: {
        Row: {
          cancellation_terms: string
          capacity: number
          contact_phone: string
          created_at: string
          currency: string
          description: string
          destination: string
          end_date: string
          id: string
          included: string
          organizer_id: string
          organizer_name: string
          payment_terms: string
          photos: string[]
          price: number
          start_date: string
          status: string
          title: string
        }
        Insert: {
          cancellation_terms: string
          capacity: number
          contact_phone: string
          created_at?: string
          currency: string
          description: string
          destination: string
          end_date: string
          id?: string
          included: string
          organizer_id: string
          organizer_name: string
          payment_terms: string
          photos?: string[]
          price: number
          start_date: string
          status?: string
          title: string
        }
        Update: {
          cancellation_terms?: string
          capacity?: number
          contact_phone?: string
          created_at?: string
          currency?: string
          description?: string
          destination?: string
          end_date?: string
          id?: string
          included?: string
          organizer_id?: string
          organizer_name?: string
          payment_terms?: string
          photos?: string[]
          price?: number
          start_date?: string
          status?: string
          title?: string
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
      sales_conversations: {
        Row: {
          busy_until: string | null
          completed_at: string | null
          completion_summary: string | null
          consent_at: string
          contact: string
          created_at: string
          expires_at: string
          full_name: string
          id: string
          locale: string
          status: string
          summary: string
          summary_email_id: string | null
          summary_email_sent_at: string | null
          summary_email_status: string
          token_hash: string
          turns: number
          updated_at: string
        }
        Insert: {
          busy_until?: string | null
          completed_at?: string | null
          completion_summary?: string | null
          consent_at?: string
          contact: string
          created_at?: string
          expires_at?: string
          full_name: string
          id?: string
          locale?: string
          status?: string
          summary?: string
          summary_email_id?: string | null
          summary_email_sent_at?: string | null
          summary_email_status?: string
          token_hash: string
          turns?: number
          updated_at?: string
        }
        Update: {
          busy_until?: string | null
          completed_at?: string | null
          completion_summary?: string | null
          consent_at?: string
          contact?: string
          created_at?: string
          expires_at?: string
          full_name?: string
          id?: string
          locale?: string
          status?: string
          summary?: string
          summary_email_id?: string | null
          summary_email_sent_at?: string | null
          summary_email_status?: string
          token_hash?: string
          turns?: number
          updated_at?: string
        }
        Relationships: []
      }
      sales_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: number
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: never
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: never
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "sales_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_usage: {
        Row: {
          bucket: string
          count: number
          day: string
        }
        Insert: {
          bucket: string
          count?: number
          day?: string
        }
        Update: {
          bucket?: string
          count?: number
          day?: string
        }
        Relationships: []
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
      tourist_tax_rates: {
        Row: {
          accommodation_type: string
          active: boolean
          amount_per_adult_per_night: number
          children_exempt_under_age: number
          city: string
          currency: string
          guest_type: string
          id: string
          source_url: string | null
          tax_year: number
          updated_at: string
        }
        Insert: {
          accommodation_type: string
          active?: boolean
          amount_per_adult_per_night: number
          children_exempt_under_age?: number
          city?: string
          currency?: string
          guest_type: string
          id?: string
          source_url?: string | null
          tax_year: number
          updated_at?: string
        }
        Update: {
          accommodation_type?: string
          active?: boolean
          amount_per_adult_per_night?: number
          children_exempt_under_age?: number
          city?: string
          currency?: string
          guest_type?: string
          id?: string
          source_url?: string | null
          tax_year?: number
          updated_at?: string
        }
        Relationships: []
      }
      transport_default_pricing: {
        Row: {
          child_seat_price: number
          currency: string
          extra_stop_price: number
          included_wait_minutes: number
          night_surcharge_pct: number
          peak_surcharge_pct: number
          price_per_km: number
          round_trip_discount_pct: number
          service_fee_pct: number
          updated_at: string
          vehicle_class: string
        }
        Insert: {
          child_seat_price?: number
          currency?: string
          extra_stop_price?: number
          included_wait_minutes?: number
          night_surcharge_pct?: number
          peak_surcharge_pct?: number
          price_per_km: number
          round_trip_discount_pct?: number
          service_fee_pct?: number
          updated_at?: string
          vehicle_class: string
        }
        Update: {
          child_seat_price?: number
          currency?: string
          extra_stop_price?: number
          included_wait_minutes?: number
          night_surcharge_pct?: number
          peak_surcharge_pct?: number
          price_per_km?: number
          round_trip_discount_pct?: number
          service_fee_pct?: number
          updated_at?: string
          vehicle_class?: string
        }
        Relationships: []
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
          extra_stops: number
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
          pickup_location: string | null
          pickup_time: string | null
          preferred_currency: string
          quoted_total: number | null
          rooms_count: number | null
          status: string
          tour_interests: string[]
          trip_type: string
          updated_at: string
          user_id: string | null
          vehicle_class: string
        }
        Insert: {
          arrival_date: string
          child_seats?: number
          created_at?: string
          currency?: string
          departure_date: string
          destination?: string
          email?: string | null
          extra_stops?: number
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
          pickup_location?: string | null
          pickup_time?: string | null
          preferred_currency?: string
          quoted_total?: number | null
          rooms_count?: number | null
          status?: string
          tour_interests?: string[]
          trip_type?: string
          updated_at?: string
          user_id?: string | null
          vehicle_class?: string
        }
        Update: {
          arrival_date?: string
          child_seats?: number
          created_at?: string
          currency?: string
          departure_date?: string
          destination?: string
          email?: string | null
          extra_stops?: number
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
          pickup_location?: string | null
          pickup_time?: string | null
          preferred_currency?: string
          quoted_total?: number | null
          rooms_count?: number | null
          status?: string
          tour_interests?: string[]
          trip_type?: string
          updated_at?: string
          user_id?: string | null
          vehicle_class?: string
        }
        Relationships: []
      }
      uman_bot_state: {
        Row: {
          holder: string | null
          id: number
          lease_until: string | null
          previous_snapshot: string
          revision: number
          snapshot: string
          updated_at: string
        }
        Insert: {
          holder?: string | null
          id: number
          lease_until?: string | null
          previous_snapshot?: string
          revision?: number
          snapshot?: string
          updated_at?: string
        }
        Update: {
          holder?: string | null
          id?: number
          lease_until?: string | null
          previous_snapshot?: string
          revision?: number
          snapshot?: string
          updated_at?: string
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
      delkom_claim: {
        Args: { action: string; c: string; ch: number; u: number }
        Returns: string
      }
      delkom_finish: {
        Args: {
          action: string
          c: string
          ch: number
          success: boolean
          u: number
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      sales_claim_completion: { Args: { p_id: string }; Returns: boolean }
      sales_claim_turn: { Args: { p_id: string }; Returns: boolean }
      sales_take_quota: {
        Args: { p_bucket: string; p_limit: number }
        Returns: boolean
      }
      uman_bot_acquire: { Args: { owner_id: string }; Returns: Json }
      uman_bot_release: { Args: { owner_id: string }; Returns: undefined }
      uman_bot_save: {
        Args: {
          expected_revision: number
          new_snapshot: string
          owner_id: string
        }
        Returns: number
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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

