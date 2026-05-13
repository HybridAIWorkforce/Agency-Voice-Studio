import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { LIVE_INPUT_SAMPLE_RATE, LIVE_OUTPUT_SAMPLE_RATE, createPCM16Blob, decodeLiveAudioData } from '../services/liveAudioUtils';
import { chatWithAgent } from '../services/geminiService';
import { LiveConnectionState, Agent } from '../types';
import LiveBarVisualizer from './LiveBarVisualizer';

interface TranscriptItem {
  id: string;
  source: 'user' | 'agent';
  text: string;
  isPartial: boolean;
}

interface LiveInterfaceProps {
    viewMode?: 'FULL' | 'EMBED' | 'WIDGET';
    agent?: Agent; // In Simulator mode, we pass the agent being built
}

const LiveInterface: React.FC<LiveInterfaceProps> = ({ viewMode = 'FULL', agent }) => {
  const [activeMode, setActiveMode] = useState<'VOICE' | 'TEXT'>('VOICE');

  // VOICE STATE
  const [connectionState, setConnectionState] = useState<LiveConnectionState>('DISCONNECTED');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // TEXT STATE
  const [chatInput, setChatInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  // SHARED STATE
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const [widgetOpen, setWidgetOpen] = useState(false);

  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const visualizerSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
    }
  }, [transcripts]);

  // Cleanup
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  // --- VOICE LOGIC ---
  const connect = async () => {
    if (!process.env.API_KEY) {
      setErrorMsg("API Key missing.");
      return;
    }

    try {
      setConnectionState('CONNECTING');
      setErrorMsg(null);
      setTranscripts([]);

      // 1. Setup Input Audio (Mic)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: {
          sampleRate: LIVE_INPUT_SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          autoGainControl: true,
          noiseSuppression: true
      }});
      mediaStreamRef.current = stream;

      // 2. Setup Audio Contexts
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      
      // Output Context (24kHz for playback)
      const outputCtx = new AudioContextClass({ sampleRate: LIVE_OUTPUT_SAMPLE_RATE });
      audioContextRef.current = outputCtx;
      
      // Input Context (16kHz for API input)
      const inputCtx = new AudioContextClass({ sampleRate: LIVE_INPUT_SAMPLE_RATE });
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(inputCtx.destination);
      
      sourceRef.current = source;
      processorRef.current = processor;

      // 3. Setup Visualizer Source (Use Output Context for compatibility with Visualizer component)
      visualizerSourceRef.current = outputCtx.createMediaStreamSource(stream);

      // 4. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let systemInstruction = "You are a helpful AI assistant.";
      if (agent) {
          systemInstruction = `${agent.systemPrompt}\n\nKNOWLEDGE BASE:\n${agent.knowledgeBase}`;
      }

      const config = {
          model: 'gemini-3.1-flash-live-preview',
          config: {
              responseModalities: [Modality.AUDIO],
              inputAudioTranscription: {},
              outputAudioTranscription: {},
              systemInstruction: systemInstruction,
              speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: agent?.voiceId || 'Kore' } },
              },
          },
      };

      // 5. Connect Session
      const sessionPromise = ai.live.connect({
        ...config,
        callbacks: {
            onopen: () => {
                setConnectionState('CONNECTED');
            },
            onmessage: async (message: LiveServerMessage) => {
                const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (base64Audio && audioContextRef.current) {
                    try {
                        const buffer = await decodeLiveAudioData(base64Audio, audioContextRef.current);
                        playAudioBuffer(buffer);
                    } catch (e) {
                        console.error("Audio decode error", e);
                    }
                }
                
                const serverContent = message.serverContent;
                if (serverContent) {
                    if (serverContent.outputTranscription) {
                        updateTranscript('agent', serverContent.outputTranscription.text, false);
                    }
                    if (serverContent.inputTranscription) {
                        updateTranscript('user', serverContent.inputTranscription.text, false);
                    }
                    if (serverContent.turnComplete) {
                        finalizeTranscripts();
                    }
                }

                if (message.serverContent?.interrupted) {
                    nextStartTimeRef.current = 0; 
                    finalizeTranscripts(); 
                }
            },
            onclose: () => {
                setConnectionState('DISCONNECTED');
            },
            onerror: (err) => {
                console.error(err);
                setErrorMsg("Connection error.");
                disconnect();
            }
        }
      });
      
      // Store session for cleanup
      sessionPromise.then(sess => {
          sessionRef.current = sess;
      });

      // 6. Start Streaming Input
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPCM16Blob(inputData);
        // Ensure session is ready before sending
        sessionPromise.then((session: any) => {
            session.sendRealtimeInput({ media: pcmBlob });
        });
      };

    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to access microphone or connect.");
      setConnectionState('DISCONNECTED');
    }
  };

  const updateTranscript = (source: 'user' | 'agent', text: string, isFinal: boolean) => {
      setTranscripts(prev => {
          const last = prev[prev.length - 1];
          if (last && last.source === source && last.isPartial) {
              return [
                  ...prev.slice(0, -1),
                  { ...last, text: last.text + text } 
              ];
          }
          return [
              ...prev,
              { id: crypto.randomUUID(), source, text, isPartial: !isFinal }
          ];
      });
  };

  const finalizeTranscripts = () => {
      setTranscripts(prev => prev.map(t => ({ ...t, isPartial: false })));
  };

  const disconnect = () => {
    // Close session
    if (sessionRef.current) {
        try {
            sessionRef.current.close();
        } catch (e) {
            console.error("Error closing session:", e);
        }
        sessionRef.current = null;
    }

    // Stop Media Stream
    if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
    }

    // Disconnect Audio Nodes
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
    }
    
    // Close Audio Context
    if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
    }

    setConnectionState('DISCONNECTED');
  };

  const playAudioBuffer = (buffer: AudioBuffer) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    
    const now = ctx.currentTime;
    // Schedule next chunk slightly in the future if we fell behind, or at the end of the queue
    if (nextStartTimeRef.current < now) {
        nextStartTimeRef.current = now;
    }
    
    source.start(nextStartTimeRef.current);
    nextStartTimeRef.current += buffer.duration;
  };

  // --- TEXT LOGIC ---
  const handleSendMessage = async () => {
      if (!chatInput.trim() || !agent || isThinking) return;
      
      const userText = chatInput;
      setChatInput('');
      setIsThinking(true);
      
      // Add user message immediately
      const newHistory = [...transcripts, { 
          id: crypto.randomUUID(), 
          source: 'user' as const, 
          text: userText, 
          isPartial: false 
      }];
      setTranscripts(newHistory);

      try {
          // Filter history for API
          const apiHistory = newHistory
            .filter(t => !t.isPartial)
            .map(t => ({ 
                role: (t.source === 'agent' ? 'model' : 'user') as 'model' | 'user', 
                text: t.text 
            }));

          const responseText = await chatWithAgent(apiHistory, userText, agent);
          
          setTranscripts(prev => [...prev, {
              id: crypto.randomUUID(),
              source: 'agent',
              text: responseText,
              isPartial: false
          }]);
      } catch (e) {
          console.error(e);
          setTranscripts(prev => [...prev, {
              id: crypto.randomUUID(),
              source: 'agent',
              text: "Error: Failed to get response.",
              isPartial: false
          }]);
      } finally {
          setIsThinking(false);
      }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSendMessage();
      }
  };


  // --- WIDGET RENDER ---
  if (viewMode === 'WIDGET' && !widgetOpen) {
      return (
          <div className="fixed bottom-4 right-4 z-50 animate-bounce-subtle">
              <button onClick={() => setWidgetOpen(true)} className="w-16 h-16 bg-indigo-600 rounded-full shadow flex items-center justify-center text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>
              </button>
          </div>
      );
  }

  // --- SIMULATOR RENDER ---
  return (
    <div className={`flex flex-col h-full bg-[#0b1120] relative overflow-hidden ${viewMode === 'WIDGET' ? 'fixed bottom-4 right-4 w-[360px] h-[600px] rounded-2xl shadow-2xl z-50' : 'w-full'}`}>
      
      {agent && (
         <div className="absolute top-4 left-0 right-0 z-20 flex flex-col items-center pointer-events-none">
             <div className="bg-slate-900/80 backdrop-blur px-4 py-1 rounded-full border border-slate-700 text-xs font-mono text-indigo-300 mb-2">
                 SIMULATING: {agent.name.toUpperCase()}
             </div>
             {/* Mode Toggle - Pointer events enabled for buttons */}
             <div className="bg-slate-800 p-1 rounded-lg flex pointer-events-auto shadow-lg border border-slate-700">
                 <button 
                    onClick={() => { setActiveMode('VOICE'); setTranscripts([]); }}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeMode === 'VOICE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                     Voice (Live API)
                 </button>
                 <button 
                    onClick={() => { setActiveMode('TEXT'); setTranscripts([]); disconnect(); }}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${activeMode === 'TEXT' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                     Debug (Reasoning)
                 </button>
             </div>
         </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] bg-[#0b1120] relative">
            
            {activeMode === 'VOICE' ? (
                <>
                    {/* Real-time Frequency Visualizer */}
                    <div className="w-full max-w-md h-32 flex items-center justify-center">
                    {connectionState === 'CONNECTED' ? (
                        <LiveBarVisualizer 
                            audioContext={audioContextRef.current} 
                            sourceNode={visualizerSourceRef.current}
                        />
                    ) : (
                        <div className="text-slate-700 font-mono text-sm">READY TO CONNECT</div>
                    )}
                    </div>

                    <div className="mt-8">
                        {connectionState === 'DISCONNECTED' ? (
                            <button onClick={connect} className="px-6 py-3 bg-white hover:bg-slate-200 text-slate-900 rounded-full font-bold text-sm shadow-lg transition-transform hover:scale-105 active:scale-95">
                                Start Test Call
                            </button>
                        ) : (
                            <button onClick={disconnect} className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 rounded-full font-bold text-sm transition-all">
                                End Test
                            </button>
                        )}
                    </div>
                    {errorMsg && <p className="text-red-400 text-xs mt-4 bg-red-500/10 px-3 py-1 rounded">{errorMsg}</p>}
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                    {transcripts.length === 0 && (
                        <div className="text-center p-8 opacity-50">
                             <p className="mb-2">Debug Mode Active</p>
                             <p className="text-xs">Testing logic with Gemini 3 Pro (Thinking Mode)</p>
                        </div>
                    )}
                </div>
            )}
      </div>

      {/* Transcript / Chat Area */}
      <div className={`mt-4 bg-slate-900/50 border-t border-slate-800 flex flex-col ${activeMode === 'TEXT' ? 'h-[60%]' : 'h-64'}`}>
          <div className="px-4 py-2 border-b border-slate-800 text-xs font-bold text-slate-500 flex justify-between items-center">
            <span>{activeMode === 'TEXT' ? 'DEBUG CONVERSATION' : 'LIVE TRANSCRIPT'}</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">Scrolls Automatically</span>
          </div>
          
          <div ref={transcriptContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
             {transcripts.length === 0 && activeMode === 'VOICE' && <div className="text-center text-slate-700 italic text-xs mt-4">Waiting for audio...</div>}
             {transcripts.map((t) => (
                 <div key={t.id} className={`flex ${t.source === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${t.source === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                         {t.text}
                     </div>
                 </div>
             ))}
             {isThinking && activeMode === 'TEXT' && (
                 <div className="flex justify-start">
                     <div className="bg-slate-800 px-3 py-2 rounded-xl text-xs text-slate-400 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></div>
                         <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></div>
                         <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></div>
                         <span>Thinking...</span>
                     </div>
                 </div>
             )}
          </div>

          {/* Text Input for Debug Mode */}
          {activeMode === 'TEXT' && (
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    disabled={isThinking}
                    placeholder="Type a message to test logic..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isThinking}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 rounded-lg font-bold text-xs transition-colors"
                  >
                      SEND
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};

export default LiveInterface;
