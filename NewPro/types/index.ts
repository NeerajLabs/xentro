export interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  company?: string;
  avatar: string;
  verified?: boolean;
  status?: string;
}

export interface PostComment {
  id: string;
  author: User;
  content: string;
  timestamp: string;
  likes: number;
  isLiked?: boolean;
}

export interface Post {
  id: string;
  author: User;
  timestamp: string;
  category: 'all' | 'following' | 'opportunities' | 'mentors' | 'investors' | 'startup' | 'esp' | string;
  content: string;
  postType?: string;
  authorRoleType?: 'startup' | 'investor' | 'mentor' | 'esp' | 'student' | 'explorer';
  tags?: string[];
  media?: {
    type: 'image' | 'video' | 'banner';
    url: string;
    alt: string;
    caption?: string;
    aspectRatio?: string;
  };
  metrics: {
    likes: number;
    comments: number;
    shares: number;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
  commentsList: PostComment[];
}

export type RecommendationCategory = 'people' | 'mentors' | 'investors' | 'opportunities';

export interface Recommendation {
  id: string;
  userId?: string;
  type?: 'startup' | 'mentor' | 'investor' | 'esp';
  name: string;
  title: string;
  company?: string;
  context: string;
  category: RecommendationCategory;
  avatar: string;
  status: 'idle' | 'pending' | 'connected';
  mutualCount?: number;
}

export interface OpportunityItem {
  id: string;
  title: string;
  organization: string;
  location: string;
  type: string;
  badge: string;
  matchScore: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  failed?: boolean;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  messages: ChatMessage[];
}

export type FeedTabType = 'for-you' | 'following' | 'opportunities' | 'mentors' | 'investors';
