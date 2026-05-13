import React, { useState, useRef, useEffect } from 'react';
import { Agent, AgentTool, GHLConfig, CustomVoice } from '../types';
import { VOICES } from '../constants';
import { generateSpeech } from '../services/geminiService';
import WaveformDisplay from './WaveformDisplay';
import Controls from './Controls';
import WorkflowGuide from './WorkflowGuide';

interface AgentEditorProps {
  agent: Agent;
  onUpdate: (updatedAgent: Agent) => void;
  onSimulate: () => void;
}

const QUICK_PHRASES = [
    "Hello! How can I help you today?",
    "I'm calling from the agency regarding your recent inquiry.",
    "Could you please verify your appointment time?",
    "That sounds great, I'll go ahead and update our records.",
    "I'm sorry, I didn't quite catch that. Could you repeat it?"
];

const AgentEditor: React.FC<AgentEditorProps> = ({ agent, onUpdate, onSimulate }) => {
  // Default to STUDIO tab to prioritize Voice Design
  const [activeTab, setActiveTab] = useState<'STUDIO' | 'BRAIN' | 'DEPLOY' | 'TELEPHONY'>('STUDIO');

  // Studio State
  const [studioText, setStudioText] = useState("Hello! I am your AI assistant. How can I help you today?");
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [zoom, setZoom] = useState(1);
  
  // Cloning State
  const [isCloning, setIsCloning] = useState(false);
  const [cloningProgress, setCloningProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<{name: string, size: number}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Playback Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const handleChange = (field: keyof Agent, value: any) => {
    onUpdate({ ...agent, [field]: value });
  };

  const handleIntegrationChange = (field: string, value: string) => {
    onUpdate({
        ...agent,
        integrations: { ...agent.integrations, [field]: value }
    });
  };

  // --- Voice Cloning Logic ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          // Explicitly type and map files
          const fileList = Array.from(e.target.files);
          const newFiles = fileList.map((f: File) => ({ 
              name: f.name, 
              size: f.size 
          }));
          
          setUploadedFiles(prev => [...prev, ...newFiles]);
          
          // Reset input so the same file can be selected again if needed
          e.target.value = ''; 
      }
  };

  const handleCloneVoice = () => {
      if (uploadedFiles.length === 0) return;
      setIsCloning(true);
      setCloningProgress(0);
      
      const interval = setInterval(() => {
        setCloningProgress((prev) => {
            const next = prev + Math.random() * 10; // Random increment
            if (next >= 100) {
                clearInterval(interval);
                return 100;
            }
            return next;
        });
      }, 200);

      // Finish logic trigger
      const finishTimeout = setTimeout(() => {
          clearInterval(interval);
          setCloningProgress(100);

          setTimeout(() => {
              const newVoiceId = `cloned-${Date.now()}`;
              const newCustomVoice: CustomVoice = {
                  id: newVoiceId,
                  name: `Cloned Voice (${uploadedFiles.length} samples)`,
                  samples: uploadedFiles
              };
              
              onUpdate({
                  ...agent,
                  customVoice: newCustomVoice,
                  voiceId: newVoiceId,
                  integrations: {
                      ...agent.integrations,
                      externalVoiceId: newVoiceId // Auto-fill generic ID, user can override for provider
                  }
              });
              
              setIsCloning(false);
              setCloningProgress(0);
              setUploadedFiles([]);
              alert("Voice cloned successfully! The agent is now using the custom voice profile.");
          }, 500); // Small delay to show 100%

      }, 3000); // Total simulated time

      return () => {
          clearInterval(interval);
          clearTimeout(finishTimeout);
      };
  };

  // --- Studio Logic ---
  const handleGenerate = async () => {
      try {
          setIsGenerating(true);
          stopPlayback();
          setAudioBuffer(null);
          
          // Check if current voice is a standard Gemini voice
          const isStandardVoice = VOICES.some(v => v.id === agent.voiceId);
          
          // If it's a custom/cloned voice, we use a distinct fallback voice ('Fenrir') 
          // to simulate a different voice profile for the demo, as real cloning isn't available in this client-side demo.
          const voiceToUse = isStandardVoice ? agent.voiceId : 'Fenrir'; 

          if (!isStandardVoice) {
              // Visual feedback handled by the fact that the voice sounds different (Fenrir is deep/male) 
              // vs the default female voice if something broke.
              console.log("Simulating cloned voice using fallback.");
          }

          const buffer = await generateSpeech(studioText, voiceToUse);
          setAudioBuffer(buffer);
      } catch (e) {
          console.error(e);
          alert("Failed to generate speech. Please check your API Key and try again.");
      } finally {
          setIsGenerating(false);
      }
  };

  const playPlayback = () => {
      if (!audioBuffer) return;
      
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = playbackRate;
      source.connect(ctx.destination);
      
      const offset = pauseTimeRef.current % audioBuffer.duration;
      startTimeRef.current = ctx.currentTime - (offset / playbackRate);
      
      source.start(0, offset);
      sourceNodeRef.current = source;
      setIsPlaying(true);

      source.onended = () => {
          setIsPlaying(false);
          pauseTimeRef.current = 0;
          cancelAnimationFrame(animationFrameRef.current);
      };

      const animate = () => {
          if (!sourceNodeRef.current) return;
          const elapsed = (ctx.currentTime - startTimeRef.current) * playbackRate;
          
          if (elapsed >= audioBuffer.duration) {
              setCurrentTime(audioBuffer.duration);
              setIsPlaying(false);
          } else {
              setCurrentTime(elapsed);
              animationFrameRef.current = requestAnimationFrame(animate);
          }
      };
      animate();
  };

  const pausePlayback = () => {
      if (sourceNodeRef.current) {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
          sourceNodeRef.current = null;
      }
      if (audioContextRef.current) {
          const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackRate;
          pauseTimeRef.current = elapsed;
      }
      setIsPlaying(false);
      cancelAnimationFrame(animationFrameRef.current);
  };

  const stopPlayback = () => {
      pausePlayback();
      pauseTimeRef.current = 0;
      setCurrentTime(0);
  };

  const handleSeek = (time: number) => {
      stopPlayback();
      pauseTimeRef.current = time;
      setCurrentTime(time);
      if (isPlaying) playPlayback();
  };
  
  useEffect(() => {
      return () => stopPlayback();
  }, []);


  return (
    <div className="flex flex-col h-full bg-[#0b1120] text-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
          <div>
              <div className="flex items-center gap-2">
                <input 
                    type="text" 
                    value={agent.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="bg-transparent text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 -ml-1"
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">ID: {agent.id}</span>
                  <span className="text-slate-600">•</span>
                  <select 
                    value={agent.voiceId}
                    onChange={(e) => handleChange('voiceId', e.target.value)}
                    className="bg-slate-800 border-none text-xs text-indigo-400 font-bold rounded py-0.5 px-2 cursor-pointer hover:bg-slate-700"
                  >
                      <optgroup label="Standard Voices">
                        {VOICES.map(v => <option key={v.id} value={v.id}>{v.name} ({v.gender})</option>)}
                      </optgroup>
                      {agent.customVoice && (
                          <optgroup label="Custom Voices">
                              <option value={agent.customVoice.id}>{agent.customVoice.name}</option>
                          </optgroup>
                      )}
                  </select>
              </div>
          </div>
          <button 
            onClick={onSimulate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md font-semibold text-sm shadow-lg shadow-indigo-900/20 transition-all hover:scale-105 border border-indigo-400/20"
          >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
              </svg>
              Live Conversation
          </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 px-8 bg-slate-900/30">
          <TabButton label="Voice Studio" active={activeTab === 'STUDIO'} onClick={() => setActiveTab('STUDIO')} />
          <TabButton label="Personality & Prompt" active={activeTab === 'BRAIN'} onClick={() => setActiveTab('BRAIN')} />
          <TabButton label="Telephony" active={activeTab === 'TELEPHONY'} onClick={() => setActiveTab('TELEPHONY')} />
          <TabButton label="Strategy & Deploy" active={activeTab === 'DEPLOY'} onClick={() => setActiveTab('DEPLOY')} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-5xl mx-auto space-y-8">

              {activeTab === 'STUDIO' && (
                  <div className="space-y-6">
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                          <h3 className="text-lg font-bold text-white mb-4">Voice Design Studio</h3>
                          <p className="text-sm text-slate-500 mb-6">
                             Select a voice from the dropdown above, then type or select a phrase to test how it sounds. This is the "Chatterbox" visualization.
                          </p>
                          
                          <div className="space-y-4">
                              {/* Quick Phrases */}
                              <div className="flex flex-wrap gap-2 mb-2">
                                  {QUICK_PHRASES.map((phrase, i) => (
                                      <button 
                                        key={i}
                                        onClick={() => setStudioText(phrase)}
                                        className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 transition-colors"
                                      >
                                          {phrase}
                                      </button>
                                  ))}
                              </div>

                              <textarea 
                                value={studioText}
                                onChange={(e) => setStudioText(e.target.value)}
                                className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-4 text-slate-200 text-sm focus:border-indigo-500 outline-none resize-none shadow-inner font-medium"
                                placeholder="Type what you want the voice to say..."
                              />
                              
                              <div className="flex justify-between items-center">
                                  <div className="text-xs text-slate-500">
                                      Current Voice: <span className="text-indigo-400 font-bold">{agent.voiceId}</span>
                                  </div>
                                  <button 
                                    onClick={handleGenerate}
                                    disabled={isGenerating || !studioText}
                                    className={`px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                                        isGenerating 
                                        ? 'bg-slate-800 text-slate-500 cursor-wait' 
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    }`}
                                  >
                                      {isGenerating ? 'Generating...' : 'Generate Voice'}
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* Chatterbox Visualization Area */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                          <div className="h-64 bg-[#0f172a] relative">
                                <WaveformDisplay 
                                    audioBuffer={audioBuffer}
                                    isPlaying={isPlaying}
                                    currentTime={currentTime}
                                    onSeek={handleSeek}
                                    zoom={zoom}
                                />
                          </div>
                          <Controls 
                                isPlaying={isPlaying}
                                onPlayPause={() => isPlaying ? pausePlayback() : playPlayback()}
                                audioBuffer={audioBuffer}
                                currentTime={currentTime}
                                duration={audioBuffer?.duration || 0}
                                playbackRate={playbackRate}
                                onPlaybackRateChange={setPlaybackRate}
                                zoom={zoom}
                                onZoomChange={setZoom}
                          />
                      </div>

                      {/* Voice Cloning Section */}
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mt-8">
                          <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-500">
                                <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                             </svg>
                             Voice Cloning
                          </h3>
                          <p className="text-sm text-slate-500 mb-6">
                              Upload clean audio samples (min 1 min) to create a custom voice clone.
                          </p>

                          <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center bg-slate-950/50 hover:bg-slate-950 hover:border-indigo-500/50 transition-all">
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="audio/*" 
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-indigo-600/20 text-indigo-400 px-4 py-2 rounded-full text-sm font-bold border border-indigo-500/30 hover:bg-indigo-600 hover:text-white transition-colors"
                                >
                                    + Upload Audio Samples
                                </button>
                                <p className="text-xs text-slate-600 mt-2">Supports MP3, WAV, M4A (Max 10MB per file)</p>
                          </div>

                          {uploadedFiles.length > 0 && (
                              <div className="mt-6">
                                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Pending Samples</h4>
                                  <div className="space-y-2 mb-4">
                                      {uploadedFiles.map((f, i) => (
                                          <div key={i} className="flex justify-between items-center bg-slate-800 p-2 rounded text-sm text-slate-300">
                                              <span>{f.name}</span>
                                              <span className="text-slate-500 text-xs">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                                          </div>
                                      ))}
                                  </div>
                                  <button 
                                    onClick={handleCloneVoice}
                                    disabled={isCloning}
                                    className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold transition-all shadow-lg shadow-green-900/20 disabled:opacity-100 disabled:cursor-wait relative overflow-hidden"
                                  >
                                      {isCloning ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            {/* Progress Bar Background */}
                                            <div className="absolute inset-0 bg-green-800"></div>
                                            {/* Progress Bar Fill */}
                                            <div 
                                                className="absolute inset-0 bg-green-600 transition-all duration-300 ease-out"
                                                style={{ width: `${cloningProgress}%` }}
                                            ></div>
                                            {/* Text and Spinner Overlay */}
                                            <span className="relative z-10 flex items-center gap-2 text-white">
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Processing... {Math.round(cloningProgress)}%
                                            </span>
                                        </div>
                                      ) : (
                                        'Create Voice Clone'
                                      )}
                                  </button>
                              </div>
                          )}
                          
                          {agent.customVoice && !uploadedFiles.length && (
                              <div className="mt-6 p-4 bg-indigo-900/20 border border-indigo-500/30 rounded-lg flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                                      {agent.customVoice.name.charAt(0)}
                                  </div>
                                  <div>
                                      <h4 className="text-white font-bold text-sm">{agent.customVoice.name}</h4>
                                      <p className="text-xs text-indigo-300">Active Custom Voice • {agent.customVoice.samples.length} Samples</p>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>
              )}
              
              {activeTab === 'BRAIN' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <Section title="System Persona">
                            <p className="text-xs text-slate-500 mb-2">Who is this agent? What is their job?</p>
                            <textarea 
                                value={agent.systemPrompt}
                                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                                className="w-full h-80 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 font-mono text-sm leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
                                placeholder="You are a helpful assistant..."
                            />
                        </Section>
                        <Section title="Knowledge Base">
                            <textarea 
                                value={agent.knowledgeBase}
                                onChange={(e) => handleChange('knowledgeBase', e.target.value)}
                                className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="Paste business info here..."
                            />
                        </Section>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
                            <h3 className="text-sm font-bold text-white mb-4">Tools</h3>
                            <div className="space-y-3">
                                {agent.tools.map((tool, idx) => (
                                    <div key={tool.id} className="text-xs bg-slate-950 p-3 rounded border border-slate-800 flex justify-between items-center group">
                                        <span className="font-bold text-indigo-400">{tool.name}</span>
                                        <button 
                                            onClick={() => {
                                                const newTools = [...agent.tools];
                                                newTools.splice(idx, 1);
                                                handleChange('tools', newTools);
                                            }}
                                            className="text-slate-600 hover:text-red-400"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => {
                                        const newTool: AgentTool = {
                                            id: crypto.randomUUID(),
                                            name: 'function',
                                            description: '',
                                            parameters: []
                                        };
                                        handleChange('tools', [...agent.tools, newTool]);
                                    }}
                                    className="w-full py-2 border border-dashed border-slate-700 rounded text-xs text-slate-500 hover:text-white"
                                >
                                    + Add Tool
                                </button>
                            </div>
                        </div>
                    </div>
                  </div>
              )}

              {activeTab === 'TELEPHONY' && (
                  <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-2xl">
                        <h3 className="text-lg font-bold text-white mb-6">Connection Settings</h3>
                        <div className="space-y-6">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Telephony Provider</label>
                                  <select 
                                    value={agent.integrations.telephonyProvider || ''}
                                    onChange={(e) => handleIntegrationChange('telephonyProvider', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:border-indigo-500 outline-none"
                                  >
                                      <option value="">Select Provider...</option>
                                      <option value="TWILIO">Twilio</option>
                                      <option value="VAPI">Vapi.ai</option>
                                      <option value="RETELL">Retell AI</option>
                                  </select>
                              </div>

                              {agent.integrations.telephonyProvider && (
                                  <>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">API Key / Token</label>
                                        <input 
                                            type="password" 
                                            value={agent.integrations.providerApiKey || ''}
                                            onChange={(e) => handleIntegrationChange('providerApiKey', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:border-indigo-500 outline-none font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                                        <input 
                                            type="text" 
                                            value={agent.integrations.phoneNumber || ''}
                                            onChange={(e) => handleIntegrationChange('phoneNumber', e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:border-indigo-500 outline-none font-mono"
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-slate-800">
                                        <label className="block text-xs font-bold text-indigo-400 mb-1">
                                            External Voice ID (Optional Override)
                                        </label>
                                        <p className="text-[10px] text-slate-500 mb-2">
                                            If your telephony provider requires a specific Voice ID string (e.g. from Retell/ElevenLabs), enter it here. 
                                            Defaults to: <span className="font-mono text-slate-400">{agent.voiceId}</span>
                                        </p>
                                        <input 
                                            type="text" 
                                            value={agent.integrations.externalVoiceId || ''}
                                            onChange={(e) => handleIntegrationChange('externalVoiceId', e.target.value)}
                                            placeholder={agent.voiceId}
                                            className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-sm text-slate-300 focus:border-indigo-500 outline-none font-mono"
                                        />
                                    </div>
                                  </>
                              )}
                        </div>
                  </div>
              )}

              {activeTab === 'DEPLOY' && (
                  <WorkflowGuide />
              )}
          </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
            active 
            ? 'border-indigo-500 text-white' 
            : 'border-transparent text-slate-500 hover:text-slate-300'
        }`}
    >
        {label}
    </button>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="space-y-4">
        <h3 className="text-lg font-bold text-white border-l-4 border-indigo-500 pl-3">{title}</h3>
        <div>{children}</div>
    </div>
);

export default AgentEditor;