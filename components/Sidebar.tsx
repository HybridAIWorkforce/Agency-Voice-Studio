import React from 'react';
import { Agent } from '../types';

interface SidebarProps {
  agents: Agent[];
  activeAgentId: string;
  onSelectAgent: (id: string) => void;
  onAddAgent: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    agents, 
    activeAgentId, 
    onSelectAgent,
    onAddAgent
}) => {
  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0 z-20">
      <div className="p-5 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                A
            </div>
            <div>
                <h2 className="text-sm font-bold text-white tracking-wide">AGENCY</h2>
                <p className="text-slate-500 text-[10px] uppercase tracking-wider">Voice Agent Builder</p>
            </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex justify-between items-center mb-3 px-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Agents</span>
            <button onClick={onAddAgent} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded transition-colors">
                + New
            </button>
        </div>
        
        <div className="space-y-1">
            {agents.map((agent) => (
                <button
                    key={agent.id}
                    onClick={() => onSelectAgent(agent.id)}
                    className={`w-full text-left p-3 rounded-md transition-all border group ${
                        activeAgentId === agent.id
                        ? 'bg-slate-800 border-indigo-500/50 shadow-sm'
                        : 'bg-transparent border-transparent hover:bg-slate-900'
                    }`}
                >
                    <div className="flex justify-between items-center mb-1">
                        <span className={`font-medium text-sm ${activeAgentId === agent.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {agent.name}
                        </span>
                        {activeAgentId === agent.id && (
                             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]"></div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-600 font-mono uppercase bg-slate-900 px-1 rounded border border-slate-800">
                            {agent.integrations.telephonyProvider || 'OFFLINE'}
                        </span>
                        <span className="text-[10px] text-slate-600 truncate max-w-[80px]">
                            {agent.voiceId}
                        </span>
                    </div>
                </button>
            ))}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
          <div className="bg-indigo-900/20 border border-indigo-500/20 rounded p-3">
              <div className="flex items-center gap-2 text-indigo-400 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase">Usage</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full w-[45%] bg-indigo-500"></div>
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-slate-500">
                  <span>450 mins</span>
                  <span>1000 limit</span>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Sidebar;
