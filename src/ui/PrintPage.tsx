import { Link } from 'react-router-dom';
import { catalog, getRelic, getStrategy, getTrait } from '../domain/catalog.ts';
import { formatPoints, formatShoot } from '../domain/resolve.ts';
import { catalogLabel, useArmyStore, useResolvedArmy } from '../state/store.ts';

export function PrintPage() {
    const army = useArmyStore((s) => s.army);
    const resolved = useResolvedArmy();

    return (
        <div className="mx-auto max-w-4xl px-4 py-6">
            <div className="no-print mb-4 flex gap-2">
                <Link className="rounded border border-line px-3 py-1.5 text-sm" to="/">
                    Back to editor
                </Link>
                <button type="button" className="rounded bg-ink px-3 py-1.5 text-sm text-paper" onClick={() => window.print()}>
                    Print
                </button>
            </div>

            <header className="border-b border-ink pb-3">
                <p className="text-xs uppercase tracking-[0.2em] text-brass">{catalogLabel()}</p>
                <h1 className="text-3xl">{army.name || 'Unnamed army'}</h1>
                <p className="text-sm text-muted">
                    {resolved.totalPoints} / {army.pointsLimit} points · {resolved.companyCount} companies · break point {resolved.breakPoint}
                </p>
                <p className="text-sm">Racial trope: {army.racialTropeId ? (getTrait(army.racialTropeId)?.name ?? army.racialTropeId) : 'None'}</p>
                <p className="text-sm">
                    Strategies:{' '}
                    {army.strategyIds.length === 0
                        ? 'None'
                        : army.strategyIds
                              .map((id) => {
                                  const s = getStrategy(id);
                                  return s ? `${s.name} (${s.points})` : id;
                              })
                              .join(', ')}
                    {resolved.strategyPoints ? ` · ${formatPoints(resolved.strategyPoints)}` : ''}
                </p>
            </header>

            <table className="mt-4 w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b border-ink text-left">
                        <th className="py-1">Unit</th>
                        <th>Res</th>
                        <th>Mov</th>
                        <th>Mel</th>
                        <th>Sht</th>
                        <th>Def</th>
                        <th>Com</th>
                        <th>#</th>
                        <th className="text-right">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    {resolved.entries.map((item) => (
                        <tr key={item.entry.id} className="border-b border-line align-top">
                            <td className="py-2 pr-3">
                                <div className="font-medium">{item.entry.name || item.profile.name}</div>
                                <div className="text-xs text-muted">{item.profile.name}</div>
                                <div className="text-xs">
                                    {item.traitIds
                                        .map((id) => getTrait(id)?.name)
                                        .filter(Boolean)
                                        .join(', ') || 'No traits'}
                                    {item.entry.relicId ? ` · ${getRelic(item.entry.relicId)?.name}` : ''}
                                </div>
                                {item.entry.spells.some(Boolean) ? <div className="text-xs">Spells: {item.entry.spells.filter(Boolean).join(', ')}</div> : null}
                            </td>
                            <td>{item.stats.resolve}</td>
                            <td>{item.stats.move}</td>
                            <td>{item.stats.melee}</td>
                            <td>{formatShoot(item.stats)}</td>
                            <td>{item.stats.defence}</td>
                            <td>{item.stats.command}</td>
                            <td>{item.entry.companyCount}</td>
                            <td className="text-right">{item.pointsTotal}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <p className="mt-6 text-xs text-muted">Catalog encoded from the Fantastic Battles {catalog.version} army builder. This tool is unofficial and is not a substitute for the rulebook.</p>
        </div>
    );
}
