import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import NuevoTramiteModal from '../components/NuevoTramiteModal.jsx'
import EditarTramiteModal from '../components/EditarTramiteModal.jsx'
import GestoresAsignados from '../components/GestoresAsignados.jsx'
import { getEmpresa, getTramitesDeEmpresa, getAuditoriaEmpresa } from '../api.js'
import { tagClass, categoriaLabel, formatFecha, diasRestantes, estadoUrgencia, etiquetaCampo, puedeRenovar } from '../utils.js'
import { useUser } from '../context/UserContext.jsx'
import { useConfig } from '../context/ConfigContext.jsx'
import RenovarModal from '../components/RenovarModal.jsx'

export default function EmpresaDetail() {
  const { id } = useParams()
  const { user } = useUser()
  const { ventana_renovacion_dias: ventanaRenovacion } = useConfig()
  const [renovando, setRenovando] = useState(null)
  const [empresa, setEmpresa] = useState(null)
  const [tramites, setTramites] = useState([])
  const [auditoria, setAuditoria] = useState([])
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mostrarModal, setMostrarModal] = useState(false)
  const [tramiteEditando, setTramiteEditando] = useState(null)

  function cargar() {
    setLoading(true)
    Promise.all([getEmpresa(id), getTramitesDeEmpresa(id)])
      .then(([e, t]) => {
        setEmpresa(e)
        setTramites(t)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
    getAuditoriaEmpresa(id)
      .then(setAuditoria)
      .catch(() => setAuditoria([]))
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // "Por vencer" se calcula con la fecha real (<=30 días o ya vencido), no con el campo
  // "estado" (que se pone a mano y no cambia solo con el paso de los días).
  const porVencer = tramites.filter((t) => {
    const dias = diasRestantes(t.fecha_vencimiento)
    return dias !== null && dias <= 30
  }).length
  const vigentes = tramites.length - porVencer

  return (
    <div className="shell">
      <Sidebar active="dashboard" />
      <main className="main">
        <Link to="/" className="crumb">
          Dashboard <span style={{ color: 'var(--line)' }}>/</span>{' '}
          <span style={{ color: 'var(--ink)' }}>{empresa?.nombre || '...'}</span>
        </Link>

        {loading && <div className="loading">Cargando...</div>}
        {error && <div className="error-msg">{error}</div>}

        {!loading && !error && empresa && (
          <>
            <div className="co-head">
              <div>
                <h1 style={{ fontSize: 26, marginBottom: 6 }}>{empresa.nombre}</h1>
                <div className="co-meta">
                  {empresa.nit && <span>ID fiscal {empresa.nit}</span>}
                  {empresa.contacto_email && <span>{empresa.contacto_email}</span>}
                  {empresa.contacto_telefono && <span>{empresa.contacto_telefono}</span>}
                </div>
              </div>
              <button className="btn-primary" onClick={() => setMostrarModal(true)}>
                + Nuevo trámite
              </button>
            </div>

            <div className="stats">
              <div className="stat">
                <div className="lbl">Trámites totales</div>
                <div className="val">{tramites.length}</div>
              </div>
              <div className="stat ok">
                <div className="lbl">Vigentes / en trámite</div>
                <div className="val">{vigentes}</div>
              </div>
              <div className="stat crit">
                <div className="lbl">Por vencer / vencidos</div>
                <div className="val">{porVencer}</div>
              </div>
            </div>

            {user?.rol === 'admin' && (
              <>
                <div className="section-label">Gestores asignados</div>
                <div style={{ marginBottom: 28 }}>
                  <GestoresAsignados empresaId={id} />
                </div>
              </>
            )}

            <div className="section-label">Historial de trámites</div>
            <div className="table-wrap">
              <div className="t-head" style={{ gridTemplateColumns: '1.8fr 0.9fr 0.9fr 1fr' }}>
                <span>TRÁMITE</span>
                <span>CATEGORÍA</span>
                <span>ESTADO</span>
                <span>ASIGNADO A</span>
              </div>

              {tramites.length === 0 && (
                <div className="empty-state">
                  Esta empresa todavía no tiene trámites registrados. Crea el primero con "+ Nuevo trámite".
                </div>
              )}

              {tramites.map((t) => {
                const dias = diasRestantes(t.fecha_vencimiento)
                const urgencia = estadoUrgencia(dias)
                return (
                  <div
                    key={t.id}
                    className="t-row"
                    style={{ gridTemplateColumns: '1.8fr 0.9fr 0.9fr 1fr' }}
                    onClick={() => setTramiteEditando(t)}
                  >
                    <div>
                      <div className="co">{t.tramite_nombre}</div>
                      {t.numero_expediente && <div className="co-sub">{t.numero_expediente}</div>}
                      {t.descripcion && <div className="co-sub" style={{ fontStyle: 'italic' }}>{t.descripcion}</div>}
                      {t.estatus_calculado && (
                        <div className="mono" style={{ fontSize: 10, color: 'var(--brass)', marginTop: 2 }}>
                          {t.estatus_calculado}
                        </div>
                      )}
                    </div>
                    <div>
                      <span className={tagClass(t.categoria)}>{categoriaLabel(t.categoria)}</span>
                    </div>
                    <div>
                      {t.renovado_por_id ? (
                        <>
                          <span className="tag tag-c0">Renovado</span>
                          <div className="co-sub">{formatFecha(t.fecha_vencimiento)}</div>
                        </>
                      ) : t.fecha_vencimiento ? (
                        <>
                          <span className={`days ${urgencia.clase}`}>{urgencia.texto}</span>
                          <div className="co-sub">{formatFecha(t.fecha_vencimiento)}</div>
                        </>
                      ) : (
                        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                          Sin vencimiento
                        </span>
                      )}
                      {t.renueva_a_id && <div className="co-sub">es una renovación</div>}
                      {puedeRenovar({
                        fecha_vencimiento: t.fecha_vencimiento,
                        renovado: !!t.renovado_por_id,
                        estatus: t.estatus_calculado,
                        ventanaDias: ventanaRenovacion,
                      }) && (
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ fontSize: 10.5, padding: '2px 8px', marginTop: 4 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setRenovando(t)
                          }}
                        >
                          Renovar
                        </button>
                      )}
                    </div>
                    <div className="mono" style={{ fontSize: 12 }}>
                      <div style={{ color: t.asignado_a_nombre ? 'var(--ink)' : 'var(--ink-soft)' }}>
                        {t.asignado_a_nombre || 'Sin asignar'}
                      </div>
                      {t.creado_por_nombre && (
                        <div className="co-sub">creado por {t.creado_por_nombre}</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              onClick={() => setMostrarHistorial(!mostrarHistorial)}
              className="mono"
              style={{ fontSize: 11.5, color: 'var(--ink-soft)', cursor: 'pointer', marginTop: 20 }}
            >
              {mostrarHistorial ? '▾' : '▸'} Historial de la empresa ({auditoria.length})
            </div>

            {mostrarHistorial && (
              <div style={{ marginTop: 10, maxWidth: 640 }}>
                {auditoria.length === 0 && (
                  <p className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    Sin cambios registrados todavía.
                  </p>
                )}
                {auditoria.map((a, idx) => (
                  <div key={idx} style={{ fontSize: 12.5, marginBottom: 12, paddingBottom: 12, borderBottom: '1px dashed var(--line-soft)' }}>
                    <div>
                      {a.campo === 'eliminado' ? (
                        <span style={{ color: 'var(--seal-red)' }}>
                          <strong>{a.tramite_nombre}</strong> — trámite eliminado
                        </span>
                      ) : (
                        <>
                          <strong>{a.tramite_nombre}</strong> — {etiquetaCampo(a.campo)}:{' '}
                          {a.valor_anterior || '(vacío)'} → {a.valor_nuevo || '(vacío)'}
                        </>
                      )}
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>
                      {a.usuario_nombre || 'Alguien'} · {new Date(a.creado_en).toLocaleString('es')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {renovando && (
        <RenovarModal
          tramiteId={renovando.id}
          tramiteNombre={renovando.tramite_nombre}
          onClose={() => setRenovando(null)}
          onRenovado={() => {
            setRenovando(null)
            cargar()
          }}
        />
      )}

      {mostrarModal && (
        <NuevoTramiteModal
          empresaId={id}
          onClose={() => setMostrarModal(false)}
          onCreated={() => {
            setMostrarModal(false)
            cargar()
          }}
        />
      )}

      {tramiteEditando && (
        <EditarTramiteModal
          tramite={tramiteEditando}
          onClose={() => setTramiteEditando(null)}
          onUpdated={() => {
            setTramiteEditando(null)
            cargar()
          }}
          onDeleted={() => {
            setTramiteEditando(null)
            cargar()
          }}
        />
      )}
    </div>
  )
}
