'use client'

import React from 'react'
import { LeaderboardEntry } from '@/hooks/useLeaderboard'

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
  if (leaderboard.length === 0) {
    return (
      <div className="leaderboard">
        <h3>🏆 Leaderboard</h3>
        <div className="leaderboard-empty">
          <p>No scores yet!</p>
          <p>Be the first to set a record! 🎮</p>
        </div>
      </div>
    )
  }

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <h3>🏆 Leaderboard</h3>
        <button className="clear-button" onClick={onClear}>
          Clear
        </button>
      </div>
      
      <div className="leaderboard-list">
        {leaderboard.map((entry, index) => (
          <div key={entry.id} className={`leaderboard-entry ${index < 3 ? 'top-three' : ''}`}>
            <div className="rank">
              {index === 0 && '🥇'}
              {index === 1 && '🥈'}
              {index === 2 && '🥉'}
              {index > 2 && `#${index + 1}`}
            </div>
            <div className="player-info">
              <div className="player-name">{entry.playerName}</div>
              <div className="player-date">{entry.date}</div>
            </div>
            <div className="score">{entry.score}s</div>
          </div>
        ))}
      </div>
      
      {leaderboard.length >= 10 && (
        <div className="leaderboard-footer">
          <small>Only top 10 scores are shown</small>
        </div>
      )}
    </div>
  )
}
