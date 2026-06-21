// ============================================================
// Tipos do banco de dados
// Este arquivo deve ser REGENERADO sempre que o schema mudar:
//   npx supabase gen types typescript --linked > src/types/database.ts
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          photo_url: string | null
          course: string | null
          nickname: string | null
          internship_start: string | null
          internship_end: string | null
          pin: string | null
          role: 'intern' | 'manager'
          is_active: boolean
          created_at: string
          total_hours_required: number | null
          points: number
          level: number
          streak_days: number
          last_activity_date: string | null
        }
        Insert: {
          id: string
          full_name: string
          email: string
          photo_url?: string | null
          course?: string | null
          nickname?: string | null
          internship_start?: string | null
          internship_end?: string | null
          pin?: string | null
          role?: 'intern' | 'manager'
          is_active?: boolean
          created_at?: string
          total_hours_required?: number | null
          points?: number
          level?: number
          streak_days?: number
          last_activity_date?: string | null
        }
        Update: {
          full_name?: string
          email?: string
          photo_url?: string | null
          course?: string | null
          nickname?: string | null
          internship_start?: string | null
          internship_end?: string | null
          pin?: string | null
          role?: 'intern' | 'manager'
          is_active?: boolean
          total_hours_required?: number | null
          points?: number
          level?: number
          streak_days?: number
          last_activity_date?: string | null
        }
        Relationships: []
      }
      intern_schedules: {
        Row: {
          id: string
          intern_id: string
          day_of_week: number
          expected_start: string
          expected_end: string
          expected_hours: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          intern_id: string
          day_of_week: number
          expected_start: string
          expected_end: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          expected_start?: string
          expected_end?: string
          is_active?: boolean
        }
        Relationships: []
      }
      time_records: {
        Row: {
          id: string
          intern_id: string
          clock_in: string
          clock_out: string | null
          duration_minutes: number | null
          notes: string | null
          status: 'pending' | 'approved' | 'rejected'
          rejection_reason: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          // Geolocation fields (added via migration)
          geo_lat: number | null
          geo_lng: number | null
          geo_accuracy: number | null
          geo_distance: number | null
          geo_status: string | null
          geo_blocked: boolean | null
          is_late: boolean | null
        }
        Insert: {
          id?: string
          intern_id: string
          clock_in: string
          clock_out?: string | null
          notes?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          rejection_reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
          geo_lat?: number | null
          geo_lng?: number | null
          geo_accuracy?: number | null
          geo_distance?: number | null
          geo_status?: string | null
          geo_blocked?: boolean | null
          is_late?: boolean | null
        }
        Update: {
          clock_out?: string | null
          notes?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          rejection_reason?: string | null
          approved_by?: string | null
          approved_at?: string | null
          geo_lat?: number | null
          geo_lng?: number | null
          geo_accuracy?: number | null
          geo_distance?: number | null
          geo_status?: string | null
          geo_blocked?: boolean | null
          is_late?: boolean | null
        }
        Relationships: []
      }
      location_attempts: {
        Row: {
          id: string
          user_id: string
          user_name: string | null
          attempted_at: string
          action_type: string
          geo_lat: number | null
          geo_lng: number | null
          geo_accuracy: number | null
          geo_distance: number | null
          geo_status: string
          block_reason: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_name?: string | null
          attempted_at?: string
          action_type?: string
          geo_lat?: number | null
          geo_lng?: number | null
          geo_accuracy?: number | null
          geo_distance?: number | null
          geo_status: string
          block_reason?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          geo_status?: string
          block_reason?: string | null
        }
        Relationships: []
      }
      activities: {
        Row: {
          id: string
          time_record_id: string
          description: string
          is_favorite: boolean
          created_at: string
        }
        Insert: {
          id?: string
          time_record_id: string
          description: string
          is_favorite?: boolean
          created_at?: string
        }
        Update: {
          description?: string
          is_favorite?: boolean
        }
        Relationships: []
      }
      favorite_activities: {
        Row: {
          id: string
          intern_id: string
          description: string
          use_count: number
          created_at: string
        }
        Insert: {
          id?: string
          intern_id: string
          description: string
          use_count?: number
          created_at?: string
        }
        Update: {
          description?: string
          use_count?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'reminder_in' | 'reminder_out' | 'pending' | 'rejection' | 'approval'
          scheduled_for: string | null
          sent_at: string | null
          is_sent: boolean
          payload: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'reminder_in' | 'reminder_out' | 'pending' | 'rejection' | 'approval'
          scheduled_for?: string | null
          sent_at?: string | null
          is_sent?: boolean
          payload?: Json | null
          created_at?: string
        }
        Update: {
          type?: 'reminder_in' | 'reminder_out' | 'pending' | 'rejection' | 'approval'
          scheduled_for?: string | null
          sent_at?: string | null
          is_sent?: boolean
          payload?: Json | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          id: string
          reminder_in_time: string
          reminder_out_after_hours: number
          expected_daily_hours: number
          lab_name: string
          report_email: string | null
          updated_at: string
          // Geolocation settings (added via migration)
          geo_enabled: boolean | null
          geo_lat: number | null
          geo_lng: number | null
          geo_radius_meters: number | null
        }
        Insert: {
          id?: string
          reminder_in_time?: string
          reminder_out_after_hours?: number
          expected_daily_hours?: number
          lab_name?: string
          report_email?: string | null
          updated_at?: string
          geo_enabled?: boolean | null
          geo_lat?: number | null
          geo_lng?: number | null
          geo_radius_meters?: number | null
        }
        Update: {
          reminder_in_time?: string
          reminder_out_after_hours?: number
          expected_daily_hours?: number
          lab_name?: string
          report_email?: string | null
          geo_enabled?: boolean | null
          geo_lat?: number | null
          geo_lng?: number | null
          geo_radius_meters?: number | null
        }
        Relationships: []
      }
      achievements: {
        Row: {
          id: string
          intern_id: string
          type: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          intern_id: string
          type: string
          unlocked_at?: string
        }
        Update: {
          unlocked_at?: string
        }
        Relationships: []
      }
      points_history: {
        Row: {
          id: string
          intern_id: string
          points: number
          reason: string
          multiplier: number
          created_at: string
        }
        Insert: {
          id?: string
          intern_id: string
          points: number
          reason: string
          multiplier?: number
          created_at?: string
        }
        Update: {
          points?: number
          reason?: string
          multiplier?: number
        }
        Relationships: []
      }
      system_updates: {
        Row: {
          id: string
          title: string
          description: string
          type: 'feature' | 'fix' | 'improvement' | 'announcement'
          module: string | null
          details: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          type?: 'feature' | 'fix' | 'improvement' | 'announcement'
          module?: string | null
          details?: string | null
          created_at?: string
        }
        Update: {
          title?: string
          description?: string
          type?: 'feature' | 'fix' | 'improvement' | 'announcement'
          module?: string | null
          details?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          id: string
          intern_id: string
          category: 'suggestion' | 'bug' | 'praise' | 'other'
          message: string
          status: 'new' | 'read' | 'implemented' | 'archived'
          admin_reply: string | null
          created_at: string
        }
        Insert: {
          id?: string
          intern_id: string
          category?: 'suggestion' | 'bug' | 'praise' | 'other'
          message: string
          status?: 'new' | 'read' | 'implemented' | 'archived'
          admin_reply?: string | null
          created_at?: string
        }
        Update: {
          category?: 'suggestion' | 'bug' | 'praise' | 'other'
          message?: string
          status?: 'new' | 'read' | 'implemented' | 'archived'
          admin_reply?: string | null
        }
        Relationships: []
      }
      // Views tratadas como tabelas read-only (workaround para supabase-js v2)
      v_today_status: {
        Row: {
          id: string
          full_name: string
          photo_url: string | null
          email: string
          record_id: string | null
          clock_in: string | null
          clock_out: string | null
          status: string | null
          today_status: 'ativo' | 'saiu' | 'ausente'
          today_minutes: number
          pending_count: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
      v_monthly_hours: {
        Row: {
          intern_id: string
          month: string
          total_minutes: number
          total_sessions: number
          approved_sessions: number
          pending_sessions: number
          rejected_sessions: number
        }
        Insert: never
        Update: never
        Relationships: []
      }
      v_pending_approvals: {
        Row: {
          id: string
          intern_id: string
          intern_name: string
          photo_url: string | null
          clock_in: string
          clock_out: string | null
          duration_minutes: number | null
          notes: string | null
          status: string
          created_at: string
          activities: Json
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      is_manager: {
        Args: Record<string, never>
        Returns: boolean
      }
      backfill_gamification: {
        Args: Record<string, never>
        Returns: Json
      }
      get_report_summary: {
        Args: {
          p_start_date: string
          p_end_date: string
        }
        Returns: Array<{
          id: string
          full_name: string
          email: string
          course: string | null
          nickname: string | null
          total_minutes: number
          total_sessions: number
          approved_sessions: number
          pending_sessions: number
          rejected_sessions: number
        }>
      }
    }
  }
}

// ──────────────────────────────────────────────────────────
// Tipos derivados (helpers)
// ──────────────────────────────────────────────────────────
export type Profile = Database['public']['Tables']['profiles']['Row']
export type TimeRecord = Database['public']['Tables']['time_records']['Row']
export type Activity = Database['public']['Tables']['activities']['Row']
export type FavoriteActivity = Database['public']['Tables']['favorite_activities']['Row']
export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type Settings = Database['public']['Tables']['settings']['Row']
export type InternSchedule = Database['public']['Tables']['intern_schedules']['Row']
export type SystemUpdate = Database['public']['Tables']['system_updates']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']

export type TodayStatus = Database['public']['Tables']['v_today_status']['Row']
export type MonthlyHours = Database['public']['Tables']['v_monthly_hours']['Row']
export type PendingApproval = Database['public']['Tables']['v_pending_approvals']['Row']

export type RecordStatus = 'pending' | 'approved' | 'rejected'
export type UserRole = 'intern' | 'manager'
