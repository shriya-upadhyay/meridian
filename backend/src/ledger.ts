import axios, { AxiosInstance } from 'axios';
import { ContractWrapper } from './types';

const LEDGER_BASE_URL = process.env.LEDGER_URL || 'http://localhost:7575';

/**
 * Canton JSON API v2 client wrapper (SDK 3.4.10).
 *
 * `daml start` runs the JSON API on port 7575.
 * The sandbox accepts the party display name as a Bearer token for auth.
 *
 * IMPORTANT: The JSON API v2 uses camelCase field names, NOT snake_case.
 */
class LedgerClient {
  private packageId: string | null = null;
  private moduleName = 'CrossBorderTransaction';

  private getClient(party: string): AxiosInstance {
    return axios.create({
      baseURL: LEDGER_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${party}`,
      },
    });
  }

  private templateId(templateName: string): string {
    if (this.packageId) {
      return `${this.packageId}:${this.moduleName}:${templateName}`;
    }
    // The JSON API accepts module:entity format when there's no ambiguity
    return `${this.moduleName}:${templateName}`;
  }

  /**
   * Query active contracts of a given template type.
   *
   * Uses POST /v2/state/active-contracts with a filter.
   */
  async queryContracts(party: string, templateName: string): Promise<ContractWrapper[]> {
    const client = this.getClient(party);

    try {
      const response = await client.post('/v2/state/active-contracts', {
        filter: {
          filtersByParty: {
            [party]: {
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
      });

      // The response can be a stream of JSON objects or a single response
      const data = response.data;

      // Handle different response formats
      let results: any[] = [];

      if (data?.activeContracts) {
        results = data.activeContracts;
      } else if (data?.results) {
        results = data.results;
      } else if (Array.isArray(data)) {
        results = data;
      }

      // Extract package ID from first result if we don't have it
      if (!this.packageId && results.length > 0) {
        const firstResult = results[0];
        const tid = firstResult?.templateId || firstResult?.createdEvent?.templateId;
        if (tid && typeof tid === 'string') {
          const parts = tid.split(':');
          if (parts.length === 3) {
            this.packageId = parts[0];
            console.log(`Discovered package ID: ${this.packageId}`);
          }
        }
      }

      return results.map((r: any) => {
        // Handle both flat format and createdEvent wrapper format
        const event = r.createdEvent || r;
        return {
          contractId: event.contractId,
          templateId: event.templateId,
          payload: event.createArguments || event.payload,
        };
      });
    } catch (error: any) {
      console.error(`Query failed for ${templateName}:`, error?.response?.data || error.message);
      return [];
    }
  }

  /**
   * Create a new contract on the ledger.
   *
   * Uses POST /v2/commands/submit-and-wait with camelCase fields.
   */
  async createContract(
    parties: string[],
    templateName: string,
    payload: Record<string, any>
  ): Promise<any> {
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
      actAs: parties,
      commandId,
      userId: parties[0],
    };

    const response = await client.post('/v2/commands/submit-and-wait', body);
    return response.data;
  }

  /**
   * Exercise a choice on an existing contract.
   *
   * Uses POST /v2/commands/submit-and-wait with camelCase fields.
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
      actAs: [party],
      commandId,
      userId: party,
    };

    const response = await client.post('/v2/commands/submit-and-wait', body);
    return response.data;
  }
}

export const ledger = new LedgerClient();
