import React from 'react';
import { motion } from 'motion/react';

interface HistoryItem {
  id: string;
  createdAt: any;
  cameraAngle: string;
  backgroundSetting: string;
  characterPose: string;
  emotionalVibe: string;
  locationDetails: string;
  masterPrompt: string;
}

interface HistoryListProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ items, onSelect }) => {
  if (items.length === 0) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.05] rounded-3xl p-10 text-center">
        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.3em]">No saved records found</p>
        <p className="text-gray-600 text-[10px] uppercase tracking-[0.2em] mt-3 max-w-md mx-auto leading-relaxed">
          Any image design analyses you run while authenticated will automatically save to your secure cloud database.
        </p>
      </div>
    );
  }

  const formatDate = (ts: any) => {
    if (!ts) return 'Just now';
    const date = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Vault Records / History ({items.length})</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => onSelect(item)}
            className="group relative cursor-pointer bg-gradient-to-br from-white/[0.03] to-transparent border border-white/[0.06] hover:border-blue-500/40 rounded-2xl p-6 transition-all shadow-md hover:shadow-xl hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors pointer-events-none"></div>
            
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-[8px] text-blue-400 font-extrabold uppercase tracking-widest">{formatDate(item.createdAt)}</p>
                <h4 className="text-xs font-black text-white mt-1.5 truncate max-w-[240px] md:max-w-[320px]">
                  {item.characterPose ? item.characterPose.replace(/^ATTIRE:\s*/i, '').substring(0, 60) + '...' : 'Stored Analysis'}
                </h4>
              </div>
            </div>

            <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed italic font-sans pr-2">
              {item.masterPrompt}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
              {item.cameraAngle && (
                <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/5 truncate max-w-[120px]">
                  {item.cameraAngle.replace(/^CAMERA:\s*/i, '').split(' ')[0] || 'Camera'}
                </span>
              )}
              {item.emotionalVibe && (
                <span className="bg-white/5 px-2.5 py-1 rounded-md border border-white/5 truncate max-w-[120px]">
                  {item.emotionalVibe.replace(/^COLOR:\s*/i, '').split(' ')[0] || 'Aesthetic'}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;
