export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 font-display text-xl font-extrabold ${className}`}>
      <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true" focusable="false">
        <rect width="32" height="32" rx="8" fill="#1537F0" />
        <path d="M12 9.5v13l11-6.5z" fill="#fff" />
      </svg>
      <span>
        Primeiro <span className="text-brand-500">Clique</span>
      </span>
    </span>
  )
}
