import { describe, expect, it } from 'vitest';
import { createEmptyArmy } from '../domain/schema.ts';
import { decodeArmy, encodeArmy } from './codec.ts';

describe('share codec', () => {
    it('round-trips an army document', () => {
        const army = createEmptyArmy();
        army.name = 'Test host';
        army.racialTropeId = 'militia';
        army.strategyIds = ['scouts'];
        const restored = decodeArmy(encodeArmy(army));
        expect(restored?.name).toBe('Test host');
        expect(restored?.racialTropeId).toBe('militia');
        expect(restored?.strategyIds).toEqual(['scouts']);
        expect(restored?.entries[0]?.profileId).toBe('warlord');
    });

    it('rejects garbage payloads', () => {
        expect(decodeArmy('not-a-payload')).toBeNull();
    });
});
