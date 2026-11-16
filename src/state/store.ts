import { create } from 'zustand';
import { catalog } from '../domain/catalog.ts';
import { createEmptyArmy, newEntryId } from '../domain/schema.ts';
import { resolveArmy } from '../domain/resolve.ts';
import type { ArmyDocument, ArmyEntry, EntryKind } from '../domain/types.ts';
import { armyFromLocation, loadStoredArmy, saveStoredArmy } from './codec.ts';

interface ArmyStore {
    army: ArmyDocument;
    setArmy: (army: ArmyDocument) => void;
    patchArmy: (patch: Partial<ArmyDocument>) => void;
    addEntry: (kind: EntryKind) => void;
    updateEntry: (id: string, patch: Partial<ArmyEntry>) => void;
    removeEntry: (id: string) => void;
    resetArmy: () => void;
}

function persist(army: ArmyDocument): ArmyDocument {
    saveStoredArmy(army);
    return army;
}

function defaultProfile(kind: EntryKind): Pick<ArmyEntry, 'profileId' | 'name' | 'companyCount'> {
    if (kind === 'character') {
        return { profileId: 'captain', name: 'Captain', companyCount: 1 };
    }
    return { profileId: 'formed-company', name: 'Formed company', companyCount: 1 };
}

function initialArmy(): ArmyDocument {
    if (typeof window !== 'undefined') {
        const query = window.location.hash.split('?')[1];
        const fromUrl = query ? armyFromLocation(query) : null;
        if (fromUrl) return fromUrl;
    }
    return loadStoredArmy() ?? createEmptyArmy();
}

export const useArmyStore = create<ArmyStore>((set) => ({
    army: initialArmy(),
    setArmy: (army) => set({ army: persist(army) }),
    patchArmy: (patch) => set((state) => ({ army: persist({ ...state.army, ...patch }) })),
    addEntry: (kind) =>
        set((state) => {
            const defaults = defaultProfile(kind);
            const entry: ArmyEntry = {
                id: newEntryId(),
                kind,
                traitIds: [],
                relicId: null,
                spells: [],
                ...defaults,
            };
            return { army: persist({ ...state.army, entries: [...state.army.entries, entry] }) };
        }),
    updateEntry: (id, patch) =>
        set((state) => ({
            army: persist({
                ...state.army,
                entries: state.army.entries.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
            }),
        })),
    removeEntry: (id) =>
        set((state) => ({
            army: persist({
                ...state.army,
                entries: state.army.entries.filter((entry) => entry.id !== id),
            }),
        })),
    resetArmy: () => set({ army: persist(createEmptyArmy()) }),
}));

export function useResolvedArmy() {
    const army = useArmyStore((s) => s.army);
    return resolveArmy(army);
}

export function catalogLabel(): string {
    return `Fantastic Battles ${catalog.version}`;
}
