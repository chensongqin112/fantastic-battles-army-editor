import catalogJson from '../data/catalog.json';
import type { Catalog, Profile, Relic, Strategy, Trait } from './types.ts';

export const catalog: Catalog = catalogJson as Catalog;

const profiles: Profile[] = [...catalog.characters, ...catalog.companies];
const traitsById = new Map(catalog.traits.map((t) => [t.id, t]));
const relicsById = new Map(catalog.relics.map((r) => [r.id, r]));
const strategiesById = new Map(catalog.strategies.map((s) => [s.id, s]));
const profilesById = new Map(profiles.map((p) => [p.id, p]));

export function getProfile(id: string): Profile | undefined {
    return profilesById.get(id);
}

export function getTrait(id: string): Trait | undefined {
    return traitsById.get(id);
}

export function getRelic(id: string): Relic | undefined {
    return relicsById.get(id);
}

export function getStrategy(id: string): Strategy | undefined {
    return strategiesById.get(id);
}

export function racialTraitOptions(): Trait[] {
    return catalog.traits.filter((t) => !t.isCharacterTrait);
}
