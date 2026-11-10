import { authService } from '../src/modules/auth/auth.service';
import { kycService } from '../src/modules/kyc/kyc.service';
import { projectsService } from '../src/modules/projects/projects.service';
import { marketplaceService } from '../src/modules/marketplace/marketplace.service';
import { bidsService } from '../src/modules/bids/bids.service';
import { ratingsService } from '../src/modules/ratings/ratings.service';
import { pool } from '../src/config/db';
import { redis } from '../src/config/redis';

async function runApiVerification() {
  console.log('\n--- Running Ware Store API & Business Logic Integration Suite ---\n');

  try {
    // 1. Test OTP Generation & Rate Limits in Redis
    console.log('1. Testing OTP Generation & Verification Logic...');
    const testPhone = '9876500001';
    
    // Clear any test keys in redis
    await redis.del(`otp:code:phone:${testPhone}`);
    await redis.del(`otp:cooldown:phone:${testPhone}`);
    await redis.del(`otp:req_throttle:phone:${testPhone}`);

    const otpRes = await authService.sendOtp({
      identifier: testPhone,
      type: 'phone',
      role: 'builder',
    });
    console.log(`   OTP dispatched successfully. DevOtp: ${otpRes.devOtp}`);

    if (!otpRes.devOtp) {
      throw new Error('Dev OTP not returned in test environment.');
    }

    // Verify OTP
    const verifyRes = await authService.verifyOtp({
      identifier: testPhone,
      type: 'phone',
      otp: otpRes.devOtp,
      role: 'builder',
    });
    console.log(`   Verification successful! User ID: ${verifyRes.user.id}, Role: ${verifyRes.user.role}`);

    // 2. Test Builder KYC Submission
    console.log('\n2. Testing Builder KYC Registration with Geolocation Coordinates...');
    const kycRes = await kycService.submitBuilderKyc({
      userId: verifyRes.user.id,
      firstName: 'Karan',
      lastName: 'Mehta',
      addressText: 'Brigade Gateway Site, Rajajinagar, Bengaluru',
      latitude: 13.0116,
      longitude: 77.5550,
      idProofUrl: '/uploads/karan_aadhaar.pdf',
      idProofType: 'aadhaar',
    });
    console.log(`   Builder KYC saved. Profile ID: ${kycRes.profile.id}`);

    // 3. Test Project Requisition Creation (Wizard)
    console.log('\n3. Testing Builder Requisition Wizard (Sand / M-Sand)...');
    const project = await projectsService.createProject({
      builderId: kycRes.profile.id,
      category: 'Sand',
      subItem: 'M-Sand (Plastering Grade)',
      brandPreference: 'Top Quality Washed',
      quantity: 800,
      unit: 'Cubic Feet',
      requirementDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      transportNeeded: true,
      gstNumber: '29ABCDE1234F1Z5',
      notes: 'Unloading required near Site Gate #2',
    });
    console.log(`   Project created successfully! Project ID: ${project.id}, Category: ${project.category}`);

    // 4. Test Vendor Discovery Feed with PostGIS Radius
    console.log('\n4. Testing Vendor Feed with PostGIS ST_Distance...');
    // Fetch a seeded vendor
    const vRes = await pool.query('SELECT id, business_name FROM vendor_profiles LIMIT 1');
    const vendor = vRes.rows[0];

    const feed = await marketplaceService.getFeed({
      vendorId: vendor.id,
      distanceKm: 50,
      category: 'Sand',
    });
    console.log(`   Marketplace feed returned ${feed.length} project(s) matching criteria within 50km.`);
    const matchingProject = feed.find((p) => p.id === project.id);
    if (matchingProject) {
      console.log(`   Found new project in feed! Distance from vendor warehouse: ${matchingProject.distance_km} km`);
    }

    // 5. Test Quote Submission by Vendor
    console.log('\n5. Testing Vendor Quote Submission Engine...');
    const bid = await bidsService.submitBid({
      vendorId: vendor.id,
      projectId: project.id,
      baseUnitPrice: 48.00, // Rs 48 / cft
      transportFee: 3500,
      taxRatePercent: 18,
      deliveryTimelineDays: 2,
      remarks: 'Double washed M-Sand. Instant dispatch ready.',
    });
    console.log(`   Quote submitted! Base: Rs ${bid.base_unit_price}, Transport: Rs ${bid.transport_fee}, Total with 18% Tax: Rs ${bid.total_amount}`);

    // 6. Test Leaderboard Computation
    console.log('\n6. Testing Project Bids Leaderboard...');
    const leaderboard = await projectsService.getProjectLeaderboard(project.id);
    console.log(`   Leaderboard retrieved ${leaderboard.length} bid(s). Top quote: Rs ${leaderboard[0].total_amount} by ${leaderboard[0].business_name} (Rank #${leaderboard[0].price_rank})`);

    // 7. Test Accepting Quote
    console.log('\n7. Testing Builder Quote Acceptance Transaction...');
    const acceptRes = await projectsService.acceptBid(bid.id, kycRes.profile.id);
    console.log(`   ${acceptRes.message}`);

    // Verify project closed
    const closedProj = await projectsService.getProjectDetails(project.id);
    console.log(`   Project status now: ${closedProj.status}`);

    // 8. Test Bid Completion Flow
    console.log('\n8. Testing Bid Completion (accepted → completed)...');
    const completeRes = await bidsService.completeBid(bid.id, kycRes.profile.id);
    console.log(`   ${completeRes.message}`);

    // Verify bid status is now 'completed'
    const completedBidRes = await pool.query('SELECT status FROM bids WHERE id = $1', [bid.id]);
    console.log(`   Bid status now: ${completedBidRes.rows[0].status}`);
    if (completedBidRes.rows[0].status !== 'completed') {
      throw new Error(`Expected bid status 'completed', got '${completedBidRes.rows[0].status}'`);
    }

    // 9. Test Builder → Vendor Rating Submission
    console.log('\n9. Testing Builder → Vendor Rating Submission...');
    const builderRating = await ratingsService.submitRating({
      bidId: bid.id,
      reviewerUserId: verifyRes.user.id,
      score: 5,
      review: 'Excellent quality M-Sand, delivered ahead of schedule. Highly recommended vendor.',
    });
    console.log(`   Rating submitted! Score: ${builderRating.score}/5, ID: ${builderRating.id}`);

    // Verify vendor's aggregate rating was recalculated
    const updatedVendor = await pool.query('SELECT rating, rating_count FROM vendor_profiles WHERE id = $1', [vendor.id]);
    console.log(`   Vendor aggregate rating updated: ${updatedVendor.rows[0].rating} (${updatedVendor.rows[0].rating_count} reviews)`);

    // 10. Test Vendor → Builder Rating Submission
    console.log('\n10. Testing Vendor → Builder Rating Submission...');
    // Get vendor's user_id from their profile
    const vendorUserRes = await pool.query('SELECT user_id FROM vendor_profiles WHERE id = $1', [vendor.id]);
    const vendorUserId = vendorUserRes.rows[0].user_id;

    const vendorRating = await ratingsService.submitRating({
      bidId: bid.id,
      reviewerUserId: vendorUserId,
      score: 4,
      review: 'Payment was prompt. Site access was well-organized. Good builder to work with.',
    });
    console.log(`   Rating submitted! Score: ${vendorRating.score}/5, ID: ${vendorRating.id}`);

    // Verify builder's aggregate rating was recalculated
    const updatedBuilder = await pool.query('SELECT rating, rating_count FROM builder_profiles WHERE user_id = $1', [verifyRes.user.id]);
    console.log(`   Builder aggregate rating updated: ${updatedBuilder.rows[0].rating} (${updatedBuilder.rows[0].rating_count} reviews)`);

    // 11. Test Duplicate Rating Prevention
    console.log('\n11. Testing Duplicate Rating Prevention...');
    try {
      await ratingsService.submitRating({
        bidId: bid.id,
        reviewerUserId: verifyRes.user.id,
        score: 3,
        review: 'Trying to rate again...',
      });
      throw new Error('Expected duplicate rating to fail but it succeeded!');
    } catch (dupErr: any) {
      if (dupErr.message.includes('already submitted')) {
        console.log(`   ✅ Duplicate correctly rejected: "${dupErr.message}"`);
      } else {
        throw dupErr;
      }
    }

    // 12. Test Rating Retrieval
    console.log('\n12. Testing Rating Retrieval...');
    const bidRatings = await ratingsService.getRatingsForBid(bid.id);
    console.log(`   Ratings for bid: ${bidRatings.length} records found (expected 2)`);
    if (bidRatings.length !== 2) {
      throw new Error(`Expected 2 ratings for bid, got ${bidRatings.length}`);
    }
    for (const r of bidRatings) {
      console.log(`     → ${r.reviewer_name} (${r.reviewer_role}): ${r.score}/5 — "${r.review}"`);
    }

    // Check hasUserRatedBid helper
    const hasRated = await ratingsService.hasUserRatedBid(bid.id, verifyRes.user.id);
    console.log(`   Builder has rated this bid: ${hasRated} (expected true)`);
    if (!hasRated) {
      throw new Error('Expected hasUserRatedBid to return true');
    }

    console.log('\n🎉 ALL INTEGRATION TESTS PASSED CLEANLY (including Ratings & Reviews)!\n');
  } finally {
    await pool.end();
    redis.disconnect();
  }
}

runApiVerification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Integration test failed:', err);
    process.exit(1);
  });
