import { describe, expect, it } from 'vitest';

import { infoTooltipPlugin } from '../src/index';
import { EMPTY_DESCRIPTION_EXPORT, LABEL_EXPORT, LABEL_PATH } from '../src/rules';

describe('infoTooltipPlugin', () => {
    it('registers its components as admin dependencies and adds no import-map generator or onInit', async() => {
        const config = await infoTooltipPlugin()({ collections: [] } as never);
        const label = `${LABEL_PATH}#${LABEL_EXPORT}`;
        const empty = `${LABEL_PATH}#${EMPTY_DESCRIPTION_EXPORT}`;
        expect(config.admin?.dependencies).toEqual({
            [label]: { type: 'component', path: label },
            [empty]: { type: 'component', path: empty },
        });
        expect(config.admin?.importMap?.generators).toBeUndefined();
        expect(config.onInit).toBeUndefined();
    });

    it('writes focusable to admin.custom, next to keys that are already there', async() => {
        const plain = await infoTooltipPlugin()({ collections: [] } as never);
        expect(plain.admin?.custom).toEqual({ infoTooltip: { focusable: true } });
        const off = await infoTooltipPlugin({ focusable: false })({ collections: [], admin: { custom: { other: 1 } } } as never);
        expect(off.admin?.custom).toEqual({ other: 1, infoTooltip: { focusable: false } });
    });

    it('sorts after plugins with the default order, so it sees the fields they add', () => {
        expect(infoTooltipPlugin().order).toBe(Number.MAX_SAFE_INTEGER);
    });
});
