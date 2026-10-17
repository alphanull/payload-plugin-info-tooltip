import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import { LabelWithInfo } from '../src/client';
import { LabelWithInfoServer } from '../src/rsc';

type Props = Parameters<typeof LabelWithInfoServer>[0];
type Rendered = { type: unknown; props: Record<string, unknown> };

// Payload 4 types this as the full `I18nClient`; the label only reads these three members.
const i18n = (language: string, fallbackLanguage = language) => ({
    language,
    fallbackLanguage,
    t: (key: string) => `t:${key}`,
}) as NonNullable<Props['i18n']>;

const render = (props: Props): Rendered => LabelWithInfoServer(props);

describe('LabelWithInfoServer', () => {
    it('resolves a string, a locale object, and a function', () => {
        expect(render({ info: 'Plain', i18n: i18n('en') }).props.info).toBe('Plain');
        expect(render({ info: { en: 'English', de: 'Deutsch' }, i18n: i18n('de', 'en') }).props.info).toBe('Deutsch');
        expect(render({ info: { zz: 'First', en: 'English' }, i18n: i18n('fr', 'es') }).props.info).toBe('First');
        expect(render({ info: ({ t }) => t('custom:title'), i18n: i18n('de') }).props.info).toBe('t:custom:title');
    });

    it('renders the labelComponent from the import map with the resolved string and readOnly', () => {
        function FakeLabel(props: { info?: string }) {
            return createElement('span', null, props.info);
        }
        const node = render({
            info: ({ t }) => t('custom:title'),
            i18n: i18n('en'),
            Label: { path: 'app/Fake', exportName: 'FakeLabel' },
            payload: { importMap: { 'app/Fake#FakeLabel': FakeLabel } },
            readOnly: true,
            schemaPath: 'pages.body',
        });
        expect(node.type).toBe(FakeLabel);
        expect(node.props.info).toBe('t:custom:title');
        expect(node.props.readOnly).toBe(true);
        expect(node.props.schemaPath).toBe('pages.body');
    });

    it('forwards a trimmed client field and never the server field', () => {
        const node = render({
            info: 'Hint',
            i18n: i18n('en'),
            schemaPath: 'pages.title',
            field: {
                type: 'text',
                validate: () => true,
                admin: { description: () => 'server only' },
            },
            clientField: {
                type: 'text',
                name: 'title',
                label: 'Title',
                required: true,
                admin: { width: '50%' },
            },
        });
        expect(node.props.field).toEqual({ type: 'text', label: 'Title', required: true });
    });

    it('falls back to LabelWithInfo when no custom label is set', () => {
        expect(render({ info: 'Hint', i18n: i18n('en'), schemaPath: 'pages.title' }).type).toBe(LabelWithInfo);
    });

});
