
import React from 'react';
import { InterviewData, Team } from '../types';
import { Mic, Camera, Radio, ThumbsUp, ThumbsDown, Users } from 'lucide-react';

interface MediaInterviewProps {
  interview: InterviewData;
  team: Team;
  onAnswer: (impact: number) => void;
}

export const MediaInterview: React.FC<MediaInterviewProps> = ({ interview, team, onAnswer }) => {
  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-6 animate-fade-in relative overflow-hidden">
      
      {/* Background Elements */}
      <div className="absolute top-0 right-0 p-48 bg-blue-600/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 p-32 bg-red-600/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-2">
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded animate-pulse">LIVE</span>
              <span className="text-slate-400 text-sm font-mono">Paddock Pass TV</span>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
               <Users size={14} className={team.morale && team.morale < 50 ? 'text-red-400' : 'text-green-400'} />
               <span className="text-sm font-bold">Team Moral: {team.morale || 50}%</span>
          </div>
      </div>

      {/* Journalist Section */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 mb-8">
          <div className="w-24 h-24 rounded-full bg-slate-700 border-4 border-slate-600 flex items-center justify-center mb-4 shadow-xl">
              <Camera size={40} className="text-slate-400" />
          </div>
          <h2 className="text-slate-400 text-sm font-bold uppercase mb-4">{interview.journalist}</h2>
          
          <div className="bg-white text-slate-900 p-6 rounded-2xl rounded-tl-none shadow-2xl max-w-lg relative">
              <Mic size={24} className="text-slate-400 absolute -top-10 -left-2" />
              <p className="text-xl font-bold italic leading-relaxed">
                  "{interview.question}"
              </p>
          </div>
      </div>

      {/* Answers */}
      <div className="space-y-3 relative z-10">
          <p className="text-center text-slate-500 text-xs uppercase font-bold mb-2">Wähle deine Antwort</p>
          {interview.answers.map((answer, idx) => (
              <button
                  key={idx}
                  onClick={() => onAnswer(answer.moraleImpact)}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 p-4 rounded-xl text-left transition-all active:scale-95 group"
              >
                  <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-slate-200 group-hover:text-white">{answer.text}</span>
                      {/* Hint at impact (optional, makes it easier) */}
                      <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          answer.type === 'team' ? 'bg-green-900 text-green-400' : 
                          answer.type === 'arrogant' ? 'bg-red-900 text-red-400' : 
                          'bg-blue-900 text-blue-400'
                      }`}>
                          {answer.type === 'team' ? <ThumbsUp size={12} /> : 
                           answer.type === 'arrogant' ? <ThumbsDown size={12} /> : 
                           <Radio size={12} />}
                      </span>
                  </div>
              </button>
          ))}
      </div>
    </div>
  );
};
