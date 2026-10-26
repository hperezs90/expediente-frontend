import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import NuevaEmpresaModal from '../components/NuevaEmpresaModal.jsx'
import { getEmpresas } from '../api.js'
import { useUser } from '../context/UserContext.jsx'

const PAGE_SIZE = 50

export default function Empresas() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [empresas, setEmpresas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hayMas, setHayMas] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)

  function cargar(q, reemplazar) {
    setLoading(true)
    const offset = reemplazar ? 0 : empresas.length
    getEmpresas(q, PAGE_SIZE, offset)
      .then((data) => {
        setEmpresas(reemplazar ? data : (prev) => [...prev, ...data])
        setHayMas(data.length === PAGE_SIZE)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timeout = setTimeout(() => cargar(busqueda, true), 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda])

  return (
    <div className="shell">
      <Sidebar active="empresas" />
      <main className="main">
        <div className="topbar">
          <div>
            <div className="eyebrow">{user?.organizacion_nombre} · cartera de clientes</div>
            <h1 style={{ fontSize: 26 }}>Empresas</h1>
          </div>
          <div className="topbar-actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div className="search">
              <input
                type="text"
                placeholder="Buscar empresa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            {user?.rol === 'admin' && (
              <button className="btn-primary" onClick={() => setMostrarModal(true)}>
                + Nueva empresa
              </button>
            )}
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="table-wrap">
          <div className="t-head" style={{ gridTemplateColumns: '2fr 1.2fr 1.2fr' }}>
            <span>EMPRESA</span>
            <span>CONTACTO</span>
            <span>TELÉFONO</span>
          </div>

          {empresas.length === 0 && !loading && (
            <div className="empty-state">
              {user?.rol === 'gestor'
                ? 'Todavía no tienes ninguna empresa asignada — pídele a un admin que te asigne alguna.'
                : 'No se encontraron empresas.'}
            </div>
          )}

          {empresas.map((e) => (
            <div
              key={e.id}
              className="t-row"
              style={{ gridTemplateColumns: '2fr 1.2fr 1.2fr' }}
              onClick={() => navigate(`/empresas/${e.id}`)}
            >
              <div>
                <div className="co">{e.nombre}</div>
                {e.nit && <div className="co-sub">ID fiscal {e.nit}</div>}
              </div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                {e.contacto_email || '—'}
              </div>
              <div className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                {e.contacto_telefono || '—'}
              </div>
            </div>
          ))}
        </div>

        {loading && <div className="loading">Cargando...</div>}

        {hayMas && !loading && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button className="btn-ghost" onClick={() => cargar(busqueda, false)}>
              Cargar más
            </button>
          </div>
        )}
      </main>

      {mostrarModal && (
        <NuevaEmpresaModal
          onClose={() => setMostrarModal(false)}
          onCreated={(empresa) => {
            setMostrarModal(false)
            navigate(`/empresas/${empresa.id}`)
          }}
        />
      )}
    </div>
  )
}
