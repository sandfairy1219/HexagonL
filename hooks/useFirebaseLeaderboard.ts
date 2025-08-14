'use client'

import { useState, useEffect } from 'react'
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface LeaderboardEntry {
  id: string
  playerName: string
  score: number
  date: string
  timestamp: Timestamp
}

export function useFirebaseLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 실시간 리더보드 구독
  useEffect(() => {
    // Firebase 설정이 올바르지 않으면 에러로 처리
    if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === 'demo-project') {
      setError('Firebase not configured. Please set up your Firebase project.')
      setIsLoading(false)
      return
    }

    if (!db) {
      setError('Firebase not initialized. Please check your configuration.')
      setIsLoading(false)
      return
    }

    try {
      const leaderboardCollection = collection(db, 'leaderboard')
      const q = query(
        leaderboardCollection, 
        orderBy('score', 'desc'), 
        limit(10)
      )
      
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const entries: LeaderboardEntry[] = []
          snapshot.forEach((doc) => {
            const data = doc.data()
            entries.push({
              id: doc.id,
              playerName: data.playerName,
              score: data.score,
              date: data.timestamp?.toDate().toLocaleDateString() || 'Unknown',
              timestamp: data.timestamp
            })
          })
          setLeaderboard(entries)
          setIsLoading(false)
          setError(null)
        },
        (err) => {
          console.error('Firebase leaderboard error:', err)
          setError('Firebase connection failed. Using local storage.')
          setIsLoading(false)
        }
      )

      return () => unsubscribe()
    } catch (err) {
      console.error('Firebase setup error:', err)
      setError('Firebase setup failed. Using local storage.')
      setIsLoading(false)
    }
  }, [])

  // 점수 추가
  const addScore = async (playerName: string, score: number) => {
    if (!db) {
      console.error('Firebase not initialized')
      return
    }

    try {
      const leaderboardCollection = collection(db, 'leaderboard')
      await addDoc(leaderboardCollection, {
        playerName: playerName.trim(),
        score: Math.round(score * 10) / 10, // 소수점 1자리로 반올림
        timestamp: Timestamp.now()
      })
    } catch (err) {
      console.error('Error adding score:', err)
      setError('Failed to save score')
    }
  }

  // 리더보드 초기화 (개발용)
  const clearLeaderboard = async () => {
    if (!db) {
      console.error('Firebase not initialized')
      return
    }

    try {
      const leaderboardCollection = collection(db, 'leaderboard')
      const snapshot = await getDocs(leaderboardCollection)
      
      const deletePromises = snapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      )
      
      await Promise.all(deletePromises)
    } catch (err) {
      console.error('Error clearing leaderboard:', err)
      setError('Failed to clear leaderboard')
    }
  }

  // 하이스코어 체크
  const isHighScore = (score: number) => {
    if (leaderboard.length < 10) {
      return true // 10개 미만이면 항상 하이스코어
    }
    
    const lowestScore = leaderboard[leaderboard.length - 1]?.score || 0
    return score > lowestScore
  }

  return {
    leaderboard,
    addScore,
    clearLeaderboard,
    isHighScore,
    isLoading,
    error
  }
}
