export const LIVE_INPUT_SAMPLE_RATE = 16000;
export const LIVE_OUTPUT_SAMPLE_RATE = 24000;

export function createPCM16Blob(audioData: Int16Array): Blob {
  return new Blob([audioData.buffer], { type: "audio/pcm;rate=16000" });
}

export function decodeLiveAudioData(base64Data: string): Int16Array {
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Convert to Int16Array (PCM16 format)
  const int16Array = new Int16Array(bytes.buffer);
  return int16Array;
}

export function encodeAudioData(audioData: Int16Array): string {
  const uint8Array = new Uint8Array(audioData.buffer);
  let binaryString = "";
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binaryString);
}

export function resampleAudio(
  audioData: Float32Array,
  inputSampleRate: number,
  outputSampleRate: number
): Float32Array {
  if (inputSampleRate === outputSampleRate) {
    return audioData;
  }

  const ratio = outputSampleRate / inputSampleRate;
  const newLength = Math.round(audioData.length * ratio);
  const result = new Float32Array(newLength);

  for (let i = 0; i < newLength; i++) {
    const position = i / ratio;
    const index = Math.floor(position);
    const fraction = position - index;

    if (index >= audioData.length - 1) {
      result[i] = audioData[audioData.length - 1];
    } else {
      result[i] = audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
    }
  }

  return result;
}

export function floatToInt16(floatData: Float32Array): Int16Array {
  const int16Data = new Int16Array(floatData.length);
  for (let i = 0; i < floatData.length; i++) {
    const s = Math.max(-1, Math.min(1, floatData[i]));
    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Data;
}

export function int16ToFloat(int16Data: Int16Array): Float32Array {
  const floatData = new Float32Array(int16Data.length);
  for (let i = 0; i < int16Data.length; i++) {
    floatData[i] = int16Data[i] / 0x8000;
  }
  return floatData;
}

export async function getMicrophoneStream(): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: LIVE_INPUT_SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    return stream;
  } catch (error) {
    console.error("Error accessing microphone:", error);
    throw new Error("Could not access microphone. Please check permissions.");
  }
}

export function createAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  return new AudioContextClass({ sampleRate: LIVE_OUTPUT_SAMPLE_RATE });
}

export function playAudioBuffer(
  audioContext: AudioContext,
  audioData: Int16Array
): AudioBufferSourceNode {
  const floatData = int16ToFloat(audioData);
  const audioBuffer = audioContext.createBuffer(
    1,
    floatData.length,
    LIVE_OUTPUT_SAMPLE_RATE
  );
  audioBuffer.copyToChannel(floatData, 0);

  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  return source;
}
