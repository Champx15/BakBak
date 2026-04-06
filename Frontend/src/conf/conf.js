const conf = {
  apiBase: import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}://${window.location.hostname}:8080`
}
export default conf;