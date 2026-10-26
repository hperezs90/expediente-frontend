import { useRef, useState } from 'react'
import { createEmpresa } from '../api.js'

export default function NuevaEmpresaModal({ onClose, onCreated }) {
  const [nombre, setNombre] = useState('')
  const [nit, setNit] = useState('')
  const [contactoNombre, setContactoNombre] = useState('')
  const [contactoEmail, setContactoEmail] = useState('')
  const [contactoTelefono, setContactoTelefono] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const enviando = useRef(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (enviando.current) return
    enviando.current = true

    setError('')
    setSaving(true)
    try {
      const empresa = await createEmpresa({
        nombre,
        nit: nit || null,
        contacto_nombre: contactoNombre || null,
        contacto_email: contactoEmail || null,
        contacto_telefono: contactoTelefono || null,
      })
      onCreated(empresa)
    } catch (err) {
      setError(err.message || 'No se pudo crear la empresa')
      enviando.current = false
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2 style={{ fontSize: 19 }}>Nueva empresa cliente</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}

            <div className="field">
              <label>Nombre de la empresa</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
            </div>
            <div className="field">
              <label>ID fiscal (NIT, RFC, EIN... opcional)</label>
              <input type="text" value={nit} onChange={(e) => setNit(e.target.value)} />
            </div>
            <div className="field">
              <label>Nombre de contacto (opcional)</label>
              <input type="text" value={contactoNombre} onChange={(e) => setContactoNombre(e.target.value)} />
            </div>
            <div className="field">
              <label>Correo de contacto (opcional)</label>
              <input type="email" value={contactoEmail} onChange={(e) => setContactoEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Teléfono de contacto (opcional)</label>
              <input type="text" value={contactoTelefono} onChange={(e) => setContactoTelefono(e.target.value)} />
            </div>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creando...' : 'Crear empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
