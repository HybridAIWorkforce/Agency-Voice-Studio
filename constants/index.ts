export const VOICES = [
  { id: 'aura-asteria-en', name: 'Asteria (English)', language: 'en', gender: 'female' },
  { id: 'aura-luna-en', name: 'Luna (English)', language: 'en', gender: 'female' },
  { id: 'aura-stella-en', name: 'Stella (English)', language: 'en', gender: 'female' },
  { id: 'aura-athena-en', name: 'Athena (English)', language: 'en', gender: 'female' },
  { id: 'aura-hera-en', name: 'Hera (English)', language: 'en', gender: 'female' },
  { id: 'aura-orion-en', name: 'Orion (English)', language: 'en', gender: 'male' },
  { id: 'aura-arcas-en', name: 'Arcas (English)', language: 'en', gender: 'male' },
  { id: 'aura-perseus-en', name: 'Perseus (English)', language: 'en', gender: 'male' },
  { id: 'aura-helios-en', name: 'Helios (English)', language: 'en', gender: 'male' },
  { id: 'aura-zeus-en', name: 'Zeus (English)', language: 'en', gender: 'male' },
] as const;

export const DEFAULT_AGENT_CONFIG = {
  name: 'New Agent',
  description: 'An AI voice agent ready to help',
  voice: 'aura-asteria-en',
  systemPrompt: 'You are a helpful AI assistant. Be concise, professional, and friendly.',
};

export const LIVE_INPUT_SAMPLE_RATE = 16000;
export const LIVE_OUTPUT_SAMPLE_RATE = 24000;

export const APP_CONFIG = {
  name: 'Agency Voice Studio',
  version: '1.0.0',
  maxRecordingDuration: 300, // 5 minutes in seconds
  maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
};
