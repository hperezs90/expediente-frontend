import { useRef, useState } from 'react'
import { createTipoTramite, updateTipoTramite } from '../api.js'

export default function CatalogoTipoModal({ tipo, categoriasExistentes = [], onClose, onSaved }) {
  const esEdicion = !!tipo

  const [categoria, setCategoria] = useState(tipo?.categoria || categoriasExistentes[0] || '')
  const [nombre, setNombre] = useState(tipo?.nombre || '')
  const [institucion, setInstitucion] = useState(tipo?.institucion || '')
  const [tipoGestion, setTipoGestion] = useState(tipo?.tipo_gestion || '')
  const [vigenciaMeses, setVigenciaMeses] = useState(tipo?.vigencia_meses ?? '')
  const [vigenciaDesde, setVigenciaDesde] = useState(tipo?.vigencia_desde || 'aprobacion')
  const [etapasTexto, setEtapasTexto] = useState((tipo?.etapas || []).join('\n'))
  const [esRecurrente, setEsRecurrente] = useState(!!tipo?.es_recurrente)
  const [frecuenciaDias, setFrecuenciaDias] = useState(tipo?.frecuencia_dias ?? '')
  const [checklistTexto, setChecklistTexto] = useState((tipo?.checklist_default || []).join('\n'))
  const [notas, setNotas] = useState(tipo?.notas || '')
  const [activo, setActivo] = useState(tipo?.activo ?? true)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const enviando = useRef(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (enviando.current) return
    enviando.current = true
    setError('')
    setSaving(true)

    const datos = {
      categoria,
      nombre,
      institucion: institucion || null,
      tipo_gestion: tipoGestion || null,
      vigencia_meses: vigenciaMeses === '' ? null : Number(vigenciaMeses),
      vigencia_desde: vigenciaDesde,
      etapas: etapasTexto
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean),
      es_recurrente: esRecurrente,
      frecuencia_dias: frecuenciaDias === '' ? null : Number(frecuenciaDias),
      checklist_default: checklistTexto
        .split('\n')
        .map((linea) => linea.trim())
        .filter(Boolean),
      notas: notas || null,
      activo,
    }

    try {
      const resultado = esEdicion ? await updateTipoTramite(tipo.id, datos) : await createTipoTramite(datos)
      onSaved(resultado)
    } catch (err) {
      setError(err.message || 'No se pudo guardar el tipo de trámite')
      enviando.current = false
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2 style={{ fontSize: 19 }}>{esEdicion ? 'Editar tipo de trámite' : 'Nuevo tipo de trámite'}</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-msg">{error}</div>}

            <div className="field">
              <label>Categoría</label>
              <input
                type="text"
                list="categorias-existentes"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ej. legal, ambiental, sanitario..."
                required
              />
              <datalist id="categorias-existentes">
                {categoriasExistentes.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="field">
              <label>Nombre del trámite</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Institución (opcional)</label>
                <input type="text" value={institucion} onChange={(e) => setInstitucion(e.target.value)} placeholder="Ente que emite el permiso" />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Tipo de gestión (opcional)</label>
                <input type="text" value={tipoGestion} onChange={(e) => setTipoGestion(e.target.value)} placeholder="Ej. En operación" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div className="field" style={{ flex: 1 }}>
                <label>Vigencia en meses (opcional)</label>
                <input
                  type="number"
                  min="0"
                  value={vigenciaMeses}
                  onChange={(e) => setVigenciaMeses(e.target.value)}
                  placeholder="Ej. 60 (5 años)"
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>La vigencia cuenta desde</label>
                <select value={vigenciaDesde} onChange={(e) => setVigenciaDesde(e.target.value)}>
                  <option value="aprobacion">La fecha de aprobación</option>
                  <option value="inicio">La fecha de inicio</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={esRecurrente} onChange={(e) => setEsRecurrente(e.target.checked)} />
                Es recurrente (obligación que se repite)
              </label>
            </div>

            {esRecurrente && (
              <div className="field">
                <label>Si no tiene vigencia, se repite cada (días)</label>
                <input type="number" min="0" value={frecuenciaDias} onChange={(e) => setFrecuenciaDias(e.target.value)} />
                <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                  Al marcar un trámite de este tipo como aprobado o finalizado, se crea solo el siguiente
                  periodo: empieza cuando vence el actual (o tras estos días si no tiene vencimiento).
                </p>
              </div>
            )}

            <div className="field">
              <label>Etapas del flujo (una por línea, en orden, opcional)</label>
              <textarea
                rows={4}
                value={etapasTexto}
                onChange={(e) => setEtapasTexto(e.target.value)}
                style={{ resize: 'none' }}
                placeholder={'Ej.\nPreparación\nFirma\nPresentado\nEn revisión'}
              />
              <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 4 }}>
                En cada trámite se registra la fecha de cada etapa y el estatus muestra la última alcanzada.
              </p>
            </div>

            <div className="field">
              <label>Checklist de documentos por defecto (uno por línea, opcional)</label>
              <textarea
                rows={4}
                value={checklistTexto}
                onChange={(e) => setChecklistTexto(e.target.value)}
                style={{ resize: 'none' }}
                placeholder={'Ej.\nFormulario firmado\nComprobante de pago'}
              />
            </div>

            <div className="field">
              <label>Notas internas (opcional)</label>
              <textarea rows={2} value={notas} onChange={(e) => setNotas(e.target.value)} style={{ resize: 'none' }} />
            </div>

            {esEdicion && (
              <div className="field">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                  Activo (aparece al crear trámites nuevos)
                </label>
                {!activo && (
                  <p className="mono" style={{ fontSize: 10.5, color: 'var(--ink-soft)', marginTop: 6 }}>
                    Los trámites que ya usan este tipo no se ven afectados.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear tipo de trámite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
