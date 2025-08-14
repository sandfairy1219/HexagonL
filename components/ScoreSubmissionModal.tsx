'use client'

import React, { useState } from 'react'

interface ScoreSubmissionModalProps {
  isOpen: boolean
  score: number
  onSubmit: (playerName: string) => void
  onClose: () => void
}

export default function ScoreSubmissionModal({ 
  isOpen, 
  score, 
  onSubmit, 
  onClose 
}: ScoreSubmissionModalProps) {
  const [playerName, setPlayerName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    
    // 짧은 지연으로 제출 애니메이션 효과
    setTimeout(() => {
      onSubmit(playerName || 'Anonymous')
      setPlayerName('')
      setIsSubmitting(false)
    }, 300)
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setPlayerName('')
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎉 New High Score!</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="score-display">
            <div className="score-label">Your Time:</div>
            <div className="score-value">{score.toFixed(1)}s</div>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="playerName">Enter your name:</label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value.slice(0, 20))} // 20자 제한
                placeholder="Your name (optional)"
                maxLength={20}
                autoFocus
                disabled={isSubmitting}
              />
              <small>{playerName.length}/20 characters</small>
            </div>
            
            <div className="button-group">
              <button 
                type="button" 
                className="cancel-button" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Skip
              </button>
              <button 
                type="submit" 
                className="submit-button"
                disabled={isSubmitting}
              >
                {isSubmitting ? '⏳ Saving...' : '🏆 Add to Leaderboard'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
