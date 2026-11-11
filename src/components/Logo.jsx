/** Lokkho mark: a solid bullseye (lokkho = goal). */
export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="logo-mark">
      <defs>
        <linearGradient id="lk-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2dd4bf" />
          <stop offset="1" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill="url(#lk-g)" />
      <circle cx="24" cy="24" r="18" fill="#fff" />
      <circle cx="24" cy="24" r="13.5" fill="url(#lk-g)" />
      <circle cx="24" cy="24" r="9" fill="#fff" />
      <circle cx="24" cy="24" r="4.5" fill="url(#lk-g)" />
      </svg>
  );
}
