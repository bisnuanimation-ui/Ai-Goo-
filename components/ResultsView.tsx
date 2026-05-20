
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { AnalysisResult } from '../types';
import GoogleSheetsExport from './GoogleSheetsExport';

interface ResultsViewProps {
  result: AnalysisResult;
  getValidGoogleToken: () => Promise<string | null>;
  user: any;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, getValidGoogleToken, user }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.masterPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearData = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    window.location.reload();
  };

  const DetailItem = ({ label, content, color, icon }: { label: string, content: string, color: string, icon: React.ReactNode }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/[0.08] to-transparent border border-white/10 rounded-2xl p-6 transition-all hover:border-white/30 hover:bg-white/[0.1] group shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-xl bg-black/50 ${color} ring-1 ring-white/10 shadow-lg`}>
          {icon}
        </div>
        <h4 className={`text-[10px] font-black uppercase tracking-[0.3em] text-white/60 group-hover:text-white transition-colors`}>{label}</h4>
      </div>
      <p className="text-gray-400 text-[13px] leading-relaxed font-normal tracking-wide italic antialiased opacity-90 group-hover:opacity-100">
        {content || 'Analyzing design elements...'}
      </p>
    </motion.div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-6xl mx-auto space-y-10"
    >
      <div className="bg-black/40 border border-white/10 rounded-[2.5rem] p-10 relative overflow-hidden backdrop-blur-3xl shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] -mr-40 -mt-40"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10 relative z-10">
          <div>
            <div className="flex items-center gap-4 mb-2">
               <h3 className="text-3xl font-light text-white tracking-tight flex items-center gap-3">
                <span className="text-blue-500 font-black">/</span> Graphic Design Master Prompt
              </h3>
              <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">
                <span className="text-blue-400 text-[9px] font-black uppercase tracking-[0.2em]">Style & Layout Replication</span>
              </div>
            </div>
            <p className="text-gray-500 text-base font-medium">Replicate the precise subject, attire, background, and visual effects of the reference image.</p>
          </div>
          <div className="flex gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copyToClipboard}
              className={`px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 border
                ${copied ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-white text-black hover:bg-gray-100 border-white shadow-xl shadow-white/5'}`}
            >
              {copied ? 'Prompt Copied' : 'Copy Master Prompt'}
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearData}
              className="px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10"
            >
              Clear Data
            </motion.button>
          </div>
        </div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/[0.03] rounded-[2rem] p-8 text-gray-200 font-mono text-sm leading-[2.2] border border-white/5 shadow-inner select-all relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
          {result.masterPrompt}
        </motion.div>
      </div>

      <GoogleSheetsExport 
        result={result} 
        getValidGoogleToken={getValidGoogleToken} 
        user={user} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
        <DetailItem 
          label="Subject & Attire" 
          content={result.subjectAndAttire} 
          color="text-pink-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
        />
        <DetailItem 
          label="Typography & Text" 
          content={result.typographyAndText} 
          color="text-fuchsia-500"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h18M3 6h18M3 18h18" /></svg>}
        />
        <DetailItem 
          label="Visual Effects & Overlays" 
          content={result.visualEffectsAndOverlays} 
          color="text-blue-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>}
        />
        <DetailItem 
          label="Color Palette & Mood" 
          content={result.colorPaletteAndMood} 
          color="text-amber-500"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
        />
        <DetailItem 
          label="Composition & Layout" 
          content={result.compositionAndLayout} 
          color="text-green-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>}
        />
        <DetailItem 
          label="Camera & Quality" 
          content={result.cameraAndQuality} 
          color="text-cyan-400"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
      </div>
    </motion.div>
  );
};

export default ResultsView;
