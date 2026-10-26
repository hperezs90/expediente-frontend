import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar.jsx'
import { useUser } from '../context/UserContext.jsx'
import { importarTramitesCsv } from '../api.js'

const PLANTILLA = `empresa_nombre,categoria,tipo_tramite_nombre,tipo_gestion,fecha_inicio,numero_expediente,fecha_vencimiento
Cliente Ejemplo S.A.,legal,Licencia de funcionamiento,Renovación,15/03/2024,EXP-1122-2024,
Otra Empresa Ltda.,sanitario,Licencia sanitaria de establecimiento,Renovación,02/01/2023,EXP-0871-2023,
`

function descargarPlantilla() {
  const blob = new Blob([PLANTILLA], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'plantilla_importacion_tramites.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function Importar() {
  const { user, loading: cargandoUser } = useUser()
  const [archivo, setArchivo] = useState(null)
  const [subiendo, setSubiendo] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  if (!cargandoUser && user?.rol !== 'admin') {
    return <Navigate to="/" replace />
  }

  async function handleSubir() {
    if (!archivo) return
    setSubiendo(true)
    setError('')
    setResultado(null)
    try {
      const data = await importarTramitesCsv(archivo)
      setResultado(data)
    } catch (err) {
      setError(err.message || 'No se pudo importar el archivo')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <div className="shell">
      <Sidebar active="importar" />
      <main className="main">
        <div className="eyebrow">{user?.organizacion_nombre} · migración de datos</div>
        <h1 style={{ fontSize: 26, marginBottom: 10 }}>Importar trámites desde Excel/CSV</h1>
        <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, maxWidth: 560, marginBottom: 26 }}>
          Sube un CSV con las columnas indicadas abajo. El sistema busca cada empresa por nombre (la crea
          si no existe), busca el tipo de trámite en el catálogo, y calcula la fecha de vencimiento
          automáticamente si no la incluyes.
        </p>

        <div
          style={{
            background: 'var(--paper-card)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: 22,
            marginBottom: 24,
            maxWidth: 640,
          }}
        >
          <div className="section-label">Columnas esperadas</div>
          <p className="mono" style={{ fontSize: 12, marginBottom: 16, lineHeight: 1.8 }}>
            empresa_nombre, categoria, tipo_tramite_nombre, tipo_gestion (opcional),<br />
            fecha_inicio, numero_expediente (opcional), fecha_vencimiento (opcional)
          </p>
          <button className="btn-ghost" onClick={descargarPlantilla}>
            Descargar plantilla de ejemplo
          </button>
        </div>

        <div
          style={{
            background: 'var(--paper-card)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: 22,
            maxWidth: 640,
          }}
        >
          <div className="section-label">Subir archivo</div>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setArchivo(e.target.files[0] || null)}
            style={{ marginBottom: 16, fontSize: 13 }}
          />
          <br />
          {error && <div className="error-msg">{error}</div>}
          <button className="btn-primary" onClick={handleSubir} disabled={!archivo || subiendo}>
            {subiendo ? 'Importando...' : 'Importar'}
          </button>
        </div>

        {resultado && (
          <div style={{ marginTop: 24, maxWidth: 640 }}>
            <div className="stats" style={{ marginBottom: 16 }}>
              <div className="stat">
                <div className="lbl">Filas leídas</div>
                <div className="val">{resultado.total_filas}</div>
              </div>
              <div className="stat ok">
                <div className="lbl">Trámites creados</div>
                <div className="val">{resultado.creados}</div>
              </div>
              <div className="stat">
                <div className="lbl">Empresas nuevas</div>
                <div className="val">{resultado.empresas_creadas}</div>
              </div>
              <div className="stat crit">
                <div className="lbl">Errores</div>
                <div className="val">{resultado.errores.length}</div>
              </div>
            </div>

            {resultado.errores.length > 0 && (
              <div className="table-wrap">
                <div className="t-head" style={{ gridTemplateColumns: '80px 1fr' }}>
                  <span>FILA</span>
                  <span>MOTIVO</span>
                </div>
                {resultado.errores.map((e, idx) => (
                  <div key={idx} className="t-row" style={{ gridTemplateColumns: '80px 1fr', cursor: 'default' }}>
                    <div className="mono">{e.fila}</div>
                    <div style={{ fontSize: 13 }}>{e.motivo}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
