class AudioManager {
  constructor() {
    this.menuMusic = null
    this.raceMusic = null
    this.engineSound = null
    this.volume = 0.3
    this.muted = false
    this.initialized = false
    this.userInteracted = false
  }

  init() {
    if (this.initialized) return

    try {
      // Menu music (loops)
      this.menuMusic = new Audio('/audio/menu-music.mp3')
      this.menuMusic.loop = true
      this.menuMusic.volume = this.volume
      this.menuMusic.preload = 'auto'
      this.menuMusic.onerror = () => console.warn('⚠️ menu-music.mp3 not found')

      // Race music (loops) - fallback to menu if not found
      this.raceMusic = new Audio('/audio/race-music.mp3')
      this.raceMusic.loop = true
      this.raceMusic.volume = this.volume
      this.raceMusic.preload = 'auto'
      this.raceMusic.onerror = () => {
        console.warn('⚠️ race-music.mp3 not found, using menu music')
        this.raceMusic = this.menuMusic
      }

      // Engine sound (loops) - optional
      this.engineSound = new Audio('/audio/engine-sound.mp3')
      this.engineSound.loop = true
      this.engineSound.volume = 0
      this.engineSound.preload = 'auto'
      this.engineSound.onerror = () => console.warn('⚠️ engine-sound.mp3 not found (optional)')

      this.initialized = true
      console.log('✅ Audio Manager initialized')
    } catch (error) {
      console.error('❌ Audio init failed:', error)
    }
  }

  enableAudio() {
    this.userInteracted = true
    this.init()
  }

  playMenuMusic() {
    if (!this.userInteracted) {
      console.warn('⚠️ Audio requires user interaction first')
      return
    }
    
    this.init()
    if (this.muted || !this.menuMusic) return
    
    this.stopRaceMusic()
    this.menuMusic.currentTime = 0
    this.menuMusic.play()
      .then(() => console.log('🎵 Menu music playing'))
      .catch(err => console.error('❌ Menu music error:', err))
  }

  playRaceMusic() {
    if (!this.userInteracted) {
      console.warn('⚠️ Audio requires user interaction first')
      return
    }
    
    this.init()
    if (this.muted || !this.raceMusic) return
    
    this.stopMenuMusic()
    this.raceMusic.currentTime = 0
    this.raceMusic.play()
      .then(() => console.log('🎵 Race music playing'))
      .catch(err => console.error('❌ Race music error:', err))
  }

  stopMenuMusic() {
    if (this.menuMusic) {
      this.menuMusic.pause()
      this.menuMusic.currentTime = 0
    }
  }

  stopRaceMusic() {
    if (this.raceMusic) {
      this.raceMusic.pause()
      this.raceMusic.currentTime = 0
    }
  }

  updateEngineSound(speed, maxSpeed) {
    if (!this.engineSound || this.muted) return
    
    const ratio = Math.min(speed / maxSpeed, 1)
    this.engineSound.volume = ratio * this.volume * 0.5
    this.engineSound.playbackRate = 0.8 + ratio * 0.7
    
    if (ratio > 0.05 && this.engineSound.paused) {
      this.engineSound.play().catch(() => {})
    } else if (ratio <= 0.05 && !this.engineSound.paused) {
      this.engineSound.pause()
    }
  }

  stopEngineSound() {
    if (this.engineSound) {
      this.engineSound.pause()
      this.engineSound.currentTime = 0
    }
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol))
    if (this.menuMusic) this.menuMusic.volume = this.volume
    if (this.raceMusic) this.raceMusic.volume = this.volume
  }

  toggleMute() {
    this.muted = !this.muted
    if (this.muted) {
      this.stopMenuMusic()
      this.stopRaceMusic()
      this.stopEngineSound()
    }
    return this.muted
  }

  stopAll() {
    this.stopMenuMusic()
    this.stopRaceMusic()
    this.stopEngineSound()
  }
}

export default new AudioManager()
