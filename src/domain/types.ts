export type StatKey =
    | 'resolve'
    | 'move'
    | 'melee'
    | 'shootShort'
    | 'shootLong'
    | 'defence'
    | 'command';

export interface StatMods {
    resolve?: number;
    move?: number;
    melee?: number;
    shootShort?: number;
    shootLong?: number;
    defence?: number;
    command?: number;
}

export interface Profile {
    id: string;
    name: string;
    resolve: number;
    move: number;
    melee: number;
    shootShort: number;
    shootLong: number;
    defence: number;
    command: number;
    points: number;
    mayTakeTraits: boolean;
    limitNote: string | null;
}

export interface Trait {
    id: string;
    name: string;
    description: string;
    points: number;
    add: StatMods;
    set: StatMods;
    incompatibleWith: string[];
    isCharacterTrait: boolean;
}

export interface Relic {
    id: string;
    name: string;
    description: string;
    points: number;
    add: StatMods;
    set: StatMods;
}

export interface Strategy {
    id: string;
    name: string;
    points: number;
}

export interface CatalogLimits {
    maxTraitsPerCompany: number;
    maxStrategies: number;
    warlordOrMageLord: number;
    captainsPer500: number;
    magicUsersPer500: number;
    roguesDefault: number;
    roguesWithCloaksAndDaggers: number;
    spellSlots: number;
}

export interface Catalog {
    version: string;
    characters: Profile[];
    companies: Profile[];
    traits: Trait[];
    relics: Relic[];
    strategies: Strategy[];
    limits: CatalogLimits;
}

export type EntryKind = 'character' | 'company';

export interface ArmyEntry {
    id: string;
    kind: EntryKind;
    name: string;
    profileId: string;
    traitIds: string[];
    relicId: string | null;
    companyCount: number;
    spells: string[];
}

export interface ArmyDocument {
    schemaVersion: 1;
    catalogVersion: string;
    name: string;
    pointsLimit: number;
    racialTropeId: string | null;
    strategyIds: string[];
    entries: ArmyEntry[];
}

export interface ResolvedStats {
    resolve: number;
    move: number;
    melee: number;
    shootShort: number;
    shootLong: number;
    defence: number;
    command: number;
}

export interface ResolvedEntry {
    entry: ArmyEntry;
    profile: Profile;
    stats: ResolvedStats;
    traitIds: string[];
    pointsEach: number;
    pointsTotal: number;
    roles: CharacterRole[];
    expendable: boolean;
}

export type CharacterRole =
    | 'warlord'
    | 'mage-lord'
    | 'captain'
    | 'magic-user'
    | 'rogue';

export interface ArmyIssue {
    level: 'error' | 'warning';
    message: string;
}

export interface ResolvedArmy {
    army: ArmyDocument;
    entries: ResolvedEntry[];
    strategyPoints: number;
    totalPoints: number;
    companyCount: number;
    breakPoint: number;
    issues: ArmyIssue[];
}
