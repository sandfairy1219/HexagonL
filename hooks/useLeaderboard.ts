'use client'

import { useState, useEffect } from 'react'

export interface LeaderboardEntry {
  id: string
  playerName: string
  score: number
  date: string
}

export function useLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  // 로컬스토리지에서 리더보드 불러오기
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hexagon-leaderboard')
      if (saved) {
        try {
          setLeaderboard(JSON.parse(saved))
        } catch (error) {
          console.error('Failed to load leaderboard:', error)
        }
      }
    }
  }, [])

  // 리더보드를 로컬스토리지에 저장
  const saveLeaderboard = (newLeaderboard: LeaderboardEntry[]) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hexagon-leaderboard', JSON.stringify(newLeaderboard))
      setLeaderboard(newLeaderboard)
    }
  }

  // 새로운 점수 추가
  const addScore = (playerName: string, score: number) => {
    const newEntry: LeaderboardEntry = {
      id: Date.now().toString(),
      playerName: playerName.trim() || 'Anonymous',
      score: parseFloat(score.toFixed(1)),
      date: new Date().toLocaleDateString()
    }

    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score) // 높은 점수 순으로 정렬
      .slice(0, 10) // 상위 10개만 유지

    saveLeaderboard(newLeaderboard)
    return newEntry
  }

  // 리더보드 초기화
  const clearLeaderboard = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hexagon-leaderboard')
      setLeaderboard([])
    }
  }

  // 현재 점수가 리더보드에 들어가는지 확인
  const isHighScore = (score: number) => {
    if (leaderboard.length < 10) return true
    return score > leaderboard[leaderboard.length - 1].score
  }

  return {
    leaderboard,
    addScore,
    clearLeaderboard,
    isHighScore
  }
}
