import { useRef, useState } from 'react'
import { subirDocumento, borrarDocumento, urlArchivo } from '../api.js'
import { useUser } from '../context/UserContext.jsx'
import { formatFecha } from '../utils.js'

const LADO_MAXIMO_FOTO = 2000 // px; las fotos del celular pesan mucho y no hace falta más para leer un documento

function formatBytes(bytes) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Reduce una foto a JPEG de hasta LADO_MAXIMO_FOTO px. Si el navegador no puede procesarla, se sube tal cual.
async function reducirImagen(archivo) {
  if (!archivo.type.startsWith('image/')) return archivo
  try {
    const bitmap = await createImageBitmap(archivo)
    const escala = Math.min(1, LADO_MAXIMO_FOTO / Math.max(bitmap.width, bitmap.height))
    if (escala === 1 && archivo.size < 1024 * 1024) return archivo
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    if (!blob || blob.size >= archivo.size) return archivo
    const nombre = archivo.name.replace(/\.[^.]+$/, '') + '.jpg'
    return new File([blob], nombre, { type: 'image/jpeg' })
  } catch {
    return archivo
  }
}

function Archivo({ d, etiquetaVersion, esAdmin, onBorrar }) {
  const esImagen = /\.(jpe?g|png)$/i.test(d.nombre_archivo)
  const href = urlArchivo(d.url_descarga)
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        border: '1px solid var(--line)',
        borderRadius: 2,
        marginBottom: 6,
        fontSize: 12.5,
      }}
    >
      <a
        href={href || '#'}
        target="_blank"
        rel="noreferrer"
        style={{ color: 'var(--seal-green)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}
      >
        {esImagen && href ? (
          <img src={href} alt="" style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 2, flexShrink: 0 }} />
        ) : (
          <span>📄</span>
        )}
        <span style={{ minWidth: 0 }}>
          <span style={{ wordBreak: 'break-word' }}>{d.nombre_archivo}</span>{' '}
          <span className="co-sub">{formatBytes(d.tamano_bytes)}</span>
          <span className="co-sub" style={{ display: 'block' }}>
            {etiquetaVersion} · {formatFecha(d.creado_en.slice(0, 10))}
            {d.subido_por_nombre ? ` · ${d.subido_por_nombre}` : ''}
          </span>
        </span>
      </a>
      {esAdmin && (
        <button
          type="button"
          className="btn-ghost"
          style={{ fontSize: 10, padding: '3px 8px', color: 'var(--seal-red)', borderColor: 'var(--seal-red)', flexShrink: 0 }}
          onClick={() => onBorrar(d.id)}
        >
          Borrar
        </button>
      )}
    </div>
  )
}

export default function DocumentosSection({ tramite, tipo, observacionId = null, label, onChange }) {
  const { user } = useUser()
  const inputRef = useRef(null)
  const camaraRef = useRef(null)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')
  const [verAnteriores, setVerAnteriores] = useState(false)

  // Más reciente primero. La primera es la versión vigente; el resto queda como historial.
  const documentos = (tramite.documentos || [])
    .filter((d) => d.tipo === tipo && (observacionId ? d.observacion_id === observacionId : !d.observacion_id))
    .sort((a, b) => b.version - a.version)
  const [vigente, ...anteriores] = documentos

  async function handleArchivo(e) {
    const original = e.target.files[0]
    e.target.value = ''
    if (!original) return
    setSubiendo(true)
    setError('')
    try {
      const archivo = await reducirImagen(original)
      const actualizado = await subirDocumento(tramite.id, tipo, archivo, observacionId)
      onChange(actualizado)
    } catch (err) {
      setError(err.message || 'No se pudo subir el archivo')
    } finally {
      setSubiendo(false)
    }
  }

  async function handleBorrar(documentoId) {
    try {
      const actualizado = await borrarDocumento(documentoId)
      onChange(actualizado)
    } catch (err) {
      setError(err.message || 'No se pudo borrar el archivo')
    }
  }

  const esAdmin = user?.rol === 'admin'

  return (
    <div className="field">
      <label>{label}</label>
      {error && <div className="error-msg">{error}</div>}

      {vigente && (
        <Archivo
          d={vigente}
          etiquetaVersion={documentos.length > 1 ? `Versión ${vigente.version} (vigente)` : `Versión ${vigente.version}`}
          esAdmin={esAdmin}
          onBorrar={handleBorrar}
        />
      )}

      {anteriores.length > 0 && (
        <>
          <div
            className="mono"
            style={{ fontSize: 11, color: 'var(--ink-soft)', cursor: 'pointer', margin: '2px 0 6px' }}
            onClick={() => setVerAnteriores(!verAnteriores)}
          >
            {verAnteriores ? '▾' : '▸'} Versiones anteriores ({anteriores.length})
          </div>
          {verAnteriores &&
            anteriores.map((d) => (
              <Archivo key={d.id} d={d} etiquetaVersion={`Versión ${d.version}`} esAdmin={esAdmin} onBorrar={handleBorrar} />
            ))}
        </>
      )}

      <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,image/*" onChange={handleArchivo} hidden />
      <input ref={camaraRef} type="file" accept="image/*" capture="environment" onChange={handleArchivo} hidden />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button type="button" className="btn-ghost" style={{ fontSize: 11.5, padding: '5px 10px' }} onClick={() => inputRef.current?.click()} disabled={subiendo}>
          {vigente ? 'Subir nueva versión' : 'Subir archivo'}
        </button>
        <button type="button" className="btn-ghost" style={{ fontSize: 11.5, padding: '5px 10px' }} onClick={() => camaraRef.current?.click()} disabled={subiendo}>
          📷 Tomar foto
        </button>
        {subiendo && (
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-soft)' }}>
            Subiendo...
          </span>
        )}
      </div>
    </div>
  )
}
