import { describe, expect, it } from 'vitest';
import { catalog } from './catalog.ts';
import { printReferenceRows } from './printReference.ts';
import { resolveArmy } from './resolve.ts';
import { createEmptyArmy, newEntryId } from './schema.ts';
import type { ArmyEntry } from './types.ts';

function company(partial: Partial<ArmyEntry> & Pick<ArmyEntry, 'profileId'>): ArmyEntry {
    return {
        id: newEntryId(),
        kind: 'company',
        name: partial.name ?? 'Company',
        profileId: partial.profileId,
        traitIds: partial.traitIds ?? [],
        relicId: partial.relicId ?? null,
        companyCount: partial.companyCount ?? 1,
        spells: partial.spells ?? [],
    };
}

describe('catalog descriptions', () => {
    it('gives every trait and relic a description', () => {
        for (const trait of catalog.traits) {
            expect(trait.description.trim().length, trait.id).toBeGreaterThan(0);
        }
        for (const relic of catalog.relics) {
            expect(relic.description.trim().length, relic.id).toBeGreaterThan(0);
        }
    });
});

describe('printReferenceRows', () => {
    it('is empty when no company has a trait or relic', () => {
        const resolved = resolveArmy(createEmptyArmy());
        expect(printReferenceRows(resolved.entries)).toEqual([]);
    });

    it('lists each used trait and relic once, including the racial trope', () => {
        const army = createEmptyArmy();
        army.racialTropeId = 'unreliable';
        army.entries[0] = {
            ...army.entries[0],
            relicId: 'winged-boots-of-alacrity',
        };
        army.entries.push(
            company({
                name: 'Goblins',
                profileId: 'irregular-company',
                traitIds: ['furious-charge', 'shooting-mixed'],
            }),
            company({
                name: 'More goblins',
                profileId: 'irregular-company',
                traitIds: ['furious-charge'],
                relicId: 'blade-of-unsurpassable-power',
            }),
        );

        const rows = printReferenceRows(resolveArmy(army).entries);
        expect(rows.map((row) => `${row.kind}:${row.name}`)).toEqual([
            'Magic item:Blade of Unsurpassable Power',
            'Trait:Furious charge',
            'Trait:Shooting (mixed)',
            'Trait:Unreliable',
            'Magic item:Winged Boots of Alacrity',
        ]);
        expect(rows.every((row) => row.description.length > 0)).toBe(true);
    });
});
