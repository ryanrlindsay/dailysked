import { describe, expect, it } from 'vitest';
import { calculateShellLayout, resolveLayoutOptions } from '../../src/lib/schedule-ui/layout';

describe('resolveLayoutOptions', () => {
  it('prefers layout object values over legacy props', () => {
    const resolved = resolveLayoutOptions(
      {
        mode: 'container',
        sidebarBleed: 'container',
        sizing: 'flex-parent',
        maxWidth: 1200,
        align: 'center',
        edgeGutter: 32,
        desktopBreakpoint: 1000
      },
      {
        layoutMode: 'auto',
        sidebarBleedMode: 'auto',
        maxContentWidth: 1400,
        contentAlign: 'left',
        edgeGutter: 24,
        sizing: 'host-box'
      }
    );

    expect(resolved).toEqual({
      layoutMode: 'container',
      sizing: 'flex-parent',
      sidebarBleedMode: 'container',
      maxContentWidth: 1200,
      contentAlign: 'center',
      edgeGutter: 32,
      desktopBreakpoint: 1000
    });
  });

  it('defaults sizing to an explicit host box', () => {
    const resolved = resolveLayoutOptions(
      undefined,
      {
        layoutMode: 'auto',
        sidebarBleedMode: 'auto',
        maxContentWidth: undefined,
        contentAlign: 'left',
        edgeGutter: undefined
      }
    );

    expect(resolved.sizing).toBe('host-box');
  });
});

describe('calculateShellLayout', () => {
  it('bleeds sidebar by left inset when sidebar is on left', () => {
    const result = calculateShellLayout({
      windowWidth: 1600,
      shellLeft: 90,
      shellRight: 1510,
      hasSidebar: true,
      sidebarPosition: 'left',
      sidebarBleedMode: 'auto',
      layoutMode: 'container',
      desktopBreakpoint: 980
    });

    expect(result.sidebarBleedPx).toBe(90);
    expect(result.useViewportEdgeSpacer).toBe(false);
  });

  it('enables auto edge spacer only when shell is flush to viewport right', () => {
    const flush = calculateShellLayout({
      windowWidth: 1600,
      shellLeft: 0,
      shellRight: 1600,
      hasSidebar: true,
      sidebarPosition: 'left',
      sidebarBleedMode: 'container',
      layoutMode: 'auto',
      desktopBreakpoint: 980
    });
    const inset = calculateShellLayout({
      windowWidth: 1600,
      shellLeft: 0,
      shellRight: 1540,
      hasSidebar: true,
      sidebarPosition: 'left',
      sidebarBleedMode: 'container',
      layoutMode: 'auto',
      desktopBreakpoint: 980
    });

    expect(flush.useViewportEdgeSpacer).toBe(true);
    expect(inset.useViewportEdgeSpacer).toBe(false);
  });
});
