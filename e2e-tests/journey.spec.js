const { test, expect } = require('@playwright/test');
const { connectE2eDB, disconnectE2eDB, User, Journey, JourneyInvitation, Message } = require('./db');

const timestamp = Date.now();
const testUsers = {
  A: { name: `e2e_A_${timestamp}`, email: `a_${timestamp}@test.com`, password: 'Password123!', _id: null },
  B: { name: `e2e_B_${timestamp}`, email: `b_${timestamp}@test.com`, password: 'Password123!', _id: null },
  C: { name: `e2e_C_${timestamp}`, email: `c_${timestamp}@test.com`, password: 'Password123!', _id: null },
  D: { name: `e2e_D_${timestamp}`, email: `d_${timestamp}@test.com`, password: 'Password123!', _id: null }
};

let testJourneyId = null;

test.describe.serial('Journey E2E', () => {

  test.beforeAll(async () => {
    await connectE2eDB();
  });

  test.afterAll(async () => {
    // Cleanup uniquely identifiable test data
    const emails = Object.values(testUsers).map(u => u.email);
    await User.deleteMany({ email: { $in: emails } });
    
    if (testJourneyId) {
      await Journey.deleteMany({ _id: testJourneyId });
      await JourneyInvitation.deleteMany({ journeyId: testJourneyId });
      // Add chat deletion if needed based on room ID
    }
    await disconnectE2eDB();
  });

  test.describe('Authentication', () => {
    // Helper for registering
    const registerUser = async (page, user) => {
      await page.goto('/register');
      // For register, usually it's id="name", id="email", id="password"
      await page.fill('#username', user.name).catch(() => page.fill('input[type="text"]', user.name));
      await page.fill('#email', user.email);
      await page.fill('#password', user.password);
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/auth/register') && response.status() === 200 // Register might return 200 or 201
      );
      await page.click('button[type="submit"]');
      await responsePromise;

      // DB Assertion
      const dbUser = await User.findOne({ email: user.email });
      expect(dbUser).toBeTruthy();
      user._id = dbUser._id;
    };

    test('Register A, B, C, D', async ({ browser }) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await registerUser(page, testUsers.A);
      await registerUser(page, testUsers.B);
      await registerUser(page, testUsers.C);
      await registerUser(page, testUsers.D);
      
      await context.close();
    });

    test('Login User A', async ({ page }) => {
      await page.goto('/login');
      await page.fill('#email', testUsers.A.email);
      await page.fill('#password', testUsers.A.password);
      
      const responsePromise = page.waitForResponse(response => 
        response.url().includes('/api/auth/login') && response.status() === 200
      );
      await page.click('button[type="submit"]');
      await responsePromise;

      // UI Assertion
      await expect(page).toHaveURL(/.*\/social\/buddy|.*\/explore/); 
    });
  });

  test.describe('Journey Creation', () => {
    test('Create Journey', async ({ page }) => {
      // Assuming User A is logged in (Playwright reuses page state if not isolated, but we should isolate)
      // For simplicity in serial tests, we'll login User A fresh in a setup hook if needed, 
      // or use Playwright's global setup for auth state. 
      // Here we assume a fresh login for A
      await page.goto('/login');
      await page.fill('input[name="email"]', testUsers.A.email);
      await page.fill('input[name="password"]', testUsers.A.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*\/dashboard|.*\/explore/);

      // UI Action
      await page.getByTestId('create-journey').click();
      await page.fill('input[placeholder="e.g. Ratnagiri Beach Getaway, Leh Expedition"]', `E2E Journey ${timestamp}`);
      await page.getByTestId('destination-input').fill('E2E Test Destination');
      // Set capacity / maxMembers to 3 for concurrency test
      await page.getByTestId('max-members-input').fill('3'); 
      
      const createResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/journeys') && response.status() === 201
      );
      await page.getByTestId('create-journey-submit').click();
      const response = await createResponsePromise;
      const responseData = await response.json();
      testJourneyId = responseData._id || responseData.data._id; // Adapt based on actual API

      // DB Assertion
      const journey = await Journey.findById(testJourneyId);
      expect(journey).toBeTruthy();
      expect(journey.creator.toString()).toBe(testUsers.A._id.toString());
      expect(journey.members.length).toBe(1);
      expect(journey.members[0].user.toString()).toBe(testUsers.A._id.toString());
      expect(journey.maxMembers).toBe(3);
      expect(journey.status).toBe('Planning');
    });
  });

  test.describe('Invitations & State Transitions', () => {
    // Tests for sending invite, accepting, rejecting, canceling, full capacity, concurrent acceptance.
    // ... we will mock the API calls directly for some of the complex concurrency ones 
    // to guarantee overlapping requests, or use Promise.all with Playwright request context.

    test('Send invitation to B', async ({ request }) => {
      // Using API directly for precise race condition and transition testing
      // (Login User A to get token)
      const loginRes = await request.post('/api/auth/login', {
        data: { email: testUsers.A.email, password: testUsers.A.password }
      });
      const loginData = await loginRes.json();
      const tokenA = loginData.token;

      // Send Invite
      const inviteRes = await request.post(`/api/journeys/${testJourneyId}/invite`, {
        headers: { Authorization: `Bearer ${tokenA}` },
        data: { inviteeId: testUsers.B._id }
      });
      expect(inviteRes.status()).toBe(201); // or 200

      // DB Assertion
      const invite = await JourneyInvitation.findOne({ journeyId: testJourneyId, inviteeId: testUsers.B._id });
      expect(invite).toBeTruthy();
      expect(invite.status).toBe('pending');
    });

    test('User B Accepts Invitation', async ({ request }) => {
      // Login B
      const loginRes = await request.post('/api/auth/login', {
        data: { email: testUsers.B.email, password: testUsers.B.password }
      });
      const tokenB = (await loginRes.json()).token;

      const invite = await JourneyInvitation.findOne({ journeyId: testJourneyId, inviteeId: testUsers.B._id });

      const acceptRes = await request.post(`/api/journeys/invitations/${invite._id}/accept`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      expect(acceptRes.status()).toBe(200);

      // DB Assertion
      const updatedInvite = await JourneyInvitation.findById(invite._id);
      expect(updatedInvite.status).toBe('accepted');

      const journey = await Journey.findById(testJourneyId);
      const bMemberships = journey.members.filter(m => m.user.toString() === testUsers.B._id.toString());
      expect(bMemberships.length).toBe(1); // B is in members exactly once
    });

    test('Creator cannot accidentally become a duplicate member', async ({ request }) => {
      const loginRes = await request.post('/api/auth/login', {
        data: { email: testUsers.A.email, password: testUsers.A.password }
      });
      const tokenA = (await loginRes.json()).token;

      // A tries to invite themselves or accept a fake invite
      // Mocking an invite to A manually to test transition logic
      const invite = new JourneyInvitation({
        journeyId: testJourneyId, inviterId: testUsers.B._id, inviteeId: testUsers.A._id, status: 'pending'
      });
      await invite.save();

      const acceptRes = await request.post(`/api/journeys/invitations/${invite._id}/accept`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      // Should fail or at least not duplicate
      
      const journey = await Journey.findById(testJourneyId);
      const aMemberships = journey.members.filter(m => m.user.toString() === testUsers.A._id.toString());
      expect(aMemberships.length).toBe(1); // Still exactly 1
    });

    test('Concurrent Acceptance (Race Condition)', async ({ request }) => {
      // Capacity is 3. A and B are members. 1 slot remaining.
      // We will invite C and D, then accept concurrently.
      
      // Login A
      const loginA = await request.post('/api/auth/login', { data: { email: testUsers.A.email, password: testUsers.A.password } });
      const tokenA = (await loginA.json()).token;

      // Invite C and D
      await request.post(`/api/journeys/${testJourneyId}/invite`, { headers: { Authorization: `Bearer ${tokenA}` }, data: { inviteeId: testUsers.C._id }});
      await request.post(`/api/journeys/${testJourneyId}/invite`, { headers: { Authorization: `Bearer ${tokenA}` }, data: { inviteeId: testUsers.D._id }});

      const inviteC = await JourneyInvitation.findOne({ inviteeId: testUsers.C._id, journeyId: testJourneyId });
      const inviteD = await JourneyInvitation.findOne({ inviteeId: testUsers.D._id, journeyId: testJourneyId });

      // Login C and D
      const loginC = await request.post('/api/auth/login', { data: { email: testUsers.C.email, password: testUsers.C.password } });
      const tokenC = (await loginC.json()).token;
      const loginD = await request.post('/api/auth/login', { data: { email: testUsers.D.email, password: testUsers.D.password } });
      const tokenD = (await loginD.json()).token;

      // Concurrently accept
      const [resC, resD] = await Promise.all([
        request.post(`/api/journeys/invitations/${inviteC._id}/accept`, { headers: { Authorization: `Bearer ${tokenC}` } }),
        request.post(`/api/journeys/invitations/${inviteD._id}/accept`, { headers: { Authorization: `Bearer ${tokenD}` } })
      ]);

      // Assertions
      const statuses = [resC.status(), resD.status()];
      // One should succeed (200), one should fail (e.g. 400 capacity full)
      expect(statuses).toContain(200);
      expect(statuses.some(s => s >= 400)).toBe(true);

      const journey = await Journey.findById(testJourneyId);
      expect(journey.members.length).toBe(3); // Never 4!
      
      const updatedC = await JourneyInvitation.findById(inviteC._id);
      const updatedD = await JourneyInvitation.findById(inviteD._id);
      
      // One is accepted, one is capacity_full (or similar error state depending on your logic)
      expect([updatedC.status, updatedD.status]).toContain('accepted');
    });
  });

  test.describe('Join Requests', () => {
    let joinRequestJourneyId;
    let tokenA; // Host
    let tokenC; // Requester
    let tokenD; // Requester 2
    
    test.beforeAll(async ({ request }) => {
      // Login users
      const loginA = await request.post('/api/auth/login', { data: { email: testUsers.A.email, password: testUsers.A.password } });
      tokenA = (await loginA.json()).token;
      
      const loginC = await request.post('/api/auth/login', { data: { email: testUsers.C.email, password: testUsers.C.password } });
      tokenC = (await loginC.json()).token;

      const loginD = await request.post('/api/auth/login', { data: { email: testUsers.D.email, password: testUsers.D.password } });
      tokenD = (await loginD.json()).token;
      
      // Create a fresh journey for join requests testing
      const createRes = await request.post('/api/journeys', {
        headers: { Authorization: `Bearer ${tokenA}` },
        data: {
          title: 'Join Request Test Journey',
          destination: 'Goa',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          maxMembers: 3, // Capacity = 3, so A + 2 members
          journeyType: 'Shared Squad',
          sourceType: 'Custom'
        }
      });
      const data = await createRes.json();
      joinRequestJourneyId = data.journey?._id || data._id || data.data?._id;
      
      // Activate it so it can receive requests
      await request.put(`/api/journeys/${joinRequestJourneyId}/status`, {
        headers: { Authorization: `Bearer ${tokenA}` },
        data: { status: 'Planning' }
      });
    });
    
    test('Successful request to join', async ({ request }) => {
      const res = await request.post(`/api/journeys/${joinRequestJourneyId}/join-requests`, {
        headers: { Authorization: `Bearer ${tokenC}` },
        data: { message: 'Let me join!' }
      });
      expect(res.status()).toBe(201);
      
      // DB check
      const { JourneyJoinRequest } = require('./db');
      const jr = await JourneyJoinRequest.findOne({ journeyId: joinRequestJourneyId, userId: testUsers.C._id });
      expect(jr).toBeTruthy();
      expect(jr.status).toBe('pending');
    });

    test('Cancel request to join', async ({ request }) => {
      // Create request from D
      const reqRes = await request.post(`/api/journeys/${joinRequestJourneyId}/join-requests`, {
        headers: { Authorization: `Bearer ${tokenD}` },
        data: { message: 'Will cancel this' }
      });
      const reqData = await reqRes.json();
      const reqId = reqData.joinRequest._id;
      
      // Cancel it
      const delRes = await request.delete(`/api/journeys/join-requests/${reqId}`, {
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      expect(delRes.status()).toBe(200);
      
      // Verify deleted
      const { JourneyJoinRequest } = require('./db');
      const jr = await JourneyJoinRequest.findById(reqId);
      expect(jr).toBeNull();
    });

    test('Reject request to join', async ({ request }) => {
      // D makes another request
      const reqRes = await request.post(`/api/journeys/${joinRequestJourneyId}/join-requests`, {
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      const reqData = await reqRes.json();
      const reqId = reqData.joinRequest._id;
      
      // Host A rejects it
      const rejectRes = await request.post(`/api/journeys/join-requests/${reqId}/reject`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      expect(rejectRes.status()).toBe(200);
      
      // Verify DB
      const { JourneyJoinRequest } = require('./db');
      const jr = await JourneyJoinRequest.findById(reqId);
      expect(jr.status).toBe('rejected');
    });

    test('Accept request to join', async ({ request }) => {
      // Find C's pending request
      const { JourneyJoinRequest, Journey } = require('./db');
      const jr = await JourneyJoinRequest.findOne({ journeyId: joinRequestJourneyId, userId: testUsers.C._id, status: 'pending' });
      
      // Host A accepts it
      const acceptRes = await request.post(`/api/journeys/join-requests/${jr._id}/accept`, {
        headers: { Authorization: `Bearer ${tokenA}` }
      });
      expect(acceptRes.status()).toBe(200);
      
      // Verify DB
      const updatedJr = await JourneyJoinRequest.findById(jr._id);
      expect(updatedJr.status).toBe('accepted');
      
      const journey = await Journey.findById(joinRequestJourneyId);
      const cMem = journey.members.find(m => m.user.toString() === testUsers.C._id.toString());
      expect(cMem).toBeTruthy();
    });

    test('Full capacity prevents join request', async ({ request }) => {
      // Capacity is 3, Members currently 2 (A, C). Let's add B directly to make it full.
      const loginB = await request.post('/api/auth/login', { data: { email: testUsers.B.email, password: testUsers.B.password } });
      const tokenB = (await loginB.json()).token;
      
      const { Journey } = require('./db');
      await Journey.findByIdAndUpdate(joinRequestJourneyId, {
        $push: { members: { user: testUsers.B._id, role: 'Traveler' } }
      });
      
      // Now members=3, max=3. 
      // D tries to request
      const reqRes = await request.post(`/api/journeys/${joinRequestJourneyId}/join-requests`, {
        headers: { Authorization: `Bearer ${tokenD}` }
      });
      expect(reqRes.status()).toBe(400); // Should fail with full capacity
    });

  });
});

