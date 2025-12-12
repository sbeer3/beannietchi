import './App.css'
import { useState, useEffect, useRef } from 'react'

const STORAGE_KEY = 'beannie-tchi-state'

interface TamagotchiState {
  name: string
  hunger: number
  happiness: number
  sleep: number
  age: number
  isAsleep: boolean
  isDead: boolean
  action: string
}

function App() {
  // Image state - changes based on time
  const [imgSrc, setImgSrc] = useState("/idle.png")
  const [isDoingAction, setIsDoingAction] = useState(false) // Prevent time override during actions

  // Persistent audio instance - no delay!
  const clickSound = useRef<HTMLAudioElement | null>(null)

  const [tamagotchi, setTamagotchi] = useState<TamagotchiState>(() => {
    // Load from localStorage on initial mount
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const { state, timestamp } = JSON.parse(saved)
        const now = Date.now()
        const minutesElapsed = (now - timestamp) / 1000 / 60

        // Calculate stat decay while app was closed
        // Hunger decreases by 1 every 3 minutes (180000ms = 3min)
        // Happiness decreases by 1 every 5 minutes (300000ms = 5min)
        const hungerDecay = Math.floor(minutesElapsed / 3)
        const happinessDecay = Math.floor(minutesElapsed / 5)

        return {
          ...state,
          hunger: Math.max(state.hunger - hungerDecay, 0),
          happiness: Math.max(state.happiness - happinessDecay, 0),
        }
      } catch (e) {
        console.error('Failed to load saved state:', e)
      }
    }

    // Default initial state
    return {
      name: "Beannie-tchi",
      hunger: 100,
      happiness: 100,
      sleep: 100,
      age: 0,
      isAsleep: false,
      isDead: false,
      action: "idle",
    }
  })

  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timeTimer)
  }, [])

  //Preload assets
  useEffect(() => {
    preloadAssets()
  }, [])

  // Save to localStorage whenever tamagotchi state changes
  useEffect(() => {
    const dataToSave = {
      state: tamagotchi,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
  }, [tamagotchi])

  //Check sleep state
  useEffect(() => {
    if (isDoingAction) {
      return
    }
    const hour = currentTime.getHours()
    if (hour >= 20 || hour < 6) {
      setTamagotchi(prev => ({
        ...prev,
        action: "Sleep",
      }))
    }
  }, [currentTime])
  useEffect(() => {
    if (isDoingAction) {
      return
    }
    if (tamagotchi.hunger <= 75) {
      setTamagotchi(prev => ({
        ...prev,
        action: "Hungry",
      }))
    }
  }, [tamagotchi.hunger])

  // Hunger and happiness timers
  useEffect(() => {
    if (isDoingAction) {
      return
    }
    const hungerTimer = setInterval(() => {
      setTamagotchi(prev => ({
        ...prev,
        hunger: Math.max(prev.hunger - 1, 0), // Increase hunger, max 100
      }))
    }, 180000)

    const happinessTimer = setInterval(() => {
      setTamagotchi(prev => ({
        ...prev,
        happiness: Math.max(prev.happiness - 1, 0), // Decrease happiness, min 0
      }))
    }, 300000)

    // Cleanup BOTH timers when component unmounts or when isDoingAction changes
    return () => {
      clearInterval(hungerTimer)
      clearInterval(happinessTimer)
    }
  }, [isDoingAction])

  useEffect(() => {
    setImgSrc(determineImage())
  }, [tamagotchi.action])

  const playSound = () => {
    if (clickSound.current) {
      clickSound.current.currentTime = 0 // Reset to start
      clickSound.current.play().catch(err => console.log('Sound play failed:', err))
    }
  }

  const feed = () => {
    if (tamagotchi.hunger === 100 || isDoingAction) {
      return
    }
    playSound()
    setIsDoingAction(true) // Prevent time-based image changes
    setTamagotchi({
      ...tamagotchi,
      action: "Eat",
    })
    setTimeout(() => {
      setIsDoingAction(false) // Allow time-based changes again - useEffect will set correct image
      setTamagotchi({
        ...tamagotchi,
        hunger: 100,
        action: "Idle",

      })
    }, 5000)
  }

  const play = () => {
    if (tamagotchi.happiness === 100 || isDoingAction) {
      return
    }
    playSound()
    setIsDoingAction(true) // Prevent time-based image changes
    setTamagotchi({
      ...tamagotchi,
      action: "Play",
    })
    setTimeout(() => {
      setIsDoingAction(false) // Allow time-based changes again - useEffect will set correct image
      setTamagotchi({
        ...tamagotchi,
        happiness: 100,
        action: "Idle",
      })
    }, 5000)
  }


  const whichIdleImage = () => {
    const images = ["idle.png", "idle2.png", "idle3.png"]
    const randomImage = images[Math.floor(Math.random() * images.length)]
    return randomImage
  }

  const determineImage = () => {
    if (tamagotchi.action === "Hungry") {
      return "/hungry.png"
    }
    if (tamagotchi.action === "Sleep") {
      const images = ["sleeping.png", "sleeping2.png", "sleeping3.png"]
      const randomImage = images[Math.floor(Math.random() * images.length)]
      return randomImage
    }
    if (tamagotchi.action === "Eat") {
      return "/eating.png"
    }
    if (tamagotchi.action === "Play") {
      const images = ["playing.png", "playing2.png"]
      const randomImage = images[Math.floor(Math.random() * images.length)]
      return randomImage
    }
    if (tamagotchi.action === "Idle") {
      return whichIdleImage()
    }
    return whichIdleImage()
  }

  const preloadAssets = () => {
    // Preload audio
    clickSound.current = new Audio('/click_sound.mp3')
    clickSound.current.load()

    // Preload all images
    const images = [
      "/idle.png", "/idle2.png", "/idle3.png",
      "/eating.png", "/eating2.png", "/eating3.png",
      "/sleeping.png", "/sleeping2.png", "/sleeping3.png",
      "/hungry.png",
      "/playing.png", "/playing2.png"
    ]

    images.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }

  return (
    <div className="app">
      <div className="tamagotchi-shell">
        <div className="tamagotchi-screen scanlines">
          <img src="/dither_green.jpg" className="background" />
          <img src={imgSrc} alt="Beannie-tchi" className="foreground pixel-art" />
        </div>
        <div className="tamagotchi-buttons">
          <button onClick={feed}>Feed</button>
          <button onClick={play}>Play</button>
        </div>
        <div className="tamagotchi-info">
          <p>Hunger: {tamagotchi.hunger}</p>
          <p>Happiness: {tamagotchi.happiness}</p>
          {/* <p>Age: {tamagotchi.age}</p> */}
        </div>
      </div>
    </div>
  )
}

export default App
