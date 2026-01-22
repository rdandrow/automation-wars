
import React, { useState } from 'react';
import { SCENARIOS } from '../constants';
import { Difficulty, Category } from '../types';

interface SidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
  completedIds: string[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeId, onSelect, completedIds, isCollapsed, onToggleCollapse }) => {
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'All'>('All');

  const getDiffColor = (diff: Difficulty) => {
    switch (diff) {
      case Difficulty.BASIC: return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case Difficulty.INTERMEDIATE: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case Difficulty.ADVANCED: return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  const getCategoryIcon = (cat: Category) => {
    switch (cat) {
      case Category.WEB_UI: return 'fa-layer-group';
      case Category.ADVANCED_SELECTORS: return 'fa-crosshairs';
      case Category.PERFORMANCE: return 'fa-gauge-high';
      case Category.ACCESSIBILITY: return 'fa-universal-access';
      case Category.IFRAME_TESTING: return 'fa-window-restore';
      case Category.API_TESTING: return 'fa-network-wired';
      case Category.MAINTENANCE: return 'fa-screwdriver-wrench';
      case Category.CYPRESS_UTILS: return 'fa-toolbox';
      default: return 'fa-vial';
    }
  };

  const filteredScenarios = SCENARIOS.filter(s => 
    filterDifficulty === 'All' || s.difficulty === filterDifficulty
  );

  return (
    <aside 
      className={`border-r border-slate-800 h-full overflow-y-auto flex flex-col bg-slate-900 transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'w-16' : 'w-80'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button 
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 bg-slate-800 border border-slate-700 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white z-20 shadow-xl"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <i className={`fas fa-chevron-${isCollapsed ? 'right' : 'left'} text-[10px]`}></i>
      </button>

      <div className={`p-6 border-b border-slate-800 flex flex-col gap-4 ${isCollapsed ? 'items-center px-0' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
             <i className="fas fa-vial text-white"></i>
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-indigo-100 whitespace-nowrap">Playwright Lab</h1>
              <p className="text-[10px] text-slate-500 whitespace-nowrap">Master Modern Web Testing</p>
            </div>
          )}
        </div>

        {/* Difficulty Filter Pills */}
        {!isCollapsed && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(['All', ...Object.values(Difficulty)] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setFilterDifficulty(diff)}
                className={`px-2 py-1 rounded text-[9px] font-bold uppercase tracking-tighter border transition-all ${
                  filterDifficulty === diff
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        )}
      </div>
      
      <nav className={`flex-1 py-4 space-y-8 overflow-x-hidden ${isCollapsed ? 'px-2' : 'p-4'}`}>
        {Object.values(Category).map((category) => {
          const categoryScenarios = filteredScenarios.filter(s => s.category === category);
          
          if (categoryScenarios.length === 0) return null;

          return (
            <div key={category} className="space-y-2 animate-fade-in">
              {!isCollapsed ? (
                <h3 className="px-2 text-[10px] uppercase tracking-wider font-bold text-slate-500 flex items-center gap-2 mb-3">
                  <i className={`fas ${getCategoryIcon(category)}`}></i>
                  {category}
                </h3>
              ) : (
                <div className="h-px bg-slate-800 my-4" />
              )}
              
              {categoryScenarios.map((scenario) => {
                const isCompleted = completedIds.includes(scenario.id);
                const isActive = activeId === scenario.id;
                
                return (
                  <button
                    key={scenario.id}
                    onClick={() => onSelect(scenario.id)}
                    className={`w-full text-left rounded-lg transition-all border group relative flex items-center ${
                      isCollapsed ? 'p-2 justify-center' : 'p-3'
                    } ${
                      isActive 
                        ? 'bg-slate-800 border-indigo-500/50 text-indigo-100 shadow-lg' 
                        : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                    }`}
                    title={isCollapsed ? scenario.title : undefined}
                  >
                    {isCollapsed ? (
                      <div className="relative">
                        <i className={`fas ${getCategoryIcon(category)} text-sm ${isActive ? 'text-indigo-400' : 'text-slate-600'}`}></i>
                        {isCompleted && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-slate-900" />
                        )}
                      </div>
                    ) : (
                      <div className="w-full">
                        <div className="flex items-center justify-between gap-2">
                          <div className={`text-sm font-medium mb-1 ${isActive ? '' : 'truncate'}`}>
                            {scenario.title}
                          </div>
                          {isCompleted && (
                            <i className="fas fa-check-circle text-emerald-500 text-xs animate-fade-in"></i>
                          )}
                        </div>
                        
                        {isActive && (
                          <p className="text-[11px] text-slate-400 mt-1.5 mb-2 leading-relaxed animate-fade-in">
                            {scenario.description}
                          </p>
                        )}

                        <div className={`text-[10px] inline-block px-2 py-0.5 rounded border ${getDiffColor(scenario.difficulty)}`}>
                          {scenario.difficulty}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
        
        {filteredScenarios.length === 0 && !isCollapsed && (
          <div className="text-center py-10 px-4">
            <i className="fas fa-search text-slate-700 text-2xl mb-3"></i>
            <p className="text-xs text-slate-500 italic">No {filterDifficulty} scenarios found.</p>
          </div>
        )}
      </nav>

      {!isCollapsed && (
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 text-slate-400 text-xs">
            <i className="fas fa-filter text-indigo-500"></i>
            <span>Filter Active</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
