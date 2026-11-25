type Props = { sans: string[]; current?: number; onSelect?: (ply: number) => void; highlight?: number[] };

export function MoveList({ sans, current, onSelect, highlight = [] }: Props) {
    const rows: { n: number; white: number; black?: number }[] = [];
    for (let i = 0; i < sans.length; i += 2) rows.push({ n: i / 2 + 1, white: i, black: i + 1 < sans.length ? i + 1 : undefined });
    const cell = (ply?: number) =>
        ply === undefined ? <td /> : (
            <td>
                <button
                    className={`move ${ply === current ? "current" : ""} ${highlight.includes(ply) ? "flagged" : ""}`}
                    onClick={() => onSelect?.(ply)}
                    aria-current={ply === current ? "step" : undefined}
                >
                    {sans[ply]}
                </button>
            </td>
        );
    return (
        <table className="move-list" aria-label="Moves">
            <tbody>
                {rows.map((r) => (
                    <tr key={r.n}>
                        <th scope="row">{r.n}.</th>
                        {cell(r.white)}
                        {cell(r.black)}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}