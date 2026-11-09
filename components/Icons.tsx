type IconProps = { className?: string; strokeWidth?: number };

function base(className?: string, strokeWidth = 1.7) {
  return {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

export function IconHome({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  );
}

export function IconFingerprint({ className, strokeWidth }: IconProps) {
  return (
    <svg {...base(className, strokeWidth ?? 1.6)}>
      <path d="M12 3.2c-4.9 0-8.8 3.9-8.8 8.8" />
      <path d="M20.8 12c0-4.9-3.9-8.8-8.8-8.8" />
      <path d="M6.4 12a5.6 5.6 0 0 1 11.2 0c0 2.2-.3 4.3-.9 6.3" />
      <path d="M9.6 12a2.4 2.4 0 0 1 4.8 0v3.6c0 1.5-.3 3-.9 4.4" />
      <path d="M12 17.8V21" />
      <path d="M6.2 15.2A15 15 0 0 0 5.5 20" />
      <path d="M17.6 16.4c-.3 1.7-.8 3.3-1.4 4.8" />
    </svg>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.4 20c.5-3.2 2.8-5.2 5.6-5.2s5.1 2 5.6 5.2" />
      <path d="M16.2 5.2a3 3 0 0 1 0 5.8" />
      <path d="M17.4 14.8c2 .5 3.3 2.2 3.7 4.6" />
    </svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <rect x="3.2" y="5" width="17.6" height="15.5" rx="3" />
      <path d="M3.2 9.6h17.6" />
      <path d="M8 3v3.4M16 3v3.4" />
      <path d="M7.5 13h2M12 13h2M16.5 13h.5M7.5 16.8h2M12 16.8h2" />
    </svg>
  );
}

export function IconClock({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 7.4V12l3.2 2" />
    </svg>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="10.8" cy="10.8" r="6.6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4.5 7h15" />
      <path d="M9 7V5.2A1.2 1.2 0 0 1 10.2 4h3.6A1.2 1.2 0 0 1 15 5.2V7" />
      <path d="M6.6 7l.8 12a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.8-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

export function IconShield({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3.2 19 6v5.4c0 4.4-3 7.6-7 9.4-4-1.8-7-5-7-9.4V6z" />
      <path d="m9.2 12 1.9 1.9 3.7-3.8" />
    </svg>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconX({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function IconArrowLeft({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 4v11" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
      <path d="M5 20h14" />
    </svg>
  );
}

export function IconSpark({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8.2 13.7 11l2.8 1-2.8 1-1.7 2.8L10.3 13l-2.8-1 2.8-1z" />
    </svg>
  );
}
