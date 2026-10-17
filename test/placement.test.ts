import { describe, expect, it } from 'vitest';

import { placeTooltip } from '../src/placement';

const popup = { width: 100, height: 40 };
const viewport = { width: 800, height: 600 };

describe('placeTooltip', () => {
    it('opens above the icon by default', () => {
        const placed = placeTooltip({
            trigger: { top: 200, left: 100, width: 16, height: 16 },
            popup,
            viewport,
        });
        expect(placed.placement).toBe('top');
        expect(placed.top).toBe(152);
        expect(placed.left).toBe(58);
        expect(placed.caretX).toBe(50);
    });

    it('flips below when there is not enough room above', () => {
        const placed = placeTooltip({
            trigger: { top: 10, left: 100, width: 16, height: 16 },
            popup,
            viewport,
        });
        expect(placed.placement).toBe('bottom');
        expect(placed.top).toBe(34);
        expect(placed.caretX).toBe(50);
    });

    it('stays above when the space below is even smaller', () => {
        const placed = placeTooltip({
            trigger: { top: 20, left: 100, width: 16, height: 16 },
            popup,
            viewport: { width: 800, height: 50 },
        });
        expect(placed.placement).toBe('top');
        expect(placed.top).toBe(-28);
    });

    it('clamps to the left and right edges', () => {
        const left = placeTooltip({
            trigger: { top: 200, left: 0, width: 16, height: 16 },
            popup: { width: 200, height: 40 },
            viewport: { width: 400, height: 600 },
        });
        expect(left.left).toBe(8);

        const right = placeTooltip({
            trigger: { top: 200, left: 380, width: 16, height: 16 },
            popup,
            viewport: { width: 400, height: 600 },
        });
        expect(right.left).toBe(292);
        expect(right.caretX).toBe(90);
    });

    it('keeps a popup wider than the viewport on the padding', () => {
        const placed = placeTooltip({
            trigger: { top: 200, left: 100, width: 16, height: 16 },
            popup: { width: 500, height: 40 },
            viewport: { width: 400, height: 600 },
        });
        expect(placed.left).toBe(8);
    });
});
