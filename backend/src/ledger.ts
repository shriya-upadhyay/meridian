import axios, { AxiosInstance } from 'axios';
import { ContractWrapper } from './types';

const LEDGER_BASE_URL = process.env.LEDGER_URL || 'http://localhost:7575';
const DAML_PACKAGE_NAME = process.env.DAML_PACKAGE_NAME || 'meridian';

/**
 * Canton JSON API v2 client (SDK 3.4.10).
 *
 * Key learnings from debugging against the live Canton sandbox:
 *
 * 1. templateId uses package-name reference format: "#packageName:Module:Template"
 *    The "#" prefix tells Canton to resolve by package name, not package ID.
 *
 * 2. Parties must be allocated via POST /v2/parties before use.
 *    `daml start` creates a sandbox with NO pre-allocated parties.
 *    Full party IDs look like "AliceCorp_Singapore::1220abc...def"
 *
 * 3. Queries go to POST /v2/state/active-contracts with:
 *    - activeAtOffset (required integer, get from GET /v2/state/ledger-end)
 *    - filter with filtersByParty or filtersForAnyParty
 *    - verbose: true for labeled fields
 *
 * 4. All command fields are camelCase: templateId, createArguments, actAs, etc.
 */
class LedgerClient {
  private moduleName = 'CrossBorderTransaction';

  // Maps display name (e.g. "AliceCorp_Singapore") to full party ID
  private partyMap: Record<string, string> = {};

  private getClient(token: string): AxiosInstance {
    return axios.create({
      baseURL: LEDGER_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  private templateId(templateName: string): string {
    return `#${DAML_PACKAGE_NAME}:${this.moduleName}:${templateName}`;
  }

  /**
   * Resolve a display name to full party ID.
   * If the name is already a full ID (contains "::"), return as-is.
   */
  resolveParty(displayName: string): string {
    if (displayName.includes('::')) return displayName;
    const fullId = this.partyMap[displayName];
    if (!fullId) {
      console.warn(`Party "${displayName}" not found in party map, using as-is`);
      return displayName;
    }
    return fullId;
  }

  /** Get all known party mappings. */
  getPartyMap(): Record<string, string> {
    return { ...this.partyMap };
  }

  // =========================================================================
  // Party & User Management (called at startup)
  // =========================================================================

  /**
   * Allocate a party on the Canton sandbox.
   * Returns the full party ID (e.g. "AliceCorp_Singapore::1220abc...").
   */
  async allocateParty(hint: string, displayName: string): Promise<string> {
    const client = this.getClient('participant_admin');

    // Check if party already exists by listing all parties
    try {
      const listResp = await client.get('/v2/parties');
      const parties = listResp.data?.partyDetails || [];
      const existing = parties.find((p: any) =>
        p.party && p.party.startsWith(`${hint}::`)
      );
      if (existing) {
        console.log(`  Party "${hint}" already exists: ${existing.party}`);
        this.partyMap[hint] = existing.party;
        return existing.party;
      }
    } catch {
      // Could not list parties, try allocating
    }

    const resp = await client.post('/v2/parties', {
      partyIdHint: hint,
      displayName,
      identityProviderId: '',
    });

    const fullId = resp.data?.partyDetails?.party;
    if (!fullId) {
      throw new Error(`Failed to allocate party "${hint}": ${JSON.stringify(resp.data)}`);
    }

    console.log(`  Allocated party "${hint}": ${fullId}`);
    this.partyMap[hint] = fullId;
    return fullId;
  }

  /**
   * Create a user and grant actAs + readAs rights for a party.
   */
  async createUserWithRights(userId: string, partyId: string): Promise<void> {
    const client = this.getClient('participant_admin');

    // Check if user exists
    try {
      await client.get(`/v2/users/${userId}`);
      console.log(`  User "${userId}" already exists`);
      return; // Already exists
    } catch (e: any) {
      if (e?.response?.status !== 404) {
        // Some other error
        console.warn(`  Warning checking user "${userId}":`, e?.response?.data || e.message);
      }
    }

    // Create user
    await client.post('/v2/users', {
      user: {
        id: userId,
        isDeactivated: false,
        primaryParty: partyId,
        identityProviderId: '',
        metadata: {
          resourceVersion: '',
          annotations: {},
        },
      },
      rights: [],
    });

    // Grant rights
    await client.post(`/v2/users/${userId}/rights`, {
      userId,
      identityProviderId: '',
      rights: [
        { kind: { CanActAs: { value: { party: partyId } } } },
        { kind: { CanReadAs: { value: { party: partyId } } } },
      ],
    });

    console.log(`  Created user "${userId}" with actAs/readAs for party`);
  }

  // =========================================================================
  // Ledger Operations
  // =========================================================================

  /**
   * Get current ledger end offset.
   */
  async getLedgerEnd(party: string): Promise<number> {
    const client = this.getClient(party);
    const resp = await client.get('/v2/state/ledger-end');
    return resp.data?.offset ?? 0;
  }

  /**
   * Query active contracts of a given template type.
   */
  async queryContracts(party: string, templateName: string): Promise<ContractWrapper[]> {
    const fullPartyId = this.resolveParty(party);
    const client = this.getClient(party);

    try {
      const offset = await this.getLedgerEnd(party);

      const response = await client.post('/v2/state/active-contracts', {
        filter: {
          filtersByParty: {
            [fullPartyId]: {
              cumulative: [
                {
                  identifierFilter: {
                    TemplateFilter: {
                      value: {
                        templateId: this.templateId(templateName),
                        includeCreatedEventBlob: false,
                      },
                    },
                  },
                },
              ],
            },
          },
        },
        verbose: true,
        activeAtOffset: offset,
      });

      const data = response.data;
      let results: any[] = [];

      if (Array.isArray(data)) {
        results = data;
      } else if (data?.activeContracts) {
        results = data.activeContracts;
      } else if (data?.results) {
        results = data.results;
      }

      // Canton JSON API v2 response structure:
      //   [ { contractEntry: { JsActiveContract: { createdEvent: { contractId, templateId, createArgument } } } } ]
      return results.map((r: any) => {
        const event =
          r.contractEntry?.JsActiveContract?.createdEvent  // Canton v2 format
          || r.createdEvent                                 // fallback
          || r;
        return {
          contractId: event.contractId,
          templateId: event.templateId,
          payload: event.createArgument || event.createArguments || event.payload,
        };
      });
    } catch (error: any) {
      console.error(`Query failed for ${templateName}:`, error?.response?.data || error.message);
      return [];
    }
  }

  /**
   * Create a new contract on the ledger.
   */
  async createContract(
    parties: string[],
    templateName: string,
    payload: Record<string, any>
  ): Promise<any> {
    const resolvedParties = parties.map(p => this.resolveParty(p));
    const client = this.getClient(parties[0]);
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const body = {
      commands: [
        {
          CreateCommand: {
            templateId: this.templateId(templateName),
            createArguments: payload,
          },
        },
      ],
      actAs: resolvedParties,
      commandId,
      userId: parties[0],
    };

    const response = await client.post('/v2/commands/submit-and-wait', body);
    return response.data;
  }

  /**
   * Exercise a choice on an existing contract.
   */
  async exerciseChoice(
    party: string,
    templateName: string,
    contractId: string,
    choice: string,
    args: Record<string, any> = {}
  ): Promise<any> {
    const client = this.getClient(party);
    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const body = {
      commands: [
        {
          ExerciseCommand: {
            templateId: this.templateId(templateName),
            contractId,
            choice,
            choiceArgument: args,
          },
        },
      ],
      actAs: [this.resolveParty(party)],
      commandId,
      userId: party,
    };

    const response = await client.post('/v2/commands/submit-and-wait', body);
    return response.data;
  }
}

export const ledger = new LedgerClient();
