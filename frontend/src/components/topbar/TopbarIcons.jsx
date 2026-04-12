/**
 * Topbar SVG icons (stroke, currentColor). Size from CSS (.arena-nav-link__ico svg).
 */

const stroke = {
  width: 1.5,
  cap: "round",
  join: "round",
};

function SvgFrame({ children, className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export function IconDashboard({ className }) {
  return (
    <SvgFrame className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={stroke.width} />
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={stroke.width} />
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={stroke.width} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={stroke.width} />
    </SvgFrame>
  );
}

export function IconChallenges({ className }) {
  return (
    <SvgFrame className={className}>
      <path
        d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinejoin={stroke.join}
      />
      <path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" stroke="currentColor" strokeWidth={stroke.width} />
    </SvgFrame>
  );
}

export function IconSubmissions({ className }) {
  return (
    <SvgFrame className={className}>
      <path
        d="M12 3v9m0 0l3-3m-3 3l-3-3"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
        strokeLinejoin={stroke.join}
      />
      <path
        d="M4 17h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinejoin={stroke.join}
      />
    </SvgFrame>
  );
}

export function IconFriends({ className }) {
  return (
    <SvgFrame className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth={stroke.width} />
      <path d="M3 20v-1a5 5 0 015-5h2a5 5 0 015 5v1" stroke="currentColor" strokeWidth={stroke.width} strokeLinecap={stroke.cap} />
      <circle cx="17" cy="9" r="2.5" stroke="currentColor" strokeWidth={stroke.width} />
      <path d="M21 20v-.5a4 4 0 00-3-3.87" stroke="currentColor" strokeWidth={stroke.width} strokeLinecap={stroke.cap} />
    </SvgFrame>
  );
}

export function IconLeaderboard({ className }) {
  return (
    <SvgFrame className={className}>
      <path d="M4 20h16" stroke="currentColor" strokeWidth={stroke.width} strokeLinecap={stroke.cap} />
      <rect x="5" y="12" width="4" height="8" rx="0.5" stroke="currentColor" strokeWidth={stroke.width} />
      <rect x="10" y="8" width="4" height="12" rx="0.5" stroke="currentColor" strokeWidth={stroke.width} />
      <rect x="15" y="4" width="4" height="16" rx="0.5" stroke="currentColor" strokeWidth={stroke.width} />
    </SvgFrame>
  );
}

export function IconReplay({ className }) {
  return (
    <SvgFrame className={className}>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth={stroke.width} />
      <path
        d="M10 9l5 3-5 3V9z"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinejoin={stroke.join}
      />
    </SvgFrame>
  );
}

export function IconDocs({ className }) {
  return (
    <SvgFrame className={className}>
      <path d="M6 4h10a2 2 0 012 2v12H8a2 2 0 00-2 2V4z" stroke="currentColor" strokeWidth={stroke.width} strokeLinejoin={stroke.join} />
      <path d="M8 20V8a2 2 0 012-2h10" stroke="currentColor" strokeWidth={stroke.width} strokeLinecap={stroke.cap} />
      <path d="M11 9h6M11 12h6M11 15h4" stroke="currentColor" strokeWidth={stroke.width} strokeLinecap={stroke.cap} />
    </SvgFrame>
  );
}

export function IconProfile({ className }) {
  return (
    <SvgFrame className={className}>
      <circle cx="12" cy="9" r="3.5" stroke="currentColor" strokeWidth={stroke.width} />
      <path
        d="M5 20v0a7 7 0 0114 0v0"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
      />
    </SvgFrame>
  );
}

export function IconTeacher({ className }) {
  return (
    <SvgFrame className={className}>
      <path d="M4 10l8-4 8 4-8 4-8-4z" stroke="currentColor" strokeWidth={stroke.width} strokeLinejoin={stroke.join} />
      <path d="M4 10v6l8 4v-6M20 10v6l-8 4v-6" stroke="currentColor" strokeWidth={stroke.width} strokeLinejoin={stroke.join} />
    </SvgFrame>
  );
}

export function IconBell({ className }) {
  return (
    <SvgFrame className={className}>
      <path
        d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
        strokeLinejoin={stroke.join}
      />
      <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth={stroke.width} strokeLinecap={stroke.cap} />
    </SvgFrame>
  );
}

export function IconSun({ className }) {
  return (
    <SvgFrame className={className}>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={stroke.width} />
      <path
        d="M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
      />
    </SvgFrame>
  );
}

export function IconMoon({ className }) {
  return (
    <SvgFrame className={className}>
      <path
        d="M21 14.5A8.5 8.5 0 0110.5 4 8.5 8.5 0 0012 21a8.5 8.5 0 009-6.5z"
        stroke="currentColor"
        strokeWidth={stroke.width}
        strokeLinecap={stroke.cap}
        strokeLinejoin={stroke.join}
      />
    </SvgFrame>
  );
}

const ICON_MAP = {
  dashboard: IconDashboard,
  challenges: IconChallenges,
  submissions: IconSubmissions,
  friends: IconFriends,
  leaderboard: IconLeaderboard,
  docs: IconDocs,
  replay: IconReplay,
  profile: IconProfile,
  teacher: IconTeacher,
};

export function NavIcon({ name, className }) {
  const Cmp = ICON_MAP[name];
  if (!Cmp) return null;
  return <Cmp className={className} />;
}
