import type { ContentAlign, DailySkedLayoutOptions, LayoutLength, LayoutMode, LayoutSizing, SidebarBleedMode, SidebarPosition } from './types';

export const DEFAULT_DESKTOP_BREAKPOINT = 980;
export const DEFAULT_EDGE_GUTTER = 24;

export interface ShellLayoutComputationInput {
  windowWidth: number;
  shellLeft: number;
  shellRight: number;
  hasSidebar: boolean;
  sidebarPosition: SidebarPosition;
  sidebarBleedMode: SidebarBleedMode;
  layoutMode: LayoutMode;
  desktopBreakpoint?: number;
}

export interface ShellLayoutComputationResult {
  sidebarBleedPx: number;
  useViewportEdgeSpacer: boolean;
}

export function resolveLayoutOptions(
  layout: DailySkedLayoutOptions | undefined,
  legacy: {
    layoutMode: LayoutMode;
    sidebarBleedMode: SidebarBleedMode;
    maxContentWidth: LayoutLength | undefined;
    contentAlign: ContentAlign;
    edgeGutter: LayoutLength | undefined;
    sizing?: LayoutSizing;
  }
) {
  return {
    layoutMode: layout?.mode ?? legacy.layoutMode,
    sizing: layout?.sizing ?? legacy.sizing ?? 'host-box',
    sidebarBleedMode: layout?.sidebarBleed ?? legacy.sidebarBleedMode,
    maxContentWidth: layout?.maxWidth ?? legacy.maxContentWidth,
    contentAlign: layout?.align ?? legacy.contentAlign,
    edgeGutter: layout?.edgeGutter ?? legacy.edgeGutter ?? DEFAULT_EDGE_GUTTER,
    desktopBreakpoint: layout?.desktopBreakpoint ?? DEFAULT_DESKTOP_BREAKPOINT
  };
}

export function calculateShellLayout(input: ShellLayoutComputationInput): ShellLayoutComputationResult {
  const desktopBreakpoint = input.desktopBreakpoint ?? DEFAULT_DESKTOP_BREAKPOINT;
  const desktop = input.windowWidth >= desktopBreakpoint;

  const sidebarBleedPx = (!input.hasSidebar || input.sidebarBleedMode === 'container')
    ? 0
    : computeSidebarBleedPx(input.windowWidth, input.shellLeft, input.shellRight, input.sidebarPosition);

  const useViewportEdgeSpacer = computeEdgeSpacerMode(
    input.layoutMode,
    desktop,
    input.windowWidth,
    input.shellRight
  );

  return { sidebarBleedPx, useViewportEdgeSpacer };
}

function computeSidebarBleedPx(
  windowWidth: number,
  shellLeft: number,
  shellRight: number,
  sidebarPosition: SidebarPosition
) {
  const rawBleed = sidebarPosition === 'right'
    ? windowWidth - shellRight
    : shellLeft;
  return rawBleed > 2 ? Math.round(rawBleed) : 0;
}

function computeEdgeSpacerMode(
  layoutMode: LayoutMode,
  desktop: boolean,
  windowWidth: number,
  shellRight: number
) {
  if (layoutMode === 'container') return false;
  if (layoutMode === 'viewport') return true;
  if (!desktop) return false;
  return Math.abs(windowWidth - shellRight) <= 2;
}

export function hasLayoutLength(value: LayoutLength | undefined) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

export function toCssLength(value: LayoutLength | undefined) {
  if (value === undefined || value === null) return '';
  return typeof value === 'number' ? `${value}px` : String(value);
}
