import { createContext, useContext, useEffect, useState } from 'react'
import { getConfig } from '../api.js'

const POR_DEFECTO = {
  app_name: 'Expediente',
  tagline: '',
  primary_color: '#2e7d4f',
  logo_url: '',
  inactividad_minutos: 5,
  plazo_observacion_meses: 3,
}

const ConfigContext = createContext(POR_DEFECTO)

// Mezcla el color con negro (factor < 0) o con blanco (factor > 0) para derivar las variantes del tema
function ajustarColor(hex, factor) {
  const n = parseInt(hex.replace('#', ''), 16)
  const canales = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(factor < 0 ? c * (1 + factor) : c + (255 - c) * factor)
  )
  return `#${canales.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(POR_DEFECTO)

  useEffect(() => {
    getConfig()
      .then((c) => setConfig({ ...POR_DEFECTO, ...c }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    document.title = config.app_name
    if (/^#[0-9a-fA-F]{6}$/.test(config.primary_color)) {
      const raiz = document.documentElement.style
      raiz.setProperty('--seal-green', config.primary_color)
      raiz.setProperty('--seal-green-dark', ajustarColor(config.primary_color, -0.45))
      raiz.setProperty('--seal-green-light', ajustarColor(config.primary_color, 0.9))
    }
  }, [config])

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export function useConfig() {
  return useContext(ConfigContext)
}
