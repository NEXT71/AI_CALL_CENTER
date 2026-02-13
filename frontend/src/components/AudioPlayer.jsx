import { useState, useEffect, useRef } from 'react';
import { Download, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import api from '../services/api';

/**
 * AudioPlayer Component - Handles authenticated audio playback and download
 * Fixes the issue where audio doesn't play due to authentication requirements
 */
const AudioPlayer = ({ callId, callName = 'Audio Recording' }) => {
  const [audioUrl, setAudioUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const audioRef = useRef(null);

  // Fetch audio with authentication
  useEffect(() => {
    let currentUrl = null;
    
    const fetchAudio = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch audio with credentials (cookies)
        const response = await api.get(`/calls/${callId}/audio`, {
          responseType: 'blob',
          withCredentials: true,
        });
        
        // Create blob URL from the response
        const blob = new Blob([response.data], { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        currentUrl = url;
        setAudioUrl(url);
        setLoading(false);
      } catch (err) {
        console.error('Error loading audio:', err);
        setError('Failed to load audio. Please try again.');
        setLoading(false);
      }
    };

    if (callId) {
      fetchAudio();
    }

    // Cleanup blob URL on unmount
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [callId]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => setPlaying(false);
    const handlePlay = () => setPlaying(true);
    const handlePause = () => setPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioUrl]);

  // Playback controls
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = parseFloat(e.target.value);
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const audio = audioRef.current;
    const newVolume = parseFloat(e.target.value);
    if (audio) {
      audio.volume = newVolume;
    }
    setVolume(newVolume);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.muted = !muted;
      setMuted(!muted);
    }
  };

  const skipTime = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = Math.max(0, Math.min(duration, audio.currentTime + seconds));
  };

  // Download audio file
  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Fetch audio with authentication
      const response = await api.get(`/calls/${callId}/audio`, {
        responseType: 'blob',
        withCredentials: true,
      });
      
      // Create blob and download
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${callName.replace(/[^a-z0-9]/gi, '_')}_${callId}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setDownloading(false);
    } catch (err) {
      console.error('Error downloading audio:', err);
      alert('Failed to download audio. Please try again.');
      setDownloading(false);
    }
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="card-enhanced p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-600">Loading audio...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-enhanced p-6 border-l-4 border-l-red-500">
        <div className="flex items-center gap-3 text-red-600">
          <VolumeX size={24} />
          <div>
            <p className="font-semibold">Unable to load audio</p>
            <p className="text-sm text-slate-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-enhanced p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Volume2 size={20} />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Audio Recording</h2>
        </div>
        
        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="btn-enhanced btn-secondary-enhanced flex items-center gap-2"
          title="Download Audio"
        >
          <Download size={16} />
          {downloading ? 'Downloading...' : 'Download'}
        </button>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Custom Audio Player UI */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
            style={{
              background: `linear-gradient(to right, #2563eb ${(currentTime / duration) * 100}%, #cbd5e1 ${(currentTime / duration) * 100}%)`
            }}
          />
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Skip Back */}
            <button
              onClick={() => skipTime(-10)}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              title="Skip back 10 seconds"
            >
              <SkipBack size={20} className="text-slate-700" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
              title={playing ? 'Pause' : 'Play'}
            >
              {playing ? (
                <Pause size={24} className="text-white" />
              ) : (
                <Play size={24} className="text-white ml-0.5" />
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skipTime(10)}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              title="Skip forward 10 seconds"
            >
              <SkipForward size={20} className="text-slate-700" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted || volume === 0 ? (
                <VolumeX size={20} className="text-slate-700" />
              ) : (
                <Volume2 size={20} className="text-slate-700" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
