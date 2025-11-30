
import React, { useState, useEffect } from 'react';
import { Track, Team, TireCompoundType, WeatherForecast, RaceStrategy } from '../types';
import { TIRE_COMPOUNDS } from '../constants';
import { Flag, CloudRain, Sun, Cloud, Thermometer, CircleDot, ChevronRight, AlertTriangle } from 'lucide-react';

interface RacePreviewProps {
  track: Track;
  playerTeam: Team;
  setupBonus: number;
  onStartRace: (strategy: RaceStrategy, forecast: WeatherForecast) => void;
  onBack: () => void;
}

const generateWeatherForecast = (track: Track): WeatherForecast => {
  const baseRainChance = track.location === 'UK' ? 60 : 
                         track.location === 'Monaco' ? 30 :
                         track.location === 'Japan' ? 40 : 20;
  
  const rainChance = Math.min(100, baseRainChance + Math.floor(Math.random() * 30) - 15);
  const temperature = Math.floor(Math.random() * 15) + 18; // 18-33°C
  
  const getWeather = (chance: number): 'sunny' | 'cloudy' | 'rain' => {
    const roll = Math.random() * 100;
    if (roll < chance * 0.6) return 'rain';
    if (roll < chance) return 'cloudy';
    return 'sunny';
  };

  return {
    current: getWeather(rainChance * 0.5),
    raceStart: getWeather(rainChance),
    midRace: getWeather(rainChance + 10),
    rainChance,
    temperature
  };
};

export const RacePreview: React.FC<RacePreviewProps> = ({ 
  track, 
  playerTeam, 
  setupBonus, 
  onStartRace,
  onBack 
}) => {
  const [selectedTire, setSelectedTire] = useState<TireCompoundType>('medium');
  const [forecast, setForecast] = useState<WeatherForecast | null>(null);
  const [plannedStops, setPlannedStops] = useState(1);
  const [aggressiveness, setAggressiveness] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  useEffect(() => {
    setForecast(generateWeatherForecast(track));
  }, [track]);

  const getWeatherIcon = (weather: 'sunny' | 'cloudy' | 'rain') => {
    switch (weather) {
      case 'sunny': return <Sun className="text-yellow-400" size={24} />;
      case 'cloudy': return <Cloud className="text-slate-400" size={24} />;
      case 'rain': return <CloudRain className="text-blue-400" size={24} />;
    }
  };

  const getWeatherText = (weather: 'sunny' | 'cloudy' | 'rain') => {
    switch (weather) {
      case 'sunny': return 'Sonnig';
      case 'cloudy': return 'Bewölkt';
      case 'rain': return 'Regen';
    }
  };

  const dryTires = TIRE_COMPOUNDS.filter(t => ['soft', 'medium', 'hard'].includes(t.type));
  const wetTires = TIRE_COMPOUNDS.filter(t => ['inter', 'wet'].includes(t.type));

  const isWetConditions = forecast?.raceStart === 'rain' || (forecast?.rainChance || 0) > 60;

  const handleStartRace = () => {
    if (!forecast) return;
    const strategy: RaceStrategy = {
      startingTire: selectedTire,
      plannedStops,
      aggressiveness
    };
    onStartRace(strategy, forecast);
  };

  const getTireRecommendation = () => {
    if (!forecast) return null;
    if (forecast.raceStart === 'rain') return 'inter';
    if (forecast.rainChance > 50) return 'medium';
    if (forecast.temperature > 28) return 'soft';
    if (forecast.temperature < 22) return 'hard';
    return 'medium';
  };

  const recommendedTire = getTireRecommendation();

  if (!forecast) return <div className="p-4 text-white">Lade Wetterdaten...</div>;

  return (
    <div className="h-full bg-slate-900 text-white p-4 pb-24 animate-fade-in overflow-y-auto">
      <button 
        onClick={onBack}
        className="mb-4 text-slate-400 hover:text-white text-sm"
      >
        ← Zurück
      </button>

      <div className="flex items-center gap-3 mb-6">
        <Flag className="text-red-500" size={28} />
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wide">{track.name}</h1>
          <p className="text-slate-400 text-sm">{track.location} • {track.laps} Runden</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Cloud size={20} className="text-cyan-400" />
          Wetter-Vorhersage
        </h2>
        
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Jetzt</p>
            {getWeatherIcon(forecast.current)}
            <p className="text-sm mt-1">{getWeatherText(forecast.current)}</p>
          </div>
          <div className="text-center p-3 bg-slate-900/50 rounded-lg border-2 border-cyan-500/30">
            <p className="text-xs text-cyan-400 mb-1">Rennstart</p>
            {getWeatherIcon(forecast.raceStart)}
            <p className="text-sm mt-1">{getWeatherText(forecast.raceStart)}</p>
          </div>
          <div className="text-center p-3 bg-slate-900/50 rounded-lg">
            <p className="text-xs text-slate-500 mb-1">Rennmitte</p>
            {getWeatherIcon(forecast.midRace)}
            <p className="text-sm mt-1">{getWeatherText(forecast.midRace)}</p>
          </div>
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="flex items-center gap-2">
            <CloudRain size={16} className="text-blue-400" />
            <span>Regenwahrscheinlichkeit: <strong className={forecast.rainChance > 50 ? 'text-blue-400' : 'text-green-400'}>{forecast.rainChance}%</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-orange-400" />
            <span>{forecast.temperature}°C</span>
          </div>
        </div>

        {forecast.rainChance > 40 && (
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2">
            <AlertTriangle size={16} className="text-yellow-500" />
            <span className="text-sm text-yellow-400">Wetterumschwung möglich! Regenreifen bereithalten.</span>
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <CircleDot size={20} className="text-red-400" />
          Startreifen wählen
        </h2>

        {isWetConditions && (
          <div className="mb-4 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-400">Nasse Bedingungen erwartet - Regenreifen verfügbar</p>
          </div>
        )}

        <div className="space-y-3 mb-4">
          <p className="text-xs text-slate-400 uppercase font-bold">Trockenreifen</p>
          <div className="grid grid-cols-3 gap-2">
            {dryTires.map(tire => (
              <button
                key={tire.type}
                onClick={() => setSelectedTire(tire.type)}
                disabled={isWetConditions && forecast.raceStart === 'rain'}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedTire === tire.type 
                    ? 'border-cyan-500 bg-cyan-500/10' 
                    : 'border-slate-600 hover:border-slate-500'
                } ${isWetConditions && forecast.raceStart === 'rain' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div 
                  className="w-8 h-8 rounded-full mx-auto mb-2 border-4"
                  style={{ 
                    borderColor: tire.color,
                    backgroundColor: tire.type === 'hard' ? '#1e293b' : 'transparent'
                  }}
                />
                <p className="text-sm font-bold">{tire.name}</p>
                <div className="mt-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Grip</span>
                    <span className="text-green-400">{tire.grip}%</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Haltbar</span>
                    <span className="text-yellow-400">{tire.durability}%</span>
                  </div>
                </div>
                {recommendedTire === tire.type && (
                  <div className="mt-2 text-xs bg-green-500/20 text-green-400 rounded px-1 py-0.5">
                    Empfohlen
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {isWetConditions && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 uppercase font-bold">Regenreifen</p>
            <div className="grid grid-cols-2 gap-2">
              {wetTires.map(tire => (
                <button
                  key={tire.type}
                  onClick={() => setSelectedTire(tire.type)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedTire === tire.type 
                      ? 'border-cyan-500 bg-cyan-500/10' 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div 
                    className="w-8 h-8 rounded-full mx-auto mb-2 border-4"
                    style={{ borderColor: tire.color }}
                  />
                  <p className="text-sm font-bold">{tire.name}</p>
                  <div className="mt-2 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Grip</span>
                      <span className="text-green-400">{tire.grip}%</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Haltbar</span>
                      <span className="text-yellow-400">{tire.durability}%</span>
                    </div>
                  </div>
                  {recommendedTire === tire.type && (
                    <div className="mt-2 text-xs bg-green-500/20 text-green-400 rounded px-1 py-0.5">
                      Empfohlen
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
        <h2 className="text-lg font-bold mb-4">Renn-Strategie</h2>
        
        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-2">Geplante Boxenstopps</p>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map(stops => (
              <button
                key={stops}
                onClick={() => setPlannedStops(stops)}
                className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                  plannedStops === stops 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {stops}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-2">Fahrstil</p>
          <div className="flex gap-2">
            {[
              { value: 'conservative', label: 'Konservativ', desc: 'Reifen schonen' },
              { value: 'balanced', label: 'Ausgewogen', desc: 'Standard' },
              { value: 'aggressive', label: 'Aggressiv', desc: 'Maximaler Push' }
            ].map(style => (
              <button
                key={style.value}
                onClick={() => setAggressiveness(style.value as typeof aggressiveness)}
                className={`flex-1 py-3 px-2 rounded-lg transition-all ${
                  aggressiveness === style.value 
                    ? 'bg-cyan-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <p className="font-bold text-sm">{style.label}</p>
                <p className="text-xs opacity-70">{style.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
        <h2 className="text-lg font-bold mb-2">Setup-Vertrauen</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
              style={{ width: `${setupBonus}%` }}
            />
          </div>
          <span className="text-lg font-mono font-bold text-cyan-400">{setupBonus}%</span>
        </div>
        <p className="text-xs text-slate-500 mt-2">Basierend auf deinem Trainings-Setup</p>
      </div>

      <button
        onClick={handleStartRace}
        disabled={playerTeam.drivers.length < 1}
        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 text-lg"
      >
        <Flag size={24} />
        Rennen starten
        <ChevronRight size={24} />
      </button>

      {playerTeam.drivers.length < 1 && (
        <p className="text-center text-red-400 text-sm mt-2">
          Du brauchst mindestens einen Fahrer!
        </p>
      )}
    </div>
  );
};
