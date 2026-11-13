import { lazy } from 'react'

// Cada aula é um módulo independente: src/courses/<curso>/<modulo>/<aula>/index.jsx
// O banco guarda só o caminho (lessons.content_path). O mapa do Vite evita importar
// caminhos arbitrários vindos do banco: só entram arquivos que existem aqui.
const modules = import.meta.glob('./*/*/*/index.jsx')
const cache = new Map()

export function hasLessonContent(contentPath) {
  return Object.prototype.hasOwnProperty.call(modules, `./${contentPath}/index.jsx`)
}

export function getLessonComponent(contentPath) {
  const key = `./${contentPath}/index.jsx`
  if (!cache.has(key)) {
    cache.set(key, lazy(modules[key] ?? (() => import('./Placeholder.jsx'))))
  }
  return cache.get(key)
}
