import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import { useUser } from '../context/UserContext.jsx'
import { getUsuarios, createUsuario, updateUsuario, cambiarPasswordUsuario } from '../api.js'

export default function Usuarios() {
  const { user, loading: cargandoUser } = useUser()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('gestor')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const enviando = useRef(false)

  const [usuarioEditandoPassword, setUsuarioEditandoPassword] = useState(null)
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [guardandoPassword, setGuardandoPassword] = useState(false)

  function cargar() {
    setLoading(true)
    getUsuarios()
      .then(setUsuarios)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.rol === 'admin') cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  async function handleSubmit(e) {
    e.preventDefault()
    if (enviando.current) return
    enviando.current = true
    setFormError('')
    setSaving(true)
    try {
      await createUsuario({ nombre, email, password, rol })
      setNombre('')
      setEmail('')
      setPassword('')
      setRol('gestor')
      cargar()
    } catch (err) {
      setFormError(err.message || 'No se pudo crear el usuario')
      enviando.current = false
    } finally {
      setSaving(false)
    }
  }

  async function handleCambiarRol(usuario, nuevoRol) {
    setError('')
    try {
      await updateUsuario(usuario.id, { rol: nuevoRol })
      cargar()
    } catch (err) {
      setError(err.message || 'No se pudo cambiar el rol')
    }
  }

  async function handleToggleActivo(usuario) {
    setError('')
    try {
      await updateUsuario(usuario.id, { activo: !usuario.activo })
      cargar()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el usuario')
    }
  }

  function abrirCambioPassword(usuario) {
    setUsuarioEditandoPassword(usuario)
    setNuevaPassword('')
    setPasswordError('')
  }

  async function handleGuardarPassword(e) {
    e.preventDefault()
    setPasswordError('')
    setGuardandoPassword(true)
    try {
      await cambiarPasswordUsuario(usuarioEditandoPassword.id, nuevaPassword)
      setUsuarioEditandoPassword(null)
      setNuevaPassword('')
    } catch (err) {
      setPasswordError(err.message || 'No se pudo cambiar la contraseña')
    } finally {
      setGuardandoPassword(false)
    }
  }

  if (!cargandoUser && user?.rol !== 'admin') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="shell">
      <Sidebar active="usuarios" />
      <main className="main">
        <div className="eyebrow">{user?.organizacion_nombre} · equipo</div>
        <h1 style={{ fontSize: 26, marginBottom: 26 }}>Usuarios</h1>

        <div className="section-label">Crear cuenta nueva</div>
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--paper-card)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: 22,
            marginBottom: 32,
            maxWidth: 480,
          }}
        >
          {formError && <div className="error-msg">{formError}</div>}
          <div className="field">
            <label>Nombre</label>
            <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>
          <div className="field">
            <label>Correo</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Contraseña temporal</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <div className="field">
            <label>Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value)}>
              <option value="gestor">Gestor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>

        <div className="section-label">Equipo actual</div>
        {loading && <div className="loading">Cargando...</div>}
        {error && <div className="error-msg">{error}</div>}
        {!loading && !error && (
          <div className="table-wrap" style={{ maxWidth: 760 }}>
            <div className="t-head" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr' }}>
              <span>NOMBRE / CORREO</span>
              <span>ROL</span>
              <span>ESTADO</span>
              <span>ACCESO</span>
            </div>
            {usuarios.map((u) => (
              <div key={u.id} className="t-row" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr', cursor: 'default' }}>
                <div>
                  <div className="co">{u.nombre}</div>
                  <div className="co-sub">{u.email}</div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <select
                    value={u.rol}
                    onChange={(e) => handleCambiarRol(u, e.target.value)}
                    disabled={u.id === user?.id}
                    style={{ fontSize: 12, padding: '6px 26px 6px 10px' }}
                  >
                    <option value="gestor">Gestor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-ghost"
                    style={{
                      fontSize: 11,
                      padding: '6px 10px',
                      color: u.activo ? 'var(--seal-green)' : 'var(--seal-red)',
                      borderColor: u.activo ? 'var(--seal-green)' : 'var(--seal-red)',
                    }}
                    onClick={() => handleToggleActivo(u)}
                    disabled={u.id === user?.id}
                  >
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 11, padding: '6px 10px' }}
                    onClick={() => abrirCambioPassword(u)}
                  >
                    Cambiar contraseña
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {usuarioEditandoPassword && (
          <div
            className="overlay"
            onClick={(e) => e.target === e.currentTarget && setUsuarioEditandoPassword(null)}
          >
            <div className="modal" style={{ maxWidth: 380 }}>
              <div className="modal-head">
                <h2 style={{ fontSize: 17 }}>Cambiar contraseña</h2>
                <button className="close-btn" onClick={() => setUsuarioEditandoPassword(null)}>
                  ✕
                </button>
              </div>
              <form onSubmit={handleGuardarPassword}>
                <div className="modal-body">
                  <p className="mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 14 }}>
                    {usuarioEditandoPassword.nombre} · {usuarioEditandoPassword.email}
                  </p>
                  {passwordError && <div className="error-msg">{passwordError}</div>}
                  <div className="field">
                    <label>Contraseña nueva</label>
                    <input
                      type="text"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      required
                      minLength={8}
                      autoFocus
                    />
                  </div>
                  <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>
                    Mínimo 8 caracteres. Compártesela a la persona por un canal aparte del sistema.
                  </p>
                </div>
                <div className="modal-foot">
                  <button type="button" className="btn-ghost" onClick={() => setUsuarioEditandoPassword(null)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={guardandoPassword}>
                    {guardandoPassword ? 'Guardando...' : 'Guardar contraseña'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <p className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 10, maxWidth: 480 }}>
          No puedes cambiar tu propio rol ni desactivarte a ti mismo — pídele a otro admin que lo haga si
          hace falta.
        </p>

        <p className="mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 20, maxWidth: 480 }}>
          Para asignar empresas a un gestor, entra a la ficha de cada empresa cliente — ahí se agrega la
          sección de gestores asignados.
        </p>
      </main>
    </div>
  )
}
