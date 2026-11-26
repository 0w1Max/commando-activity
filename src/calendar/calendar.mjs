const LEVELS = ['NONE', 'FIRST_QUARTILE', 'SECOND_QUARTILE', 'THIRD_QUARTILE', 'FOURTH_QUARTILE'];
export function normalizeWeeks(weeks) {
  if (!Array.isArray(weeks) || weeks.length < 1 || weeks.length > 55)
    throw new Error('Неверное количество недель');
  const normalized = Array.from({ length: Math.max(53, weeks.length) }, () => Array(7).fill(null));
  const pad = normalized.length - weeks.length;
  const dates = new Set();
  let previousDate = '';
  let firstSunday, firstColumn;
  for (let c = 0; c < weeks.length; c++) {
    const week = weeks[c];
    if (!Array.isArray(week?.contributionDays) || week.contributionDays.length > 7)
      throw new Error('Некорректная структура недели');
    for (const d of week.contributionDays) {
      if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) throw new Error('Некорректная дата календаря');
      const parsed = new Date(`${d.date}T12:00:00Z`);
      const dow = parsed.getUTCDay();
      if (
        !Number.isFinite(parsed.getTime()) ||
        parsed.toISOString().slice(0, 10) !== d.date ||
        dates.has(d.date) ||
        d.date <= previousDate ||
        normalized[c + pad][dow]
      )
        throw new Error('Повторная или некорректная дата календаря');
      const sunday = parsed.getTime() - dow * 86400000;
      if (firstSunday === undefined) {
        firstSunday = sunday;
        firstColumn = c;
      }
      if (sunday !== firstSunday + (c - firstColumn) * 7 * 86400000)
        throw new Error('Нарушена последовательность недель календаря');
      dates.add(d.date);
      previousDate = d.date;
      if (
        !Number.isInteger(d.contributionCount) ||
        d.contributionCount < 0 ||
        !LEVELS.includes(d.contributionLevel) ||
        !Number.isFinite(dow)
      )
        throw new Error('Некорректный день календаря');
      normalized[c + pad][dow] = {
        date: d.date,
        count: d.contributionCount,
        level: LEVELS.indexOf(d.contributionLevel),
      };
    }
  }
  return normalized;
}
