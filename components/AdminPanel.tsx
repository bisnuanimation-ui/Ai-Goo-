import React, { useState } from 'react';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '152643') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('ভুল পাসওয়ার্ড!');
    }
  };

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    alert('API Key সেভ হয়েছে!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
      <div className="bg-gray-900 border border-white/10 p-8 rounded-3xl w-full max-w-md shadow-2xl">
        {!isAuthenticated ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <h2 className="text-xl font-black text-white uppercase tracking-widest">অ্যাডমিন লগইন</h2>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="পাসওয়ার্ড দিন"
              className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white"
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest">প্রবেশ করুন</button>
          </form>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-black text-white uppercase tracking-widest">API Key সেট করুন</h2>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="আপনার Gemini API Key"
              className="w-full bg-black/50 border border-white/10 p-4 rounded-xl text-white"
            />
            <button onClick={handleSave} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold uppercase tracking-widest">সেভ করুন</button>
            <button onClick={onClose} className="w-full bg-gray-700 text-white py-3 rounded-xl font-bold uppercase tracking-widest">বন্ধ করুন</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
