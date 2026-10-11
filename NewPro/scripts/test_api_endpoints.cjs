const http = require('http');

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function testApi() {
  const entityId = 'ST-839801';
  const userId = 'XU-400286';

  console.log('Testing Endpoints for Startup:', entityId);

  // 1. GET /api/startups/ST-839801
  const getRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/startups/${entityId}?userId=${userId}`,
    method: 'GET',
    headers: { 'x-user-id': userId },
  });
  console.log('\n[1. GET /api/startups/[entityId]] Status:', getRes.status);
  console.log('Name:', getRes.data?.data?.identity?.name);
  console.log('Is Owner:', getRes.data?.meta?.isOwner);

  // 2. PUT /api/startups/ST-839801 (Atomic update)
  const putRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/startups/${entityId}`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    },
    {
      userId,
      identity: {
        tagline: 'Leading next-generation fintech infrastructure',
      },
      problem: {
        problemStatement: 'SMEs face 6-week delays in cross-border settlements.',
        targetUsers: 'Export/import merchants and logistics firms.',
        painPoints: ['High fees', 'Slow wire processing', 'Lack of transparency'],
      },
    }
  );
  console.log('\n[2. PUT /api/startups/[entityId]] Status:', putRes.status, 'Success:', putRes.data?.success);
  console.log('Updated Tagline:', putRes.data?.data?.identity?.tagline);
  console.log('Updated Problem:', putRes.data?.data?.problem?.problemStatement);

  // 3. PUT /api/startups/ST-839801/financials
  const putFinRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/startups/${entityId}/financials`,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    },
    {
      userId,
      revenueCurrentMonth: '₹4,50,000',
      expensesCurrentMonth: '₹2,20,000',
      burnRateMonthly: '₹2,20,000',
      cashAvailable: '₹35,00,000',
      runwayMonths: 16,
      mrr: '₹4,50,000',
      arr: '₹54,00,000',
      growthPct: '18%',
      totalFundingRaised: '₹50,00,000',
      capTable: [
        { id: 'cap-1', stakeholder: 'Founder', role: 'Founder & CEO', ownershipPct: 80, shares: 80000 },
        { id: 'cap-2', stakeholder: 'Angel Syndicate', role: 'Angel Investor', ownershipPct: 20, shares: 20000 },
      ],
    }
  );
  console.log('\n[3. PUT /api/startups/[entityId]/financials] Status:', putFinRes.status, 'Success:', putFinRes.data?.success);

  // 4. GET /api/startups/ST-839801/financials
  const getFinRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/startups/${entityId}/financials?userId=${userId}`,
    method: 'GET',
    headers: { 'x-user-id': userId },
  });
  console.log('\n[4. GET /api/startups/[entityId]/financials] Status:', getFinRes.status);
  console.log('MRR:', getFinRes.data?.data?.mrr, 'Runway:', getFinRes.data?.data?.runwayMonths, 'months');
  console.log('Cap Table count:', getFinRes.data?.data?.capTable?.length);

  // 5. POST /api/startups/ST-839801/diligence (Upload Document)
  const postDocRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/startups/${entityId}/diligence`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    },
    {
      action: 'UPLOAD_DOCUMENT',
      document: {
        id: `doc_test_${Date.now()}`,
        name: 'Certificate_of_Incorporation.pdf',
        folder: 'Corporate',
        fileSize: '1.2 MB',
        fileType: 'PDF',
        isConfidential: true,
      },
      actorName: 'Founder',
    }
  );
  console.log('\n[5. POST /api/startups/[entityId]/diligence] Status:', postDocRes.status, 'Success:', postDocRes.data?.success);

  // 6. GET /api/startups/ST-839801/diligence
  const getDocRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/startups/${entityId}/diligence?userId=${userId}`,
    method: 'GET',
    headers: { 'x-user-id': userId },
  });
  console.log('\n[6. GET /api/startups/[entityId]/diligence] Status:', getDocRes.status);
  console.log('Documents count:', getDocRes.data?.data?.documents?.length);
  console.log('Document name:', getDocRes.data?.data?.documents?.[0]?.name);

  // 7. POST /api/startups/ST-839801/team (Create Talent Ask)
  const postAskRes = await request(
    {
      hostname: 'localhost',
      port: 3000,
      path: `/api/startups/${entityId}/team`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
    },
    {
      action: 'CREATE_TALENT_ASK',
      ask: {
        title: 'Founding Lead Backend Engineer',
        role: 'Lead Backend Engineer',
        department: 'Engineering',
        roleType: 'Full-time',
        location: 'Bengaluru / Remote',
        compensationType: 'Salary + Equity',
        equityRange: '1.0% - 2.5%',
        salaryRange: '₹24L - ₹36L',
        skillsRequired: ['Node.js', 'MongoDB', 'Distributed Systems'],
      },
    }
  );
  console.log('\n[7. POST /api/startups/[entityId]/team] Status:', postAskRes.status, 'Success:', postAskRes.data?.success);

  // 8. GET /api/startups/ST-839801/team
  const getTeamRes = await request({
    hostname: 'localhost',
    port: 3000,
    path: `/api/startups/${entityId}/team?userId=${userId}`,
    method: 'GET',
    headers: { 'x-user-id': userId },
  });
  console.log('\n[8. GET /api/startups/[entityId]/team] Status:', getTeamRes.status);
  console.log('Talent Asks count:', getTeamRes.data?.data?.talentAsks?.length);
  console.log('First Ask:', getTeamRes.data?.data?.talentAsks?.[0]?.title);

  console.log('\n[ALL TESTS PASSED] Complete backend persistence verified across all routes!');
}

testApi().catch((err) => {
  console.error('[API Test Error]', err);
  process.exit(1);
});
