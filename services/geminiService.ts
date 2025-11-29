
import { Track } from '../types';

const API_BASE = (import.meta as any).env?.DEV ? 'http://localhost:3001/api' : '/api';

// --- PERSISTENT CACHE STORAGE HELPER ---
const loadCache = (key: string) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : {};
    } catch (e) {
        console.warn(`Failed to load cache for ${key}`, e);
        return {};
    }
};

const saveCache = (key: string, data: Record<string, string>) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.warn(`Failed to save cache for ${key}`, e);
    }
};

// --- INITIALIZE CACHES FROM STORAGE ---
const eventImageCache: Record<string, string> = loadCache('apex_cache_events');
const carRenderCache: Record<string, string> = loadCache('apex_cache_cars');
const driverPortraitCache: Record<string, string> = loadCache('apex_cache_drivers');
const hqBackgroundCache: Record<string, string> = loadCache('apex_cache_hq_bg');
const buildingSpriteCache: Record<string, string> = loadCache('apex_cache_buildings');

async function callAPI(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }
    
    return response.json();
}

export const preloadEventImages = async () => {
    const scenarios: Array<'rain' | 'safety_car' | 'crash' | 'victory'> = ['rain', 'safety_car', 'crash', 'victory'];
    
    scenarios.forEach(async (type) => {
        if (!eventImageCache[type]) {
            try {
                await generateEventImage(type, "generic");
            } catch (e) {
                console.warn(`Failed to preload ${type}`, e);
            }
        }
    });
};

export const getRaceCommentary = async (
  track: Track, 
  lap: number, 
  leaderName: string, 
  event?: string
): Promise<string> => {
  try {
    const prompt = `
      Kommentiere das Formel-1-Rennen in EINEM kurzen Satz (max 12 Wörter).
      Stil: 90er Jahre Retro-Game Textbox.
      Situation: Runde ${lap}, Führender ${leaderName}, Event: ${event || 'Normal'}.
    `;

    const data = await callAPI('/generate-text', { 
        prompt, 
        model: 'gemini-2.5-flash' 
    });
    
    return data.text?.trim() || "Spannung auf der Strecke!";
  } catch (error) {
    return `Runde ${lap}: Rennen läuft.`;
  }
};

export const getScoutReport = async (driverName: string): Promise<string> => {
    try {
        const data = await callAPI('/generate-text', {
            prompt: `Kurzer Scouting-Bericht (1 Satz) über ${driverName}. Stärke/Schwäche. Retro RPG Stil.`,
            model: 'gemini-2.5-flash'
        });
        return data.text?.trim() || "Vielversprechendes Talent.";
    } catch (e) {
        return "Talentierter Fahrer.";
    }
}

export const generateDriverPortrait = async (
    driverName: string, 
    teamColor: string, 
    nationality: string, 
    mood: string
): Promise<string | null> => {
    const key = `${driverName}-${teamColor}-${mood}`;
    
    if (driverPortraitCache[key]) return driverPortraitCache[key];

    let expression = "Neutral expression, arms crossed, professional";
    switch (mood) {
        case 'ecstatic': 
            expression = "Extremely happy, cheering with fist raised in victory, big smile, energetic pose";
            break;
        case 'happy': 
            expression = "Confident smile, thumbs up, relaxed and positive posture";
            break;
        case 'neutral': 
            expression = "Serious focused face, arms crossed on chest, determined look";
            break;
        case 'frustrated': 
            expression = "Annoyed face, hand on hip, looking away, disappointed posture";
            break;
        case 'angry': 
            expression = "Furious face, shouting, clenched fists, aggressive posture, red face";
            break;
    }

    const prompt = `
        16-bit pixel art character portrait of a racing driver named ${driverName}.
        View: Half-body (Waist up), showing face and torso.
        Style: SNES RPG Character Card / Street Fighter 2 Character Select.
        Outfit: High-tech racing suit colored ${teamColor}.
        Action/Emotion: ${expression}.
        Background: Solid Black (#000000).
        Details: Sharp pixels, vibrant colors, retro gaming aesthetic.
    `;

    try {
        const data = await callAPI('/generate-image', { 
            prompt,
            model: 'gemini-2.5-flash-image'
        });
        
        if (data.image) {
            driverPortraitCache[key] = data.image;
            saveCache('apex_cache_drivers', driverPortraitCache);
            return data.image;
        }
        return null;
    } catch (e) {
        return null;
    }
};

export const generateEventImage = async (eventType: 'rain' | 'safety_car' | 'crash' | 'victory', context: string): Promise<string | null> => {
    if (eventImageCache[eventType] && context === 'generic') return eventImageCache[eventType];

    let prompt = "";
    const style = "16-bit pixel art, isometric view, retro game graphics, SNES style.";
    
    switch(eventType) {
        case 'rain': prompt = `Formula 1 race track in storm, ${style}`; break;
        case 'safety_car': prompt = `Safety Car leading pack, ${style}`; break;
        case 'crash': prompt = `Car crash with smoke, ${style}`; break;
        case 'victory': prompt = `Driver celebrating on podium with trophy, ${style}`; break;
    }

    try {
        const data = await callAPI('/generate-image', { 
            prompt,
            model: 'gemini-2.5-flash-image'
        });
        
        if (data.image && context === 'generic') {
            eventImageCache[eventType] = data.image;
            saveCache('apex_cache_events', eventImageCache);
        }
        return data.image || null;
    } catch (e) { 
        return null; 
    }
}

export const generateCarTechImage = async (teamColor: string, teamName: string): Promise<string | null> => {
    const key = `${teamColor}-${teamName}`;
    if (carRenderCache[key]) return carRenderCache[key];

    const prompt = `
        Side view pixel art of a Formula 1 car. Color: ${teamColor}.
        Style: 16-bit garage menu blueprint. Blue grid background.
    `;

    try {
        const data = await callAPI('/generate-image', { 
            prompt,
            model: 'gemini-2.5-flash-image'
        });
        
        if (data.image) {
            carRenderCache[key] = data.image;
            saveCache('apex_cache_cars', carRenderCache);
            return data.image;
        }
        return null;
    } catch (e) { 
        return null; 
    }
}

export const generateVictoryImage = async (winner: string, team: string, color: string, weather: string): Promise<string | null> => {
    const prompt = `
        16-bit pixel art victory screen. F1 Driver celebrating.
        Team Color: ${color}. Weather: ${weather}.
        Text 'WINNER' at top.
        Retro Arcade style.
    `;

    try {
        const data = await callAPI('/generate-image', { 
            prompt,
            model: 'gemini-2.5-flash-image'
        });
        
        return data.image || null;
    } catch (e) { 
        return null; 
    }
};

export const generateMediaInterview = async (team: string, res: number): Promise<any> => {
    const prompt = `
        F1 Journalist Frage an Team ${team} nach Platz ${res}.
        JSON Format: { "question": "...", "journalist": "Reporter", "answers": [{"text": "...", "type": "diplomatic", "moraleImpact": 0}, ...] }
    `;
    
    try {
         const data = await callAPI('/generate-text', {
             prompt,
             model: 'gemini-2.5-flash',
             config: { responseMimeType: 'application/json' }
         });
         return JSON.parse(data.text || "{}");
    } catch(e) { 
        return null; 
    }
}

export const generateHQMapBackground = async (teamName: string): Promise<string | null> => {
    if (hqBackgroundCache[teamName]) {
        return hqBackgroundCache[teamName];
    }

    const prompt = `
        Single isometric tile platform for a city builder game.
        Style: SimCity 2000, 16-bit pixel art.
        Content: A large square concrete and grass platform floating in space.
        Contains a grid of roads or pathways.
        No buildings.
        Background: Solid Black (#000000).
        High contrast.
    `;

    try {
        const data = await callAPI('/generate-image', { 
            prompt,
            model: 'gemini-2.5-flash-image'
        });
        
        if (data.image) {
            hqBackgroundCache[teamName] = data.image;
            saveCache('apex_cache_hq_bg', hqBackgroundCache);
            return data.image;
        }
        return null;
    } catch (e) { 
        return null; 
    }
};

export const generateBuildingSprite = async (type: string, level: number, color: string): Promise<string | null> => {
    const key = `${type}-${level}-${color}`;
    
    if (buildingSpriteCache[key]) {
        return buildingSpriteCache[key];
    }

    const prompt = `
        Single isometric building sprite.
        Type: ${type} (Formula 1 factory).
        Style: SimCity 2000, 16-bit pixel art.
        Level: ${level} (1=small, 5=skyscraper).
        Team Color Accents: ${color}.
        View: Isometric facing South-East.
        Background: Solid Black (#000000).
        Sharp outlines. No text.
    `;

    try {
        const data = await callAPI('/generate-image', { 
            prompt,
            model: 'gemini-2.5-flash-image'
        });
        
        if (data.image) {
            buildingSpriteCache[key] = data.image;
            saveCache('apex_cache_buildings', buildingSpriteCache);
            return data.image;
        }
        return null;
    } catch (e) { 
        return null; 
    }
};
