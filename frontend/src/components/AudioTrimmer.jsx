import { useState, useEffect, useRef } from 'react';
import { Scissors, Download, Play, Pause, RotateCcw, Check, X } from 'lucide-react';
import api from '../services/api';

/**
 * AudioTrimmer Component - Allows users to trim audio segments
 * Features:
 * - Visual waveform display
 * - Drag handles to select trim points
 * - Real-time preview
 * - Download trimmed audio
 */
const AudioTrimmer = ({ callId, callName = 'Audio', onClose }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trimming, setTrimming] = useState(false);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch audio
  useEffect(() => {
    let currentUrl = null;
    
    const fetchAudio = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/calls/${callId}/audio`, {
          responseType: 'blob',
          withCredentials: true,
        });
        
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        currentUrl = url;
        setAudioUrl(url);
      } catch (err) {
        console.error('Error loading audio:', err);
        alert('Failed to load audio');
        onClose?.();
      } finally {
        setLoading(false);
      }
    };

    fetchAudio();

    return () => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [callId]);

  // Initialize audio and generate waveform
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleLoadedMetadata = () => {
      const dur = audio.duration;
      setDuration(dur);
      setEndTime(dur);
      generateWaveform(audioUrl, dur);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setPlaying(false);
      audio.currentTime = startTime;
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl, startTime]);

  // Generate waveform visualization
  const generateWaveform = async (url, dur) => {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const rawData = audioBuffer.getChannelData(0);
      const samples = 200; // Number of waveform bars
      const blockSize = Math.floor(rawData.length / samples);
      const waveform = [];
      
      for (let i = 0; i < samples; i++) {
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[i * blockSize + j]);
        }
        waveform.push(sum / blockSize);
      }
      
      // Normalize
      const max = Math.max(...waveform);
      const normalized = waveform.map(v => v / max);
      setWaveformData(normalized);
      
      audioContext.close();
    } catch (err) {
      console.error('Error generating waveform:', err);
      // Create dummy waveform
      setWaveformData(Array(200).fill(0.5));
    }
  };

  // Draw waveform on canvas
  useEffect(() => {
    if (!waveformData.length || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    const barWidth = width / waveformData.length;
    const centerY = height / 2;
    
    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * (height * 0.8);
      const timeAtBar = (index / waveformData.length) * duration;
      
      // Color based on selection
      if (timeAtBar >= startTime && timeAtBar <= endTime) {
        ctx.fillStyle = '#3b82f6'; // Blue for selected
      } else {
        ctx.fillStyle = '#cbd5e1'; // Gray for unselected
      }
      
      ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight);
    });
    
    // Draw current time indicator
    const currentX = (currentTime / duration) * width;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(currentX - 1, 0, 2, height);
  }, [waveformData, startTime, endTime, currentTime, duration]);

  // Playback controls
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      // Play from start time if outside selection
      if (currentTime < startTime || currentTime > endTime) {
        audio.currentTime = startTime;
      }
      audio.play();
      setPlaying(true);
    }
  };

  // Handle canvas click to set playback position
  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / rect.width) * duration;
    
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = clickTime;
      setCurrentTime(clickTime);
    }
  };

  // Update loop to stop at end time
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    const checkTime = () => {
      if (audio.currentTime >= endTime && playing) {
        audio.pause();
        audio.currentTime = startTime;
        setPlaying(false);
      }
    };
    
    const interval = setInterval(checkTime, 100);
    return () => clearInterval(interval);
  }, [endTime, playing, startTime]);

  // Reset selection
  const handleReset = () => {
    setStartTime(0);
    setEndTime(duration);
  };

  // Trim and download
  const handleTrimDownload = async () => {
    try {
      setTrimming(true);
      
      // Send trim request to backend
      const response = await api.post(`/calls/${callId}/trim`, {
        startTime,
        endTime,
      }, {
        responseType: 'blob',
        withCredentials: true,
      });
      
      // Download trimmed audio
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${callName}_trimmed_${Math.floor(startTime)}s-${Math.floor(endTime)}s.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      alert('Trimmed audio downloaded successfully!');
    } catch (err) {
      console.error('Error trimming audio:', err);
      alert('Failed to trim audio. Please try again.');
    } finally {
      setTrimming(false);
    }
  };

  // Format time
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-slate-600">Loading audio trimmer...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Scissors size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Audio Trimmer</h2>
              <p className="text-sm text-slate-600">Select and trim audio segments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Hidden audio element */}
        <audio ref={audioRef} src={audioUrl} />

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Waveform Display */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Waveform Visualization</label>
            <div 
              ref={containerRef}
              className="bg-slate-50 rounded-xl border-2 border-slate-200 p-4 cursor-pointer hover:border-blue-300 transition-colors"
              onClick={handleCanvasClick}
            >
              <canvas
                ref={canvasRef}
                width={800}
                height={150}
                className="w-full"
              />
            </div>
            <p className="text-xs text-slate-500">Click on the waveform to set playback position</p>
          </div>

          {/* Time Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Start Time</label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min="0"
                  max={duration - 0.1}
                  step="0.1"
                  value={startTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setStartTime(Math.min(val, endTime - 0.1));
                  }}
                  className="flex-1 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-mono text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg min-w-[70px] text-center">
                  {formatTime(startTime)}
                </span>
              </div>
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">End Time</label>
              <div className="flex gap-2 items-center">
                <input
                  type="range"
                  min={startTime + 0.1}
                  max={duration}
                  step="0.1"
                  value={endTime}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setEndTime(Math.max(val, startTime + 0.1));
                  }}
                  className="flex-1 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <span className="text-sm font-mono text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg min-w-[70px] text-center">
                  {formatTime(endTime)}
                </span>
              </div>
            </div>
          </div>

          {/* Selection Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-sm text-blue-900 font-semibold">Selected Duration: </span>
                <span className="text-lg font-mono text-blue-700">{formatTime(endTime - startTime)}</span>
              </div>
              <div>
                <span className="text-sm text-blue-900 font-semibold">Total Duration: </span>
                <span className="text-lg font-mono text-blue-700">{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={togglePlayPause}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors font-semibold"
            >
              {playing ? (
                <>
                  <Pause size={20} />
                  Pause Preview
                </>
              ) : (
                <>
                  <Play size={20} />
                  Preview Selection
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg flex items-center gap-2 transition-colors font-semibold"
              title="Reset Selection"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleTrimDownload}
            disabled={trimming || (endTime - startTime) < 0.1}
            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 font-semibold transition-colors"
          >
            {trimming ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Trimming...
              </>
            ) : (
              <>
                <Download size={18} />
                Trim & Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AudioTrimmer;
