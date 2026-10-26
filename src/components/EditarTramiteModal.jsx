import { useEffect, useRef, useState } from 'react'
import { updateTramite, deleteTramite, getGestores, getAuditoriaTramite } from '../api.js'
import { categoriaLabel, etiquetaCampo, sumarMeses } from '../utils.js'
import { useUser } from '../context/UserContext.jsx'
import ObservacionesSection from './ObservacionesSection.jsx'
import DocumentosSection from './DocumentosSection.jsx'

const ESTADOS = ['en_tramite', 'vigente', 'por_vencer', 'vencido', 'renovacion_en_curso']

const ESTADO_LABELS = {
  en_tramite: 'En trámite',
  vigente: 'Vigente',
  por_vencer: 'Por vencer',
  vencido: 'Vencido',
  renovacion_en_curso: 'Renovación en curso',
}

const RESOLUCIONES = ['aprobado', 'rechazado', 'finalizado', 'pendiente']
const RESOLUCION_LABELS = {
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  finalizado: 'Finalizado',
  pendiente: 'Pendiente',
}

function formatearValorAuditoria(campo, valor) {
  if (!valor || valor === 'None') return '(vacío)'
  if (campo === 'estado') return ESTADO_LABELS[valor] || valor
  if (campo === 'resolucion_final') return RESOLUCION_LABELS[valor] || valor
  return valor
}

const SUBTITULO = { fontSize: 10.5, color: 'var(--ink-soft)', marginBottom: 6, letterSpacing: '0.04em' }

export default function EditarTramiteModal({ tramite: tramiteInicial, onClose, onUpdated, onDeleted }) {
  const { user } = useUser()
  const [tramite, setTramite] = useState(tramiteInicial)
  const [numeroExpediente, setNumeroExpediente] = useState(tramite.numero_expediente || '')
  const [descripcion, setDescripcion] = useState(tramite.descripcion || '')
  const [numeroRegistro, setNumeroRegistro] = useState(tramite.numero_registro || '')
  const [fechaInicio, setFechaInicio] = useState(tramite.fecha_inicio)
  const [fechaVencimiento, setFechaVencimiento] = useState(tramite.fecha_vencimiento || '')
  const [estado, setEstado] = useState(tramite.estado)
  const [checklist, setChecklist] = useState(tramite.checklist || [])
  const [gestores, setGestores] = useState([])
  const [asignadoA, setAsignadoA] = useState(tramite.asignado_a || '')
  const [etapasFechas, setEtapasFechas] = useState(tramite.etapas_fechas || {})
  const [resolucionFinal, setResolucionFinal] = useState(tramite.resolucion_final || '')
  const [fechaAprobacion, setFechaAprobacion] = useState(tramite.fecha_aprobacion || '')
  const [anticipo, setAnticipo] = useState(tramite.anticipo || '')
  const [complemento, setComplemento] = useState(tramite.complemento || '')
  const [vencimientoManual, setVencimientoManual] = useState(!!tramite.fecha_vencimiento)
  const [auditoria, setAuditoria] = useState([])
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)
  const [error, setError] = useState('')
  const enviando = useRef(false)

  const etapas = tramite.etapas || []
  const vigenciaDesdeAprobacion = tramite.vigencia_desde !== 'inicio' && !!tramite.vigencia_meses

  useEffect(() => {
    getGestores()
      .then(setGestores)
      .catch(() => setGestores([]))
    getAuditoriaTramite(tramite.id)
      .then(setAuditoria)
      .catch(() => setAuditoria([]))
  }, [tramite.id])

  function toggleChecklistItem(idx) {
    setChecklist((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, completado: !item.completado } : item))
    )
  }

  function cambiarFechaAprobacion(nuevaFecha) {
    setFechaAprobacion(nuevaFecha)
    if (vigenciaDesdeAprobacion && !vencimientoManual && nuevaFecha) {
      setFechaVencimiento(sumarMeses(nuevaFecha, tramite.vigencia_meses))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (enviando.current) return
    enviando.current = true
    setError('')
    setSaving(true)
    try {
      const actualizado = await updateTramite(tramite.id, {
        numero_expediente: numeroExpediente || null,
        descripcion: descripcion || null,
        numero_registro: numeroRegistro || null,
        fecha_inicio: fechaInicio,
        fecha_vencimiento: fechaVencimiento || null,
        estado,
        checklist,
        asignado_a: asignadoA || null,
        etapas_fechas: etapasFechas,
        resolucion_final: resolucionFinal || null,
        fecha_aprobacion: fechaAprobacion || null,
        anticipo: anticipo || null,
        complemento: complemento || null,
      })
      setTramite(actualizado)
      setFechaVencimiento(actualizado.fecha_vencimiento || '')
      onUpdated()
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el trámite')
    } finally {
      enviando.current = false
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteTramite(tramite.id)
      onDeleted()
    } catch (err) {
      setError(err.message || 'No se pudo borrar el trámite')
      setDeleting(false)
    }
  }

  const estatus = tramite.estatus_calculado
  const colorEstatus =
    estatus === 'RECHAZADO'
      ? { background: 'rgba(162,51,40,0.12)', color: 'var(--seal-red)' }
      : estatus === 'APROBADO' || estatus === 'FINALIZADO'
      ? { background: 'rgba(46,107,76,0.12)', color: 'var(--seal-green)' }
      : { background: 'rgba(173,138,61,0.16)', color: 'var(--brass)' }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2 style={{ fontSize: 19 }}>{tramite.tramite_nombre}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
                {categoriaLabel(tramite.categoria)}
              </span>
              {estatus && (
                <span
                  className="mono"
                  style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 2, letterSpacing: '0.03em', ...colorEstatus }}
                >
                  {estatus}
                </span>
              )}
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}

            <div className="field">
              <label>Estado</label>
              <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                {ESTADOS.map((e) => (
                  <option key={e} value={e}>
                    {ESTADO_LABELS[e]}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>N° de expediente</label>
              <input type="text" value={numeroExpediente} onChange={(e) => setNumeroExpediente(e.target.value)} />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Descripción (producto, sede, equipo...)</label>
                <input type="text" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>N° de registro / licencia</label>
                <input type="text" value={numeroRegistro} onChange={(e) => setNumeroRegistro(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label>Asignado a</label>
              <select value={asignadoA} onChange={(e) => setAsignadoA(e.target.value)}>
                <option value="">Sin asignar</option>
                {gestores.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre} ({g.rol})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Fecha de inicio</label>
                <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Fecha de vencimiento</label>
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => {
                    setVencimientoManual(true)
                    setFechaVencimiento(e.target.value)
                  }}
                />
              </div>
            </div>

            {etapas.length > 0 && (
              <>
                <div className="mono" style={SUBTITULO}>
                  ETAPAS DEL FLUJO
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                  {etapas.map((etapa) => (
                    <div key={etapa} className="field" style={{ flex: '1 1 30%' }}>
                      <label>{etapa}</label>
                      <input
                        type="date"
                        value={etapasFechas[etapa] || ''}
                        onChange={(e) => setEtapasFechas((prev) => ({ ...prev, [etapa]: e.target.value || null }))}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mono" style={SUBTITULO}>
              RESOLUCIÓN
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Resolución final</label>
                <select value={resolucionFinal} onChange={(e) => setResolucionFinal(e.target.value)}>
                  <option value="">Sin resolución todavía</option>
                  {RESOLUCIONES.map((r) => (
                    <option key={r} value={r}>
                      {RESOLUCION_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Fecha de aprobación</label>
                <input type="date" value={fechaAprobacion} onChange={(e) => cambiarFechaAprobacion(e.target.value)} />
              </div>
            </div>
            {vigenciaDesdeAprobacion && !vencimientoManual && fechaAprobacion ? (
              <p className="mono" style={{ fontSize: 10.5, color: 'var(--seal-green)', margin: '-6px 0 10px' }}>
                Vencimiento calculado arriba: {tramite.vigencia_meses} meses de vigencia desde la aprobación
              </p>
            ) : vigenciaDesdeAprobacion && resolucionFinal === 'aprobado' && fechaAprobacion && !fechaVencimiento ? (
              <p className="mono" style={{ fontSize: 10.5, color: 'var(--seal-green)', margin: '-6px 0 10px' }}>
                Al guardar, el vencimiento se calcula desde esta fecha según la vigencia del catálogo
              </p>
            ) : null}

            <ObservacionesSection tramite={tramite} onChange={(actualizado) => setTramite(actualizado)} />

            <div className="mono" style={SUBTITULO}>
              PAGOS
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Anticipo</label>
                <textarea
                  rows={2}
                  value={anticipo}
                  onChange={(e) => setAnticipo(e.target.value)}
                  style={{ resize: 'none' }}
                  placeholder="Ej. 500.00, depósito 138871"
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Complemento</label>
                <textarea
                  rows={2}
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  style={{ resize: 'none' }}
                  placeholder="Ej. Saldo 250.00, pendiente de cobro"
                />
              </div>
            </div>

            <div className="mono" style={SUBTITULO}>
              DOCUMENTOS
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
              <div style={{ flex: 1 }}>
                <DocumentosSection
                  tramite={tramite}
                  tipo="ingreso"
                  label="Comprobante de ingreso"
                  onChange={(actualizado) => setTramite(actualizado)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <DocumentosSection
                  tramite={tramite}
                  tipo="resolucion"
                  label="Resolución / documento aprobado"
                  onChange={(actualizado) => setTramite(actualizado)}
                />
              </div>
            </div>

            {checklist.length > 0 && (
              <div className="field">
                <label>Checklist de documentos</label>
                <div className="checklist">
                  {checklist.map((item, idx) => (
                    <div key={idx} className="check-item" onClick={() => toggleChecklistItem(idx)}>
                      <div className={`check-box ${item.completado ? 'done' : ''}`}>
                        {item.completado ? '✓' : ''}
                      </div>
                      <span style={{ color: item.completado ? 'var(--ink)' : 'var(--ink-soft)' }}>
                        {item.item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              onClick={() => setMostrarHistorial(!mostrarHistorial)}
              className="mono"
              style={{ fontSize: 11.5, color: 'var(--ink-soft)', cursor: 'pointer', marginTop: 4 }}
            >
              {mostrarHistorial ? '▾' : '▸'} Historial de cambios ({auditoria.length})
            </div>

            {mostrarHistorial && (
              <div style={{ marginTop: 10, borderTop: '1px dashed var(--line-soft)', paddingTop: 10 }}>
                {auditoria.length === 0 && (
                  <p className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                    Sin cambios registrados todavía.
                  </p>
                )}
                {auditoria.map((a, idx) => (
                  <div key={idx} style={{ fontSize: 12.5, marginBottom: 10 }}>
                    <div>
                      <strong>{etiquetaCampo(a.campo)}</strong>:{' '}
                      {formatearValorAuditoria(a.campo, a.valor_anterior)} →{' '}
                      {formatearValorAuditoria(a.campo, a.valor_nuevo)}
                    </div>
                    <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)' }}>
                      {a.usuario_nombre || 'Alguien'} · {new Date(a.creado_en).toLocaleString('es')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-foot" style={{ justifyContent: 'space-between' }}>
            {user?.rol !== 'admin' ? (
              <span />
            ) : !confirmarBorrado ? (
              <button
                type="button"
                className="btn-ghost"
                style={{ color: 'var(--seal-red)', borderColor: 'var(--seal-red)' }}
                onClick={() => setConfirmarBorrado(true)}
              >
                Borrar trámite
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--seal-red)' }}>¿Seguro?</span>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ color: 'var(--seal-red)', borderColor: 'var(--seal-red)' }}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Borrando...' : 'Sí, borrar'}
                </button>
                <button type="button" className="btn-ghost" onClick={() => setConfirmarBorrado(false)}>
                  Cancelar
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={onClose}>
                Cerrar
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
