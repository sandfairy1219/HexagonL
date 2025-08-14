'use client'

import React from 'react'

export interface LeaderboardEntry {
  id: string
  playerName: string
  score: number
  date: string
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[]
  onClear: () => void
  isLoading?: boolean
  error?: string | null
}

export default function Leaderboard({ 
  leaderboard, 
  onClear, 
  isLoading = false, 
  error = null 
}: LeaderboardProps) {
  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h3>🏆 Global Leaderboard</h3>
        <button 
          className="clear-button" 
          onClick={onClear}
          disabled={isLoading}
        >
          Clear
        </button>
      </div>
      
      {isLoading && (
        <div className="leaderboard-loading">
          <div>Loading leaderboard...</div>
        </div>
      )}
      
      {error && (
        <div className="leaderboard-error">
          <div>⚠️ {error}</div>
          <small>Check Firebase configuration</small>
        </div>
      )}
      
      {!isLoading && !error && leaderboard.length === 0 && (
        <div className="leaderboard-empty">
          <div>🎮 No scores yet!</div>
          <div>Be the first to set a record!</div>
        </div>
      )}
      
      {!isLoading && leaderboard.length > 0 && (
        <div className="leaderboard-list">
          {leaderboard.map((entry, index) => (
            <div 
              key={entry.id} 
              className={`leaderboard-entry ${index < 3 ? 'top-three' : ''}`}
            >
              <div className="rank">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `${index + 1}.`}
              </div>
              <div className="player-info">
                <div className="player-name">{entry.playerName}</div>
                <div className="player-date">{entry.date}</div>
              </div>
              <div className="score">{entry.score.toFixed(1)}s</div>
            </div>
          ))}
        </div>
      )}
      
      {!isLoading && !error && (
        <div className="leaderboard-footer">
          <small>🌐 Global leaderboard updates in real-time</small>
        </div>
      )}
    </div>
  )
}
