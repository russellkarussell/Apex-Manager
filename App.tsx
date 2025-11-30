
import React, { useState, useEffect } from 'react';
import { TEAMS, INITIAL_MONEY, AVAILABLE_DRIVERS, TRACKS } from './constants';
import { GamePhase, Team, Driver, RaceResult, InterviewData, CarSetup } from './types';
import { Navigation } from './components/Navigation';
import { Headquarters } from './components/Headquarters';
import { CarUpgrade } from './components/CarUpgrade';
import { RaceSimulation } from './components/RaceSimulation';
import { MediaInterview } from './components/MediaInterview';
import { PracticeSession } from './components/PracticeSession';
import { QualifyingSession } from './components/QualifyingSession';
import { Finances } from './components/Finances';
import { TeamSettings } from './components/TeamSettings';
import { DriverDetail } from './components/DriverDetail';
import { Users, UserPlus, DollarSign, Trophy, Flag, Image as ImageIcon, Play, Loader2, SkipForward, Mic, Settings, PenTool, User } from 'lucide-react';
import { generateVictoryImage, preloadEventImages, generateMediaInterview } from './services/geminiService';

const App = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.DASHBOARD);
  const [playerTeam, setPlayerTeam] = useState<Team>(TEAMS[0]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [seasonPoints, setSeasonPoints] = useState<{ [teamId: string]: number }>({});
  
  // Settings Modal State
  const [showSettings, setShowSettings] = useState(false);
  const [selectedDriverForDetail, setSelectedDriverForDetail] = useState<Driver | null>(null);

  // Race Context
  const [setupBonus, setSetupBonus] = useState(0); 
  const [gridOrder, setGridOrder] = useState<string[]>([]); 

  // Highlights State
  const [lastRaceWinner, setLastRaceWinner] = useState<{name: string, team: string, color: string, weather: 'sunny' | 'rain'} | null>(null);
  const [lastPlayerPosition, setLastPlayerPosition] = useState<number>(0);
  const [highlightImage, setHighlightImage] = useState<string | null>(null);
  const [isGeneratingHighlight, setIsGeneratingHighlight] = useState(false);

  // Interview State
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);

  useEffect(() => {
    preloadEventImages();
  }, []);

  const hireDriver = (driver: Driver) => {
    if (playerTeam.drivers.length >= 2) return;
    if (playerTeam.money < driver.salary) return;

    setPlayerTeam(prev => ({
      ...prev,
      money: prev.money - driver.salary,
      drivers: [...prev.drivers, { ...driver, teamId: prev.id, mood: 'neutral' }]
    }));
  };

  const fireDriver = (driverId: string) => {
    setPlayerTeam(prev => ({
      ...prev,
      drivers: prev.drivers.filter(d => d.id !== driverId)
    }));
  };

  const updateDriverInTeam = (updatedDriver: Driver) => {
      setPlayerTeam(prev => ({
          ...prev,
          drivers: prev.drivers.map(d => d.id === updatedDriver.id ? updatedDriver : d)
      }));
      if (selectedDriverForDetail?.id === updatedDriver.id) {
          setSelectedDriverForDetail(updatedDriver);
      }
  };
  
  const handleDriverExpense = (amount: number) => {
      if (playerTeam.money >= amount) {
          setPlayerTeam(prev => ({
              ...prev,
              money: prev.money - amount
          }));
      }
  };

  const handleUpdateTeamSettings = (name: string, color: string) => {
    setPlayerTeam(prev => ({ ...prev, name, color }));
    setShowSettings(false);
  };

  const handleRaceFinish = (results: RaceResult[], weatherState: 'sunny' | 'rain') => {
    const newPoints = { ...seasonPoints };
    let moneyEarned = 0;
    let playerPos = 20;
    const winnerId = results[0].driverId;
    let winnerName = "Unbekannt";
    let winnerTeam = "Team";
    let winnerColor = "grey";

    const allTeams = [playerTeam, ...TEAMS.filter(t => t.id !== playerTeam.id)];
    for(const t of allTeams) {
        const d = t.drivers.find(d => d.id === winnerId);
        if (d || t.id === results[0].teamId) {
             winnerTeam = t.name;
             winnerColor = t.color;
             winnerName = d ? d.name : "Fahrer " + winnerId;
             break;
        }
    }
    if (winnerName.startsWith("Fahrer ai_")) winnerName = "Der Sieger"; 

    setLastRaceWinner({ name: winnerName, team: winnerTeam, color: winnerColor, weather: weatherState });

    results.forEach(r => {
        newPoints[r.teamId] = (newPoints[r.teamId] || 0) + r.points;
        if (r.teamId === playerTeam.id) {
            playerPos = Math.min(playerPos, r.position); 
            if (r.position === 1) moneyEarned += 1000000;
            else if (r.position <= 3) moneyEarned += 500000;
            else if (r.position <= 10) moneyEarned += 200000;
            else moneyEarned += 50000;
        }
    });
    
    const sponsorIncome = playerTeam.sponsors.reduce((acc, s) => acc + s.perRaceIncome, 0);
    moneyEarned += sponsorIncome;

    setLastPlayerPosition(playerPos);
    setSeasonPoints(newPoints);
    
    const updatedDrivers = playerTeam.drivers.map(d => {
        const res = results.find(r => r.driverId === d.id);
        if (!res) return { ...d, mood: 'neutral' as const }; 
        let newMood: Driver['mood'] = 'neutral';
        if (res.position === 1) newMood = 'ecstatic';
        else if (res.position <= 3) newMood = 'happy';
        else if (res.position <= 10) newMood = 'neutral';
        else if (res.position > 15) newMood = 'frustrated';
        if (res.points === 0 && res.position === 20) newMood = 'angry'; 
        return { ...d, mood: newMood };
    });

    setPlayerTeam(prev => ({ ...prev, money: prev.money + moneyEarned, drivers: updatedDrivers }));
    setHighlightImage(null);
    setPhase(GamePhase.HIGHLIGHTS);
  };

  useEffect(() => {
      if (phase === GamePhase.HIGHLIGHTS && lastRaceWinner && !isGeneratingHighlight && !highlightImage) {
          const generate = async () => {
              setIsGeneratingHighlight(true);
              const img = await generateVictoryImage(
                  lastRaceWinner.name, 
                  lastRaceWinner.team, 
                  lastRaceWinner.color, 
                  lastRaceWinner.weather
              );
              setHighlightImage(img);
              setIsGeneratingHighlight(false);
          };
          generate();
      }
  }, [phase, lastRaceWinner]);

  const handleQuitRace = () => {
    if (window.confirm("Rennen wirklich abbrechen?")) {
        setPhase(GamePhase.DASHBOARD);
    }
  };

  const startInterview = async () => {
      setIsGeneratingInterview(true);
      const data = await generateMediaInterview(playerTeam.name, lastPlayerPosition);
      const fallbackData: InterviewData = {
          question: `Platz ${lastPlayerPosition} im heutigen Rennen. Wie bewerten Sie die Leistung des Teams?`,
          journalist: 'BBC Sport',
          answers: [
              { text: "Wir müssen härter arbeiten.", type: 'diplomatic', moraleImpact: 0 },
              { text: "Das Auto war heute eine Katastrophe.", type: 'arrogant', moraleImpact: -10 },
              { text: "Das Team hat trotz allem einen super Job gemacht.", type: 'team', moraleImpact: 5 }
          ]
      };
      setInterviewData(data || fallbackData);
      setIsGeneratingInterview(false);
      setPhase(GamePhase.INTERVIEW);
  };

  const handleInterviewAnswer = (impact: number) => {
      const currentMorale = playerTeam.morale || 50;
      const newMorale = Math.min(100, Math.max(0, currentMorale + impact));
      setPlayerTeam(prev => ({ ...prev, morale: newMorale }));
      setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
      setSetupBonus(0);
      setGridOrder([]);
      setPhase(GamePhase.DASHBOARD);
  };

  const handlePracticeFinish = (score: number, setup: CarSetup) => {
      setSetupBonus(score);
      setPhase(GamePhase.QUALIFYING);
  }

  const handleQualifyingFinish = (grid: string[]) => {
      setGridOrder(grid);
      setPhase(GamePhase.RACE_LIVE);
  }

  const renderDashboard = () => (
    <div className="p-4 space-y-4 animate-fade-in pb-24">
      {/* Header */}
      <header className="flex justify-between items-start mb-4 border-b-4 border-white pb-2">
        <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl retro-font text-white truncate" style={{ color: playerTeam.color }}>
                    {playerTeam.name}
                </h1>
                <button onClick={() => setShowSettings(true)} className="bg-slate-800 p-1 hover:bg-slate-700 text-slate-400 border-2 border-slate-600 rounded-none">
                    <PenTool size={12} />
                </button>
            </div>
            <p className="text-slate-400 text-xs">Saison 2025 • Rennen {currentTrackIndex + 1}/{TRACKS.length}</p>
        </div>
        <div className="text-right">
             <button 
                onClick={() => setPhase(GamePhase.FINANCES)}
                className="bg-slate-800 px-3 py-1.5 border-2 border-green-700 flex items-center gap-2 hover:bg-slate-700 transition rounded-none"
             >
                <DollarSign size={16} className="text-green-400" />
                <span className="font-mono text-green-400 text-sm">{playerTeam.money.toLocaleString()}</span>
             </button>
        </div>
      </header>

      {/* Next Race Card */}
      <div className="retro-box p-6 relative group overflow-hidden">
        <div className="absolute top-0 right-0 p-32 bg-red-600/10 rounded-full transform translate-x-1/2 -translate-y-1/2 blur-xl pointer-events-none"></div>
        <h2 className="text-xs font-bold text-slate-400 mb-2 retro-font">NEXT GRAND PRIX</h2>
        <h3 className="text-2xl font-bold italic mb-4 text-white retro-font tracking-widest">{TRACKS[currentTrackIndex].name}</h3>
        <div className="flex gap-4 text-sm font-medium text-slate-300 border-t-2 border-slate-700 pt-2">
            <span className="flex items-center gap-1"><Flag size={14}/> {TRACKS[currentTrackIndex].laps} LAPS</span>
            <span>•</span>
            <span>{TRACKS[currentTrackIndex].location}</span>
        </div>
        <button 
            onClick={() => setPhase(GamePhase.RACE_PREVIEW)}
            className="mt-6 w-full retro-btn py-4 text-white font-bold flex items-center justify-center gap-2"
            disabled={playerTeam.drivers.length === 0}
        >
            {playerTeam.drivers.length === 0 ? "NO DRIVERS" : <><Play size={16} fill="currentColor" /> START WEEKEND</>}
        </button>
      </div>

      {/* Team Status Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div onClick={() => setPhase(GamePhase.DRIVERS)} className="retro-box p-4 cursor-pointer hover:bg-slate-800">
            <Users className="text-cyan-400 mb-2" />
            <div className="text-2xl retro-font text-white">{playerTeam.drivers.length}/2</div>
            <div className="text-[10px] text-slate-400 uppercase">Drivers</div>
        </div>
        
        <div onClick={() => setPhase(GamePhase.STANDINGS)} className="retro-box p-4 cursor-pointer hover:bg-slate-800 relative">
            <div className="flex justify-between items-start">
                <Trophy className="text-yellow-400 mb-2" />
                <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${
                     (playerTeam.morale || 50) > 70 ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'
                }`}>
                    {playerTeam.morale || 50}% MOR
                </span>
            </div>
            <div className="text-2xl retro-font text-white">{seasonPoints[playerTeam.id] || 0}</div>
            <div className="text-[10px] text-slate-400 uppercase">Points</div>
        </div>

        <div onClick={() => setPhase(GamePhase.FINANCES)} className="col-span-2 retro-box p-4 cursor-pointer hover:bg-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-3">
                 <div className="bg-green-900/30 p-2 border border-green-800">
                     <DollarSign className="text-green-400" size={20} />
                 </div>
                 <div>
                     <div className="font-bold text-white retro-font">FINANCES</div>
                     <div className="text-xs text-slate-400">{playerTeam.sponsors.length} SPONSORS</div>
                 </div>
             </div>
             <Settings size={16} className="text-slate-500" />
        </div>
      </div>
    </div>
  );

  const renderDrivers = () => (
      <div className="p-4 pb-24 space-y-4">
          <h2 className="text-xl retro-font text-white mb-4">TEAM DRIVERS</h2>
          
          {playerTeam.drivers.map(driver => (
              <div key={driver.id} className="retro-box p-4 flex items-center gap-4 relative">
                  <div onClick={() => setSelectedDriverForDetail(driver)} className="cursor-pointer border-2 border-white w-16 h-16 bg-slate-800 flex items-center justify-center shrink-0">
                      {driver.portraitUrl ? (
                          <img src={driver.portraitUrl} alt={driver.name} className="w-full h-full object-contain object-bottom image-pixelated bg-[#1a1b26]" />
                      ) : (
                          <User size={32} className="text-slate-500" />
                      )}
                  </div>
                  <div className="flex-1" onClick={() => setSelectedDriverForDetail(driver)}>
                      <h3 className="retro-font text-lg text-white">{driver.name}</h3>
                      <div className="flex gap-2 items-center text-xs mt-1">
                          <span className={`px-1.5 py-0.5 border ${
                              driver.mood === 'ecstatic' || driver.mood === 'happy' ? 'border-green-500 text-green-400' :
                              'border-slate-500 text-slate-400'
                          }`}>
                              {driver.mood}
                          </span>
                      </div>
                  </div>
                  <button onClick={() => fireDriver(driver.id)} className="retro-btn bg-red-900 border-red-500 text-red-200 px-3 py-2 text-xs">
                      FIRE
                  </button>
              </div>
          ))}

          {playerTeam.drivers.length < 2 && (
              <>
                <h2 className="text-xl retro-font text-white mt-8 mb-4">FREE AGENTS</h2>
                <div className="space-y-3">
                    {AVAILABLE_DRIVERS.filter(d => !playerTeam.drivers.find(pd => pd.id === d.id)).map(driver => (
                        <div key={driver.id} className="retro-box p-4">
                             <div className="flex justify-between items-start mb-2">
                                <div className="flex gap-3">
                                     <div className="w-12 h-12 bg-slate-900 border-2 border-white flex items-center justify-center shrink-0">
                                         <User size={24} className="text-slate-500" />
                                     </div>
                                     <div>
                                         <div className="retro-font text-white">{driver.name}</div>
                                         <div className="text-xs text-cyan-400">RATING: {Math.round((driver.skill + driver.tireManagement + driver.aggression)/3)}</div>
                                     </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-green-400 font-mono">${driver.salary.toLocaleString()}</div>
                                </div>
                             </div>
                             <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs font-mono border-t-2 border-slate-700 pt-2">
                                 <div><span className="text-slate-500">SPD</span> <span className="text-white">{driver.skill}</span></div>
                                 <div><span className="text-slate-500">TYR</span> <span className="text-white">{driver.tireManagement}</span></div>
                                 <div><span className="text-slate-500">AGR</span> <span className="text-white">{driver.aggression}</span></div>
                             </div>
                             <button 
                                onClick={() => hireDriver(driver)}
                                disabled={playerTeam.money < driver.salary}
                                className="w-full mt-3 retro-btn py-2 text-white flex items-center justify-center gap-2"
                             >
                                 <UserPlus size={16} /> SIGN CONTRACT
                             </button>
                        </div>
                    ))}
                </div>
              </>
          )}
      </div>
  );

  const renderStandings = () => {
    const sortedTeams = TEAMS.map(t => ({...t, points: seasonPoints[t.id] || 0})).sort((a,b) => b.points - a.points);
    return (
        <div className="p-4 pb-24 animate-fade-in">
             <h2 className="text-xl retro-font text-white mb-6">CHAMPIONSHIP</h2>
             <div className="space-y-2">
                 {sortedTeams.map((team, idx) => (
                     <div key={team.id} className="flex items-center retro-box p-3 border-l-8" style={{ borderLeftColor: team.color }}>
                         <div className="font-mono text-slate-500 w-8">#{idx + 1}</div>
                         <div className="flex-1 retro-font text-white">{team.name}</div>
                         <div className="font-mono text-yellow-400">{team.points} PTS</div>
                     </div>
                 ))}
             </div>
             
             <button 
                onClick={startInterview}
                disabled={isGeneratingInterview}
                className="w-full mt-8 retro-btn py-4 text-white flex items-center justify-center gap-2"
             >
                 {isGeneratingInterview ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
                 <span>PRESS CONFERENCE</span>
             </button>
        </div>
    );
  };

  const renderHighlights = () => (
      <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-900">
          <h2 className="text-2xl retro-font text-yellow-400 mb-2">RACE RESULTS</h2>
          <p className="retro-font text-slate-400 mb-8">{TRACKS[currentTrackIndex].name}</p>

          <div className="w-full max-w-lg aspect-square bg-black border-4 border-white shadow-[8px_8px_0_0_rgba(0,0,0,1)] relative group">
              {isGeneratingHighlight && (
                  <div className="flex flex-col items-center justify-center h-full text-green-500 font-mono">
                      <span className="animate-pulse">LOADING SPRITES...</span>
                  </div>
              )}
              
              {!isGeneratingHighlight && highlightImage && (
                  <img 
                    src={highlightImage} 
                    alt="Victory Moment" 
                    className="w-full h-full object-cover image-pixelated"
                  />
              )}

              {!isGeneratingHighlight && !highlightImage && (
                  <div className="text-slate-500 flex flex-col items-center justify-center h-full">
                      <span className="text-xs font-mono">NO SIGNAL</span>
                  </div>
              )}
              
              {highlightImage && (
                  <div className="absolute bottom-0 left-0 w-full bg-black/80 p-4 border-t-4 border-white">
                      <div className="text-yellow-400 retro-font text-lg">WINNER: {lastRaceWinner?.name}</div>
                      <div className="text-white text-xs font-mono">{lastRaceWinner?.team}</div>
                  </div>
              )}
          </div>

          <div className="mt-8 flex flex-col w-full max-w-lg gap-4">
              <button 
                 onClick={() => setPhase(GamePhase.STANDINGS)}
                 className="retro-btn w-full py-4 text-white flex items-center justify-center gap-2"
              >
                  <SkipForward size={20} /> CONTINUE
              </button>
          </div>
      </div>
  );

  const canNavigate = phase !== GamePhase.RACE_LIVE && phase !== GamePhase.HIGHLIGHTS && phase !== GamePhase.INTERVIEW && phase !== GamePhase.PRACTICE && phase !== GamePhase.QUALIFYING;

  return (
    <div className="w-full h-screen bg-[#1a1b26] text-slate-50 flex flex-col font-mono">
      <main className="flex-1 overflow-y-auto no-scrollbar">
        {phase === GamePhase.DASHBOARD && renderDashboard()}
        {phase === GamePhase.FINANCES && <Finances team={playerTeam} updateTeam={setPlayerTeam} />}
        {phase === GamePhase.CAR_DEV && <CarUpgrade team={playerTeam} updateTeam={setPlayerTeam} />}
        {phase === GamePhase.DRIVERS && renderDrivers()}
        {phase === GamePhase.HQ && <Headquarters team={playerTeam} updateTeam={setPlayerTeam} />}
        {phase === GamePhase.RACE_PREVIEW && (
            <div className="p-6 flex flex-col h-full items-center justify-center animate-fade-in">
                <div className="retro-box p-8 text-center mb-8 bg-[#2d1b2e] border-white">
                    <h2 className="text-2xl retro-font text-white mb-4 uppercase">{TRACKS[currentTrackIndex].name}</h2>
                    <div className="space-y-2 font-mono text-sm text-slate-300">
                         <div className="flex justify-between w-64 border-b border-slate-600 pb-1">
                             <span>LAPS</span> <span className="text-white">{TRACKS[currentTrackIndex].laps}</span>
                         </div>
                         <div className="flex justify-between w-64 border-b border-slate-600 pb-1">
                             <span>DIFFICULTY</span> <span className="text-yellow-400 uppercase">{TRACKS[currentTrackIndex].difficulty}</span>
                         </div>
                    </div>
                </div>
                <button 
                    onClick={() => setPhase(GamePhase.PRACTICE)}
                    className="retro-btn px-8 py-4 text-lg text-white animate-pulse"
                >
                    START ENGINE
                </button>
            </div>
        )}
        
        {phase === GamePhase.PRACTICE && <PracticeSession track={TRACKS[currentTrackIndex]} onFinish={handlePracticeFinish} />}
        {phase === GamePhase.QUALIFYING && <QualifyingSession track={TRACKS[currentTrackIndex]} playerTeam={playerTeam} setupBonus={setupBonus} onFinish={handleQualifyingFinish} />}
        {phase === GamePhase.RACE_LIVE && <RaceSimulation playerTeam={playerTeam} track={TRACKS[currentTrackIndex]} gridOrder={gridOrder} setupBonus={setupBonus} onRaceFinish={handleRaceFinish} onQuit={handleQuitRace} />}
        {phase === GamePhase.HIGHLIGHTS && renderHighlights()}
        {phase === GamePhase.STANDINGS && renderStandings()}
        {phase === GamePhase.INTERVIEW && interviewData && <MediaInterview interview={interviewData} team={playerTeam} onAnswer={handleInterviewAnswer} />}
      </main>

      {showSettings && <TeamSettings team={playerTeam} onSave={handleUpdateTeamSettings} onClose={() => setShowSettings(false)} />}
      {selectedDriverForDetail && <DriverDetail driver={selectedDriverForDetail} teamColor={playerTeam.color} teamMoney={playerTeam.money} onClose={() => setSelectedDriverForDetail(null)} updateDriver={updateDriverInTeam} onExpense={handleDriverExpense} />}

      <Navigation currentPhase={phase} setPhase={setPhase} canNavigate={canNavigate} />
    </div>
  );
};

export default App;
