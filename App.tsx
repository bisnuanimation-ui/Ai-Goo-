import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { onAuthStateChanged, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './firebase';

import Header from './components/Header';
import ImagePreview from './components/ImagePreview';
import ResultsView from './components/ResultsView';
import AdminPanel from './components/AdminPanel';
import HistoryList from './components/HistoryList';
import { analyzeImage } from './services/geminiService';
import { AppState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    image: null,
    imageMimeType: null,
    isAnalyzing: false,
    result: null,
    error: null,
  });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Monitor auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        await syncUserProfile(currentUser);
        await fetchUserHistory(currentUser.uid);
      } else {
        setHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const syncUserProfile = async (currentUser: any) => {
    const userRef = doc(db, 'users', currentUser.uid);
    try {
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || '',
          photoURL: currentUser.photoURL || '',
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${currentUser.uid}`);
    }
  };

  const fetchUserHistory = async (uid: string) => {
    try {
      const historyRef = collection(db, 'users', uid, 'analyses');
      const q = query(historyRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(items);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, `users/${uid}/analyses`);
    }
  };

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
      }
    } catch (error) {
      console.error("Authentication Error:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAccessToken(null);
    } catch (error) {
      console.error("Sign Out Error:", error);
    }
  };

  const getValidGoogleToken = async (): Promise<string | null> => {
    if (accessToken) return accessToken;
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setAccessToken(credential.accessToken);
        return credential.accessToken;
      }
    } catch (error) {
      console.error("Failed to acquire access token:", error);
      throw error;
    }
    return null;
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setState(prev => ({ ...prev, error: 'Please select a valid image file.' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setState(prev => ({
        ...prev,
        image: base64,
        imageMimeType: file.type,
        result: null,
        error: null,
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, []);

  const handleRemove = useCallback(() => {
    setState(prev => ({
      ...prev,
      image: null,
      imageMimeType: null,
      result: null,
      error: null
    }));
  }, []);

  const handleAnalyze = async () => {
    if (!state.image || !state.imageMimeType) return;

    setState(prev => ({ ...prev, isAnalyzing: true, error: null }));
    
    try {
      const result = await analyzeImage(state.image, state.imageMimeType);
      
      // Automatically save to history in background if authorized
      if (auth.currentUser) {
        try {
          const analysesRef = collection(db, 'users', auth.currentUser.uid, 'analyses');
          await addDoc(analysesRef, {
            uid: auth.currentUser.uid,
            cameraAngle: result.cameraAndQuality || '',
            backgroundSetting: result.compositionAndLayout || '',
            characterPose: result.subjectAndAttire || '',
            emotionalVibe: result.colorPaletteAndMood || '',
            locationDetails: result.visualEffectsAndOverlays || '',
            masterPrompt: result.masterPrompt,
            createdAt: serverTimestamp()
          });
          await fetchUserHistory(auth.currentUser.uid);
        } catch (dbErr) {
          handleFirestoreError(dbErr, OperationType.CREATE, `users/${auth.currentUser.uid}/analyses`);
        }
      }
      
      setState(prev => ({ ...prev, result, isAnalyzing: false }));
    } catch (err: any) {
      console.error(err);
      let errorMessage = 'Analysis failed. Please check your connection.';
      
      if (err.message?.includes('RESOURCE_EXHAUSTED') || err.status === 429) {
        errorMessage = 'Quota Exceeded: Your API limit has been reached. Please wait a minute and try again.';
      } else if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('401')) {
        errorMessage = 'Invalid API Key: Please verify your Gemini API key configuration.';
      }
      
      setState(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: errorMessage 
      }));
    }
  };

  const handleSelectHistoryItem = (item: any) => {
    setState(prev => ({
      ...prev,
      image: null,
      imageMimeType: null,
      result: {
        subjectAndAttire: item.characterPose || '',
        typographyAndText: 'See original template prompt',
        visualEffectsAndOverlays: item.locationDetails || '',
        colorPaletteAndMood: item.emotionalVibe || '',
        compositionAndLayout: item.backgroundSetting || '',
        cameraAndQuality: item.cameraAngle || '',
        masterPrompt: item.masterPrompt,
      },
      error: null
    }));
    // Scroll smoothly to results view
    setTimeout(() => {
      const element = document.getElementById('results-section-view');
      element?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const isReady = !!state.image && !state.isAnalyzing;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pb-20 selection:bg-blue-500/30"
    >
      <Header 
        user={user} 
        authLoading={authLoading} 
        onLogin={handleLogin} 
        onLogout={handleLogout} 
      />
      
      <main className="max-w-6xl mx-auto px-6 mt-16 space-y-16">
        <section className="mb-16">
          <ImagePreview 
            image={state.image} 
            onUpload={handleFileUpload} 
            onRemove={handleRemove}
            isAnalyzing={state.isAnalyzing}
          />
          
          <div className="flex flex-col items-center gap-6 mt-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAnalyze}
              disabled={!isReady}
              id="btn-extract-graphics"
              className={`group relative overflow-hidden px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.4em] transition-all transform
                ${isReady 
                  ? 'bg-white text-black hover:bg-gray-100 shadow-[0_0_40px_rgba(255,255,255,0.08)]' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'}`}
            >
              {state.isAnalyzing && (
                <>
                  <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-blue-500/40 shadow-[0_0_12px_rgba(59,130,246,0.6)] scan-line pointer-events-none"></div>
                </>
              )}

              <span className="relative z-10 flex items-center gap-5">
                {state.isAnalyzing ? (
                  <>
                    <div className="flex gap-1.5 items-center">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                    </div>
                    <span>Analyzing Design</span>
                  </>
                ) : (
                  'Extract Graphic Elements'
                )}
              </span>
            </motion.button>
            
            {state.error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md text-center"
              >
                <p className="text-red-500 bg-red-500/10 px-6 py-4 rounded-xl border border-red-500/20 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                  ERR: {state.error}
                </p>
                <p className="mt-4 text-gray-600 text-[9px] uppercase tracking-[0.2em]">
                  Please wait 60 seconds if this is a rate limit error.
                </p>
              </motion.div>
            )}
          </div>
        </section>

        <AnimatePresence>
          {state.result && (
            <motion.div 
              id="results-section-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="animate-in fade-in slide-in-from-bottom-12 duration-1000 pt-8"
            >
              <ResultsView 
                result={state.result} 
                getValidGoogleToken={getValidGoogleToken} 
                user={user} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {user && (
          <section className="border-t border-white/[0.05] pt-16">
            <HistoryList items={history} onSelect={handleSelectHistoryItem} />
          </section>
        )}
      </main>

      <footer className="mt-20 py-10 border-t border-white/[0.05] text-center">
        <p className="text-[9px] text-gray-700 font-black uppercase tracking-[0.6em]">Graphic Design Intelligence / Vision Core 5.0</p>
        <button 
          onClick={() => setShowAdminPanel(true)}
          className="mt-4 text-[8px] text-gray-800 hover:text-white transition-colors uppercase tracking-[0.2em]"
          id="btn-admin-access"
        >
          Admin Access
        </button>
      </footer>

      {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
    </motion.div>
  );
};

export default App;
