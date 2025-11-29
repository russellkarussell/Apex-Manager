
import React, { useState } from 'react';
import { Driver, Team } from '../types';
import { generateDriverPortrait } from '../services/geminiService';
import { X, Camera, Zap, Smile, Frown, Meh, Angry, Award, Flag } from 'lucide-react';

interface DriverDetailProps {
    driver: Driver;
    teamColor: string;
    onClose: () => void;
    updateDriver: (updatedDriver: Driver) => void;
}

export const DriverDetail: React.FC<DriverDetailProps> = ({ driver, teamColor, onClose, updateDriver }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePortrait = async () => {
        setIsGenerating(true);
        const portraitUrl = await generateDriverPortrait(driver.name, teamColor, driver.nationality, driver.mood);
        if (portraitUrl) {
            updateDriver({ ...driver, portraitUrl });
        }
        setIsGenerating(false);
    };

    const getMoodIcon = (mood: Driver['mood']) => {
        switch (mood) {
            case 'ecstatic': return <Zap className="text-yellow-400" size={32} />;
            case 'happy': return <Smile className="text-green-400" size={32} />;
            case 'neutral': return <Meh className="text-slate-400" size={32} />;
            case 'frustrated': return <Frown className="text-orange-400" size={32} />;
            case 'angry': return <Angry className="text-red-500" size={32} />;
        }
    };

    const getMoodText = (mood: Driver['mood']) => {
        switch (mood) {
            case 'ecstatic': return "Extatisch! Fühlt sich unbesiegbar.";
            case 'happy': return "Gut gelaunt und motiviert.";
            case 'neutral': return "Fokussiert, keine Emotionen.";
            case 'frustrated': return "Frustriert über die Leistung.";
            case 'angry': return "Wütend! Vorsicht im Umgang.";
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-slate-900 w-full max-w-sm rounded-none border-4 border-slate-700 shadow-[8px_8px_0_0_#000] relative">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 bg-black/50 p-2 text-white hover:bg-black/80 retro-btn border-0"
                >
                    <X size={20} />
                </button>

                {/* Portrait Area - Black background for pixel art */}
                <div className="h-96 relative bg-black group border-b-4 border-slate-700">
                    {driver.portraitUrl ? (
                        <img 
                            src={driver.portraitUrl} 
                            alt={driver.name} 
                            className="w-full h-full object-contain object-bottom image-pixelated"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 flex-col">
                            <span className="text-6xl mb-4 opacity-20"><Award /></span>
                            <span className="uppercase font-bold tracking-widest text-xs retro-font">NO IMAGE</span>
                        </div>
                    )}
                    
                    {/* Mood Overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/80 px-3 py-1.5 border-2 border-slate-600">
                        {getMoodIcon(driver.mood)}
                        <span className="text-sm font-bold text-white capitalize retro-font">{driver.mood}</span>
                    </div>

                    {/* Generate Button */}
                    <button 
                        onClick={handleGeneratePortrait}
                        disabled={isGenerating}
                        className="absolute top-4 left-4 bg-slate-800 hover:bg-slate-700 p-2 border-2 border-white text-white transition-all disabled:opacity-50"
                        title="Pixel Art generieren"
                    >
                        <Camera size={20} className={isGenerating ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Info Card */}
                <div className="p-6 bg-slate-900">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-2xl font-bold text-white leading-none retro-font mb-1">{driver.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <Flag size={14} className="text-slate-400" />
                                <span className="text-slate-400 text-sm font-mono">{driver.nationality}</span>
                            </div>
                        </div>
                        <div className="text-right">
                             <div className="text-2xl font-mono font-bold text-cyan-400">{driver.skill}</div>
                             <div className="text-[10px] text-slate-500 uppercase">RATING</div>
                        </div>
                    </div>

                    <div className="bg-slate-800 p-3 border-2 border-slate-700 mb-4">
                        <p className="text-xs text-slate-300 italic font-mono">"{getMoodText(driver.mood)}"</p>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-slate-800 p-2 border border-slate-700 text-center">
                            <div className="text-[10px] text-slate-500 uppercase mb-1">AGGRO</div>
                            <div className="font-bold text-white font-mono">{driver.aggression}</div>
                        </div>
                        <div className="bg-slate-800 p-2 border border-slate-700 text-center">
                            <div className="text-[10px] text-slate-500 uppercase mb-1">TIRES</div>
                            <div className="font-bold text-white font-mono">{driver.tireManagement}</div>
                        </div>
                        <div className="bg-slate-800 p-2 border border-slate-700 text-center">
                            <div className="text-[10px] text-slate-500 uppercase mb-1">SALARY</div>
                            <div className="font-bold text-green-400 text-[10px] font-mono">${(driver.salary/1000000).toFixed(1)}M</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
