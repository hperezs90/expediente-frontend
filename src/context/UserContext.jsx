import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { getMe, logout } from '../api.js'
import { useConfig } from './ConfigContext.jsx'

const UserContext = createContext({ user: null, loading: true, refrescar: () => {} })

export function UserProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const temporizadorRef = useRef(null)
  const { inactividad_minutos: minutosInactividad } = useConfig()

  function cargar() {
    setLoading(true)
    getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    cargar()
  }, [])

  // Cierre de sesión por inactividad: si no hay clicks/teclas/scroll durante el tiempo configurado
  // (INACTIVIDAD_MINUTOS, 0 = desactivado), se cierra sesión sola y se manda a /login.
  useEffect(() => {
    if (!minutosInactividad) return undefined
    function cerrarPorInactividad() {
      logout()
      window.location.href = '/login'
    }

    function reiniciarTemporizador() {
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
      temporizadorRef.current = setTimeout(cerrarPorInactividad, minutosInactividad * 60 * 1000)
    }

    const eventosDeActividad = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']
    eventosDeActividad.forEach((evento) => window.addEventListener(evento, reiniciarTemporizador))
    reiniciarTemporizador()

    return () => {
      eventosDeActividad.forEach((evento) => window.removeEventListener(evento, reiniciarTemporizador))
      if (temporizadorRef.current) clearTimeout(temporizadorRef.current)
    }
  }, [minutosInactividad])

  return (
    <UserContext.Provider value={{ user, loading, refrescar: cargar }}>{children}</UserContext.Provider>
  )
}

export function useUser() {
  return useContext(UserContext)
}
