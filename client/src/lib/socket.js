import { io } from 'socket.io-client'
import { getAccessToken } from './api.js'

let socket = null

export function connectSocket() {
  if (socket?.connected) return socket
  const url = import.meta.env.VITE_SOCKET_URL || undefined
  socket = io(url, {
    auth: (cb) => cb({ token: getAccessToken() }),
    withCredentials: true,
    reconnectionAttempts: 5,
  })
  return socket
}

export function getSocket() {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
