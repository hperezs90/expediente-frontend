import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { plataformaLogin } from '../api.js'
import Marca from '../components/Marca.jsx'

export default function PlataformaLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await plataformaLogin(email, password)
      navigate('/plataforma')
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
        <p className="login-quote">Administración de la plataforma</p>
      </div>
      <div className="login-panel">
        <form className="login-box" onSubmit={handleSubmit}>
          <div className="eyebrow">Plataforma</div>
          <h1 style={{ fontSize: 24, marginBottom: 26 }}>Iniciar sesión</h1>
          {error && <div className="error-msg">{error}</div>}
          <div className="field">
            <label>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
