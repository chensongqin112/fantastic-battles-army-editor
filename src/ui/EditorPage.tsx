import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { catalog, getTrait, racialTraitOptions } from '../domain/catalog.ts';
import { formatPoints, formatShoot } from '../domain/resolve.ts';
import type { ArmyEntry } from '../domain/types.ts';
import { decodeArmy, encodeArmy, SHARE_PARAM } from '../state/codec.ts';
import { catalogLabel, useArmyStore, useResolvedArmy } from '../state/store.ts';

const fieldClass =
    'w-full rounded border border-line bg-card px-2 py-1.5 text-sm text-ink outline-none focus:border-brass';
const btnClass =
    'rounded border border-line bg-card px-3 py-1.5 text-sm text-ink hover:border-brass';
const btnPrimary =
    'rounded bg-ink px-3 py-1.5 text-sm text-paper hover:bg-brass';

export function EditorPage() {
    const army = useArmyStore((s) => s.army);
    const { patchArmy, addEntry, updateEntry, removeEntry, resetArmy } = useArmyStore();
    const resolved = useResolvedArmy();
    const [searchParams] = useSearchParams();
    const [copied, setCopied] = useState(false);
    const payload = searchParams.get(SHARE_PARAM);
    const shareError = payload && !decodeArmy(payload) ? 'Could not read the shared army link.' : null;

    async function copyShareLink() {
        const url = `${window.location.origin}${window.location.pathname}#/?${SHARE_PARAM}=${encodeArmy(army)}`;
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
    }

    function downloadJson() {
        const blob = new Blob([JSON.stringify(army, null, 4)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${army.name.replace(/\s+/g, '-').toLowerCase() || 'army'}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const over = resolved.totalPoints > army.pointsLimit;
    const remaining = army.pointsLimit - resolved.totalPoints;

    return (
        <div className="mx-auto max-w-6xl px-4 py-6">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-brass">{catalogLabel()}</p>
                    <h1 className="mt-1 text-3xl text-ink">Army editor</h1>
                </div>
                <div className="no-print flex flex-wrap gap-2">
                    <button type="button" className={btnClass} onClick={() => addEntry('character')}>
                        Add character
                    </button>
                    <button type="button" className={btnClass} onClick={() => addEntry('company')}>
                        Add company
                    </button>
                    <button type="button" className={btnPrimary} onClick={() => void copyShareLink()}>
                        {copied ? 'Link copied' : 'Copy share link'}
                    </button>
                    <Link className={btnClass} to="/print">
                        Print view
                    </Link>
                    <button type="button" className={btnClass} onClick={downloadJson}>
                        Export JSON
                    </button>
                    <button type="button" className={btnClass} onClick={resetArmy}>
                        New army
                    </button>
                </div>
            </header>

            {shareError ? <p className="mb-4 text-sm text-alert">{shareError}</p> : null}

            <section className="mb-6 grid gap-4 md:grid-cols-4">
                <label className="block text-sm">
                    Army name
                    <input className={`${fieldClass} mt-1`} value={army.name} onChange={(e) => patchArmy({ name: e.target.value })} />
                </label>
                <label className="block text-sm">
                    Points limit
                    <input className={`${fieldClass} mt-1`} type="number" min={0} step={50} value={army.pointsLimit} onChange={(e) => patchArmy({ pointsLimit: Number(e.target.value) || 0 })} />
                </label>
                <label className="block text-sm">
                    Racial trope
                    <select className={`${fieldClass} mt-1`} value={army.racialTropeId ?? ''} onChange={(e) => patchArmy({ racialTropeId: e.target.value || null })}>
                        <option value="">None</option>
                        {racialTraitOptions().map((trait) => (
                            <option key={trait.id} value={trait.id}>
                                {trait.name} ({trait.points >= 0 ? '+' : ''}
                                {trait.points})
                            </option>
                        ))}
                    </select>
                </label>
                <div className="rounded border border-line bg-card px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted">Points</p>
                    <p className={`text-2xl ${over ? 'text-alert' : 'text-ink'}`}>
                        {resolved.totalPoints}
                        <span className="text-base text-muted"> / {army.pointsLimit}</span>
                    </p>
                    <p className="text-xs text-muted">
                        {over ? `${-remaining} over` : `${remaining} remaining`} · {resolved.companyCount} companies · break {resolved.breakPoint}
                    </p>
                </div>
            </section>

            <section className="mb-6">
                <h2 className="mb-2 text-lg">Strategies</h2>
                <div className="flex flex-wrap gap-3">
                    {catalog.strategies.map((strategy) => {
                        const checked = army.strategyIds.includes(strategy.id);
                        const disabled = !checked && army.strategyIds.length >= catalog.limits.maxStrategies;
                        return (
                            <label key={strategy.id} className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    disabled={disabled}
                                    onChange={() => {
                                        const next = checked ? army.strategyIds.filter((id) => id !== strategy.id) : [...army.strategyIds, strategy.id];
                                        patchArmy({ strategyIds: next });
                                    }}
                                />
                                {strategy.name} ({strategy.points})
                            </label>
                        );
                    })}
                </div>
            </section>

            {resolved.issues.length > 0 ? (
                <ul className="mb-6 list-disc rounded border border-alert/40 bg-card px-6 py-3 text-sm text-alert">
                    {resolved.issues.map((issue) => (
                        <li key={issue.message}>{issue.message}</li>
                    ))}
                </ul>
            ) : null}

            <div className="grid gap-4">
                {army.entries.map((entry) => (
                    <UnitEditor key={entry.id} entry={entry} onChange={(patch) => updateEntry(entry.id, patch)} onRemove={() => removeEntry(entry.id)} />
                ))}
            </div>
        </div>
    );
}

function UnitEditor({ entry, onChange, onRemove }: { entry: ArmyEntry; onChange: (patch: Partial<ArmyEntry>) => void; onRemove: () => void }) {
    const resolved = useResolvedArmy();
    const item = resolved.entries.find((e) => e.entry.id === entry.id);
    const profiles = entry.kind === 'character' ? catalog.characters : catalog.companies;
    const profile = profiles.find((p) => p.id === entry.profileId) ?? profiles[0];
    const showSpells = entry.profileId === 'magic-user' || entry.profileId === 'mage-lord' || entry.traitIds.includes('character-magic-user') || entry.traitIds.includes('character-mage-lord');
    const canTraits = Boolean(profile?.mayTakeTraits);

    const traitChoices = useMemo(() => {
        return catalog.traits.filter((trait) => {
            if (entry.traitIds.includes(trait.id) && !canTraits) return false;
            return true;
        });
    }, [entry.traitIds, canTraits]);

    return (
        <article className="rounded border border-line bg-card p-4">
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-brass">{entry.kind === 'character' ? 'Character' : 'Company'}</p>
                    <h3 className="text-xl">{entry.name || profile?.name}</h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    {item ? (
                        <span>
                            {formatPoints(item.pointsEach)}
                            {entry.companyCount > 1 ? ` × ${entry.companyCount} = ${formatPoints(item.pointsTotal)}` : ''}
                        </span>
                    ) : null}
                    <button type="button" className={btnClass} onClick={onRemove}>
                        Remove
                    </button>
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
                <label className="text-sm">
                    Name
                    <input className={`${fieldClass} mt-1`} value={entry.name} onChange={(e) => onChange({ name: e.target.value })} />
                </label>
                <label className="text-sm">
                    Profile
                    <select
                        className={`${fieldClass} mt-1`}
                        value={entry.profileId}
                        onChange={(e) => {
                            const next = profiles.find((p) => p.id === e.target.value);
                            onChange({
                                profileId: e.target.value,
                                name: entry.name === profile?.name ? (next?.name ?? entry.name) : entry.name,
                                traitIds: next?.mayTakeTraits ? entry.traitIds : [],
                            });
                        }}
                    >
                        {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name} ({p.points})
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm">
                    Companies
                    <input className={`${fieldClass} mt-1`} type="number" min={1} max={12} value={entry.companyCount} onChange={(e) => onChange({ companyCount: Math.max(1, Number(e.target.value) || 1) })} />
                </label>
                <label className="text-sm">
                    Relic
                    <select className={`${fieldClass} mt-1`} value={entry.relicId ?? ''} onChange={(e) => onChange({ relicId: e.target.value || null })}>
                        <option value="">None</option>
                        {catalog.relics.map((relic) => (
                            <option key={relic.id} value={relic.id}>
                                {relic.name} ({relic.points})
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {canTraits ? (
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {[0, 1, 2].map((slot) => (
                        <label key={slot} className="text-sm">
                            Trait {slot + 1}
                            <select
                                className={`${fieldClass} mt-1`}
                                value={entry.traitIds[slot] ?? ''}
                                onChange={(e) => {
                                    const next = [entry.traitIds[0] ?? '', entry.traitIds[1] ?? '', entry.traitIds[2] ?? ''];
                                    next[slot] = e.target.value;
                                    onChange({ traitIds: next.filter(Boolean).slice(0, 3) });
                                }}
                            >
                                <option value="">None</option>
                                {traitChoices.map((trait) => (
                                    <option key={trait.id} value={trait.id} disabled={entry.traitIds.includes(trait.id) && entry.traitIds[slot] !== trait.id}>
                                        {trait.name} ({trait.points >= 0 ? '+' : ''}
                                        {trait.points})
                                    </option>
                                ))}
                            </select>
                        </label>
                    ))}
                </div>
            ) : (
                <p className="mt-3 text-sm text-muted">Characters may not be given unit traits.</p>
            )}

            {showSpells ? (
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {[0, 1, 2].map((slot) => (
                        <label key={slot} className="text-sm">
                            Spell {slot + 1}
                            <input
                                className={`${fieldClass} mt-1`}
                                value={entry.spells[slot] ?? ''}
                                onChange={(e) => {
                                    const next = [...entry.spells];
                                    next[slot] = e.target.value;
                                    onChange({ spells: next });
                                }}
                            />
                        </label>
                    ))}
                </div>
            ) : null}

            {item ? (
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-7">
                    <Stat label="Res" value={item.stats.resolve} />
                    <Stat label="Mov" value={item.stats.move} />
                    <Stat label="Mel" value={item.stats.melee} />
                    <Stat label="Sht" value={formatShoot(item.stats)} />
                    <Stat label="Def" value={item.stats.defence} />
                    <Stat label="Com" value={item.stats.command} />
                    <Stat
                        label="Traits"
                        value={
                            item.traitIds
                                .map((id) => getTrait(id)?.name)
                                .filter(Boolean)
                                .join(', ') || '—'
                        }
                    />
                </dl>
            ) : null}
        </article>
    );
}

function Stat({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded bg-paper px-2 py-2">
            <dt className="uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-0.5 text-sm text-ink">{value}</dd>
        </div>
    );
}
