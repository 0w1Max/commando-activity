import { createHash } from 'node:crypto';
import { OFFICIAL_LOCATIONS, validateSettings } from './daily-location.mjs';
/** Enforce this generator's local-only output contract, not arbitrary SVG sanitization. */
export function validateSvgContent(svg) {
  if (
    /<!DOCTYPE|<!ENTITY|<\?(?!xml\s)|<script\b|<image\b|data:image\/|<foreignObject\b|\bon[a-z]+\s*=|@import/i.test(
      svg,
    )
  )
    throw Error('Unsafe SVG content');
  for (const match of svg.matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi)) {
    if (!/^#[a-z][\w:.-]*$/i.test(match[2])) throw Error('External SVG reference');
  }
  for (const [, value] of svg.matchAll(/url\(([^)]*)\)/gi)) {
    if (!/^#[a-z][\w:.-]*$/i.test(value.trim().replace(/^["']|["']$/g, '')))
      throw Error('External SVG paint source');
  }
}

export function validatePublication(svg, state, settings, { allowDemo = false } = {}) {
  validateSettings(settings);
  if (!OFFICIAL_LOCATIONS.includes(state.location) || state.version !== settings.version)
    throw Error('Unapproved publication');
  if (state.seed !== settings.seeds[state.location]) throw Error('Unapproved layout seed');
  if (state.svgSha256 !== createHash('sha256').update(svg).digest('hex'))
    throw Error('SVG/state checksum mismatch');
  if (!allowDemo && (state.fixture || /DEMO \/ TEST DATA/.test(svg)))
    throw Error('Fixture publication rejected');
  validateSvgContent(svg);
  for (const marker of [
    `data-profile-date="${state.date}"`,
    `data-project-version="${settings.version}"`,
    `data-location="${state.location}"`,
    'id="contribution-grid"',
    'id="blue-commando"',
    'GAME OVER',
  ])
    if (!svg.includes(marker)) throw Error('Missing publication marker: ' + marker);
  if (!allowDemo && !svg.includes('GitHub calendar fetched from the GitHub API.'))
    throw Error('Missing live calendar provenance');
  const cells = [
    ...svg.matchAll(
      /<rect x="([0-9.]+)" y="([0-9.]+)" width="18" height="18" rx="3"[^>]*><title>(\d{4}-\d{2}-\d{2}): (\d+) contributions<\/title>/g,
    ),
  ];
  if (cells.length !== state.calendarDays || cells.length < 1 || cells.length > 385)
    throw Error('Calendar size mismatch');
  if (!svg.includes(`data-month="${state.calendarLastDate.slice(0, 7)}"`))
    throw Error('Latest month label is missing');
  if (state.previousDate !== state.date && state.previousLocation === state.location)
    throw Error('Consecutive published locations repeat');
  return { location: state.location, date: state.date, cells: cells.length };
}
