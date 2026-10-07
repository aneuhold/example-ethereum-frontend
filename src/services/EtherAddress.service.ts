/**
 * Rules for the format of Ethereum addresses.
 */
class EtherAddressService {
  /**
   * Checks that an address is `0x` followed by 40 hex characters, in any letter case.
   * @param address - Address to check
   */
  isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
}

const etherAddressService = new EtherAddressService();
export default etherAddressService;
