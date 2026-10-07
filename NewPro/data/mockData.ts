import { User, Post, Recommendation, Conversation } from '@/types';

export const currentUser: User = {
  id: 'XU-765776',
  name: 'Neeraj Nani',
  username: 'neerajnani64',
  role: 'Principal Tech Architect & Angel Advisor',
  company: 'Xentro Mentorship Network',
  avatar: '/xentro-logo.png',
  verified: true,
  status: 'Open for 1-on-1 architecture & scaling mentorship',
};

export const initialPosts: Post[] = [];

export const mockRecommendations: Recommendation[] = [];

export const mockConversations: Conversation[] = [];

export const mentorProfileData = {
  id: 'MEN-634213',
  name: 'Neeraj Nani',
  tagline: 'Principal Tech Architect & Angel Advisor',
  rating: 5.0,
  reviewsCount: 12,
  completedSessions: 48,
  activeMentees: 6,
  hourlyRate: 5000,
  currency: 'INR',
  avatar: '/xentro-logo.png',
  banner: '',
  location: 'Bengaluru, India',
  verified: true,
  bio: 'Principal Tech Architect and active angel advisor. Mentoring high-velocity technical founders across enterprise systems and scaling.',
  expertise: [
    'Scaling Infrastructure',
    'Fundraising & Pitching',
    'Product-Market Fit',
    'Engineering Leadership',
  ],
  packages: [
    {
      id: 'pkg_1',
      title: '1-on-1 Advisory Session',
      duration: '45 mins',
      price: 5000,
      description: 'Deep dive into system architecture, tech moats, and diligence prep.',
    },
  ],
  milestones: [
    {
      id: 'm1',
      name: 'Xentro Technologies',
      sector: 'Enterprise SaaS & Venture Platform',
      stage: 'Seed Stage',
      milestone: 'Platform architecture established with MongoDB Atlas & Zoho integrations',
      avatar: '/xentro-logo.png',
      growth: 'Active Mentee',
    },
  ],
  experience: [
    {
      role: 'Principal Tech Architect & Angel Advisor',
      org: 'Xentro Ecosystem',
      period: '2023 — Present',
      description: 'Advising early-stage founders on high-concurrency systems, security, and institutional diligence.',
    },
  ],
  education: [
    {
      degree: 'B.Tech / M.Tech in Computer Science',
      institution: 'Premier Institute of Technology',
      year: '2016',
    },
  ],
  reviews: [
    {
      id: 'r1',
      author: 'Xentro Founder',
      role: 'Founder & CEO',
      startup: 'Xentro Technologies',
      rating: 5,
      date: 'Today',
      comment: 'Neeraj provided exceptional advisory on our multi-tenant database design and technical diligence.',
      avatar: '/xentro-logo.png',
    },
  ],
};
