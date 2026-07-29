import { createContext } from "react";

/**
 * Restores the panel after something outside it (an XDG portal, e.g.) took
 * focus and the panel hid itself in response. `null` outside a `Panel`.
 */
export const PanelBringToFrontContext = createContext<(() => void) | null>(null);
