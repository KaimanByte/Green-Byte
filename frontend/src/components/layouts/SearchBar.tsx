import { Search, X } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { getCarbonLevel, type Region } from '../../data/regions'
import { CarbonLevelIcon } from '../panels/CarbonLevelIcon'
import styles from './SearchBar.module.css'

type Props = {
  regions: Region[]
  onSelect: (code: string) => void
}

type Result = {
  region: Region
  // serviço que bateu com a busca (quando não foi pela cidade/país)
  matchedService?: string
}

// ignora acento e maiúscula: "sao" acha "São Paulo"
const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function SearchBar({ regions, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  const results = useMemo<Result[]>(() => {
    const term = normalize(query)
    if (!term) return []

    return regions.flatMap((region) => {
      const fields = [region.city, region.area, region.country, region.code]
      if (fields.some((field) => normalize(field).includes(term))) return [{ region }]

      const service = region.services.find((name) => normalize(name).includes(term))
      return service ? [{ region, matchedService: service }] : []
    })
  }, [query, regions])

  const showList = isOpen && query.trim() !== ''

  // "/" foca a busca de qualquer lugar (menos quando já está digitando em outro campo)
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key !== '/' || target.closest('input, textarea, [contenteditable]')) return
      event.preventDefault()
      inputRef.current?.focus()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // clicar fora fecha a lista
  useEffect(() => {
    if (!showList) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false)
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [showList])

  const choose = (result: Result) => {
    onSelect(result.region.code)
    setQuery('')
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      if (query) setQuery('')
      else inputRef.current?.blur()
      setIsOpen(false)
      // não deixa o Esc fechar o painel da região junto
      event.stopPropagation()
      return
    }

    if (!results.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(results[activeIndex] ?? results[0])
    }
  }

  return (
    <div ref={rootRef} className={styles.root}>
      {showList && (
        <ul id={listId} role="listbox" className={`glass ${styles.list}`} aria-label="Datacenters encontrados">
          {results.length === 0 && <li className={styles.empty}>Nenhum datacenter encontrado</li>}

          {results.map((result, index) => {
            const { region, matchedService } = result
            const level = getCarbonLevel(region.carbonIntensity)

            return (
              <li
                key={region.code}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`${styles.option} ${index === activeIndex ? styles.optionActive : ''}`}
                onPointerEnter={() => setActiveIndex(index)}
                onClick={() => choose(result)}
              >
                <span className={styles.level} data-level={level.id}>
                  <CarbonLevelIcon icon={level.icon} />
                </span>
                <span className={styles.optionText}>
                  <span className={styles.optionTitle}>{region.city}</span>
                  <span className={styles.optionMeta}>
                    {matchedService ? `${matchedService} · ` : ''}
                    {region.area} · {region.country}
                  </span>
                </span>
                <span className={styles.optionCode}>{region.code}</span>
              </li>
            )
          })}
        </ul>
      )}

      <div className={`glass ${styles.field}`}>
        <Search size={16} strokeWidth={2} aria-hidden="true" className={styles.icon} />
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          className={styles.input}
          placeholder="Buscar datacenter, região ou serviço"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActiveIndex(0)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          aria-label="Buscar datacenters"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList && results.length ? `${listId}-${activeIndex}` : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        {query ? (
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label="Limpar busca"
          >
            <X size={14} strokeWidth={2} />
          </button>
        ) : (
          <kbd className={styles.hint} aria-hidden="true">/</kbd>
        )}
      </div>
    </div>
  )
}
