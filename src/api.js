const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Empresa (tenant): sale del subdominio donde se abre la app (acme.miapp.com -> "acme", acme.localhost -> "acme").
// Con un dominio sin subdominio (localhost, 127.0.0.1, miapp.com) no se manda nada y el backend usa su empresa por defecto.
// Se puede forzar con VITE_TENANT.
function tenantActual() {
  if (import.meta.env.VITE_TENANT) return import.meta.env.VITE_TENANT
  const host = window.location.hostname
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return null
  const partes = host.split('.')
  const base = import.meta.env.VITE_BASE_DOMAIN
  if (base) return host.endsWith(`.${base}`) ? host.slice(0, -(base.length + 1)).split('.')[0] : null
  if (partes.length >= 3 || (partes.length === 2 && partes[1] === 'localhost')) {
    return ['www', 'app', 'admin', 'plataforma'].includes(partes[0]) ? null : partes[0]
  }
  return null
}
const tenant = tenantActual()
const tenantHeaders = () => (tenant ? { 'X-Tenant': tenant } : {})

function getToken() {
  return localStorage.getItem('expediente_token')
}
function setToken(token) {
  localStorage.setItem('expediente_token', token)
}
function clearToken() {
  localStorage.removeItem('expediente_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...tenantHeaders(), ...(options.headers || {}) }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Sesión expirada')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ocurrió un error inesperado' }))
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Ocurrió un error inesperado')
  }
  if (res.status === 204) return null
  return res.json()
}

export async function login(email, password) {
  const body = new URLSearchParams()
  body.append('username', email)
  body.append('password', password)

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...tenantHeaders() },
    body,
  })
  if (!res.ok) throw new Error('Correo o contraseña incorrectos')
  const data = await res.json()
  setToken(data.access_token)
  return data
}

export function logout() {
  clearToken()
}
export function isAuthenticated() {
  return !!getToken()
}

// En modo de almacenamiento local la API devuelve rutas relativas (/archivos/...); con S3/B2 ya son URLs completas
export const urlArchivo = (url) => (url && url.startsWith('/') ? `${API_URL}${url}` : url)
export const getConfig = () => request('/config')
export const getMe = () => request('/auth/me')
export const getEmpresas = (q = '', limit = 50, offset = 0) =>
  request(`/empresas?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`)
export const getEmpresa = (id) => request(`/empresas/${id}`)
export const createEmpresa = (data) =>
  request('/empresas', { method: 'POST', body: JSON.stringify(data) })
export const getTiposTramite = (categoria = '') =>
  request(`/tipos-tramite?categoria=${encodeURIComponent(categoria)}`)
export const getProximosVencer = (gestorId = '') =>
  request(`/dashboard/proximos-vencer${gestorId ? `?gestor_id=${gestorId}` : ''}`)
export const buscarTramites = (q) => request(`/tramites/buscar?q=${encodeURIComponent(q)}`)
export const createTramite = (data) =>
  request('/tramites', { method: 'POST', body: JSON.stringify(data) })
export const getTramitesDeEmpresa = (id) => request(`/empresas/${id}/tramites`)
export const updateTramite = (id, data) =>
  request(`/tramites/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const renovarTramite = (id, data = {}) =>
  request(`/tramites/${id}/renovar`, { method: 'POST', body: JSON.stringify(data) })
export const deleteTramite = (id) => request(`/tramites/${id}`, { method: 'DELETE' })
export const getAuditoriaTramite = (id) => request(`/tramites/${id}/auditoria`)
export const getAuditoriaEmpresa = (id) => request(`/empresas/${id}/auditoria`)
export async function subirDocumento(tramiteId, tipo, archivo, observacionId = null) {
  const token = localStorage.getItem('expediente_token')
  const formData = new FormData()
  formData.append('archivo', archivo)
  let url = `${API_URL}/tramites/${tramiteId}/documentos?tipo=${encodeURIComponent(tipo)}`
  if (observacionId) url += `&observacion_id=${encodeURIComponent(observacionId)}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...tenantHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al subir el archivo' }))
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Error al subir el archivo')
  }
  return res.json()
}
export const borrarDocumento = (id) => request(`/documentos/${id}`, { method: 'DELETE' })
export const createObservacion = (tramiteId, data) =>
  request(`/tramites/${tramiteId}/observaciones`, { method: 'POST', body: JSON.stringify(data) })
export const updateObservacion = (id, data) =>
  request(`/observaciones/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteObservacion = (id) => request(`/observaciones/${id}`, { method: 'DELETE' })
export async function importarTramitesCsv(file) {
  const token = localStorage.getItem('expediente_token')
  const formData = new FormData()
  formData.append('archivo', file)
  const res = await fetch(`${API_URL}/tramites/importar-csv`, {
    method: 'POST',
    headers: { ...tenantHeaders(), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Error al importar' }))
    throw new Error(typeof err.detail === 'string' ? err.detail : 'Error al importar')
  }
  return res.json()
}
export const updateEmpresa = (id, data) =>
  request(`/empresas/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const getDashboardResumen = (gestorId = '') =>
  request(`/dashboard/resumen${gestorId ? `?gestor_id=${gestorId}` : ''}`)
export const getGestores = () => request('/gestores')
export const getUsuarios = () => request('/usuarios')
export const createUsuario = (data) =>
  request('/usuarios', { method: 'POST', body: JSON.stringify(data) })
export const updateUsuario = (id, data) =>
  request(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const cambiarPasswordUsuario = (id, password) =>
  request(`/usuarios/${id}/password`, { method: 'PATCH', body: JSON.stringify({ password }) })
export const getGestoresDeEmpresa = (empresaId) => request(`/empresas/${empresaId}/gestores`)
export const asignarGestores = (empresaId, usuarioIds) =>
  request(`/empresas/${empresaId}/gestores`, {
    method: 'PUT',
    body: JSON.stringify({ usuario_ids: usuarioIds }),
  })
export const getCatalogoTramites = (categoria = '') =>
  request(`/tipos-tramite?incluir_inactivos=true${categoria ? `&categoria=${encodeURIComponent(categoria)}` : ''}`)
export const createTipoTramite = (data) =>
  request('/tipos-tramite', { method: 'POST', body: JSON.stringify(data) })
export const updateTipoTramite = (id, data) =>
  request(`/tipos-tramite/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
export const deleteTipoTramite = (id) => request(`/tipos-tramite/${id}`, { method: 'DELETE' })

// ---------- Administración de la plataforma (empresas / subdominios) ----------
// Sesión propia, separada de la de las empresas, y sin X-Tenant.
const PLATAFORMA_TOKEN_KEY = 'plataforma_token'
export const plataformaAutenticada = () => !!localStorage.getItem(PLATAFORMA_TOKEN_KEY)
export const plataformaLogout = () => localStorage.removeItem(PLATAFORMA_TOKEN_KEY)

async function plataformaRequest(path, options = {}) {
  const token = localStorage.getItem(PLATAFORMA_TOKEN_KEY)
  const res = await fetch(`${API_URL}/plataforma${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
  if (res.status === 401 && token) {
    plataformaLogout()
    window.location.href = '/plataforma/login'
    throw new Error('Sesión expirada')
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Ocurrió un error inesperado' }))
    const detalle = Array.isArray(err.detail) ? err.detail.map((d) => d.msg).join('. ') : err.detail
    throw new Error(typeof detalle === 'string' ? detalle : 'Ocurrió un error inesperado')
  }
  return res.json()
}

export async function plataformaLogin(email, password) {
  const body = new URLSearchParams()
  body.append('username', email)
  body.append('password', password)
  const res = await fetch(`${API_URL}/plataforma/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) throw new Error('Correo o contraseña incorrectos')
  const data = await res.json()
  localStorage.setItem(PLATAFORMA_TOKEN_KEY, data.access_token)
  return data
}
export const getEmpresasPlataforma = () => plataformaRequest('/empresas')
export const crearEmpresaPlataforma = (data) =>
  plataformaRequest('/empresas', { method: 'POST', body: JSON.stringify(data) })
export const editarEmpresaPlataforma = (subdominio, data) =>
  plataformaRequest(`/empresas/${subdominio}`, { method: 'PATCH', body: JSON.stringify(data) })
export const restablecerPasswordEmpresa = (subdominio, data) =>
  plataformaRequest(`/empresas/${subdominio}/restablecer-password`, { method: 'POST', body: JSON.stringify(data) })
