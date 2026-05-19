'use client';

import React, { useState } from 'react';
import { Agent } from '../types';
import { DEFAULT_AGENT_CONFIG } from '../constants';
import Sidebar from '../components/Sidebar';
import AgentEditor from '../components/AgentEditor';
import LiveInterface from '../components/LiveInterface';

export default function Home() {
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      name: 'Default Agent',
      description: 'A default voice agent',
      voice: 'aura-asteria-en',
      systemPrompt: DEFAULT_AGENT_CONFIG.systemPrompt,
      tools: [],
    },
  ]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('1');
  const [showSimulator, setShowSimulator] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const handleUpdateAgent = (updatedAgent: Agent) => {
    setAgents(prev => 
      prev.map(a => a.id === updatedAgent.id ? updatedAgent : a)
    );
  };

  const handleCreateAgent = () => {
    const newAgent: Agent = {
      id: Date.now().toString(),
      name: 'New Agent',
      description: '',
      voice: DEFAULT_AGENT_CONFIG.voice,
      systemPrompt: DEFAULT_AGENT_CONFIG.systemPrompt,
      tools: [],
    };
    setAgents(prev => [...prev, newAgent]);
    setSelectedAgentId(newAgent.id);
  };

  const handleDeleteAgent = (id: string) => {
    if (agents.length <= 1) {
      alert('You must have at least one agent');
      return;
    }
    setAgents(prev => prev.filter(a => a.id !== id));
    if (selectedAgentId === id) {
      setSelectedAgentId(agents.find(a => a.id !== id)?.id || '');
    }
  };

  return (
    <main style={{ display: 'flex', height: '100vh' }}>
      <Sidebar
        agents={agents}
        selectedAgentId={selectedAgentId}
        onSelectAgent={setSelectedAgentId}
        onCreateAgent={handleCreateAgent}
        onDeleteAgent={handleDeleteAgent}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {showSimulator ? (
          <LiveInterface 
            agent={selectedAgent}
            viewMode="FULL"
          />
        ) : (
          <AgentEditor
            agent={selectedAgent}
            onUpdate={handleUpdateAgent}
            onSimulate={() => setShowSimulator(true)}
          />
        )}
        {showSimulator && (
          <button
            onClick={() => setShowSimulator(false)}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              padding: '12px 24px',
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Back to Editor
          </button>
        )}
      </div>
    </main>
  );
}
