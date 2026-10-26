import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  plataformaAutenticada,
  plataformaLogout,
  getEmpresasPlataforma,
  crearEmpresaPlataforma,
  editarEmpresaPlataforma,
  restablecerPasswordEmpresa,
  enviarCorreoPrueba,
} from '../api.js'
import { useConfig } from '../context/ConfigContext.jsx'
import Marca from '../components/Marca.jsx'

const COLUMNAS = '1.3fr 1.6fr 0.7fr 0.7fr 0.8fr 1.1fr'
const COLOR_POR_DEFECTO = '#2e7d4f'

function limpiarSubdominio(valor) {
  return valor.toLowerCase().replace(/[^a-z0-9-]/g, '')
}

function generarPassword() {
  const alfabeto = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(14))
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('')
}

// Dirección donde abre la empresa: subdominio + dominio base (o *.localhost en desarrollo)
function urlEmpresa(subdominio, dominioBase) {
  const { protocol, hostname, port } = window.location
  if (dominioBase) return `${protocol}//${subdominio}.${dominioBase}`
  if (hostname === 'localhost' || hostname === '127.0.0.1') return `${protocol}//${subdominio}.localhost${port ? `:${port}` : ''}`
  return null
}

function EmpresaModal({ empresa, dominioBase, onClose, onSaved }) {
  const esEdicion = !!empresa
  const [subdominio, setSubdominio] = useState('')
  const [nombre, setNombre] = useState(empresa?.nombre || '')
  const [adminNombre, setAdminNombre] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState(() => (esEdicion ? '' : generarPassword()))
  const [catalogoEjemplo, setCatalogoEjemplo] = useState(true)
  const [color, setColor] = useState(empresa?.color_primario || '')
  const [eslogan, setEslogan] = useState(empresa?.eslogan || '')
  const [nombreApp, setNombreApp] = useState(empresa?.nombre_app || '')
  const [logoUrl, setLogoUrl] = useState(empresa?.logo_url || '')
  const [correoAlertas, setCorreoAlertas] = useState(empresa?.correo_alertas || '')
  const [activo, setActivo] = useState(empresa?.activo ?? true)
  const [resetEmail, setResetEmail] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [creada, setCreada] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setAviso('')
    setSaving(true)
    try {
      if (esEdicion) {
        await editarEmpresaPlataforma(empresa.subdominio, {
          nombre,
          nombre_app: nombreApp,
          eslogan,
          color_primario: color || '',
          logo_url: logoUrl,
          correo_alertas: correoAlertas,
          activo,
        })
        onSaved()
      } else {
        await crearEmpresaPlataforma({
          subdominio,
          nombre,
          admin_nombre: adminNombre,
          admin_email: adminEmail,
          admin_password: adminPassword,
          catalogo_ejemplo: catalogoEjemplo,
          color_primario: color || null,
          eslogan: eslogan || null,
          nombre_app: nombreApp || null,
          logo_url: logoUrl || null,
          correo_alertas: correoAlertas || null,
        })
        setCreada({ subdominio, email: adminEmail, password: adminPassword })
      }
    } catch (err) {
      setError(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handlePrueba() {
    setError('')
    setAviso('')
    try {
      const r = await enviarCorreoPrueba(empresa.subdominio)
      setAviso(`Correo de prueba enviado a ${r.enviado_a.join(', ')} (remitente: ${r.remitente}).`)
    } catch (err) {
      setError(err.message || 'No se pudo enviar el correo de prueba')
    }
  }

  async function handleReset() {
    setError('')
    setAviso('')
    try {
      await restablecerPasswordEmpresa(empresa.subdominio, { email: resetEmail, password: resetPassword })
      setAviso(`Contraseña de ${resetEmail} actualizada.`)
      setResetPassword('')
    } catch (err) {
      setError(err.message || 'No se pudo restablecer la contraseña')
    }
  }

  if (creada) {
    const url = urlEmpresa(creada.subdominio, dominioBase)
    return (
      <div className="overlay">
        <div className="modal">
          <div className="modal-head">
            <h2 style={{ fontSize: 19 }}>Empresa creada</h2>
          </div>
          <div className="modal-body">
            <p style={{ fontSize: 13.5, marginBottom: 14 }}>
              Entrega estos datos al administrador de la empresa. La contraseña no se vuelve a mostrar.
            </p>
            <div className="mono" style={{ fontSize: 13, lineHeight: 1.9, background: 'var(--paper)', padding: 14, border: '1px solid var(--line)' }}>
              {url && <div>Dirección: {url}</div>}
              <div>Subdominio: {creada.subdominio}</div>
              <div>Correo: {creada.email}</div>
              <div>Contraseña: {creada.password}</div>
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-primary" onClick={onSaved}>
              Listo
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2 style={{ fontSize: 19 }}>{esEdicion ? `Editar ${empresa.subdominio}` : 'Nueva empresa'}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}
            {aviso && <p className="mono" style={{ fontSize: 12, color: 'var(--seal-green)', marginBottom: 10 }}>{aviso}</p>}

            {!esEdicion && (
              <div className="field">
                <label>Subdominio</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="text"
                    value={subdominio}
                    onChange={(e) => setSubdominio(limpiarSubdominio(e.target.value))}
                    placeholder="acme"
                    required
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    .{dominioBase || 'tudominio.com'}
                  </span>
                </div>
                <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                  Minúsculas, números y guiones. No se puede cambiar después.
                </p>
              </div>
            )}

            <div className="field">
              <label>Nombre de la empresa</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>

            {!esEdicion && (
              <>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.04em' }}>
                  PRIMER ADMINISTRADOR
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Nombre</label>
                    <input type="text" value={adminNombre} onChange={(e) => setAdminNombre(e.target.value)} required />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Correo</label>
                    <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="field">
                  <label>Contraseña inicial</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      minLength={8}
                      required
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn-ghost" onClick={() => setAdminPassword(generarPassword())}>
                      Generar
                    </button>
                  </div>
                </div>
                <div className="field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={catalogoEjemplo} onChange={(e) => setCatalogoEjemplo(e.target.checked)} />
                    Cargar el catálogo de ejemplo (10 tipos de trámite genéricos)
                  </label>
                </div>
              </>
            )}

            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.04em' }}>
              MARCA (OPCIONAL)
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Nombre de la app</label>
                <input type="text" value={nombreApp} onChange={(e) => setNombreApp(e.target.value)} placeholder="Expediente" />
              </div>
              <div className="field" style={{ width: 120 }}>
                <label>Color</label>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={color || COLOR_POR_DEFECTO}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ width: 44, height: 34, padding: 0 }}
                  />
                  {color && (
                    <button type="button" className="btn-ghost" style={{ fontSize: 10, padding: '3px 6px' }} onClick={() => setColor('')}>
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="field">
              <label>Eslogan</label>
              <input type="text" value={eslogan} onChange={(e) => setEslogan(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>URL del logo</label>
                <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Correo(s) para alertas</label>
                <input
                  type="email"
                  multiple
                  value={correoAlertas}
                  onChange={(e) => setCorreoAlertas(e.target.value)}
                  placeholder="uno@empresa.com, otro@empresa.com"
                />
                {esEdicion && (
                  <button type="button" className="btn-ghost" style={{ fontSize: 10.5, padding: '3px 8px', marginTop: 6 }} onClick={handlePrueba}>
                    Enviar correo de prueba
                  </button>
                )}
              </div>
            </div>

            {esEdicion && (
              <>
                <div className="field">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                    Empresa activa
                  </label>
                  {!activo && (
                    <p className="mono" style={{ fontSize: 10.5, color: 'var(--seal-red)', marginTop: 4 }}>
                      Desactivada: nadie de esta empresa puede entrar y dejan de enviarse sus alertas. Los datos se conservan.
                    </p>
                  )}
                </div>

                <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)', margin: '16px 0 6px', letterSpacing: '0.04em' }}>
                  RESTABLECER CONTRASEÑA DE UN USUARIO
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                  <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Correo del usuario</label>
                    <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} />
                  </div>
                  <div className="field" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Nueva contraseña</label>
                    <input type="text" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} minLength={8} />
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setResetPassword(generarPassword())}
                    title="Generar una contraseña"
                  >
                    Generar
                  </button>
                  <button type="button" className="btn-primary" disabled={!resetEmail || resetPassword.length < 8} onClick={handleReset}>
                    Cambiar
                  </button>
                </div>
              </>
            )}
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Plataforma() {
  const navigate = useNavigate()
  const { dominio_base: dominioBase } = useConfig()
  const [empresas, setEmpresas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) // null | 'nueva' | empresa

  function cargar() {
    setLoading(true)
    setError('')
    getEmpresasPlataforma()
      .then(setEmpresas)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (plataformaAutenticada()) cargar()
  }, [])

  if (!plataformaAutenticada()) return <Navigate to="/plataforma/login" replace />

  function salir() {
    plataformaLogout()
    navigate('/plataforma/login')
  }

  async function alternarActivo(e) {
    try {
      await editarEmpresaPlataforma(e.subdominio, { activo: !e.activo })
      cargar()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="brand">
          <Marca />
        </div>
        <div className="nav-group" style={{ marginBottom: 26 }}>
          <div className="nav-item" style={{ background: 'rgba(255,255,255,0.06)', color: '#f2f5ef' }}>
            Empresas
          </div>
        </div>
        <div className="nav-user">
          <div>Administrador de plataforma</div>
          <button onClick={salir}>Cerrar sesión</button>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <div>
            <div className="eyebrow">Plataforma · mantenimiento</div>
            <h1 style={{ fontSize: 26 }}>Empresas y subdominios</h1>
          </div>
          <div className="topbar-actions">
            <button className="btn-primary" onClick={() => setModal('nueva')}>
              + Nueva empresa
            </button>
          </div>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
        {loading && <div className="loading">Cargando...</div>}

        {!loading && (
          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <div className="t-head" style={{ minWidth: 860, gridTemplateColumns: COLUMNAS }}>
              <span>SUBDOMINIO</span>
              <span>EMPRESA</span>
              <span>USUARIOS</span>
              <span>TRÁMITES</span>
              <span>ESTADO</span>
              <span>ACCIONES</span>
            </div>
            {empresas.length === 0 && (
              <div className="empty-state">Todavía no hay empresas. Crea la primera con "+ Nueva empresa".</div>
            )}
            {empresas.map((e) => {
              const url = urlEmpresa(e.subdominio, dominioBase)
              return (
                <div key={e.subdominio} className="t-row" style={{ minWidth: 860, gridTemplateColumns: COLUMNAS, cursor: 'default' }}>
                  <div>
                    <div className="co">{e.subdominio}</div>
                    {url && (
                      <a className="co-sub" href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--seal-green)' }}>
                        abrir ↗
                      </a>
                    )}
                  </div>
                  <div>
                    {e.nombre}
                    {e.color_primario && (
                      <span
                        title={e.color_primario}
                        style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: e.color_primario, marginLeft: 8 }}
                      />
                    )}
                  </div>
                  <div className="mono" style={{ fontSize: 12 }}>{e.usuarios ?? '—'}</div>
                  <div className="mono" style={{ fontSize: 12 }}>{e.tramites ?? '—'}</div>
                  <div>
                    <span className="mono" style={{ fontSize: 10.5, color: e.activo ? 'var(--seal-green)' : 'var(--seal-red)' }}>
                      {e.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => setModal(e)}>
                      Editar
                    </button>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => alternarActivo(e)}>
                      {e.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {modal && (
        <EmpresaModal
          empresa={modal === 'nueva' ? null : modal}
          dominioBase={dominioBase}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null)
            cargar()
          }}
        />
      )}
    </div>
  )
}
