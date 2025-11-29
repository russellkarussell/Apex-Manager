
export interface Driver {
  id: string;
  name: string;
  skill: number; // 0-100
  aggression: number; // 0-100
  tireManagement: number; // 0-100
  salary: number;
  teamId?: string;
  image: string; // Thumbnail
  portraitUrl?: string; // Full body AI generation
  mood: 'ecstatic' | 'happy' | 'neutral' | 'frustrated' | 'angry';
  nationality: string;
  description?: string; // AI generated backstory
}

export interface Car {
  aerodynamics: number; // 0-100
  engine: number; // 0-100
  reliability: number; // 0-100
  chassis: number; // 0-100
}

export interface CarSetup {
  wings: number; // 0-100 (Downforce vs Speed)
  suspension: number; // 0-100 (Soft vs Stiff)
  gear: number; // 0-100 (Accel vs Top Speed)
}

export interface Facility {
    id: string;
    name: string;
    level: number;
    description: string;
    cost: number;
    benefit: string;
    type: 'factory' | 'windtunnel' | 'simulator' | 'scouting';
    slot: number; // 0-5 Position on the HQ Grid
}

export interface Staff {
    id: string;
    name: string;
    role: 'Technical Director' | 'Head of Strategy' | 'Race Engineer';
    rating: number; // 1-5 stars
    salary: number;
    bonusDescription: string;
    hired: boolean;
}

export interface JuniorDriver {
    id: string;
    name: string;
    age: number;
    potential: number; // 0-100
    currentSkill: number;
    funding: number; // Money they bring
}

export interface Sponsor {
    id: string;
    name: string;
    type: 'title' | 'minor';
    signingBonus: number;
    perRaceIncome: number;
    logoColor: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  money: number;
  car: Car;
  drivers: Driver[];
  points: number;
  facilities: Facility[];
  staff: Staff[];
  juniors: JuniorDriver[];
  sponsors: Sponsor[];
  morale?: number; // 0-100
  costCapSpent?: number; // Amount spent relevant to budget cap
}

export interface Track {
  id: string;
  name: string;
  location: string;
  laps: number;
  difficulty: 'easy' | 'medium' | 'hard';
  baseLapTime: number; // in seconds
  path: string; // SVG Path Data (viewBox 0 0 100 100)
  idealSetup: CarSetup; // Hidden from user
}

export interface RaceResult {
  driverId: string;
  teamId: string;
  position: number;
  points: number;
}

export enum GamePhase {
  DASHBOARD = 'DASHBOARD',
  FINANCES = 'FINANCES',
  CAR_DEV = 'CAR_DEV',
  DRIVERS = 'DRIVERS',
  HQ = 'HQ',
  RACE_PREVIEW = 'RACE_PREVIEW',
  PRACTICE = 'PRACTICE',
  QUALIFYING = 'QUALIFYING',
  RACE_LIVE = 'RACE_LIVE',
  HIGHLIGHTS = 'HIGHLIGHTS',
  STANDINGS = 'STANDINGS',
  INTERVIEW = 'INTERVIEW'
}

export interface CarRaceState {
  driverId: string;
  teamId: string;
  name: string;
  color: string;
  lap: number;
  progress: number; // 0.0 to 100.0 (percentage of track)
  speed: number;
  tireHealth: number;
  tireType: 'soft' | 'hard' | 'inter'; 
  // New granular controls
  engineMode: 'low' | 'medium' | 'high' | 'overtake'; 
  drivingStyle: 'conserve' | 'balanced' | 'push';
  gap: number; 
  lastLapTime: number;
  pitting: number; 
  finished: boolean;
  skill: number; 
  dnf: boolean;
}

export interface RaceState {
  totalTime: number;
  lap: number;
  totalLaps: number;
  cars: CarRaceState[];
  weather: 'sunny' | 'rain';
  trackCondition: number; // 0 (dry) to 100 (wet)
  safetyCar: boolean;
  finished: boolean;
  messages: string[];
}

export interface RaceDecisionOption {
    label: string;
    actionId: string;
    color: string;
}

export interface RaceEvent {
    id: string;
    title: string;
    description: string;
    type: 'weather' | 'safety_car' | 'reliability' | 'strategy';
    options: RaceDecisionOption[];
}

export interface InterviewData {
    question: string;
    journalist: string;
    answers: {
        text: string;
        moraleImpact: number;
        type: 'diplomatic' | 'arrogant' | 'team';
    }[];
}
