import React from 'react';
import { motion } from 'motion/react';

interface HeaderProps {
  user: any | null;
  authLoading: boolean;
  onLogin: () => void;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, authLoading, onLogin, onLogout }) => {
  return (
    <header className="py-8 px-6 border-b border-white/[0.08] bg-black/60 backdrop-blur-3xl sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left Logo block */}
        <div className="flex flex-col items-center md:items-start">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/5 mb-3 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em]">GRAPHIC DESIGN CORE v5.0</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter select-none">
            DESIGN<span className="text-blue-600 italic font-light">VISION</span>
          </h1>
        </div>

        {/* Auth profile block */}
        <div className="flex items-center gap-4">
          {authLoading ? (
            <div className="flex gap-1.5 items-center justify-center p-3">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 pr-5">
              {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'} 
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-lg"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-black text-sm text-white">
                  {user.displayName?.[0] || user.email?.[0] || '?'}
                </div>
              )}
              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-normal leading-none mb-1">Authenticated</p>
                <p className="text-xs font-bold text-white leading-normal truncate max-w-[140px]">{user.displayName || user.email}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onLogout}
                className="ml-4 text-[9px] text-red-400 hover:text-red-300 font-extrabold uppercase tracking-widest border border-red-500/20 bg-red-500/5 px-3 py-1.5 rounded-lg transition-colors"
                id="btn-logout"
              >
                Sign Out
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLogin}
              className="px-6 py-3.5 bg-white text-black hover:bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-white/5 transition-all flex items-center gap-3"
              id="btn-login-google"
            >
              <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" fillOpacity="1" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>Connect Google</span>
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
