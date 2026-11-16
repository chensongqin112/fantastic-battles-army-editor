import { z } from 'zod';
import type { ArmyDocument } from './types.ts';
import { catalog } from './catalog.ts';

export const armyEntrySchema = z.object({
    id: z.string().min(1),
    kind: z.enum(['character', 'company']),
    name: z.string(),
    profileId: z.string().min(1),
    traitIds: z.array(z.string()).max(3),
    relicId: z.string().nullable(),
    companyCount: z.number().int().min(1).max(12),
    spells: z.array(z.string()).max(3),
});

export const armyDocumentSchema = z.object({
    schemaVersion: z.literal(1),
    catalogVersion: z.string().min(1),
    name: z.string(),
    pointsLimit: z.number().int().min(0).max(20000),
    racialTropeId: z.string().nullable(),
    strategyIds: z.array(z.string()).max(3),
    entries: z.array(armyEntrySchema),
});

export function parseArmyDocument(data: unknown): ArmyDocument {
    return armyDocumentSchema.parse(data) as ArmyDocument;
}

export function safeParseArmyDocument(data: unknown): ArmyDocument | null {
    const result = armyDocumentSchema.safeParse(data);
    return result.success ? (result.data as ArmyDocument) : null;
}

export function newEntryId(): string {
    return crypto.randomUUID();
}

export function createEmptyArmy(): ArmyDocument {
    return {
        schemaVersion: 1,
        catalogVersion: catalog.version,
        name: 'New army',
        pointsLimit: 1000,
        racialTropeId: null,
        strategyIds: [],
        entries: [
            {
                id: newEntryId(),
                kind: 'character',
                name: 'Warlord',
                profileId: 'warlord',
                traitIds: [],
                relicId: null,
                companyCount: 1,
                spells: [],
            },
        ],
    };
}
