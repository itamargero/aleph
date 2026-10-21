import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';

const game = await readFile(new URL('../public/hebrew-heroes.html', import.meta.url), 'utf8');
const shell = await readFile(new URL('../app/layout.tsx', import.meta.url), 'utf8');

describe('Hebrew learning documents on mobile browsers', () => {
  test('keeps the Hebrew curriculum out of automatic browser translation', () => {
    expect(game).toMatch(/<html\b[^>]*\blang="he"[^>]*\btranslate="no"/);
    expect(game).toMatch(/<meta\b[^>]*name="google"[^>]*content="notranslate"/);
  });

  test('also disables translation on the root document before the game redirect', () => {
    expect(shell).toMatch(/<html\b[^>]*\btranslate="no"/);
    expect(shell).toMatch(/google:\s*["']notranslate["']/);
  });

  test('fits the device viewport without disabling pinch zoom', () => {
    const viewport = game.match(/<meta\b[^>]*name="viewport"[^>]*content="([^"]+)"/)[1];
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('viewport-fit=cover');
    expect(viewport).not.toMatch(/user-scalable\s*=\s*no|maximum-scale\s*=\s*1(?:\D|$)/);
  });
});
