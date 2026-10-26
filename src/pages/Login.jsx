import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api.js'
import { useConfig } from '../context/ConfigContext.jsx'
import Marca from '../components/Marca.jsx'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { tagline } = useConfig()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-side">
        <div className="brand">
          <Marca />
        </div>
        {tagline && <p className="login-quote">"{tagline}"</p>}
        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', letterSpacing: '0.04em' }}>
          SEGUIMIENTO DE TRÁMITES, PERMISOS Y VENCIMIENTOS
        </div>
      </div>

      <div className="login-panel">
        <form className="login-box" onSubmit={handleSubmit}>
          <div className="eyebrow">Acceso al sistema</div>
          <h1 style={{ fontSize: 24, marginBottom: 26 }}>Iniciar sesión</h1>

          {error && <div className="error-msg">{error}</div>}

          <div className="field">
            <label>Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
