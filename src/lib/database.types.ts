export type Database = {
  public: {
    Tables: {
      weddings: {
        Row: {
          id: string;
          user_id: string;
          partner1_name: string;
          partner2_name: string;
          wedding_date: string | null;
          venue: string;
          total_budget: number;
          guest_count_target: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          partner1_name?: string;
          partner2_name?: string;
          wedding_date?: string | null;
          venue?: string;
          total_budget?: number;
          guest_count_target?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          partner1_name?: string;
          partner2_name?: string;
          wedding_date?: string | null;
          venue?: string;
          total_budget?: number;
          guest_count_target?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          wedding_id: string;
          name: string;
          event_date: string | null;
          event_time: string;
          venue: string;
          dress_code: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          name: string;
          event_date?: string | null;
          event_time?: string;
          venue?: string;
          dress_code?: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          name?: string;
          event_date?: string | null;
          event_time?: string;
          venue?: string;
          dress_code?: string;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      guest_events: {
        Row: {
          id: string;
          guest_id: string;
          event_id: string;
          rsvp_status: 'pending' | 'accepted' | 'declined';
          created_at: string;
        };
        Insert: {
          id?: string;
          guest_id: string;
          event_id: string;
          rsvp_status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
        };
        Update: {
          id?: string;
          guest_id?: string;
          event_id?: string;
          rsvp_status?: 'pending' | 'accepted' | 'declined';
          created_at?: string;
        };
        Relationships: [];
      };
      guests: {
        Row: {
          id: string;
          wedding_id: string;
          name: string;
          email: string;
          phone: string;
          rsvp_status: 'pending' | 'accepted' | 'declined';
          plus_one: boolean;
          side: 'bride' | 'groom' | 'mutual';
          party_size: number;
          hall: 'men' | 'women' | 'mixed';
          dietary_restrictions: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          name: string;
          email?: string;
          phone?: string;
          rsvp_status?: 'pending' | 'accepted' | 'declined';
          plus_one?: boolean;
          side?: 'bride' | 'groom' | 'mutual';
          party_size?: number;
          hall?: 'men' | 'women' | 'mixed';
          dietary_restrictions?: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          rsvp_status?: 'pending' | 'accepted' | 'declined';
          plus_one?: boolean;
          side?: 'bride' | 'groom' | 'mutual';
          party_size?: number;
          hall?: 'men' | 'women' | 'mixed';
          dietary_restrictions?: string;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      budget_categories: {
        Row: {
          id: string;
          wedding_id: string;
          name: string;
          allocated_amount: number;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          name: string;
          allocated_amount?: number;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          name?: string;
          allocated_amount?: number;
          color?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      budget_items: {
        Row: {
          id: string;
          category_id: string;
          wedding_id: string;
          event_id: string | null;
          name: string;
          estimated_cost: number;
          actual_cost: number;
          paid: boolean;
          payment_date: string | null;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          wedding_id: string;
          event_id?: string | null;
          name: string;
          estimated_cost?: number;
          actual_cost?: number;
          paid?: boolean;
          payment_date?: string | null;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          wedding_id?: string;
          event_id?: string | null;
          name?: string;
          estimated_cost?: number;
          actual_cost?: number;
          paid?: boolean;
          payment_date?: string | null;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          wedding_id: string;
          event_id: string | null;
          name: string;
          category: string;
          contact_name: string;
          email: string;
          phone: string;
          website: string;
          cost: number;
          paid: boolean;
          contract_signed: boolean;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          event_id?: string | null;
          name: string;
          category: string;
          contact_name?: string;
          email?: string;
          phone?: string;
          website?: string;
          cost?: number;
          paid?: boolean;
          contract_signed?: boolean;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          event_id?: string | null;
          name?: string;
          category?: string;
          contact_name?: string;
          email?: string;
          phone?: string;
          website?: string;
          cost?: number;
          paid?: boolean;
          contract_signed?: boolean;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      vendor_payments: {
        Row: {
          id: string;
          vendor_id: string;
          wedding_id: string;
          amount: number;
          due_date: string | null;
          paid: boolean;
          paid_date: string | null;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          vendor_id: string;
          wedding_id: string;
          amount?: number;
          due_date?: string | null;
          paid?: boolean;
          paid_date?: string | null;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          vendor_id?: string;
          wedding_id?: string;
          amount?: number;
          due_date?: string | null;
          paid?: boolean;
          paid_date?: string | null;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      outfits: {
        Row: {
          id: string;
          wedding_id: string;
          event_id: string | null;
          name: string;
          for_person: string;
          item_type: string;
          shop: string;
          estimated_cost: number;
          actual_cost: number;
          purchased: boolean;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          event_id?: string | null;
          name: string;
          for_person?: string;
          item_type?: string;
          shop?: string;
          estimated_cost?: number;
          actual_cost?: number;
          purchased?: boolean;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          event_id?: string | null;
          name?: string;
          for_person?: string;
          item_type?: string;
          shop?: string;
          estimated_cost?: number;
          actual_cost?: number;
          purchased?: boolean;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      checklist_items: {
        Row: {
          id: string;
          wedding_id: string;
          title: string;
          description: string;
          due_date: string | null;
          completed: boolean;
          priority: 'low' | 'medium' | 'high';
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          wedding_id: string;
          title: string;
          description?: string;
          due_date?: string | null;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          category?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          wedding_id?: string;
          title?: string;
          description?: string;
          due_date?: string | null;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          category?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
