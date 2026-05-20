import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { AnalysisResult } from '../types';
import { createSpreadsheet, appendSpreadsheetRow, verifySpreadsheet } from '../services/googleSheetsService';

interface GoogleSheetsExportProps {
  result: AnalysisResult;
  getValidGoogleToken: () => Promise<string | null>;
  user: any;
}

const GoogleSheetsExport: React.FC<GoogleSheetsExportProps> = ({ result, getValidGoogleToken, user }) => {
  const [workingSheetId, setWorkingSheetId] = useState<string>('');
  const [workingSheetTitle, setWorkingSheetTitle] = useState<string>('');
  const [workingSheetUrl, setWorkingSheetUrl] = useState<string>('');
  
  const [hasCheckedExisting, setHasCheckedExisting] = useState(false);
  const [isNewSheetMode, setIsNewSheetMode] = useState(true);
  const [newSheetTitle, setNewSheetTitle] = useState('DesignVision UI Prompt Logs');
  const [customSheetId, setCustomSheetId] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Hydrate configurations on mount
  useEffect(() => {
    const savedId = localStorage.getItem('DESIGNVISION_SHEET_ID');
    const savedTitle = localStorage.getItem('DESIGNVISION_SHEET_TITLE');
    const savedUrl = localStorage.getItem('DESIGNVISION_SHEET_URL');

    if (savedId) {
      setWorkingSheetId(savedId);
      setIsNewSheetMode(false);
    }
    if (savedTitle) setWorkingSheetTitle(savedTitle);
    if (savedUrl) setWorkingSheetUrl(savedUrl);
  }, []);

  const resetSavedSheet = () => {
    const confirmReset = window.confirm("Are you sure you want to change your saved Google Sheet? You can connect to another existing sheet or create a new one anytime.");
    if (!confirmReset) return;
    
    // Clear state & storage
    localStorage.removeItem('DESIGNVISION_SHEET_ID');
    localStorage.removeItem('DESIGNVISION_SHEET_TITLE');
    localStorage.removeItem('DESIGNVISION_SHEET_URL');
    setWorkingSheetId('');
    setWorkingSheetTitle('');
    setWorkingSheetUrl('');
    setIsNewSheetMode(true);
    setStatus('idle');
  };

  /**
   * Helper to parse general Spreadsheet URLs or input ID
   */
  const extractSpreadsheetId = (input: string): string => {
    const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      return match[1];
    }
    return input.trim();
  };

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setStatusMessage('Acquiring secure access token...');

    try {
      const token = await getValidGoogleToken();
      if (!token) {
        throw new Error('Could not authenticate with Google. Please try again.');
      }

      let spreadsheetId = workingSheetId;
      let spreadsheetUrl = workingSheetUrl;
      let spreadsheetTitle = workingSheetTitle;
      let isBrandNewSpreadsheet = false;

      if (isNewSheetMode && !spreadsheetId) {
        // Create new spreadsheet
        setStatusMessage('Creating brand new spreadsheet on Google Sheets...');
        const titleToUse = newSheetTitle.trim() || 'DesignVision UI Prompt Logs';
        const sheetInfo = await createSpreadsheet(token, titleToUse);
        
        spreadsheetId = sheetInfo.id;
        spreadsheetUrl = sheetInfo.url;
        spreadsheetTitle = sheetInfo.title;
        isBrandNewSpreadsheet = true;
      } else if (!isNewSheetMode) {
        // Use custom pasted ID
        const targetId = extractSpreadsheetId(customSheetId);
        if (!targetId) {
          throw new Error('Please enter a valid spreadsheet ID or direct URL.');
        }

        setStatusMessage('Verifying access to spreadsheet...');
        const isValid = await verifySpreadsheet(token, targetId);
        if (!isValid) {
          throw new Error('Cannot access this Google Sheet. Please verify the URL or ensure you have permissions.');
        }

        spreadsheetId = targetId;
        spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${targetId}/edit`;
        spreadsheetTitle = 'Connected Google Sheet';
        isBrandNewSpreadsheet = false;
      }

      // 1. If it's a brand new sheet, append the header row to outline columns cleanly
      if (isBrandNewSpreadsheet) {
        setStatusMessage('Configuring header layouts...');
        const headers = [
          'Timestamp',
          'Master Prompt',
          'Subject & Attire',
          'Typography & Text',
          'Visual Effects & Overlays',
          'Color Palette & Mood',
          'Composition & Layout',
          'Camera & Quality'
        ];
        await appendSpreadsheetRow(token, spreadsheetId, 'Sheet1!A1', headers);
      }

      // 2. Append the actual data row
      setStatusMessage('Sending prompt analysis to spreadsheet rows...');
      const timestamp = new Date().toLocaleString();
      const rowData = [
        timestamp,
        result.masterPrompt,
        result.subjectAndAttire,
        result.typographyAndText,
        result.visualEffectsAndOverlays,
        result.colorPaletteAndMood,
        result.compositionAndLayout,
        result.cameraAndQuality
      ];

      // Append to Sheet1!A1 (Sheets resolves this dynamically to the next free row)
      await appendSpreadsheetRow(token, spreadsheetId, 'Sheet1!A1', rowData);

      // Save to local state
      setWorkingSheetId(spreadsheetId);
      setWorkingSheetTitle(spreadsheetTitle);
      setWorkingSheetUrl(spreadsheetUrl);
      
      // Persist in localStorage
      localStorage.setItem('DESIGNVISION_SHEET_ID', spreadsheetId);
      localStorage.setItem('DESIGNVISION_SHEET_TITLE', spreadsheetTitle);
      localStorage.setItem('DESIGNVISION_SHEET_URL', spreadsheetUrl);

      setStatus('success');
      setStatusMessage('Analysis successfully logged to Google Spreadsheet!');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setStatusMessage(err.message || 'An unexpected error occurred during export.');
    }
  };

  return (
    <div className="bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.08] rounded-3xl p-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-2xl">
          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm10 8h-8v-2h8v2zm0-4h-8v-2h8v2zm0-4h-8V7h8v2z"/>
          </svg>
        </div>
        <div>
          <h4 className="text-xs font-black uppercase tracking-[0.3em] text-white">Google Sheets Vault</h4>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Export graphic elements directly to user-managed cells</p>
        </div>
      </div>

      {status === 'loading' && (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="relative w-10 h-10 mb-4">
            <div className="absolute inset-0 border-2 border-green-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-t-green-400 rounded-full animate-spin"></div>
          </div>
          <p className="text-xs text-green-400 font-mono tracking-wide">{statusMessage}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-left">
          <p className="text-[10px] text-red-500 font-black uppercase tracking-[0.1em] mb-1">Export Failed</p>
          <p className="text-xs text-gray-300 font-sans leading-relaxed">{statusMessage}</p>
          <button 
            onClick={() => setStatus('idle')}
            className="mt-3 text-[9px] text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-widest"
          >
            ← Back and Try Again
          </button>
        </div>
      )}

      {status === 'success' && (
        <div className="mb-6 p-5 rounded-2xl border border-green-500/20 bg-green-500/5 text-left flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-green-400 mb-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping"></span>
              <p className="text-[10px] font-black uppercase tracking-wider">Spreadsheet Entry Appended</p>
            </div>
            <p className="text-xs text-gray-300 font-sans">
              Export completed successfully. Elements are now securely stored in Google Sheet: <span className="font-semibold text-white">"{workingSheetTitle}"</span>
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <a 
              href={workingSheetUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-5 py-3 bg-white hover:bg-gray-100 text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2"
            >
              <span>Open Sheet</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button 
              onClick={() => setStatus('idle')}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10"
            >
              Export Again
            </button>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <>
          {workingSheetId ? (
            // Connected sheet mode
            <div className="space-y-5">
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex items-center justify-between gap-6">
                <div>
                  <p className="text-[8px] text-green-400 font-extrabold uppercase tracking-widest leading-none mb-1.5">Connected Vault Spreadsheet</p>
                  <h5 className="text-xs font-black text-white leading-normal truncate max-w-[280px] md:max-w-[400px]">
                    {workingSheetTitle}
                  </h5>
                  <p className="text-[10px] text-gray-500 mt-1 truncate max-w-[280px] md:max-w-[400px] font-mono">
                    ID: {workingSheetId}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetSavedSheet}
                  className="px-3.5 py-2.5 hover:bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black text-red-400 uppercase tracking-widest transition-colors shrink-0"
                >
                  Unlink
                </button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-4">
                <button
                  onClick={handleExport}
                  className="w-full md:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-black hover:scale-[1.01] active:scale-[0.99] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-green-500/15 transition-all text-center flex items-center justify-center gap-3"
                  id="btn-append-to-sheet"
                >
                  <span>Append to Stored Sheet</span>
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                <a 
                  href={workingSheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full md:w-auto px-6 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all text-center flex items-center justify-center gap-2"
                >
                  <span>Open Spreadsheet</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            // Configuration mode
            <form onSubmit={handleExport} className="space-y-6">
              {/* Tabs */}
              <div className="flex border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewSheetMode(true)}
                  className={`pb-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all relative ${
                    isNewSheetMode ? 'text-green-400' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <span>Create Spreadsheet</span>
                  {isNewSheetMode && (
                    <motion.div layoutId="sheets-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewSheetMode(false)}
                  className={`ml-10 pb-3 text-[9px] font-black uppercase tracking-[0.2em] transition-all relative ${
                    !isNewSheetMode ? 'text-green-400' : 'text-gray-500 hover:text-white'
                  }`}
                >
                  <span>Link Existing Sheet</span>
                  {!isNewSheetMode && (
                    <motion.div layoutId="sheets-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-green-400" />
                  )}
                </button>
              </div>

              {isNewSheetMode ? (
                <div>
                  <label className="block text-[8px] font-extrabold uppercase tracking-widest text-gray-400 mb-2.5">Spreadsheet Name</label>
                  <input
                    type="text"
                    value={newSheetTitle}
                    onChange={(e) => setNewSheetTitle(e.target.value)}
                    placeholder="e.g. DesignVision UI Prompt Logs"
                    className="w-full bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-green-500/50 rounded-2xl px-5 py-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-0 font-sans transition-all"
                  />
                  <p className="text-[9px] text-gray-500 mt-2.5 leading-relaxed font-sans">
                    A brand new logbook spreadsheet will be setup in your Google Drive with a custom styled column header.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-[8px] font-extrabold uppercase tracking-widest text-gray-400 mb-2.5">Google Sheets URL or Identifier</label>
                  <input
                    type="text"
                    value={customSheetId}
                    onChange={(e) => setCustomSheetId(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/your-spreadsheet-id/edit..."
                    className="w-full bg-white/[0.02] border border-white/10 hover:border-white/20 focus:border-green-500/50 rounded-2xl px-5 py-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:ring-0 font-sans transition-all"
                  />
                  <p className="text-[9px] text-gray-500 mt-2.5 leading-relaxed font-sans">
                    Paste the browser URL of any Google Sheets document you have write permission to connect.
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full md:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-black font-extrabold hover:scale-[1.01] active:scale-[0.99] rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-green-500/15 transition-all text-center flex items-center justify-center gap-3"
                  id="btn-sheets-configure-run"
                >
                  <span>{isNewSheetMode ? 'Create & Log Row' : 'Connect & Log Row'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default GoogleSheetsExport;
