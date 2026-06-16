import { PageTransition } from "@/components/layout/PageTransition";

/**
 * Per-navigation remount point: the App Router remounts template.tsx on every
 * route change, which is what drives the enter wipe. PageTransition is rendered
 * as a SIBLING of {children} — never a wrapper around it — so the z-55 curtain
 * stays a bare leaf sibling of the z-60 mix-blend-difference cursor and can
 * never create a blend-isolating context (plan §4.6).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTransition />
      {children}
    </>
  );
}
