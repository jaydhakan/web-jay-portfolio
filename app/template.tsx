/**
 * Page-enter transition: a short CSS fade-rise on every route change.
 * App Router re-mounts templates per navigation, so the animation re-runs;
 * being CSS it needs no hydration and never hides content from no-JS UAs.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
