export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Profile = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  photo_url: string | null
  role: 'player' | 'coach' | 'collaborator' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  category: string | null
  weight_class: string | null
  weight_kg: number | null
  level: string | null
  membership_status: string | null
  date_of_birth: string | null
  place_of_birth: string | null
  is_minor: boolean
  guardian_name: string | null
  guardian_phone: string | null
  parent_name: string | null
  parent_phone: string | null
  created_at: string
}

export type PublicProfile = {
  id: string
  full_name: string | null
  phone: string | null
  email: string | null
  photo_url: string | null
  role: 'player' | 'coach' | 'collaborator' | 'admin'
  status: 'pending' | 'approved' | 'rejected'
  category: string | null
  weight_class: string | null
  weight_kg: number | null
  level: string | null
  membership_status: string | null
  is_minor: boolean
  created_at: string
}

export type TrainingSession = {
  id: string
  title: string
  location: string | null
  notes: string | null
  starts_at: string
  created_by: string | null
  status: 'scheduled' | 'started' | 'completed'
  created_at: string
}

export type Attendance = {
  id: string
  session_id: string
  player_id: string
  status: 'present' | 'absent' | 'late' | 'pending'
  marked_at: string | null
}

export type Post = {
  id: string
  author_id: string | null
  caption: string | null
  created_at: string
}

export type Media = {
  id: string
  post_id: string
  type: 'image' | 'video'
  file_url: string
  thumbnail_url: string | null
  created_at: string
}

export type Like = {
  post_id: string
  user_id: string
  created_at: string
}

export type Announcement = {
  id: string
  sent_by: string | null
  title: string
  body: string
  target: string | null
  sent_at: string
}

export type DeviceToken = {
  id: string
  user_id: string
  expo_push_token: string
  updated_at: string
}

export type Conversation = {
  id: string
  name: string | null
  is_group: boolean
  created_by: string | null
  created_at: string
}

export type ConversationMember = {
  conversation_id: string
  user_id: string
  joined_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string | null
  body: string
  read_at: string | null
  created_at: string
}

export type FighterCard = {
  id: string
  player_id: string
  display_name: string | null
  photo_url: string | null
  category: string | null
  weight_class: string | null
  level: string | null
  wins: number
  losses: number
  membership_status: string | null
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> }
      training_sessions: {
        Row: TrainingSession
        Insert: Partial<TrainingSession>
        Update: Partial<TrainingSession>
      }
      attendance: { Row: Attendance; Insert: Partial<Attendance>; Update: Partial<Attendance> }
      posts: { Row: Post; Insert: Partial<Post>; Update: Partial<Post> }
      media: { Row: Media; Insert: Partial<Media>; Update: Partial<Media> }
      likes: { Row: Like; Insert: Partial<Like>; Update: Partial<Like> }
      announcements: {
        Row: Announcement
        Insert: Partial<Announcement>
        Update: Partial<Announcement>
      }
      device_tokens: {
        Row: DeviceToken
        Insert: Partial<DeviceToken>
        Update: Partial<DeviceToken>
      }
      conversations: {
        Row: Conversation
        Insert: Partial<Conversation>
        Update: Partial<Conversation>
      }
      conversation_members: {
        Row: ConversationMember
        Insert: Partial<ConversationMember>
        Update: Partial<ConversationMember>
      }
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> }
      fighter_cards: {
        Row: FighterCard
        Insert: Partial<FighterCard>
        Update: Partial<FighterCard>
      }
    }
    Views: {
      public_profiles: { Row: PublicProfile }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}