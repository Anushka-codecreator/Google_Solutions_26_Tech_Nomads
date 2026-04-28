export type NeedCategory = 'medical' | 'food' | 'water' | 'infrastructure' | 'education' | 'other';
export type NeedStatus = 'reported' | 'analyzed' | 'assigned' | 'in-progress' | 'resolved';
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface Need {
  id: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  category: NeedCategory;
  priorityScore: number;
  status: NeedStatus;
  population?: number;
  severity: Severity;
  reportedBy: string;
  reportedAt: string;
  assignedVolunteerId?: string;
  imageUrl?: string;
  aiInsights?: string;
  impactMetrics?: {
    peopleHelped: number;
    timeSaved: number; // in hours
  };
}

export interface Volunteer {
  uid: string;
  name: string;
  skills: string[];
  available: boolean;
  location?: {
    lat: number;
    lng: number;
  };
  lastActive: string;
  tasksCompleted: number;
  activeTasks: number;
  fatigueLevel: number; // 0-100 Burnout detection
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type AppView = 'ngo' | 'volunteer' | 'report' | 'impact' | 'chat';

export interface AuthState {
  user: any | null;
  loading: boolean;
  role: 'ngo' | 'volunteer' | 'reporter' | null;
}
