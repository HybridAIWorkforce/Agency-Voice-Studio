import React from 'react';
import { bufferToWav } from '../services/audioUtils';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  audioBuffer: AudioBuffer | null;
  currentTime: number;
  duration: number;
  playbackRate: number;
  onPlaybackRateChange: (rate: number) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

const Controls: React.FC<ControlsProps> = ({ 
    isPlaying, 
    onPlayPause, 
    audioBuffer, 
    currentTime, 
    duration,
    playbackRate,
    onPlaybackRateChange,
    zoom,
    onZoomChange
}) => {
  
  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${min}:${sec.toString().padStart(2, '0')}.${ms}`;
  };

  const handleDownload = () => {
    if (!audioBuffer) return;
    const blob = bufferToWav(audioBuffer);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agency_take_${Date.now()}.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-b-xl gap-4">
      
      {/* Playback Controls */}
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <button
          onClick={onPlayPause}
          disabled={!audioBuffer}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0 ${
            !audioBuffer 
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
          }`}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="text-slate-300 font-mono text-xs flex gap-2 items-center">
          <span className="w-12 text-right">{formatTime(currentTime)}</span>
          <span className="text-slate-600">/</span>
          <span className="w-12">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Tooling (Speed, Zoom, Export) */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
         
         {/* Playback Speed */}
         <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            {[0.75, 1, 1.25, 1.5].map((rate) => (
                <button
                    key={rate}
                    onClick={() => onPlaybackRateChange(rate)}
                    className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                        playbackRate === rate 
                            ? 'bg-slate-600 text-white' 
                            : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    {rate}x
                </button>
            ))}
         </div>

         {/* Zoom Controls */}
         <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
             <button 
                onClick={() => onZoomChange(Math.max(1, zoom - 0.5))}
                disabled={zoom <= 1}
                className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
             >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
                </svg>
             </button>
             <span className="text-[10px] text-slate-300 w-8 text-center">{Math.round(zoom * 100)}%</span>
             <button 
                onClick={() => onZoomChange(Math.min(5, zoom + 0.5))}
                disabled={zoom >= 5}
                className="px-2 py-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
             >
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
             </button>
         </div>

         <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>

         <button
          onClick={handleDownload}
          disabled={!audioBuffer}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-2 font-medium text-xs transition-colors ${
            !audioBuffer
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-800'
              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 shadow-sm'
          }`}
          title="Download WAV"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
          </svg>
          Export
        </button>
      </div>
    </div>
  );
};

export default Controls;
