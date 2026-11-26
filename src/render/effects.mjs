/** Общие пиксельные формы, которые повторно используются каждым выстрелом. */
export function effectsDefs(canyon) {
  const impactCore = canyon ? '#cf805e' : '#fff3a8';
  const breakCore = canyon ? '#d69a65' : '#fff1a0';
  return `<g id="fx-muzzle" shape-rendering="crispEdges">
    <path d="M0 -2h5v-3h5v-3h4v5h5v6h-6v5h-4v-4H5v-2H0Z" fill="#ff9e20"/>
    <path d="M0 -1h7v-2h5v2h4v3h-5v2H7V2H0Z" fill="#fff4a8"/>
    <rect x="17" y="-1" width="4" height="2" fill="#ffd064"/>
  </g>
  <g id="fx-impact-damage" shape-rendering="crispEdges">
    <path d="M-2 -10h4v7h7v5H2v7h-4V2h-7v-5h7z" fill="${impactCore}"/>
    <rect x="-12" y="-3" width="4" height="4" fill="#ff9b2c"/>
    <rect x="8" y="-8" width="4" height="4" fill="#ff9b2c"/>
    <rect x="5" y="8" width="3" height="3" fill="#4ae78a"/>
  </g>
  <g id="fx-impact-break" shape-rendering="crispEdges">
    <rect x="-6" y="-6" width="12" height="12" fill="${breakCore}"/>
    <path d="M-3 -12h6v6h8v6H5v6h-10V0h-7v-6h9z" fill="#ff9b2c"/>
    <rect x="-18" y="-12" width="5" height="5" fill="#ffd75e"/>
    <rect x="13" y="-11" width="6" height="5" fill="#ffcd48"/>
    <rect x="-19" y="9" width="5" height="5" fill="#ec6b2e"/>
    <rect x="12" y="13" width="5" height="5" fill="#ec6b2e"/>
    <rect x="-5" y="-22" width="4" height="5" fill="#68e887"/>
    <rect x="2" y="18" width="5" height="4" fill="#68e887"/>
    <rect x="-24" y="-2" width="5" height="4" fill="#78c957"/>
    <rect x="19" y="3" width="5" height="4" fill="#78c957"/>
  </g>`;
}
