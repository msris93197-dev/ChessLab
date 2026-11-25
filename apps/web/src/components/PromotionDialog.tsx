type Props = { color: "w" | "b"; onPick: (piece: "q" | "r" | "b" | "n") => void; onCancel: () => void };

const PIECES = [
    { id: "q", name: "Queen", w: "♕", b: "♛" },
    { id: "r", name: "Rook", w: "♖", b: "♜" },
    { id: "b", name: "Bishop", w: "♗", b: "♝" },
    { id: "n", name: "Knight", w: "♘", b: "♞" },
] as const;

export function PromotionDialog({ color, onPick, onCancel }: Props) {
    return (
        <div role="dialog" aria-modal="true" aria-labelledby="promo-title" className="dialog-backdrop">
            <div className="dialog">
                <h2 id="promo-title">Promote pawn to</h2>
                <div className="promo-row">
                    {PIECES.map((p) => (
                        <button key={p.id} onClick={() => onPick(p.id)} aria-label={p.name} autoFocus={p.id === "q"}>
                            <span className="promo-glyph">{p[color]}</span>
                            {p.name}
                        </button>
                    ))}
                </div>
                <button className="link" onClick={onCancel}>Cancel</button>
            </div>
        </div>
    );
}