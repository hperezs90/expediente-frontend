import { useRef, useState } from 'react'
import { renovarTramite } from '../api.js'

// Renovación en un clic: crea el trámite nuevo a partir de uno existente.
export default function RenovarModal({ tramiteNombre, tramiteId, onClose, onRenovado }) {
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().slice(0, 10))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const enviando = useRef(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (enviando.current) return
    enviando.current = true
    setSaving(true)
    setError('')
    try {
      const nuevo = await renovarTramite(tramiteId, { fecha_inicio: fechaInicio })
      onRenovado(nuevo)
    } catch (err) {
      setError(err.message || 'No se pudo crear la renovación')
    } finally {
      enviando.current = false
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <h2 style={{ fontSize: 19 }}>Renovar trámite</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}
            <p style={{ fontSize: 13.5, marginBottom: 14 }}>
              Se crea un trámite nuevo de <strong>{tramiteNombre}</strong> con la misma empresa, gestor,
              descripción y N° de registro, y con el checklist en blanco. El trámite actual queda como
              "Renovación en curso" y no se modifica nada más.
            </p>
            <div className="field">
              <label>Fecha de inicio de la renovación</label>
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required />
            </div>
          </div>
          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear renovación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
