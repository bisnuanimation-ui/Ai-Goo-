
import React from 'react';

interface ImagePreviewProps {
  image: string | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  isAnalyzing: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, onUpload, onRemove, isAnalyzing }) => {
  return (
    <div className="w-full max-w-3xl mx-auto mb-12 group">
      <div className="flex justify-between items-center mb-3 px-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-500">Source Asset Analysis</span>
        {image && !isAnalyzing && (
          <button 
            onClick={onRemove}
            className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-black tracking-tighter"
          >
            Clear Asset
          </button>
        )}
      </div>
      <div 
        className={`relative aspect-[16/9] rounded-[2rem] border-2 border-dashed transition-all duration-700 flex flex-col items-center justify-center overflow-hidden
          ${image ? 'border-white/20 bg-black shadow-[0_0_50px_rgba(0,0,0,0.8)]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'}`}
      >
        {image ? (
          <img 
            src={image} 
            alt="Source" 
            className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="text-center p-12">
            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6 bg-white/5 border border-white/10 transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-gray-300 text-sm font-black uppercase tracking-[0.2em]">Upload Design Asset</p>
            <p className="text-gray-500 text-[10px] uppercase tracking-widest mt-2">Maximum fidelity analysis engine</p>
          </div>
        )}
        
        <input 
          type="file" 
          accept="image/*"
          onChange={onUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={isAnalyzing}
        />
      </div>
    </div>
  );
};

export default ImagePreview;
