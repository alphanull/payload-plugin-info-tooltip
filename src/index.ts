import type { Plugin } from 'payload';

import {
    EMPTY_DESCRIPTION_EXPORT,
    LABEL_EXPORT,
    LABEL_PATH,
    type InfoTooltipPluginOptions,
    type InfoTooltipSettings,
} from './rules';
import { applyConfig, register } from './walk';

export type { ComponentRef, InfoTextFunction, InfoTooltipPluginOptions, InfoTooltipValue, StaticText } from './rules';

/**
 * Show an info icon next to field labels.
 *
 * With no options, nothing changes until a field sets `admin.custom.infoTooltip`.
 * Pass `{ useDescriptions: true }` to move `admin.description` into the icon.
 * Runs after all other plugins (Payload's experimental `order`), so the fields they add are covered.
 */
export const infoTooltipPlugin = (options: InfoTooltipPluginOptions = {}): Plugin => Object.assign(
    (config: Parameters<Plugin>[0]) => {
        const admin = config.admin ??= {};
        const settings: InfoTooltipSettings = { focusable: options.focusable !== false };
        admin.custom = { ...admin.custom, infoTooltip: settings };
        register(config, [
            { path: LABEL_PATH, exportName: LABEL_EXPORT },
            { path: LABEL_PATH, exportName: EMPTY_DESCRIPTION_EXPORT },
            ...applyConfig(config, options),
        ]);
        return config;
    },
    { order: Number.MAX_SAFE_INTEGER },
);
