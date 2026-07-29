import { useContext } from "react";
import { PanelBringToFrontContext } from "../layouts/panel-context";

/**
 * For a widget that hands off to a desktop portal (Color Picker): call this
 * once the portal returns a result, to undo the panel's own reaction to
 * losing focus while the portal was open. It resets the panel's closing
 * state directly rather than relying solely on the OS granting focus back —
 * some window managers deny a focus request that isn't tied to a direct
 * user gesture, which would otherwise leave the panel window mapped but its
 * content stuck at the end of its exit animation (invisible).
 */
export function useBringPanelToFront(): () => void {
  const bringToFront = useContext(PanelBringToFrontContext);
  if (!bringToFront) {
    throw new Error("useBringPanelToFront must be used within a Panel");
  }
  return bringToFront;
}
