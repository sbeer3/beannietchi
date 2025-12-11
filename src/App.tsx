import './App.css'
import { useState, useEffect, useRef } from 'react'

function App() {
  // Image state - changes based on time
  const [imgSrc, setImgSrc] = useState("/idle.png")
  const [isDoingAction, setIsDoingAction] = useState(false) // Prevent time override during actions

  // Persistent audio instance - no delay!
  const clickSound = useRef<HTMLAudioElement | null>(null)

  const [tamagotchi, setTamagotchi] = useState({
    name: "Beannie-tchi",
    hunger: 100,
    happiness: 100,
    sleep: 100,
    age: 0,
    isAsleep: false,
    isDead: false,
  })

  // Current time state
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000) // Update every 1 second

    return () => clearInterval(timeTimer)
  }, [])

  // Update image based on time (only if not doing an action)
  useEffect(() => {
    if (isDoingAction) return // Don't override during actions!

    const hour = currentTime.getHours()

    // Priority order: sleeping > hungry > idle
    if (hour >= 20 || hour < 6) {
      // Between 8pm and 6am - sleeping
      setImgSrc("/sleeping.png")
    } else if (tamagotchi.hunger <= 75) {
      // Hungry during daytime
      setImgSrc("/hungry.png")
    } else {
      // Default idle state
      setImgSrc("/idle.png")
    }
  }, [currentTime, isDoingAction, tamagotchi.hunger]) // Re-run when time, action state, or hunger changes

  // Preload assets to prevent delays
  useEffect(() => {
    // Create and preload audio instance
    clickSound.current = new Audio('/click_sound.mp3')
    clickSound.current.load()

    // Preload images
    const images = ['/idle.png', '/eating.png', '/sleeping.png']
    images.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [])

  // Hunger and happiness timers
  useEffect(() => {
    const hungerTimer = setInterval(() => {
      setTamagotchi(prev => ({
        ...prev,
        hunger: Math.max(prev.hunger - 1, 0), // Increase hunger, max 100
      }))
    }, 5000)

    const happinessTimer = setInterval(() => {
      setTamagotchi(prev => ({
        ...prev,
        happiness: Math.max(prev.happiness - 1, 0), // Decrease happiness, min 0
      }))
    }, 300000)

    // Cleanup BOTH timers when component unmounts
    return () => {
      clearInterval(hungerTimer)
      clearInterval(happinessTimer)
    }
  }, [])

  const playSound = () => {
    if (clickSound.current) {
      clickSound.current.currentTime = 0 // Reset to start
      clickSound.current.play().catch(err => console.log('Sound play failed:', err))
    }
  }

  const feed = () => {
    if (tamagotchi.hunger === 100) {
      return
    }
    playSound()
    setIsDoingAction(true) // Prevent time-based image changes
    setImgSrc("/eating.png")
    setTamagotchi({
      ...tamagotchi,
      hunger: 100,
    })
    // Return to correct state after 5 seconds
    setTimeout(() => {
      setIsDoingAction(false) // Allow time-based changes again - useEffect will set correct image
    }, 5000)
  }

  const play = () => {
    if (tamagotchi.happiness === 100) {
      return
    }
    playSound()
    setTamagotchi({
      ...tamagotchi,
      hunger: tamagotchi.hunger - 1,
      happiness: 100,
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
