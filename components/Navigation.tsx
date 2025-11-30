import React from 'react';
import { Home, Wrench, Users, Trophy, Flag, Building2 } from 'lucide-react';
import { GamePhase } from '../types';

interface NavigationProps {
  currentPhase: GamePhase;
  setPhase: (phase: GamePhase) => void;
  canNavigate: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPhase, setPhase, canNavigate }) => {
  const navItems = [
    { phase: GamePhase.DASHBOARD, icon: Home, label: 'Home' },
    { phase: GamePhase.HQ, icon: Building2, label: 'HQ' },
    { phase: GamePhase.CAR_DEV, icon: Wrench, label: 'R&D' },
    { phase: GamePhase.DRIVERS, icon: Users, label: 'Team' },
    { phase: GamePhase.STANDINGS, icon: Trophy, label: 'Rang' },
  ];

  if (!canNavigate) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-slate-900 border-t border-slate-800 pb-safe z-50">
      <div className="flex justify-between items-center h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.phase}
            onClick={() => setPhase(item.phase)}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors active:scale-95 ${
              currentPhase === item.phase ? 'text-red-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <item.icon size={20} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </button>
        ))}
        
        {/* Floating Race Button Positioned absolute or integrated? 
            Integrated flows better on mobile bottom bars usually. 
            Let's keep it separate if we want it strictly prominent, 
            but for 5 items, a floating button might cover content.
            Let's add a distinct Race Mode toggle or just keep it in dashboard/top.
            
            Actually, let's keep the Race Button as a special distinct action
            that sits above or is the center piece if we had space.
            For now, access to race is via Dashboard, so we remove it from bottom 
            to make room for HQ, OR we replace Standings/Home logic.
            
            Re-adding race button as a small action item or relying on Dashboard 'Next Race' card.
            The Dashboard card is big and prominent, so we don't strictly need a bottom nav item for 'Race Preview'.
        */}
      </div>
    </div>
  );
};