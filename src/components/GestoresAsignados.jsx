import { useEffect, useState } from 'react'
import { getUsuarios, getGestoresDeEmpresa, asignarGestores } from '../api.js'

export default function GestoresAsignados({ empresaId }) {
  const [gestores, setGestores] = useState([])
  const [asignadosIds, setAsignadosIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    Promise.all([getUsuarios(), getGestoresDeEmpresa(empresaId)])
      .then(([todos, asignados]) => {
        setGestores(todos.filter((u) => u.rol === 'gestor'))
        setAsignadosIds(asignados.map((u) => u.id))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [empresaId])

  async function toggle(usuarioId) {
    const nuevaLista = asignadosIds.includes(usuarioId)
      ? asignadosIds.filter((id) => id !== usuarioId)
      : [...asignadosIds, usuarioId]

    setAsignadosIds(nuevaLista)
    setGuardando(true)
    try {
      await asignarGestores(empresaId, nuevaLista)
    } catch {
      // si falla, revierte
      setAsignadosIds(asignadosIds)
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return null
  if (gestores.length === 0) {
    return (
      <p className="mono" style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>
        Todavía no hay cuentas de gestor creadas. Créalas desde "Usuarios" en el menú.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {gestores.map((g) => (
        <div
          key={g.id}
          onClick={() => toggle(g.id)}
          className={`chip ${asignadosIds.includes(g.id) ? 'active' : ''}`}
          style={{ opacity: guardando ? 0.6 : 1 }}
        >
          {g.nombre}
        </div>
      ))}
    </div>
  )
}
