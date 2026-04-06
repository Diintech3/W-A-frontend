import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './useAuth'

export function useSocket() {
  const { user, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!isAuthenticated || !user?._id) {
      setSocket(null)
      setConnected(false)
      return
    }

    const url =
      import.meta.env.VITE_SOCKET_URL ||
      (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin)
    const s = io(url, {
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000,
    })

    s.on('connect', () => {
      setConnected(true)
      s.emit('join', user._id)
    })
    s.on('disconnect', () => setConnected(false))

    setSocket(s)

    return () => {
      s.emit('leave', user._id)
      s.disconnect()
      setSocket(null)
      setConnected(false)
    }
  }, [isAuthenticated, user?._id])

  return { socket, connected }
}
