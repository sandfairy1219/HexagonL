'use client'

import React from 'react'
import { AudioManager } from '@/hooks/useAudioManager'

interface AudioControlsProps {
  audioManager: AudioManager
}

export default function AudioControls({ audioManager }: AudioControlsProps) {
  const {
    playBGM,
    pauseBGM,
    isBGMPlaying,
    isMuted,
    toggleMute,
    setVolume,
    initializeAudio,
    isAudioInitialized,
  } = audioManager

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAudioInitialized) {
      await initializeAudio()
    }
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }

  const handleBGMToggle = async () => {
    if (!isAudioInitialized) {
      await initializeAudio()
    }
    if (isBGMPlaying) {
      pauseBGM()
    } else {
      playBGM()
    }
  }

  const handleMuteToggle = async () => {
    if (!isAudioInitialized) {
      await initializeAudio()
    }
    toggleMute()
  }

  return (
    <div className="audio-controls">
      <div className="audio-control-group">
        <button 
          className="audio-button"
          onClick={handleBGMToggle}
          title={isBGMPlaying ? "Pause BGM" : "Play BGM"}
        >
          {isBGMPlaying ? "⏸️" : "▶️"}
        </button>
        
        <button 
          className="audio-button"
          onClick={handleMuteToggle}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
        
        <div className="volume-control">
          <span className="volume-label">🎵</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            defaultValue="0.5"
            onChange={handleVolumeChange}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  )
}
