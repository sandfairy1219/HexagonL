'use client'

import React, { useEffect, useRef, useState } from 'react'

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
  onTimeUpdate?: (time: number) => void
  onGameStateChange?: (state: GameState) => void

  constructor(canvas: HTMLCanvasElement, callbacks?: { onTimeUpdate?: (time: number) => void; onGameStateChange?: (state: GameState) => void }) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.width = canvas.width
    this.height = canvas.height
    this.centerX = this.width / 2
    this.centerY = this.height / 2
    
    this.onTimeUpdate = callbacks?.onTimeUpdate
    this.onGameStateChange = callbacks?.onGameStateChange
    
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
    this.wallSpeed = 2
    this.wallThickness = 15
    
    this.colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff']
    this.currentColorIndex = 0
    this.difficultyMessageTime = 0
  }

  movePlayer(direction: number) {
    if (this.gameState !== 'playing') return
    this.player.segment = (this.player.segment + direction + 6) % 6
  }

  startGame() {
    this.gameState = 'playing'
    this.startTime = Date.now()
    this.currentTime = 0
    this.walls = []
    this.player.segment = 0
    this.player.lives = 2
    this.player.invulnerable = 0
    this.wallSpeed = 1.5
    this.currentColorIndex = 0
    this.difficultyIncreased = false
    this.difficultyMessageTime = 0
    
    this.onGameStateChange?.(this.gameState)
    this.generateWalls()
  }

  generateWalls() {
    const numSegments = 6
    
    let numGaps: number
    if (this.currentTime < 10) {
      numGaps = Math.floor(Math.random() * 2) + 2
    } else {
      numGaps = Math.floor(Math.random() * 2) + 1
    }
    
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
    
    for (let i = 0; i < numSegments; i++) {
      if (!gapPositions.includes(i)) {
        this.walls.push({
          segment: i,
          radius: 500,
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
    
    if (this.currentTime >= 10 && !this.difficultyIncreased) {
      this.showDifficultyMessage()
      this.difficultyIncreased = true
    }
    
    for (let i = this.walls.length - 1; i >= 0; i--) {
      this.walls[i].radius -= this.wallSpeed
      
      if (this.walls[i].radius < 30) {
        this.walls.splice(i, 1)
      }
    }
    
    if (this.walls.length === 0 || this.walls[this.walls.length - 1].radius < 350) {
      this.generateWalls()
    }
    
    this.checkCollision()
    
    this.wallSpeed += 0.001
    
    if (this.difficultyMessageTime > 0) {
      this.difficultyMessageTime--
    }
    
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
    
    if (this.player.lives <= 0) {
      this.gameOver()
    }
  }

  gameOver() {
    this.gameState = 'gameOver'
    this.onGameStateChange?.(this.gameState)
  }

  showDifficultyMessage() {
    this.difficultyMessageTime = 180
  }

  draw() {
    this.ctx.fillStyle = '#000'
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    this.drawHexagon(this.centerX, this.centerY, 30, '#fff')
    
    for (let wall of this.walls) {
      this.drawWallSegment(wall)
    }
    
    if (this.gameState === 'playing') {
      const segmentAngle = Math.PI / 3
      const playerAngle = this.player.segment * segmentAngle + segmentAngle / 2
      const playerX = this.centerX + Math.cos(playerAngle) * this.player.radius
      const playerY = this.centerY + Math.sin(playerAngle) * this.player.radius
      
      let playerColor = this.player.lives === 2 ? '#4CAF50' : '#F44336'
      
      if (this.player.invulnerable > 0 && Math.floor(this.player.invulnerable / 10) % 2 === 0) {
        playerColor += '80'
      }
      
      this.ctx.fillStyle = playerColor
      this.ctx.beginPath()
      this.ctx.arc(playerX, playerY, this.player.size, 0, Math.PI * 2)
      this.ctx.fill()
    }
    
    if (this.gameState === 'waiting') {
      this.ctx.fillStyle = '#fff'
      this.ctx.font = '32px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('Press SPACE to Start', this.centerX, this.centerY)
    }
    
    if (this.difficultyMessageTime > 0) {
      this.ctx.fillStyle = '#ff4444'
      this.ctx.font = 'bold 28px Arial'
      this.ctx.textAlign = 'center'
      this.ctx.fillText('Difficulty Increased!', this.centerX, this.centerY - 50)
      this.ctx.fillStyle = '#ffff44'
      this.ctx.font = '20px Arial'
      this.ctx.fillText('Fewer gaps available!', this.centerX, this.centerY - 20)
    }
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

  drawWallSegment(wall: Wall) {
    const segmentAngle = Math.PI / 3
    const startAngle = wall.segment * segmentAngle
    const endAngle = startAngle + segmentAngle
    
    const innerRadius = wall.radius - this.wallThickness / 2
    const outerRadius = wall.radius + this.wallThickness / 2
    
    const startX1 = this.centerX + Math.cos(startAngle) * innerRadius
    const startY1 = this.centerY + Math.sin(startAngle) * innerRadius
    const startX2 = this.centerX + Math.cos(startAngle) * outerRadius
    const startY2 = this.centerY + Math.sin(startAngle) * outerRadius
    
    const endX1 = this.centerX + Math.cos(endAngle) * innerRadius
    const endY1 = this.centerY + Math.sin(endAngle) * innerRadius
    const endX2 = this.centerX + Math.cos(endAngle) * outerRadius
    const endY2 = this.centerY + Math.sin(endAngle) * outerRadius
    
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

  useEffect(() => {
    if (canvasRef.current) {
      gameRef.current = new SuperHexagonGameEngine(canvasRef.current, {
        onTimeUpdate: (time) => setCurrentTime(time),
        onGameStateChange: (state) => {
          setGameState(state)
          if (state === 'waiting') {
            setStartButtonText('Start')
          } else if (state === 'gameOver') {
            setStartButtonText('Restart')
          } else if (state === 'playing') {
            setStartButtonText('Playing')
          }
        }
      })
      
      gameRef.current.gameLoop()
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameRef.current) return
      
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
  }, [gameState])

  const handleMoveLeft = () => {
    if (gameRef.current && gameState === 'playing') {
      gameRef.current.movePlayer(-1)
    }
  }

  const handleMoveRight = () => {
    if (gameRef.current && gameState === 'playing') {
      gameRef.current.movePlayer(1)
    }
  }

  const handleStart = () => {
    if (gameRef.current && (gameState === 'waiting' || gameState === 'gameOver')) {
      gameRef.current.startGame()
    }
  }

  const timeColor = currentTime < 10 ? '#4CAF50' : '#ff4444'

  return (
    <div className="game-container">
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
    </div>
  )
}
