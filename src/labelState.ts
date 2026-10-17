import { isStaticText, type StaticText } from './rules';

/** `group-h3` restores Payload's group heading, `span` sits inside a heading Payload renders, `list` is a column heading. */
export type HeadingMode = 'group-h3' | 'span' | 'label' | 'list';

export type LabelField = {
    type?: string;
    label?: unknown;
    required?: unknown;
    localized?: unknown;
    admin?: { custom?: { infoTooltip?: unknown } };
};

export type LabelInput = {
    field?: LabelField;
    label?: StaticText;
    info?: StaticText;
    required?: boolean;
    schemaPath?: string;
    showInListView?: boolean;
};

export type ResolvedLabel = {
    label: unknown;
    info: StaticText | undefined;
    required: boolean | undefined;
    localized: boolean | undefined;
    heading: HeadingMode;
    showIcon: boolean;
};

/** The few client-field keys the label reads. Keeps the RSC payload small. */
export const toClientLabelField = (field: unknown): LabelField | undefined => {
    if (!field || typeof field !== 'object') return undefined;
    const source = field as LabelField;
    const next: LabelField = {};
    if (typeof source.type === 'string') next.type = source.type;
    if (isStaticText(source.label)) next.label = source.label;
    if (typeof source.required === 'boolean') next.required = source.required;
    if (typeof source.localized === 'boolean') next.localized = source.localized;
    return next;
};

const headingFor = (type: string | undefined): HeadingMode => {
    if (type === 'group') return 'group-h3';
    if (type === 'array' || type === 'blocks' || type === 'collapsible') return 'span';
    return 'label';
};

/** Pure label decisions shared by `LabelWithInfo` and its tests. */
export const resolveLabel = (input: LabelInput): ResolvedLabel => {
    const { field, schemaPath } = input;
    // Edit view always has `schemaPath`. List headings only receive `field`.
    const isList = field !== undefined && schemaPath === undefined;
    const fieldInfo = field?.admin?.custom?.infoTooltip;
    const fieldRequired = typeof field?.required === 'boolean' ? field.required : undefined;
    return {
        label: input.label ?? field?.label,
        info: input.info ?? (isStaticText(fieldInfo) ? fieldInfo : undefined),
        required: isList ? undefined : input.required ?? fieldRequired,
        // Payload's own group heading passes `localized: false`.
        localized: !isList && field?.type !== 'group' && field?.localized === true ? true : undefined,
        heading: isList ? 'list' : headingFor(field?.type),
        showIcon: !isList || input.showInListView === true,
    };
};
