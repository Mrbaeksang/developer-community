export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          role: 'user' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      post_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          category_id: string | null
          title: string
          content: string
          excerpt: string | null
          status: 'draft' | 'pending' | 'approved' | 'rejected'
          tags: string[]
          view_count: number
          featured_image: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          category_id?: string | null
          title: string
          content: string
          excerpt?: string | null
          status?: 'draft' | 'pending' | 'approved' | 'rejected'
          tags?: string[]
          view_count?: number
          featured_image?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          category_id?: string | null
          title?: string
          content?: string
          excerpt?: string | null
          status?: 'draft' | 'pending' | 'approved' | 'rejected'
          tags?: string[]
          view_count?: number
          featured_image?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          parent_id: string | null
          content: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          parent_id?: string | null
          content: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          parent_id?: string | null
          content?: string
          created_at?: string
          updated_at?: string
        }
      }
      post_likes: {
        Row: {
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      communities: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          visibility: 'public' | 'private'
          cover_image: string | null
          icon_url: string | null
          tags: string[]
          max_members: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          visibility?: 'public' | 'private'
          cover_image?: string | null
          icon_url?: string | null
          tags?: string[]
          max_members?: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          visibility?: 'public' | 'private'
          cover_image?: string | null
          icon_url?: string | null
          tags?: string[]
          max_members?: number
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      community_members: {
        Row: {
          community_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          community_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          community_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      community_join_requests: {
        Row: {
          id: string
          community_id: string
          user_id: string
          message: string | null
          status: 'pending' | 'approved' | 'rejected'
          reviewed_by: string | null
          reviewed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          message?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          message?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          reviewed_by?: string | null
          reviewed_at?: string | null
          created_at?: string
        }
      }
      community_messages: {
        Row: {
          id: string
          community_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      community_memos: {
        Row: {
          id: string
          community_id: string
          author_id: string
          title: string
          content: string
          tags: string[]
          is_pinned: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          community_id: string
          author_id: string
          title: string
          content: string
          tags?: string[]
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          author_id?: string
          title?: string
          content?: string
          tags?: string[]
          is_pinned?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      community_files: {
        Row: {
          id: string
          community_id: string
          uploaded_by: string
          file_name: string
          file_url: string
          file_size: number | null
          mime_type: string | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          community_id: string
          uploaded_by: string
          file_name: string
          file_url: string
          file_size?: number | null
          mime_type?: string | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          community_id?: string
          uploaded_by?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          mime_type?: string | null
          category?: string | null
          created_at?: string
        }
      }
      admin_logs: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_type: string | null
          target_id: string | null
          details: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_type?: string | null
          target_id?: string | null
          details?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_type?: string | null
          target_id?: string | null
          details?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'user' | 'admin'
      post_status: 'draft' | 'pending' | 'approved' | 'rejected'
      community_visibility: 'public' | 'private'
      join_request_status: 'pending' | 'approved' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}