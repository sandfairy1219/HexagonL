'use client'

import { useEffect, useRef, useState } from 'react'
import { SoundGenerator } from '@/utils/soundGenerator'

export interface AudioManager {
  playBGM: () => void
  pauseBGM: () => void
  stopBGM: () => void
  restartBGM: () => void
  playSound: (soundName: string) => void
  setVolume: (volume: number) => void
  isBGMPlaying: boolean
  isMuted: boolean
  toggleMute: () => void
  initializeAudio: () => Promise<void>
  isAudioInitialized: boolean
}

export function useAudioManager(): AudioManager {
  const bgmRef = useRef<HTMLAudioElement | null>(null)
  const soundsRef = useRef<{ [key: string]: HTMLAudioElement }>({})
  const soundGeneratorRef = useRef<SoundGenerator | null>(null)
  const bgmIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [isBGMPlaying, setIsBGMPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolumeState] = useState(0.5)
  const [useWebAudio, setUseWebAudio] = useState(false)
  const [isAudioInitialized, setIsAudioInitialized] = useState(false)

  useEffect(() => {
    // SoundGenerator 초기화
    soundGeneratorRef.current = new SoundGenerator()

    // BGM 초기화 시도
    const initBGM = async () => {
      try {
        bgmRef.current = new Audio('/audio/bgm.mp3')
        bgmRef.current.loop = true
        bgmRef.current.volume = volume

        // BGM 로드 테스트
        await new Promise((resolve, reject) => {
          bgmRef.current!.addEventListener('canplaythrough', resolve, { once: true })
          bgmRef.current!.addEventListener('error', reject, { once: true })
          bgmRef.current!.load()
        })

        console.log('BGM loaded successfully')
      } catch (error) {
        console.log('BGM file not found, using web audio fallback')
        setUseWebAudio(true)
        bgmRef.current = null
      }
    }

    // 효과음 초기화 시도
    const initSounds = async () => {
      const soundFiles = ['move', 'collision', 'gameOver', 'start']
      const loadedSounds: { [key: string]: HTMLAudioElement } = {}

      for (const soundName of soundFiles) {
        try {
          const audio = new Audio(`/audio/${soundName === 'gameOver' ? 'game-over' : soundName}.mp3`)
          audio.volume = volume * 0.7
          
          await new Promise((resolve, reject) => {
            audio.addEventListener('canplaythrough', resolve, { once: true })
            audio.addEventListener('error', reject, { once: true })
            audio.load()
          })
          
          loadedSounds[soundName] = audio
        } catch (error) {
          console.log(`Sound file ${soundName} not found, using web audio fallback`)
        }
      }

      soundsRef.current = loadedSounds
    }

    initBGM()
    initSounds()

    return () => {
      // 오디오 정리
      if (bgmRef.current) {
        bgmRef.current.pause()
      }
      if (bgmIntervalRef.current) {
        clearInterval(bgmIntervalRef.current)
      }
      Object.values(soundsRef.current).forEach(sound => {
        sound.pause()
      })
    }
  }, [])

  const playBGM = async () => {
    if (isMuted) return

    // AudioContext 초기화 확인 및 재개
    if (soundGeneratorRef.current) {
      await soundGeneratorRef.current.resumeAudioContext()
    }

    if (bgmRef.current) {
      try {
        // 오디오 파일 사용 - 처음부터 재생
        bgmRef.current.currentTime = 0 // 처음부터 재생
        await bgmRef.current.play()
        setIsBGMPlaying(true)
      } catch (error) {
        console.error('Failed to play BGM:', error)
        // 파일 재생 실패 시 웹 오디오로 폴백
        if (soundGeneratorRef.current) {
          bgmIntervalRef.current = soundGeneratorRef.current.startSimpleBGM()
          setIsBGMPlaying(true)
        }
      }
    } else if (useWebAudio && soundGeneratorRef.current) {
      // 웹 오디오 API 사용
      bgmIntervalRef.current = soundGeneratorRef.current.startSimpleBGM()
      setIsBGMPlaying(true)
    }
  }

  const pauseBGM = () => {
    if (bgmRef.current) {
      bgmRef.current.pause()
    }
    if (bgmIntervalRef.current) {
      clearInterval(bgmIntervalRef.current)
      bgmIntervalRef.current = null
    }
    setIsBGMPlaying(false)
  }

  const stopBGM = () => {
    if (bgmRef.current) {
      bgmRef.current.pause()
      bgmRef.current.currentTime = 0
    }
    if (bgmIntervalRef.current) {
      clearInterval(bgmIntervalRef.current)
      bgmIntervalRef.current = null
    }
    setIsBGMPlaying(false)
  }

  const playSound = (soundName: string) => {
    if (isMuted) return

    // 오디오 파일이 있으면 사용
    if (soundsRef.current[soundName]) {
      const sound = soundsRef.current[soundName]
      sound.currentTime = 0
      sound.play().catch(console.error)
    } else if (soundGeneratorRef.current) {
      // 웹 오디오 API 폴백
      switch (soundName) {
        case 'move':
          soundGeneratorRef.current.playMoveSound()
          break
          break
        case 'gameOver':
          soundGeneratorRef.current.playGameOverSound()
          break
        case 'start':
          soundGeneratorRef.current.playStartSound()
          break
      }
    }
  }

  const setVolume = (newVolume: number) => {
    setVolumeState(newVolume)
    if (bgmRef.current) {
      bgmRef.current.volume = newVolume
    }
    Object.values(soundsRef.current).forEach(sound => {
      sound.volume = newVolume * 0.7
    })
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
    if (bgmRef.current) {
      if (!isMuted) {
        bgmRef.current.pause()
      } else if (isBGMPlaying) {
        bgmRef.current.play().catch(console.error)
      }
    }
  }

  const restartBGM = () => {
    // 완전히 정지하고 처음부터 재생
    stopBGM()
    setTimeout(() => playBGM(), 50) // 짧은 지연 후 재생
  }

  const initializeAudio = async () => {
    if (isAudioInitialized) return

    try {
      // 사용자 인터랙션 후 AudioContext 초기화
      if (soundGeneratorRef.current) {
        await soundGeneratorRef.current.resumeAudioContext()
      }

      // BGM 파일이 있다면 준비
      if (bgmRef.current) {
        // 짧은 무음 재생으로 브라우저 정책 우회
        const tempPlay = bgmRef.current.play()
        if (tempPlay) {
          bgmRef.current.pause()
          bgmRef.current.currentTime = 0
          await tempPlay.catch(() => {}) // 에러 무시
        }
      }

      setIsAudioInitialized(true)
      console.log('Audio initialized successfully')
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }
  }

  return {
    playBGM,
    pauseBGM,
    stopBGM,
    restartBGM,
    playSound,
    setVolume,
    isBGMPlaying,
    isMuted,
    toggleMute,
    initializeAudio,
    isAudioInitialized,
  }
}
