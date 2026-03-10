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
          dietary_restrictions?: string;
          notes?: string;
          created_at?: string;
        };
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
      };
      budget_items: {
        Row: {
          id: string;
          category_id: string;
          wedding_id: string;
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
          name?: string;
          estimated_cost?: number;
          actual_cost?: number;
          paid?: boolean;
          payment_date?: string | null;
          notes?: string;
          created_at?: string;
        };
      };
      vendors: {
        Row: {
          id: string;
          wedding_id: string;
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
      };
    };
  };
};
