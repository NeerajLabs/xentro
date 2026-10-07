import { FullInvestorProfile } from '@/types/investor';

export const investorProfilesMap: Record<string, FullInvestorProfile> = {
  inv_1: {
    id: 'inv_1',
    name: 'Sequoia Capital',
    logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&auto=format&fit=crop&q=80',
    investorType: 'Venture Capital',
    currentRole: 'Managing Director & Lead Partner',
    organization: 'Sequoia Capital India & SEA',
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
    },
    website: 'https://sequoiacap.com',
    linkedIn: 'https://linkedin.com/company/sequoia-capital',
    verified: true,
    primaryInvestmentFocus: 'AI Systems · Enterprise SaaS · Consumer Internet',

    bio: 'Partnering with legendary founders from idea to IPO and beyond. Sequoia has been backing company-builders across India and Southeast Asia for over two decades.',
    background: 'With over $8B+ deployed across emerging tech ecosystems in India and APAC, Sequoia Capital backs visionary founders leveraging artificial intelligence, cloud architectures, and foundational software to reinvent trillion-dollar industries.',
    yearsOfInvestingExperience: '20+ Years in APAC & Global Venture',

    overview: {
      whoTheyInvestIn: 'Relentless, technical founders with profound domain insight, tackling massive market inefficiencies with defensible software moats.',
      sectorsFocus: 'Enterprise SaaS, Foundation AI Models, Autonomous Workflows, FinTech Infrastructure, and Next-Gen Consumer Ecosystems.',
      investmentPhilosophy: 'We believe exceptional companies are forged in conviction, focus, and non-linear speed. We invest as early as pre-seed napkin ideas and stay all the way to public market scale.',
      aimToContribute: 'Unmatched global talent recruiting networks, customer enterprise introductions across the Fortune 500, rigorous board governance, and follow-on syndication power.',
    },

    investmentFocus: {
      sectors: ['Enterprise SaaS', 'Artificial Intelligence', 'FinTech Infrastructure', 'Consumer Tech', 'Developer Tooling'],
      stages: ['Seed', 'Series A', 'Series B+', 'Growth'],
      geography: {
        countries: ['India', 'United States', 'Singapore', 'Southeast Asia'],
        regions: ['APAC', 'North America'],
        cities: ['Bengaluru', 'San Francisco', 'Singapore', 'Mumbai'],
      },
      businessModels: ['B2B', 'SaaS', 'Marketplace', 'B2B2C'],
      ticketSize: {
        min: '$1M',
        max: '$15M',
        formatted: '$1M – $15M',
      },
      leadInvestorPreference: 'Lead / Co-lead Preferred',
      coInvestorPreference: 'Open to syndicating with leading tier-1 institutional funds and verified angels',
      investmentInstruments: ['Priced Equity (Preferred Shares)', 'SAFE / Convertible Note', 'Syndicate SPV'],
    },

    valueBeyondCapital: {
      supportAreas: [
        'Strategic Guidance',
        'Customer Introductions',
        'Hiring & Executive Talent',
        'Fundraising & Syndication',
        'International Expansion',
        'Governance & Board Advisory',
      ],
      whatIBringToFounders: 'Direct access to Sequoia’s Builders Network: our internal team of operators, talent recruiters, and enterprise GTM partners dedicated full-time to accelerating portfolio growth.',
      advisoryCapabilities: [
        'Global Enterprise Customer Intros',
        'C-Suite & VP Engineering Recruitment',
        'US Market Entry Strategy & Relocation Guidance',
        'Follow-On Round Pricing & Syndicate Formation',
      ],
    },

    investmentCriteria: {
      evaluationCriteria: [
        'Founding Team Pedigree & Velocity',
        'Total Addressable Market ($5B+ Global Market Potential)',
        'Product Moat & Architectural Defensibility',
        'Early Cohort Retention & Net Revenue Expansion',
        'Unit Economics and Structural Gross Margin Profile',
      ],
      preferredTraction: ['MVP', 'Early Revenue', 'PMF', 'Growth'],
      diligenceHighlights: [
        'Customer reference calls and enterprise pilot validation',
        'Technical architecture review and code quality audit',
        'Cap table cleanliness and founder vesting alignment',
      ],
    },

    investmentProcess: {
      stages: [
        {
          stepNumber: 1,
          title: 'Introduction & Initial Deck Review',
          description: 'Initial review of pitch deck, company traction metrics, and founder background.',
          estimatedTime: '3-5 Days',
        },
        {
          stepNumber: 2,
          title: 'Partner Intro Call',
          description: '45-minute discussion focusing on founder story, market thesis, and product demo.',
          estimatedTime: 'Week 1',
        },
        {
          stepNumber: 3,
          title: 'Deep-Dive Diligence & Customer Calls',
          description: 'Commercial diligence, reference checks with early users or design partners.',
          estimatedTime: 'Week 2',
        },
        {
          stepNumber: 4,
          title: 'Partnership Pitch Meeting',
          description: 'Presentation to the investment committee partners for consensus and conviction.',
          estimatedTime: 'Week 3',
        },
        {
          stepNumber: 5,
          title: 'Term Sheet & Closing',
          description: 'Issuance of formal term sheet followed by definitive documentation and wire.',
          estimatedTime: 'Week 4',
        },
      ],
      preferredConnectionMethod: 'Platform Connection Request or Warm Introduction via Xentro Network',
      informationRequiredInitially: [
        'Updated Pitch Deck (PDF)',
        'Monthly Traction / ARR Run Rate Metrics',
        'Cap Table Summary',
        'Product Demo Video or Sandbox Access',
      ],
      typicalDecisionTimeline: '2 to 3 Weeks from First Meeting',
      pitchDeckRequirements: 'Concise 12-15 slide deck highlighting Problem, Solution, Market, Tech Moat, Team, and Financial Traction.',
      warmIntroPreferred: true,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [
      {
        id: 'port_1',
        name: 'Kinetix AI',
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        sector: 'Enterprise AI & Collaborative Intelligence',
        stageInvested: 'Series A',
        investmentYear: '2024',
        currentStatus: 'Active',
        xentroStartupId: 'st_1',
        description: 'Enterprise-grade collaborative AI and verified venture intelligence platform.',
      },
      {
        id: 'port_2',
        name: 'Stripe',
        logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
        sector: 'FinTech Infrastructure',
        stageInvested: 'Series A',
        investmentYear: '2011',
        currentStatus: 'Scaled',
        description: 'Financial infrastructure platform powering global internet commerce.',
      },
      {
        id: 'port_3',
        name: 'Apple',
        logo: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=150&auto=format&fit=crop&q=80',
        sector: 'Consumer Electronics & OS',
        stageInvested: 'Seed',
        investmentYear: '1978',
        currentStatus: 'IPO',
        description: 'Iconic consumer technology and software pioneer.',
      },
      {
        id: 'port_4',
        name: 'Google',
        logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80',
        sector: 'Search & Cloud Infrastructure',
        stageInvested: 'Series A',
        investmentYear: '1999',
        currentStatus: 'IPO',
        description: 'Global search and cloud computing powerhouse.',
      },
    ],

    experienceStats: {
      totalInvestments: 1450,
      activePortfolio: 480,
      followOnInvestments: 620,
      exits: 390,
      yearsOfExperience: '22+ Years in APAC',
      industriesInvested: 18,
    },

    testimonials: [
      {
        id: 'test_1',
        founderName: 'Aarav Sharma',
        founderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        founderRole: 'Founder & CEO',
        startupName: 'Kinetix AI',
        startupLogo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        relationship: 'Series A Lead Investor & Board Observer',
        testimonial: 'Sequoia has been transformative for our institutional scaling. From leading our Series A check to opening doors with global enterprise buyers, their operational speed and founder conviction are unmatched.',
        verified: true,
        xentroStartupId: 'st_1',
      },
      {
        id: 'test_2',
        founderName: 'Rhea Sengupta',
        founderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        founderRole: 'Co-Founder & CTO',
        startupName: 'CloudScale Systems',
        relationship: 'Seed & Series A Backer',
        testimonial: 'When we pivoted our distributed cache infrastructure, our partner spent weekend hours brainstorming engineering architecture with us. They are true partners in the trenches.',
        verified: true,
      },
    ],

    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: true,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
      guidelines: 'We review all qualified pitches that match our core investment stages. Pitch decks with verified traction data are prioritized.',
    },

    content: [
      {
        id: 'post_1',
        type: 'insight',
        title: 'The AI Infrastructure Opportunity in 2026: From Chatbots to Autonomous Agent Workflows',
        excerpt: 'Why vertical agents with domain-specific verified tool access represent the most defensible SaaS wave since cloud migration.',
        publishedAt: '2 days ago',
        readTime: '6 min read',
        tags: ['AI Agents', 'Enterprise SaaS', 'Venture Thesis'],
        metrics: {
          likes: 248,
          comments: 42,
          shares: 31,
        },
      },
      {
        id: 'post_2',
        type: 'advice',
        title: 'What Seed Founders Get Wrong About Gross Margins When Pitching Institutional Series A',
        excerpt: 'Deconstructing cloud compute cost allocations, enterprise support overhead, and how to structure a resilient unit economics bridge.',
        publishedAt: '1 week ago',
        readTime: '4 min read',
        tags: ['Unit Economics', 'Series A Prep', 'Fundraising'],
        metrics: {
          likes: 184,
          comments: 29,
          shares: 19,
        },
      },
    ],

    activities: [
      {
        id: 'act_1',
        actionType: 'investment',
        title: 'Led $12M Series A Round in Kinetix AI',
        description: 'Partnered with Aarav Sharma and the Kinetix engineering team to scale enterprise collaborative AI workflows.',
        timestamp: '3 weeks ago',
        badge: 'New Investment',
      },
      {
        id: 'act_2',
        actionType: 'event',
        title: 'Hosted Closed-Door AI Founders Roundtable',
        description: 'Brought together 25 AI founders and Stanford faculty to discuss neural optimization at scale.',
        timestamp: '1 month ago',
        badge: 'Ecosystem Event',
      },
      {
        id: 'act_3',
        actionType: 'insight',
        title: 'Published APAC SaaS Benchmarks Report 2026',
        description: 'Annual benchmark report surveying 200+ venture-backed software startups across India and SEA.',
        timestamp: '1 month ago',
        badge: 'Research Paper',
      },
    ],
  },

  inv_2: {
    id: 'inv_2',
    name: 'Accel',
    logo: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80',
    investorType: 'Venture Capital',
    currentRole: 'Partner',
    organization: 'Accel India & Global',
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
    },
    website: 'https://accel.com',
    linkedIn: 'https://linkedin.com/company/accel-vc',
    verified: true,
    primaryInvestmentFocus: 'Enterprise SaaS · FinTech · Consumer Platforms',

    bio: 'From the earliest days through every phase of growth, powering trailblazing ventures across developer platforms, enterprise SaaS, and consumer internet.',
    background: 'First-check partners to global category leaders including Slack, Freshworks, Swiggy, and Dropbox. Accel Atoms and early-stage funds back founders from day zero.',
    yearsOfInvestingExperience: '18+ Years in India & Global Markets',

    overview: {
      whoTheyInvestIn: 'Relentless product visionaries building enduring digital architectures with global ambition.',
      sectorsFocus: 'Cloud Infrastructure, Product-Led Growth SaaS, Global Payments, and Consumer Tech.',
      investmentPhilosophy: 'Prepared mind venture investing: we cultivate deep domain thesis years before making investments, enabling rapid and decisive conviction.',
      aimToContribute: 'Pre-seed acceleration programs (Accel Atoms), direct access to global peer founders, and seasoned operational playbooks.',
    },

    investmentFocus: {
      sectors: ['Enterprise SaaS', 'Cloud Infrastructure', 'FinTech', 'Consumer Tech', 'Cybersecurity'],
      stages: ['Seed', 'Series A', 'Series B'],
      geography: {
        countries: ['India', 'United States', 'United Kingdom', 'Singapore'],
        regions: ['India', 'North America', 'Europe'],
        cities: ['Bengaluru', 'London', 'San Francisco'],
      },
      businessModels: ['SaaS', 'B2B', 'B2C', 'Marketplace'],
      ticketSize: {
        min: '$500K',
        max: '$10M',
        formatted: '$500K – $10M',
      },
    },

    valueBeyondCapital: {
      supportAreas: [
        'Strategic Guidance',
        'Hiring & Talent',
        'International Expansion',
        'Technology / Product',
        'Industry Connections',
      ],
      whatIBringToFounders: 'Decades of deep PLG experience and structured operational frameworks refined across hundreds of SaaS market leaders.',
      advisoryCapabilities: [
        'PLG Funnel Optimization',
        'US Market Launch and Go-to-Market Engine',
        'Executive Leadership Coaching',
      ],
    },

    investmentCriteria: {
      evaluationCriteria: [
        'Product Craft and Developer Empathy',
        'Early Velocity and Organic Customer Love',
        'Unit Economics and LTV/CAC Trajectory',
        'Founding Team Integrity and Execution Speed',
      ],
      preferredTraction: ['MVP', 'Early Revenue', 'PMF', 'Growth'],
      diligenceHighlights: [
        'Product usability inspection',
        'Customer satisfaction and Net Promoter Score review',
      ],
    },

    investmentProcess: {
      stages: [
        { stepNumber: 1, title: 'Atoms / Seed Screening', description: 'Evaluation of product prototype and market thesis.' },
        { stepNumber: 2, title: 'Founding Partner Meeting', description: 'Discussion on long-term product vision and distribution.' },
        { stepNumber: 3, title: 'Operational Review', description: 'Customer discovery and technical stack assessment.' },
        { stepNumber: 4, title: 'Term Sheet & Onboarding', description: 'Issuing terms and launching Accel platform support.' },
      ],
      preferredConnectionMethod: 'Platform Connection or Direct Pitch Submission',
      informationRequiredInitially: ['Pitch Deck', 'Product Demo Link', 'Key Growth Metrics'],
      typicalDecisionTimeline: '2 to 3 Weeks',
      pitchDeckRequirements: '10-14 slides covering vision, product differentiation, traction, and team.',
      warmIntroPreferred: false,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [
      {
        id: 'port_accel_1',
        name: 'Freshworks',
        logo: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=150&auto=format&fit=crop&q=80',
        sector: 'Enterprise Customer Experience',
        stageInvested: 'Series A',
        investmentYear: '2011',
        currentStatus: 'IPO',
        description: 'Cloud-based customer engagement software.',
      },
      {
        id: 'port_accel_2',
        name: 'Swiggy',
        logo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=150&auto=format&fit=crop&q=80',
        sector: 'On-Demand Convenience & Hyperlocal Delivery',
        stageInvested: 'Series A',
        investmentYear: '2015',
        currentStatus: 'IPO',
        description: 'Leading food and quick commerce logistics platform.',
      },
      {
        id: 'port_accel_3',
        name: 'Slack',
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        sector: 'Team Collaboration Software',
        stageInvested: 'Series A',
        investmentYear: '2010',
        currentStatus: 'Acquired',
        description: 'Enterprise workplace communication platform.',
      },
    ],

    experienceStats: {
      totalInvestments: 950,
      activePortfolio: 320,
      followOnInvestments: 410,
      exits: 260,
      yearsOfExperience: '18+ Years in India',
      industriesInvested: 14,
    },

    testimonials: [
      {
        id: 'test_accel_1',
        founderName: 'Girish Mathrubootham',
        founderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        founderRole: 'Founder',
        startupName: 'Freshworks',
        relationship: 'Series A to IPO Lead Partner',
        testimonial: 'Accel stood by us through every turning point. Their belief in our product-led motion from Chennai to Nasdaq was steadfast.',
        verified: true,
      },
    ],

    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: false,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
      guidelines: 'We welcome inbound applications from early-stage builders. Product demos and clear metrics are appreciated.',
    },

    content: [
      {
        id: 'post_accel_1',
        type: 'article',
        title: 'Building from India for the World: The Playbook for Crossing $10M ARR',
        excerpt: 'Core lessons on building global inside-sales motions from India into the US and European enterprise mid-markets.',
        publishedAt: '5 days ago',
        readTime: '7 min read',
        tags: ['Global SaaS', 'GTM Playbook', 'Inside Sales'],
        metrics: { likes: 312, comments: 55, shares: 48 },
      },
    ],

    activities: [
      {
        id: 'act_accel_1',
        actionType: 'event',
        title: 'Accel Atoms Cohort 5 Launch',
        description: 'Announced investments into 14 pre-seed startups across AI and ClimateTech.',
        timestamp: '2 weeks ago',
        badge: 'Program Launch',
      },
    ],
  },

  inv_3: {
    id: 'inv_3',
    name: 'Nexus Venture Partners',
    logo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&auto=format&fit=crop&q=80',
    investorType: 'Venture Capital',
    currentRole: 'Managing Director',
    organization: 'Nexus Venture Partners',
    location: {
      city: 'Silicon Valley & Mumbai',
      country: 'USA & India',
    },
    website: 'https://nexusvp.com',
    linkedIn: 'https://linkedin.com/company/nexus-venture-partners',
    verified: true,
    primaryInvestmentFocus: 'Developer Infrastructure · Open Source · Enterprise AI',

    bio: 'Pioneering Indo-US venture investments in developer tooling, infrastructure, and enterprise data platforms.',
    background: 'Nexus has backed game-changing open-source and developer-first companies from inception, including Postman, Hasura, Apollo.io, and MinIO.',
    yearsOfInvestingExperience: '19+ Years in Cross-Border VC',

    overview: {
      whoTheyInvestIn: 'Deep technologists building open source, infrastructure tools, and API-first platforms.',
      sectorsFocus: 'Open Source Software, Data Engineering, AI Toolchains, Cloud Infrastructure.',
      investmentPhilosophy: 'We believe developer love and technical excellence are the strongest moats in modern software.',
      aimToContribute: 'Deep cross-border bridge between India engineering talent and US enterprise commercialization.',
    },

    investmentFocus: {
      sectors: ['AI Infrastructure', 'Open Source', 'B2B SaaS', 'Developer Tools', 'Data Systems'],
      stages: ['Seed', 'Series A'],
      geography: {
        countries: ['United States', 'India'],
        regions: ['North America', 'South Asia'],
        cities: ['San Francisco', 'Bengaluru', 'Mumbai'],
      },
      businessModels: ['SaaS', 'B2B', 'DeepTech'],
      ticketSize: {
        min: '$1M',
        max: '$8M',
        formatted: '$1M – $8M',
      },
    },

    valueBeyondCapital: {
      supportAreas: ['Strategic Guidance', 'Industry Connections', 'International Expansion', 'Technology / Product'],
      whatIBringToFounders: 'Unmatched domain expertise in open-source monetization, community building, and cross-border US sales.',
    },

    investmentCriteria: {
      evaluationCriteria: ['Developer Community Traction & GitHub Stars', 'Technical Architecture Defensibility', 'Cross-Border Execution Team'],
      preferredTraction: ['MVP', 'Early Revenue', 'PMF'],
      diligenceHighlights: ['Open source repository commit activity and developer sentiment audits.'],
    },

    investmentProcess: {
      stages: [
        { stepNumber: 1, title: 'Technical Review', description: 'Review of open source repo, API architecture, and documentation.' },
        { stepNumber: 2, title: 'Founder Technical Session', description: 'Engineering-led session with Nexus technical partners.' },
        { stepNumber: 3, title: 'Term Sheet & US Entity Bridge', description: 'Structuring Delaware C-corp and closing institutional check.' },
      ],
      preferredConnectionMethod: 'Platform Connection Request or Technical Referral',
      informationRequiredInitially: ['GitHub / Repo Links', 'Pitch Deck', 'Community Metrics'],
      typicalDecisionTimeline: '2 Weeks',
      pitchDeckRequirements: 'Architecture diagrams, developer adoption curves, and enterprise monetization roadmap.',
      warmIntroPreferred: true,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [
      {
        id: 'port_nexus_1',
        name: 'Postman',
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        sector: 'API Platform',
        stageInvested: 'Seed',
        investmentYear: '2015',
        currentStatus: 'Scaled',
        description: 'World leading platform for API development and collaboration.',
      },
      {
        id: 'port_nexus_2',
        name: 'Hasura',
        logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&auto=format&fit=crop&q=80',
        sector: 'GraphQL & Data Access',
        stageInvested: 'Seed',
        investmentYear: '2018',
        currentStatus: 'Scaled',
        description: 'Instant GraphQL API engine on existing databases.',
      },
    ],

    experienceStats: {
      totalInvestments: 210,
      activePortfolio: 78,
      followOnInvestments: 95,
      exits: 62,
      yearsOfExperience: '19+ Years',
      industriesInvested: 8,
    },

    testimonials: [
      {
        id: 'test_nexus_1',
        founderName: 'Abhinav Asthana',
        founderAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        founderRole: 'Founder & CEO',
        startupName: 'Postman',
        relationship: 'First Institutional Seed Investor',
        testimonial: 'Nexus understood developer empathy before anyone else in the venture ecosystem. Their conviction in our API platform thesis made all the difference.',
        verified: true,
      },
    ],

    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: true,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
    },

    content: [
      {
        id: 'post_nexus_1',
        type: 'insight',
        title: 'Open Source Monetization in the GenAI Era: How APIs Became the New Moat',
        excerpt: 'Why enterprise buyers are paying for governance, security, and low-latency API guarantees around open source foundations.',
        publishedAt: '1 week ago',
        readTime: '5 min read',
        tags: ['Open Source', 'APIs', 'Developer Platforms'],
        metrics: { likes: 195, comments: 24, shares: 18 },
      },
    ],

    activities: [
      {
        id: 'act_nexus_1',
        actionType: 'insight',
        title: 'Hosted DevTools Founder Summit',
        description: 'Gathered 40 developer-tool founders in San Francisco for peer discussions.',
        timestamp: '2 weeks ago',
        badge: 'Summit',
      },
    ],
  },

  inv_4: {
    id: 'inv_4',
    name: 'Elevation Capital',
    logo: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=1600&auto=format&fit=crop&q=80',
    investorType: 'Venture Capital',
    currentRole: 'Partner',
    organization: 'Elevation Capital',
    location: {
      city: 'Gurugram',
      state: 'Haryana',
      country: 'India',
    },
    website: 'https://elevationcapital.com',
    linkedIn: 'https://linkedin.com/company/elevation-cap',
    verified: true,
    primaryInvestmentFocus: 'FinTech · Consumer Tech · Enterprise SaaS',

    bio: 'First-check partners to game-changing tech founders building category-defining platforms in India.',
    background: 'Early investors in category creators such as Paytm, MakeMyTrip, Meesho, Urban Company, and ShareChat.',
    yearsOfInvestingExperience: '20+ Years',

    overview: {
      whoTheyInvestIn: 'High-conviction founders with breakthrough consumer or enterprise distribution models.',
      sectorsFocus: 'FinTech, Digital Consumer, Social Commerce, Vertical SaaS.',
      investmentPhilosophy: 'First-check conviction with generational patience.',
      aimToContribute: 'Strategic guidance on mass Indian consumer behavior and rapid product scaling.',
    },

    investmentFocus: {
      sectors: ['FinTech', 'Consumer Tech', 'Enterprise SaaS', 'EdTech'],
      stages: ['Pre-Seed', 'Seed', 'Series A'],
      geography: {
        countries: ['India'],
        regions: ['India'],
        cities: ['Bengaluru', 'Delhi NCR', 'Mumbai'],
      },
      businessModels: ['B2C', 'B2B', 'Marketplace', 'SaaS'],
      ticketSize: {
        min: '$750K',
        max: '$5M',
        formatted: '$750K – $5M',
      },
    },

    valueBeyondCapital: {
      supportAreas: ['Strategic Guidance', 'Fundraising Support', 'Marketing & Branding', 'Mentorship'],
      whatIBringToFounders: 'Pioneering consumer product insight and proven fundraising syndication for Series B and beyond.',
    },

    investmentCriteria: {
      evaluationCriteria: ['Consumer Viral Loops / Distribution Edge', 'Founding Team Hunger & Insight', 'Large Domestic TAM'],
      preferredTraction: ['MVP', 'Early Revenue', 'PMF'],
      diligenceHighlights: ['Retention cohort curves and customer acquisition cost stability.'],
    },

    investmentProcess: {
      stages: [
        { stepNumber: 1, title: 'Screening', description: 'Reviewing pitch and initial metrics.' },
        { stepNumber: 2, title: 'Partner Discussion', description: 'Product walk-through and market exploration.' },
        { stepNumber: 3, title: 'Customer Feedback', description: 'Direct customer interviews.' },
        { stepNumber: 4, title: 'Term Sheet', description: 'Fast closing and syndication setup.' },
      ],
      preferredConnectionMethod: 'Platform Connection or Warm Introduction',
      informationRequiredInitially: ['Pitch Deck', 'Cohort Metrics', 'Cap Table'],
      typicalDecisionTimeline: '2 to 3 Weeks',
      pitchDeckRequirements: 'Strong focus on unit economics and retention.',
      warmIntroPreferred: true,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [
      {
        id: 'port_elev_1',
        name: 'Meesho',
        logo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=150&auto=format&fit=crop&q=80',
        sector: 'Social Commerce & Retail',
        stageInvested: 'Series A',
        investmentYear: '2016',
        currentStatus: 'Scaled',
        description: 'Democratizing e-commerce for millions of small businesses across India.',
      },
      {
        id: 'port_elev_2',
        name: 'Urban Company',
        logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&auto=format&fit=crop&q=80',
        sector: 'Home Services Marketplace',
        stageInvested: 'Seed',
        investmentYear: '2015',
        currentStatus: 'Scaled',
        description: 'Leading home and beauty services marketplace.',
      },
    ],

    experienceStats: {
      totalInvestments: 160,
      activePortfolio: 65,
      followOnInvestments: 80,
      exits: 45,
      yearsOfExperience: '20+ Years',
      industriesInvested: 6,
    },

    testimonials: [],

    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: true,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
    },

    content: [],
    activities: [],
  },

  inv_5: {
    id: 'inv_5',
    name: 'Lightspeed India',
    logo: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1600&auto=format&fit=crop&q=80',
    investorType: 'Venture Capital',
    currentRole: 'Partner',
    organization: 'Lightspeed India Partners',
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
    },
    website: 'https://lsip.com',
    linkedIn: 'https://linkedin.com/company/lightspeed-india',
    verified: true,
    primaryInvestmentFocus: 'GenAI · Cybersecurity · B2B Commerce',

    bio: 'Investing in disruptors transforming commerce, enterprise infrastructure, and digital health.',
    background: 'Backing transformational companies including Oyo, Udaan, Innovaccer, Snorkel AI, and Yellow.ai.',
    yearsOfInvestingExperience: '16+ Years',

    overview: {
      whoTheyInvestIn: 'Visionaries operating at the inflection points of enterprise software and commerce.',
      sectorsFocus: 'Enterprise GenAI, Cybersecurity, Industrial B2B, and Cloud Platforms.',
      investmentPhilosophy: 'Bold investments at critical inflections backed by our global network.',
      aimToContribute: 'Enterprise sales acceleration and access to global Fortune 100 CIOs.',
    },

    investmentFocus: {
      sectors: ['GenAI', 'Cybersecurity', 'B2B Commerce', 'HealthTech'],
      stages: ['Seed', 'Series A', 'Growth'],
      geography: {
        countries: ['India', 'United States', 'Southeast Asia'],
        regions: ['APAC', 'Americas'],
        cities: ['Bengaluru', 'Delhi', 'San Francisco'],
      },
      businessModels: ['B2B', 'SaaS', 'Marketplace'],
      ticketSize: {
        min: '$1M',
        max: '$12M',
        formatted: '$1M – $12M',
      },
    },

    valueBeyondCapital: {
      supportAreas: ['Strategic Guidance', 'Customer Introductions', 'Hiring & Talent', 'International Expansion'],
      whatIBringToFounders: 'A global partnership connecting Indian tech entrepreneurs directly to US enterprise enterprise buyers.',
    },

    investmentCriteria: {
      evaluationCriteria: ['Enterprise Product Defensibility', 'Sales Velocity', 'Global Scalability'],
      preferredTraction: ['MVP', 'Early Revenue', 'PMF', 'Growth'],
      diligenceHighlights: ['CIO reference calls and enterprise security compliance.'],
    },

    investmentProcess: {
      stages: [
        { stepNumber: 1, title: 'First Conversation', description: 'Meeting with investment team.' },
        { stepNumber: 2, title: 'Technical & Commercial Diligence', description: 'Review of software stack and pilots.' },
        { stepNumber: 3, title: 'Partnership Decision', description: 'Presentation and term sheet.' },
      ],
      preferredConnectionMethod: 'Platform Connection Request',
      informationRequiredInitially: ['Pitch Deck', 'Product Architecture Overview'],
      typicalDecisionTimeline: '3 Weeks',
      pitchDeckRequirements: 'Executive summary with market sizing and enterprise traction.',
      warmIntroPreferred: false,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [
      {
        id: 'port_ls_1',
        name: 'Innovaccer',
        logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        sector: 'HealthTech & Data Activation',
        stageInvested: 'Series A',
        investmentYear: '2016',
        currentStatus: 'Scaled',
        description: 'Healthcare cloud data platform.',
      },
    ],

    experienceStats: {
      totalInvestments: 190,
      activePortfolio: 75,
      followOnInvestments: 85,
      exits: 38,
      yearsOfExperience: '16+ Years',
      industriesInvested: 9,
    },

    testimonials: [],

    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: false,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
    },

    content: [],
    activities: [],
  },

  inv_6: {
    id: 'inv_6',
    name: 'Blossom Angel Syndicate',
    logo: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&auto=format&fit=crop&q=80',
    investorType: 'Angel Network',
    currentRole: 'Lead Syndicate Partner',
    organization: 'Blossom Angel Syndicate',
    location: {
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
    },
    website: 'https://blossomangels.org',
    linkedIn: 'https://linkedin.com/company/blossom-angel-syndicate',
    verified: true,
    primaryInvestmentFocus: 'ClimateTech · HealthTech · DeepTech',

    bio: 'Founder-led angel syndicate offering hands-on technical architecture, initial proof-of-concept pilots, and catalytic seed capital.',
    background: 'Comprising 45 active serial tech entrepreneurs, scientists, and senior tech executives committed to funding deep technology innovations.',
    yearsOfInvestingExperience: '8+ Years in Angel Syndication',

    overview: {
      whoTheyInvestIn: 'Technical founders and deeptech researchers commercializing breakthrough science and engineering.',
      sectorsFocus: 'ClimateTech, Battery Energy Storage, Health Diagnostics, Computer Vision & Robotics.',
      investmentPhilosophy: 'We believe angels should be builders who roll up their sleeves and help secure first pilots.',
      aimToContribute: 'Immediate industrial POC contracts, factory visits, lab testing facilities, and technical co-founders matching.',
    },

    investmentFocus: {
      sectors: ['ClimateTech', 'HealthTech', 'DeepTech', 'Robotics', 'Clean Energy'],
      stages: ['Idea', 'Pre-Seed', 'Seed'],
      geography: {
        countries: ['India', 'Singapore'],
        regions: ['South Asia', 'Southeast Asia'],
        cities: ['Hyderabad', 'Bengaluru', 'Singapore'],
      },
      businessModels: ['DeepTech', 'Hardware', 'B2B'],
      ticketSize: {
        min: '$100K',
        max: '$500K',
        formatted: '$100K – $500K',
      },
    },

    valueBeyondCapital: {
      supportAreas: ['Strategic Guidance', 'Industry Connections', 'Customer Introductions', 'Technology / Product', 'Mentorship'],
      whatIBringToFounders: 'Direct connections with manufacturing consortiums, lab facilities, and clinical pilot partners across India.',
      advisoryCapabilities: [
        'Hardware Supply Chain Setup',
        'Clinical Trial Partner Introductions',
        'Patent & IP Filing Strategy',
      ],
    },

    investmentCriteria: {
      evaluationCriteria: [
        'Technical Defensibility & Novel IP',
        'Founder Technical Rigor & Scientific Pedigree',
        'Measurable Climate or Health Impact',
      ],
      preferredTraction: ['Idea', 'MVP', 'Early Revenue'],
      diligenceHighlights: ['Lab validation and intellectual property audit.'],
    },

    investmentProcess: {
      stages: [
        { stepNumber: 1, title: 'Inbound Pitch Submission', description: 'Pitch deck review by domain syndicate leads.' },
        { stepNumber: 2, title: 'Founder Technical Demo', description: 'Demonstration of prototype, lab setup, or hardware MVP.' },
        { stepNumber: 3, title: 'Syndicate Allocation', description: 'Syndicate members confirm allocations within 10 days.' },
      ],
      preferredConnectionMethod: 'Platform Connection or Open Direct Pitch',
      informationRequiredInitially: ['Pitch Deck', 'Technical Whitepaper / Patent Summary'],
      typicalDecisionTimeline: '10 to 14 Days',
      pitchDeckRequirements: 'Technical diagrams, IP status, and problem-solution fit.',
      warmIntroPreferred: false,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [
      {
        id: 'port_blossom_1',
        name: 'CleanVolt Storage',
        logo: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=150&auto=format&fit=crop&q=80',
        sector: 'Next-Gen Solid State Battery',
        stageInvested: 'Seed',
        investmentYear: '2024',
        currentStatus: 'Active',
        xentroStartupId: 'st_3',
        description: 'High-density solid-state batteries for industrial energy storage.',
      },
      {
        id: 'port_blossom_2',
        name: 'NeuroScale Health',
        logo: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&auto=format&fit=crop&q=80',
        sector: 'AI Clinical Diagnostics',
        stageInvested: 'Pre-Seed',
        investmentYear: '2024',
        currentStatus: 'Active',
        xentroStartupId: 'st_2',
        description: 'Multi-modal AI imaging diagnostics for early neurodegenerative detection.',
      },
      {
        id: 'port_blossom_3',
        name: 'AeroDrone Labs',
        logo: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=150&auto=format&fit=crop&q=80',
        sector: 'Drone & Geospatial AI',
        stageInvested: 'Seed',
        investmentYear: '2025',
        currentStatus: 'Active',
        xentroStartupId: 'st_10',
        description: 'Autonomous GPS-denied inspection drones for utility grids.',
      },
    ],

    experienceStats: {
      totalInvestments: 42,
      activePortfolio: 35,
      followOnInvestments: 22,
      exits: 6,
      yearsOfExperience: '8+ Years',
      industriesInvested: 4,
    },

    testimonials: [
      {
        id: 'test_blossom_1',
        founderName: 'Dr. Alok Nath',
        founderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        founderRole: 'Founder & CEO',
        startupName: 'CleanVolt Storage',
        startupLogo: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=150&auto=format&fit=crop&q=80',
        relationship: 'Lead Angel Syndicate & Strategic Board Member',
        testimonial: 'Blossom Angel Syndicate brought invaluable direct industrial pilot opportunities with green energy consortiums. Their technical diligence made our Series A readiness a reality.',
        verified: true,
        xentroStartupId: 'st_3',
      },
    ],

    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: false,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
      guidelines: 'We love talking to scientists and deeptech engineers at the idea/prototype stage. Send us your research summary!',
    },

    content: [
      {
        id: 'post_blossom_1',
        type: 'advice',
        title: 'How DeepTech Founders Should Navigate Grant Funding vs Dilutive Angel Checks',
        excerpt: 'Structuring non-dilutive government R&D grants alongside early founder-friendly syndicates.',
        publishedAt: '3 days ago',
        readTime: '4 min read',
        tags: ['DeepTech', 'Grants', 'Angel Investing'],
        metrics: { likes: 142, comments: 18, shares: 12 },
      },
    ],

    activities: [
      {
        id: 'act_blossom_1',
        actionType: 'investment',
        title: 'Syndicated $400K Seed Check in AeroDrone Labs',
        description: 'Completed syndicate participation for autonomous drone infrastructure inspections.',
        timestamp: '1 week ago',
        badge: 'New Syndicate Check',
      },
    ],
  },

  inv_7: {
    id: 'inv_7',
    name: 'Peak XV Partners',
    logo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&auto=format&fit=crop&q=80',
    investorType: 'Venture Capital',
    currentRole: 'Managing Director',
    organization: 'Peak XV Partners',
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
    },
    website: 'https://peakxv.com',
    linkedIn: 'https://linkedin.com/company/peak-xv-partners',
    verified: true,
    primaryInvestmentFocus: 'SaaS · AI Platforms · Consumer Tech',

    bio: 'Empowering ambitious founders with catalytic capital, operational scale advisory, and founder programs like Surge.',
    background: 'Backed iconic companies including Zomato, CRED, Pine Labs, Mamaearth, and Unacademy across 17+ years.',
    yearsOfInvestingExperience: '17+ Years in India & APAC',

    overview: {
      whoTheyInvestIn: 'Fearless founders striving to build generational enduring businesses.',
      sectorsFocus: 'Enterprise Software, AI-Native Applications, Consumer Internet, FinTech.',
      investmentPhilosophy: 'Partnership that endures through cycles, providing scale-up playbooks from Day 1.',
      aimToContribute: 'The Surge seed community, deep functional hiring experts, and institutional growth capital.',
    },

    investmentFocus: {
      sectors: ['SaaS', 'AI Platforms', 'Consumer Tech', 'FinTech'],
      stages: ['Seed', 'Series A', 'Growth'],
      geography: {
        countries: ['India', 'Singapore', 'United States'],
        regions: ['APAC', 'Americas'],
        cities: ['Bengaluru', 'Singapore', 'San Francisco'],
      },
      businessModels: ['B2B', 'B2C', 'SaaS', 'Marketplace'],
      ticketSize: {
        min: '$1M',
        max: '$20M',
        formatted: '$1M – $20M',
      },
    },

    valueBeyondCapital: {
      supportAreas: ['Strategic Guidance', 'Hiring & Talent', 'International Expansion', 'Fundraising Support', 'Marketing & Branding'],
      whatIBringToFounders: 'Surge founder cohorts, bespoke design sprints, and a dedicated team of marketing and talent leaders.',
    },

    investmentCriteria: {
      evaluationCriteria: ['Exceptional Founder Energy & Vision', 'Scalable Distribution', 'Huge Market Tailwinds'],
      preferredTraction: ['MVP', 'Early Revenue', 'PMF', 'Growth'],
      diligenceHighlights: ['Customer references and unit economics.'],
    },

    investmentProcess: {
      stages: [
        { stepNumber: 1, title: 'Surge / Early Review', description: 'Application evaluation.' },
        { stepNumber: 2, title: 'Partner Conversations', description: 'Focus on vision, mission, and moat.' },
        { stepNumber: 3, title: 'Partnership Decision', description: 'Term sheet and Surge onboarding.' },
      ],
      preferredConnectionMethod: 'Platform Connection Request',
      informationRequiredInitially: ['Pitch Deck', 'Product Demo'],
      typicalDecisionTimeline: '2 to 3 Weeks',
      pitchDeckRequirements: 'Clean presentation of team, problem, product, and traction.',
      warmIntroPreferred: true,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [
      {
        id: 'port_peak_1',
        name: 'Zomato',
        logo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=150&auto=format&fit=crop&q=80',
        sector: 'Food Delivery & Quick Commerce',
        stageInvested: 'Series A',
        investmentYear: '2013',
        currentStatus: 'IPO',
        description: 'Leading food delivery and quick commerce network in India.',
      },
    ],

    experienceStats: {
      totalInvestments: 400,
      activePortfolio: 180,
      followOnInvestments: 220,
      exits: 110,
      yearsOfExperience: '17+ Years',
      industriesInvested: 12,
    },

    testimonials: [],

    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: true,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
    },

    content: [],
    activities: [],
  },

  inv_8: {
    id: 'inv_8',
    name: 'Kalaari Capital',
    logo: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80',
    investorType: 'Venture Capital',
    currentRole: 'Managing Director',
    organization: 'Kalaari Capital',
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
    },
    website: 'https://kalaari.com',
    linkedIn: 'https://linkedin.com/company/kalaari-capital',
    verified: true,
    primaryInvestmentFocus: 'DeepTech · Gaming · Enterprise Tech',

    bio: 'Early-stage venture capital firm investing in technology-minded entrepreneurs across India.',
    background: 'Early champions of Dream11, Cure.fit, Snapdeal, and Vyapar.',
    yearsOfInvestingExperience: '15+ Years',

    overview: {
      whoTheyInvestIn: 'First-time and repeat founders pioneering technical disruption in emerging categories.',
      sectorsFocus: 'Interactive Media, Gaming, DeepTech, Cloud Solutions.',
      investmentPhilosophy: 'Building durable companies requires grounded empathy and long-term commitment.',
      aimToContribute: 'Hands-on operational support, product feedback, and talent sourcing.',
    },

    investmentFocus: {
      sectors: ['DeepTech', 'Gaming', 'Enterprise Tech', 'Consumer Tech'],
      stages: ['Pre-Seed', 'Seed', 'Series A'],
      geography: {
        countries: ['India'],
        regions: ['South Asia'],
        cities: ['Bengaluru', 'Mumbai'],
      },
      businessModels: ['B2B', 'B2C', 'Marketplace'],
      ticketSize: {
        min: '$500K',
        max: '$5M',
        formatted: '$500K – $5M',
      },
    },

    valueBeyondCapital: {
      supportAreas: ['Strategic Guidance', 'Mentorship', 'Marketing & Branding'],
      whatIBringToFounders: 'Vani Kola and the Kalaari team provide seasoned founder mentorship and board room guidance.',
    },

    investmentCriteria: {
      evaluationCriteria: ['Visionary Founders', 'Differentiated Technology Moat', 'Clear Path to Monetization'],
      preferredTraction: ['Idea', 'MVP', 'Early Revenue'],
      diligenceHighlights: ['Founder references and unit economics model.'],
    },

    investmentProcess: {
      stages: [
        { stepNumber: 1, title: 'Screening Call', description: 'Initial team meet.' },
        { stepNumber: 2, title: 'Partner Discussion', description: 'Strategy and market review.' },
        { stepNumber: 3, title: 'Closing', description: 'Term sheet and syndication.' },
      ],
      preferredConnectionMethod: 'Platform Connection Request',
      informationRequiredInitially: ['Pitch Deck', 'Product Demo'],
      typicalDecisionTimeline: '2 to 3 Weeks',
      pitchDeckRequirements: 'Focus on market problem, product solution, and team capability.',
      warmIntroPreferred: false,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [
      {
        id: 'port_kal_1',
        name: 'Dream11',
        logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
        sector: 'Interactive Sports Tech & Gaming',
        stageInvested: 'Series A',
        investmentYear: '2014',
        currentStatus: 'Scaled',
        description: 'Sports tech unicorn powering gaming and fan engagement.',
      },
    ],

    experienceStats: {
      totalInvestments: 120,
      activePortfolio: 45,
      followOnInvestments: 60,
      exits: 32,
      yearsOfExperience: '15+ Years',
      industriesInvested: 6,
    },

    testimonials: [],

    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: false,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
    },

    content: [],
    activities: [],
  },

  inv_9: {
    id: 'inv_9',
    name: 'Titan Capital',
    logo: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1554469384-e58fac16e23a?w=1600&auto=format&fit=crop&q=80',
    investorType: 'Angel Network',
    currentRole: 'Founding Partner',
    organization: 'Titan Capital',
    location: {
      city: 'Gurugram',
      state: 'Haryana',
      country: 'India',
    },
    website: 'https://titancapital.vc',
    linkedIn: 'https://linkedin.com/company/titan-capital-vc',
    verified: true,
    primaryInvestmentFocus: 'B2B SaaS · Consumer Internet · FinTech',

    bio: 'High-conviction angel investment fund backed by iconic founders Kunal Bahl and Rohit Bansal.',
    background: 'Backing 250+ startups from day zero, including Ola, Razorpay, Mamaearth, Shadowfax, and Urban Company.',
    yearsOfInvestingExperience: '12+ Years in Angel & Seed Venture',

    overview: {
      whoTheyInvestIn: 'Relentless founders with extreme perseverance and high integrity.',
      sectorsFocus: 'B2B Software, Direct-to-Consumer, Logistics, FinTech.',
      investmentPhilosophy: 'We invest as operators who understand how lonely and demanding the founder journey is.',
      aimToContribute: 'Quick decision-making, fast wire transfers, and unvarnished tactical founder advice.',
    },

    investmentFocus: {
      sectors: ['B2B SaaS', 'Consumer Internet', 'FinTech', 'Logistics'],
      stages: ['Pre-Seed', 'Seed'],
      geography: {
        countries: ['India'],
        regions: ['India'],
        cities: ['Delhi NCR', 'Bengaluru', 'Mumbai'],
      },
      businessModels: ['B2B', 'B2C', 'D2C', 'SaaS'],
      ticketSize: {
        min: '$150K',
        max: '$1.5M',
        formatted: '$150K – $1.5M',
      },
    },

    valueBeyondCapital: {
      supportAreas: ['Strategic Guidance', 'Industry Connections', 'Mentorship', 'Fundraising Support'],
      whatIBringToFounders: 'Direct access to Kunal and Rohit for strategy brainstorms and crisis resolution.',
    },

    investmentCriteria: {
      evaluationCriteria: ['Founder Grit & Authenticity', 'Fast Customer Feedback Loops', 'Clean Governance'],
      preferredTraction: ['Idea', 'MVP', 'Early Revenue'],
      diligenceHighlights: ['Founder interview and reference check.'],
    },

    investmentProcess: {
      stages: [
        { stepNumber: 1, title: 'Direct Founder Chat', description: '30-minute quick chat with the investment partners.' },
        { stepNumber: 2, title: 'Decision & Term Sheet', description: 'Fast decision within 5-7 days.' },
      ],
      preferredConnectionMethod: 'Platform Connection or Open Direct Pitch',
      informationRequiredInitially: ['Pitch Deck', 'Team Background'],
      typicalDecisionTimeline: '5 to 7 Days',
      pitchDeckRequirements: 'Concise summary of team and customer validation.',
      warmIntroPreferred: false,
      unsolicitedPitchesAccepted: true,
    },

    portfolio: [
      {
        id: 'port_titan_1',
        name: 'Razorpay',
        logo: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150&auto=format&fit=crop&q=80',
        sector: 'Payments & Banking API',
        stageInvested: 'Seed',
        investmentYear: '2014',
        currentStatus: 'Scaled',
        description: 'Leading digital payments and neobanking infrastructure for Indian businesses.',
      },
      {
        id: 'port_titan_2',
        name: 'Mamaearth',
        logo: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=150&auto=format&fit=crop&q=80',
        sector: 'Direct-to-Consumer Personal Care',
        stageInvested: 'Seed',
        investmentYear: '2017',
        currentStatus: 'IPO',
        description: 'Toxin-free consumer care brand.',
      },
    ],

    experienceStats: {
      totalInvestments: 280,
      activePortfolio: 140,
      followOnInvestments: 110,
      exits: 45,
      yearsOfExperience: '12+ Years',
      industriesInvested: 10,
    },

    testimonials: [],

    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: false,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
    },

    content: [],
    activities: [],
  },
};

/**
 * Helper to fetch a FullInvestorProfile by ID.
 * Returns the investor profile or generates a fallback profile if ID is not in map.
 */
export function getInvestorProfileById(id: string): FullInvestorProfile {
  if (investorProfilesMap[id]) {
    return investorProfilesMap[id];
  }

  // Safe fallback profile
  return {
    id: id || 'inv_fallback',
    name: 'Venture Capital Partner',
    logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80',
    banner: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&auto=format&fit=crop&q=80',
    investorType: 'Venture Capital',
    currentRole: 'General Partner',
    organization: 'Growth Ventures',
    location: {
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
    },
    verified: true,
    primaryInvestmentFocus: 'Enterprise Software · AI',
    bio: 'Partnering with high-growth technology founders building enduring category leaders.',
    background: 'Early-stage venture capital fund focusing on seed and Series A tech startups.',
    yearsOfInvestingExperience: '10+ Years',
    overview: {
      whoTheyInvestIn: 'Ambitious founders addressing large global software markets.',
      sectorsFocus: 'Enterprise SaaS, Cloud, AI.',
      investmentPhilosophy: 'First check partner with founder-first focus.',
      aimToContribute: 'Operational support, talent recruitment, and syndicate access.',
    },
    investmentFocus: {
      sectors: ['Enterprise SaaS', 'AI', 'Cloud'],
      stages: ['Seed', 'Series A'],
      geography: {
        countries: ['India', 'USA'],
        regions: ['APAC'],
      },
      businessModels: ['B2B', 'SaaS'],
      ticketSize: {
        min: '$500K',
        max: '$5M',
        formatted: '$500K – $5M',
      },
    },
    valueBeyondCapital: {
      supportAreas: ['Strategic Guidance', 'Industry Connections', 'Hiring & Talent'],
      whatIBringToFounders: 'Committed operational guidance and enterprise customer introductions.',
    },
    investmentCriteria: {
      evaluationCriteria: ['Team Capability', 'Market Size', 'Product Moat'],
      preferredTraction: ['MVP', 'Early Revenue', 'PMF'],
      diligenceHighlights: ['Customer review and financial model audit.'],
    },
    investmentProcess: {
      stages: [
        { stepNumber: 1, title: 'Screening', description: 'Pitch review.' },
        { stepNumber: 2, title: 'Partner Call', description: 'Team discussion.' },
        { stepNumber: 3, title: 'Term Sheet', description: 'Investment terms.' },
      ],
      preferredConnectionMethod: 'Platform Connection Request',
      informationRequiredInitially: ['Pitch Deck', 'Traction Metrics'],
      typicalDecisionTimeline: '2 to 3 Weeks',
      pitchDeckRequirements: '12-slide presentation.',
      warmIntroPreferred: false,
      unsolicitedPitchesAccepted: true,
    },
    portfolio: [],
    experienceStats: {
      totalInvestments: 25,
      activePortfolio: 18,
      followOnInvestments: 12,
      exits: 4,
      yearsOfExperience: '10+ Years',
      industriesInvested: 5,
    },
    testimonials: [],
    connectionPreferences: {
      openToConnectionRequests: true,
      openToStartupPitches: true,
      introductionPreferred: false,
      currentlyInvesting: true,
      notAcceptingNewPitches: false,
    },
    content: [],
    activities: [],
  };
}
