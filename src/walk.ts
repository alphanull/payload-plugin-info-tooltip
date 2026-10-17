import { applyField, labelComponentOf, type ComponentRef, type FieldNode, type InfoTooltipPluginOptions } from './rules';

type FeatureProps = {
    fields?: unknown;
    blocks?: unknown;
    inlineBlocks?: unknown;
};

type EditorLike = {
    editorConfig?: {
        resolvedFeatureMap?: Map<string, { sanitizedServerFeatureProps?: FeatureProps }>;
    };
};

type DependencyConfig = {
    admin?: { dependencies?: Record<string, unknown> };
};

/** Payload's `RichTextAdapterProvider`: called while it sanitizes the config. Payload 3 awaits it, Payload 4 does not. */
type EditorProvider = (args: { config: DependencyConfig }) => unknown;

export type WalkConfig = DependencyConfig & {
    collections?: { slug?: string; fields?: FieldNode[] }[];
    globals?: { slug?: string; fields?: FieldNode[] }[];
    editor?: unknown;
    blocks?: FieldNode[];
};

const join = (parent: string, value: unknown, fallback: string): string => {
    const bit = typeof value === 'string' && value ? value : fallback;
    return parent ? `${parent}.${bit}` : bit;
};

const blockItems = (value: unknown): FieldNode[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is FieldNode => Boolean(item) && typeof item === 'object' && 'fields' in item);
};

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === 'function';

/** Add component refs to `admin.dependencies`, which import-map generation reads. Plain data, so the client config can carry it. */
export const register = (config: DependencyConfig, refs: ComponentRef[]): void => {
    const dependencies = (config.admin ??= {}).dependencies ??= {};
    for (const ref of refs) {
        const path = `${ref.path}#${ref.exportName}`;
        dependencies[path] = { type: 'component', path };
    }
};

/**
 * Apply the tooltip rules to collections, globals, block configs, and the fields inside Lexical feature props.
 * An editor that is still a provider is wrapped: its fields exist only once Payload has called it, so the rules
 * run then, on every config Payload builds. Safe to run again. Returns the `labelComponent` refs found now.
 */
export const applyConfig = (config: WalkConfig, options: InfoTooltipPluginOptions = {}, editorPath = 'editor'): ComponentRef[] => {
    const refs = new Map<string, ComponentRef>();
    const seenEditors = new WeakSet<object>();

    const walk = {
        fields(list: unknown, parent: string): void {
            if (!Array.isArray(list)) return;
            for (const field of list as FieldNode[]) {
                const path = join(parent, field.name, field.type ?? 'field');
                for (const tab of field.tabs ?? []) walk.fields(tab.fields, join(path, tab.name, 'tab'));
                walk.blocks(field.blockReferences, path);
                walk.blocks(field.blocks, path);
                walk.fields(field.fields, path);
                if (field.type === 'richText' && field.editor) field.editor = walk.editor(field.editor, path);
                applyField(field, options, path);
                const ref = labelComponentOf(field);
                if (ref) refs.set(`${ref.path}#${ref.exportName}`, ref);
            }
        },
        blocks(list: unknown, parent: string): void {
            for (const block of blockItems(list)) walk.fields(block.fields, join(parent, block.slug, 'block'));
        },
        editor(value: unknown, parent: string): unknown {
            if (typeof value === 'function') {
                const provider = value as EditorProvider;
                return (args: Parameters<EditorProvider>[0]) => {
                    const done = (editor: unknown): unknown => {
                        register(args.config, applyConfig({ editor }, options, parent));
                        return editor;
                    };
                    const editor = provider(args);
                    return isThenable(editor) ? editor.then(done) : done(editor);
                };
            }
            if (!value || typeof value !== 'object' || seenEditors.has(value)) return value;
            seenEditors.add(value);
            for (const [key, feature] of (value as EditorLike).editorConfig?.resolvedFeatureMap ?? []) {
                const props = feature.sanitizedServerFeatureProps;
                if (!props) continue;
                const path = join(parent, key, 'feature');
                walk.fields(props.fields, path);
                walk.blocks(props.blocks, path);
                walk.blocks(props.inlineBlocks, path);
            }
            return value;
        },
    };

    for (const collection of config.collections ?? []) walk.fields(collection.fields, collection.slug ?? 'collection');
    for (const global of config.globals ?? []) walk.fields(global.fields, global.slug ?? 'global');
    if (config.editor) config.editor = walk.editor(config.editor, editorPath);
    walk.blocks(config.blocks, '');
    return [...refs.values()];
};
