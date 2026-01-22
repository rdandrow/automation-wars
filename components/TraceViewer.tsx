
import React, { useState } from 'react';
import { TraceStep } from '../types';

interface TraceViewerProps {
  steps: TraceStep[];
  onClose: () => void;
  scenarioTitle: string;
}

type TabType = 'Call' | 'Console' | 'Network' | 'Source';

const TraceViewer: React.FC<TraceViewerProps> = ({ steps, onClose, scenarioTitle }) => {
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('Call');
  const selectedStep = steps[selectedStepIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col font-sans text-slate-300">
      {/* Top Bar */}
      <header className="h-12 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
            <i className="fas fa-search text-[10px] text-white"></i>
          </div>
          <span className="text-xs font-bold text-white uppercase tracking-wider">Playwright Trace Viewer</span>
          <span className="text-slate-500 text-xs px-2 border-l border-slate-800">{scenarioTitle}</span>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors p-2"
        >
          <i className="fas fa-times text-lg"></i>
        </button>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Actions List */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
            <i className="fas fa-list text-xs text-indigo-400"></i>
            <span className="text-[10px] font-bold uppercase text-slate-400">Actions</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedStepIndex(idx)}
                className={`w-full text-left p-3 border-b border-slate-800/50 transition-colors flex items-start gap-3 ${
                  selectedStepIndex === idx ? 'bg-indigo-600/10 border-l-2 border-l-indigo-500' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className={`mt-1 shrink-0 w-2 h-2 rounded-full ${step.status === 'passed' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <div className="min-w-0">
                  <div className="text-xs font-mono font-bold text-white truncate">
                    {step.action}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 truncate italic">
                    {/* Displaying frame context in the action list for better visibility */}
                    {step.frameSelector ? `[${step.frameSelector}] ` : ''}
                    {step.selector || step.label || '/playground'}
                  </div>
                  <div className="text-[9px] text-slate-600 mt-1 font-mono">
                    {step.duration}ms
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Center: Snapshot Area */}
        <main className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden p-6">
          <div className="flex-1 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col overflow-hidden shadow-2xl">
            <div className="bg-slate-800 p-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                </div>
                <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded">DOM Snapshot @ {selectedStep?.timestamp}ms</span>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(circle_at_center,_#1e293b_0%,_#0f172a_100%)]">
                <div className="text-center">
                    <i className="fas fa-camera text-4xl text-slate-800 mb-4"></i>
                    <p className="text-slate-600 font-mono text-xs">Snapshot for "{selectedStep?.action}"</p>
                    <p className="text-[10px] text-slate-700 mt-2 italic max-w-xs">In a live environment, Playwright records the complete DOM state and allows you to inspect elements directly within this viewer.</p>
                </div>
            </div>
          </div>
          
          {/* Bottom: Metadata Tabs */}
          <div className="h-48 mt-6 bg-slate-900 rounded-t-xl border-t border-x border-slate-800 overflow-hidden flex flex-col">
            <div className="flex border-b border-slate-800 px-4">
              {(['Call', 'Console', 'Network', 'Source'] as TabType[]).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-[10px] font-bold uppercase transition-colors relative ${activeTab === tab ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500"></div>}
                </button>
              ))}
            </div>
            <div className="p-4 font-mono text-[11px] space-y-2 overflow-y-auto">
              {activeTab === 'Call' && (
                <div className="grid grid-cols-[100px_1fr] gap-2">
                  <span className="text-slate-500">Action:</span>
                  <span className="text-indigo-300">{selectedStep?.action}</span>
                  {/* Detailed target and frame information in the call metadata */}
                  <span className="text-slate-500">Frame:</span>
                  <span className="text-slate-300">{selectedStep?.frameSelector || 'main'}</span>
                  <span className="text-slate-500">Target:</span>
                  <span className="text-slate-300">{selectedStep?.selector || selectedStep?.label || 'N/A'}</span>
                  <span className="text-slate-500">Value:</span>
                  <span className="text-slate-300">"{selectedStep?.value || 'N/A'}"</span>
                  <span className="text-slate-500">Time:</span>
                  <span className="text-slate-300">{selectedStep?.timestamp}ms</span>
                </div>
              )}

              {activeTab === 'Network' && (
                <div className="space-y-4">
                  {!selectedStep?.network ? (
                    <div className="text-slate-600 italic">No network activity for this step.</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                         <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${selectedStep.network.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                           {selectedStep.network.method}
                         </span>
                         <span className="text-slate-300 text-xs truncate">{selectedStep.network.url}</span>
                         <span className={`ml-auto text-xs font-bold ${selectedStep.network.status >= 400 ? 'text-rose-500' : 'text-emerald-500'}`}>
                           {selectedStep.network.status}
                         </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <div className="text-[9px] font-bold text-slate-600 uppercase">Request Payload</div>
                           <pre className="p-2 bg-slate-950 rounded text-[9px] text-slate-400 max-h-24 overflow-y-auto">
                             {selectedStep.network.payload ? JSON.stringify(selectedStep.network.payload, null, 2) : '{}'}
                           </pre>
                        </div>
                        <div className="space-y-2">
                           <div className="text-[9px] font-bold text-slate-600 uppercase">Response Body</div>
                           <pre className="p-2 bg-slate-950 rounded text-[9px] text-slate-400 max-h-24 overflow-y-auto">
                             {selectedStep.network.response ? JSON.stringify(selectedStep.network.response, null, 2) : '{}'}
                           </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'Console' && (
                <div className="text-slate-600 italic">No console output recorded for this action.</div>
              )}

              {activeTab === 'Source' && (
                <div className="text-indigo-400/80">
                   {`// Source mapping unavailable in simulation\n// In Playwright, you can view the exact line of code.`}
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right: Metadata sidebar */}
        <aside className="w-64 border-l border-slate-800 bg-slate-900/50 p-4 space-y-6">
          <section>
            <h4 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Test Info</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-600">Duration</span>
                <span className="text-slate-300 font-mono">{steps.reduce((acc, s) => acc + s.duration, 0)}ms</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-600">Steps</span>
                <span className="text-slate-300 font-mono">{steps.length}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-600">Browser</span>
                <span className="text-slate-300 font-mono">chromium</span>
              </div>
            </div>
          </section>
          
          <section className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
             <div className="flex items-center gap-2 mb-2">
               <i className="fas fa-check-circle text-emerald-500 text-[10px]"></i>
               <span className="text-[10px] font-bold text-emerald-400 uppercase">Test Result</span>
             </div>
             <p className="text-[10px] text-emerald-600 italic">Validation passed for Chromium, Firefox and WebKit.</p>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default TraceViewer;
