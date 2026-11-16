export { catalog, getProfile, getRelic, getStrategy, getTrait, racialTraitOptions } from './catalog.ts';
export { createEmptyArmy, newEntryId, parseArmyDocument, safeParseArmyDocument } from './schema.ts';
export { effectiveTraitIds, formatPoints, formatShoot, resolveArmy, rolesFor } from './resolve.ts';
export type {
    ArmyDocument,
    ArmyEntry,
    ArmyIssue,
    Catalog,
    CharacterRole,
    ResolvedArmy,
    ResolvedEntry,
} from './types.ts';
