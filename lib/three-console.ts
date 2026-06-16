import * as THREE from "three";

/**
 * Silence one unactionable upstream deprecation.
 *
 * three r183 deprecated `THREE.Clock` in favour of `THREE.Timer`, but
 * `@react-three/fiber` 9.x still constructs `new THREE.Clock()` for its render
 * loop — so the warning is R3F's to fix, not ours, and it only spams the dev
 * console (twice, because StrictMode double-mounts the Canvas).
 *
 * `setConsoleFunction` is three's own interception hook: we forward every
 * log / warn / error through to the native console UNCHANGED except that single
 * message, so no real three warning or error is ever hidden.
 */
let installed = false;

export function silenceThreeClockDeprecation() {
  if (installed || typeof THREE.setConsoleFunction !== "function") return;
  installed = true;

  THREE.setConsoleFunction(
    (type: "log" | "warn" | "error", message: string, ...params: unknown[]) => {
      if (
        type === "warn" &&
        typeof message === "string" &&
        message.includes("Clock: This module has been deprecated")
      ) {
        return;
      }
      const fn =
        type === "error" ? console.error : type === "warn" ? console.warn : console.log;
      fn(message, ...params);
    },
  );
}
