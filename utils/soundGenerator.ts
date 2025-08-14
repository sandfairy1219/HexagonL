'use client'

// 웹 오디오 API를 사용해 간단한 사운드 생성
export class SoundGenerator {
  private audioContext: AudioContext | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
  }

  // 비프음 생성 (주파수, 지속시간, 볼륨)
  playBeep(frequency: number, duration: number, volume: number = 0.1) {
    if (!this.audioContext) return

    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)
    oscillator.type = 'square'

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

    oscillator.start(this.audioContext.currentTime)
    oscillator.stop(this.audioContext.currentTime + duration)
  }

  // 게임 사운드들
  playMoveSound() {
    this.playBeep(800, 0.1, 0.05) // 높은 톤, 짧은 소리
  }


  playGameOverSound() {
    // 하강하는 톤의 시퀀스
    setTimeout(() => this.playBeep(400, 0.2, 0.1), 0)
    setTimeout(() => this.playBeep(300, 0.2, 0.1), 200)
    setTimeout(() => this.playBeep(200, 0.4, 0.1), 400)
  }

  playStartSound() {
    // 상승하는 톤의 시퀀스
    setTimeout(() => this.playBeep(200, 0.1, 0.08), 0)
    setTimeout(() => this.playBeep(300, 0.1, 0.08), 100)
    setTimeout(() => this.playBeep(400, 0.2, 0.08), 200)
  }

  // BGM 대신 간단한 리듬 패턴
  startSimpleBGM(): NodeJS.Timeout {
    if (!this.audioContext) return setTimeout(() => {}, 0)

    const playRhythm = () => {
      this.playBeep(440, 0.1, 0.02) // A note
      setTimeout(() => this.playBeep(554, 0.1, 0.02), 300) // C# note
      setTimeout(() => this.playBeep(659, 0.1, 0.02), 600) // E note
    }

    // 1초마다 리듬 패턴 반복
    const interval = setInterval(playRhythm, 1000)
    return interval
  }
}
