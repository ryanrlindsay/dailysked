import type { DailySkedLayoutOptions, DailySkedWidgetProps } from './types';

export const DAILY_SKED_LAYOUT_PRESETS = {
  saasShell: {
    mode: 'container',
    sidebarBleed: 'auto',
    edgeGutter: 24
  } satisfies DailySkedLayoutOptions,

  strictContainer: {
    mode: 'container',
    sidebarBleed: 'container'
  } satisfies DailySkedLayoutOptions,

  fullBleedViewport: {
    mode: 'auto',
    sidebarBleed: 'container',
    edgeGutter: 24
  } satisfies DailySkedLayoutOptions,

  flexParent: {
    mode: 'container',
    sizing: 'flex-parent',
    sidebarBleed: 'auto',
    edgeGutter: 24
  } satisfies DailySkedLayoutOptions
};

export const DAILY_SKED_WIDGET_PRESETS = {
  dashboard: {
    range: 'week',
    scheduleHref: '/schedule'
  } satisfies Pick<DailySkedWidgetProps, 'range' | 'scheduleHref'>
};
