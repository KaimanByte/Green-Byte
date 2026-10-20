/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base da API do backend (sem barra final). Ex.: http://localhost:3001 */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
