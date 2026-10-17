import { describe, expect, it } from 'vitest';

import { EMPTY_DESCRIPTION_EXPORT, LABEL_EXPORT, type FieldNode } from '../src/rules';
import { applyConfig, type WalkConfig } from '../src/walk';

const labeled = (field: FieldNode | undefined) => {
    const label = field?.admin?.components?.Label as { exportName?: string } | undefined;
    const description = field?.admin?.components?.Description as { exportName?: string } | undefined;
    return label?.exportName === LABEL_EXPORT && description?.exportName === EMPTY_DESCRIPTION_EXPORT;
};

describe('applyConfig', () => {
    const tree = (): WalkConfig => ({
        collections: [{
            slug: 'pages',
            fields: [{
                type: 'tabs',
                tabs: [
                    {
                        name: 'main',
                        fields: [{
                            type: 'group',
                            name: 'hero',
                            fields: [{
                                type: 'collapsible',
                                fields: [{ name: 'title', type: 'text', admin: { description: 'Title' } }],
                            }],
                        }],
                    },
                    {
                        fields: [{
                            type: 'row',
                            fields: [{
                                type: 'array',
                                name: 'items',
                                fields: [{
                                    type: 'blocks',
                                    name: 'content',
                                    blocks: [{
                                        slug: 'note',
                                        fields: [{ name: 'body', type: 'textarea', admin: { description: 'Body' } }],
                                    }],
                                }],
                            }],
                        }],
                    },
                ],
            }],
        }],
        globals: [{
            slug: 'settings',
            fields: [{ name: 'site', type: 'text', admin: { description: 'Site' } }],
        }],
        blocks: [
            { slug: 'shared', fields: [{ name: 'caption', type: 'text', admin: { description: 'Caption' } }] },
        ],
        editor: {
            editorConfig: {
                resolvedFeatureMap: new Map([
                    ['link', {
                        sanitizedServerFeatureProps: {
                            fields: [{ name: 'anchor', type: 'text', admin: { description: 'Anchor' } }],
                        },
                    }],
                    ['blocks', {
                        sanitizedServerFeatureProps: {
                            blocks: [{ slug: 'hero', fields: [{ name: 'media', type: 'upload', admin: { description: 'Media' } }] }],
                            inlineBlocks: [{ slug: 'inlineButton', fields: [{ name: 'url', type: 'text', admin: { description: 'URL' } }] }],
                        },
                    }],
                ]),
            },
        },
    });

    it('reaches nested fields, globals, block configs, and lexical feature props', () => {
        const config = tree();
        applyConfig(config, { useDescriptions: true });

        const tabs = config.collections?.[0]?.fields?.[0];
        const title = tabs?.tabs?.[0]?.fields?.[0]?.fields?.[0]?.fields?.[0];
        const body = tabs?.tabs?.[1]?.fields?.[0]?.fields?.[0]?.fields?.[0]?.blocks?.[0];
        const bodyField = typeof body === 'object' ? body.fields?.[0] : undefined;
        expect(labeled(title)).toBe(true);
        expect(labeled(bodyField)).toBe(true);
        expect(labeled(config.globals?.[0]?.fields?.[0])).toBe(true);
        expect(labeled(config.blocks?.[0]?.fields?.[0])).toBe(true);

        type FeatureFields = { admin?: { description?: unknown; components?: { Label?: unknown } } };
        type FeatureProps = {
            fields?: FeatureFields[];
            blocks?: { fields: FeatureFields[] }[];
            inlineBlocks?: { fields: FeatureFields[] }[];
        };
        const editor = config.editor as {
            editorConfig: { resolvedFeatureMap: Map<string, { sanitizedServerFeatureProps: FeatureProps }> };
        };
        const features = editor.editorConfig.resolvedFeatureMap;
        expect(labeled(features.get('link')?.sanitizedServerFeatureProps.fields?.[0])).toBe(true);
        expect(labeled(features.get('blocks')?.sanitizedServerFeatureProps.blocks?.[0]?.fields[0])).toBe(true);
        expect(labeled(features.get('blocks')?.sanitizedServerFeatureProps.inlineBlocks?.[0]?.fields[0])).toBe(true);
    });

    it('returns each labelComponent ref once, also on a second run', () => {
        const ref = { path: 'app/Ai', exportName: 'AiLabel' };
        const options = { useDescriptions: true, labelComponent: () => ref };
        const config = tree();
        expect(applyConfig(config, options)).toEqual([ref]);
        expect(applyConfig(config, options)).toEqual([ref]);
    });

    it('applies the rules inside a Lexical editor when Payload calls its provider, sync or async', async() => {
        const ref = { path: 'app/Ai', exportName: 'AiLabel' };
        const options = { useDescriptions: true, labelComponent: (field: { name?: string }) => (field.name === 'anchor' ? ref : undefined) };
        const adapter = () => ({
            editorConfig: {
                resolvedFeatureMap: new Map([['link', {
                    sanitizedServerFeatureProps: { fields: [{ name: 'anchor', type: 'text', admin: { description: 'Anchor' } }] },
                }]]),
            },
        });
        type Adapter = ReturnType<typeof adapter>;
        type Provider = (args: { config: WalkConfig }) => Adapter | Promise<Adapter>;
        const config: WalkConfig = {
            editor: () => adapter(),
            collections: [{ slug: 'posts', fields: [{ name: 'body', type: 'richText', editor: () => Promise.resolve(adapter()) }] }],
        };

        expect(applyConfig(config, options)).toEqual([]);
        const sanitized: WalkConfig = {};
        const root = await (config.editor as Provider)({ config: sanitized });
        const field = await (config.collections?.[0]?.fields?.[0]?.editor as Provider)({ config: sanitized });

        const anchor = (editor: Adapter) => editor.editorConfig.resolvedFeatureMap.get('link')?.sanitizedServerFeatureProps.fields[0];
        expect(labeled(anchor(root))).toBe(true);
        expect(labeled(anchor(field))).toBe(true);
        expect(sanitized.admin?.dependencies).toEqual({ 'app/Ai#AiLabel': { type: 'component', path: 'app/Ai#AiLabel' } });
    });

    it('is idempotent', () => {
        const config = tree();
        applyConfig(config, { useDescriptions: true });
        const stable = (value: unknown): unknown => (value instanceof Map ? [...value.entries()] : value);
        const once = JSON.stringify(config, (_key, value) => stable(value));
        applyConfig(config, { useDescriptions: true });
        const twice = JSON.stringify(config, (_key, value) => stable(value));
        expect(twice).toBe(once);
    });
});
