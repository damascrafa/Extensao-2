import { useId } from 'react'

export default function FormField({ label, error, hint, as: Tag = 'input', ...props }) {
  const id = useId()
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1 block font-bold">
        {label}
      </label>
      <Tag id={id} className="input" aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...props} />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm font-bold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
