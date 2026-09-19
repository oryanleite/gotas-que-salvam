import { useId } from "react";

// ============================================================================
// Gota de sangue da marca Gotas que Salvam (mesmo desenho da foto de perfil
// do Instagram). Formato clássico de gota — ponta fina em cima, base redonda —
// com a balança da Justiça dentro.
//
// Geometria em um sistema de coordenadas próprio: a parte redonda tem raio 100
// e centro em (0, 0); a ponta fica em (0, -175). O viewBox abaixo dá uma folga
// de 4 unidades em volta.
// ============================================================================

export const DROP_VIEWBOX = "-104 -179 208 283";
export const DROP_PATH =
  "M0,-175 C22,-128 100,-78 100,0 A100 100 0 0 1 -100,0 C-100,-78 -22,-128 0,-175 Z";

// Balança: mesmo desenho do ícone antigo da logo (24×20 unidades), ampliado.
const S = 4.3;
const IX = -12 * S;
const IY = 8 - 10 * S;
const r = (x: number, y: number, w: number, h: number) => ({ x: IX + x * S, y: IY + y * S, width: w * S, height: h * S });
function panPath(px: number) {
  const x = IX + px * S, y = IY + 8 * S, W = 8 * S, H = 5.5 * S, t = 1.5 * S, rad = W / 2;
  return `M${x + t / 2},${y} L${x + t / 2},${y + H - rad} A${rad - t / 2} ${rad - t / 2} 0 0 0 ${x + W - t / 2},${y + H - rad} L${x + W - t / 2},${y}`;
}

export default function BloodDrop({ className, title }: { className?: string; title?: string }) {
  const gradientId = `drop-g-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const bars = [r(2, 3, 20, 2), r(11, 1.6, 2, 14.4), r(7, 15.4, 10, 1.6)];
  return (
    <svg
      className={className}
      viewBox={DROP_VIEWBOX}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={gradientId} x1="0.3" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#d0343a" />
          <stop offset=".55" stopColor="#a8161c" />
          <stop offset="1" stopColor="#7e0a10" />
        </linearGradient>
      </defs>
      <path d={DROP_PATH} fill={`url(#${gradientId})`} />
      {/* reflexo que dá volume */}
      <path d="M-62,-28 C-62,-72 -36,-108 -14,-134" fill="none" stroke="#fff" strokeOpacity=".34" strokeWidth="10" strokeLinecap="round" />
      {bars.map((b, i) => <rect key={i} {...b} rx={0.35 * S} fill="#fff" />)}
      <path d={panPath(0)} fill="none" stroke="#fff" strokeWidth={1.5 * S} strokeLinecap="round" />
      <path d={panPath(16)} fill="none" stroke="#fff" strokeWidth={1.5 * S} strokeLinecap="round" />
    </svg>
  );
}
