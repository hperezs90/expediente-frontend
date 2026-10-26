import { useEffect, useRef, useState } from 'react'
import { getTiposTramite, createTramite, getGestores, getEmpresas } from '../api.js'
import { categoriaLabel } from '../utils.js'

export default function NuevoTramiteModal({ empresaId = null, onClose, onCreated }) {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(
    empresaId ? { id: empresaId } : null
  )
  const [busquedaEmpresa, setBusquedaEmpresa] = useState('')
  const [resultadosEmpresa, setResultadosEmpresa] = useState([])
  const [categoria, setCategoria] = useState('')
  const [todosLosTipos, setTodosLosTipos] = useState([])
  const [tipoId, setTipoId] = useState('')
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10))
  const [numeroExpediente, setNumeroExpediente] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [numeroRegistro, setNumeroRegistro] = useState('')
  const [notas, setNotas] = useState('')
  const [gestores, setGestores] = useState([])
  const [asignadoA, setAsignadoA] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const enviando = useRef(false)

  useEffect(() => {
    getGestores()
      .then(setGestores)
      .catch(() => setGestores([]))
  }, [])

  useEffect(() => {
    getTiposTramite()
      .then((data) => {
        setTodosLosTipos(data)
        setCategoria(data[0]?.categoria || '')
      })
      .catch(() => setTodosLosTipos([]))
  }, [])

  const categorias = [...new Set(todosLosTipos.map((t) => t.categoria))].sort()
  const tipos = todosLosTipos.filter((t) => t.categoria === categoria)

  useEffect(() => {
    setTipoId(tipos[0]?.id || '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, todosLosTipos])

  useEffect(() => {
    if (empresaId || !busquedaEmpresa.trim()) {
      setResultadosEmpresa([])
      return
    }
    const timeout = setTimeout(() => {
      getEmpresas(busquedaEmpresa)
        .then(setResultadosEmpresa)
        .catch(() => setResultadosEmpresa([]))
    }, 300)
    return () => clearTimeout(timeout)
  }, [busquedaEmpresa, empresaId])

  const tipoSeleccionado = tipos.find((t) => t.id === tipoId)

  async function handleSubmit(e) {
    e.preventDefault()
    if (enviando.current) return
    enviando.current = true

    setError('')
    if (!empresaSeleccionada) {
      setError('Selecciona una empresa')
      enviando.current = false
      return
    }
    if (!tipoId) {
      setError('Selecciona un tipo de trámite')
      enviando.current = false
      return
    }
    setSaving(true)
    try {
      await createTramite({
        empresa_cliente_id: empresaSeleccionada.id,
        tipo_tramite_id: tipoId,
        fecha_inicio: fechaInicio,
        numero_expediente: numeroExpediente || null,
        notas: notas || null,
        asignado_a: asignadoA || null,
        descripcion: descripcion || null,
        numero_registro: numeroRegistro || null,
      })
      onCreated()
    } catch (err) {
      setError(err.message || 'No se pudo crear el trámite')
      enviando.current = false
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2 style={{ fontSize: 19 }}>Nuevo trámite</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}

            {!empresaId && (
              <div className="field" style={{ position: 'relative' }}>
                <label>Empresa</label>
                {empresaSeleccionada ? (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid var(--line)',
                      borderRadius: 2,
                      padding: '9px 12px',
                      background: 'var(--paper)',
                    }}
                  >
                    <span style={{ fontSize: 13.5 }}>{empresaSeleccionada.nombre}</span>
                    <button
                      type="button"
                      className="btn-ghost"
                      style={{ padding: '4px 10px', fontSize: 11 }}
                      onClick={() => {
                        setEmpresaSeleccionada(null)
                        setBusquedaEmpresa('')
                      }}
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Buscar empresa..."
                      value={busquedaEmpresa}
                      onChange={(e) => setBusquedaEmpresa(e.target.value)}
                      autoFocus
                    />
                    {resultadosEmpresa.length > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'var(--paper-card)',
                          border: '1px solid var(--line)',
                          borderRadius: 3,
                          zIndex: 10,
                          maxHeight: 200,
                          overflowY: 'auto',
                        }}
                      >
                        {resultadosEmpresa.map((e) => (
                          <div
                            key={e.id}
                            onClick={() => {
                              setEmpresaSeleccionada(e)
                              setResultadosEmpresa([])
                            }}
                            style={{ padding: '9px 12px', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid var(--line-soft)' }}
                          >
                            {e.nombre}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="field">
              <label>Categoría</label>
              <div className="filters" style={{ marginBottom: 0 }}>
                {categorias.map((c) => (
                  <div
                    key={c}
                    className={`chip ${categoria === c ? 'active' : ''}`}
                    onClick={() => setCategoria(c)}
                  >
                    {categoriaLabel(c)}
                  </div>
                ))}
              </div>
            </div>

            <div className="field">
              <label>Tipo de trámite</label>
              <select value={tipoId} onChange={(e) => setTipoId(e.target.value)}>
                {tipos.length === 0 && <option value="">No hay trámites en esta categoría</option>}
                {tipos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                    {t.tipo_gestion ? ` — ${t.tipo_gestion}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>N° de expediente (opcional)</label>
              <input
                type="text"
                value={numeroExpediente}
                onChange={(e) => setNumeroExpediente(e.target.value)}
                placeholder="Número que asigna la entidad"
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Descripción (producto, sede, equipo... opcional)</label>
                <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>N° de registro / licencia (opcional)</label>
                <input type="text" value={numeroRegistro} onChange={(e) => setNumeroRegistro(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Asignado a (opcional)</label>
              <select value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)}>
                <option value="">Sin asignar</option>
                {gestores.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre} ({g.rol})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Fecha de inicio</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </div>

            {tipoSeleccionado?.vigencia_meses ? (
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--seal-green)', marginBottom: 16 }}>
                {tipoSeleccionado.vigencia_desde === 'inicio'
                  ? `Vigencia estándar: ${tipoSeleccionado.vigencia_meses} meses, el vencimiento se calcula automáticamente desde la fecha de inicio`
                  : `Vigencia estándar: ${tipoSeleccionado.vigencia_meses} meses, contada desde la fecha de aprobación`}
              </div>
            ) : (
              <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginBottom: 16 }}>
                Este tipo de trámite no tiene vigencia fija definida en el catálogo
              </div>
            )}

            <div className="field">
              <label>Notas (opcional)</label>
              <textarea
                rows={3}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                style={{ resize: 'none' }}
              />
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear trámite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
