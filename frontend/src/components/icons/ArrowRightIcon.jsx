export default function ArrowRightIcon({ width = 16, height = 16, ...props }) {
  return (
    <svg width={width} height={height} viewBox="0 0 16 16" fill="none" {...props}>
      <path
        d="M3 8H13M13 8L9 4M13 8L9 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
