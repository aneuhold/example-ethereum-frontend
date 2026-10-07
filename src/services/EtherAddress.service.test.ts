import { describe, expect, it } from 'vitest';
import etherAddressService from './EtherAddress.service';

describe('EtherAddressService', () => {
  describe('isValidAddress', () => {
    it.each([
      ['lowercase', '0x00000000219ab540356cbb839cbe05303d7705fa'],
      ['mixed case', '0x00000000219ab540356cBB839Cbe05303d7705Fa'],
    ])('accepts a %s address', (_, address) => {
      expect(etherAddressService.isValidAddress(address)).toBe(true);
    });

    it.each([
      ['is missing 0x', '00000000219ab540356cbb839cbe05303d7705fa'],
      ['is too short', '0x123'],
      ['is too long', '0x00000000219ab540356cbb839cbe05303d7705fa0'],
      ['has non-hex characters', '0x00000000219ab540356cbb839cbe05303d7705fg'],
    ])('rejects an address that %s', (_, address) => {
      expect(etherAddressService.isValidAddress(address)).toBe(false);
    });
  });
});
