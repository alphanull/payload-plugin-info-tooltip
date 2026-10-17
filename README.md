![License](https://img.shields.io/github/license/alphanull/payload-plugin-info-tooltip)
![Version](https://img.shields.io/npm/v/@alphanull/payload-plugin-info-tooltip)

# Payload Info Tooltip Plugin

**Payload CMS plugin that shows field help as an info icon tooltip next to the label, instead of a description under the field.**

Long field descriptions push the admin form apart, and may add unnecessary clutter for information rarely accessed. This plugin adds support to add additional information like help text into a small info icon next to the field label, as well as the ability to automatically convert existing field descriptions into tooltips.

## Features

- Shows `admin.custom.infoTooltip` as an info icon next to the field label.
- Accepts the same values as `admin.description`: a string, a locale object, or a function `({ t, i18n }) => string`.
- Optionally turns every `admin.description` into a tooltip (`useDescriptions: true`), with a per-field opt-out.
- Covers fields inside Lexical (link fields, blocks, inline blocks, nested editors), with no change to your `lexicalEditor` calls.
- Optional icon on list-view column headings.
- Works with keyboard and screen readers, with an option to drop the extra tab stop.
- `LabelWithInfo` and `InfoTooltip` for labels you write yourself, and a `labelComponent` option to swap labels by rule.
- Themeable through CSS variables, using Payload 4 tokens with Payload 3 fallbacks.
- Tested with Payload 3.90.2, 3.91.0, 4.0.0-beta.0, and 4.0.0-beta.2.

## Screenshots

| ![Without Plugin](https://raw.githubusercontent.com/alphanull/payload-plugin-info-tooltip/HEAD/docs/before.jpg) | ![Plugin enabled](https://raw.githubusercontent.com/alphanull/payload-plugin-info-tooltip/HEAD/docs/after.jpg) |
| :-------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------------------------------------------------: |
|                                   Standard field descriptions without Plugin                                    |                            Plugin enabled, with descriptions converted to tooltips                             |

## Installation

```bash
pnpm add @alphanull/payload-plugin-info-tooltip
```

## Configuration

```ts
import { buildConfig } from 'payload'
import { infoTooltipPlugin } from '@alphanull/payload-plugin-info-tooltip'

export default buildConfig({
  plugins: [
    infoTooltipPlugin({
      // options with defaults:
      useDescriptions: false,
      showInListView: false,
      focusable: true,
    }),
  ],
})
```

All options are optional. `infoTooltipPlugin()` without options changes nothing until a field sets `admin.custom.infoTooltip`. The plugin runs after all other plugins, wherever it is listed, so it also covers the fields they add.

| Option            | Type      | Default | Description                                                                                               |
| ----------------- | --------- | ------- | --------------------------------------------------------------------------------------------------------- |
| `useDescriptions` | `boolean` | `false` | Move every `admin.description` into the tooltip. See [Converting descriptions](#converting-descriptions). |
| `showInListView`  | `boolean` | `false` | Also show the icon on list-view column headings.                                                          |
| `focusable`       | `boolean` | `true`  | Put every icon in the tab order, your own labels included. `false` drops that tab stop.                   |

After adding the plugin, regenerate the import map so the admin can load the plugin's components:

```bash
pnpm payload generate:importmap
```

A running dev server does this by itself when the config changes, unless `admin.importMap.autoGenerate` is `false`. Commit the updated `importMap.js`: `next build` does not generate it.

## Usage

### Adding a tooltip to a field

Set `admin.custom.infoTooltip` on any field:

```ts
import type { CollectionConfig } from 'payload'

export const Pages: CollectionConfig = {
  slug: 'pages',
  fields: [
    {
      name: 'slug',
      type: 'text',
      admin: {
        custom: {
          infoTooltip: 'Used in the page URL.',
        },
      },
    },
  ],
}
```

The value takes the same forms as `admin.description`:

```ts
// String
infoTooltip: 'Used in the page URL.',

// Locale object
infoTooltip: {
  en: 'Used in the page URL.',
  de: 'Wird in der Seiten-URL verwendet.',
},

// Function
infoTooltip: ({ t }) => t('custom:slugInfo'),
```

The text is resolved on the server, per request, in the admin UI language (active language, then fallback, then the first key). It is not the content locale from the locale switcher. Functions never reach the browser.

A tooltip and a visible description can be combined:

```ts
{
  name: 'slug',
  type: 'text',
  admin: {
    description: 'Lowercase only.', // stays under the field
    custom: {
      infoTooltip: 'Used in the page URL.', // goes into the icon
    },
  },
}
```

### Converting descriptions

With `useDescriptions: true`, every string, locale object, or function `admin.description` becomes the tooltip and is hidden under the field. It stays in `admin.description`, so `generate:types` still writes it into the JSDoc. Fields that set `infoTooltip` or have their own label keep their description visible.

```ts
fields: [
  {
    name: 'title',
    type: 'text',
    admin: {
      description: ({ t }) => t('custom:titleInfo'), // becomes the tooltip
    },
  },
  {
    name: 'notes',
    type: 'textarea',
    admin: {
      description: 'Long text…',
      custom: {
        infoTooltip: false, // opt out: the description stays visible
      },
    },
  },
]
```

`infoTooltip: false` has no effect while `useDescriptions` is off. Custom description components (`admin.components.Description`) are not converted. Neither are tab descriptions: Payload renders a tab's title as plain text, with no label slot for the icon.

## Custom Labels

Payload lets a field replace its label with `admin.components.Label`, for example to place a button next to it. The plugin leaves such fields alone, so they show no icon by themselves. The components below bring the icon into labels you write yourself. Import them from `@alphanull/payload-plugin-info-tooltip/client`; their styles load with them.

### Your own field label

Render `LabelWithInfo` inside your label. It renders Payload's `FieldLabel`, then the icon, then your `children`. The tooltip text comes from the field's `infoTooltip`.

```ts
{
  name: 'prompt',
  type: 'textarea',
  admin: {
    components: {
      Label: '/components/PromptLabel#PromptLabel',
    },
    custom: {
      infoTooltip: 'Describe the image you want.', // string or locale object
    },
  },
}
```

```tsx
'use client'
import { LabelWithInfo, type LabelWithInfoProps } from '@alphanull/payload-plugin-info-tooltip/client'

export function PromptLabel(props: LabelWithInfoProps) {
  return (
    <LabelWithInfo field={props.field} path={props.path} schemaPath={props.schemaPath}>
      <button type="button">Generate</button>
    </LabelWithInfo>
  )
}
```

Here `infoTooltip` must be a string or a locale object. Payload would send a function to the browser with the field, so the plugin throws at startup instead. For translated text from a function, use `labelComponent`.

### The `labelComponent` option

Use it when many fields need the same custom label, for example a button next to every rich-text field. `labelComponent` is a function passed to `infoTooltipPlugin()`. The plugin calls it for each field it walks, including fields inside Lexical, and renders the returned component in place of its default label. Return `undefined` to keep the default.

Compared with setting `admin.components.Label` on each field:

- **One rule instead of many fields.** It also reaches fields you would otherwise have to find and change one by one, such as fields inside Lexical blocks.
- **Conditions live in one place.** For example, return the component only while a feature is enabled.
- **The plugin still handles the field.** With `useDescriptions: true`, descriptions are still converted. Your component receives the tooltip text resolved on the server as `info`, so function texts work too.

The component is also used for fields without tooltip text. Fields with their own `admin.components.Label` are skipped. The plugin registers the component for import-map generation.

```ts
infoTooltipPlugin({
  labelComponent: field =>
    field.type === 'richText'
      ? { path: '/components/RichTextLabel', exportName: 'RichTextLabel' }
      : undefined,
})
```

```tsx
'use client'
import { LabelWithInfo, type LabelWithInfoProps } from '@alphanull/payload-plugin-info-tooltip/client'

export function RichTextLabel({ readOnly, ...props }: LabelWithInfoProps & { readOnly?: boolean }) {
  return (
    <LabelWithInfo {...props}>
      {!readOnly && <button type="button">Generate</button>}
    </LabelWithInfo>
  )
}
```

Props: `field`, `info`, `path`, `schemaPath`, `readOnly`, and `showInListView`.

### Outside fields

`LabelWithInfo` also works with explicit props. `InfoTooltip` renders the icon alone, for text that is not a Payload label:

```tsx
<LabelWithInfo htmlFor="prompt" info={hint} label="Prompt" required />

<legend>
  Length
  <InfoTooltip text={hint} />
</legend>
```

`info`, `label`, and `text` accept a string or a locale object. `className` is applied on the root element. `focusable` overrides the plugin option for one icon.

## How It Works

**Fields.** When Payload builds the config, the plugin walks collections, globals, and block configs, including tabs, groups, arrays, and blocks. It runs after all other plugins, through Payload's plugin `order`. A field with tooltip text, or with a `labelComponent`, gets the plugin's server label. The text, a function included, is a server prop of that label. Payload keeps `admin.components` on the server, so the function never reaches the browser. The label resolves the text per request and renders `LabelWithInfo` or your component. A moved description gets an empty `Description` component that hides it in the form. The components are registered in `admin.dependencies`, which `generate:importmap` reads.

**Lexical.** Fields inside Lexical (link fields, blocks, inline blocks, nested editors) exist only once Payload has built the editor. The plugin wraps the root `editor` and each field-level editor and walks their feature props each time Payload builds them. Your `lexicalEditor` calls stay as they are. This walk uses Lexical internals; it is tested on 3.90.2 and 4.0.0-beta.0.

**Tooltip.** Hovering with a mouse opens the tooltip. A tap, Enter, or Space toggles it. The pointer can move onto the popup, for example to select its text. Escape, a click outside, focus moving elsewhere, or the pointer leaving icon and popup closes it. Screen readers read the text as the icon's description, without opening it. The `focusable` option is stored in `admin.custom.infoTooltip`, which Payload sends to the browser, so every icon reads it. The popup opens above the icon and flips below only when the space above is too small and the space below is larger. It stays inside the viewport, and the caret points at the icon in both positions.

## Styling

Plugin variables, with Payload 4 tokens falling back to Payload 3:

- `--info-tooltip-bg` — `var(--color-bg-elevated, var(--theme-input-bg))`
- `--info-tooltip-fg` — `var(--color-text, var(--theme-text))`
- `--info-tooltip-icon-size` — `var(--text-body-medium-font-size, 1rem)`
- `--info-tooltip-caret-x` — set while open, so the caret stays on the icon

Public class hooks: `info-tooltip-label`, `info-tooltip`, `info-tooltip__trigger`, `info-tooltip__popup`, `info-tooltip__content`.

## Limitations

- Running last relies on Payload's plugin `order`, which Payload marks as experimental.
- Field components that render their label and description themselves, instead of Payload's `Label` and `Description` slots, show no icon and keep the description visible. In Payload 4, the experimental slug field does this.

## Development

```bash
pnpm lint   # ESLint + Stylelint
pnpm test   # Vitest
pnpm build  # lint and test first, then bundle and emit types
```

`exports` point at `src` in a workspace. `pnpm publish` replaces them with `publishConfig.exports`, which point at `dist`. `npm publish` does not, so publish with pnpm.

## License

[MIT License](https://opensource.org/license/MIT)

Copyright © 2026–present Frank Kudermann @ [alphanull.de](https://alphanull.de)
