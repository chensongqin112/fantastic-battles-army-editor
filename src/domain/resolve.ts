import { catalog, getProfile, getRelic, getStrategy, getTrait } from './catalog.ts';
import type {
    ArmyDocument,
    ArmyIssue,
    CharacterRole,
    ResolvedArmy,
    ResolvedEntry,
    ResolvedStats,
    StatKey,
    StatMods,
} from './types.ts';

const STAT_KEYS: StatKey[] = ['resolve', 'move', 'melee', 'shootShort', 'shootLong', 'defence', 'command'];

const TRAIT_ROLE: Record<string, CharacterRole> = {
    'character-warlord': 'warlord',
    'character-mage-lord': 'mage-lord',
    'character-captain': 'captain',
    'character-magic-user': 'magic-user',
};

const PROFILE_ROLE: Partial<Record<string, CharacterRole>> = {
    warlord: 'warlord',
    'mage-lord': 'mage-lord',
    captain: 'captain',
    'magic-user': 'magic-user',
    rogue: 'rogue',
};

function applyMods(stats: ResolvedStats, mods: StatMods, mode: 'set' | 'add'): void {
    for (const key of STAT_KEYS) {
        const value = mods[key];
        if (value === undefined) continue;
        if (mode === 'set') stats[key] = value;
        else stats[key] += value;
    }
}

function hasCharacterTrait(traitIds: string[]): boolean {
    return traitIds.some((id) => getTrait(id)?.isCharacterTrait);
}

export function effectiveTraitIds(army: ArmyDocument, entry: ArmyDocument['entries'][number]): string[] {
    const ids = [...entry.traitIds];
    if (army.racialTropeId && entry.kind === 'company' && !hasCharacterTrait(ids)) {
        ids.push(army.racialTropeId);
    }
    return ids;
}

export function rolesFor(entry: ArmyDocument['entries'][number], traitIds: string[]): CharacterRole[] {
    const roles = new Set<CharacterRole>();
    const fromProfile = PROFILE_ROLE[entry.profileId];
    if (fromProfile) roles.add(fromProfile);
    for (const id of traitIds) {
        const role = TRAIT_ROLE[id];
        if (role) roles.add(role);
    }
    return [...roles];
}

function resolveOne(army: ArmyDocument, entry: ArmyDocument['entries'][number]): ResolvedEntry | ArmyIssue {
    const profile = getProfile(entry.profileId);
    if (!profile) {
        return { level: 'error', message: `${entry.name || 'Unit'} uses unknown profile "${entry.profileId}".` };
    }

    const traitIds = effectiveTraitIds(army, entry);
    const stats: ResolvedStats = {
        resolve: profile.resolve,
        move: profile.move,
        melee: profile.melee,
        shootShort: profile.shootShort,
        shootLong: profile.shootLong,
        defence: profile.defence,
        command: profile.command,
    };

    let pointsEach = profile.points;
    for (const id of traitIds) {
        const trait = getTrait(id);
        if (!trait) continue;
        applyMods(stats, trait.set, 'set');
        applyMods(stats, trait.add, 'add');
        pointsEach += trait.points;
    }

    if (entry.relicId) {
        const relic = getRelic(entry.relicId);
        if (relic) {
            applyMods(stats, relic.set, 'set');
            applyMods(stats, relic.add, 'add');
            pointsEach += relic.points;
        }
    }

    return {
        entry,
        profile,
        stats,
        traitIds,
        pointsEach,
        pointsTotal: pointsEach * entry.companyCount,
        roles: rolesFor(entry, traitIds),
        expendable: traitIds.includes('expendable'),
    };
}

function allotment(per500: number, pointsLimit: number): number {
    const blocks = Math.max(1, Math.ceil(pointsLimit / 500));
    return per500 * blocks;
}

function collectIssues(army: ArmyDocument, resolved: ResolvedEntry[]): ArmyIssue[] {
    const issues: ArmyIssue[] = [];
    const { limits } = catalog;

    if (army.strategyIds.length > limits.maxStrategies) {
        issues.push({ level: 'error', message: `At most ${limits.maxStrategies} strategies may be taken.` });
    }
    if (new Set(army.strategyIds).size !== army.strategyIds.length) {
        issues.push({ level: 'error', message: 'Strategies must be unique.' });
    }
    for (const id of army.strategyIds) {
        if (!getStrategy(id)) issues.push({ level: 'error', message: `Unknown strategy "${id}".` });
    }
    if (army.racialTropeId && !getTrait(army.racialTropeId)) {
        issues.push({ level: 'error', message: `Unknown racial trope "${army.racialTropeId}".` });
    }
    if (army.racialTropeId && getTrait(army.racialTropeId)?.isCharacterTrait) {
        issues.push({ level: 'error', message: 'A character trait cannot be a racial trope.' });
    }

    let warlords = 0;
    let captains = 0;
    let mages = 0;
    let rogues = 0;

    for (const item of resolved) {
        const { entry, profile, traitIds } = item;
        const label = entry.name || profile.name;

        if (entry.kind === 'character' && !catalog.characters.some((c) => c.id === entry.profileId)) {
            issues.push({ level: 'error', message: `${label} is not a character profile.` });
        }
        if (entry.kind === 'company' && !catalog.companies.some((c) => c.id === entry.profileId)) {
            issues.push({ level: 'error', message: `${label} is not a company profile.` });
        }
        if (!profile.mayTakeTraits && entry.traitIds.length > 0) {
            issues.push({ level: 'error', message: `${label} may not be given traits.` });
        }
        if (entry.traitIds.length > limits.maxTraitsPerCompany) {
            issues.push({
                level: 'error',
                message: `${label} has more than ${limits.maxTraitsPerCompany} traits.`,
            });
        }
        if (new Set(entry.traitIds).size !== entry.traitIds.length) {
            issues.push({ level: 'error', message: `${label} has duplicate traits.` });
        }
        if (army.racialTropeId && entry.traitIds.includes(army.racialTropeId)) {
            issues.push({
                level: 'error',
                message: `${label} repeats the army racial trope as a distinguishing trait.`,
            });
        }

        for (const id of traitIds) {
            if (!getTrait(id)) issues.push({ level: 'error', message: `${label} has unknown trait "${id}".` });
        }
        if (entry.relicId && !getRelic(entry.relicId)) {
            issues.push({ level: 'error', message: `${label} has unknown relic "${entry.relicId}".` });
        }

        for (let i = 0; i < traitIds.length; i += 1) {
            for (let j = i + 1; j < traitIds.length; j += 1) {
                const a = getTrait(traitIds[i]);
                const b = getTrait(traitIds[j]);
                if (!a || !b) continue;
                if (a.incompatibleWith.includes(b.id) || b.incompatibleWith.includes(a.id)) {
                    issues.push({
                        level: 'error',
                        message: `${label}: ${a.name} is incompatible with ${b.name}.`,
                    });
                }
            }
        }

        if (item.roles.includes('warlord') || item.roles.includes('mage-lord')) warlords += 1;
        if (item.roles.includes('captain')) captains += 1;
        if (item.roles.includes('magic-user') || item.roles.includes('mage-lord')) mages += 1;
        if (item.roles.includes('rogue')) rogues += 1;
    }

    if (warlords < 1) {
        issues.push({ level: 'error', message: 'Army must include 1 warlord or mage-lord.' });
    } else if (warlords > limits.warlordOrMageLord) {
        issues.push({ level: 'error', message: 'Army may include only 1 warlord or mage-lord.' });
    }

    const maxCaptains = allotment(limits.captainsPer500, army.pointsLimit);
    if (captains > maxCaptains) {
        issues.push({
            level: 'error',
            message: `Too many captains (${captains}; max ${maxCaptains} at ${army.pointsLimit} points).`,
        });
    }

    const maxMages = allotment(limits.magicUsersPer500, army.pointsLimit);
    if (mages > maxMages) {
        issues.push({
            level: 'error',
            message: `Too many magic-users (${mages}; max ${maxMages} at ${army.pointsLimit} points).`,
        });
    }

    const cloaks = army.strategyIds.includes('cloaks-and-daggers');
    const maxRogues = cloaks ? limits.roguesWithCloaksAndDaggers : limits.roguesDefault;
    if (rogues > maxRogues) {
        issues.push({
            level: 'error',
            message: cloaks ? `Too many rogues (${rogues}; max ${maxRogues} with Cloaks and Daggers).` : `Too many rogues (${rogues}; max ${maxRogues}, or ${limits.roguesWithCloaksAndDaggers} with Cloaks and Daggers).`,
        });
    }

    return issues;
}

export function formatShoot(stats: ResolvedStats): string {
    if (stats.shootShort === 0 && stats.shootLong === 0) return '-';
    return `${stats.shootShort}/${stats.shootLong}`;
}

export function formatPoints(n: number): string {
    return `${n} pts`;
}

export function resolveArmy(army: ArmyDocument): ResolvedArmy {
    const entries: ResolvedEntry[] = [];
    const issues: ArmyIssue[] = [];

    for (const entry of army.entries) {
        const result = resolveOne(army, entry);
        if ('level' in result) issues.push(result);
        else entries.push(result);
    }

    const strategyPoints = army.strategyIds.reduce((sum, id) => sum + (getStrategy(id)?.points ?? 0), 0);
    const totalPoints = entries.reduce((sum, e) => sum + e.pointsTotal, 0) + strategyPoints;
    const scoringCompanies = entries.filter((e) => e.entry.kind === 'company' && !e.expendable).reduce((sum, e) => sum + e.entry.companyCount, 0);
    const breakPoint = scoringCompanies === 0 ? 0 : Math.floor(scoringCompanies / 2) + 1;

    issues.push(...collectIssues(army, entries));
    if (totalPoints > army.pointsLimit) {
        issues.push({
            level: 'error',
            message: `Army is ${totalPoints - army.pointsLimit} points over the ${army.pointsLimit} limit.`,
        });
    }

    return {
        army,
        entries,
        strategyPoints,
        totalPoints,
        companyCount: scoringCompanies,
        breakPoint,
        issues,
    };
}
