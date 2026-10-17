'use client';

import { getTranslation } from '@payloadcms/translations';
import { FieldLabel, useConfig, useTranslation } from '@payloadcms/ui';
import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { resolveLabel, type LabelField } from './labelState';
import { placeTooltip, type TooltipPlacement } from './placement';
import type { InfoTooltipSettings, StaticText } from './rules';
import './styles.css';

type InfoTooltipProps = {
    /** Tooltip text. A locale object is resolved in the admin UI language. */
    readonly text?: StaticText;
    /** Put the icon in the tab order. Default: the plugin's `focusable` option. */
    readonly focusable?: boolean;
};

/** Lets the pointer cross the gap between icon and popup. */
const CLOSE_DELAY_MS = 150;

/**
 * Info icon that opens a tooltip above itself. Positions itself, so callers do not
 * wrap it. Returns null when there is no text.
 */
export function InfoTooltip(props: InfoTooltipProps) {
    const { i18n } = useTranslation();
    const { config } = useConfig();
    const settings = config.admin.custom?.infoTooltip as Partial<InfoTooltipSettings> | undefined;
    const focusable = props.focusable ?? settings?.focusable ?? true;
    const text = props.text ? getTranslation(props.text, i18n) : '';
    const contentId = useId();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
    const pointerType = useRef('');
    const [open, setOpen] = useState(false);
    const [box, setBox] = useState<TooltipPlacement | null>(null);

    const measure = useCallback(() => {
        const trigger = triggerRef.current;
        const popup = popupRef.current;
        if (!trigger || !popup) return;
        const rect = trigger.getBoundingClientRect();
        const popupRect = popup.getBoundingClientRect();
        setBox(placeTooltip({
            trigger: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
            popup: { width: popupRect.width, height: popupRect.height },
            viewport: { width: window.innerWidth, height: window.innerHeight },
        }));
    }, []);

    const show = () => {
        clearTimeout(closeTimer.current);
        setOpen(true);
    };

    const hide = useCallback(() => {
        clearTimeout(closeTimer.current);
        setOpen(false);
        setBox(null);
    }, []);

    useLayoutEffect(() => {
        if (!open) return;
        measure();
    }, [open, measure, text]);

    useEffect(() => {
        if (!open) return;
        const outside = (event: Event) => {
            const target = event.target as Node | null;
            if (!triggerRef.current?.contains(target) && !popupRef.current?.contains(target)) hide();
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') hide();
        };
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('pointerdown', outside);
        // Not `blur`: a click on the popup text would blur the trigger and close it.
        window.addEventListener('focusin', outside);
        window.addEventListener('resize', measure);
        window.addEventListener('scroll', measure, true);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('pointerdown', outside);
            window.removeEventListener('focusin', outside);
            window.removeEventListener('resize', measure);
            window.removeEventListener('scroll', measure, true);
        };
    }, [open, hide, measure]);

    if (!text) return null;

    // React counts the portaled popup as inside this span, so hovering it keeps the tooltip open.
    return (
        <span
            className="info-tooltip"
            onPointerEnter={event => { if (event.pointerType === 'mouse') show(); }}
            onPointerLeave={event => {
                if (event.pointerType !== 'mouse') return;
                clearTimeout(closeTimer.current);
                closeTimer.current = setTimeout(hide, CLOSE_DELAY_MS);
            }}
        >
            <button
                aria-describedby={contentId}
                aria-label="Information"
                className="info-tooltip__trigger"
                onClick={event => {
                    event.stopPropagation();
                    // Hover has opened it for a mouse. Keyboard activation has `detail` 0.
                    if (event.detail > 0 && pointerType.current === 'mouse') return;
                    if (open) hide(); else show();
                }}
                onPointerDown={event => { pointerType.current = event.pointerType; }}
                ref={triggerRef}
                tabIndex={focusable ? undefined : -1}
                type="button"
            >
                <svg aria-hidden="true" fill="none" height="1em" viewBox="0 0 16 16" width="1em">
                    <circle cx="8" cy="8" r="6.75" stroke="currentColor" strokeWidth="1.4" />
                    <circle cx="8" cy="4.9" fill="currentColor" r="0.95" />
                    <path d="M8 7.1v4.4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
                </svg>
            </button>
            {/* Always present, so a screen reader reads the text with the button. The popup is visual only. */}
            <span hidden id={contentId}>{text}</span>
            {open
                ? createPortal(
                    <div
                        aria-hidden="true"
                        className="info-tooltip__popup"
                        data-placement={box?.placement ?? 'top'}
                        ref={popupRef}
                        style={{
                            left: box?.left ?? 0,
                            top: box?.top ?? -9999,
                            visibility: box ? 'visible' : 'hidden',
                            ['--info-tooltip-caret-x' as string]: `${box?.caretX ?? 0}px`,
                        }}
                    >
                        <div className="info-tooltip__content">{text}</div>
                    </div>,
                    document.body,
                )
                : null}
        </span>
    );
}

export type LabelWithInfoProps = {
    readonly field?: LabelField;
    /** Wins over `field.label`. String or locale object. */
    readonly label?: StaticText;
    /** Wins over `field.admin.custom.infoTooltip`. String or locale object. */
    readonly info?: StaticText;
    readonly htmlFor?: string;
    /** Wins over `field.required`. */
    readonly required?: boolean;
    readonly path?: string;
    readonly schemaPath?: string;
    readonly showInListView?: boolean;
    /** Put the icon in the tab order. Default: the plugin's `focusable` option. */
    readonly focusable?: boolean;
    /** Extra classes on the root element, for the caller's layout. */
    readonly className?: string;
    /** Rendered after the icon (buttons, status). */
    readonly children?: React.ReactNode;
};

/**
 * Payload field label plus an info icon. In a label slot, text and heading come from
 * `field`. Outside a field, pass `label` and `info`. Does not expose wrapper markup.
 */
export function LabelWithInfo(props: LabelWithInfoProps) {
    const state = resolveLabel(props);
    const rowClass = ['info-tooltip-label', state.heading === 'group-h3' ? undefined : props.className].filter(Boolean).join(' ');
    const label = (
        <span className={rowClass}>
            <FieldLabel
                {...state.heading === 'label' ? {} : { as: 'span' as const }}
                {...state.heading === 'list' ? { hideLocale: true, unstyled: true } : {}}
                htmlFor={props.htmlFor}
                label={state.label as StaticText | undefined}
                localized={state.localized}
                path={props.path}
                required={state.required}
            />
            {state.showIcon ? <InfoTooltip focusable={props.focusable} text={state.info} /> : null}
            {props.children}
        </span>
    );

    if (state.heading === 'group-h3') {
        return <h3 className={['group-field__title', props.className].filter(Boolean).join(' ')}>{label}</h3>;
    }
    return label;
}
