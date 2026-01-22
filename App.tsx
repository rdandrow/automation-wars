
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Playground from './components/Playground';
import TraceViewer from './components/TraceViewer';
import { SCENARIOS } from './constants';
import { getAutomationHelp, validateUserSolution } from './services/geminiService';
import { ChatMessage, Framework, TraceStep } from './types';
import Prism from 'https://esm.sh/prismjs@1.29.0';
import 'https://esm.sh/prismjs@1.29.0/components/prism-typescript.js';

const STORAGE_KEYS = {
  COMPLETED: 'playwright-lab-completed',
  ACTIVE_SCENARIO: 'playwright-lab-active-scenario',
  ACTIVE_FRAMEWORK: 'playwright-lab-active-framework',
  CODE_PREFIX: 'playwright-lab-code-',
  SIDEBAR_COLLAPSED: 'playwright-lab-sidebar-collapsed'
};

const App: React.FC = () => {
  const [activeScenarioId, setActiveScenarioId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_SCENARIO);
    const exists = SCENARIOS.some(s => s.id === saved);
    return exists && saved ? saved : SCENARIOS[0].id;
  });

  const [framework, setFramework] = useState<Framework>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_FRAMEWORK);
    return Object.values(Framework).includes(saved as Framework) 
      ? (saved as Framework) 
      : Framework.PLAYWRIGHT;
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
  });

  const [completedScenarios, setCompletedScenarios] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPLETED);
    return saved ? JSON.parse(saved) : [];
  });

  const [userCode, setUserCode] = useState<string>('');
  const [isSolutionUnlocked, setIsSolutionUnlocked] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [showTrace, setShowTrace] = useState(false);
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: "Welcome! I'm your Automation Mentor. Stuck on the challenge? Ask me for a hint!" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [validationResult, setValidationResult] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  
  const activeScenario = SCENARIOS.find(s => s.id === activeScenarioId) || SCENARIOS[0];

  // Auto-switch framework if active scenario doesn't support current
  useEffect(() => {
    if (activeScenario.supportedFrameworks && !activeScenario.supportedFrameworks.includes(framework)) {
      setFramework(activeScenario.supportedFrameworks[0]);
    }
  }, [activeScenarioId]);

  useEffect(() => {
    const interval = setInterval(() => {
      const storageKey = `${STORAGE_KEYS.CODE_PREFIX}${activeScenarioId}-${framework}`;
      localStorage.setItem(storageKey, userCode);
      setLastSaved(new Date().toLocaleTimeString());
      setShowSaveIndicator(true);
      setTimeout(() => setShowSaveIndicator(false), 2000);
    }, 30000);
    return () => clearInterval(interval);
  }, [userCode, activeScenarioId, framework]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SCENARIO, activeScenarioId);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_FRAMEWORK, framework);
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(sidebarCollapsed));
  }, [activeScenarioId, framework, sidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COMPLETED, JSON.stringify(completedScenarios));
  }, [completedScenarios]);

  useEffect(() => {
    const storageKey = `${STORAGE_KEYS.CODE_PREFIX}${activeScenarioId}-${framework}`;
    const savedCode = localStorage.getItem(storageKey);

    if (savedCode) {
      setUserCode(savedCode);
    } else {
      let initialCode = '';
      const starter = framework === Framework.PLAYWRIGHT 
        ? activeScenario.playwrightStarterCode 
        : activeScenario.cypressStarterCode;

      if (starter) {
        initialCode = starter;
      } else {
        if (framework === Framework.PLAYWRIGHT) {
          initialCode = `import { test, expect } from '@playwright/test';\n\ntest('${activeScenario.title.toLowerCase().replace(/\s/g, '-')}', async ({ page }) => {\n  // Your Playwright code here...\n  \n});`;
        } else {
          initialCode = `describe('${activeScenario.title}', () => {\n  it('should complete the exercise', () => {\n    // Your code here...\n    \n  });\n});`;
        }
      }
      setUserCode(initialCode);
    }
    
    setIsSolutionUnlocked(false);
    setValidationResult(null);
    setTraceSteps([]);
  }, [activeScenarioId, framework]);

  const handleCodeChange = (newCode: string) => {
    setUserCode(newCode);
    const storageKey = `${STORAGE_KEYS.CODE_PREFIX}${activeScenarioId}-${framework}`;
    localStorage.setItem(storageKey, newCode);
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.currentTarget.scrollTop;
      preRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const value = e.currentTarget.value;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      handleCodeChange(newValue);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setIsTyping(true);

    const aiResponse = await getAutomationHelp(userMsg, framework, activeScenario.description);
    setMessages(prev => [...prev, { role: 'model', content: aiResponse }]);
    setIsTyping(false);
  };

  const handleVerify = async () => {
    setIsValidating(true);
    setValidationResult(null);
    try {
      const result = await validateUserSolution(userCode, activeScenario, framework);
      setValidationResult(result.feedback);
      if (result.isCorrect) {
        const key = `${activeScenario.id}-${framework}`;
        if (!completedScenarios.includes(key)) {
          setCompletedScenarios(prev => [...prev, key]);
        }
      }
    } catch (err) {
      setValidationResult("Error during validation. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRunTests = async () => {
    setIsRunning(true);
    setTraceSteps([]);
    setValidationResult("Running tests in simulated context...");
    await new Promise(r => setTimeout(r, 800));

    const startTime = Date.now();
    const currentTrace: TraceStep[] = [];

    const addStep = (step: Omit<TraceStep, 'timestamp' | 'duration' | 'status'>) => {
      currentTrace.push({
        ...step,
        timestamp: Date.now() - startTime,
        duration: Math.floor(Math.random() * 50) + 20,
        status: 'passed'
      });
      setTraceSteps([...currentTrace]);
    };

    try {
      const dispatch = (detail: any) => {
        window.dispatchEvent(new CustomEvent('automation-command', { detail }));
        
        let networkMeta = undefined;
        if (detail.action.startsWith('api') || detail.action === 'api-call') {
          networkMeta = {
            method: detail.method || (detail.action === 'api_get' ? 'GET' : 'POST'),
            url: detail.endpoint,
            status: detail.response?.status || 200,
            payload: detail.payload,
            response: detail.response?.body
          };
        }

        addStep({
            action: detail.action.toUpperCase(),
            selector: detail.selector,
            label: detail.label,
            value: detail.value,
            // Capture frame information if present in the automation command
            frameSelector: detail.frameSelector,
            network: networkMeta
        });
      };

      const createFrameMock = (frameSelector: string) => ({
        getByRole: (role: string, options: any = {}) => ({
          click: async () => {
             dispatch({ action: 'click', frameSelector, label: options.name || role });
             await new Promise(r => setTimeout(r, 300));
          }
        }),
        getByText: (text: string) => ({
          toBeVisible: async () => {
             // Correctly passing frameSelector to record the nested context in the trace
             addStep({ action: 'EXPECT_VISIBLE', frameSelector, value: text });
             return true;
          }
        }),
        frameLocator: (innerSelector: string) => createFrameMock(`${frameSelector} > ${innerSelector}`)
      });

      const mockRequest = {
        get: async (url: string, options?: any) => {
            let body: any = { id: 1, name: 'John Doe', email: 'john@example.com' };
            let status = 200;

            if (url.includes('/api/secure-data')) {
               const apiKey = options?.headers?.['x-api-key'] || options?.headers?.['X-API-KEY'];
               if (apiKey === 'top-secret-key-123') {
                 body = { secret: 'The password is "blue-falcon"' };
               } else {
                 status = 401;
                 body = { error: 'Unauthorized: Invalid API Key' };
               }
            }

            dispatch({ 
              action: 'api_get', 
              endpoint: url, 
              response: { status, body },
              method: 'GET'
            });

            return {
                ok: () => status < 400,
                status: () => status,
                json: async () => body
            };
        },
        post: async (url: string, options: any) => {
            let body: any;
            let status = 200;
            
            if (url.includes('/api/auth/token')) {
                body = {
                    access_token: 'mock_jwt_access_token_' + Math.random().toString(36).substring(7),
                    token_type: 'Bearer',
                    expires_in: 3600,
                    refresh_token: 'mock_refresh_token'
                };
            } else {
                body = { id: Math.floor(Math.random() * 1000), ...options?.data };
                status = 201;
            }

            dispatch({ 
              action: 'api_post', 
              endpoint: url, 
              payload: options?.data, 
              response: { status, body },
              method: 'POST'
            });

            return {
                ok: () => status < 400,
                status: () => status,
                json: async () => body
            };
        }
      };

      const mockPage = {
        goto: async (url: string) => { 
          addStep({ action: 'GOTO', value: url });
          await new Promise(r => setTimeout(r, 500));
        },
        frameLocator: (selector: string) => createFrameMock(selector),
        route: async (glob: string, handler: any) => {
            const route = {
                fulfill: (response: any) => {
                    dispatch({ action: 'route', glob, mockResponse: response });
                }
            };
            handler(route);
        },
        getByLabel: (label: string) => ({
          fill: async (value: string) => {
            dispatch({ action: 'fill', label, value });
            await new Promise(r => setTimeout(r, 300));
          },
          click: async () => {
             dispatch({ action: 'click', label });
             await new Promise(r => setTimeout(r, 300));
          }
        }),
        getByRole: (role: string, options: any = {}) => ({
          click: async () => {
             dispatch({ action: 'click', label: options.name || role });
             await new Promise(r => setTimeout(r, 300));
          }
        }),
        locator: (selector: string) => ({
          selectOption: async (value: string) => {
            dispatch({ action: 'select', selector, value });
            await new Promise(r => setTimeout(r, 300));
          },
          click: async () => {
             dispatch({ action: 'click', selector });
             await new Promise(r => setTimeout(r, 300));
          },
          dragTo: async (target: any) => {
            dispatch({ action: 'dragTo', selector });
            await new Promise(r => setTimeout(r, 600));
          },
          filter: (options: any) => mockPage.locator(selector) 
        }),
        getByText: (text: string) => ({
          toBeVisible: async () => {
            addStep({ action: 'ASSERT_VISIBLE', value: text });
            return true;
          },
          click: async () => {
            dispatch({ action: 'click', value: text });
            await new Promise(r => setTimeout(r, 300));
          }
        }),
        setInputFiles: async (selector: string, fileData: any) => {
          const fileName = Array.isArray(fileData) ? fileData[0].name : (fileData.name || 'file.txt');
          dispatch({ action: 'upload', selector, value: fileName });
          await new Promise(r => setTimeout(r, 500));
        },
        accessibility: {
          snapshot: async () => {
            addStep({ action: 'A11Y_SNAPSHOT' });
            return {
              children: [
                { name: 'Submit Order', role: 'button', disabled: false }
              ]
            };
          }
        }
      };

      const mockExpect = (val: any) => ({
        toBeVisible: async () => { addStep({ action: 'EXPECT_VISIBLE' }); return true; },
        toHaveValue: async (v: any) => { addStep({ action: 'EXPECT_VALUE', value: v }); return true; },
        toContainText: async (v: any) => { addStep({ action: 'EXPECT_TEXT', value: v }); return true; },
        toBeTruthy: () => true,
        toBeFalsy: () => true,
        toBeDefined: () => true,
        toBe: (v: any) => true,
        status: () => ({ toBe: (s: number) => true }),
        toBeLessThan: (limit: number) => true
      });

      const mockCy = {
        visit: (url: string) => { addStep({ action: 'VISIT', value: url }); },
        request: (arg1: any, arg2?: any, arg3?: any) => {
            let method = 'GET';
            let url = '';
            let body = null;
            let headers = {};

            if (typeof arg1 === 'object') {
              method = arg1.method || 'GET';
              url = arg1.url;
              body = arg1.body || arg1.data || null;
              headers = arg1.headers || {};
            } else {
              if (arg2 && typeof arg2 === 'string') {
                method = arg1;
                url = arg2;
                body = arg3;
              } else {
                url = arg1;
              }
            }
            
            let responseBody: any;
            let status = 200;
            
            if (url.includes('/api/auth/token')) {
               responseBody = {
                    access_token: 'mock_jwt_access_token_' + Math.random().toString(36).substring(7),
                    token_type: 'Bearer',
                    expires_in: 3600
                };
            } else if (url.includes('/api/secure-data')) {
               const apiKey = headers['x-api-key'] || headers['X-API-KEY'];
               if (apiKey === 'top-secret-key-123') {
                 responseBody = { secret: 'The password is "blue-falcon"' };
               } else {
                 status = 401;
                 responseBody = { error: 'Unauthorized' };
               }
            } else {
               responseBody = (method === 'POST') ? { id: 123, ...body } : { id: 1, name: 'John Doe' };
               status = (method === 'POST') ? 201 : 200;
            }

            dispatch({ 
              action: 'api_call', 
              method: method, 
              endpoint: url, 
              payload: body, 
              response: { status, body: responseBody } 
            });

            return {
                then: (cb: any) => cb({ status, body: responseBody })
            };
        },
        get: (selector: string) => ({
          type: (value: string) => { dispatch({ action: 'type', selector, value }); return mockCy; },
          click: () => { dispatch({ action: 'click', selector }); return mockCy; },
          should: () => mockCy,
          select: (value: string) => { dispatch({ action: 'select', selector, value }); return mockCy; },
          then: (cb: any) => { cb(); return mockCy; },
          selectFile: (file: any) => {
            dispatch({ action: 'upload', selector, value: file.fileName || 'file' });
            return mockCy;
          },
          drag: (target: string) => {
            dispatch({ action: 'dragTo', selector });
            return mockCy;
          },
          parent: () => mockCy,
          find: (sub: string) => mockCy,
          its: () => ({ 
            should: () => mockCy,
            then: (cb: any) => {
               cb({ contents: () => ({ find: () => mockCy }) });
               return mockCy;
            }
          })
        }),
        contains: (text: string) => ({
          click: () => { dispatch({ action: 'click', value: text }); return mockCy; },
          should: () => mockCy,
          parent: () => mockCy,
          find: (sub: string) => mockCy
        }),
        intercept: (method: string, glob: string, response: any) => {
            dispatch({ action: 'intercept', glob, mockResponse: { status: response.statusCode, body: JSON.stringify(response.body) } });
            return { as: () => mockCy };
        },
        wait: () => mockCy,
        on: () => mockCy,
        stub: () => ({ getCall: () => ({ to: { be: { calledWith: () => true } } }) }),
        window: () => mockCy,
        injectAxe: () => mockCy,
        checkA11y: () => mockCy
      };

      const executableCode = userCode
        .replace(/import\s+.*\s+from\s+['"].*['"];?/g, '')
        .replace(/test\(.*async\s+\(({ page, request }|{ page }|{ request })\)\s+=>\s+{/g, 'async function runTest(page, request) {')
        .replace(/}\);?$/g, '}');

      const testFn = new Function('page', 'request', 'expect', 'cy', `
        return (async () => {
           ${executableCode}
           if (typeof runTest === 'function') {
             await runTest(page, request);
           }
        })();
      `);

      await testFn(mockPage, mockRequest, mockExpect, mockCy);
      setValidationResult("Simulation Successful! Results updated in the Environment view.");
    } catch (err: any) {
      setValidationResult(`Execution Error: ${err.message}. Ensure your syntax matches the lab's supported actions.`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearResults = () => {
    setTraceSteps([]);
    setValidationResult(null);
  };

  const highlightedCode = Prism.highlight(
    userCode,
    Prism.languages.typescript || Prism.languages.javascript,
    'typescript'
  );

  const lineCount = userCode.split('\n').length;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1);

  const isPlaywrightSupported = !activeScenario.supportedFrameworks || activeScenario.supportedFrameworks.includes(Framework.PLAYWRIGHT);
  const isCypressSupported = !activeScenario.supportedFrameworks || activeScenario.supportedFrameworks.includes(Framework.CYPRESS);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-200">
      <Sidebar 
        activeId={activeScenarioId} 
        onSelect={setActiveScenarioId} 
        completedIds={completedScenarios.map(id => id.split('-')[0])} 
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-medium hidden sm:inline">Challenge:</span>
              <span className="text-white font-bold truncate max-w-[200px]">{activeScenario.title}</span>
            </div>
            <div className="h-6 w-px bg-slate-700 hidden md:block"></div>
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => isPlaywrightSupported && setFramework(Framework.PLAYWRIGHT)}
                title={!isPlaywrightSupported ? "Not available for this scenario" : ""}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all uppercase tracking-wider ${
                  framework === Framework.PLAYWRIGHT 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                } ${!isPlaywrightSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                Playwright
              </button>
              <button 
                onClick={() => isCypressSupported && setFramework(Framework.CYPRESS)}
                title={!isCypressSupported ? "Not available for this scenario" : ""}
                className={`px-3 py-1 rounded text-[10px] font-bold transition-all uppercase tracking-wider ${
                  framework === Framework.CYPRESS 
                    ? 'bg-sky-600 text-white shadow-lg shadow-sky-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                } ${!isCypressSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                Cypress
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex flex-col items-end mr-4 transition-opacity duration-500 ${showSaveIndicator ? 'opacity-100' : 'opacity-40'} hidden lg:flex`}>
               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Auto-saved</span>
               <span className="text-[10px] font-mono text-slate-400">{lastSaved}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleRunTests}
                disabled={isRunning || isValidating}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-lg ${
                  isRunning ? 'bg-amber-600 animate-pulse' : 'bg-slate-800 text-indigo-400 hover:bg-slate-700 border border-indigo-500/20'
                }`}
              >
                {isRunning ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-play-circle text-lg"></i>}
                <span className="hidden sm:inline">{isRunning ? 'Running...' : 'Run Tests'}</span>
              </button>
              {(traceSteps.length > 0 || validationResult) && (
                <button 
                  onClick={handleClearResults}
                  title="Clear trace and results"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-700 transition-all"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              )}
            </div>
            <button 
              onClick={() => setChatOpen(!chatOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                chatOpen ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <i className="fas fa-lightbulb"></i>
              <span className="hidden sm:inline">Hints</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col xl:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            {/* Objectives Section */}
            <section className="bg-slate-900/40 p-5 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold flex items-center gap-2 text-slate-400 uppercase tracking-widest">
                  <i className="fas fa-tasks text-indigo-500"></i>
                  Mission Parameters
                </h2>
                {completedScenarios.includes(`${activeScenario.id}-${framework}`) && (
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                    <i className="fas fa-check-double"></i>
                    {framework} Mastery
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeScenario.learningObjectives.map((obj, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                    {obj}
                  </div>
                ))}
              </div>
            </section>

            {/* Code Editor Section */}
            <section className="flex-1 flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between bg-slate-800 px-4 py-2 rounded-t-xl border-t border-x border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-slate-400">
                    {framework === Framework.PLAYWRIGHT ? 'playwright.spec.ts' : 'cypress.cy.ts'}
                  </span>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={handleVerify}
                    disabled={isValidating || isRunning}
                    className={`text-xs disabled:opacity-50 text-white px-4 py-1 rounded-md transition-all font-bold flex items-center gap-2 shadow-lg ${
                      framework === Framework.PLAYWRIGHT ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20' : 'bg-sky-600 hover:bg-sky-500 shadow-sky-500/20'
                    }`}
                  >
                    {isValidating ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                    Verify {framework}
                  </button>
                </div>
              </div>
              
              <div className="flex-1 relative bg-slate-900 rounded-b-xl overflow-hidden border-x border-b border-slate-700 flex">
                {/* Line Numbers Gutter */}
                <div 
                  ref={lineNumbersRef}
                  className="w-12 bg-slate-900/80 border-r border-slate-800 text-right pr-3 py-6 text-slate-600 font-mono text-sm select-none overflow-hidden"
                >
                  {lineNumbers.map(n => (
                    <div key={n} className="leading-relaxed h-5">{n}</div>
                  ))}
                </div>

                {/* Editor Content */}
                <div className="relative flex-1 overflow-hidden">
                  <pre
                    ref={preRef}
                    aria-hidden="true"
                    className="absolute inset-0 p-6 m-0 fira-code text-sm pointer-events-none overflow-auto whitespace-pre leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: highlightedCode + '\n' }}
                  />
                  <textarea
                    ref={editorRef}
                    value={userCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    onScroll={handleScroll}
                    onKeyDown={handleKeyDown}
                    spellCheck={false}
                    className="absolute inset-0 p-6 m-0 fira-code bg-transparent text-sm text-transparent caret-white resize-none focus:outline-none overflow-auto whitespace-pre leading-relaxed"
                  />
                </div>
              </div>
            </section>

            {validationResult && (
              <section className="bg-slate-900 border border-indigo-500/20 rounded-xl p-4 animate-fade-in shadow-lg">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase flex items-center gap-2">
                        <i className="fas fa-terminal"></i>
                        {framework} Code Review
                    </h3>
                    {framework === Framework.PLAYWRIGHT && traceSteps.length > 0 && (
                        <button 
                            onClick={() => setShowTrace(true)}
                            className="text-[10px] font-bold text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded hover:bg-indigo-500/10 transition-colors flex items-center gap-2"
                        >
                            <i className="fas fa-binoculars"></i>
                            Open Trace Viewer
                        </button>
                    )}
                </div>
                <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed italic">
                  {validationResult}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Playground & Unlock Solution */}
          <div className="xl:w-[480px] flex flex-col gap-6 shrink-0">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[350px] flex flex-col">
              <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Environment</h3>
                <div className="flex gap-1.5 text-[10px] text-slate-500">
                   LIVE RELOAD ACTIVE
                </div>
              </div>
              <div className="flex-1 flex items-center justify-center p-6 relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/5 via-transparent to-transparent"></div>
                <div className="z-10 w-full">
                  <Playground type={activeScenario.playgroundPath} apiSpec={activeScenario.apiSpecification} />
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
              {!isSolutionUnlocked ? (
                <div className="flex flex-col items-center text-center gap-4 py-4">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-2">
                    <i className="fas fa-lock text-xl"></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1 text-sm">Official Solution Locked</h4>
                    <p className="text-xs text-slate-400 px-4">See how to solve this using <b>{framework}</b> best practices.</p>
                  </div>
                  <button 
                    onClick={() => {
                      if(confirm(`Ready to see the reference ${framework} solution?`)) {
                        setIsSolutionUnlocked(true);
                      }
                    }}
                    className="w-full bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 hover:border-rose-500/50 border border-transparent text-slate-300 text-xs font-bold py-2 rounded-lg transition-all"
                  >
                    Unlock {framework} Snippet
                  </button>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Official {framework} Example</h4>
                    <i className="fas fa-lock-open text-emerald-500 text-[10px]"></i>
                  </div>
                  <pre className="fira-code text-[11px] bg-slate-950 p-4 rounded-lg border border-slate-800 overflow-x-auto text-indigo-300 max-h-64">
                    <code>{framework === Framework.PLAYWRIGHT ? activeScenario.playwrightSnippet : activeScenario.cypressSnippet}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Floating AI Mentor Drawer */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col z-50 animate-slide-in-right">
          <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-[0_0_10px_rgba(79,70,229,0.5)]">
                <i className="fas fa-magic text-sm text-white"></i>
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{framework} Expert</h3>
                <span className="text-[10px] text-slate-400">Personalized automation hints</span>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition-colors">
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : msg.role === 'system'
                    ? 'bg-slate-800 text-slate-400 italic text-center w-full'
                    : 'bg-slate-800 text-slate-200 border border-slate-700 shadow-lg'
                }`}>
                   {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl p-3 flex gap-1 items-center">
                  <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur">
            <div className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${framework} syntax...`}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-12 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-white"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 disabled:opacity-50 p-2"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trace Viewer Modal */}
      {showTrace && (
        <TraceViewer 
          steps={traceSteps} 
          onClose={() => setShowTrace(false)} 
          scenarioTitle={activeScenario.title}
        />
      )}

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out forwards; }
        @keyframes slide-in-right { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .animate-slide-in-right { animation: slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        .token.comment { color: #64748b; font-style: italic; }
        .token.string { color: #10b981; }
        .token.keyword { color: #818cf8; font-weight: bold; }
        .token.function { color: #38bdf8; }
        .token.operator { color: #94a3b8; }
        .token.punctuation { color: #475569; }
        .token.boolean { color: #fbbf24; }
        .token.number { color: #fbbf24; }
        .token.regex { color: #e879f9; }
        .token.attr-name { color: #fb7185; }
      `}</style>
    </div>
  );
};

export default App;
