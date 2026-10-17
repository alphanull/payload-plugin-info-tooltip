export type Rect = {
    top: number;
    left: number;
    width: number;
    height: number;
};

export type TooltipPlacement = {
    top: number;
    left: number;
    placement: 'top' | 'bottom';
    /** Popup-local x of the icon center, in pixels. */
    caretX: number;
};

const GAP = 8;
const PAD = 8;
const CARET_PAD = 10;

/**
 * Place the popup above the icon. Flip below only when the space above is too small
 * and the space below is larger. Clamp horizontally to the viewport.
 */
export const placeTooltip = (args: {
    trigger: Rect;
    popup: { width: number; height: number };
    viewport: { width: number; height: number };
}): TooltipPlacement => {
    const { trigger, popup, viewport } = args;
    const spaceAbove = trigger.top - GAP;
    const spaceBelow = viewport.height - (trigger.top + trigger.height) - GAP;
    const placement = spaceAbove < popup.height && spaceBelow > spaceAbove ? 'bottom' : 'top';
    const top = placement === 'top'
        ? trigger.top - GAP - popup.height
        : trigger.top + trigger.height + GAP;

    // Outer `max` wins, so a popup wider than the viewport starts at the left padding.
    const iconCenter = trigger.left + trigger.width / 2;
    const left = Math.max(PAD, Math.min(iconCenter - popup.width / 2, viewport.width - popup.width - PAD));
    const caretX = Math.max(CARET_PAD, Math.min(iconCenter - left, popup.width - CARET_PAD));
    return { top, left, placement, caretX };
};
