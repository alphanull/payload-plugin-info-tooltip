import { getTranslation } from '@payloadcms/translations';
import { getFromImportMap } from 'payload/shared';
import React from 'react';

import { LabelWithInfo, type LabelWithInfoProps } from '@alphanull/payload-plugin-info-tooltip/client';
import { toClientLabelField } from './labelState';
import type { ComponentRef, InfoTextFunction, StaticText } from './rules';

type ImportMap = Parameters<typeof getFromImportMap>[0]['importMap'];
// Payload types `t` to its own translation keys; at runtime it takes any key, custom ones included.
type Translatable = Parameters<typeof getTranslation>[0];

/** Props Payload passes to a field `Label` slot (edit view and list heading), plus our `serverProps`. */
type LabelServerProps = {
    /** Server field. May contain functions and is not forwarded. */
    readonly field?: unknown;
    /** Serializable client field. Both Label slots pass it. */
    readonly clientField?: unknown;
    /** Tooltip source. Resolved here so functions never reach the browser. */
    readonly info?: StaticText | InfoTextFunction;
    /** Client component to render instead of `LabelWithInfo`. */
    readonly Label?: ComponentRef;
    readonly i18n?: Parameters<typeof getTranslation>[1];
    readonly payload?: { importMap?: ImportMap };
    readonly path?: string;
    readonly readOnly?: boolean;
    readonly schemaPath?: string;
    readonly showInListView?: boolean;
};

type LabelSlotProps = LabelWithInfoProps & { readonly readOnly?: boolean };

/** Description slot for fields whose description moved into the tooltip. */
export function EmptyDescription() {
    return null;
}

/**
 * Label slot for the plugin. Resolves `info` on the server, then renders `LabelWithInfo`
 * or the `labelComponent` registered for this field.
 */
export function LabelWithInfoServer(props: LabelServerProps) {
    const text = props.info !== undefined && props.i18n ? getTranslation(props.info as Translatable, props.i18n) : undefined;
    const Custom = props.Label && props.payload?.importMap
        ? getFromImportMap<React.ComponentType<LabelSlotProps>>({
            importMap: props.payload.importMap,
            PayloadComponent: props.Label,
            schemaPath: props.schemaPath ?? '',
        })
        : undefined;
    const Component: React.ComponentType<LabelSlotProps> = Custom ?? LabelWithInfo;
    return (
        <Component
            field={toClientLabelField(props.clientField)}
            info={typeof text === 'string' ? text : undefined}
            path={props.path}
            readOnly={props.readOnly}
            schemaPath={props.schemaPath}
            showInListView={props.showInListView}
        />
    );
}
