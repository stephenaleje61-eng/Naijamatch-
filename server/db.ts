import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import {
  User,
  Profile,
  Like,
  Match,
  FriendRequest,
  Subscription,
  PaymentSubmission,
  Conversation,
  Message,
  Notification,
  MarketplaceListing,
  Report,
  AdminAuditLog,
  SubscriptionPlanId,
  NigerianState,
  Gender,
  DatingPreference,
  RelationshipIntention,
  PublicChatMessage
} from '../src/types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'naijamatch_db.json');

export interface OTPRecord {
  email: string;
  code: string;
  expiresAt: number;
  attempts: number;
  lastRequestedAt: number;
}

export interface BlockRecord {
  id: string;
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

interface DatabaseSchema {
  users: Array<User & { passwordHash: string }>;
  profiles: Profile[];
  otps: Record<string, OTPRecord>;
  likes: Like[];
  matches: Match[];
  friendRequests: FriendRequest[];
  subscriptions: Subscription[];
  paymentSubmissions: PaymentSubmission[];
  conversations: Conversation[];
  messages: Message[];
  notifications: Notification[];
  blocks: BlockRecord[];
  reports: Report[];
  marketplaceListings: MarketplaceListing[];
  adminAuditLogs: AdminAuditLog[];
  publicChatMessages: PublicChatMessage[];
}

class Database {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadData();
    this.initializeDefaults();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.publicChatMessages) parsed.publicChatMessages = [];
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load database file, creating fresh dataset:', err);
    }

    return {
      users: [],
      profiles: [],
      otps: {},
      likes: [],
      matches: [],
      friendRequests: [],
      subscriptions: [],
      paymentSubmissions: [],
      conversations: [],
      messages: [],
      notifications: [],
      blocks: [],
      reports: [],
      marketplaceListings: [],
      adminAuditLogs: [],
      publicChatMessages: []
    };
  }

  public saveSync(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  private persist(): void {
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => {
      this.saveSync();
    }, 50);
  }

  private initializeDefaults() {
    // If no admin user exists, create default admin account
    const adminEmail = process.env.USER_EMAIL || 'stephenaleje61@gmail.com';
    const existingAdmin = this.data.users.find(u => u.email.toLowerCase() === adminEmail.toLowerCase() || u.role === 'admin');

    if (!existingAdmin) {
      const adminId = 'admin_' + crypto.randomUUID();
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync('AdminNaija2026!', salt);

      const adminUser: User & { passwordHash: string } = {
        id: adminId,
        email: adminEmail,
        passwordHash,
        isEmailVerified: true,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.data.users.push(adminUser);

      // Create Admin Profile
      const adminProfile: Profile = {
        userId: adminId,
        displayName: 'Stephen A. (Admin)',
        dateOfBirth: '1995-05-15',
        age: 31,
        gender: 'Man',
        datingPreference: 'Women',
        relationshipIntention: 'Serious Relationship',
        state: 'Lagos',
        city: 'Victoria Island',
        bio: 'Platform Administrator at NaijaMatch. Building trust and authentic love across Nigeria.',
        photos: [
          {
            id: 'p_admin_1',
            url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
            isPrimary: true,
            order: 0
          }
        ],
        interests: ['Tech', 'Afrobeats', 'Travel', 'Investing', 'Culinary Arts'],
        isIdentityVerified: true,
        verificationStatus: 'verified',
        onlineStatus: true,
        lastActiveAt: new Date().toISOString(),
        showOnlineStatus: true,
        showLocation: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.data.profiles.push(adminProfile);

      // Admin has an active 3-month subscription
      this.data.subscriptions.push({
        id: 'sub_' + crypto.randomUUID(),
        userId: adminId,
        planId: 'three_months',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 86400000).toISOString(),
        status: 'active',
        paymentId: 'admin_initial'
      });

      this.seedInitialMembers();
      this.saveSync();
    } else if (this.data.profiles.length <= 1) {
      this.seedInitialMembers();
      this.saveSync();
    }
  }

  private seedInitialMembers() {
    // Seed realistic Nigerian dating profiles for discoverability and testing
    const sampleMembers = [
      {
        email: 'chioma.eze@naijamatch.demo',
        name: 'Chioma Eze',
        dob: '1998-04-12',
        age: 28,
        gender: 'Woman' as Gender,
        pref: 'Men' as DatingPreference,
        intent: 'Serious Relationship' as RelationshipIntention,
        state: 'Lagos' as NigerianState,
        city: 'Lekki Phase 1',
        bio: 'Chartered Accountant & culinary enthusiast. Looking for an ambitious, God-fearing partner with a great sense of humor. Let’s talk about books, business, and good food.',
        interests: ['Cooking', 'Travel', 'Reading', 'Jazz', 'Fitness'],
        photos: [
          'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
        ],
        hasSub: true
      },
      {
        email: 'tunde.adebayo@naijamatch.demo',
        name: 'Tunde Adebayo',
        dob: '1994-09-20',
        age: 32,
        gender: 'Man' as Gender,
        pref: 'Women' as DatingPreference,
        intent: 'Serious Relationship' as RelationshipIntention,
        state: 'FCT - Abuja' as NigerianState,
        city: 'Maitama',
        bio: 'Architect & real estate developer based in Abuja. Love tennis on weekends and discovering cozy rooftop spots. Seeking genuine connection leading to marriage.',
        interests: ['Architecture', 'Tennis', 'Real Estate', 'Photography', 'Afrobeats'],
        photos: [
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80'
        ],
        hasSub: true
      },
      {
        email: 'amaka.nwosu@naijamatch.demo',
        name: 'Amaka Nwosu',
        dob: '1999-11-05',
        age: 27,
        gender: 'Woman' as Gender,
        pref: 'Men' as DatingPreference,
        intent: 'Casual Dating' as RelationshipIntention,
        state: 'Rivers' as NigerianState,
        city: 'Port Harcourt',
        bio: 'Petroleum Geologist by day, content creator by weekend. Life is too short for boring conversations. Let’s grab shawarma and talk about our wildest travel dreams.',
        interests: ['Beach', 'Photography', 'Gaming', 'Tech', 'Music'],
        photos: [
          'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80'
        ],
        hasSub: false
      },
      {
        email: 'emeka.okonkwo@naijamatch.demo',
        name: 'Emeka Okonkwo',
        dob: '1996-02-18',
        age: 30,
        gender: 'Man' as Gender,
        pref: 'Women' as DatingPreference,
        intent: 'Serious Relationship' as RelationshipIntention,
        state: 'Enugu' as NigerianState,
        city: 'Independence Layout',
        bio: 'Fintech software engineer. Big fan of Nollywood cinema, outdoor hikes, and good native soup. Looking for someone grounded, kind-hearted, and forward-thinking.',
        interests: ['Software Engineering', 'Hiking', 'Cooking', 'Movies', 'Crypto'],
        photos: [
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80'
        ],
        hasSub: true
      },
      {
        email: 'zainab.danladi@naijamatch.demo',
        name: 'Zainab Danladi',
        dob: '1997-07-30',
        age: 29,
        gender: 'Woman' as Gender,
        pref: 'Men' as DatingPreference,
        intent: 'Serious Relationship' as RelationshipIntention,
        state: 'Kaduna' as NigerianState,
        city: 'Kaduna North',
        bio: 'Public health researcher & passionate painter. Family-oriented and peaceful soul. Searching for a respectful gentleman who values deep conversation.',
        interests: ['Painting', 'Health & Wellness', 'Poetry', 'Travel', 'Gardening'],
        photos: [
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
        ],
        hasSub: true
      },
      {
        email: 'femi.alabi@naijamatch.demo',
        name: 'Femi Alabi',
        dob: '1993-12-08',
        age: 33,
        gender: 'Man' as Gender,
        pref: 'Women' as DatingPreference,
        intent: 'Friendship' as RelationshipIntention,
        state: 'Oyo' as NigerianState,
        city: 'Ibadan (Bodija)',
        bio: 'Creative director & digital marketing strategist. Lover of deep jazz, vintage art galleries, and exploring historical landmarks across Oyo state.',
        interests: ['Design', 'Jazz', 'Art', 'Coffee', 'History'],
        photos: [
          'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80'
        ],
        hasSub: true
      }
    ];

    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Password123!', salt);

    for (const m of sampleMembers) {
      if (this.data.users.some(u => u.email === m.email)) continue;
      const uId = 'user_' + crypto.randomUUID();
      this.data.users.push({
        id: uId,
        email: m.email,
        passwordHash: hash,
        isEmailVerified: true,
        role: 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      this.data.profiles.push({
        userId: uId,
        displayName: m.name,
        dateOfBirth: m.dob,
        age: m.age,
        gender: m.gender,
        datingPreference: m.pref,
        relationshipIntention: m.intent,
        state: m.state,
        city: m.city,
        bio: m.bio,
        photos: m.photos.map((url, i) => ({
          id: `p_${uId}_${i}`,
          url,
          isPrimary: i === 0,
          order: i
        })),
        interests: m.interests,
        isIdentityVerified: true,
        verificationStatus: 'verified',
        onlineStatus: Math.random() > 0.5,
        lastActiveAt: new Date(Date.now() - Math.floor(Math.random() * 3600000)).toISOString(),
        showOnlineStatus: true,
        showLocation: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      if (m.hasSub) {
        this.data.subscriptions.push({
          id: 'sub_' + crypto.randomUUID(),
          userId: uId,
          planId: 'monthly',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          status: 'active',
          paymentId: 'seed_' + uId
        });
      }
    }

    // Seed realistic Marketplace Listings
    if (this.data.marketplaceListings.length === 0) {
      const chiomaUser = this.data.users.find(u => u.email === 'chioma.eze@naijamatch.demo');
      const tundeUser = this.data.users.find(u => u.email === 'tunde.adebayo@naijamatch.demo');

      if (chiomaUser) {
        this.data.marketplaceListings.push({
          id: 'mkt_' + crypto.randomUUID(),
          userId: chiomaUser.id,
          title: 'Handcrafted Scented Soy Candles & Rose Petals Date Box',
          description: 'Romantic evening gift hamper including 2 custom vanilla-oud candles, preserved Ecuadorian rose petals, and artisan Belgian chocolates. Perfect for surprise date nights.',
          category: 'Gifts',
          priceNGN: 18500,
          state: 'Lagos',
          city: 'Lekki',
          images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=600&q=80'],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      if (tundeUser) {
        this.data.marketplaceListings.push({
          id: 'mkt_' + crypto.randomUUID(),
          userId: tundeUser.id,
          title: 'Private Sunset Rooftop Dinner Reservation & Acoustic Serenade',
          description: 'Exclusively curated romantic 3-course dinner for two overlooking Abuja city skyline with private acoustic guitarist. Includes bottle of premium sparkling wine.',
          category: 'Date Ideas',
          priceNGN: 45000,
          state: 'FCT - Abuja',
          city: 'Maitama',
          images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80'],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    // Seed realistic Nigerian public room messages with replies and reactions if empty
    if (!this.data.publicChatMessages || this.data.publicChatMessages.length === 0) {
      this.data.publicChatMessages = [];

      const chioma = this.data.users.find(u => u.email === 'chioma.eze@naijamatch.demo');
      const tunde = this.data.users.find(u => u.email === 'tunde.adebayo@naijamatch.demo');
      const amina = this.data.users.find(u => u.email === 'amina.bello@naijamatch.demo');

      const msg1Id = 'pubmsg_seed_1';
      const msg2Id = 'pubmsg_seed_2';
      const msg3Id = 'pubmsg_seed_3';

      if (chioma) {
        this.data.publicChatMessages.push({
          id: msg1Id,
          senderId: chioma.id,
          senderName: 'Chioma Eze',
          senderPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          senderState: 'Lagos',
          isVerified: true,
          content: 'Good morning Naija singles! 🇳🇬 Happy to connect with everyone here. How is Lagos traffic treating people today?',
          reactions: [
            { emoji: '🇳🇬', count: 4, users: ['user_seed_a', 'user_seed_b'] },
            { emoji: '❤️', count: 3, users: ['user_seed_c'] }
          ],
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        });
      }

      if (tunde) {
        this.data.publicChatMessages.push({
          id: msg2Id,
          senderId: tunde.id,
          senderName: 'Tunde Adebayo',
          senderPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          senderState: 'FCT - Abuja',
          isVerified: true,
          content: 'Lagos traffic is relentless! Here in Abuja we are enjoying cool morning breeze. Great to see the community growing so quickly.',
          replyTo: {
            id: msg1Id,
            senderName: 'Chioma Eze',
            content: 'Good morning Naija singles! 🇳🇬 Happy to connect with everyone here. How is Lagos traffic treating people today?'
          },
          reactions: [
            { emoji: '🔥', count: 2, users: ['user_seed_d'] },
            { emoji: '😂', count: 3, users: ['user_seed_e'] }
          ],
          createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
        });
      }

      if (amina) {
        this.data.publicChatMessages.push({
          id: msg3Id,
          senderId: amina.id,
          senderName: 'Amina Bello',
          senderPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
          senderState: 'Rivers',
          isVerified: true,
          content: 'Welcome to all the new members from Port Harcourt and across Nigeria! Don’t forget you can reply to anyone directly in this room.',
          reactions: [
            { emoji: '👏', count: 5, users: ['user_seed_f'] },
            { emoji: '🇳🇬', count: 6, users: ['user_seed_g'] }
          ],
          createdAt: new Date(Date.now() - 3600000 * 0.8).toISOString()
        });
      }
    }
  }

  // --- User Operations ---
  public getUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserById(id: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public createUser(email: string, passwordHash: string): User {
    const id = 'user_' + crypto.randomUUID();
    const newUser: User & { passwordHash: string } = {
      id,
      email: email.toLowerCase(),
      passwordHash,
      isEmailVerified: false,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.persist();
    return this.sanitizeUser(newUser);
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return this.sanitizeUser(user);
  }

  public sanitizeUser(user: User & { passwordHash?: string }): User {
    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  // --- OTP Management ---
  public setOTP(email: string, code: string): OTPRecord {
    const norm = email.toLowerCase();
    const record: OTPRecord = {
      email: norm,
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
      attempts: 0,
      lastRequestedAt: Date.now()
    };
    this.data.otps[norm] = record;
    this.persist();
    return record;
  }

  public getOTP(email: string): OTPRecord | undefined {
    return this.data.otps[email.toLowerCase()];
  }

  public verifyOTP(email: string, code: string): { valid: boolean; reason?: string } {
    const norm = email.toLowerCase();
    const record = this.data.otps[norm];
    if (!record) return { valid: false, reason: 'No OTP requested for this email' };
    if (Date.now() > record.expiresAt) return { valid: false, reason: 'OTP has expired. Please request a new code.' };
    if (record.attempts >= 3) return { valid: false, reason: 'Maximum OTP verification attempts exceeded.' };

    if (record.code !== code.trim()) {
      record.attempts += 1;
      this.persist();
      return { valid: false, reason: `Invalid code. ${3 - record.attempts} attempt(s) remaining.` };
    }

    delete this.data.otps[norm];
    this.persist();
    return { valid: true };
  }

  // --- Profiles ---
  public getProfileByUserId(userId: string): Profile | undefined {
    return this.data.profiles.find(p => p.userId === userId);
  }

  public upsertProfile(userId: string, data: Partial<Profile>): Profile {
    const existingIndex = this.data.profiles.findIndex(p => p.userId === userId);
    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const updated = {
        ...this.data.profiles[existingIndex],
        ...data,
        updatedAt: now
      };
      this.data.profiles[existingIndex] = updated;
      this.persist();
      return updated;
    } else {
      const newProfile: Profile = {
        userId,
        displayName: data.displayName || 'Single in Naija',
        dateOfBirth: data.dateOfBirth || '2000-01-01',
        age: data.age || 26,
        gender: data.gender || 'Woman',
        datingPreference: data.datingPreference || 'Men',
        relationshipIntention: data.relationshipIntention || 'Serious Relationship',
        state: data.state || 'Lagos',
        city: data.city || 'Lagos',
        bio: data.bio || '',
        photos: data.photos || [],
        interests: data.interests || [],
        isIdentityVerified: false,
        verificationStatus: 'unverified',
        onlineStatus: true,
        lastActiveAt: now,
        showOnlineStatus: data.showOnlineStatus !== false,
        showLocation: data.showLocation !== false,
        createdAt: now,
        updatedAt: now
      };
      this.data.profiles.push(newProfile);
      this.persist();
      return newProfile;
    }
  }

  public updateProfilePresence(userId: string, online: boolean): void {
    const profile = this.data.profiles.find(p => p.userId === userId);
    if (profile) {
      profile.onlineStatus = online;
      profile.lastActiveAt = new Date().toISOString();
      this.persist();
    }
  }

  // --- Subscriptions & Access Control ---
  public getActiveSubscription(userId: string): Subscription | null {
    const now = new Date();
    const sub = this.data.subscriptions
      .filter(s => s.userId === userId && s.status === 'active')
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

    if (!sub) return null;
    if (new Date(sub.endDate) < now) {
      sub.status = 'expired';
      this.persist();
      return null;
    }
    return sub;
  }

  public getUserSubscriptionHistory(userId: string): Subscription[] {
    return this.data.subscriptions.filter(s => s.userId === userId);
  }

  public activateSubscription(userId: string, planId: SubscriptionPlanId, paymentId: string): Subscription {
    const planDays = planId === 'weekly' ? 7 : planId === 'monthly' ? 30 : 90;
    const now = new Date();
    const existing = this.getActiveSubscription(userId);

    // If existing active subscription, extend from its endDate
    let startDate = now.toISOString();
    let endDate: Date;
    if (existing && new Date(existing.endDate) > now) {
      endDate = new Date(new Date(existing.endDate).getTime() + planDays * 86400000);
    } else {
      endDate = new Date(now.getTime() + planDays * 86400000);
    }

    const newSub: Subscription = {
      id: 'sub_' + crypto.randomUUID(),
      userId,
      planId,
      startDate,
      endDate: endDate.toISOString(),
      status: 'active',
      paymentId
    };

    this.data.subscriptions.push(newSub);
    this.persist();
    return newSub;
  }

  // --- Payments ---
  public submitPaymentProof(data: Omit<PaymentSubmission, 'id' | 'status' | 'createdAt'>): PaymentSubmission {
    // Prevent duplicate submission with same transaction reference
    const existing = this.data.paymentSubmissions.find(
      p => p.transactionReference.trim().toUpperCase() === data.transactionReference.trim().toUpperCase()
    );
    if (existing) {
      throw new Error('A payment submission with this transaction reference already exists.');
    }

    const submission: PaymentSubmission = {
      id: 'pay_' + crypto.randomUUID(),
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.data.paymentSubmissions.push(submission);
    this.persist();
    return submission;
  }

  public getPendingPayments(): PaymentSubmission[] {
    return this.data.paymentSubmissions.filter(p => p.status === 'pending');
  }

  public getAllPayments(): PaymentSubmission[] {
    return [...this.data.paymentSubmissions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getUserPayments(userId: string): PaymentSubmission[] {
    return this.data.paymentSubmissions
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public reviewPayment(
    paymentId: string,
    adminId: string,
    decision: 'approved' | 'rejected',
    rejectionReason?: string
  ): PaymentSubmission {
    const payment = this.data.paymentSubmissions.find(p => p.id === paymentId);
    if (!payment) throw new Error('Payment submission not found');
    if (payment.status !== 'pending') throw new Error(`Payment has already been ${payment.status}`);
    if (payment.userId === adminId) throw new Error('Administrators cannot approve their own payments.');

    payment.status = decision;
    payment.reviewedByAdminId = adminId;
    payment.reviewedAt = new Date().toISOString();
    if (decision === 'rejected') {
      payment.rejectionReason = rejectionReason || 'Payment could not be verified in bank records';
    } else {
      // Activate subscription
      this.activateSubscription(payment.userId, payment.planId, payment.id);
    }

    // Add notification for user
    this.addNotification({
      userId: payment.userId,
      title: decision === 'approved' ? 'Subscription Activated!' : 'Payment Review Update',
      message:
        decision === 'approved'
          ? `Your ${payment.planId} plan has been verified and activated. You now have full access to unlimited messaging and discovery!`
          : `Your payment proof was rejected: ${payment.rejectionReason}. Please contact support or upload valid proof.`,
      type: decision === 'approved' ? 'payment_approved' : 'payment_rejected',
      link: '/subscriptions'
    });

    // Record audit log
    const admin = this.getUserById(adminId);
    this.data.adminAuditLogs.push({
      id: 'audit_' + crypto.randomUUID(),
      adminId,
      adminEmail: admin?.email || 'admin',
      action: `PAYMENT_${decision.toUpperCase()}`,
      targetId: paymentId,
      details: `Payment ${paymentId} for ₦${payment.amountNGN.toLocaleString()} by user ${payment.userEmail} was ${decision}.`,
      createdAt: new Date().toISOString()
    });

    this.persist();
    return payment;
  }

  // --- Discovery, Likes, and Matching ---
  public getDiscoverProfiles(
    currentUserId: string,
    filters: {
      state?: string;
      city?: string;
      gender?: string;
      minAge?: number;
      maxAge?: number;
      intention?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): { profiles: Profile[]; total: number; hasMore: boolean } {
    const currentUserProfile = this.getProfileByUserId(currentUserId);
    const blockedUserIds = this.getBlockedUserIds(currentUserId);

    // List of users already liked or unliked
    const likedIds = new Set(this.data.likes.filter(l => l.fromUserId === currentUserId).map(l => l.toUserId));

    let candidates = this.data.profiles.filter(p => {
      if (p.userId === currentUserId) return false;
      if (blockedUserIds.includes(p.userId)) return false;

      // Filter by state
      if (filters.state && filters.state !== 'All' && p.state !== filters.state) return false;

      // Filter by gender
      if (filters.gender && filters.gender !== 'All' && p.gender !== filters.gender) return false;

      // Filter by intention
      if (filters.intention && filters.intention !== 'All' && p.relationshipIntention !== filters.intention) return false;

      // Filter by age
      if (filters.minAge && p.age < filters.minAge) return false;
      if (filters.maxAge && p.age > filters.maxAge) return false;

      // Filter by search text
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matches =
          p.displayName.toLowerCase().includes(query) ||
          p.city.toLowerCase().includes(query) ||
          p.state.toLowerCase().includes(query) ||
          p.interests.some(i => i.toLowerCase().includes(query)) ||
          p.bio.toLowerCase().includes(query);
        if (!matches) return false;
      }

      return true;
    });

    // Score candidates by shared interests & preference
    if (currentUserProfile) {
      candidates.sort((a, b) => {
        const aInterests = a.interests.filter(i => currentUserProfile.interests.includes(i)).length;
        const bInterests = b.interests.filter(i => currentUserProfile.interests.includes(i)).length;
        return bInterests - aInterests;
      });
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(50, Math.max(1, filters.limit || 12));
    const offset = (page - 1) * limit;

    const total = candidates.length;
    const paginated = candidates.slice(offset, offset + limit);

    return {
      profiles: paginated,
      total,
      hasMore: offset + limit < total
    };
  }

  public likeProfile(fromUserId: string, toUserId: string): { isMatch: boolean; match?: Match } {
    if (fromUserId === toUserId) throw new Error('Cannot like yourself');

    const existingLike = this.data.likes.find(l => l.fromUserId === fromUserId && l.toUserId === toUserId);
    if (!existingLike) {
      this.data.likes.push({
        id: 'like_' + crypto.randomUUID(),
        fromUserId,
        toUserId,
        createdAt: new Date().toISOString()
      });
    }

    // Check for mutual like
    const reverseLike = this.data.likes.find(l => l.fromUserId === toUserId && l.toUserId === fromUserId);
    let isMatch = false;
    let matchRecord: Match | undefined;

    if (reverseLike) {
      // Check if match already recorded
      let existingMatch = this.data.matches.find(
        m => (m.user1Id === fromUserId && m.user2Id === toUserId) || (m.user1Id === toUserId && m.user2Id === fromUserId)
      );

      if (!existingMatch) {
        existingMatch = {
          id: 'match_' + crypto.randomUUID(),
          user1Id: fromUserId,
          user2Id: toUserId,
          createdAt: new Date().toISOString()
        };
        this.data.matches.push(existingMatch);

        // Notify both users
        const fromProfile = this.getProfileByUserId(fromUserId);
        const toProfile = this.getProfileByUserId(toUserId);

        this.addNotification({
          userId: toUserId,
          title: "It's a Match! 🎉",
          message: `You and ${fromProfile?.displayName || 'someone'} mutually liked each other! Start a conversation now.`,
          type: 'match',
          link: '/messages'
        });

        this.addNotification({
          userId: fromUserId,
          title: "It's a Match! 🎉",
          message: `You and ${toProfile?.displayName || 'someone'} mutually liked each other! Start a conversation now.`,
          type: 'match',
          link: '/messages'
        });
      }
      isMatch = true;
      matchRecord = existingMatch;
    } else {
      // Notify receiver about new like
      this.addNotification({
        userId: toUserId,
        title: 'New Like Received',
        message: 'Someone just liked your profile! Subscribe to see who liked you.',
        type: 'like',
        link: '/likes'
      });
    }

    this.persist();
    return { isMatch, match: matchRecord };
  }

  public unlikeProfile(fromUserId: string, toUserId: string): void {
    this.data.likes = this.data.likes.filter(l => !(l.fromUserId === fromUserId && l.toUserId === toUserId));
    this.persist();
  }

  public getLikesReceived(userId: string): { count: number; profiles: Profile[] } {
    const likerIds = this.data.likes.filter(l => l.toUserId === userId).map(l => l.fromUserId);
    const profiles = this.data.profiles.filter(p => likerIds.includes(p.userId));
    return {
      count: profiles.length,
      profiles
    };
  }

  public getMatches(userId: string): Array<{ match: Match; otherProfile: Profile }> {
    const userMatches = this.data.matches.filter(m => m.user1Id === userId || m.user2Id === userId);
    const result: Array<{ match: Match; otherProfile: Profile }> = [];

    for (const m of userMatches) {
      const otherId = m.user1Id === userId ? m.user2Id : m.user1Id;
      const otherProfile = this.getProfileByUserId(otherId);
      if (otherProfile) {
        result.push({ match: m, otherProfile });
      }
    }
    return result;
  }

  // --- Friend Requests ---
  public sendFriendRequest(senderId: string, receiverId: string): FriendRequest {
    if (senderId === receiverId) throw new Error('Cannot send friend request to yourself');
    const existing = this.data.friendRequests.find(
      r =>
        ((r.senderId === senderId && r.receiverId === receiverId) ||
          (r.senderId === receiverId && r.receiverId === senderId)) &&
        r.status === 'pending'
    );
    if (existing) throw new Error('A friend request between these users is already pending');

    const req: FriendRequest = {
      id: 'freq_' + crypto.randomUUID(),
      senderId,
      receiverId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.friendRequests.push(req);

    const senderProfile = this.getProfileByUserId(senderId);
    this.addNotification({
      userId: receiverId,
      title: 'New Connection Request',
      message: `${senderProfile?.displayName || 'Someone'} sent you a connection request.`,
      type: 'friend_request',
      link: '/messages'
    });

    this.persist();
    return req;
  }

  public respondFriendRequest(requestId: string, userId: string, action: 'accept' | 'decline' | 'cancel'): FriendRequest {
    const req = this.data.friendRequests.find(r => r.id === requestId);
    if (!req) throw new Error('Friend request not found');

    if (action === 'cancel' && req.senderId !== userId) {
      throw new Error('Only the sender can cancel a request');
    }
    if ((action === 'accept' || action === 'decline') && req.receiverId !== userId) {
      throw new Error('Only the recipient can accept or decline');
    }

    req.status = action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : 'cancelled';
    req.updatedAt = new Date().toISOString();

    if (action === 'accept') {
      const accepterProfile = this.getProfileByUserId(userId);
      this.addNotification({
        userId: req.senderId,
        title: 'Connection Accepted! ✨',
        message: `${accepterProfile?.displayName || 'Your match'} accepted your connection request.`,
        type: 'friend_request',
        link: '/messages'
      });
    }

    this.persist();
    return req;
  }

  public getFriendRequests(userId: string): { incoming: FriendRequest[]; outgoing: FriendRequest[] } {
    return {
      incoming: this.data.friendRequests.filter(r => r.receiverId === userId && r.status === 'pending'),
      outgoing: this.data.friendRequests.filter(r => r.senderId === userId && r.status === 'pending')
    };
  }

  // --- Conversations & Real-Time Messaging ---
  public getOrCreateConversation(user1Id: string, user2Id: string): Conversation {
    const existing = this.data.conversations.find(
      c => c.participants.includes(user1Id) && c.participants.includes(user2Id)
    );
    if (existing) return existing;

    const newConvo: Conversation = {
      id: 'convo_' + crypto.randomUUID(),
      participants: [user1Id, user2Id],
      updatedAt: new Date().toISOString()
    };
    this.data.conversations.push(newConvo);
    this.persist();
    return newConvo;
  }

  public getUserConversations(userId: string): Array<Conversation & { otherParticipant: Profile; unreadCount: number }> {
    const userConvos = this.data.conversations.filter(c => c.participants.includes(userId));
    const result: Array<Conversation & { otherParticipant: Profile; unreadCount: number }> = [];

    for (const c of userConvos) {
      const otherId = c.participants.find(p => p !== userId);
      if (!otherId) continue;
      const otherProfile = this.getProfileByUserId(otherId);
      if (!otherProfile) continue;

      const unreadCount = this.data.messages.filter(
        m => m.conversationId === c.id && m.senderId === otherId && !m.readAt
      ).length;

      result.push({
        ...c,
        otherParticipant: otherProfile,
        unreadCount
      });
    }

    result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    return result;
  }

  public getMessages(conversationId: string, userId: string): Message[] {
    const convo = this.data.conversations.find(c => c.id === conversationId);
    if (!convo || !convo.participants.includes(userId)) {
      throw new Error('Unauthorized access to conversation');
    }

    // Mark received messages as read
    let updated = false;
    for (const m of this.data.messages) {
      if (m.conversationId === conversationId && m.senderId !== userId && !m.readAt) {
        m.readAt = new Date().toISOString();
        updated = true;
      }
    }
    if (updated) this.persist();

    return this.data.messages.filter(m => m.conversationId === conversationId);
  }

  public saveMessage(conversationId: string, senderId: string, content: string): Message {
    const convo = this.data.conversations.find(c => c.id === conversationId);
    if (!convo || !convo.participants.includes(senderId)) {
      throw new Error('Unauthorized access to conversation');
    }

    const otherParticipantId = convo.participants.find(p => p !== senderId);
    if (!otherParticipantId) throw new Error('Invalid conversation participants');

    // Check if blocked
    if (this.isBlocked(senderId, otherParticipantId) || this.isBlocked(otherParticipantId, senderId)) {
      throw new Error('Cannot send message: messaging is blocked between these accounts');
    }

    const message: Message = {
      id: 'msg_' + crypto.randomUUID(),
      conversationId,
      senderId,
      content: content.trim(),
      createdAt: new Date().toISOString()
    };

    this.data.messages.push(message);
    convo.lastMessage = message;
    convo.updatedAt = message.createdAt;

    // Add notification
    const senderProfile = this.getProfileByUserId(senderId);
    this.addNotification({
      userId: otherParticipantId,
      title: `Message from ${senderProfile?.displayName || 'Match'}`,
      message: content.length > 60 ? content.slice(0, 57) + '...' : content,
      type: 'message',
      link: `/messages?c=${conversationId}`
    });

    this.persist();
    return message;
  }

  // --- Notifications ---
  public addNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Notification {
    const notif: Notification = {
      id: 'notif_' + crypto.randomUUID(),
      ...data,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.push(notif);
    this.persist();
    return notif;
  }

  public getUserNotifications(userId: string): Notification[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 50);
  }

  public markNotificationRead(notifId: string, userId: string): void {
    const notif = this.data.notifications.find(n => n.id === notifId && n.userId === userId);
    if (notif) {
      notif.read = true;
      this.persist();
    }
  }

  public markAllNotificationsRead(userId: string): void {
    let changed = false;
    for (const n of this.data.notifications) {
      if (n.userId === userId && !n.read) {
        n.read = true;
        changed = true;
      }
    }
    if (changed) this.persist();
  }

  // --- Blocking & Reporting ---
  public blockUser(blockerId: string, blockedId: string): void {
    if (blockerId === blockedId) throw new Error('Cannot block yourself');
    if (!this.isBlocked(blockerId, blockedId)) {
      this.data.blocks.push({
        id: 'block_' + crypto.randomUUID(),
        blockerId,
        blockedId,
        createdAt: new Date().toISOString()
      });
      this.persist();
    }
  }

  public isBlocked(userA: string, userB: string): boolean {
    return this.data.blocks.some(b => b.blockerId === userA && b.blockedId === userB);
  }

  public getBlockedUserIds(userId: string): string[] {
    return this.data.blocks
      .filter(b => b.blockerId === userId || b.blockedId === userId)
      .map(b => (b.blockerId === userId ? b.blockedId : b.blockerId));
  }

  public reportContent(
    reporterUserId: string,
    targetType: 'profile' | 'message' | 'marketplace_listing',
    targetId: string,
    reason: string,
    details?: string
  ): Report {
    const report: Report = {
      id: 'rep_' + crypto.randomUUID(),
      reporterUserId,
      targetType,
      targetId,
      reason,
      details,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    this.data.reports.push(report);
    this.persist();
    return report;
  }

  // --- Marketplace ---
  public getMarketplaceListings(filters: {
    category?: string;
    state?: string;
    search?: string;
  }): MarketplaceListing[] {
    return this.data.marketplaceListings
      .filter(m => {
        if (m.status !== 'active') return false;
        if (filters.category && filters.category !== 'All' && m.category !== filters.category) return false;
        if (filters.state && filters.state !== 'All' && m.state !== filters.state) return false;
        if (filters.search) {
          const q = filters.search.toLowerCase();
          return m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
        }
        return true;
      })
      .map(item => {
        const profile = this.getProfileByUserId(item.userId);
        return {
          ...item,
          seller: profile
            ? {
                displayName: profile.displayName,
                avatarUrl: profile.photos[0]?.url,
                isIdentityVerified: profile.isIdentityVerified
              }
            : undefined
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createMarketplaceListing(data: Omit<MarketplaceListing, 'id' | 'createdAt' | 'updatedAt' | 'status'>): MarketplaceListing {
    const listing: MarketplaceListing = {
      id: 'mkt_' + crypto.randomUUID(),
      ...data,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.marketplaceListings.push(listing);
    this.persist();
    return listing;
  }

  public deleteMarketplaceListing(id: string, userId: string): boolean {
    const index = this.data.marketplaceListings.findIndex(m => m.id === id);
    if (index === -1) return false;
    const item = this.data.marketplaceListings[index];
    if (item.userId !== userId) {
      const user = this.getUserById(userId);
      if (user?.role !== 'admin') return false;
    }
    this.data.marketplaceListings.splice(index, 1);
    this.persist();
    return true;
  }

  // --- Admin Queries ---
  public getAdminStats() {
    const now = new Date();
    const totalUsers = this.data.users.length;
    const verifiedEmails = this.data.users.filter(u => u.isEmailVerified).length;
    const activeSubscriptions = this.data.subscriptions.filter(
      s => s.status === 'active' && new Date(s.endDate) > now
    ).length;
    const pendingPayments = this.data.paymentSubmissions.filter(p => p.status === 'pending').length;
    const approvedPayments = this.data.paymentSubmissions.filter(p => p.status === 'approved').length;
    const rejectedPayments = this.data.paymentSubmissions.filter(p => p.status === 'rejected').length;
    const reportedProfiles = this.data.reports.filter(r => r.status === 'pending').length;
    const marketplacePosts = this.data.marketplaceListings.length;

    return {
      totalUsers,
      verifiedEmails,
      activeSubscriptions,
      pendingPayments,
      approvedPayments,
      rejectedPayments,
      reportedProfiles,
      marketplacePosts
    };
  }

  public getAdminUsers(search?: string): Array<User & { profile?: Profile; subscriptionStatus: string }> {
    const now = new Date();
    return this.data.users
      .filter(u => {
        if (!search) return true;
        const q = search.toLowerCase();
        const p = this.getProfileByUserId(u.id);
        return u.email.toLowerCase().includes(q) || p?.displayName.toLowerCase().includes(q);
      })
      .map(u => {
        const profile = this.getProfileByUserId(u.id);
        const sub = this.data.subscriptions.find(
          s => s.userId === u.id && s.status === 'active' && new Date(s.endDate) > now
        );
        return {
          ...this.sanitizeUser(u),
          profile,
          subscriptionStatus: sub ? `${sub.planId} (Active)` : 'Inactive'
        };
      });
  }

  public updateAccountStatus(userId: string, status: 'active' | 'suspended' | 'banned', reason: string, adminId: string): void {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.status = status;
    user.suspensionReason = reason;
    user.updatedAt = new Date().toISOString();

    const admin = this.getUserById(adminId);
    this.data.adminAuditLogs.push({
      id: 'audit_' + crypto.randomUUID(),
      adminId,
      adminEmail: admin?.email || 'admin',
      action: `USER_STATUS_${status.toUpperCase()}`,
      targetId: userId,
      details: `User ${user.email} changed to ${status}. Reason: ${reason}`,
      createdAt: new Date().toISOString()
    });

    this.persist();
  }

  public getReports(): Report[] {
    return [...this.data.reports].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public updateReportStatus(reportId: string, status: Report['status'], adminNotes: string, adminId: string): void {
    const report = this.data.reports.find(r => r.id === reportId);
    if (!report) throw new Error('Report not found');
    report.status = status;
    report.adminNotes = adminNotes;

    const admin = this.getUserById(adminId);
    this.data.adminAuditLogs.push({
      id: 'audit_' + crypto.randomUUID(),
      adminId,
      adminEmail: admin?.email || 'admin',
      action: `REPORT_${status.toUpperCase()}`,
      targetId: reportId,
      details: `Report ${reportId} marked as ${status}. Notes: ${adminNotes}`,
      createdAt: new Date().toISOString()
    });

    this.persist();
  }

  public getAuditLogs(): AdminAuditLog[] {
    return [...this.data.adminAuditLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // --- Public Chatroom Operations ---
  public getPublicChatMessages(limit: number = 100): PublicChatMessage[] {
    if (!this.data.publicChatMessages) {
      this.data.publicChatMessages = [];
    }
    return this.data.publicChatMessages.slice(-limit);
  }

  public sendPublicChatMessage(
    senderId: string,
    content: string,
    replyToMessageId?: string,
    guestProfile?: { name: string; state?: any; photo?: string }
  ): PublicChatMessage {
    let senderName = 'Naija Single';
    let senderPhoto: string | undefined = undefined;
    let senderGender: any = undefined;
    let senderState: any = guestProfile?.state || 'Lagos';
    let isVerified = false;

    const user = this.getUserById(senderId);
    if (user) {
      if (user.status === 'banned') {
        throw new Error('Your account has been banned from participating in chat.');
      }
      if (user.status === 'suspended') {
        throw new Error('Your account is temporarily suspended from sending messages.');
      }
      const profile = this.getProfileByUserId(senderId);
      senderName = profile?.displayName || user.email.split('@')[0];
      senderPhoto = profile?.photos?.[0]?.url;
      senderGender = profile?.gender;
      senderState = profile?.state || 'Lagos';
      isVerified = profile?.isIdentityVerified || user.role === 'admin';
    } else if (guestProfile?.name) {
      senderName = guestProfile.name.trim();
      senderPhoto = guestProfile.photo;
      senderState = guestProfile.state || 'Lagos';
    } else {
      throw new Error('Sender identity required.');
    }

    let replyToData: PublicChatMessage['replyTo'] = undefined;

    if (replyToMessageId) {
      const targetMsg = (this.data.publicChatMessages || []).find(m => m.id === replyToMessageId);
      if (targetMsg && !targetMsg.isDeleted) {
        replyToData = {
          id: targetMsg.id,
          senderName: targetMsg.senderName,
          content: targetMsg.content.length > 80 ? targetMsg.content.slice(0, 77) + '...' : targetMsg.content
        };
      }
    }

    const newMsg: PublicChatMessage = {
      id: 'pubmsg_' + crypto.randomUUID(),
      senderId,
      senderName,
      senderPhoto,
      senderGender,
      senderState,
      isVerified,
      content: content.trim(),
      replyTo: replyToData,
      reactions: [],
      createdAt: new Date().toISOString()
    };

    if (!this.data.publicChatMessages) {
      this.data.publicChatMessages = [];
    }
    this.data.publicChatMessages.push(newMsg);

    // Keep up to 1500 messages to prevent memory bloat while preserving rich permanent history
    if (this.data.publicChatMessages.length > 1500) {
      this.data.publicChatMessages = this.data.publicChatMessages.slice(-1500);
    }

    this.persist();
    return newMsg;
  }

  public reactToPublicChatMessage(messageId: string, actorId: string, emoji: string): PublicChatMessage | null {
    if (!this.data.publicChatMessages) return null;
    const msg = this.data.publicChatMessages.find(m => m.id === messageId);
    if (!msg || msg.isDeleted) return null;

    if (!msg.reactions) msg.reactions = [];

    const existingReaction = msg.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      const userIndex = existingReaction.users.indexOf(actorId);
      if (userIndex > -1) {
        // Toggle off
        existingReaction.users.splice(userIndex, 1);
        existingReaction.count--;
      } else {
        // Add
        existingReaction.users.push(actorId);
        existingReaction.count++;
      }
    } else {
      msg.reactions.push({
        emoji,
        count: 1,
        users: [actorId]
      });
    }

    // Clean up empty reaction buckets
    msg.reactions = msg.reactions.filter(r => r.count > 0);

    this.persist();
    return msg;
  }

  public getPublicChatActiveUsers(): { id: string; name: string; state?: string; isVerified: boolean; photo?: string }[] {
    const activeMap = new Map<string, { id: string; name: string; state?: string; isVerified: boolean; photo?: string }>();
    const recentMsgs = (this.data.publicChatMessages || []).slice(-50).reverse();

    for (const m of recentMsgs) {
      if (!activeMap.has(m.senderId)) {
        activeMap.set(m.senderId, {
          id: m.senderId,
          name: m.senderName,
          state: m.senderState,
          isVerified: !!m.isVerified,
          photo: m.senderPhoto
        });
      }
    }

    return Array.from(activeMap.values());
  }

  public deletePublicChatMessage(messageId: string, actorUserId: string): boolean {
    if (!this.data.publicChatMessages) return false;
    const msg = this.data.publicChatMessages.find(m => m.id === messageId);
    if (!msg) return false;

    const actor = this.getUserById(actorUserId);
    const isOwner = msg.senderId === actorUserId;
    const isAdmin = actor?.role === 'admin';

    if (!isOwner && !isAdmin) return false;

    msg.isDeleted = true;
    msg.content = '[This message was removed by moderator]';

    if (isAdmin && !isOwner) {
      this.data.adminAuditLogs.push({
        id: 'audit_' + crypto.randomUUID(),
        adminId: actorUserId,
        adminEmail: actor?.email || 'admin',
        action: 'DELETE_PUBLIC_CHAT_MESSAGE',
        targetId: messageId,
        details: `Moderator deleted public message by ${msg.senderName}`,
        createdAt: new Date().toISOString()
      });
    }

    this.persist();
    return true;
  }
}

export const db = new Database();
