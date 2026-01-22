
import React, { useState, useEffect } from 'react';
import { ApiSpecification } from '../types';

interface PlaygroundProps {
  type: string;
  apiSpec?: ApiSpecification;
}

const Playground: React.FC<PlaygroundProps> = ({ type, apiSpec }) => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selection, setSelection] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // States for scenarios
  const [selectedPremium, setSelectedPremium] = useState<number | null>(null);
  const [perfMetrics, setPerfMetrics] = useState({ load: 0, ttfb: 0 });
  const [a11yViolations, setA11yViolations] = useState<any[]>([]);
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const [networkLogs, setNetworkLogs] = useState<any[]>([]);
  const [apiResponse, setApiResponse] = useState<{ status: number, body: any } | null>(null);
  const [mockConfig, setMockConfig] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [iframeSuccess, setIframeSuccess] = useState(false);
  const [nestedIframeSuccess, setNestedIframeSuccess] = useState(false);
  
  // Maintenance specific
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [asyncBtnVisible, setAsyncBtnVisible] = useState(false);
  const [secretRevealed, setSecretRevealed] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);

  // Cypress Utility specific
  const [dbReady, setDbReady] = useState(false);
  const [mockedUserName, setMockedUserName] = useState<string | null>(null);

  useEffect(() => {
    setLoading(false);
    setSuccess(false);
    setData(null);
    setSelection('');
    setErrors({});
    setSelectedPremium(null);
    setViewingUser(null);
    setNetworkLogs([]);
    setApiResponse(null);
    setMockConfig(null);
    setUploadedFile(null);
    setIframeSuccess(false);
    setNestedIframeSuccess(false);
    setFeedbackSubmitted(false);
    setAsyncBtnVisible(false);
    setSecretRevealed(false);
    setCheckoutStep(0);
    setDbReady(false);
    setMockedUserName(null);
    
    if (type === 'performance') {
      setPerfMetrics({ load: 1240, ttfb: 340 });
    }

    if (type === 'async-loading') {
       setTimeout(() => setAsyncBtnVisible(true), 2500);
    }

    if (type === 'cy-util-repair') {
       // Start a fetch immediately to simulate a real-world component mount
       handleProfileFetch();
    }
    
    if (type === 'accessibility' || type === 'accessibility-tree') {
      setA11yViolations([
        { id: 'color-contrast', impact: 'serious', description: 'Ensure sufficient contrast' },
        { id: 'label', impact: 'critical', description: 'Form elements must have labels' }
      ]);
    }
  }, [type]);

  useEffect(() => {
    const handleAutomation = (e: any) => {
      const { action, selector, value, label, mockResponse, method, endpoint, payload, response, frameSelector } = e.detail;
      
      if (action === 'click') {
        if (type === 'advanced-selectors' && selector?.includes('nth-child(3)')) {
          setSelectedPremium(3);
        }
        if (type === 'table-data' && (label === 'View' || value === 'Charlie')) {
           setViewingUser('Charlie');
        }
        if (type === 'api-mock' && (label === 'Fetch Data' || selector === 'button')) {
            handleFetch();
        }
        
        // Maintenance
        if (type === 'feedback-form' && (label === 'Submit Feedback' || selector === 'button')) {
            setFeedbackSubmitted(true);
        }
        if (type === 'async-loading' && (label === 'Reveal Secret' || selector === '#reveal-btn')) {
            setSecretRevealed(true);
        }
        if (type === 'checkout' && (label === 'Finalize Checkout' || selector === 'button')) {
            setCheckoutStep(1);
        }

        // Iframe handling logic
        if (type === 'iframe-testing' && (frameSelector === '#my-iframe' || selector?.includes('my-iframe'))) {
           if (label === 'Click Me' || selector?.includes('button')) {
              setIframeSuccess(true);
           }
        }

        if (type === 'nested-iframes' && frameSelector?.includes('inner-iframe')) {
           if (label === 'Submit Inner' || selector?.includes('button')) {
              setNestedIframeSuccess(true);
           }
        }
      }

      if (action === 'select') {
        if (type === 'dropdowns') {
          setSelection(value);
        }
      }

      if (action === 'upload') {
        if (type === 'file-upload') {
          setUploadedFile(value);
        }
      }

      if (action === 'route' || action === 'intercept') {
          setMockConfig(mockResponse);
      }

      if (action === 'api_call' || action === 'api-call' || action === 'api_get' || action === 'api_post') {
          if (type === 'cy-db-status' && endpoint?.includes('/api/database/reset')) {
              setDbReady(true);
          }
          setNetworkLogs(prev => [...prev, {
              method: method || (action === 'api_get' ? 'GET' : 'POST'),
              url: endpoint,
              payload,
              status: response?.status || 200,
              body: response?.body,
              timestamp: new Date().toLocaleTimeString()
          }]);
      }
    };

    window.addEventListener('automation-command', handleAutomation);
    return () => window.removeEventListener('automation-command', handleAutomation);
  }, [type, mockConfig]);

  const handleProfileFetch = async () => {
      setLoading(true);
      // Wait a moment to ensure interception can occur
      await new Promise(r => setTimeout(r, 400));
      
      const logEntry = { method: 'GET', url: '/api/v2/profile', status: 'pending' };
      setNetworkLogs(prev => [...prev, logEntry]);
      
      let response;
      if (mockConfig && mockConfig.glob?.includes('v2/profile')) {
          response = { status: mockConfig.status || 200, body: JSON.parse(mockConfig.body || '{}') };
      } else {
          // Default fall-back (simulating what happens if intercept fails or points to wrong path)
          response = { status: 404, body: { error: 'Endpoint not found' } };
      }

      if (response.status === 200 && response.body?.name) {
          setMockedUserName(response.body.name);
      } else {
          setMockedUserName(null);
      }

      setNetworkLogs(prev => {
          const newLogs = [...prev];
          const lastIndex = newLogs.length - 1;
          if (newLogs[lastIndex] && newLogs[lastIndex].url === '/api/v2/profile') {
              newLogs[lastIndex] = { ...newLogs[lastIndex], status: response.status, body: response.body };
          }
          return newLogs;
      });
      setLoading(false);
  };

  const handleFetch = async () => {
      setLoading(true);
      setApiResponse(null);
      const logEntry = { method: 'GET', url: '/api/data', status: 'pending' };
      setNetworkLogs(prev => [...prev, logEntry]);
      
      await new Promise(r => setTimeout(r, 600));

      let response;
      if (mockConfig) {
          response = { status: mockConfig.status || 200, body: JSON.parse(mockConfig.body || '{}') };
      } else {
          response = { status: 200, body: { data: 'Success! Loaded real data.' } };
      }

      setApiResponse(response);
      setNetworkLogs(prev => {
          const newLogs = [...prev];
          const lastIndex = newLogs.length - 1;
          if (newLogs[lastIndex] && newLogs[lastIndex].url === '/api/data') {
              newLogs[lastIndex] = { ...newLogs[lastIndex], status: response.status, body: response.body };
          }
          return newLogs;
      });
      setLoading(false);
  };

  if (type === 'cy-util-repair') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl w-full text-center">
        <h2 className="text-xl font-bold mb-6 text-white">Profile Settings</h2>
        <div className="p-8 bg-slate-900/50 border border-slate-700 rounded-lg">
           {loading ? (
             <div className="flex flex-col items-center gap-2">
                <i className="fas fa-circle-notch fa-spin text-indigo-500"></i>
                <span className="text-xs text-slate-500">Syncing with Cloud...</span>
             </div>
           ) : mockedUserName ? (
             <div className="animate-fade-in flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                   <i className="fas fa-user text-2xl"></i>
                </div>
                <div>
                   <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Display Name</p>
                   <p className="text-lg font-bold text-white">{mockedUserName}</p>
                </div>
             </div>
           ) : (
             <div className="text-rose-400 text-sm font-mono flex flex-col items-center gap-2">
                <i className="fas fa-exclamation-triangle"></i>
                <span>404: User Data Missing</span>
                <button onClick={handleProfileFetch} className="mt-4 text-[10px] text-slate-500 hover:text-white uppercase font-bold border border-slate-700 px-3 py-1 rounded">Retry Fetch</button>
             </div>
           )}
        </div>
      </div>
    );
  }

  if (type === 'cy-db-status') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl w-full">
        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
           <i className="fas fa-database text-indigo-400"></i>
           Service Health
        </h2>
        <div className="space-y-4">
           <div className={`p-4 rounded-lg border flex items-center justify-between transition-all ${
             dbReady ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-900 border-slate-700'
           }`}>
              <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${dbReady ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                 <span className={`text-sm font-bold ${dbReady ? 'text-emerald-400' : 'text-slate-500'}`}>
                    Database: {dbReady ? 'Ready' : 'Unknown State'}
                 </span>
              </div>
              {dbReady && <i className="fas fa-check-circle text-emerald-500"></i>}
           </div>
           {!dbReady && (
              <p className="text-[10px] text-slate-500 italic text-center">
                 Execute your custom database reset command to prepare the environment.
              </p>
           )}
        </div>
      </div>
    );
  }

  if (type === 'feedback-form') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl w-full">
        <h2 className="text-xl font-bold mb-6 text-white">Customer Feedback</h2>
        <div className="space-y-4">
           <textarea placeholder="Tell us what you think..." className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white h-24 text-sm" />
           <button 
             onClick={() => setFeedbackSubmitted(true)}
             className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded text-sm transition-all css-v3-new-submit-style"
           >
             Submit Feedback
           </button>
           {feedbackSubmitted && (
             <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded text-center animate-fade-in">
                <p className="text-emerald-400 text-sm font-bold">Thank you!</p>
             </div>
           )}
        </div>
      </div>
    );
  }

  if (type === 'async-loading') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl w-full text-center">
        <h2 className="text-xl font-bold mb-6 text-white">Data Vault</h2>
        <div className="h-32 flex flex-col items-center justify-center border border-slate-700 border-dashed rounded-lg bg-slate-900/50">
           {!asyncBtnVisible ? (
             <div className="flex flex-col items-center gap-2">
                <i className="fas fa-circle-notch fa-spin text-slate-600"></i>
                <span className="text-xs text-slate-500 italic">Authenticating Secure Connection...</span>
             </div>
           ) : (
             <button 
               id="reveal-btn"
               onClick={() => setSecretRevealed(true)}
               className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2 rounded text-sm transition-all animate-fade-in"
             >
               Reveal Secret
             </button>
           )}
        </div>
        {secretRevealed && (
          <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg animate-fade-in">
            <span className="text-indigo-300 text-sm font-bold">The secret code is 42</span>
          </div>
        )}
      </div>
    );
  }

  if (type === 'checkout') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl w-full">
        <h2 className="text-xl font-bold mb-6 text-white">Shopping Cart</h2>
        <div className="space-y-4">
           <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700">
              <span className="text-slate-300">Playwright Mastery Course</span>
              <span className="text-indigo-400 font-bold">$99.00</span>
           </div>
           
           {checkoutStep === 0 ? (
             <button 
               onClick={() => setCheckoutStep(1)}
               className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded text-sm transition-all flex items-center justify-center gap-2"
             >
               <i className="fas fa-shopping-bag"></i>
               Finalize Checkout
             </button>
           ) : (
             <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded text-center animate-fade-in">
                <i className="fas fa-check-circle text-3xl text-emerald-500 mb-2"></i>
                <p className="text-emerald-400 font-bold">Checkout Successful</p>
                <p className="text-[10px] text-emerald-600 mt-1 uppercase tracking-widest font-bold">Confirmation #XP-9000</p>
             </div>
           )}
        </div>
      </div>
    );
  }

  if (type === 'api-console' || type === 'api-mock') {
      return (
          <div className="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-lg mx-auto overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
              <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between shrink-0">
                  <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest font-bold">API Test Environment</span>
              </div>
              
              {apiSpec && (
                <div className="p-4 bg-slate-950 border-b border-slate-800">
                    <h4 className="text-[10px] font-bold text-indigo-400 uppercase mb-2 flex items-center gap-2">
                      <i className="fas fa-book-open"></i>
                      Endpoint Specification
                    </h4>
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800 text-[11px] font-mono leading-relaxed">
                      <div className="flex items-center gap-2 mb-2">
                          <span className={`${apiSpec.method === 'GET' ? 'text-emerald-400' : 'text-indigo-400'} font-bold`}>{apiSpec.method}</span>
                          <span className="text-slate-300">{apiSpec.endpoint}</span>
                      </div>
                      
                      {apiSpec.requestBody && apiSpec.requestBody !== 'None' && (
                        <>
                          <div className="text-slate-500 mb-1">Request Body (Required):</div>
                          <pre className="text-emerald-400/80 mb-2 whitespace-pre-wrap">
                            {apiSpec.requestBody}
                          </pre>
                        </>
                      )}
                      
                      <div className="text-slate-500 mb-1">Expected Response:</div>
                      <div className="text-slate-400 italic">{apiSpec.expectedResponse}</div>
                    </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Live Network Logs</span>
                      <button onClick={() => setNetworkLogs([])} className="text-[9px] text-slate-600 hover:text-slate-400 transition-colors uppercase font-bold">Clear</button>
                  </div>
                  {networkLogs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 opacity-20">
                          <i className="fas fa-satellite-dish text-2xl mb-2"></i>
                          <p className="text-[10px]">Awaiting Requests...</p>
                      </div>
                  ) : (
                      networkLogs.map((log, idx) => (
                          <div key={idx} className="border-l-2 border-slate-700 pl-3 py-1 animate-fade-in bg-slate-800/20 rounded-r">
                              <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                      <span className={`font-bold ${log.method === 'GET' ? 'text-emerald-400' : 'text-indigo-400'}`}>{log.method}</span>
                                      <span className="text-slate-300 text-[10px] truncate max-w-[150px]">{log.url}</span>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded-[2px] font-bold text-[9px] ${
                                      log.status === 'pending' ? 'bg-slate-700 text-slate-400 animate-pulse' :
                                      log.status >= 400 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                                  }`}>
                                      {log.status}
                                  </span>
                              </div>
                              {log.payload && (
                                  <div className="mt-2 p-2 bg-slate-950/50 rounded text-[9px]">
                                      <div className="text-slate-600 mb-1 uppercase font-bold text-[8px]">Request Payload</div>
                                      <pre className="text-indigo-300/80">{JSON.stringify(log.payload, null, 2)}</pre>
                                  </div>
                              )}
                              {log.body && (
                                  <div className="mt-2 p-2 bg-slate-950/50 rounded text-[9px]">
                                      <div className="text-slate-600 mb-1 uppercase font-bold text-[8px]">Response Body</div>
                                      <pre className="text-slate-400/80">{JSON.stringify(log.body, null, 2)}</pre>
                                  </div>
                              )}
                          </div>
                      ))
                  )}
              </div>

              {type === 'api-mock' && (
                  <div className="p-4 bg-slate-800/50 border-t border-slate-700">
                      <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold text-slate-500 uppercase">UI Application</span>
                          <span className="text-[9px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                      </div>
                      <button 
                        onClick={handleFetch}
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                      >
                        {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                        Fetch Data
                      </button>
                      {apiResponse && (
                          <div className={`mt-3 p-3 rounded text-xs border ${
                              apiResponse.status >= 400 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          }`}>
                              {apiResponse.status >= 400 ? `Error: ${apiResponse.body.error || 'Failed'}` : apiResponse.body.data}
                          </div>
                      )}
                  </div>
              )}
          </div>
      );
  }

  if (type === 'iframe-testing') {
    return (
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-lg mx-auto shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-white">Main Content</h2>
        <div id="my-iframe" className="border-2 border-indigo-500/30 bg-slate-900 rounded-lg p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-1 bg-indigo-500/20 text-[8px] font-mono text-indigo-400 rounded-bl border-b border-l border-indigo-500/30">
            IFRAME CONTEXT
          </div>
          <div className="flex flex-col items-center gap-4 py-4">
             <i className="fas fa-ghost text-4xl text-slate-700 group-hover:text-indigo-500/50 transition-colors"></i>
             <button onClick={() => setIframeSuccess(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2 rounded text-sm transition-all">Click Me</button>
          </div>
          {iframeSuccess && (
            <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded text-center animate-fade-in">
               <span className="text-emerald-400 text-sm font-bold">Success!</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (type === 'nested-iframes') {
    return (
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-lg mx-auto shadow-2xl">
        <h2 className="text-lg font-bold mb-4 text-white">Outer Document</h2>
        <div id="outer-iframe" className="border-2 border-amber-500/30 bg-slate-900/50 rounded-lg p-6 relative">
          <p className="text-[10px] text-slate-500 mb-4 uppercase font-bold tracking-tighter">Outer Iframe Body</p>
          <div id="inner-iframe" className="border-2 border-indigo-500/30 bg-slate-900 rounded-lg p-6 relative">
             <div className="flex flex-col items-center gap-4 py-2">
                <button onClick={() => setNestedIframeSuccess(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded text-xs transition-all">Submit Inner</button>
             </div>
             {nestedIframeSuccess && (
               <div className="mt-2 text-center text-xs font-bold text-emerald-400 animate-fade-in">Nested Success!</div>
             )}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'dropdowns') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl w-full">
        <h2 className="text-xl font-bold mb-6 text-white">Framework Settings</h2>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="framework-select" className="text-xs font-bold text-slate-500 uppercase">Select Preferred Framework</label>
            <select id="framework-select" value={selection} onChange={(e) => setSelection(e.target.value)} className="bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
              <option value="">-- Choose --</option>
              <option value="playwright">Playwright</option>
              <option value="cypress">Cypress</option>
              <option value="selenium">Selenium</option>
              <option value="webdriverio">WebdriverIO</option>
            </select>
          </div>
          <div className="h-12 flex items-center justify-center bg-slate-900/50 rounded border border-slate-700 border-dashed">
            {selection ? <span className="text-sm font-bold text-indigo-400 animate-fade-in">Selected: {selection.charAt(0).toUpperCase() + selection.slice(1)}</span> : <span className="text-xs text-slate-600 italic">No framework selected</span>}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'file-upload') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl w-full text-center">
        <h2 className="text-xl font-bold mb-6 text-white">Cloud Storage</h2>
        <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 bg-slate-900/50 hover:border-indigo-500/50 transition-colors cursor-pointer group" onClick={() => document.getElementById('file-input')?.click()}>
          <input id="file-input" type="file" className="hidden" onChange={(e) => setUploadedFile(e.target.files?.[0]?.name || null)} />
          <i className="fas fa-cloud-upload-alt text-4xl text-slate-700 mb-4 group-hover:text-indigo-500 transition-colors"></i>
          <p className="text-sm text-slate-400">Click or drag files here to upload</p>
        </div>
        {uploadedFile && <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg animate-fade-in flex items-center justify-between"><div className="flex items-center gap-3"><i className="fas fa-file-code text-emerald-500"></i><span className="text-emerald-400 text-sm font-bold">File "{uploadedFile}" uploaded</span></div><i className="fas fa-check-circle text-emerald-500"></i></div>}
      </div>
    );
  }

  if (type === 'accessibility-tree') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-white">Semantic UI Preview</h2>
        <div className="space-y-6">
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-4">Visual Controls</h3>
            <div className="flex flex-col gap-3">
              <label className="text-xs text-slate-400">Order Quantity</label>
              <input type="number" defaultValue={1} className="bg-slate-800 border border-slate-700 rounded p-2 text-sm" />
              <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded text-sm transition-colors">Submit Order</button>
            </div>
          </div>
          <div className="p-4 bg-slate-950 rounded-lg border border-indigo-500/20">
            <h3 className="text-[10px] font-bold text-indigo-400 uppercase mb-3 flex items-center gap-2"><i className="fas fa-sitemap"></i>Mock Accessibility Tree</h3>
            <ul className="text-[11px] font-mono space-y-1 text-slate-500">
              <li>{`<root role="WebArea" name="Semantic UI Preview">`}</li>
              <li className="pl-4">{`<text name="Order Quantity" />`}</li>
              <li className="pl-4">{`<spinbutton name="Order Quantity" value="1" />`}</li>
              <li className="pl-4 text-emerald-400 font-bold">{`<button name="Submit Order" />`}</li>
              <li>{`</root>`}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'table-data') {
    const tableData = [{ id: 1, name: 'Alice', role: 'Admin', status: 'Active' }, { id: 2, name: 'Bob', role: 'Editor', status: 'Inactive' }, { id: 3, name: 'Charlie', role: 'Viewer', status: 'Active' }, { id: 4, name: 'Diana', role: 'Manager', status: 'Pending' }];
    return (
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 w-full max-w-lg mx-auto shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-white">System Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="text-slate-500 uppercase text-[10px] font-bold border-b border-slate-700">
              <tr><th className="pb-3 px-2">Name</th><th className="pb-3 px-2">Role</th><th className="pb-3 px-2">Status</th><th className="pb-3 px-2">Action</th></tr>
            </thead>
            <tbody className="text-slate-300">
              {tableData.map((user) => (
                <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="py-3 px-2 font-medium">{user.name}</td><td className="py-3 px-2">{user.role}</td>
                  <td className="py-3 px-2"><span className={`status-badge px-2 py-0.5 rounded-full text-[10px] font-bold ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : user.status === 'Inactive' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{user.status}</span></td>
                  <td className="py-3 px-2"><button onClick={() => setViewingUser(user.name)} className="text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase transition-colors">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {viewingUser && <div className="mt-6 p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-lg animate-fade-in flex justify-between items-center"><span className="text-indigo-300 text-sm font-bold">Viewing details for {viewingUser}</span><button onClick={() => setViewingUser(null)} className="text-slate-500 hover:text-white"><i className="fas fa-times"></i></button></div>}
      </div>
    );
  }

  if (type === 'advanced-selectors') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl">
        <h2 className="text-xl font-bold mb-4 text-white">Item Inventory</h2>
        <div className="item-container space-y-2 mb-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} data-item-type="premium" onClick={() => setSelectedPremium(i)} className={`p-3 rounded border border-slate-700 cursor-pointer transition-colors ${selectedPremium === i ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900 hover:bg-slate-700'}`}>
              <div className="text-xs font-bold text-slate-400">#ITEM-00{i}</div><div className="text-sm">Premium Listing {i}</div>
            </div>
          ))}
        </div>
        <div className="selection-status text-center text-sm font-bold text-indigo-400">{selectedPremium ? `Premium Item ${selectedPremium} selected` : 'No selection made'}</div>
      </div>
    );
  }

  if (type === 'performance') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl">
        <h2 className="text-xl font-bold mb-6 text-white text-center">Diagnostics Panel</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-lg text-center border border-slate-700"><div className="text-[10px] text-slate-500 uppercase font-bold">Load Event</div><div className="text-2xl font-mono text-emerald-400">{perfMetrics.load}ms</div></div>
          <div className="bg-slate-900 p-4 rounded-lg text-center border border-slate-700"><div className="text-[10px] text-slate-500 uppercase font-bold">TTFB</div><div className="text-2xl font-mono text-emerald-400">{perfMetrics.ttfb}ms</div></div>
        </div>
      </div>
    );
  }

  if (type === 'accessibility') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl">
        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2"><i className="fas fa-universal-access text-indigo-400"></i>Audit Target</h2>
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 space-y-3">
             <div className="text-xs text-slate-500 font-bold uppercase">Mock Form (Intentional Violations)</div>
             <input type="text" placeholder="No Label Field" className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-sm text-slate-400" />
             <button className="bg-slate-700 text-slate-600 px-4 py-1 rounded text-xs">Low Contrast Button</button>
          </div>
          <div className="mt-4">
            <div className="text-[10px] text-rose-500 font-bold uppercase mb-2">Violations Found</div>
            <div className="space-y-2">
               {a11yViolations.map((v, idx) => (<div key={idx} className="text-[11px] p-2 bg-rose-500/10 border border-rose-500/20 rounded flex items-center justify-between"><span className="text-rose-400 font-mono">{v.id}</span><span className="px-1.5 py-0.5 bg-rose-600 text-white rounded-[2px] text-[9px] uppercase">{v.impact}</span></div>))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'login') {
    return (
      <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 max-w-md mx-auto shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-white">Member Login</h2>
        <div className="space-y-4">
          <input className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white" placeholder="Username" />
          <input className="w-full bg-slate-900 border border-slate-700 rounded px-4 py-2 text-white" type="password" placeholder="Password" />
          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded transition-colors">Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 italic">
      <i className="fas fa-terminal text-4xl mb-4 opacity-20"></i>
      Select a scenario to load the playground.
    </div>
  );
};

export default Playground;
