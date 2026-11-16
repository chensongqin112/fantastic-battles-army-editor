import { getRelic, getTrait } from './catalog.ts';
import type { ResolvedEntry } from './types.ts';

export interface PrintReferenceRow {
    id: string;
    kind: 'Trait' | 'Magic item';
    name: string;
    description: string;
}

export function printReferenceRows(entries: ResolvedEntry[]): PrintReferenceRow[] {
    const traits = new Map<string, PrintReferenceRow>();
    const relics = new Map<string, PrintReferenceRow>();

    for (const item of entries) {
        for (const id of item.traitIds) {
            const trait = getTrait(id);
            if (!trait || traits.has(trait.id)) continue;
            traits.set(trait.id, {
                id: trait.id,
                kind: 'Trait',
                name: trait.name,
                description: trait.description,
            });
        }
        if (item.entry.relicId) {
            const relic = getRelic(item.entry.relicId);
            if (!relic || relics.has(relic.id)) continue;
            relics.set(relic.id, {
                id: relic.id,
                kind: 'Magic item',
                name: relic.name,
                description: relic.description,
            });
        }
    }

    return [...traits.values(), ...relics.values()].sort((a, b) => a.name.localeCompare(b.name) || a.kind.localeCompare(b.kind));
}
