/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Box, Text } from 'ink';
import Gradient from 'ink-gradient';
import { Colors } from '../colors.js';
import { theme } from '../semantic-colors.js';
import { shortAsciiLogo, longAsciiLogo, tinyAsciiLogo } from './AsciiArt.js';
import { getAsciiArtWidth } from '../utils/textUtils.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { shortenPath, tildeifyPath } from '@google/gemini-cli-core';
import path from 'node:path';
import { DebugProfiler } from './DebugProfiler.js';
import { isNarrowWidth } from '../utils/isNarrowWidth.js';

interface HeaderProps {
  customAsciiArt?: string; // For user-defined ASCII art
  version: string;
  nightly: boolean;
  targetDir: string;
  branchName?: string;
  debugMode: boolean;
  debugMessage: string;
  vimMode?: string;
}

export const Header: React.FC<HeaderProps> = ({
  customAsciiArt,
  version,
  nightly,
  targetDir,
  branchName,
  debugMode,
  debugMessage,
  vimMode,
}) => {
  const { columns: terminalWidth } = useTerminalSize();
  let displayTitle;
  const widthOfLongLogo = getAsciiArtWidth(longAsciiLogo);
  const widthOfShortLogo = getAsciiArtWidth(shortAsciiLogo);

  if (customAsciiArt) {
    displayTitle = customAsciiArt;
  } else if (terminalWidth >= widthOfLongLogo) {
    displayTitle = longAsciiLogo;
  } else if (terminalWidth >= widthOfShortLogo) {
    displayTitle = shortAsciiLogo;
  } else {
    displayTitle = tinyAsciiLogo;
  }

  const artWidth = getAsciiArtWidth(displayTitle);
  const isNarrow = isNarrowWidth(terminalWidth);

  // Adjust path length based on terminal width
  const pathLength = Math.max(20, Math.floor(terminalWidth * 0.4));
  const displayPath = isNarrow
    ? path.basename(tildeifyPath(targetDir))
    : shortenPath(tildeifyPath(targetDir), pathLength);

  return (
    <Box flexDirection="column" width="100%">
      <Box
        alignItems="flex-start"
        width={artWidth}
        flexShrink={0}
        flexDirection="column"
      >
        {Colors.GradientColors ? (
          <Gradient colors={Colors.GradientColors}>
            <Text>{displayTitle}</Text>
          </Gradient>
        ) : (
          <Text>{displayTitle}</Text>
        )}
        {nightly && (
          <Box width="100%" flexDirection="row" justifyContent="flex-end">
            <Text>v{version}</Text>
          </Box>
        )}
      </Box>
      <Box>
        <Box
          width="auto"
          borderStyle="round"
          borderColor={theme.border.default}
          paddingLeft={1}
          paddingRight={1}
        >
          {debugMode && <DebugProfiler />}
          {vimMode && <Text color={theme.text.secondary}>[{vimMode}] </Text>}
          {nightly ? (
            <Gradient colors={theme.ui.gradient}>
              <Text>
                {displayPath}
                {branchName && <Text> ({branchName}*)</Text>}
              </Text>
            </Gradient>
          ) : (
            <Text color={theme.text.link}>
              {displayPath}
              {branchName && (
                <Text color={theme.text.secondary}> ({branchName}*)</Text>
              )}
            </Text>
          )}
          {debugMode && (
            <Text color={theme.status.error}>
              {' ' + (debugMessage || '--debug')}
            </Text>
          )}
        </Box>
      </Box>
    </Box>
  );
};
