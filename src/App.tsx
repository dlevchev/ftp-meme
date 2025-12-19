import { useState, useEffect } from 'react'
import './App.css'

interface FartEntry {
  id: number
  address: string
  power: number
  timestamp: number
}

function App() {
  const [pumpPower, setPumpPower] = useState(0)
  const [totalFarts, setTotalFarts] = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const [chargeLevel, setChargeLevel] = useState(0)
  const [leaderboard, setLeaderboard] = useState<FartEntry[]>([])
  const [showExplosion, setShowExplosion] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('DISCONNECTED')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [copiedCA, setCopiedCA] = useState(false)

  const CONTRACT_ADDRESS = 'J53gZe8hsT2zqCkSm3rh8HpiE5QNEwiZmZN977wipump'

  useEffect(() => {
    const saved = localStorage.getItem('ftp-stats')
    if (saved) {
      const stats = JSON.parse(saved)
      setPumpPower(stats.pumpPower || 0)
      setTotalFarts(stats.totalFarts || 0)
      setLeaderboard(stats.leaderboard || [])
    }
  }, [])

  const saveStats = (power: number, farts: number, board: FartEntry[]) => {
    localStorage.setItem('ftp-stats', JSON.stringify({
      pumpPower: power,
      totalFarts: farts,
      leaderboard: board
    }))
  }

  const handleMouseDown = () => {
    setIsCharging(true)
    setConnectionStatus('CONNECTING...')
  }

  const handleMouseUp = () => {
    if (!isCharging) return

    setIsCharging(false)
    setConnectionStatus('SENDING TO SLINGOOR...')

    const fartPower = Math.floor(chargeLevel / 10) + Math.floor(Math.random() * 20) + 1

    let progress = 0
    const uploadInterval = setInterval(() => {
      progress += Math.random() * 30
      setUploadProgress(progress)

      if (progress >= 100) {
        clearInterval(uploadInterval)
        executeFart(fartPower)
        setUploadProgress(0)
        setConnectionStatus('DISCONNECTED')
      }
    }, 100)

    setChargeLevel(0)
  }

  const copyCA = async () => {
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
      setCopiedCA(true)
      setTimeout(() => setCopiedCA(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const executeFart = (fartPower: number) => {
    const newPower = pumpPower + fartPower
    const newTotal = totalFarts + 1

    setShowExplosion(true)
    setTimeout(() => setShowExplosion(false), 500)

    playFartSound()

    const newEntry: FartEntry = {
      id: Date.now(),
      address: generateDegeneAddress(),
      power: fartPower,
      timestamp: Date.now()
    }

    const newLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.power - a.power)
      .slice(0, 10)

    setPumpPower(newPower)
    setTotalFarts(newTotal)
    setLeaderboard(newLeaderboard)
    saveStats(newPower, newTotal, newLeaderboard)
  }

  useEffect(() => {
    let interval: number
    if (isCharging) {
      interval = setInterval(() => {
        setChargeLevel(prev => Math.min(prev + 5, 1000))
      }, 50)
    }
    return () => clearInterval(interval)
  }, [isCharging])

  const playFartSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.frequency.setValueAtTime(100, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(30, audioContext.currentTime + 0.2)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  const generateDegeneAddress = () => {
    const chars = '0123456789abcdef'
    let address = '0x'
    for (let i = 0; i < 8; i++) {
      address += chars[Math.floor(Math.random() * chars.length)]
    }
    return address + '...'
  }

  const formatTime = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  return (
    <div className="app">
      <div className="stars"></div>
      <div className="stars2"></div>
      <div className="stars3"></div>

      <header className="header">
        <h1 className="title">
          <span className="protocol">FART TO PUMP</span>
          <span className="subtitle">FTP Protocol</span>
        </h1>

        <div className="ca-container">
          <div className="ca-label">CONTRACT ADDRESS (CA)</div>
          <div className="ca-box" onClick={copyCA}>
            <span className="ca-text">{CONTRACT_ADDRESS}</span>
            <button className="copy-btn">{copiedCA ? '✓ COPIED!' : '📋 COPY'}</button>
          </div>
        </div>

        <div className="connection-status">
          <span className={`status-light ${connectionStatus === 'DISCONNECTED' ? 'off' : 'on'}`}></span>
          {connectionStatus}
        </div>
      </header>

      <div className="main-container">
        <div className="stats-panel">
          <div className="stat-box">
            <div className="stat-label">TOTAL PUMP POWER</div>
            <div className="stat-value pump-value">{pumpPower.toLocaleString()}</div>
          </div>
          <div className="stat-box">
            <div className="stat-label">FARTS SENT TO SLINGOOR</div>
            <div className="stat-value">{totalFarts.toLocaleString()}</div>
          </div>
        </div>

        <div className="fart-zone">
          <div className={`fart-button ${isCharging ? 'charging' : ''} ${showExplosion ? 'explosion' : ''}`}
               onMouseDown={handleMouseDown}
               onMouseUp={handleMouseUp}
               onMouseLeave={handleMouseUp}
               onTouchStart={handleMouseDown}
               onTouchEnd={handleMouseUp}>
            <div className="button-glow"></div>
            <div className="button-content">
              {isCharging ? (
                <>
                  <div className="charge-text">CHARGING...</div>
                  <div className="charge-meter">
                    <div className="charge-fill" style={{ width: `${(chargeLevel / 1000) * 100}%` }}></div>
                  </div>
                  <div className="charge-value">{chargeLevel}</div>
                </>
              ) : (
                <>
                  <div className="fart-emoji">💨</div>
                  <div className="button-text">HOLD TO CHARGE FART</div>
                  <div className="protocol-text">SEND TO SLINGOOR</div>
                </>
              )}
            </div>
            {showExplosion && (
              <div className="explosion-effect">
                <div className="explosion-particle"></div>
                <div className="explosion-particle"></div>
                <div className="explosion-particle"></div>
                <div className="explosion-particle"></div>
                <div className="explosion-particle"></div>
              </div>
            )}
          </div>

          {uploadProgress > 0 && (
            <div className="upload-bar">
              <div className="upload-fill" style={{ width: `${uploadProgress}%` }}></div>
              <div className="upload-text">SENDING FARTS TO SLINGOOR... {Math.floor(uploadProgress)}%</div>
            </div>
          )}

          <div className="instructions">
            <p>PRESS AND HOLD to charge your fart power</p>
            <p>RELEASE to send farts to Slingoor via FTP Protocol</p>
            <p className="warning">⚠️ SLINGOOR DEMANDS MAXIMUM FARTS ⚠️</p>
          </div>
        </div>

        <div className="leaderboard">
          <h2 className="leaderboard-title">
            <span>🏆 TOP PUMPERS 🏆</span>
            <span className="live-indicator">● LIVE</span>
          </h2>
          <div className="leaderboard-list">
            {leaderboard.length === 0 ? (
              <div className="empty-state">No pumps yet. Be the first degen!</div>
            ) : (
              leaderboard.map((entry, index) => (
                <div key={entry.id} className={`leaderboard-entry rank-${index + 1}`}>
                  <div className="rank">#{index + 1}</div>
                  <div className="address">{entry.address}</div>
                  <div className="power">+{entry.power} PUMP</div>
                  <div className="time">{formatTime(entry.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chart-container">
          <h2 className="chart-title">📊 LIVE CHART 📊</h2>
          <iframe
            id="dexscreener-embed"
            src="https://dexscreener.com/solana/8XYNg653AuksT2p9JTzo7J6WkdCVqvQVTxtiXd3mMLWF?embed=1&theme=dark&trades=0&info=0"
            style={{
              position: 'relative',
              width: '100%',
              height: '600px',
              border: '2px solid #00ff88',
              borderRadius: '0',
              boxShadow: '0 0 30px rgba(0, 255, 136, 0.2), inset 0 0 30px rgba(0, 0, 0, 0.5)'
            }}
          ></iframe>
        </div>
      </div>

      <footer className="footer">
        <p>⚡ Powered by pure degen energy ⚡</p>
        <p className="disclaimer">Not financial advice. Just farts. 💨</p>
      </footer>
    </div>
  )
}

export default App
