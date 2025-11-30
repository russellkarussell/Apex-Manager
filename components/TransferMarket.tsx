
import React, { useState, useEffect } from 'react';
import { Driver, Team, TransferRumor, TransferOffer } from '../types';
import { AVAILABLE_DRIVERS, TEAMS } from '../constants';
import { Users, TrendingUp, ArrowRightLeft, DollarSign, Star, AlertCircle, CheckCircle, XCircle, Newspaper, UserPlus } from 'lucide-react';

interface TransferMarketProps {
  playerTeam: Team;
  currentRace: number;
  allTeams: Team[];
  onSignDriver: (driver: Driver, offer: TransferOffer) => void;
  updateTeam: (team: Team) => void;
}

const generateRumors = (currentRace: number, allTeams: Team[]): TransferRumor[] => {
  const rumors: TransferRumor[] = [];
  const availableDrivers = AVAILABLE_DRIVERS.filter(d => !d.teamId || d.isOnMarket);
  
  for (let i = 0; i < 3; i++) {
    if (Math.random() > 0.4) {
      const driver = availableDrivers[Math.floor(Math.random() * availableDrivers.length)];
      const fromTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)];
      let toTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)];
      while (toTeam.id === fromTeam.id) {
        toTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)];
      }
      
      rumors.push({
        id: `rumor_${currentRace}_${i}`,
        driverId: driver.id,
        driverName: driver.name,
        fromTeamId: fromTeam.id,
        fromTeamName: fromTeam.name,
        toTeamId: toTeam.id,
        toTeamName: toTeam.name,
        likelihood: Math.floor(Math.random() * 60) + 20,
        fee: (driver.marketValue || 5000000) * (0.8 + Math.random() * 0.4),
        type: Math.random() > 0.8 ? 'confirmed' : 'rumor',
        createdAtRace: currentRace
      });
    }
  }
  
  return rumors;
};

export const TransferMarket: React.FC<TransferMarketProps> = ({ 
  playerTeam, 
  currentRace, 
  allTeams,
  onSignDriver,
  updateTeam 
}) => {
  const [activeTab, setActiveTab] = useState<'market' | 'rumors' | 'offers'>('market');
  const [rumors, setRumors] = useState<TransferRumor[]>([]);
  const [pendingOffers, setPendingOffers] = useState<TransferOffer[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    setRumors(generateRumors(currentRace, allTeams));
  }, [currentRace]);

  const availableDrivers = AVAILABLE_DRIVERS.filter(d => {
    const isInPlayerTeam = playerTeam.drivers.some(pd => pd.id === d.id);
    return !isInPlayerTeam && (d.isOnMarket || !d.teamId);
  });

  const handleMakeOffer = (driver: Driver) => {
    if (playerTeam.drivers.length >= 2) return;
    
    const offer: TransferOffer = {
      id: `offer_${Date.now()}`,
      driverId: driver.id,
      driverName: driver.name,
      fromTeamId: driver.teamId || 'free',
      toTeamId: playerTeam.id,
      offeredSalary: driver.salary * 1.1,
      signingBonus: Math.floor((driver.marketValue || 5000000) * 0.1),
      contractYears: 2,
      status: 'pending'
    };
    
    setTimeout(() => {
      const accepted = Math.random() > 0.4;
      if (accepted) {
        offer.status = 'accepted';
        onSignDriver(driver, offer);
      } else {
        offer.status = 'rejected';
      }
      setPendingOffers(prev => prev.map(o => o.id === offer.id ? offer : o));
    }, 2000);
    
    setPendingOffers(prev => [...prev, offer]);
    setSelectedDriver(null);
  };

  const getSkillColor = (skill: number) => {
    if (skill >= 90) return 'text-purple-400';
    if (skill >= 80) return 'text-green-400';
    if (skill >= 70) return 'text-cyan-400';
    if (skill >= 60) return 'text-yellow-400';
    return 'text-slate-400';
  };

  return (
    <div className="h-full bg-slate-900 text-white p-4 pb-24 animate-fade-in overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <ArrowRightLeft className="text-green-400" size={28} />
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">Transfer-Markt</h1>
          <p className="text-slate-400 text-sm">Saison 2025 • Rennen {currentRace + 1}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'market', label: 'Markt', icon: Users },
          { id: 'rumors', label: 'Gerüchte', icon: Newspaper },
          { id: 'offers', label: 'Angebote', icon: DollarSign }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-cyan-600 text-white' 
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
            {tab.id === 'offers' && pendingOffers.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 rounded-full">
                {pendingOffers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'market' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Verfügbare Fahrer</p>
            <p className="text-xs text-slate-500">
              Dein Team: {playerTeam.drivers.length}/2 Fahrer
            </p>
          </div>

          {availableDrivers.map(driver => (
            <div 
              key={driver.id}
              className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{driver.name}</h3>
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">
                      {driver.nationality}
                    </span>
                    {driver.isOnMarket && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                        Verfügbar
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400">
                    Marktwert: <span className="text-green-400 font-mono">
                      ${((driver.marketValue || 5000000) / 1000000).toFixed(1)}M
                    </span>
                  </p>
                </div>
                <div className={`text-2xl font-bold ${getSkillColor(driver.skill)}`}>
                  {driver.skill}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Skill</p>
                  <p className={`font-bold ${getSkillColor(driver.skill)}`}>{driver.skill}</p>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Aggression</p>
                  <p className="font-bold text-orange-400">{driver.aggression}</p>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg text-center">
                  <p className="text-xs text-slate-500">Reifen</p>
                  <p className="font-bold text-cyan-400">{driver.tireManagement}</p>
                </div>
              </div>

              {driver.contract && (
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  <span>Gehalt: ${(driver.contract.salaryPerYear / 1000000).toFixed(1)}M/Jahr</span>
                  <span>Vertrag: {driver.contract.yearsRemaining} Jahr(e)</span>
                </div>
              )}

              <button
                onClick={() => handleMakeOffer(driver)}
                disabled={playerTeam.drivers.length >= 2 || playerTeam.money < (driver.marketValue || 5000000) * 0.1}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg flex items-center justify-center gap-2 font-bold"
              >
                <UserPlus size={18} />
                Angebot machen
              </button>
            </div>
          ))}

          {availableDrivers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Users size={48} className="mx-auto mb-4 opacity-50" />
              <p>Keine Fahrer auf dem Markt verfügbar</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'rumors' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400 mb-4">
            Aktuelle Transfer-Gerüchte aus dem Paddock
          </p>

          {rumors.map(rumor => (
            <div 
              key={rumor.id}
              className={`bg-slate-800 rounded-xl p-4 border ${
                rumor.type === 'confirmed' ? 'border-green-500/50' : 'border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {rumor.type === 'confirmed' ? (
                    <CheckCircle size={16} className="text-green-400" />
                  ) : (
                    <AlertCircle size={16} className="text-yellow-400" />
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    rumor.type === 'confirmed' 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {rumor.type === 'confirmed' ? 'Bestätigt' : 'Gerücht'}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {rumor.likelihood}% Wahrscheinlichkeit
                </span>
              </div>

              <p className="text-white mb-2">
                <strong className="text-cyan-400">{rumor.driverName}</strong> könnte von{' '}
                <span className="text-slate-400">{rumor.fromTeamName}</span> zu{' '}
                <span className="text-green-400">{rumor.toTeamName}</span> wechseln
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>Ablöse: ~${(rumor.fee / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          ))}

          {rumors.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <Newspaper size={48} className="mx-auto mb-4 opacity-50" />
              <p>Noch keine Gerüchte diese Woche</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'offers' && (
        <div className="space-y-4">
          <p className="text-sm text-slate-400 mb-4">
            Deine ausgehenden Transfer-Angebote
          </p>

          {pendingOffers.map(offer => (
            <div 
              key={offer.id}
              className={`bg-slate-800 rounded-xl p-4 border ${
                offer.status === 'accepted' ? 'border-green-500/50' :
                offer.status === 'rejected' ? 'border-red-500/50' :
                'border-yellow-500/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold">{offer.driverName}</h3>
                <span className={`text-xs px-2 py-1 rounded font-bold ${
                  offer.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                  offer.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {offer.status === 'accepted' && <><CheckCircle size={12} className="inline mr-1" />Akzeptiert</>}
                  {offer.status === 'rejected' && <><XCircle size={12} className="inline mr-1" />Abgelehnt</>}
                  {offer.status === 'pending' && 'Ausstehend...'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Gehalt</p>
                  <p className="font-mono text-green-400">${(offer.offeredSalary / 1000000).toFixed(2)}M</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Bonus</p>
                  <p className="font-mono text-purple-400">${(offer.signingBonus / 1000000).toFixed(2)}M</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs">Laufzeit</p>
                  <p className="font-mono text-cyan-400">{offer.contractYears} Jahre</p>
                </div>
              </div>
            </div>
          ))}

          {pendingOffers.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
              <p>Keine aktiven Angebote</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
