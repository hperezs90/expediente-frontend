import { useState } from 'react'
import { createObservacion, updateObservacion, deleteObservacion } from '../api.js'
import { useUser } from '../context/UserContext.jsx'
import { useConfig } from '../context/ConfigContext.jsx'
import { sumarMeses } from '../utils.js'
import DocumentosSection from './DocumentosSection.jsx'

function ObservacionCard({ observacion, tramite, onChange }) {
  const { user } = useUser()
  const { plazo_observacion_meses: plazoMeses } = useConfig()
  const [fechaEmision, setFechaEmision] = useState(observacion.fecha_emision || '')
  const [motivo, setMotivo] = useState(observacion.motivo || '')
  const [fechaVencimiento, setFechaVencimiento] = useState(observacion.fecha_vencimiento || '')
  const [vencimientoManual, setVencimientoManual] = useState(!!observacion.fecha_vencimiento)
  const [fechaRespuesta, setFechaRespuesta] = useState(observacion.fecha_respuesta || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function guardar() {
    setSaving(true)
    setError('')
    try {
      const actualizado = await updateObservacion(observacion.id, {
        fecha_emision: fechaEmision || null,
        motivo: motivo || null,
        fecha_vencimiento: fechaVencimiento || null,
        fecha_respuesta: fechaRespuesta || null,
      })
      onChange(actualizado)
    } catch (err) {
      setError(err.message || 'No se pudo guardar la observación')
    } finally {
      setSaving(false)
    }
  }

  async function borrar() {
    setSaving(true)
    try {
      const actualizado = await deleteObservacion(observacion.id)
      onChange(actualizado)
    } catch (err) {
      setError(err.message || 'No se pudo borrar la observación')
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        border: '1px solid var(--line)',
        borderRadius: 3,
        padding: 16,
        marginBottom: 12,
        background: 'var(--paper)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span className="mono" style={{ fontSize: 11.5, letterSpacing: '0.06em', color: 'var(--seal-red)' }}>
          OBSERVACIÓN N° {observacion.numero}
        </span>
        {user?.rol === 'admin' && (
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: 10.5, padding: '3px 8px', color: 'var(--seal-red)', borderColor: 'var(--seal-red)' }}
            onClick={borrar}
            disabled={saving}
          >
            Borrar
          </button>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Fecha de emisión</label>
          <input
            type="date"
            value={fechaEmision}
            onChange={(e) => {
              const nuevaFecha = e.target.value
              setFechaEmision(nuevaFecha)
              if (!vencimientoManual) {
                setFechaVencimiento(sumarMeses(nuevaFecha, plazoMeses))
              }
            }}
          />
        </div>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Plazo para responder</label>
          <input
            type="date"
            value={fechaVencimiento}
            onChange={(e) => {
              setVencimientoManual(true)
              setFechaVencimiento(e.target.value)
            }}
          />
        </div>
        <div className="field" style={{ flex: 1, marginBottom: 0 }}>
          <label>Fecha de respuesta</label>
          <input type="date" value={fechaRespuesta} onChange={(e) => setFechaRespuesta(e.target.value)} />
        </div>
      </div>
      {!vencimientoManual && fechaEmision && (
        <p className="mono" style={{ fontSize: 10.5, color: 'var(--seal-green)', margin: '-6px 0 10px' }}>
          Calculado automáticamente: {plazoMeses} {plazoMeses === 1 ? 'mes' : 'meses'} desde la emisión
        </p>
      )}

      <div className="field" style={{ marginBottom: 10 }}>
        <label>Motivo</label>
        <textarea rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} style={{ resize: 'none' }} />
      </div>

      <DocumentosSection
        tramite={tramite}
        tipo="observacion"
        observacionId={observacion.id}
        label="Documento de la observación"
        onChange={onChange}
      />

      <button type="button" className="btn-primary" style={{ fontSize: 11.5, padding: '7px 14px' }} onClick={guardar} disabled={saving}>
        {saving ? 'Guardando...' : 'Guardar observación'}
      </button>
    </div>
  )
}

export default function ObservacionesSection({ tramite, onChange }) {
  const [agregando, setAgregando] = useState(false)
  const [error, setError] = useState('')
  const observaciones = tramite.observaciones || []

  async function agregar() {
    setAgregando(true)
    setError('')
    try {
      const actualizado = await createObservacion(tramite.id, {})
      onChange(actualizado)
    } catch (err) {
      setError(err.message || 'No se pudo agregar la observación')
    } finally {
      setAgregando(false)
    }
  }

  return (
    <div className="field">
      <label>Observaciones de la entidad ({observaciones.length})</label>
      {error && <div className="error-msg">{error}</div>}
      {observaciones.map((o) => (
        <ObservacionCard key={o.id} observacion={o} tramite={tramite} onChange={onChange} />
      ))}
      <button type="button" className="btn-ghost" style={{ fontSize: 12 }} onClick={agregar} disabled={agregando}>
        {agregando ? 'Agregando...' : `+ Registrar observación N° ${observaciones.length + 1}`}
      </button>
    </div>
  )
}
