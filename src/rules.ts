/** Server component registered on every tooltip label. */
export const LABEL_PATH = '@alphanull/payload-plugin-info-tooltip/rsc';
export const LABEL_EXPORT = 'LabelWithInfoServer';
/** Server component that renders nothing, in place of a description moved into the tooltip. */
export const EMPTY_DESCRIPTION_EXPORT = 'EmptyDescription';

export type StaticText = string | Record<string, string>;

export type InfoTextFunction = (args: {
    i18n: { language: string; t: (key: string) => string };
    t: (key: string) => string;
}) => string;

/** Same shapes as Payload `admin.description`, plus `false` to opt out. */
export type InfoTooltipValue = StaticText | InfoTextFunction | false;

export type ComponentRef = {
    path: string;
    exportName: string;
};

/** Options for `infoTooltipPlugin`. */
export type InfoTooltipPluginOptions = {
    /**
     * Move static and function `admin.description` values into the tooltip.
     * Default `false`: enabling the plugin changes nothing until a field sets `infoTooltip`.
     */
    useDescriptions?: boolean;
    /** Also show the icon on list-view column headings. Default `false`. */
    showInListView?: boolean;
    /** Put every icon in the admin in the tab order, so it opens with Enter or Space. Default `true`. */
    focusable?: boolean;
    /**
     * Client component rendered instead of `LabelWithInfo` for fields this returns a ref for.
     * `undefined` keeps `LabelWithInfo`. Not applied when the field already has its own label.
     */
    labelComponent?: (field: FieldNode) => ComponentRef | undefined;
};

/** Loose field shape the walk mutates. Payload's `Field` union is not uniform. */
export type FieldNode = {
    name?: string;
    type?: string;
    label?: unknown;
    required?: unknown;
    localized?: unknown;
    fields?: FieldNode[];
    tabs?: { name?: string; fields?: FieldNode[] }[];
    slug?: string;
    blocks?: Array<FieldNode | string>;
    blockReferences?: Array<FieldNode | string>;
    editor?: unknown;
    admin?: {
        description?: unknown;
        components?: Record<string, unknown>;
        custom?: Record<string, unknown>;
    };
};

type LabelRef = ComponentRef & {
    serverProps?: { info?: StaticText | InfoTextFunction; Label?: ComponentRef };
    clientProps?: { showInListView: true };
};

/** Plugin settings in `admin.custom.infoTooltip`. Payload sends `admin.custom` to the browser. */
export type InfoTooltipSettings = {
    focusable: boolean;
};

const isFunction = (value: unknown): value is InfoTextFunction => typeof value === 'function';

export const isStaticText = (value: unknown): value is StaticText => {
    if (typeof value === 'string') return true;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return Object.values(value).every(item => typeof item === 'string');
};

const isInfoValue = (value: unknown): value is StaticText | InfoTextFunction => isStaticText(value) || isFunction(value);

const isOurLabel = (label: unknown): label is LabelRef => {
    if (!label || typeof label !== 'object') return false;
    const ref = label as Partial<ComponentRef>;
    return ref.path === LABEL_PATH && ref.exportName === LABEL_EXPORT;
};

/**
 * Mutate one field. Children are not walked here.
 * `admin` is changed in place: Lexical's BlocksFeature renders shallow copies of container fields
 * that share the `admin` object with the field the walk reaches.
 */
export const applyField = (field: FieldNode, options: InfoTooltipPluginOptions, path: string): void => {
    const admin = field.admin ??= {};
    const label = admin.components?.Label;
    if (isOurLabel(label)) return;

    const info = admin.custom?.infoTooltip;
    if (label) {
        // A function here would be serialized onto the client field.
        if (isFunction(info)) {
            throw new Error(
                `admin.custom.infoTooltip cannot be a function on "${path}" because that field has its own label. Use a string or a locale object.`,
            );
        }
        return;
    }

    const override = options.labelComponent?.(field);
    let text: StaticText | InfoTextFunction | undefined;
    let hideDescription = false;
    if (isInfoValue(info)) {
        text = info;
        delete admin.custom?.infoTooltip;
    } else if (info === undefined && options.useDescriptions === true && !admin.components?.Description && isInfoValue(admin.description)) {
        // Not deleted: `generate:types` writes it into the JSDoc. The empty Description slot hides it in the form.
        text = admin.description;
        hideDescription = true;
    }
    if (text === undefined && !override) return;

    const nextLabel: LabelRef = {
        path: LABEL_PATH,
        exportName: LABEL_EXPORT,
        serverProps: { info: text, Label: override },
        ...options.showInListView === true ? { clientProps: { showInListView: true as const } } : {},
    };
    admin.components = {
        ...admin.components,
        ...hideDescription ? { Description: { path: LABEL_PATH, exportName: EMPTY_DESCRIPTION_EXPORT } } : {},
        Label: nextLabel,
    };
};

/** `labelComponent` ref on the plugin's label. `generate:importmap` does not scan `serverProps`. */
export const labelComponentOf = (field: FieldNode): ComponentRef | undefined => {
    const label = field.admin?.components?.Label;
    return isOurLabel(label) ? label.serverProps?.Label : undefined;
};
