
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Track, Team, Driver, RaceResult, CarRaceState, RaceEvent } from '../types';
import { TEAMS, AVAILABLE_DRIVERS } from '../constants';
import { Play, Pause, AlertTriangle, Battery, Gauge, Zap, CloudRain, Sun, ShieldAlert, Image as ImageIcon, XCircle, Settings, Activity, User, Flag, RotateCcw, List, ChevronDown, ChevronUp } from 'lucide-react';
import { getRaceCommentary, generateEventImage } from '../services/geminiService';

interface RaceSimulationProps {
  playerTeam: Team;
  track: Track;
  gridOrder?: string[]; // Driver IDs in order
  setupBonus?: number; // 0-100
  onRaceFinish: (results: RaceResult[], weather: 'sunny' | 'rain') => void;
  onQuit?: () => void;
}

// Helper to get coordinates from a path
const useTrackPath = (pathData: string) => {
    const pathRef = useRef<SVGPathElement>(null);
    const [pathPoints, setPathPoints] = useState<{x: number, y: number}[]>([]);

    useLayoutEffect(() => {
        if (pathRef.current) {
            const length = pathRef.current.getTotalLength();
            const points = [];
            const steps = 200; // Resolution
            for (let i = 0; i <= steps; i++) {
                const point = pathRef.current.getPointAtLength((i / steps) * length);
                points.push({ x: point.x, y: point.y });
            }
            setPathPoints(points);
        }
    }, [pathData]);

    const getPosition = (progress: number) => { // progress 0-100
        if (pathPoints.length === 0) return { x: 0, y: 0 };
        const index = Math.min(Math.floor((progress / 100) * (pathPoints.length - 1)), pathPoints.length - 1);
        return pathPoints[index];
    };

    return { pathRef, getPosition };
};

export const RaceSimulation: React.FC<RaceSimulationProps> = ({ playerTeam, track, gridOrder, setupBonus = 0, onRaceFinish, onQuit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const commentaryDebounce = useRef(0);
  const raceInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Controls State
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [showMobileLeaderboard, setShowMobileLeaderboard] = useState(false);

  // Environment State
  const [weather, setWeather] = useState<'sunny' | 'rain'>('sunny');
  const [safetyCar, setSafetyCar] = useState(false);
  const [trackWetness, setTrackWetness] = useState(0); // 0-100%
  const [activeEvent, setActiveEvent] = useState<RaceEvent | null>(null);
  
  // AI Image State
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Simulation State
  const [cars, setCars] = useState<CarRaceState[]>([]);
  const [messages, setMessages] = useState<string[]>(['Die Fahrer stehen in der Startaufstellung...']);
  const [raceTime, setRaceTime] = useState(0); 

  const { pathRef, getPosition } = useTrackPath(track.path);

  // Calculate Bonuses
  const strategyBonus = playerTeam.staff.find(s => s.role === 'Head of Strategy' && s.hired) ? 1.02 : 1.0; 
  const engBonus = playerTeam.staff.find(s => s.role === 'Race Engineer' && s.hired) ? 0.9 : 1.0; // Tire wear multiplier
  const moraleMultiplier = (playerTeam.morale || 50) / 100; // 0.0 to 1.0. Affects Pit Stops.
  
  // Setup Bonus Factor (0-100 maps to 1.00 - 1.03 speed)
  const setupSpeedFactor = 1 + (setupBonus * 0.0003); 

  // Initialization
  useEffect(() => {
    const initialCars: CarRaceState[] = [];
    
    // Add Player Drivers
    playerTeam.drivers.forEach(d => {
        initialCars.push(createCarState(d, playerTeam));
    });

    // Select first driver by default
    if (playerTeam.drivers.length > 0) {
        setSelectedDriverId(playerTeam.drivers[0].id);
    }

    // Determine available drivers for AI
    const playerDriverIds = new Set(playerTeam.drivers.map(d => d.id));
    const freeDrivers = AVAILABLE_DRIVERS.filter(d => !playerDriverIds.has(d.id));
    let driverIndex = 0;

    TEAMS.filter(t => t.id !== playerTeam.id).forEach((t) => {
         // Driver 1
         let d1: Driver = driverIndex < freeDrivers.length ? freeDrivers[driverIndex++] : { 
             id: `ai_${t.id}_1`, 
             name: `Rookie ${t.name.substring(0,3)} 1`, 
             skill: 60, 
             aggression: 50, 
             tireManagement: 50, 
             salary: 0, 
             image: '',
             mood: 'neutral',
             nationality: 'INT'
         };
         initialCars.push(createCarState(d1, t));
         // Driver 2
         let d2: Driver = driverIndex < freeDrivers.length ? freeDrivers[driverIndex++] : { 
             id: `ai_${t.id}_2`, 
             name: `Rookie ${t.name.substring(0,3)} 2`, 
             skill: 55, 
             aggression: 50, 
             tireManagement: 50, 
             salary: 0, 
             image: '',
             mood: 'neutral',
             nationality: 'INT'
         };
         initialCars.push(createCarState(d2, t));
    });

    // Apply Sorting based on Grid Order if available, else random skill sort
    if (gridOrder && gridOrder.length > 0) {
        initialCars.sort((a, b) => {
            const idxA = gridOrder.indexOf(a.driverId);
            const idxB = gridOrder.indexOf(b.driverId);
            // If driver not in grid (bug fallback), put at end
            return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
        });
    } else {
        initialCars.sort((a, b) => (b.skill + Math.random() * 10) - (a.skill + Math.random() * 10));
    }

    setCars(initialCars);
  }, []);

  const createCarState = (driver: Driver, team: Team): CarRaceState => ({
      driverId: driver.id,
      teamId: team.id,
      name: driver.name,
      color: team.color,
      lap: 0,
      progress: 0,
      speed: 0,
      tireHealth: 100,
      tireType: 'soft', // Start on Softs
      engineMode: 'medium', // Default
      drivingStyle: 'balanced', // Default
      gap: 0,
      lastLapTime: 0,
      pitting: 0,
      finished: false,
      skill: driver.skill,
      dnf: false
  });

  // Main Race Loop
  useEffect(() => {
      // Pause simulation if an event is active
      if (activeEvent) {
          if (raceInterval.current) clearInterval(raceInterval.current);
          return;
      }

      if (isPlaying) {
          raceInterval.current = setInterval(() => {
              tick();
          }, 100);
      } else {
          if (raceInterval.current) clearInterval(raceInterval.current);
      }
      return () => {
          if (raceInterval.current) clearInterval(raceInterval.current);
      };
  }, [isPlaying, speedMultiplier, cars, activeEvent, weather, safetyCar, trackWetness]); 

  // Check for finish condition
  useEffect(() => {
    if (cars.length > 0) {
      const allFinished = cars.every(c => c.finished || c.dnf);
      if (allFinished && isPlaying) {
        setIsPlaying(false);
        const results: RaceResult[] = cars.map((c, idx) => ({
             driverId: c.driverId,
             teamId: c.teamId,
             position: idx + 1,
             points: idx === 0 ? 25 : idx === 1 ? 18 : idx === 2 ? 15 : idx === 3 ? 12 : idx === 4 ? 10 : idx === 5 ? 8 : idx === 6 ? 6 : idx === 7 ? 4 : idx === 8 ? 2 : idx === 9 ? 1 : 0
         }));
         onRaceFinish(results, weather);
      }
    }
  }, [cars, isPlaying]);

  const triggerEvent = async (event: RaceEvent, imageType: 'rain' | 'safety_car' | 'crash') => {
      setActiveEvent(event);
      setEventImage(null);
      setIsGeneratingImage(true);
      setIsPlaying(false); // Force pause
      
      const image = await generateEventImage(imageType, event.description);
      setEventImage(image);
      setIsGeneratingImage(false);
  };

  const generateRandomEvent = (currentLap: number) => {
      const rand = Math.random();
      
      // Safety Car Event (Low chance)
      if (!safetyCar && rand < 0.002 && currentLap > 1 && currentLap < track.laps - 2) {
          setSafetyCar(true);
          triggerEvent({
              id: 'safety_car',
              title: 'SAFETY CAR!',
              description: 'Ein Unfall auf der Strecke! Das Safety Car kommt raus. Das Feld rückt zusammen.',
              type: 'safety_car',
              options: [
                  { label: 'Box für Frische Reifen', actionId: 'pit_sc', color: 'bg-green-600' },
                  { label: 'Draußen bleiben (Position halten)', actionId: 'stay_out', color: 'bg-slate-600' }
              ]
          }, 'safety_car');
          return;
      }

      // Weather Event (Rain)
      if (weather === 'sunny' && rand < 0.003) {
           triggerEvent({
              id: 'rain_start',
              title: 'WETTER UMSCHWUNG',
              description: 'Dunkle Wolken ziehen auf. Es fängt an stark zu regnen! Die Strecke wird nass.',
              type: 'weather',
              options: [
                  { label: 'Box für Intermediates', actionId: 'pit_inter', color: 'bg-blue-600' },
                  { label: 'Risiko auf Slicks', actionId: 'stay_out', color: 'bg-red-600' }
              ]
          }, 'rain');
          return;
      }

      // Reliability Event
      if (rand < 0.001) {
          triggerEvent({
              id: 'engine_issue',
              title: 'MOTOR PROBLEM',
              description: 'Die Telemetrie zeigt hohe Temperaturen. Wir verlieren Leistung.',
              type: 'reliability',
              options: [
                  { label: 'Modus runterschrauben (Sicher)', actionId: 'mode_save', color: 'bg-green-600' },
                  { label: 'Ignorieren (Risiko DNF)', actionId: 'ignore_issue', color: 'bg-red-600' }
              ]
          }, 'crash');
      }
  };

  const handleDecision = (actionId: string) => {
      // Apply decision to Player cars
      setCars(prev => prev.map(c => {
          if (c.teamId === playerTeam.id && !c.finished && !c.dnf) {
              if (actionId === 'pit_sc') return { ...c, pitting: 1, tireType: 'soft' }; // Quick pit queue
              if (actionId === 'pit_inter') return { ...c, pitting: 1, tireType: 'inter' };
              if (actionId === 'mode_save') return { ...c, engineMode: 'low' };
              if (actionId === 'ignore_issue') {
                  // 30% chance of DNF immediately or later
                  if (Math.random() < 0.3) return { ...c, dnf: true, speed: 0 };
              }
          }
          return c;
      }));

      // Environment effects
      if (activeEvent?.id === 'rain_start') {
          setWeather('rain');
          setMessages(prev => ["Es regnet! Die Strecke wird rutschig.", ...prev]);
      }
      if (activeEvent?.id === 'safety_car') {
          setMessages(prev => ["Safety Car Phase gestartet.", ...prev]);
      }

      setActiveEvent(null);
      setEventImage(null);
      setIsPlaying(true); // Auto resume
  };

  const tick = () => {
      // Global Checks
      if (!activeEvent && cars.length > 0 && !cars[0].finished) {
        generateRandomEvent(cars[0].lap);
      }

      // Check Safety Car End
      if (safetyCar) {
         if (Math.random() < 0.005) {
             setSafetyCar(false);
             setMessages(prev => ["GRÜNE FLAGGE! Safety Car kommt rein.", ...prev]);
         }
      }

      // Weather Update
      setTrackWetness(prev => {
          const delta = 0.1 * 10 * speedMultiplier;
          if (weather === 'rain') return Math.min(100, prev + 0.5 * delta);
          return Math.max(0, prev - 0.2 * delta);
      });

      setCars(prevCars => {
          const TICK_DURATION = 0.1; 
          const GAME_DELTA = TICK_DURATION * 10 * speedMultiplier; 
          const currentWetness = trackWetness; // Capture closure state

          let updatedCars = prevCars.map(car => {
              if (car.finished || car.dnf) return car;

              // --- AI Logic for Events ---
              let aiPitting = car.pitting;
              let aiTireType = car.tireType;

              // AI Pits for rain
              if (car.teamId !== playerTeam.id && weather === 'rain' && car.tireType !== 'inter' && car.pitting === 0) {
                  // AI reaction delay
                  if (Math.random() < 0.05) { // 5% chance per tick to realize they need to pit
                      aiPitting = 1; // Queue pit
                      aiTireType = 'inter';
                  }
              }
              // AI Pits for Safety Car
              if (car.teamId !== playerTeam.id && safetyCar && car.tireHealth < 60 && car.pitting === 0) {
                  if (Math.random() < 0.1) {
                      aiPitting = 1;
                      aiTireType = 'soft'; // Fresh softs
                  }
              }

              // --- Pitstop Logic ---
              if (aiPitting > 0) {
                  let pitDuration = 5.0; // Base stationary
                  
                  // Team Bonuses & Morale
                  if (car.teamId === playerTeam.id) {
                       if (playerTeam.staff.find(s => s.role === 'Race Engineer')) pitDuration *= 0.9;
                       const moraleFactor = 1.5 - (moraleMultiplier * 0.7); 
                       pitDuration *= moraleFactor;
                  }

                  const newPitCount = Math.max(0, aiPitting - GAME_DELTA);
                  
                  // If pit just finished
                  if (aiPitting > 0.1 && newPitCount <= 0.1) {
                       return { ...car, pitting: 0, tireHealth: 100, tireType: aiTireType };
                  }
                  return { ...car, pitting: newPitCount, speed: 0, tireType: aiTireType };
              }

              // --- Speed Calculation ---
              let baseSpeed = (100 / track.baseLapTime);
              const skillMod = 1 + ((car.skill - 70) * 0.001);
              let currentSpeed = baseSpeed * skillMod * strategyBonus;

              if (car.teamId === playerTeam.id) {
                  currentSpeed *= setupSpeedFactor;
              }

              switch(car.engineMode) {
                  case 'low': currentSpeed *= 0.96; break;
                  case 'medium': currentSpeed *= 1.0; break;
                  case 'high': currentSpeed *= 1.04; break;
                  case 'overtake': currentSpeed *= 1.08; break;
              }

              switch(car.drivingStyle) {
                  case 'conserve': currentSpeed *= 0.97; break;
                  case 'balanced': currentSpeed *= 1.0; break;
                  case 'push': currentSpeed *= 1.03; break;
              }

              if (currentWetness < 20) {
                  if (car.tireType === 'inter') currentSpeed *= 0.92;
              } else if (currentWetness > 50) {
                  if (car.tireType === 'soft' || car.tireType === 'hard') currentSpeed *= 0.60;
                  if (car.tireType === 'inter') currentSpeed *= 0.95;
              }

              if (car.tireHealth < 20) currentSpeed *= 0.95; 
              if (car.tireHealth <= 0) currentSpeed *= 0.60; 

              if (safetyCar) {
                  currentSpeed = Math.min(currentSpeed, baseSpeed * 0.6);
              }

              // --- State Updates ---
              let newProgress = car.progress + (currentSpeed * GAME_DELTA);
              let newLap = car.lap;
              let newFinished = false;

              let wearRate = 0.05 * GAME_DELTA * engBonus;
              if (car.drivingStyle === 'conserve') wearRate *= 0.6;
              if (car.drivingStyle === 'push') wearRate *= 1.4;
              if (car.engineMode === 'high') wearRate *= 1.1;
              if (car.engineMode === 'overtake') wearRate *= 1.3;
              if (car.tireType === 'soft') wearRate *= 1.2;
              if (car.tireType === 'hard') wearRate *= 0.8;
              
              let newTireHealth = car.tireHealth - wearRate;

              if (newProgress >= 100) {
                  newProgress -= 100;
                  newLap += 1;
                  
                  if (newLap >= track.laps) {
                      newFinished = true;
                      newProgress = 100;
                  } else {
                      if (!safetyCar && weather === 'sunny' && newTireHealth < 20 && car.pitting === 0) {
                          aiPitting = 5.0; 
                          aiTireType = 'soft'; 
                      }
                  }
              }

              if (car.engineMode === 'overtake' && Math.random() < 0.0005) {
                   car.engineMode = 'low'; 
              }

              return {
                  ...car,
                  progress: newProgress,
                  lap: newLap,
                  tireHealth: newTireHealth,
                  pitting: aiPitting,
                  tireType: aiTireType,
                  finished: newFinished,
                  speed: currentSpeed * 300
              };
          });

          // Sort cars by position for leaderboard and gap calculation
          updatedCars.sort((a, b) => {
             if (a.finished && !b.finished) return -1;
             if (!a.finished && b.finished) return 1;
             if (a.lap !== b.lap) return b.lap - a.lap;
             return b.progress - a.progress;
          });

          // Update Gaps
          if (updatedCars.length > 0) {
            updatedCars[0].gap = 0;
            for (let i = 1; i < updatedCars.length; i++) {
                const leader = updatedCars[0];
                const current = updatedCars[i];
                // Approximate time gap: (Lap Diff * BaseTime) + (Dist Diff / Speed)
                const lapDiff = leader.lap - current.lap;
                const distDiff = leader.progress - current.progress; // 0-100 scale
                // Approx 1 sec per 1% of track (rough estimate for 90s lap)
                const gap = (lapDiff * track.baseLapTime) + (distDiff * (track.baseLapTime / 100));
                updatedCars[i].gap = Math.max(0, gap);
            }
          }

          // Commentary trigger
          const leader = updatedCars[0];
          const now = Date.now();
          if (now - commentaryDebounce.current > 15000 && Math.random() < 0.3) {
             commentaryDebounce.current = now;
             getRaceCommentary(track, leader.lap, leader.name, safetyCar ? 'Safety Car' : weather === 'rain' ? 'Regen' : undefined)
                .then(text => setMessages(prev => [text, ...prev.slice(0, 4)]));
          }

          return updatedCars;
      });

      setRaceTime(t => t + 0.1 * speedMultiplier);
  };

  const changeStrategy = (mode: 'push' | 'balanced' | 'conserve', engine: 'overtake' | 'high' | 'medium' | 'low') => {
      if (!selectedDriverId) return;
      setCars(prev => prev.map(c => {
          if (c.driverId === selectedDriverId) {
              return { ...c, drivingStyle: mode, engineMode: engine };
          }
          return c;
      }));
  };

  // Find selected car
  const selectedCar = cars.find(c => c.driverId === selectedDriverId) || cars[0];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white relative overflow-hidden animate-fade-in font-mono">
        
        {/* Top Bar: Weather & Status */}
        <div className="flex justify-between items-center p-3 bg-slate-900 border-b border-slate-800 z-30 shadow-lg">
            <div className="flex items-center gap-2 md:gap-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
                    {weather === 'rain' ? <CloudRain className="text-blue-400" size={16} /> : <Sun className="text-yellow-400" size={16} />}
                    <span className="text-xs font-bold uppercase hidden md:inline">{weather}</span>
                </div>
                {safetyCar && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-500 text-black rounded-full animate-pulse">
                        <ShieldAlert size={16} />
                        <span className="text-xs font-bold uppercase hidden md:inline">SAFETY CAR</span>
                    </div>
                )}
                {trackWetness > 0 && (
                    <div className="w-16 md:w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${trackWetness}%` }}></div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2">
                 <button onClick={() => setSpeedMultiplier(1)} className={`text-xs px-2 py-1 rounded border border-slate-700 ${speedMultiplier === 1 ? 'bg-white text-black font-bold' : 'bg-slate-800'}`}>1x</button>
                 <button onClick={() => setSpeedMultiplier(4)} className={`text-xs px-2 py-1 rounded border border-slate-700 ${speedMultiplier === 4 ? 'bg-white text-black font-bold' : 'bg-slate-800'}`}>4x</button>
                 <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700">
                     {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                 </button>
                 <button onClick={onQuit} className="p-2 bg-red-900/50 text-red-400 rounded-full hover:bg-red-900 ml-2 border border-red-900">
                     <XCircle size={16} />
                 </button>
            </div>
        </div>

        {/* Main Content Area - Mobile Optimized Stack */}
        <div className="flex-1 relative flex flex-row overflow-hidden">
            
            {/* Track Visualization (Background/Center) */}
            <div className="absolute inset-0 z-0 flex items-center justify-center p-4 md:static md:flex-1 bg-[#1a1b26]">
                {/* SVG Track */}
                <div className="relative w-full h-full max-w-3xl aspect-square flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl overflow-visible">
                        {/* Track Outline */}
                        <path 
                            ref={pathRef}
                            d={track.path} 
                            fill="none" 
                            stroke="#334155" 
                            strokeWidth="6" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                        />
                        <path 
                            d={track.path} 
                            fill="none" 
                            stroke="#0f172a" 
                            strokeWidth="4" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                        />
                        
                        {/* Cars */}
                        {cars.map(car => {
                            if (car.dnf) return null;
                            const pos = getPosition(car.progress);
                            const isSelected = selectedDriverId === car.driverId;
                            return (
                                <g key={car.driverId} style={{ transition: 'all 0.1s linear' }} transform={`translate(${pos.x}, ${pos.y})`}>
                                    <circle 
                                        r={isSelected ? 3.5 : 2} 
                                        fill={car.color} 
                                        stroke="white" 
                                        strokeWidth={isSelected ? 1.5 : 0.5} 
                                    />
                                    {isSelected && (
                                        <circle r={6} fill="none" stroke="white" strokeWidth="0.5" className="animate-ping opacity-50" />
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Messages Overlay */}
                    <div className="absolute top-4 left-0 w-full flex flex-col items-center gap-2 pointer-events-none">
                        {messages.slice(0, 3).map((msg, i) => (
                            <div key={i} className="bg-black/60 backdrop-blur px-4 py-1 rounded-full text-[10px] md:text-xs text-white border border-white/10 animate-fade-in-up">
                                {msg}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Leaderboard (Sidebar on Desktop, Drawer on Mobile) */}
            <div className={`
                absolute top-0 bottom-0 left-0 w-64 bg-slate-900/95 backdrop-blur z-20 
                border-r border-slate-800 transition-transform duration-300
                ${showMobileLeaderboard ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0 md:block flex flex-col
            `}>
                <div className="p-2 bg-slate-900 z-20 border-b border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase retro-font">Leaderboard</span>
                    <button onClick={() => setShowMobileLeaderboard(false)} className="md:hidden text-slate-400 p-1">
                        <XCircle size={16} />
                    </button>
                </div>
                <div className="overflow-y-auto no-scrollbar flex-1">
                    {cars.map((car, idx) => (
                        <div 
                            key={car.driverId}
                            onClick={() => { setSelectedDriverId(car.driverId); setShowMobileLeaderboard(false); }}
                            className={`p-2 border-b border-slate-800/50 flex items-center gap-2 cursor-pointer transition-colors ${selectedDriverId === car.driverId ? 'bg-white/10' : 'hover:bg-white/5'} ${car.dnf ? 'opacity-50 grayscale' : ''}`}
                        >
                            <div className="w-5 text-center text-xs font-mono text-slate-500">{idx + 1}</div>
                            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: car.color }}></div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold truncate text-white">{car.name}</div>
                                <div className="text-[10px] text-slate-400 flex justify-between">
                                    <span>{car.tireType.toUpperCase()} {Math.round(car.tireHealth)}%</span>
                                    <span>{car.pitting > 0 ? 'PIT' : idx === 0 ? 'LDR' : `+${car.gap.toFixed(1)}s`}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Leaderboard Toggle Button */}
            <button 
                onClick={() => setShowMobileLeaderboard(true)}
                className="md:hidden absolute top-4 left-4 z-10 bg-slate-900/80 p-2 rounded-lg border border-slate-700 text-white shadow-lg"
            >
                <List size={20} />
            </button>

            {/* Telemetry & Controls (Sidebar on Desktop, Bottom Sheet on Mobile) */}
            {selectedCar && (
                <div className={`
                    absolute bottom-0 left-0 right-0 z-20 
                    md:relative md:w-72 md:h-full
                    bg-slate-900/95 backdrop-blur border-t md:border-t-0 md:border-l border-slate-800 
                    flex flex-col shadow-2xl md:shadow-none
                    max-h-[45%] md:max-h-full transition-all
                `}>
                    {/* Header / Driver Name */}
                    <div className="p-3 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                        <div className="min-w-0">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Telemetry</div>
                            <h2 className="text-lg font-bold text-white truncate leading-tight retro-font">{selectedCar.name}</h2>
                            <div className="text-xs text-cyan-400 font-mono">LAP {selectedCar.lap}/{track.laps}</div>
                        </div>
                        {/* Only show close on mobile if needed, but here it's persistent */}
                    </div>

                    <div className="p-3 space-y-3 overflow-y-auto no-scrollbar">
                        <div className="grid grid-cols-2 gap-3 md:block md:space-y-3">
                            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-slate-400 text-[10px] uppercase">
                                    <Gauge size={12} /> Speed
                                </div>
                                <div className="text-xl font-mono text-white leading-none">{Math.round(selectedCar.speed)} <span className="text-[10px]">km/h</span></div>
                            </div>

                            <div className="bg-slate-800 p-2 rounded-xl border border-slate-700">
                                <div className="flex items-center gap-2 mb-1 text-slate-400 text-[10px] uppercase">
                                    <Activity size={12} /> Tires ({selectedCar.tireType})
                                </div>
                                <div className="w-full bg-slate-700 h-1.5 rounded-full mb-1">
                                    <div 
                                        className={`h-full rounded-full ${selectedCar.tireHealth > 60 ? 'bg-green-500' : selectedCar.tireHealth > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${selectedCar.tireHealth}%` }}
                                    ></div>
                                </div>
                                <div className="text-right text-[10px] text-slate-300">{Math.round(selectedCar.tireHealth)}%</div>
                            </div>
                        </div>

                        {/* Controls for Player Team */}
                        {selectedCar.teamId === playerTeam.id && !selectedCar.finished && !selectedCar.dnf && (
                            <div className="mt-2 md:mt-4 border-t border-slate-800 pt-2 md:pt-4">
                                <div className="text-[10px] text-slate-500 uppercase font-bold mb-2">Strategy Control</div>
                                
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => changeStrategy('conserve', 'low')}
                                        className={`p-2 rounded text-[10px] flex flex-col items-center gap-1 border border-transparent transition-all active:scale-95 ${selectedCar.drivingStyle === 'conserve' ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.5)]' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                    >
                                        <Battery size={14} /> SAVE
                                    </button>
                                    <button 
                                        onClick={() => changeStrategy('balanced', 'medium')}
                                        className={`p-2 rounded text-[10px] flex flex-col items-center gap-1 border border-transparent transition-all active:scale-95 ${selectedCar.drivingStyle === 'balanced' ? 'bg-yellow-600 text-white border-yellow-400 shadow-[0_0_10px_rgba(202,138,4,0.5)]' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                    >
                                        <Activity size={14} /> MIX
                                    </button>
                                    <button 
                                        onClick={() => changeStrategy('push', 'overtake')}
                                        className={`p-2 rounded text-[10px] flex flex-col items-center gap-1 border border-transparent transition-all active:scale-95 ${selectedCar.drivingStyle === 'push' ? 'bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                                    >
                                        <Zap size={14} /> PUSH
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Event Overlay */}
        {activeEvent && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
                <div className="bg-slate-900 border-2 border-white max-w-2xl w-full rounded-2xl overflow-hidden shadow-2xl relative">
                    <div className="h-48 bg-slate-800 relative group overflow-hidden">
                        {isGeneratingImage ? (
                            <div className="absolute inset-0 flex items-center justify-center text-green-400 font-mono animate-pulse">
                                GENERATING FEED...
                            </div>
                        ) : eventImage ? (
                            <img src={eventImage} alt="Event" className="w-full h-full object-cover image-pixelated" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-600">
                                <AlertTriangle size={48} />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                        <div className="absolute bottom-4 left-6">
                             <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded inline-block mb-2 animate-pulse uppercase">
                                 {activeEvent.type}
                             </div>
                             <h2 className="text-3xl font-bold text-white italic uppercase leading-none retro-font">{activeEvent.title}</h2>
                        </div>
                    </div>

                    <div className="p-6">
                        <p className="text-lg text-slate-300 mb-6 font-mono leading-tight">{activeEvent.description}</p>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {activeEvent.options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleDecision(opt.actionId)}
                                    className={`py-4 rounded-xl font-bold text-white shadow-lg transform transition active:scale-95 retro-font text-sm ${opt.color}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
