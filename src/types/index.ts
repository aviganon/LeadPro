// ========== USERS & AUTH ==========

export type UserRole = 'admin' | 'user'
export type UserPlan = 'free' | 'basic' | 'pro' | 'enterprise'
export type LeadVertical =
  | 'real_estate'
  | 'car'
  | 'general'
  | 'recruitment'
  | 'solar_energy'
  | 'insurance'
  | 'mortgage'
  | 'legal'
  | 'accounting'
  | 'renovation'
  | string

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  plan: UserPlan
  vertical: LeadVertical
  /** קטגוריית איסוף לידים (נדל״ן / רכב / כללי) — נשמר ב-Firestore */
  scrapeVertical?: LeadVertical
  createdAt: Date
  updatedAt: Date
  facebookConnected: boolean
  facebookUserId?: string
  facebookTokenExpiry?: Date
  stripeCustomerId?: string
  isActive: boolean
}

// ========== FACEBOOK ==========

export interface FacebookToken {
  userId: string           // our user id
  fbUserId: string
  accessToken: string      // ciphertext when tokenEncrypted is true
  tokenEncrypted?: boolean
  tokenExpiry: Date
  scopes: string[]
  createdAt: Date
}

export interface FacebookGroup {
  id: string               // Facebook group id
  name: string
  memberCount?: number
  privacy: 'OPEN' | 'CLOSED' | 'SECRET'
  isSelected: boolean      // user chose to post here
}

export interface UserFacebookGroups {
  userId: string
  groups: FacebookGroup[]
  lastSynced: Date
}

// ========== LEADS ==========

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
export type LeadSource =
  | 'yad2' | 'madlan' | 'facebook_group' | 'google_alerts' | 'rss'
  | 'reddit' | 'quora' | 'telegram' | 'government_data'
  | 'autoscout' | 'manual' | 'other'

export interface Lead {
  id: string
  userId: string
  vertical: LeadVertical
  source: LeadSource
  status: LeadStatus
  qualityScore: number     // 0-100
  name?: string
  phone?: string
  email?: string
  notes: string
  rawData: Record<string, unknown>   // original scraped/fetched data
  createdAt: Date
  updatedAt: Date
  convertedAt?: Date
}

// ========== POSTS ==========

export type PostStatus = 'draft' | 'scheduled' | 'queued' | 'published' | 'failed' | 'paused'

export interface PostTemplate {
  id: string
  userId: string           // null = global admin template
  vertical: LeadVertical
  name: string
  bodyTemplate: string     // supports {{variables}}
  variables: string[]      // list of variable names
  isActive: boolean
  createdAt: Date
}

export interface Post {
  id: string
  userId: string
  templateId?: string
  vertical: LeadVertical
  body: string             // rendered text
  groupIds: string[]       // Facebook group ids to post to
  status: PostStatus
  scheduledAt?: Date
  publishedAt?: Date
  failedReason?: string
  retryCount: number
  facebookPostIds: Record<string, string>  // groupId -> fbPostId
  createdAt: Date
  updatedAt: Date
}

// ========== ANALYTICS ==========

export interface PostAnalytics {
  postId: string
  userId: string
  groupId: string
  impressions: number
  comments: number
  reactions: number
  leadsGenerated: number
  fetchedAt: Date
}

export interface UserStats {
  userId: string
  totalPosts: number
  totalLeads: number
  totalLeadsConverted: number
  postsThisMonth: number
  leadsThisMonth: number
  topPerformingGroup?: string
  updatedAt: Date
}

// ========== SCHEDULER ==========

export interface ScheduleConfig {
  userId: string
  isEnabled: boolean
  postsPerDay: number
  preferredHours: number[]   // e.g. [9, 12, 17, 20]
  minDelayMinutes: number    // random delay between posts
  maxDelayMinutes: number
  updatedAt: Date
}

// ========== SYSTEM ==========

export interface SystemConfig {
  maintenanceMode: boolean
  facebookApiVersion: string
  maxPostsPerUserPerDay: number
  leadScraperEnabled: boolean
  updatedAt: Date
}
