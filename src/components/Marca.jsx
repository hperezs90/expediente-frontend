import { useConfig } from '../context/ConfigContext.jsx'

// Logo (si la instalación configuró uno) o el punto de color por defecto, junto al nombre de la app.
export default function Marca() {
  const { app_name, logo_url } = useConfig()
  return (
    <>
      {logo_url ? (
        <img src={logo_url} alt="" style={{ height: 22, marginRight: 8, verticalAlign: 'middle' }} />
      ) : (
        <span className="dot"></span>
      )}
      {app_name}
    </>
  )
}
