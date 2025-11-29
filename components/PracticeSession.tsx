
import React, { useState } from 'react';
import { Track, CarSetup } from '../types';
import { Settings, CheckCircle, Activity, TrendingUp } from 'lucide-react';

interface PracticeSessionProps {
    track: Track;
    onFinish: (setupScore: number, finalSetup: CarSetup) => void;
}

export const PracticeSession: React.FC<PracticeSessionProps> = ({ track, onFinish }) => {
    const [setup, setSetup] = useState<CarSetup>({ wings: 50, suspension: 50, gear: 50 });
    const [feedback, setFeedback] = useState<string[]>([]);
    const [lapsDone, setLapsDone] = useState(0);
    const [confidence, setConfidence] = useState(0);

    const testLap = () => {
        if (lapsDone >= 3) return;

        const ideal = track.idealSetup;
        let newFeedback: string[] = [];
        let score = 0;

        // Wing Logic
        const wingDiff = setup.wings - ideal.wings;
        score += Math.max(0, 100 - Math.abs(wingDiff) * 2);
        if (wingDiff > 20) newFeedback.push("Zu viel Abtrieb! Wir verlieren Speed auf der Geraden.");
        else if (wingDiff < -20) newFeedback.push("Zu wenig Grip in den Kurven!");
        else newFeedback.push("Flügel fühlen sich okay an.");

        // Susp Logic
        const suspDiff = setup.suspension - ideal.suspension;
        score += Math.max(0, 100 - Math.abs(suspDiff) * 2);
        if (suspDiff > 20) newFeedback.push("Aufhängung zu hart für die Kerbs.");
        else if (suspDiff < -20) newFeedback.push("Auto schwimmt zu sehr, Aufhängung zu weich.");
        else newFeedback.push("Balance ist gut.");

        // Gear Logic
        const gearDiff = setup.gear - ideal.gear;
        score += Math.max(0, 100 - Math.abs(gearDiff) * 2);
        if (gearDiff > 20) newFeedback.push("Gänge zu kurz, wir kommen in den Begrenzer.");
        else if (gearDiff < -20) newFeedback.push("Beschleunigung aus Kurven ist zu träge.");

        setFeedback(newFeedback);
        setLapsDone(prev => prev + 1);
        
        // Calculate average score normalized to 0-100
        const totalScore = Math.floor(score / 3);
        setConfidence(totalScore);
    };

    const handleFinish = () => {
        onFinish(confidence, setup);
    };

    const renderSlider = (label: string, field: keyof CarSetup, minLabel: string, maxLabel: string) => (
        <div className="mb-6">
            <div className="flex justify-between mb-2">
                <span className="font-bold text-white">{label}</span>
                <span className="font-mono text-cyan-400">{setup[field]}</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={setup[field]} 
                onChange={(e) => setSetup({...setup, [field]: parseInt(e.target.value)})}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                disabled={lapsDone >= 3}
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1 uppercase">
                <span>{minLabel}</span>
                <span>{maxLabel}</span>
            </div>
        </div>
    );

    return (
        <div className="h-full bg-slate-900 p-6 flex flex-col pb-24 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
                <Settings className="text-cyan-400" size={32} />
                <div>
                    <h2 className="text-2xl font-bold uppercase italic text-white">Freies Training</h2>
                    <p className="text-slate-400 text-sm">Abstimmung für {track.name}</p>
                </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-6">
                {renderSlider("Aerodynamik (Flügel)", "wings", "Low Drag", "High Downforce")}
                {renderSlider("Aufhängung", "suspension", "Soft", "Stiff")}
                {renderSlider("Getriebe", "gear", "Beschleunigung", "Top Speed")}
            </div>

            {/* Feedback Area */}
            <div className="flex-1 bg-black/40 rounded-xl p-4 border border-slate-800 mb-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-slate-300 font-bold text-sm uppercase">Fahrer Feedback</h3>
                    <div className="text-xs bg-slate-700 px-2 py-1 rounded text-white">
                        Runde {lapsDone}/3
                    </div>
                </div>
                {feedback.length === 0 ? (
                    <div className="text-slate-600 italic text-sm text-center mt-4">
                        Fahre eine Testrunde, um Daten zu sammeln.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {feedback.map((msg, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-800/50 p-2 rounded">
                                <Activity size={14} className="mt-1 text-cyan-400 flex-shrink-0" />
                                {msg}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col items-center bg-slate-800 px-4 py-2 rounded-lg min-w-[80px]">
                    <span className="text-[10px] text-slate-400 uppercase">Setup Vertrauen</span>
                    <span className={`text-xl font-bold ${confidence > 80 ? 'text-green-400' : confidence > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {confidence}%
                    </span>
                </div>

                {lapsDone < 3 ? (
                    <button 
                        onClick={testLap}
                        className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2"
                    >
                        <TrendingUp size={20} /> Testrunde Starten
                    </button>
                ) : (
                    <button 
                        onClick={handleFinish}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-pulse"
                    >
                        <CheckCircle size={20} /> Setup Speichern & Quali
                    </button>
                )}
            </div>
        </div>
    );
};
