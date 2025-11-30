
import { Team, Driver, Track, Staff, Facility, JuniorDriver, Sponsor, TireCompound } from './types';

export const INITIAL_MONEY = 5000000;
export const COST_CAP_LIMIT = 135000000; // $135M Budget Cap
export const TOTAL_RACES_PER_SEASON = 10;

export const TIRE_COMPOUNDS: TireCompound[] = [
  { type: 'soft', name: 'Soft', grip: 100, durability: 30, color: '#ef4444', optimalTemp: 'hot' },
  { type: 'medium', name: 'Medium', grip: 75, durability: 60, color: '#eab308', optimalTemp: 'normal' },
  { type: 'hard', name: 'Hard', grip: 50, durability: 100, color: '#f5f5f5', optimalTemp: 'cold' },
  { type: 'inter', name: 'Intermediate', grip: 60, durability: 70, color: '#22c55e', optimalTemp: 'normal' },
  { type: 'wet', name: 'Full Wet', grip: 40, durability: 80, color: '#3b82f6', optimalTemp: 'cold' },
];

export const INITIAL_FACILITIES: Facility[] = [
    { id: 'f_factory', name: 'Fabrik', level: 1, description: 'Reduziert Kosten für Auto-Upgrades.', cost: 2000000, benefit: '-5% Kosten', type: 'factory', slot: 0 },
    { id: 'f_wind', name: 'Windkanal', level: 1, description: 'Erhöht Aerodynamik-Effizienz.', cost: 3000000, benefit: '+10% Aero Gain', type: 'windtunnel', slot: 1 },
    { id: 'f_sim', name: 'Simulator', level: 1, description: 'Fahrer verbessern sich schneller.', cost: 1500000, benefit: '+XP für Fahrer', type: 'simulator', slot: 3 },
    { id: 'f_scout', name: 'Scouting', level: 1, description: 'Findet bessere Junior-Fahrer.', cost: 1000000, benefit: 'Bessere Talente', type: 'scouting', slot: 4 }
];

export const AVAILABLE_SPONSORS: Sponsor[] = [
    { id: 'sp_oracle', name: 'Cloud Data Co.', type: 'title', signingBonus: 5000000, perRaceIncome: 500000, logoColor: '#3b82f6' },
    { id: 'sp_petronas', name: 'Oil & Energy', type: 'title', signingBonus: 4000000, perRaceIncome: 600000, logoColor: '#06b6d4' },
    { id: 'sp_santander', name: 'Global Bank', type: 'minor', signingBonus: 1000000, perRaceIncome: 250000, logoColor: '#ef4444' },
    { id: 'sp_dhl', name: 'Logistics Pro', type: 'minor', signingBonus: 800000, perRaceIncome: 300000, logoColor: '#eab308' },
    { id: 'sp_rolex', name: 'Luxury Watch', type: 'minor', signingBonus: 1500000, perRaceIncome: 200000, logoColor: '#22c55e' },
    { id: 'sp_crypto', name: 'Crypto Exch', type: 'title', signingBonus: 6000000, perRaceIncome: 400000, logoColor: '#3f3f46' },
];

export const AVAILABLE_STAFF: Staff[] = [
    { id: 's1', name: 'Adrian N.', role: 'Technical Director', rating: 5, salary: 1500000, bonusDescription: 'Enorme Auto-Entwicklung', hired: false },
    { id: 's2', name: 'Hannah S.', role: 'Head of Strategy', rating: 5, salary: 1200000, bonusDescription: 'Perfekte Rennstrategie (+Speed)', hired: false },
    { id: 's3', name: 'Gianpiero L.', role: 'Race Engineer', rating: 4, salary: 900000, bonusDescription: 'Besseres Reifenmanagement', hired: false },
    { id: 's4', name: 'James V.', role: 'Head of Strategy', rating: 4, salary: 800000, bonusDescription: 'Gute Strategie', hired: false },
    { id: 's5', name: 'Bono P.', role: 'Race Engineer', rating: 5, salary: 1100000, bonusDescription: 'Top Reifenmanagement', hired: false },
    { id: 's6', name: 'Mattia B.', role: 'Technical Director', rating: 3, salary: 600000, bonusDescription: 'Solide Entwicklung', hired: false }
];

export const TEAMS: Team[] = [
  {
    id: 'player_team',
    name: 'Apex Racing',
    color: '#ef4444', // Red
    money: INITIAL_MONEY,
    points: 0,
    car: { aerodynamics: 50, engine: 50, reliability: 60, chassis: 50 },
    drivers: [], // To be filled or selected
    facilities: JSON.parse(JSON.stringify(INITIAL_FACILITIES)),
    staff: [],
    juniors: [],
    sponsors: [],
    morale: 75,
    costCapSpent: 0
  },
  {
    id: 'merc',
    name: 'Silver Arrows',
    color: '#14b8a6', // Teal
    money: 100000000,
    points: 0,
    car: { aerodynamics: 85, engine: 80, reliability: 90, chassis: 85 },
    drivers: [],
    facilities: [],
    staff: [],
    juniors: [],
    sponsors: [],
    morale: 80,
    costCapSpent: 100000000
  },
  {
    id: 'rbull',
    name: 'Energy Speed',
    color: '#1d4ed8', // Blue
    money: 100000000,
    points: 0,
    car: { aerodynamics: 90, engine: 85, reliability: 80, chassis: 88 },
    drivers: [],
    facilities: [],
    staff: [],
    juniors: [],
    sponsors: [],
    morale: 90,
    costCapSpent: 110000000
  },
  {
    id: 'ferr',
    name: 'Scuderia Rosso',
    color: '#dc2626', // Red
    money: 100000000,
    points: 0,
    car: { aerodynamics: 82, engine: 88, reliability: 70, chassis: 80 },
    drivers: [],
    facilities: [],
    staff: [],
    juniors: [],
    sponsors: [],
    morale: 70,
    costCapSpent: 90000000
  }
];

export const AVAILABLE_DRIVERS: Driver[] = [
  { 
    id: 'd1', name: 'Max V.', skill: 95, aggression: 90, tireManagement: 85, salary: 2000000, 
    image: '', nationality: 'NL', mood: 'neutral', marketValue: 50000000,
    contract: { yearsRemaining: 2, salaryPerYear: 2000000, signingBonus: 5000000, performanceBonus: 100000, expiresAfterRace: 20 }
  },
  { 
    id: 'd2', name: 'Lewis H.', skill: 94, aggression: 80, tireManagement: 95, salary: 2000000, 
    image: '', nationality: 'GB', mood: 'neutral', marketValue: 45000000,
    contract: { yearsRemaining: 1, salaryPerYear: 2000000, signingBonus: 3000000, performanceBonus: 150000, expiresAfterRace: 10 }
  },
  { 
    id: 'd3', name: 'Charles L.', skill: 88, aggression: 85, tireManagement: 75, salary: 1500000, 
    image: '', nationality: 'MC', mood: 'neutral', marketValue: 35000000,
    contract: { yearsRemaining: 3, salaryPerYear: 1500000, signingBonus: 2000000, performanceBonus: 80000, expiresAfterRace: 30 }
  },
  { 
    id: 'd4', name: 'Lando N.', skill: 85, aggression: 75, tireManagement: 80, salary: 1200000, 
    image: '', nationality: 'GB', mood: 'neutral', marketValue: 30000000,
    contract: { yearsRemaining: 2, salaryPerYear: 1200000, signingBonus: 1500000, performanceBonus: 60000, expiresAfterRace: 20 }
  },
  { 
    id: 'd5', name: 'Oscar P.', skill: 82, aggression: 70, tireManagement: 85, salary: 900000, 
    image: '', nationality: 'AU', mood: 'neutral', marketValue: 20000000,
    contract: { yearsRemaining: 2, salaryPerYear: 900000, signingBonus: 500000, performanceBonus: 40000, expiresAfterRace: 20 }
  },
  { 
    id: 'd6', name: 'Fernando A.', skill: 89, aggression: 88, tireManagement: 90, salary: 1400000, 
    image: '', nationality: 'ES', mood: 'neutral', marketValue: 25000000,
    contract: { yearsRemaining: 1, salaryPerYear: 1400000, signingBonus: 1000000, performanceBonus: 70000, expiresAfterRace: 10 }
  },
  { 
    id: 'd7', name: 'Rookie A.', skill: 60, aggression: 90, tireManagement: 50, salary: 100000, 
    image: '', nationality: 'DE', mood: 'happy', marketValue: 2000000, isOnMarket: true,
    contract: { yearsRemaining: 1, salaryPerYear: 100000, signingBonus: 50000, performanceBonus: 10000, expiresAfterRace: 10 }
  },
  { 
    id: 'd8', name: 'Rookie B.', skill: 65, aggression: 60, tireManagement: 60, salary: 150000, 
    image: '', nationality: 'FR', mood: 'neutral', marketValue: 3000000, isOnMarket: true,
    contract: { yearsRemaining: 1, salaryPerYear: 150000, signingBonus: 75000, performanceBonus: 15000, expiresAfterRace: 10 }
  }
];

export const TRACKS: Track[] = [
  { 
    id: 't1', 
    name: 'Melbourne GP', 
    location: 'Australia', 
    laps: 20, 
    difficulty: 'medium', 
    baseLapTime: 80,
    path: 'M 30,80 C 10,80 10,60 10,50 C 10,20 30,10 50,10 C 70,10 90,20 90,50 C 90,80 70,80 60,70 L 50,60 L 40,70 C 35,75 30,80 30,80 Z',
    idealSetup: { wings: 60, suspension: 50, gear: 50 }
  },
  { 
    id: 't2', 
    name: 'Monaco GP', 
    location: 'Monaco', 
    laps: 25, 
    difficulty: 'hard', 
    baseLapTime: 75,
    path: 'M 20,90 L 80,90 C 90,90 90,80 80,70 L 60,50 C 50,40 60,30 70,30 C 80,30 80,20 70,10 L 30,10 C 20,10 20,30 30,40 L 40,50 L 20,70 C 10,80 10,90 20,90 Z',
    idealSetup: { wings: 95, suspension: 20, gear: 80 } // High downforce, soft susp, short gears
  },
  { 
    id: 't3', 
    name: 'Silverstone', 
    location: 'UK', 
    laps: 22, 
    difficulty: 'medium', 
    baseLapTime: 90,
    path: 'M 40,90 L 80,80 C 95,75 95,60 80,50 L 60,40 C 50,35 60,20 70,15 L 50,5 C 30,5 20,20 25,40 C 30,50 20,60 10,70 C 5,85 20,95 40,90 Z',
    idealSetup: { wings: 40, suspension: 70, gear: 40 } // High speed
  },
  { 
    id: 't4', 
    name: 'Monza', 
    location: 'Italy', 
    laps: 21, 
    difficulty: 'easy', 
    baseLapTime: 78,
    path: 'M 20,80 L 80,80 C 95,80 95,20 80,20 L 50,20 L 45,30 L 40,20 L 20,20 C 5,20 5,80 20,80 Z',
    idealSetup: { wings: 15, suspension: 80, gear: 20 } // Low downforce, stiff
  },
  { 
    id: 't5', 
    name: 'Suzuka', 
    location: 'Japan', 
    laps: 23, 
    difficulty: 'hard', 
    baseLapTime: 92,
    path: 'M 20,80 C 10,80 10,60 20,50 L 50,30 C 60,20 80,20 90,30 C 95,40 90,60 80,70 L 60,80 C 40,90 40,50 50,40 L 70,20 C 80,10 50,5 40,10 C 20,20 30,40 40,50 Z',
    idealSetup: { wings: 75, suspension: 60, gear: 50 }
  },
];
