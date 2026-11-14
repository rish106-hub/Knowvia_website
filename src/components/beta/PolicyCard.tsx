"use client";

import { useState } from "react";
import { BADGE_LABEL, sourceLine } from "@/lib/beta/tiles";
import type { CardTileData, TileId, TileSource } from "@/lib/beta/types";

function SourcePanel({ source }: { source: TileSource }) {
  const where = sourceLine(source);
  return (
    <div className="beta-source">
      {where && <p className="beta-where">{where}</p>}
      <blockquote>{source.quote}</blockquote>
    </div>
  );
}

function Tile({ tile, onResolve }: { tile: CardTileData; onResolve?: (id: TileId, pick: 0 | 1) => void }) {
  const [open, setOpen] = useState(false);
  const badge = tile.conflict ? null : tile.badge;
  return (
    <li className="beta-tile" data-badge={tile.conflict ? "conflict" : tile.badge}>
      <button type="button" className="beta-tile-tap" aria-expanded={open} disabled={!tile.source && !tile.conflict} onClick={() => setOpen(o => !o)}>
        <span className="beta-label">{tile.title}</span>
        <strong>{tile.conflict ? "Your documents show two values" : tile.value ?? "Your documents don't say"}</strong>
        {badge && <span className="beta-badge" data-badge={badge}>{BADGE_LABEL[badge]}</span>}
      </button>
      {tile.note && <em>{tile.note}</em>}
      {open && tile.source && <SourcePanel source={tile.source} />}
      {tile.conflict && (
        <div className="beta-conflict">
          {tile.conflict.map((v, i) => (
            <div key={i} className="beta-source">
              <p className="beta-where"><strong>{v.label}</strong>: {v.value}</p>
              {open && <SourcePanel source={v.source} />}
            </div>
          ))}
          <p className="beta-why">Which is right?</p>
          <div className="beta-chips">
            {tile.conflict.map((v, i) => <button key={i} type="button" className="beta-chip" onClick={() => onResolve?.(tile.id, i as 0 | 1)}>{v.value}</button>)}
          </div>
        </div>
      )}
    </li>
  );
}

export function PolicyCard({ tiles, productLine, onResolve }: { tiles: CardTileData[]; productLine?: string; onResolve?: (id: TileId, pick: 0 | 1) => void }) {
  return (
    <div className="beta-policy">
      {productLine && <p className="beta-product">{productLine}</p>}
      <ul className="beta-tiles">{tiles.map(t => <Tile key={t.id} tile={t} onResolve={onResolve} />)}</ul>
    </div>
  );
}
