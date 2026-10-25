
import { useEffect, useRef } from 'react'

// Trigger onShake after two sharp jolts within one second.
export function useShake(
  onShake,
  { threshold = 25, hits = 2, windowMs = 1000, gapMs = 150 } = {}
) {
  const callbackRef = useRef(onShake)
  callbackRef.current = onShake

  useEffect(() => {
    let last = null
    let times = []

    function onMotion(event) {
      const a = event.accelerationIncludingGravity
      if (!a || a.x == null || a.y == null || a.z == null) return

      if (last) {
        const delta =
          Math.abs(a.x - last.x) +
          Math.abs(a.y - last.y) +
          Math.abs(a.z - last.z)

        const now = Date.now()

        if (delta > threshold && (!times.length || now - times[times.length - 1] > gapMs)) {
          times = times.filter((t) => now - t < windowMs)
          times.push(now)

          if (times.length >= hits) {
            times = []
            callbackRef.current?.()
          }
        }
      }

      last = { x: a.x, y: a.y, z: a.z }
    }

    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [threshold, hits, windowMs, gapMs])
}

export const motionNeedsPermission = () =>
  typeof DeviceMotionEvent !== 'undefined' &&
  typeof DeviceMotionEvent.requestPermission === 'function'

export async function requestMotionPermission() {
  if (!motionNeedsPermission()) return true

  try {
    return (await DeviceMotionEvent.requestPermission()) === 'granted'
  } catch {
    return false
  }
}
