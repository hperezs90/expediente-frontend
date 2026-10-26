import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import CatalogoTipoModal from '../components/CatalogoTipoModal.jsx'
import { useUser } from '../context/UserContext.jsx'
import { getCatalogoTramites, deleteTipoTramite } from '../api.js'
import { tagClass, categoriaLabel } from '../utils.js'

export default function Catalogo() {
  const { user, loading: cargandoUser } = useUser()
  const [tipos, setTipos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(true)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [tipoEditando, setTipoEditando] = useState(null)

  function cargar() {
    setLoading(true)
    setError('')
    getCatalogoTramites(filtroCategoria)
      .then(setTipos)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (user?.rol === 'admin') cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filtroCategoria])

  if (!cargandoUser && user?.rol !== 'admin') {
    return <Navigate to="/" replace />
  }

  const categorias = [...new Set(tipos.map((t) => t.categoria))].sort()

  const filtrados = tipos.filter((t) => {
    if (!mostrarInactivos && !t.activo) return false
    if (busqueda && !t.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false
    return true
  })

  function abrirCrear() {
    setTipoEditando(null)
    setModalAbierto(true)
  }

  function abrirEditar(tipo) {
    setTipoEditando(tipo)
    setModalAbierto(true)
  }

  function handleGuardado() {
    setModalAbierto(false)
    setTipoEditando(null)
    cargar()
  }

  async function handleBorrar(tipo) {
    if (!window.confirm(`¿Borrar "${tipo.nombre}" del catálogo? Esto no se puede deshacer.`)) return
    setError('')
    try {
      await deleteTipoTramite(tipo.id)
      cargar()
    } catch (err) {
      setError(err.message || 'No se pudo borrar')
    }
  }

  return (
    <div className="shell">
      <Sidebar active="catalogo" />
      <main className="main">
        <div className="eyebrow">{user?.organizacion_nombre} · mantenimiento</div>
        <h1 style={{ fontSize: 26, marginBottom: 6 }}>Catálogo de trámites</h1>
        <p className="mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 26, maxWidth: 640 }}>
          Los tipos de trámite que se ofrecen al crear un expediente nuevo. Retira un tipo marcándolo
          inactivo — no se puede borrar mientras haya trámites usándolo.
        </p>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Buscar</label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Nombre del trámite..."
                style={{ width: 220 }}
              />
            </div>
            <div className="filters" style={{ marginBottom: 0 }}>
              <div className={`chip ${filtroCategoria === '' ? 'active' : ''}`} onClick={() => setFiltroCategoria('')}>
                Todas
              </div>
              {categorias.map((c) => (
                <div key={c} className={`chip ${filtroCategoria === c ? 'active' : ''}`} onClick={() => setFiltroCategoria(c)}>
                  {categoriaLabel(c)}
                </div>
              ))}
            </div>
            <label className="mono" style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: 'var(--ink-soft)' }}>
              <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} />
              Mostrar inactivos
            </label>
          </div>
          <button className="btn-primary" onClick={abrirCrear}>
            Nuevo tipo de trámite
          </button>
        </div>

        {loading && <div className="loading">Cargando...</div>}

        {!loading && (
          <div className="table-wrap" style={{ overflowX: 'auto' }}>
            <div className="t-head" style={{ minWidth: 900, gridTemplateColumns: '1.8fr 0.9fr 0.9fr 0.8fr 0.9fr 1fr' }}>
              <span>NOMBRE</span>
              <span>CATEGORÍA</span>
              <span>VIGENCIA</span>
              <span>EN USO</span>
              <span>ESTADO</span>
              <span>ACCIONES</span>
            </div>

            {filtrados.length === 0 && <div className="empty-state">No hay tipos de trámite con estos filtros.</div>}

            {filtrados.map((t) => (
              <div key={t.id} className="t-row" style={{ minWidth: 900, gridTemplateColumns: '1.8fr 0.9fr 0.9fr 0.8fr 0.9fr 1fr', cursor: 'default' }}>
                <div>
                  <div className="co">{t.nombre}</div>
                  {t.tipo_gestion && <div className="co-sub">{t.tipo_gestion}</div>}
                  {t.etapas.length > 0 && <div className="co-sub">{t.etapas.join(' → ')}</div>}
                </div>
                <div>
                  <span className={tagClass(t.categoria)}>{categoriaLabel(t.categoria)}</span>
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  {t.vigencia_meses ? `${t.vigencia_meses} meses (desde ${t.vigencia_desde === 'inicio' ? 'el inicio' : 'la aprobación'})` : '—'}
                </div>
                <div className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                  {t.tramites_asociados}
                </div>
                <div>
                  <span
                    className="mono"
                    style={{
                      fontSize: 10.5,
                      padding: '2px 8px',
                      borderRadius: 2,
                      color: t.activo ? 'var(--seal-green)' : 'var(--seal-red)',
                    }}
                  >
                    {t.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                  <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }} onClick={() => abrirEditar(t)}>
                    Editar
                  </button>
                  <button
                    className="btn-ghost"
                    style={{ fontSize: 11, padding: '5px 10px', color: 'var(--seal-red)', borderColor: 'var(--seal-red)' }}
                    onClick={() => handleBorrar(t)}
                    disabled={t.tramites_asociados > 0}
                    title={t.tramites_asociados > 0 ? 'No se puede borrar: hay trámites usándolo' : ''}
                  >
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {modalAbierto && (
          <CatalogoTipoModal tipo={tipoEditando} categoriasExistentes={categorias} onClose={() => setModalAbierto(false)} onSaved={handleGuardado} />
        )}
      </main>
    </div>
  )
}
