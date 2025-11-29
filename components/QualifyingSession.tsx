
import React, { useState, useEffect } from 'react';
import { Track, Team, Driver } from '../types';
import { AVAILABLE_DRIVERS, TEAMS } from '../constants';
import { Flag, Timer, ChevronRight, Loader2 } from 'lucide-react';

interface QualifyingSessionProps {
    track: Track;
    playerTeam: Team;
    setupBonus: number; // 0-100 from practice
    onFinish: (gridOrder: string[]) => void;
}

interface QualiResult {
    driverId: string;
    teamId: string;
    driverName: string;
    teamName: string;
    teamColor: string;
    time: number;
    gap: number;
}

export const QualifyingSession: React.FC<QualifyingSessionProps> = ({ track, playerTeam, setupBonus, onFinish }) => {
    const [results, setResults] = useState<QualiResult[]>([]);
    const [isSimulating, setIsSimulating] = useState(true);

    useEffect(() => {
        simulateQualifying();
    }, []);

    const simulateQualifying = async () => {
        setIsSimulating(true);
        
        // Wait a bit for dramatic effect
        await new Promise(resolve => setTimeout(resolve, 2000));

        const allDrivers: QualiResult[] = [];

        // 1. Calculate AI Times
        const playerDriverIds = new Set(playerTeam.drivers.map(d => d.id));
        const freeDrivers = AVAILABLE_DRIVERS.filter(d => !playerDriverIds.has(d.id));
        let driverIndex = 0;

        TEAMS.forEach(team => {
            const isPlayer = team.id === playerTeam.id;
            
            // Determine drivers for this team (simulated structure mirroring RaceSimulation)
            let teamDrivers: Driver[] = [];
            if (isPlayer) {
                teamDrivers = team.drivers;
            } else {
                 // Use same logic as race sim to grab consistent random drivers if not defined
                 // Ideally this should be centralized, but for now we reconstruct
                 const d1 = driverIndex < freeDrivers.length ? freeDrivers[driverIndex++] : { id: `ai_${team.id}_1`, name: `Rookie 1`, skill: 60, aggression: 50, tireManagement: 50, salary: 0, image: '' } as Driver;
                 const d2 = driverIndex < freeDrivers.length ? freeDrivers[driverIndex++] : { id: `ai_${team.id}_2`, name: `Rookie 2`, skill: 55, aggression: 50, tireManagement: 50, salary: 0, image: '' } as Driver;
                 teamDrivers = [d1, d2];
            }

            teamDrivers.forEach(driver => {
                // Calculation Formula
                // Base Time - (Car/100 * 1s) - (Driver/100 * 1.5s)
                const carPerf = (team.car.aerodynamics + team.car.engine) / 2;
                
                // Bonus for Player from Practice
                const bonus = isPlayer ? (setupBonus / 100) * 0.8 : 0.2; // AI gets random small setup bonus equivalent

                const driverSkillFactor = (driver.skill / 100) * 1.5;
                const carFactor = (carPerf / 100) * 1.0;
                const randomness = (Math.random() - 0.5) * 0.5; // +/- 0.25s variance

                const lapTime = track.baseLapTime - carFactor - driverSkillFactor - bonus + randomness;

                allDrivers.push({
                    driverId: driver.id,
                    teamId: team.id,
                    driverName: driver.name,
                    teamName: team.name,
                    teamColor: team.color,
                    time: lapTime,
                    gap: 0
                });
            });
        });

        // Sort by time (lowest first)
        allDrivers.sort((a, b) => a.time - b.time);

        // Calculate Gaps
        const poleTime = allDrivers[0].time;
        const finalResults = allDrivers.map(d => ({
            ...d,
            gap: d.time - poleTime
        }));

        setResults(finalResults);
        setIsSimulating(false);
    };

    const handleStartRace = () => {
        // Pass the driver IDs in grid order
        onFinish(results.map(r => r.driverId));
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    };

    return (
        <div className="h-full bg-slate-900 flex flex-col pb-24 animate-fade-in">
            <div className="p-6 pb-2 border-b border-slate-800 bg-slate-950">
                 <div className="flex items-center gap-3 mb-2">
                    <Timer className="text-purple-400" size={32} />
                    <div>
                        <h2 className="text-2xl font-bold uppercase italic text-white">Qualifying</h2>
                        <p className="text-slate-400 text-sm">Startaufstellung</p>
                    </div>
                </div>
                {playerTeam.drivers.length > 0 && setupBonus > 0 && (
                     <div className="text-xs text-green-400 bg-green-900/20 inline-block px-2 py-1 rounded mb-2">
                         Setup Bonus aktiv: +{(setupBonus/100 * 0.8).toFixed(3)}s pro Runde
                     </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                {isSimulating ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                        <Loader2 size={48} className="animate-spin mb-4" />
                        <span className="uppercase font-bold tracking-widest">Fahre schnelle Runde...</span>
                    </div>
                ) : (
                    results.map((res, idx) => (
                        <div key={res.driverId} className="flex items-center bg-slate-800 p-3 rounded-lg border-l-4 relative overflow-hidden" style={{ borderLeftColor: res.teamColor }}>
                            <div className="w-8 text-xl font-bold italic text-slate-500">{idx + 1}</div>
                            <div className="flex-1">
                                <div className="font-bold text-white">{res.driverName}</div>
                                <div className="text-xs text-slate-400">{res.teamName}</div>
                            </div>
                            <div className="text-right">
                                <div className="font-mono font-bold text-white">{formatTime(res.time)}</div>
                                <div className="text-xs text-slate-500 font-mono">
                                    {idx === 0 ? 'POLE' : `+${res.gap.toFixed(3)}`}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-950">
                <button 
                    onClick={handleStartRace}
                    disabled={isSimulating}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                    <Flag size={20} /> Zum Start Grid
                </button>
            </div>
        </div>
    );
};
