
import React, { useEffect, useState } from 'react';
import { Car, Team } from '../types';
import { ArrowUpCircle, Microscope, Factory, Wind, Lock, Loader2, Scan } from 'lucide-react';
import { COST_CAP_LIMIT } from '../constants';
import { generateCarTechImage } from '../services/geminiService';

interface CarUpgradeProps {
  team: Team;
  updateTeam: (team: Team) => void;
}

export const CarUpgrade: React.FC<CarUpgradeProps> = ({ team, updateTeam }) => {
  const BASE_COST = 500000;
  const currentCapSpent = team.costCapSpent || 0;
  const isCapBreached = currentCapSpent >= COST_CAP_LIMIT;

  // 3D Visualizer State
  const [carImage, setCarImage] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Fetch Car Image on Mount or Color Change
  useEffect(() => {
    const fetchImage = async () => {
        setIsLoadingImage(true);
        // Use timeout to prevent instant flash if cached
        const img = await generateCarTechImage(team.color, team.name);
        setCarImage(img);
        setIsLoadingImage(false);
    };
    fetchImage();
  }, [team.color, team.name]);

  // Calculate Facilities Bonuses
  const factory = team.facilities.find(f => f.type === 'factory');
  const factoryLevel = factory ? factory.level : 1;
  const costDiscount = (factoryLevel - 1) * 0.05; // 5% per level
  const currentCost = Math.floor(BASE_COST * (1 - costDiscount));

  const windTunnel = team.facilities.find(f => f.type === 'windtunnel');
  const wtLevel = windTunnel ? windTunnel.level : 1;
  const aeroBonusChance = (wtLevel - 1) * 0.1; // 10% extra chance for big gains per level

  const upgradePart = (part: keyof Car) => {
    if (team.money >= currentCost && team.car[part] < 100 && !isCapBreached) {
      // Calculate Gain
      let baseGain = Math.floor(Math.random() * 2) + 1; // 1 or 2
      
      // Wind Tunnel Bonus for Aerodynamics
      if (part === 'aerodynamics' && Math.random() < (0.2 + aeroBonusChance)) {
          baseGain += 2; // Critical success
      }
      
      // General R&D Bonus (Random critical)
      if (Math.random() < 0.1) baseGain += 1;

      updateTeam({
        ...team,
        money: team.money - currentCost,
        costCapSpent: currentCapSpent + currentCost, // Add to Budget Cap
        car: {
          ...team.car,
          [part]: Math.min(100, team.car[part] + baseGain)
        }
      });
    }
  };

  const renderPart = (label: string, part: keyof Car, icon: React.ReactNode) => (
    <div className="bg-slate-800 p-4 rounded-xl mb-4 border border-slate-700 relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 bg-white/5 rounded-full transform translate-x-1/3 -translate-y-1/3 transition-transform group-hover:scale-110"></div>
      
      <div className="flex justify-between items-center mb-2 relative z-10">
        <div className="flex items-center gap-2">
            <div className="text-slate-400">{icon}</div>
            <span className="text-lg font-bold text-slate-200">{label}</span>
        </div>
        <span className="text-2xl font-mono text-cyan-400">{team.car[part]}</span>
      </div>
      
      <div className="w-full bg-slate-700 h-2 rounded-full mb-4 relative z-10">
        <div 
          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500 relative"
          style={{ width: `${team.car[part]}%` }}
        >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg shadow-cyan-500/50"></div>
        </div>
      </div>
      
      <button
        onClick={() => upgradePart(part)}
        disabled={team.money < currentCost || team.car[part] >= 100 || isCapBreached}
        className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 relative z-10 transition-all active:scale-95 ${
          team.money >= currentCost && team.car[part] < 100 && !isCapBreached
            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/50'
            : 'bg-slate-700 text-slate-500 cursor-not-allowed'
        }`}
      >
        {isCapBreached ? (
            <>
                <Lock size={20} /> Budget Cap Erreicht
            </>
        ) : (
            <>
                <Microscope size={20} />
                Entwickeln (${(currentCost/1000).toFixed(0)}k)
            </>
        )}
      </button>
    </div>
  );

  return (
    <div className="p-4 pb-24 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-2xl font-bold italic tracking-tighter uppercase text-white">R&D Center</h1>
                <p className="text-slate-400 text-xs">Forschung & Entwicklung</p>
            </div>
            <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
                <span className="font-mono font-bold text-green-400">${(team.money/1000000).toFixed(2)}M</span>
            </div>
        </div>

        {/* 3D Visualizer Container */}
        <div className="mb-8 rounded-2xl overflow-hidden border border-slate-600 shadow-2xl relative bg-slate-950 aspect-video group">
            
            {/* Overlay UI */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</span>
                <span className="text-xs font-mono text-cyan-400">WIND TUNNEL CAM 01</span>
            </div>

            <div className="absolute bottom-4 left-4 z-20">
                <div className="text-[10px] text-slate-500 font-mono">MODEL: APX-25</div>
                <div className="text-xs font-bold text-white uppercase">{team.name} CONFIG</div>
            </div>

            <div className="absolute top-4 right-4 z-20">
                <Scan className="text-cyan-500 opacity-50" size={24} />
            </div>

            {/* Scanlines Effect */}
            <div className="absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none"></div>

            {/* Image Content */}
            {isLoadingImage ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-cyan-400">
                    <Loader2 size={48} className="animate-spin mb-4" />
                    <span className="font-mono text-xs uppercase animate-pulse">Rendering 3D Model...</span>
                    <span className="text-[10px] text-slate-500 mt-1">Applying Texture: {team.color}</span>
                </div>
            ) : carImage ? (
                <img 
                    src={carImage} 
                    alt="3D Car Render" 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-900">
                    <Wind size={48} className="text-slate-700" />
                </div>
            )}
        </div>

        {/* Bonus Info Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex flex-col items-center text-center">
                <Factory size={20} className="text-green-400 mb-1" />
                <div className="text-xs text-slate-400 uppercase font-bold">Produktion</div>
                <div className="text-lg font-bold text-white">-{Math.round(costDiscount * 100)}%</div>
                <div className="text-[10px] text-slate-500">Kosten Rabatt</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 p-3 rounded-lg flex flex-col items-center text-center">
                <Wind size={20} className="text-cyan-400 mb-1" />
                <div className="text-xs text-slate-400 uppercase font-bold">Windkanal</div>
                <div className="text-lg font-bold text-white">Lvl {wtLevel}</div>
                <div className="text-[10px] text-slate-500">Aero Effizienz</div>
            </div>
        </div>

        {isCapBreached && (
            <div className="mb-6 bg-red-900/40 border border-red-500 p-4 rounded-xl flex items-center gap-3">
                <Lock size={24} className="text-red-500 shrink-0" />
                <div className="text-sm">
                    <strong className="text-red-400 block mb-1">Entwicklung gestoppt</strong>
                    Du hast das Budget Limit von $135M erreicht. Es können keine neuen Teile mehr entwickelt werden.
                </div>
            </div>
        )}

      <div className="space-y-2">
        {renderPart('Aerodynamik', 'aerodynamics', <Wind size={18}/>)}
        {renderPart('Motor', 'engine', <ArrowUpCircle size={18}/>)}
        {renderPart('Chassis', 'chassis', <Factory size={18}/>)}
        {renderPart('Zuverlässigkeit', 'reliability', <ArrowUpCircle size={18}/>)}
      </div>
    </div>
  );
};
