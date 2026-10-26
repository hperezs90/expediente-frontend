const PALETA_CATEGORIAS = 6

// Cada instalación define sus propias categorías: se asigna un color estable según el nombre.
export function tagClass(categoria) {
  const texto = categoria || ''
  let hash = 0
  for (let i = 0; i < texto.length; i++) hash = (hash * 31 + texto.charCodeAt(i)) >>> 0
  return `tag tag-c${hash % PALETA_CATEGORIAS}`
}

export function categoriaLabel(categoria) {
  if (!categoria) return ''
  return categoria.charAt(0).toUpperCase() + categoria.slice(1)
}

export function diasRestantes(fechaVencimiento) {
  if (!fechaVencimiento) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const venc = new Date(fechaVencimiento + 'T00:00:00')
  const diff = Math.round((venc - hoy) / (1000 * 60 * 60 * 24))
  return diff
}

export function estadoUrgencia(dias) {
  if (dias === null) return { texto: 'Sin vencimiento', clase: '' }
  if (dias < 0) return { texto: 'Vencido', clase: 'crit' }
  if (dias <= 15) return { texto: `${dias} días`, clase: 'crit' }
  if (dias <= 30) return { texto: `${dias} días`, clase: 'warn' }
  if (dias <= 90) return { texto: `${dias} días`, clase: 'ok' }
  return { texto: 'Vigente', clase: 'ok' }
}

export function formatFecha(fecha) {
  if (!fecha) return '—'
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function sumarMeses(fechaISO, meses) {
  if (!fechaISO) return ''
  const [anio, mes, dia] = fechaISO.split('-').map(Number)
  const fecha = new Date(anio, mes - 1 + meses, 1)
  const ultimoDiaMesDestino = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate()
  fecha.setDate(Math.min(dia, ultimoDiaMesDestino))
  const yyyy = fecha.getFullYear()
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const dd = String(fecha.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const CAMPO_LABELS = {
  numero_expediente: 'N° de expediente',
  fecha_inicio: 'Fecha de inicio',
  fecha_vencimiento: 'Fecha de vencimiento',
  estado: 'Estado',
  asignado_a: 'Asignado a',
  notas: 'Notas',
  resolucion_final: 'Resolución final',
  fecha_aprobacion: 'Fecha de aprobación',
  descripcion: 'Descripción',
  numero_registro: 'N° de registro / licencia',
  anticipo: 'Anticipo',
  complemento: 'Complemento',
  eliminado: 'Trámite eliminado',
}

// Nombre legible de un campo del historial de cambios ("etapa:X" y "observacion_N" son dinámicos)
export function etiquetaCampo(campo) {
  if (campo.startsWith('etapa:')) return campo.slice('etapa:'.length)
  const obs = campo.match(/^observacion_(\d+)$/)
  if (obs) return `Observación N° ${obs[1]}`
  return CAMPO_LABELS[campo] || campo
}

// ¿Se ofrece "Renovar"? Tiene vencimiento dentro de la ventana (o ya venció), no se renovó y no fue rechazado.
export function puedeRenovar({ fecha_vencimiento, renovado, estatus, ventanaDias }) {
  if (!fecha_vencimiento || renovado || estatus === 'RECHAZADO') return false
  return diasRestantes(fecha_vencimiento) <= ventanaDias
}
