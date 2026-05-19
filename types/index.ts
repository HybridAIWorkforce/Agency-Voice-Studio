export interface Agent {
  id: string;
  name: string;
  description: string;
  voice: string;
  systemPrompt: string;
  tools: AgentTool[];
  ghlConfig?: GHLConfig;
  customVoice?: CustomVoice;
}

export interface AgentTool {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface GHLConfig {
  apiKey: string;
  locationId: string;
  pipelineId?: string;
}

export interface CustomVoice {
  id: string;
  name: string;
  sampleUrl?: string;
  cloned: boolean;
}

export type LiveConnectionState = 
  | 'DISCONNECTED' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'ERROR';

export interface TranscriptMessage {
  id: string;
  source: 'user' | 'agent';
  text: string;
  timestamp: number;
  isPartial?: boolean;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  format: 'pcm16' | 'wav' | 'mp3';
}
