'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAudioManager } from '@/hooks/useAudioManager'
import { useFirebaseLeaderboard } from '@/hooks/useFirebaseLeaderboard'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import AudioControls from '@/components/AudioControls'
import FirebaseLeaderboard from '@/components/FirebaseLeaderboard'
import ScoreSubmissionModal from '@/components/ScoreSubmissionModal'

interface Player {
  segment: number
  radius: number
  size: number
  lives: number
  invulnerable: number
}

interface Wall {
  segment: number
  radius: number
  color: string
}

type GameState = 'waiting' | 'playing' | 'gameOver'

class SuperHexagonGameEngine {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  centerX: number
  centerY: number
  gameState: GameState
  startTime: number
  currentTime: number
  difficultyIncreased: boolean
  player: Player
  walls: Wall[]
  wallSpeed: number
  wallThickness: number
  colors: string[]
  currentColorIndex: number
  difficultyMessageTime: number
  
  // 파동 효과 속성
  pulseIntensity: number
  pulseSpeed: number
  pulseOffset: number
  screenShake: number
  shakeDecay: number
  
  // 리듬 동기화 속성
  lastWallGeneration: number
  beatInterval: number
  nextBeat: number
  beatPulse: number
  
  onTimeUpdate?: (time: number) => void
  onGameStateChange?: (state: GameState) => void
  onPlayerMove?: () => void
  onPlayerHit?: () => void
  onGameStart?: () => void
  onGameOver?: () => void

  constructor(canvas: HTMLCanvasElement, callbacks?: { 
    onTimeUpdate?: (time: number) => void
    onGameStateChange?: (state: GameState) => void
    onPlayerMove?: () => void
    onPlayerHit?: () => void
    onGameStart?: () => void
    onGameOver?: () => void
  }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = canvas.width
    this.height = canvas.height
    this.centerX = this.width / 2
    this.centerY = this.height / 2
    
    this.onTimeUpdate = callbacks?.onTimeUpdate
    this.onGameStateChange = callbacks?.onGameStateChange
    this.onPlayerMove = callbacks?.onPlayerMove
    this.onPlayerHit = callbacks?.onPlayerHit
    this.onGameStart = callbacks?.onGameStart
    this.onGameOver = callbacks?.onGameOver
    
    this.gameState = 'waiting'
    this.startTime = 0
    this.currentTime = 0
    this.difficultyIncreased = false
    
    this.player = {
      segment: 0,
      radius: 45,
      size: 8,
      lives: 2,
      invulnerable: 0
    }
    
    this.walls = []
    this.wallSpeed = 1.5
    this.wallThickness = 15
    
    this.colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff']
    this.currentColorIndex = 0
    this.difficultyMessageTime = 0
    
    // 파동 효과 초기화
    this.pulseIntensity = 1.0
    this.pulseSpeed = 0.05
    this.pulseOffset = 0
    this.screenShake = 0
    this.shakeDecay = 0.9
    
    // 리듬 동기화 초기화 - 동적 간격 시스템
    this.lastWallGeneration = 0
    this.beatInterval = 120 // 초기값 (동적으로 조정됨)
    this.nextBeat = 120 // 처음에도 120프레임 후 생성
    this.beatPulse = 0
  }

  movePlayer(direction: number) {
    if (this.gameState !== 'playing') return
    this.player.segment = (this.player.segment + direction + 6) % 6
    this.onPlayerMove?.() // 사운드 재생
  }

  startGame() {
    this.gameState = 'playing'
    this.startTime = Date.now()
    this.currentTime = 0
    this.walls = []
    this.player.segment = 0
    this.player.lives = 2
    this.player.invulnerable = 0
    this.wallSpeed = 0.6  // 벽 속도를 적당히 조정
    this.currentColorIndex = 0
    this.difficultyIncreased = false
    this.difficultyMessageTime = 0
    
    // 파동 효과 리셋
    this.pulseIntensity = 1.0
    this.pulseOffset = 0
    this.screenShake = 0
    
    // 리듬 동기화 리셋
    this.lastWallGeneration = 0
    this.nextBeat = 120 // 게임 시작 후 2초 후에 첫 벽 생성
    this.beatPulse = 0
    
    this.onGameStateChange?.(this.gameState)
    this.onGameStart?.() // 게임 시작 사운드
    this.generateWalls()
  }

  generateWalls() {
    const numSegments = 6
    
    let numGaps: number
    // 벽 간격을 매우 촘촘하게 - 항상 1개만 열어둠
    numGaps = 1 + Math.floor(Math.random() * 2) // 1 또는 2개의 간격 생성
    
    const gapPositions: number[] = []
    
    let firstGap = Math.floor(Math.random() * numSegments)
    gapPositions.push(firstGap)
    
    for (let i = 1; i < numGaps; i++) {
      let position: number
      let attempts = 0
      do {
        position = Math.floor(Math.random() * numSegments)
        attempts++
        if (attempts > 50) break
      } while (gapPositions.includes(position) || 
               gapPositions.some(gap => 
                 (position + 1) % numSegments === gap || 
                 (position - 1 + numSegments) % numSegments === gap
               ))
      
      if (!gapPositions.includes(position)) {
        gapPositions.push(position)
      }
    }
    
    // 벽을 화면에 보이는 적당한 거리에서 생성
    const wallDistance = 400 // 고정된 거리에서 생성
    
    for (let i = 0; i < numSegments; i++) {
      if (!gapPositions.includes(i)) {
        this.walls.push({
          segment: i,
          radius: wallDistance,
          color: this.colors[this.currentColorIndex]
        })
      }
    }
    
    this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length
  }

  update() {
    if (this.gameState !== 'playing') return
    
    this.currentTime = (Date.now() - this.startTime) / 1000
    this.onTimeUpdate?.(this.currentTime)
    
    // 파동 효과 업데이트 - 리듬 기반으로 변경
    this.nextBeat--
    let beatTriggered = false
    
    // 비트 체크 및 파동 트리거 + 벽 생성
    if (this.nextBeat <= 0) {
      // 속도에 따라 벽 생성 간격을 동적으로 조정 - 벽 사이 간격 일정 유지
      const speedRatio = this.wallSpeed / 0.6 // 초기 속도(0.6) 대비 현재 속도 비율
      const dynamicInterval = Math.max(40, 110 / speedRatio) // 속도가 빠를수록 짧은 간격
      
      this.beatInterval = dynamicInterval
      this.nextBeat = this.beatInterval
      
      // 벽 생성
      console.log('Wall generated at time:', this.currentTime, 'speed:', this.wallSpeed.toFixed(3), 'interval:', this.beatInterval.toFixed(1))
      this.generateWalls()
      
      // 강한 파동 트리거 (2초마다 벽 생성과 동기화)
      this.beatPulse = 1.8 // 더 강하고 뚜렷한 파동
      beatTriggered = true
    }
    
    // 비트 파동 감쇠
    if (this.beatPulse > 0) {
      this.beatPulse *= 0.85
      if (this.beatPulse < 0.01) {
        this.beatPulse = 0
      }
    }
    
    // 기본 파동 + 비트 파동 조합
    const baseIntensity = 0.98 + 0.015 * Math.sin(this.pulseOffset)
    const beatIntensity = 1.0 + this.beatPulse * 0.08 // 비트에 맞춘 강한 파동
    this.pulseIntensity = baseIntensity * beatIntensity
    
    // 기본 파동 속도
    this.pulseOffset += 0.06
    
    // 화면 진동 감쇠
    if (this.screenShake > 0) {
      this.screenShake *= this.shakeDecay
      if (this.screenShake < 0.1) {
        this.screenShake = 0
      }
    }
    
    // 10초 난이도 증가 메시지 제거됨
    
    for (let i = this.walls.length - 1; i >= 0; i--) {
      this.walls[i].radius -= this.wallSpeed
      
      if (this.walls[i].radius < 30) {
        this.walls.splice(i, 1)
      }
    }
    
    // 벽이 없으면 즉시 생성 (게임 시작시)
    if (this.walls.length === 0) {
      console.log('Initial wall generated at time:', this.currentTime)
      this.generateWalls()
    }
    
    this.checkCollision()
    
    this.wallSpeed += 0.0008  // 가속도를 매우 낮게 하여 속도 변화를 최소화
    
    // difficultyMessageTime 관련 코드 제거됨
    
    if (this.player.invulnerable > 0) {
      this.player.invulnerable--
    }
  }

  checkCollision() {
    if (this.player.invulnerable > 0) return
    
    for (let wall of this.walls) {
      if (Math.abs(wall.radius - this.player.radius) < this.wallThickness / 2 + this.player.size) {
        if (wall.segment === this.player.segment) {
          this.takeDamage()
          return
        }
      }
    }
  }

  takeDamage() {
    this.player.lives--
    this.player.invulnerable = 120
    this.screenShake = 15 // 화면 진동 효과 추가
    this.onPlayerHit?.() // 충돌 사운드
    
    if (this.player.lives <= 0) {
      this.gameOver()
    }
  }

  gameOver() {
    this.gameState = 'gameOver'
    this.onGameStateChange?.(this.gameState)
    this.onGameOver?.() // 게임 오버 사운드
  }

  // showDifficultyMessage 메서드 제거됨

  draw() {
    // 화면 진동 효과
    const shakeX = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake : 0
    const shakeY = this.screenShake > 0 ? (Math.random() - 0.5) * this.screenShake : 0
    
    this.ctx.save()
    this.ctx.translate(shakeX, shakeY)
    
    // 파동 효과로 전체 화면 크기 조절
    const pulseScale = this.gameState === 'playing' ? this.pulseIntensity : 1.0
    this.ctx.scale(pulseScale, pulseScale)
    
    // 중심점 조정 (스케일 때문에 변경됨)
    const adjustedCenterX = this.centerX / pulseScale
    const adjustedCenterY = this.centerY / pulseScale
    
    this.ctx.fillStyle = '#000'
    this.ctx.fillRect(-this.width, -this.height, this.width * 3, this.height * 3)
    
    this.drawHexagon(adjustedCenterX, adjustedCenterY, 30, '#fff')
    
    for (let wall of this.walls) {
      this.drawWallSegment(wall, adjustedCenterX, adjustedCenterY)
    }
    
    if (this.gameState === 'playing') {
      const segmentAngle = Math.PI / 3
      const playerAngle = this.player.segment * segmentAngle + segmentAngle / 2
      const playerX = adjustedCenterX + Math.cos(playerAngle) * this.player.radius
      const playerY = adjustedCenterY + Math.sin(playerAngle) * this.player.radius
      
      let playerColor = this.player.lives === 2 ? '#4CAF50' : '#F44336'
      
      if (this.player.invulnerable > 0 && Math.floor(this.player.invulnerable / 10) % 2 === 0) {
        playerColor += '80'
      }
      
      this.ctx.fillStyle = playerColor
      this.ctx.beginPath()
      this.ctx.arc(playerX, playerY, this.player.size, 0, Math.PI * 2)
      this.ctx.fill()
    }
    
    this.ctx.restore()
    
    if (this.gameState === 'waiting') {
      this.ctx.fillStyle = '#fff'
      this.ctx.font = '32px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('Press SPACE to Start', this.centerX, this.centerY)
    }
    
    // Difficulty message 관련 코드 제거됨
  }

  drawHexagon(x: number, y: number, radius: number, color: string) {
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    
    for (let i = 0; i < 6; i++) {
      const angle = i * Math.PI / 3
      const hexX = x + Math.cos(angle) * radius
      const hexY = y + Math.sin(angle) * radius
      
      if (i === 0) {
        this.ctx.moveTo(hexX, hexY)
      } else {
        this.ctx.lineTo(hexX, hexY)
      }
    }
    
    this.ctx.closePath()
    this.ctx.stroke()
  }

  drawWallSegment(wall: Wall, centerX?: number, centerY?: number) {
    const cx = centerX || this.centerX
    const cy = centerY || this.centerY
    
    const segmentAngle = Math.PI / 3
    const startAngle = wall.segment * segmentAngle
    const endAngle = startAngle + segmentAngle
    
    const innerRadius = wall.radius - this.wallThickness / 2
    const outerRadius = wall.radius + this.wallThickness / 2
    
    const startX1 = cx + Math.cos(startAngle) * innerRadius
    const startY1 = cy + Math.sin(startAngle) * innerRadius
    const startX2 = cx + Math.cos(startAngle) * outerRadius
    const startY2 = cy + Math.sin(startAngle) * outerRadius
    
    const endX1 = cx + Math.cos(endAngle) * innerRadius
    const endY1 = cy + Math.sin(endAngle) * innerRadius
    const endX2 = cx + Math.cos(endAngle) * outerRadius
    const endY2 = cy + Math.sin(endAngle) * outerRadius
    
    this.ctx.fillStyle = wall.color
    this.ctx.beginPath()
    this.ctx.moveTo(startX1, startY1)
    this.ctx.lineTo(startX2, startY2)
    this.ctx.lineTo(endX2, endY2)
    this.ctx.lineTo(endX1, endY1)
    this.ctx.closePath()
    this.ctx.fill()
  }

  gameLoop() {
    this.update()
    this.draw()
    requestAnimationFrame(() => this.gameLoop())
  }
}

export default function SuperHexagonGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<SuperHexagonGameEngine | null>(null)
  const [gameState, setGameState] = useState<GameState>('waiting')
  const [currentTime, setCurrentTime] = useState(0)
  const [startButtonText, setStartButtonText] = useState('Start')
  
  // 오디오 매니저 추가
  const audioManager = useAudioManager()
  
  // Firebase 리더보드 훅 (우선순위)
  const firebaseLeaderboard = useFirebaseLeaderboard()
  
  // 로컬 리더보드 훅 (백업용)
  const localLeaderboard = useLeaderboard()
  
  // Firebase 사용 가능 시 Firebase, 아니면 로컬 스토리지 사용
  const leaderboard = firebaseLeaderboard.error ? localLeaderboard : firebaseLeaderboard
  
  // 점수 제출 모달 상태
  const [showScoreModal, setShowScoreModal] = useState(false)

  useEffect(() => {
    if (canvasRef.current) {
      gameRef.current = new SuperHexagonGameEngine(canvasRef.current, {
        onTimeUpdate: (time) => setCurrentTime(time),
        onGameStateChange: (state) => {
          setGameState(state)
          if (state === 'waiting') {
            setStartButtonText('Start')
            audioManager.stopBGM() // 완전히 정지하고 처음으로 되돌림
          } else if (state === 'gameOver') {
            setStartButtonText('Restart')
            audioManager.pauseBGM() // 일시정지만
            // 하이스코어 체크
            if (leaderboard.isHighScore(currentTime)) {
              setShowScoreModal(true)
            }
          } else if (state === 'playing') {
            setStartButtonText('Playing')
            audioManager.restartBGM() // 완전히 재시작
          }
        },
        onPlayerMove: () => audioManager.playSound('move'),
        onPlayerHit: () => audioManager.playSound('collision'),
        onGameStart: () => audioManager.playSound('start'),
        onGameOver: () => audioManager.playSound('gameOver'),
      })
      
      gameRef.current.gameLoop()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (!gameRef.current) return
      
      // 사용자 인터랙션 시 오디오 초기화
      if (!audioManager.isAudioInitialized) {
        await audioManager.initializeAudio()
      }
      
      switch(e.code) {
        case 'ArrowLeft':
          gameRef.current.movePlayer(-1)
          e.preventDefault()
          break
        case 'ArrowRight':
          gameRef.current.movePlayer(1)
          e.preventDefault()
          break
        case 'Space':
          if (gameState === 'waiting' || gameState === 'gameOver') {
            gameRef.current.startGame()
          }
          e.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, audioManager])

  const handleMoveLeft = async () => {
    if (!audioManager.isAudioInitialized) {
      await audioManager.initializeAudio()
    }
    if (gameRef.current && gameState === 'playing') {
      gameRef.current.movePlayer(-1)
    }
  }

  const handleMoveRight = async () => {
    if (!audioManager.isAudioInitialized) {
      await audioManager.initializeAudio()
    }
    if (gameRef.current && gameState === 'playing') {
      gameRef.current.movePlayer(1)
    }
  }

  const handleStart = async () => {
    if (gameRef.current && (gameState === 'waiting' || gameState === 'gameOver')) {
      // 사용자 인터랙션 시 오디오 초기화
      if (!audioManager.isAudioInitialized) {
        await audioManager.initializeAudio()
      }
      gameRef.current.startGame()
    }
  }

  const handleScoreSubmit = (playerName: string) => {
    leaderboard.addScore(playerName, currentTime)
    setShowScoreModal(false)
  }

  const handleScoreModalClose = () => {
    setShowScoreModal(false)
  }

  const timeColor = currentTime < 10 ? '#4CAF50' : '#ff4444'

  // 게임 상태에 따른 CSS 클래스
  const containerClass = `game-container ${gameState === 'playing' ? 'game-playing' : ''}`

  return (
    <div className={containerClass}>
      <AudioControls audioManager={audioManager} />
      <div className="score">
        Time: <span style={{ color: timeColor }}>{currentTime.toFixed(1)}</span>s
      </div>
      <canvas
        ref={canvasRef}
        id="gameCanvas"
        width="800"
        height="600"
      />
      <div className="controls">
        <p>Use ← → arrow keys or buttons below to jump between segments, SPACE or Start button to start/restart</p>
        <p>Control the triangle and avoid the incoming walls!</p>
        {!audioManager.isAudioInitialized && (
          <p style={{ color: '#ffaa00', fontSize: '16px', marginTop: '10px' }}>
            🎵 Click any button or press any key to enable audio
          </p>
        )}
      </div>
      <div className="mobile-controls">
        <button className="control-button start-button" onClick={handleStart}>
          {startButtonText}
        </button>
        <button className="control-button direction-button" onClick={handleMoveLeft}>
          ←
        </button>
        <button className="control-button direction-button" onClick={handleMoveRight}>
          →
        </button>
      </div>
      {gameState === 'gameOver' && (
        <div className="game-over" style={{ display: 'block' }}>
          <div>Game Over!</div>
          <div style={{ fontSize: '20px', marginTop: '10px' }}>Press SPACE to restart</div>
        </div>
      )}
      
      <FirebaseLeaderboard 
        leaderboard={leaderboard.leaderboard} 
        isLoading={firebaseLeaderboard.isLoading}
        error={firebaseLeaderboard.error}
      />
      
      {showScoreModal && (
        <ScoreSubmissionModal
          isOpen={showScoreModal}
          score={currentTime}
          onSubmit={handleScoreSubmit}
          onClose={handleScoreModalClose}
        />
      )}
    </div>
  )
}

