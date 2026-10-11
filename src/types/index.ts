export type NigerianState =
  | 'Abia' | 'Adamawa' | 'Akwa Ibom' | 'Anambra' | 'Bauchi' | 'Bayelsa' | 'Benue' | 'Borno'
  | 'Cross River' | 'Delta' | 'Ebonyi' | 'Edo' | 'Ekiti' | 'Enugu' | 'FCT - Abuja' | 'Gombe'
  | 'Imo' | 'Jigawa' | 'Kaduna' | 'Kano' | 'Katsina' | 'Kebbi' | 'Kogi' | 'Kwara'
  | 'Lagos' | 'Nasarawa' | 'Niger' | 'Ogun' | 'Ondo' | 'Osun' | 'Oyo' | 'Plateau'
  | 'Rivers' | 'Sokoto' | 'Taraba' | 'Yobe' | 'Zamfara';

export const NIGERIAN_STATES: NigerianState[] = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara'
];

export type RelationshipIntention = 'Serious Relationship' | 'Casual Dating' | 'Friendship';
export type Gender = 'Man' | 'Woman' | 'Non-binary';
export type DatingPreference = 'Women' | 'Men' | 'Everyone';

export interface User {
  id: string;
  email: string;
  isEmailVerified: boolean;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  suspensionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  order: number;
}

export interface Profile {
  userId: string;
  displayName: string;
  dateOfBirth: string; // YYYY-MM-DD
  age: number;
  gender: Gender;
  datingPreference: DatingPreference;
  relationshipIntention: RelationshipIntention;
  state: NigerianState;
  city: string;
  bio: string;
  photos: ProfilePhoto[];
  interests: string[];
  preferredAgeMin?: number;
  preferredAgeMax?: number;
  preferredState?: NigerianState | 'Any';
  isIdentityVerified: boolean; // separate from email verified
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  verificationDocUrl?: string;
  onlineStatus: boolean;
  lastActiveAt: string;
  showOnlineStatus: boolean;
  showLocation: boolean;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionPlanId = 'weekly' | 'monthly' | 'three_months';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceNGN: number;
  durationDays: number;
  features: string[];
  badge?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'weekly',
    name: 'Weekly Plan',
    priceNGN: 2000,
    durationDays: 7,
    features: [
      'Unlimited real-time chat with matches',
      'See who liked your profile',
      'Advanced search filters (All 36 States + Abuja)',
      'Verified Badge eligibility'
    ]
  },
  {
    id: 'monthly',
    name: 'Monthly Plan',
    priceNGN: 5000,
    durationDays: 30,
    badge: 'Popular',
    features: [
      'Everything in Weekly Plan',
      'Priority profile discovery ranking',
      'Post items on NaijaMatch Marketplace',
      'Save ₦3,000 compared to weekly renewal',
      '24/7 dedicated support'
    ]
  },
  {
    id: 'three_months',
    name: 'Three-Month Plan',
    priceNGN: 12000,
    durationDays: 90,
    badge: 'Best Value',
    features: [
      'Everything in Monthly Plan',
      'Full 90 days of uninterrupted access',
      'Verified Gold Badge on profile',
      'Unlimited marketplace listings',
      'Highest discovery placement across Nigeria'
    ]
  }
];

export interface Subscription {
  id: string;
  userId: string;
  planId: SubscriptionPlanId;
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'pending';
  paymentId: string;
}

export interface PaymentSubmission {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  planId: SubscriptionPlanId;
  amountNGN: number;
  paymentDate: string;
  transactionReference: string;
  proofScreenshotUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'match' | 'message' | 'payment_approved' | 'payment_rejected' | 'like' | 'friend_request';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface MarketplaceListing {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'Fashion' | 'Gifts' | 'Date Ideas' | 'Other Services';
  priceNGN: number;
  state: NigerianState;
  city: string;
  images: string[];
  status: 'active' | 'paused' | 'removed';
  createdAt: string;
  updatedAt: string;
  seller?: {
    displayName: string;
    avatarUrl?: string;
    isIdentityVerified: boolean;
  };
}

export interface Report {
  id: string;
  reporterUserId: string;
  targetType: 'profile' | 'message' | 'marketplace_listing';
  targetId: string;
  targetOwnerUserId?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
  adminNotes?: string;
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface PublicChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  senderGender?: Gender;
  senderState?: NigerianState;
  isVerified?: boolean;
  content: string;
  replyTo?: {
    id: string;
    senderName: string;
    content: string;
  };
  reactions?: {
    emoji: string;
    count: number;
    users: string[];
  }[];
  createdAt: string;
  isDeleted?: boolean;
}
