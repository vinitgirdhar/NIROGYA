// Health Data Types
export interface HealthData {
  id: string;
  patientId: string;
  symptoms: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  reportedBy: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  timestamp: Date;
  diseaseType?: 'diarrhea' | 'cholera' | 'typhoid' | 'hepatitis_a' | 'other';
}

// Water Quality Types
export interface WaterQualityData {
  id: string;
  sourceId: string;
  sourceName: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  parameters: {
    turbidity: number;
    pH: number;
    bacterialCount: number;
    chlorine: number;
    temperature: number;
  };
  status: 'safe' | 'warning' | 'contaminated';
  timestamp: Date;
  testedBy: string;
}

// Alert Types
export interface Alert {
  id: string;
  type: 'outbreak' | 'water_contamination' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  affectedPopulation: number;
  timestamp: Date;
  status: 'active' | 'resolved' | 'investigating';
  assignedTo?: string;
}

// User Types
export interface User {
  id: string;
  name: string;
  role: 'admin' | 'asha_worker' | 'government_body' | 'community_user';
  contact: string;
  location: string;
  permissions: string[];
}

// Community Report Types
export interface CommunityReport {
  id: string;
  reporterName: string;
  reporterContact: string;
  symptoms: string[];
  familyAffected: number;
  waterSource: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  timestamp: Date;
  status: 'new' | 'investigating' | 'resolved';
  followUpRequired: boolean;
}

// Education Content Types
export interface EducationContent {
  id: string;
  title: string;
  content: string;
  type: 'video' | 'article' | 'infographic' | 'audio';
  language: string;
  category: 'prevention' | 'symptoms' | 'treatment' | 'hygiene';
  targetAudience: 'general' | 'children' | 'pregnant_women' | 'elderly';
}

// Dashboard Analytics Types
export interface DashboardStats {
  totalCases: number;
  activeCases: number;
  resolvedCases: number;
  contaminatedSources: number;
  activeAlerts: number;
  casesThisWeek: number;
  trendDirection: 'up' | 'down' | 'stable';
}

// Geographic Types
export interface GeographicData {
  region: string;
  district: string;
  subDistrict: string;
  village: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  population: number;
  vulnerabilityScore: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: Date;
}

// Form Types
export interface HealthReportForm {
  patientName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  symptoms: string[];
  onsetDate: Date;
  severity: string;
  waterSource: string;
  location: string;
  contactNumber: string;
}

export interface WaterTestForm {
  sourceName: string;
  location: string;
  testType: 'manual' | 'iot_sensor';
  turbidity: number;
  pH: number;
  bacterialPresence: boolean;
  chlorineLevel: number;
  temperature: number;
  notes?: string;
}