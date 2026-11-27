import { buildLevel, createMission, WORLD } from '../domain/mission.mjs';
import { renderLocation } from '../art/locations.mjs';
import { coastDimensions } from '../art/coast-scene.mjs';
import { renderGameOver } from '../art/game-over-ui.mjs';
import { templeDimensions } from '../art/temple-scene.mjs';
import { factoryDimensions } from '../art/factory-scene.mjs';
import { desertDimensions } from '../art/canyon-scene.mjs';
import { jungleDimensions } from '../art/jungle-scene.mjs';
import { volcanoDimensions } from '../art/volcano-scene.mjs';
import { levelMarkup } from '../art/level-art.mjs';
import { HUD, monthLabels } from '../art/profile-hud.mjs';
import { hudText } from '../art/hud-font.mjs';
import { pooledBulletMarkup } from './shot-pool.mjs';

import { normalizeWeeks } from '../calendar/calendar.mjs';
import { escapeXml, round, animationAttr } from './svg.mjs';
import { gridMarkup } from './calendar-grid.mjs';
import { effectsDefs } from './effects.mjs';
import { spriteDefs, playerMarkup } from './player.mjs';
const COLORS = ['#a8bcc4', '#166f43', '#22a857', '#3dd96b', '#b7ff63'];
const JUNGLE_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
const CANYON_COLORS = ['#2a5261', '#704a38', '#9d5c3c', '#c77c49', '#e3ac68'];
const SNOW_COLORS = ['#7192a6', '#477d94', '#63a4b3', '#91c4c5', '#d8b580'];
const COAST_COLORS = ['#96b4b7', '#2f535f', '#4a6b76', '#799b9b', '#c3bd92'];
const TEMPLE_COLORS = ['#a0aa92', '#4b5943', '#667751', '#92966a', '#c8b681'];
const FACTORY_COLORS = ['#90a5a1', '#695544', '#9c7156', '#bd8b62', '#dab27b'];
const { gridX: GRID_X, gridY: GRID_Y } = WORLD;
export function renderSvg({
  weeks,
  sprites,
  username,
  fixture = false,
  seedOverride,
  locationOverride,
}) {
  const grid = normalizeWeeks(weeks);
  const level = buildLevel(grid, username, seedOverride, locationOverride);
  const mission = createMission(grid, level);
  const canyon = level.location === 'desert';
  const jungle = level.location === 'jungle';
  const snow = level.location === 'snow';
  const factory = level.location === 'industrial';
  const temple = level.location === 'temple';
  const coast = level.location === 'coast';
  const labelFill = jungle
    ? '#c2cead'
    : coast
      ? '#e1dfce'
      : canyon
        ? '#38291f'
        : temple
          ? '#203d3c'
          : snow
            ? '#bdd5df'
            : factory
              ? '#d5d6bf'
              : '#d0e4e8';
  const titleFill = jungle
    ? '#dde0be'
    : coast
      ? '#f1e7c7'
      : canyon
        ? '#38291f'
        : temple
          ? '#203d3c'
          : snow
            ? '#e0e9e9'
            : factory
              ? '#e2dfc7'
              : '#f2f7fa';
  // Every released location shares the factory viewport and unscaled world coordinates.
  const official = ['industrial', 'desert', 'temple', 'coast'].includes(level.location);
  const pixelViewport = official
    ? factoryDimensions()
    : level.location === 'desert'
      ? desertDimensions()
      : level.location === 'volcano'
        ? volcanoDimensions()
        : level.location === 'jungle'
          ? jungleDimensions()
          : factory
            ? factoryDimensions()
            : temple
              ? templeDimensions()
              : coast
                ? coastDimensions()
                : null;
  const scaleMode =
    pixelViewport && pixelViewport.displayHeight !== pixelViewport.viewHeight
      ? ' preserveAspectRatio="none"'
      : '';
  const headerRoom = 32;
  const viewport = pixelViewport
    ? `width="${WORLD.width}" height="${pixelViewport.displayHeight + headerRoom}" viewBox="0 ${-headerRoom} ${WORLD.width} ${pixelViewport.viewHeight + headerRoom}"${scaleMode}`
    : `width="${WORLD.width}" height="${WORLD.height + headerRoom}" viewBox="0 ${-headerRoom} ${WORLD.width} ${WORLD.height + headerRoom}"`;
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" ${viewport} role="img" aria-labelledby="title desc"><title id="title">${escapeXml(username)} — Commando Activity</title><desc id="desc">An animated 8-bit soldier patrols the level, jumps over obstacles and shoots GitHub contribution cells. ${fixture ? 'Demo calendar data.' : 'GitHub calendar fetched from the GitHub API.'}</desc>`;
  const scene = renderLocation(level.location, level.seed);
  const defs = `<defs>
    <linearGradient id="contribution-scrim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05111e" stop-opacity=".93"/>
      <stop offset=".75" stop-color="#071927" stop-opacity=".82"/>
      <stop offset=".88" stop-color="#071927" stop-opacity=".70"/>
      <stop offset="1" stop-color="#071927" stop-opacity="0"/>
    </linearGradient>
    ${spriteDefs(sprites, level.location)}${effectsDefs(canyon)}
    <clipPath id="aim-upper"><rect x="-50" y="-50" width="180" height="93"/></clipPath>
    <clipPath id="aim-legs"><rect x="-50" y="43" width="180" height="100"/></clipPath>
  </defs>`;
  const fontKey = 'profile';
  const monthText = monthLabels(grid, { fontKey })
    .map((label) =>
      hudText(label.text, {
        month: label.month,
        x: label.x,
        y: GRID_Y - 14,
        fill: labelFill,
        size: HUD.monthSize,
        fontKey,
      }),
    )
    .join('');
  // Затемнение с мягкой границей вместо толстой HUD-рамки: поле — часть игрового мира.
  const scrim =
    pixelViewport || snow || factory
      ? ''
      : '<rect id="contribution-shade" x="0" y="0" width="1200" height="241" fill="url(#contribution-scrim)"/>';
  const gridStyle = {
    colors: canyon
      ? CANYON_COLORS
      : snow
        ? SNOW_COLORS
        : factory
          ? FACTORY_COLORS
          : temple
            ? TEMPLE_COLORS
            : coast
              ? COAST_COLORS
              : jungle
                ? JUNGLE_COLORS
                : COLORS,
    emptyOpacity: jungle
      ? '1'
      : canyon
        ? '0.08'
        : coast
          ? '0.12'
          : factory || temple
            ? '0.09'
            : '0.22',
    radius: String(HUD.radius),
    cellGrow: 0,
    emptyBorder: canyon
      ? ' stroke="#254a58" stroke-opacity=".32"'
      : snow
        ? ' stroke="#a1c4d3" stroke-opacity=".20"'
        : factory
          ? ' stroke="#95a8a1" stroke-opacity=".15"'
          : temple
            ? ' stroke="#708b7b" stroke-opacity=".23"'
            : coast
              ? ' stroke="#acc1c0" stroke-opacity=".19"'
              : jungle
                ? ' stroke="#30363d" stroke-opacity=".65"'
                : pixelViewport
                  ? ' stroke="#110c11" stroke-opacity=".75"'
                  : '',
    activeBorder: canyon
      ? ' stroke="#573627" stroke-opacity=".32"'
      : snow
        ? ' stroke="#223e55" stroke-opacity=".75"'
        : factory
          ? ' stroke="#514538" stroke-opacity=".38"'
          : temple
            ? ' stroke="#465943" stroke-opacity=".32"'
            : coast
              ? ' stroke="#264b58" stroke-opacity=".45"'
              : jungle
                ? ' stroke="#0b1720" stroke-opacity=".45"'
                : '',
  };
  const titleY = -8;
  const titleText = hudText(username + ' /', {
    id: 'hud-username',
    x: GRID_X,
    y: titleY,
    fill: titleFill,
    size: HUD.titleSize,
    fontKey,
  });
  const top = `<g id="contribution-overlay">${scrim}${titleText}${monthText}<g id="contribution-grid">${gridMarkup(grid, mission, gridStyle)}</g></g>`;
  const missionEnd = mission.duration;
  const finishedAt = round(Math.min(missionEnd - 0.5, mission.finishAt + 0.06));
  const fadeBegin = round(Math.min(mission.restoreStart + 0.28, missionEnd - 0.38));
  const fadeEnd = round(Math.min(fadeBegin + 0.55, missionEnd - 0.1));
  const missionComplete = animationAttr(
    'opacity',
    [0, round(finishedAt - 0.001), finishedAt, fadeBegin, fadeEnd, missionEnd],
    ['0', '0', '1', '1', '0', '0'],
    missionEnd,
    'linear',
  );
  const defaultVictory = `<rect x="410" y="230" width="380" height="60" rx="4" fill="#06151f" fill-opacity=".9" stroke="#86efac" stroke-width="2"/><text x="600" y="268" fill="#b5ff97" font-family="monospace" font-size="24" font-weight="bold" text-anchor="middle">MISSION COMPLETE</text>`;
  const victoryArt = ['desert', 'industrial', 'temple', 'coast'].includes(level.location)
    ? renderGameOver(level.location, { duration: missionEnd, finishedAt, fadeBegin })
    : defaultVictory;
  const done = `<g id="mission-complete" opacity="0">${missionComplete}${victoryArt}</g>`;
  const indicator = fixture
    ? `<text x="1118" y="20" text-anchor="end" font-family="monospace" font-size="13" fill="#fcd34d">DEMO / TEST DATA</text>`
    : '';
  const gameBody = `${scene}${top}${indicator}${levelMarkup(level)}${playerMarkup(mission)}${pooledBulletMarkup(mission)}${done}`;
  const headerFill =
    {
      industrial: '#476b70',
      desert: '#6197ac',
      temple: '#609697',
      coast: '#527c89',
      jungle: '#0d2630',
      volcano: '#080507',
    }[level.location] ?? '#102b35';
  const backdropHeight = headerRoom + (pixelViewport?.viewHeight ?? WORLD.height);
  return `${header}${defs}<rect id="hud-headroom" x="0" y="${-headerRoom}" width="${WORLD.width}" height="${backdropHeight}" fill="${headerFill}"/>${gameBody}</svg>\n`;
}
