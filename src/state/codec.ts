import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { safeParseArmyDocument } from '../domain/schema.ts';
import type { ArmyDocument } from '../domain/types.ts';

export const STORAGE_KEY = 'fb-army-editor-v1';
export const SHARE_PARAM = 'a';

export function encodeArmy(army: ArmyDocument): string {
    return compressToEncodedURIComponent(JSON.stringify(army));
}

export function decodeArmy(payload: string): ArmyDocument | null {
    try {
        const json = decompressFromEncodedURIComponent(payload);
        if (!json) return null;
        return safeParseArmyDocument(JSON.parse(json));
    } catch {
        return null;
    }
}

export function loadStoredArmy(): ArmyDocument | null {
    if (typeof localStorage === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return safeParseArmyDocument(JSON.parse(raw));
    } catch {
        return null;
    }
}

export function saveStoredArmy(army: ArmyDocument): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(army));
}

export function armyFromLocation(search: string): ArmyDocument | null {
    const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
    const payload = params.get(SHARE_PARAM);
    return payload ? decodeArmy(payload) : null;
}
