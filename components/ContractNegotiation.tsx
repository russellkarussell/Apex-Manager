
import React, { useState } from 'react';
import { Driver, ContractNegotiation as ContractNegotiationType, Team } from '../types';
import { FileText, DollarSign, Clock, ThumbsUp, ThumbsDown, AlertTriangle, Handshake, X } from 'lucide-react';

interface ContractNegotiationProps {
  driver: Driver;
  team: Team;
  onAccept: (driver: Driver, salary: number, years: number, bonus: number) => void;
  onReject: () => void;
  onClose: () => void;
}

const generateNegotiation = (driver: Driver, team: Team): ContractNegotiationType => {
  const moodMultiplier = {
    'ecstatic': 0.8,
    'happy': 0.9,
    'neutral': 1.0,
    'frustrated': 1.2,
    'angry': 1.5
  };

  const multiplier = moodMultiplier[driver.mood];
  const baseSalary = driver.salary || 500000;
  const demandedSalary = Math.floor(baseSalary * multiplier * (1 + (driver.skill / 200)));
  const demandedBonus = Math.floor(demandedSalary * 0.5);
  
  const moodHappiness = {
    'ecstatic': 95,
    'happy': 80,
    'neutral': 60,
    'frustrated': 35,
    'angry': 15
  };

  const teamPerformanceBonus = Math.min(30, (team.car.aerodynamics + team.car.engine) / 6);
  const happiness = Math.min(100, moodHappiness[driver.mood] + teamPerformanceBonus);

  const demands: string[] = [];
  if (driver.skill >= 85) demands.push('Nummer-1-Fahrerstatus');
  if (driver.mood === 'frustrated' || driver.mood === 'angry') {
    demands.push('Besseres Auto versprochen');
  }
  if (Math.random() > 0.5) demands.push('Performance-Boni erhöhen');
  if (driver.skill >= 90) demands.push('Keine Team-Orders');

  return {
    driverId: driver.id,
    driverName: driver.name,
    currentSalary: baseSalary,
    demandedSalary,
    demandedBonus,
    demandedYears: driver.skill >= 85 ? 3 : 2,
    happiness,
    demands
  };
};

export const ContractNegotiation: React.FC<ContractNegotiationProps> = ({ 
  driver, 
  team, 
  onAccept, 
  onReject,
  onClose 
}) => {
  const [negotiation] = useState(() => generateNegotiation(driver, team));
  const [offeredSalary, setOfferedSalary] = useState(negotiation.demandedSalary);
  const [offeredYears, setOfferedYears] = useState(negotiation.demandedYears);
  const [offeredBonus, setOfferedBonus] = useState(negotiation.demandedBonus);
  const [negotiationResult, setNegotiationResult] = useState<'pending' | 'success' | 'failed'>('pending');
  const [resultMessage, setResultMessage] = useState('');

  const calculateAcceptanceChance = () => {
    let chance = negotiation.happiness;
    
    const salaryDiff = (offeredSalary - negotiation.demandedSalary) / negotiation.demandedSalary;
    chance += salaryDiff * 50;
    
    const yearsDiff = offeredYears - negotiation.demandedYears;
    chance += yearsDiff * 10;
    
    const bonusDiff = (offeredBonus - negotiation.demandedBonus) / negotiation.demandedBonus;
    chance += bonusDiff * 20;
    
    return Math.min(100, Math.max(5, Math.floor(chance)));
  };

  const acceptanceChance = calculateAcceptanceChance();

  const handleNegotiate = () => {
    const roll = Math.random() * 100;
    if (roll < acceptanceChance) {
      setNegotiationResult('success');
      setResultMessage(`${driver.name} akzeptiert das Angebot!`);
    } else {
      if (roll < acceptanceChance + 30) {
        setNegotiationResult('failed');
        setResultMessage(`${driver.name} lehnt ab, aber ist offen für ein besseres Angebot.`);
      } else {
        setNegotiationResult('failed');
        setResultMessage(`${driver.name} bricht die Verhandlungen ab!`);
      }
    }
  };

  const handleConfirmAccept = () => {
    onAccept(driver, offeredSalary, offeredYears, offeredBonus);
  };

  const totalCost = (offeredSalary * offeredYears) + offeredBonus;
  const canAfford = team.money >= offeredBonus;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-md rounded-xl border-2 border-slate-700 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText size={24} />
            <div>
              <h2 className="font-bold text-lg">Vertragsverhandlung</h2>
              <p className="text-sm opacity-80">{driver.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {negotiationResult === 'pending' && (
          <div className="p-4 space-y-4">
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400">Fahrer-Zufriedenheit</span>
                <span className={`font-bold ${
                  negotiation.happiness > 70 ? 'text-green-400' : 
                  negotiation.happiness > 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>{negotiation.happiness}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    negotiation.happiness > 70 ? 'bg-green-500' : 
                    negotiation.happiness > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${negotiation.happiness}%` }}
                />
              </div>
            </div>

            {negotiation.demands.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-sm font-bold text-yellow-400 mb-2">Forderungen:</p>
                <ul className="text-sm text-yellow-300/80 space-y-1">
                  {negotiation.demands.map((demand, i) => (
                    <li key={i}>• {demand}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Jahresgehalt</span>
                  <span className="font-mono text-green-400">${(offeredSalary/1000000).toFixed(2)}M</span>
                </div>
                <input
                  type="range"
                  min={negotiation.demandedSalary * 0.5}
                  max={negotiation.demandedSalary * 1.5}
                  step={50000}
                  value={offeredSalary}
                  onChange={e => setOfferedSalary(Number(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <p className="text-xs text-slate-500">Gefordert: ${(negotiation.demandedSalary/1000000).toFixed(2)}M</p>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Vertragslaufzeit</span>
                  <span className="font-mono text-cyan-400">{offeredYears} Jahre</span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(years => (
                    <button
                      key={years}
                      onClick={() => setOfferedYears(years)}
                      className={`flex-1 py-2 rounded-lg font-bold ${
                        offeredYears === years 
                          ? 'bg-cyan-600 text-white' 
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {years}J
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Signing Bonus</span>
                  <span className="font-mono text-purple-400">${(offeredBonus/1000000).toFixed(2)}M</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={negotiation.demandedBonus * 2}
                  step={50000}
                  value={offeredBonus}
                  onChange={e => setOfferedBonus(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>

            <div className="bg-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Gesamtkosten</span>
                <span className={`font-bold font-mono ${canAfford ? 'text-white' : 'text-red-400'}`}>
                  ${(totalCost/1000000).toFixed(2)}M
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Erfolgschance</span>
                <span className={`font-bold text-lg ${
                  acceptanceChance > 70 ? 'text-green-400' : 
                  acceptanceChance > 40 ? 'text-yellow-400' : 'text-red-400'
                }`}>{acceptanceChance}%</span>
              </div>
            </div>

            {!canAfford && (
              <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertTriangle size={16} className="text-red-400" />
                <span className="text-sm text-red-400">Nicht genug Budget für Signing Bonus!</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onReject}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
              >
                <ThumbsDown size={18} />
                Ablehnen
              </button>
              <button
                onClick={handleNegotiate}
                disabled={!canAfford}
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 text-white py-3 rounded-lg flex items-center justify-center gap-2 font-bold"
              >
                <Handshake size={18} />
                Anbieten
              </button>
            </div>
          </div>
        )}

        {negotiationResult !== 'pending' && (
          <div className="p-6 text-center">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
              negotiationResult === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'
            }`}>
              {negotiationResult === 'success' 
                ? <ThumbsUp size={32} className="text-green-400" />
                : <ThumbsDown size={32} className="text-red-400" />
              }
            </div>
            <h3 className={`text-xl font-bold mb-2 ${
              negotiationResult === 'success' ? 'text-green-400' : 'text-red-400'
            }`}>
              {negotiationResult === 'success' ? 'Vertrag akzeptiert!' : 'Verhandlung gescheitert'}
            </h3>
            <p className="text-slate-400 mb-6">{resultMessage}</p>
            
            {negotiationResult === 'success' ? (
              <button
                onClick={handleConfirmAccept}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold"
              >
                Vertrag unterschreiben
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setNegotiationResult('pending')}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg"
                >
                  Neues Angebot
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg"
                >
                  Abbrechen
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
