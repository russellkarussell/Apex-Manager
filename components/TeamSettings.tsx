
import React, { useState } from 'react';
import { Team } from '../types';
import { Check, X, Car as CarIcon, PaintBucket } from 'lucide-react';

interface TeamSettingsProps {
  team: Team;
  onSave: (name: string, color: string) => void;
  onClose: () => void;
}

const COLORS = [
  { name: 'Ferrari Red', hex: '#ef4444' },
  { name: 'Red Bull Blue', hex: '#1d4ed8' },
  { name: 'Mercedes Teal', hex: '#14b8a6' },
  { name: 'Papaya Orange', hex: '#f97316' },
  { name: 'Aston Green', hex: '#047857' },
  { name: 'Alpine Pink', hex: '#ec4899' },
  { name: 'Haas Black', hex: '#1e293b' },
  { name: 'Williams Blue', hex: '#3b82f6' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Purple', hex: '#9333ea' },
];

export const TeamSettings: React.FC<TeamSettingsProps> = ({ team, onSave, onClose }) => {
  const [name, setName] = useState(team.name);
  const [selectedColor, setSelectedColor] = useState(team.color);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold uppercase italic text-white flex items-center gap-2">
            <PaintBucket size={20} className="text-cyan-400" /> Team Design
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Preview Card */}
        <div className="mb-6 bg-slate-800 rounded-xl p-6 flex flex-col items-center justify-center border-t-4 shadow-lg transition-colors duration-300" style={{ borderTopColor: selectedColor }}>
            <div className="w-full flex justify-between items-start mb-4 opacity-50">
                <div className="text-xs font-mono">LIVERY PREVIEW 2025</div>
                <div className="text-xs font-mono">CHASSIS APX-25</div>
            </div>
            
            <CarIcon size={64} style={{ color: selectedColor }} className="drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
            
            <h3 className="text-2xl font-bold mt-4 uppercase italic tracking-tighter">{name || "Team Name"}</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 uppercase font-bold mb-1 block">Team Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 font-bold"
              placeholder="z.B. Apex Racing"
              maxLength={20}
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase font-bold mb-2 block">Team Farbe</label>
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  className={`w-full aspect-square rounded-full border-2 flex items-center justify-center transition-transform active:scale-95 ${selectedColor === c.hex ? 'border-white scale-110 shadow-lg shadow-white/20' : 'border-transparent hover:scale-105'}`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {selectedColor === c.hex && <Check size={16} className="text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={() => onSave(name, selectedColor)}
          className="w-full mt-8 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2"
        >
          <Check size={20} /> Speichern & Übernehmen
        </button>
      </div>
    </div>
  );
};
