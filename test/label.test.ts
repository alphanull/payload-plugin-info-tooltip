import { describe, expect, it } from 'vitest';

import { resolveLabel } from '../src/labelState';

describe('resolveLabel', () => {
    it('picks the heading from the field type', () => {
        expect(resolveLabel({ field: { type: 'group' }, schemaPath: 'pages.hero' }).heading).toBe('group-h3');
        expect(resolveLabel({ field: { type: 'array' }, schemaPath: 'pages.items' }).heading).toBe('span');
        expect(resolveLabel({ field: { type: 'blocks' }, schemaPath: 'pages.layout' }).heading).toBe('span');
        expect(resolveLabel({ field: { type: 'collapsible' }, schemaPath: 'pages.more' }).heading).toBe('span');
        expect(resolveLabel({ field: { type: 'text' }, schemaPath: 'pages.title' }).heading).toBe('label');
    });

    it('hides the icon on list headings unless showInListView is set', () => {
        const field = { type: 'text', label: 'Title', admin: { custom: { infoTooltip: 'Hint' } } };
        expect(resolveLabel({ field }).showIcon).toBe(false);
        expect(resolveLabel({ field }).heading).toBe('list');
        expect(resolveLabel({ field, showInListView: true }).showIcon).toBe(true);
        expect(resolveLabel({ field, schemaPath: 'pages.title' }).showIcon).toBe(true);
    });

    it('shows the locale like Payload: not on group headings', () => {
        expect(resolveLabel({ field: { type: 'group', localized: true }, schemaPath: 'pages.hero' }).localized).toBeUndefined();
        expect(resolveLabel({ field: { type: 'array', localized: true }, schemaPath: 'pages.items' }).localized).toBe(true);
    });

    it('reads infoTooltip and lets explicit props win', () => {
        const field = {
            type: 'text',
            label: 'From field',
            required: true,
            localized: true,
            admin: { custom: { infoTooltip: { en: 'Field', de: 'Feld' } } },
        };
        const fromField = resolveLabel({ field, schemaPath: 'pages.title' });
        expect(fromField.info).toEqual({ en: 'Field', de: 'Feld' });
        expect(fromField.label).toBe('From field');
        expect(fromField.required).toBe(true);
        expect(fromField.localized).toBe(true);

        const explicit = resolveLabel({
            field,
            schemaPath: 'pages.title',
            label: 'Explicit',
            info: 'Explicit info',
            required: false,
        });
        expect(explicit.label).toBe('Explicit');
        expect(explicit.info).toBe('Explicit info');
        expect(explicit.required).toBe(false);
    });
});
