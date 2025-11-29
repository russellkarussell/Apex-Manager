
import React, { useState } from 'react';
import { Team, Staff, JuniorDriver, Facility } from '../types';
import { AVAILABLE_STAFF, INITIAL_FACILITIES } from '../constants';
import { GraduationCap, Lock, ArrowUpCircle, UserPlus, Briefcase, Building2, TrendingUp, Users } from 'lucide-react';

interface HeadquartersProps {
  team: Team;
  updateTeam: (team: Team) => void;
}

export const Headquarters: React.FC<HeadquartersProps> = ({ team, updateTeam }) => {
  const [activeTab, setActiveTab] = useState<'facilities' | 'staff' | 'academy'>('facilities');

  const facilities = team.facilities.length > 0 ? team.facilities : INITIAL_FACILITIES;

  const upgradeFacility = (id: string) => {
    const facility = facilities.find(f => f.id === id);
    if (!facility) return;
    const cost = Math.floor(facility.cost * Math.pow(1.5, facility.level - 1));

    if (team.money >= cost) {
      const updatedFacilities = facilities.map(f => f.id === id ? { ...f, level: f.level + 1 } : f);
      updateTeam({ ...team, money: team.money - cost, facilities: updatedFacilities });
    }
  };

  const hireStaff = (staffMember: Staff) => {
    if (team.money < staffMember.salary) return;
    const newStaffList = team.staff.filter(s => s.role !== staffMember.role);
    newStaffList.push({ ...staffMember, hired: true });
    updateTeam({ ...team, money: team.money - staffMember.salary, staff: newStaffList });
  };

  const promoteJunior = (junior: JuniorDriver) => {
    if (team.drivers.length >= 2) return;
    const newJuniors = team.juniors.filter(j => j.id !== junior.id);
    const newDriver = {
        id: junior.id,
        name: junior.name,
        skill: junior.currentSkill,
        aggression: 50 + Math.floor(Math.random() * 30),
        tireManagement: 50 + Math.floor(Math.random() * 30),
        salary: 500000,
        teamId: team.id,
        image: `https://picsum.photos/100/100?random=${junior.id}`,
        mood: 'happy' as const,
        nationality: 'UNK'
    };
    updateTeam({ ...team, juniors: newJuniors, drivers: [...team.drivers, newDriver] });
  };

  const generateJunior = () => {
      if (team.money < 250000) return;
      const id = Math.random().toString(36).substr(2, 9);
      const newJunior: JuniorDriver = {
          id: `jun_${id}`,
          name: `Junior ${id.substring(0,3).toUpperCase()}`,
          age: 16 + Math.floor(Math.random() * 5),
          potential: 70 + Math.floor(Math.random() * 30),
          currentSkill: 50 + Math.floor(Math.random() * 20),
          funding: 0
      };
      updateTeam({ ...team, money: team.money - 250000, juniors: [...team.juniors, newJunior] });
  };

  const renderFacilities = () => (
    <div className="space-y-4">
        {facilities.map((fac) => {
            const cost = Math.floor(fac.cost * Math.pow(1.5, fac.level - 1));
            const canAfford = team.money >= cost;
            
            return (
                <div key={fac.id} className="retro-box p-4 bg-slate-800 relative group">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-700 border-2 border-slate-500 flex items-center justify-center">
                                <Building2 size={20} className="text-slate-400" />
                            </div>
                            <div>
                                <h3 className="retro-font text-white uppercase text-sm leading-none mb-1">{fac.name}</h3>
                                <div className="text-xs font-mono text-cyan-400">LEVEL {fac.level}</div>
                            </div>
                        </div>
                    </div>
                    
                    <p className="text-xs text-slate-400 font-mono mb-4 border-l-2 border-slate-600 pl-2">
                        {fac.description}
                    </p>
                    
                    <div className="bg-slate-900/50 p-2 mb-4 border border-slate-700 flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Effect</span>
                        <span className="text-xs text-green-400 font-mono font-bold">{fac.benefit}</span>
                    </div>

                    <button 
                        onClick={() => upgradeFacility(fac.id)}
                        disabled={!canAfford}
                        className={`retro-btn w-full py-3 flex justify-between px-4 items-center ${canAfford ? 'hover:bg-slate-700' : 'opacity-50'}`}
                    >
                        <span className="text-xs">UPGRADE</span>
                        <span className={`text-xs font-mono ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
                            ${(cost/1000000).toFixed(2)}M
                        </span>
                    </button>
                </div>
            );
        })}
    </div>
  );

  const renderStaff = () => (
    <div className="space-y-6">
        <div className="retro-box p-4 bg-slate-800 mb-6">
            <h3 className="retro-font text-white text-sm mb-4 border-b-2 border-slate-600 pb-2">CURRENT STAFF</h3>
            {team.staff.length === 0 ? (
                <div className="text-slate-500 text-xs font-mono text-center py-4">NO STAFF HIRED</div>
            ) : (
                <div className="space-y-3">
                    {team.staff.map(s => (
                        <div key={s.id} className="bg-slate-900 border border-slate-700 p-3 flex justify-between items-center">
                            <div>
                                <div className="retro-font text-[10px] text-slate-400 uppercase mb-1">{s.role}</div>
                                <div className="text-white text-sm font-bold">{s.name}</div>
                            </div>
                            <div className="text-[10px] bg-green-900 text-green-300 px-2 py-1 font-mono border border-green-700">
                                {s.bonusDescription}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        <div className="retro-box p-4 bg-slate-800">
             <h3 className="retro-font text-white text-sm mb-4 border-b-2 border-slate-600 pb-2">HIRING MARKET</h3>
             <div className="space-y-4">
                {AVAILABLE_STAFF.filter(s => !team.staff.find(ts => ts.id === s.id)).slice(0, 3).map(s => (
                    <div key={s.id} className="bg-slate-900 border border-slate-700 p-3">
                        <div className="flex justify-between items-start mb-2">
                             <div>
                                 <div className="retro-font text-[10px] text-cyan-500 uppercase">{s.role}</div>
                                 <div className="text-white font-bold">{s.name}</div>
                             </div>
                             <div className="flex gap-1">
                                 {[...Array(s.rating)].map((_, i) => <div key={i} className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>)}
                             </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono mb-3">{s.bonusDescription}</p>
                        <button 
                            onClick={() => hireStaff(s)} 
                            disabled={team.money < s.salary} 
                            className="retro-btn w-full py-2 text-xs text-white flex justify-between px-3"
                        >
                            <span>HIRE</span>
                            <span>${(s.salary/1000000).toFixed(1)}M</span>
                        </button>
                    </div>
                ))}
             </div>
        </div>
    </div>
  );

  const renderAcademy = () => (
    <div className="space-y-4">
        <div className="retro-box p-6 text-center bg-slate-800">
            <GraduationCap size={48} className="mx-auto text-slate-500 mb-4" />
            <h3 className="retro-font text-white mb-2">JUNIOR PROGRAM</h3>
            <p className="text-xs text-slate-400 font-mono mb-6 max-w-[200px] mx-auto">
                Invest in scouting to find the next world champion.
            </p>
            <button 
                onClick={generateJunior}
                disabled={team.money < 250000}
                className="retro-btn w-full py-3 text-white text-xs flex justify-center gap-2 items-center"
            >
                <UserPlus size={16} /> SCOUT TALENT ($250k)
            </button>
        </div>

        {team.juniors.length > 0 && (
            <>
                <h3 className="retro-font text-slate-400 text-xs mt-6 mb-2 ml-1">SCOUTED DRIVERS</h3>
                {team.juniors.map(junior => (
                    <div key={junior.id} className="retro-box p-4 bg-slate-800 flex justify-between items-center">
                        <div>
                            <div className="retro-font text-white text-sm">{junior.name}</div>
                            <div className="flex gap-3 mt-1 text-[10px] font-mono text-slate-400">
                                <span>AGE: {junior.age}</span>
                                <span className="text-yellow-400">POT: {junior.potential}</span>
                            </div>
                        </div>
                        <button 
                            onClick={() => promoteJunior(junior)} 
                            disabled={team.drivers.length >= 2} 
                            className="retro-btn px-3 py-2 text-[10px] text-cyan-300 border-cyan-700"
                        >
                            PROMOTE
                        </button>
                    </div>
                ))}
            </>
        )}
    </div>
  );

  return (
    <div className="p-4 pb-24 animate-fade-in font-mono">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 border-b-4 border-white pb-2 bg-[#2d1b2e] p-3 shadow-[4px_4px_0_#000]">
            <h2 className="text-xl retro-font text-white">HEADQUARTERS</h2>
            <div className="font-mono text-green-400 text-sm">${team.money.toLocaleString()}</div>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 border-b-4 border-slate-700 bg-slate-900">
            <button 
                onClick={() => setActiveTab('facilities')} 
                className={`flex-1 py-3 retro-font text-xs flex items-center justify-center gap-2 border-r-2 border-slate-700 ${activeTab === 'facilities' ? 'bg-slate-700 text-yellow-400' : 'text-slate-500'}`}
            >
                <Building2 size={14} /> FACILITIES
            </button>
            <button 
                onClick={() => setActiveTab('staff')} 
                className={`flex-1 py-3 retro-font text-xs flex items-center justify-center gap-2 border-r-2 border-slate-700 ${activeTab === 'staff' ? 'bg-slate-700 text-yellow-400' : 'text-slate-500'}`}
            >
                <Briefcase size={14} /> STAFF
            </button>
            <button 
                onClick={() => setActiveTab('academy')} 
                className={`flex-1 py-3 retro-font text-xs flex items-center justify-center gap-2 ${activeTab === 'academy' ? 'bg-slate-700 text-yellow-400' : 'text-slate-500'}`}
            >
                <GraduationCap size={14} /> ACADEMY
            </button>
        </div>

        {/* Content */}
        {activeTab === 'facilities' && renderFacilities()}
        {activeTab === 'staff' && renderStaff()}
        {activeTab === 'academy' && renderAcademy()}
    </div>
  );
};
