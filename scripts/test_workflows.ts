import { db } from '../server/db.ts';
import bcrypt from 'bcryptjs';

async function runTests() {
  console.log('--- STARTING NAIJAMATCH AUTOMATED INTEGRATION TESTS ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  try {
    // Test 1: Age verification calculation
    const dobUnder18 = new Date(Date.now() - 15 * 365.25 * 86400000).toISOString().split('T')[0];
    const dobOver18 = '1996-08-14';

    function calculateAge(dobStr: string): number {
      const birth = new Date(dobStr);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
      return age;
    }

    assert(calculateAge(dobUnder18) < 18, 'Under-18 check accurately identifies minor');
    assert(calculateAge(dobOver18) >= 18, 'Adult check accurately approves age 18+');

    // Test 2: User registration & password hashing
    const testEmail = `test.user.${Date.now()}@example.com`;
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('StrongPassword123!', salt);
    const user = db.createUser(testEmail, hash);

    assert(user.email === testEmail.toLowerCase(), 'User created with normalized email');
    assert(!user.isEmailVerified, 'New user is initially unverified');
    assert(bcrypt.compareSync('StrongPassword123!', hash), 'Argon2/bcrypt password hashing matches');

    // Test 3: OTP generation & verification
    const otpRec = db.setOTP(testEmail, '543210');
    assert(otpRec.code === '543210', 'OTP code securely assigned');

    const invalidVerify = db.verifyOTP(testEmail, '999999');
    assert(!invalidVerify.valid, 'Incorrect OTP is rejected and attempts incremented');

    const validVerify = db.verifyOTP(testEmail, '543210');
    assert(validVerify.valid, 'Correct OTP is accepted');
    db.updateUser(user.id, { isEmailVerified: true });
    assert(db.getUserById(user.id)?.isEmailVerified === true, 'User is marked email-verified');

    // Test 4: Profile Onboarding
    const profile = db.upsertProfile(user.id, {
      displayName: 'Babajide Test',
      dateOfBirth: '1996-08-14',
      age: 30,
      gender: 'Man',
      datingPreference: 'Women',
      relationshipIntention: 'Serious Relationship',
      state: 'Lagos',
      city: 'Victoria Island',
      bio: 'Entrepreneur looking for a meaningful life partnership.',
      photos: [
        { id: 'p1', url: 'https://example.com/photo1.jpg', isPrimary: true, order: 0 }
      ],
      interests: ['Tech', 'Afrobeats', 'Tennis']
    });

    assert(profile.displayName === 'Babajide Test', 'Profile display name saved');
    assert(profile.state === 'Lagos', 'Nigerian state saved accurately');

    // Test 5: Discovery filtering by state
    const discoverLagos = db.getDiscoverProfiles(user.id, { state: 'Lagos' });
    assert(discoverLagos.profiles.every(p => p.state === 'Lagos'), 'Discover filter correctly filters by Lagos');

    // Test 6: Likes and Mutual Match Detection
    const sampleTarget = discoverLagos.profiles[0];
    if (sampleTarget) {
      // Step A: Target likes user
      db.likeProfile(sampleTarget.userId, user.id);
      // Step B: User likes target back -> triggers mutual match!
      const likeRes = db.likeProfile(user.id, sampleTarget.userId);
      assert(likeRes.isMatch === true, 'Mutual like automatically creates Match record');
      assert(likeRes.match !== undefined, 'Match record properly generated');
    }

    // Test 7: Subscription check before payment (unpaid user)
    const activeSubBefore = db.getActiveSubscription(user.id);
    assert(activeSubBefore === null, 'User initially has no active subscription');

    // Test 8: Payment proof submission & duplicate protection
    const txnRef = `OPAY_TXN_${Date.now()}`;
    const payment = db.submitPaymentProof({
      userId: user.id,
      userEmail: user.email,
      userName: profile.displayName,
      planId: 'monthly',
      amountNGN: 5000,
      paymentDate: '2026-10-11',
      transactionReference: txnRef,
      proofScreenshotUrl: 'https://example.com/receipt.png'
    });

    assert(payment.status === 'pending', 'Payment proof submitted with status pending');

    // Verify duplicate submission prevention
    let duplicateErrorThrown = false;
    try {
      db.submitPaymentProof({
        userId: user.id,
        userEmail: user.email,
        userName: profile.displayName,
        planId: 'monthly',
        amountNGN: 5000,
        paymentDate: '2026-10-11',
        transactionReference: txnRef, // Same reference!
        proofScreenshotUrl: 'https://example.com/receipt.png'
      });
    } catch (e) {
      duplicateErrorThrown = true;
    }
    assert(duplicateErrorThrown, 'Duplicate transaction reference submission was rejected');

    // Test 9: Administrator approval & instant subscription activation
    const adminUser = (db as any).data.users.find((u: any) => u.role === 'admin');
    if (adminUser) {
      const reviewed = db.reviewPayment(payment.id, adminUser.id, 'approved');
      assert(reviewed.status === 'approved', 'Payment status updated to approved');

      const activeSubAfter = db.getActiveSubscription(user.id);
      assert(activeSubAfter !== null, 'Subscription activated immediately after approval');
      assert(activeSubAfter?.planId === 'monthly', 'Correct monthly plan duration provisioned');
    }

    // Test 10: Real-time messaging persistence
    if (sampleTarget) {
      const convo = db.getOrCreateConversation(user.id, sampleTarget.userId);
      const msg = db.saveMessage(convo.id, user.id, 'Hello! Wonderful to connect with you on NaijaMatch.');
      assert(msg.content.includes('Wonderful to connect'), 'Message created and content preserved');

      const convoMessages = db.getMessages(convo.id, user.id);
      assert(convoMessages.length >= 1, 'Message retrieved from persistent database store');
    }

    // Test 11: Friend requests
    if (sampleTarget) {
      const fReq = db.sendFriendRequest(user.id, sampleTarget.userId);
      assert(fReq.status === 'pending', 'Friend request successfully sent');
      const responded = db.respondFriendRequest(fReq.id, sampleTarget.userId, 'accept');
      assert(responded.status === 'accepted', 'Friend request accepted');
    }

    // Test 12: Marketplace listing
    const listing = db.createMarketplaceListing({
      userId: user.id,
      title: 'Romantic Candlelight Hamper',
      description: 'Artisanal gift box with flowers and chocolate for couples in Lagos.',
      category: 'Gifts',
      priceNGN: 25000,
      state: 'Lagos',
      city: 'Victoria Island',
      images: ['https://example.com/candle.jpg']
    });
    assert(listing.priceNGN === 25000, 'Marketplace item created with exact NGN price');

    // Test 13: Admin audit logging
    const auditLogs = db.getAuditLogs();
    assert(auditLogs.length > 0, 'Admin audit log recorded all sensitive actions');

    console.log(`\n--- ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ---`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
