import { describe, expect, it } from 'vitest';
import { createEmptyArmy, newEntryId } from './schema.ts';
import { resolveArmy } from './resolve.ts';
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

describe('resolveArmy', () => {
    it('costs an elite company by bases', () => {
        const army = createEmptyArmy();
        army.entries.push(company({ profileId: 'elite-company', companyCount: 2 }));
        const resolved = resolveArmy(army);
        const elite = resolved.entries.find((e) => e.profile.id === 'elite-company');
        expect(elite?.pointsEach).toBe(36);
        expect(elite?.pointsTotal).toBe(72);
        expect(resolved.totalPoints).toBe(60 + 72);
    });

    it('adds traits and a racial trope to irregulars', () => {
        const army = createEmptyArmy();
        army.racialTropeId = 'unreliable';
        army.entries.push(
            company({
                name: 'Goblin warriors',
                profileId: 'irregular-company',
                traitIds: ['shooting-mixed', 'furious-charge'],
            }),
        );
        const resolved = resolveArmy(army);
        const goblins = resolved.entries.find((e) => e.entry.name === 'Goblin warriors');
        expect(goblins?.pointsEach).toBe(22 - 4 + 4 + 3);
        expect(goblins?.stats.shootShort).toBe(2);
        expect(goblins?.stats.shootLong).toBe(1);
        expect(goblins?.traitIds).toContain('unreliable');
    });

    it('does not apply racial tropes to characters', () => {
        const army = createEmptyArmy();
        army.racialTropeId = 'doughty';
        const resolved = resolveArmy(army);
        const warlord = resolved.entries[0];
        expect(warlord.traitIds).not.toContain('doughty');
        expect(warlord.pointsEach).toBe(60);
    });

    it('flags incompatible traits', () => {
        const army = createEmptyArmy();
        army.entries.push(
            company({
                profileId: 'formed-company',
                traitIds: ['shieldwall', 'mounted'],
            }),
        );
        const resolved = resolveArmy(army);
        expect(resolved.issues.some((i) => i.message.includes('incompatible'))).toBe(true);
    });

    it('requires a single warlord or mage-lord', () => {
        const army = createEmptyArmy();
        army.entries = [
            {
                id: newEntryId(),
                kind: 'character',
                name: 'Captain',
                profileId: 'captain',
                traitIds: [],
                relicId: null,
                companyCount: 1,
                spells: [],
            },
        ];
        expect(resolveArmy(army).issues.some((i) => i.message.includes('must include 1 warlord'))).toBe(true);
    });

    it('allows a second rogue only with Cloaks and Daggers', () => {
        const army = createEmptyArmy();
        const rogue = (): ArmyEntry => ({
            id: newEntryId(),
            kind: 'character',
            name: 'Rogue',
            profileId: 'rogue',
            traitIds: [],
            relicId: null,
            companyCount: 1,
            spells: [],
        });
        army.entries.push(rogue(), rogue());
        expect(resolveArmy(army).issues.some((i) => i.message.includes('Too many rogues'))).toBe(true);
        army.strategyIds = ['cloaks-and-daggers'];
        expect(resolveArmy(army).issues.some((i) => i.message.includes('Too many rogues'))).toBe(false);
    });

    it('scales captain limits with the points cap', () => {
        const army = createEmptyArmy();
        army.pointsLimit = 500;
        for (let i = 0; i < 4; i += 1) {
            army.entries.push({
                id: newEntryId(),
                kind: 'character',
                name: `Captain ${i}`,
                profileId: 'captain',
                traitIds: [],
                relicId: null,
                companyCount: 1,
                spells: [],
            });
        }
        expect(resolveArmy(army).issues.some((i) => i.message.includes('Too many captains'))).toBe(true);
        army.pointsLimit = 1000;
        expect(resolveArmy(army).issues.some((i) => i.message.includes('Too many captains'))).toBe(false);
    });

    it('excludes expendable companies from the break point', () => {
        const army = createEmptyArmy();
        army.entries.push(company({ profileId: 'irregular-company', companyCount: 4, traitIds: ['expendable'] }), company({ profileId: 'formed-company', companyCount: 3 }));
        const resolved = resolveArmy(army);
        expect(resolved.companyCount).toBe(3);
        expect(resolved.breakPoint).toBe(2);
    });
});
