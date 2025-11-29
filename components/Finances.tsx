
import React, { useState } from 'react';
import { Team, Sponsor } from '../types';
import { AVAILABLE_SPONSORS, COST_CAP_LIMIT } from '../constants';
import { DollarSign, PieChart, TrendingUp, ShieldCheck, Briefcase, Plus, AlertTriangle } from 'lucide-react';

interface FinancesProps {
    team: Team;
    updateTeam: (team: Team) => void;
}

export const Finances: React.FC<FinancesProps> = ({ team, updateTeam }) => {
    const [showSponsorModal, setShowSponsorModal] = useState(false);

    const spentPercentage = ((team.costCapSpent || 0) / COST_CAP_LIMIT) * 100;
    
    // Calculate Weekly finances
    const driverCosts = team.drivers.reduce((acc, d) => acc + d.salary, 0);
    const staffCosts = team.staff.reduce((acc, s) => acc + s.salary, 0);
    const sponsorIncome = team.sponsors.reduce((acc, s) => acc + s.perRaceIncome, 0);
    
    // Simplified: Assume costs are per season, but we show "per race" estimate (Season ~ 23 races)
    const estimatedExpensesPerRace = Math.floor((driverCosts + staffCosts) / 23);
    const netPerRace = sponsorIncome - estimatedExpensesPerRace;

    const signSponsor = (sponsor: Sponsor) => {
        if (team.sponsors.length >= 3) return;
        
        updateTeam({
            ...team,
            money: team.money + sponsor.signingBonus,
            sponsors: [...team.sponsors, sponsor]
        });
        setShowSponsorModal(false);
    };

    return (
        <div className="p-4 pb-24 animate-fade-in">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold uppercase italic text-white">Finanzen</h2>
                <div className="bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-2">
                    <DollarSign size={14} className="text-green-400" />
                    <span className="font-mono font-bold text-green-400">{team.money.toLocaleString()}</span>
                </div>
            </div>

            {/* COST CAP WIDGET */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-6 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="text-purple-400" size={24} />
                    <h3 className="text-lg font-bold text-white">Budget Cap 2025</h3>
                </div>
                
                <div className="mb-2 flex justify-between text-sm">
                    <span className="text-slate-400">Ausgegeben (OpEx)</span>
                    <span className={`font-mono font-bold ${spentPercentage > 90 ? 'text-red-500' : 'text-white'}`}>
                        ${(team.costCapSpent || 0).toLocaleString()} / ${(COST_CAP_LIMIT).toLocaleString()}
                    </span>
                </div>
                
                <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden border border-slate-700 mb-4">
                    <div 
                        className={`h-full transition-all duration-1000 ${spentPercentage > 90 ? 'bg-red-600' : 'bg-gradient-to-r from-green-500 to-purple-500'}`}
                        style={{ width: `${Math.min(100, spentPercentage)}%` }}
                    ></div>
                </div>

                {spentPercentage >= 100 ? (
                    <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <p className="text-xs text-red-200">
                            <strong>Limit überschritten!</strong> Entwicklung (R&D) und Produktion sind eingefroren. Du kannst keine neuen Teile mehr entwickeln.
                        </p>
                    </div>
                ) : (
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Enthält: Auto-Entwicklung, Teile-Produktion.<br/>
                        Ausgenommen: Fahrergehälter, Marketing, Gebäude & Top-Personal.
                    </p>
                )}
            </div>

            {/* SPONSORS */}
            <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <TrendingUp size={18} className="text-cyan-400"/> Sponsoren
                    </h3>
                    <span className="text-xs text-slate-500">{team.sponsors.length}/3 Slots</span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {team.sponsors.map((s, i) => (
                        <div key={i} className="bg-slate-800 p-4 rounded-xl border-l-4 flex justify-between items-center" style={{ borderLeftColor: s.logoColor }}>
                            <div>
                                <div className="font-bold text-white">{s.name}</div>
                                <div className="text-xs text-slate-400 uppercase">{s.type === 'title' ? 'Hauptsponsor' : 'Partner'}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-green-400 font-mono font-bold">+${s.perRaceIncome.toLocaleString()}</div>
                                <div className="text-[10px] text-slate-500">pro Rennen</div>
                            </div>
                        </div>
                    ))}

                    {team.sponsors.length < 3 && (
                        <button 
                            onClick={() => setShowSponsorModal(true)}
                            className="bg-slate-800/50 border border-dashed border-slate-600 p-4 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:border-slate-400 transition-colors"
                        >
                            <Plus size={20} /> Sponsor hinzufügen
                        </button>
                    )}
                </div>
            </div>

            {/* SUMMARY */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Finanzbericht (Pro Rennen)</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-300">Sponsoren Einnahmen</span>
                        <span className="text-green-400 font-mono">+${sponsorIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-300">Geschätzte Kosten (Gehälter)</span>
                        <span className="text-red-400 font-mono">-${estimatedExpensesPerRace.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-2 flex justify-between font-bold">
                        <span className="text-white">Netto Profit</span>
                        <span className={`font-mono ${netPerRace >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {netPerRace >= 0 ? '+' : ''}${netPerRace.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* SPONSOR MODAL */}
            {showSponsorModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl p-6 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-white">Sponsor wählen</h2>
                            <button onClick={() => setShowSponsorModal(false)} className="text-slate-400 hover:text-white">Schließen</button>
                        </div>
                        <div className="space-y-3">
                            {AVAILABLE_SPONSORS.filter(s => !team.sponsors.find(ts => ts.id === s.id)).map(s => (
                                <div key={s.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-lg text-white" style={{ color: s.logoColor }}>{s.name}</div>
                                        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-white uppercase">{s.type}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                        <div>
                                            <div className="text-slate-400 text-xs">Sign-on Bonus</div>
                                            <div className="font-mono text-green-400 font-bold">${s.signingBonus.toLocaleString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-slate-400 text-xs">Pro Rennen</div>
                                            <div className="font-mono text-white font-bold">${s.perRaceIncome.toLocaleString()}</div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => signSponsor(s)}
                                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                                    >
                                        <Briefcase size={16} /> Vertrag unterschreiben
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
