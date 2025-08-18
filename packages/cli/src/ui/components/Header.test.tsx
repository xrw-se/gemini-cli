/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from 'ink-testing-library';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Header } from './Header.js';
import * as useTerminalSize from '../hooks/useTerminalSize.js';
import { longAsciiLogo, shortAsciiLogo } from './AsciiArt.js';
import path from 'node:path';
import { tildeifyPath } from '@google/gemini-cli-core';

vi.mock('../hooks/useTerminalSize.js');

describe('<Header />', () => {
  const targetDir = '/Users/test/Developer/gemini-cli';

  beforeEach(() => {
    vi.spyOn(useTerminalSize, 'useTerminalSize').mockReturnValue({
      columns: 120,
      rows: 20,
    });
  });

  it('renders the long logo on a wide terminal', () => {
    const { lastFrame } = render(
      <Header
        version="1.0.0"
        nightly={false}
        targetDir={targetDir}
        branchName="main"
        debugMode={false}
        debugMessage=""
      />,
    );
    expect(lastFrame()).toContain(longAsciiLogo);
  });

  it('renders the short logo on a medium terminal', () => {
    vi.spyOn(useTerminalSize, 'useTerminalSize').mockReturnValue({
      columns: 75,
      rows: 20,
    });
    const { lastFrame } = render(
      <Header
        version="1.0.0"
        nightly={false}
        targetDir={targetDir}
        branchName="main"
        debugMode={false}
        debugMessage=""
      />,
    );
    expect(lastFrame()).toContain(shortAsciiLogo);
  });

  it('renders the full path on a wide terminal', () => {
    const { lastFrame } = render(
      <Header
        version="1.0.0"
        nightly={false}
        targetDir={targetDir}
        branchName="main"
        debugMode={false}
        debugMessage=""
      />,
    );
    expect(lastFrame()).toContain(tildeifyPath(targetDir));
  });

  it('renders just the basename on a narrow terminal', () => {
    vi.spyOn(useTerminalSize, 'useTerminalSize').mockReturnValue({
      columns: 60,
      rows: 20,
    });
    const { lastFrame } = render(
      <Header
        version="1.0.0"
        nightly={false}
        targetDir={targetDir}
        branchName="main"
        debugMode={false}
        debugMessage=""
      />,
    );
    expect(lastFrame()).toContain(path.basename(targetDir));
    expect(lastFrame()).not.toContain('Users');
  });

  it('renders custom ASCII art when provided', () => {
    const customArt = 'CUSTOM ART';
    const { lastFrame } = render(
      <Header
        version="1.0.0"
        nightly={false}
        customAsciiArt={customArt}
        targetDir={targetDir}
        branchName="main"
        debugMode={false}
        debugMessage=""
      />,
    );
    expect(lastFrame()).toContain(customArt);
  });

  it('displays the version number when nightly is true', () => {
    vi.spyOn(useTerminalSize, 'useTerminalSize').mockReturnValue({
      columns: 200,
      rows: 20,
    });
    const { lastFrame } = render(
      <Header
        version="1.0.0"
        nightly={true}
        targetDir={targetDir}
        branchName="main"
        debugMode={false}
        debugMessage=""
      />,
    );
    expect(lastFrame()).toContain('v1.0.0');
  });

  it('does not display the version number when nightly is false', () => {
    const { lastFrame } = render(
      <Header
        version="1.0.0"
        nightly={false}
        targetDir={targetDir}
        branchName="main"
        debugMode={false}
        debugMessage=""
      />,
    );
    expect(lastFrame()).not.toContain('v1.0.0');
  });
});
