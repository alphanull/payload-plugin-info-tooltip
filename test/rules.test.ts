import { describe, expect, it } from 'vitest';

import { applyField, EMPTY_DESCRIPTION_EXPORT, LABEL_EXPORT, LABEL_PATH, type FieldNode } from '../src/rules';

const EMPTY_DESCRIPTION = { path: LABEL_PATH, exportName: EMPTY_DESCRIPTION_EXPORT };

const labelOf = (field: FieldNode) => field.admin?.components?.Label as {
    path?: string;
    exportName?: string;
    clientProps?: unknown;
    serverProps?: { info?: unknown; Label?: { path: string; exportName: string } };
} | undefined;

const textField = (admin: FieldNode['admin']): FieldNode => ({ name: 'title', type: 'text', admin });

describe('applyField', () => {
    it('leaves a described field untouched when useDescriptions is off', () => {
        const field = textField({ description: 'Shown below.' });
        applyField(field, {}, 'title');
        expect(field.admin?.description).toBe('Shown below.');
        expect(labelOf(field)).toBeUndefined();
    });

    it('keeps a description when infoTooltip is set', () => {
        for (const info of ['Tooltip', { en: 'Tooltip', de: 'Hinweis' }]) {
            const field = textField({ description: 'Stays', custom: { infoTooltip: info } });
            applyField(field, {}, 'title');
            expect(labelOf(field)?.serverProps?.info).toEqual(info);
            expect(field.admin?.description).toBe('Stays');
            expect(field.admin?.components?.Description).toBeUndefined();
            expect(field.admin?.custom?.infoTooltip).toBeUndefined();
        }
    });

    it('moves a function infoTooltip into serverProps', () => {
        const info = () => 'from t';
        const field = textField({ custom: { infoTooltip: info, other: true } });
        applyField(field, {}, 'title');
        expect(labelOf(field)?.serverProps?.info).toBe(info);
        expect(field.admin?.custom).toEqual({ other: true });
    });

    it('moves static and function descriptions into the tooltip and hides them under the field', () => {
        const fn = () => 'translated';
        for (const description of ['Tab title', { en: 'Tab', de: 'Reiter' }, fn]) {
            const field = textField({ description });
            applyField(field, { useDescriptions: true }, 'title');
            expect(labelOf(field)?.serverProps?.info).toBe(description);
            expect(field.admin?.description).toBe(description);
            expect(field.admin?.components?.Description).toEqual(EMPTY_DESCRIPTION);
        }
    });

    it('changes admin in place, so shallow copies of the field see the label', () => {
        const field: FieldNode = { name: 'items', type: 'array', fields: [], admin: { description: 'Rows' } };
        const copy = { ...field, fields: [] };
        applyField(field, { useDescriptions: true }, 'items');
        expect(labelOf(copy)?.exportName).toBe(LABEL_EXPORT);
        expect(copy.admin?.components?.Description).toEqual(EMPTY_DESCRIPTION);
    });

    it('does not convert a description that has its own Description component', () => {
        const own = { path: 'app/Description', exportName: 'Own' };
        const field = textField({ description: 'Visible', components: { Description: own } });
        applyField(field, { useDescriptions: true }, 'title');
        expect(field.admin?.components?.Description).toBe(own);
        expect(labelOf(field)).toBeUndefined();
    });

    it('treats infoTooltip false as an opt-out only when useDescriptions is on', () => {
        const optedOut = textField({ description: 'Keep', custom: { infoTooltip: false } });
        applyField(optedOut, { useDescriptions: true }, 'title');
        expect(optedOut.admin?.description).toBe('Keep');
        expect(labelOf(optedOut)).toBeUndefined();

        const untouched = textField({ description: 'Keep', custom: { infoTooltip: false } });
        applyField(untouched, {}, 'title');
        expect(untouched.admin?.custom?.infoTooltip).toBe(false);
        expect(labelOf(untouched)).toBeUndefined();
    });

    it('does not move a function description unless useDescriptions is on', () => {
        const description = () => 'server';
        const field = textField({ description });
        applyField(field, {}, 'title');
        expect(field.admin?.description).toBe(description);
        expect(labelOf(field)).toBeUndefined();
    });

    it('does not touch a field that already has its own label', () => {
        const own = { path: 'app/Label', exportName: 'Own' };
        const field = textField({
            description: 'Visible',
            components: { Label: own },
            custom: { infoTooltip: 'static' },
        });
        applyField(field, { useDescriptions: true }, 'title');
        expect(field.admin?.components?.Label).toBe(own);
        expect(field.admin?.description).toBe('Visible');
        expect(field.admin?.custom?.infoTooltip).toBe('static');
    });

    it('rejects a function infoTooltip on a field with its own label', () => {
        const field = textField({
            components: { Label: { path: 'app/Label', exportName: 'Own' } },
            custom: { infoTooltip: () => 'no' },
        });
        expect(() => applyField(field, {}, 'pages.title')).toThrow(/"pages\.title"/);
    });

    it('never puts text in clientProps', () => {
        const field = textField({ custom: { infoTooltip: 'secret' } });
        applyField(field, { showInListView: true }, 'title');
        expect(labelOf(field)?.clientProps).toEqual({ showInListView: true });
        expect(JSON.stringify(labelOf(field)?.clientProps)).not.toContain('secret');
    });

    it('omits showInListView unless the option is on', () => {
        const field = textField({ custom: { infoTooltip: 'x' } });
        applyField(field, {}, 'title');
        expect(labelOf(field)?.clientProps).toBeUndefined();
        expect(labelOf(field)?.path).toBe(LABEL_PATH);
        expect(labelOf(field)?.exportName).toBe(LABEL_EXPORT);
    });

    it('uses labelComponent even without tooltip text, and falls back when it returns undefined', () => {
        const ref = { path: 'app/Ai', exportName: 'AiLabel' };
        const withOverride = textField({});
        withOverride.type = 'richText';
        applyField(withOverride, { labelComponent: () => ref }, 'body');
        expect(labelOf(withOverride)?.serverProps?.Label).toEqual(ref);
        expect(labelOf(withOverride)?.serverProps?.info).toBeUndefined();

        const fallback = textField({ custom: { infoTooltip: 'x' } });
        applyField(fallback, { labelComponent: () => undefined }, 'title');
        expect(labelOf(fallback)?.serverProps?.Label).toBeUndefined();
        expect(labelOf(fallback)?.exportName).toBe(LABEL_EXPORT);
    });
});
