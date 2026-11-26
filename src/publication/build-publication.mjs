import { createHash } from 'node:crypto';
import { selectDailyLocation } from './daily-location.mjs';
import { normalizeWeeks } from '../calendar/calendar.mjs';
import { renderSvg } from '../render/render-svg.mjs';
const hash = (text) => createHash('sha256').update(text).digest('hex');
export function buildDailyPublication({
  settings,
  previous,
  now,
  weeks,
  sprites,
  username = '0w1Max',
  demo = false,
}) {
  const selected = selectDailyLocation(settings, previous, now);
  const grid = normalizeWeeks(weeks),
    days = grid.flat().filter(Boolean);
  let svg = renderSvg({
    weeks,
    sprites,
    username,
    fixture: demo,
    seedOverride: selected.seed,
    locationOverride: selected.location,
  });
  svg = svg.replace(
    ' role="img"',
    ` data-profile-date="${selected.date}" data-project-version="${settings.version}" role="img"`,
  );
  const state = {
    ...selected,
    fixture: demo,
    calendarDays: days.length,
    calendarLastDate: days
      .map((d) => d.date)
      .sort()
      .at(-1),
    svgSha256: hash(svg),
  };
  return { svg, state };
}
