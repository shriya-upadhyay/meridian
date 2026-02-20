"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledger = void 0;
const axios_1 = __importDefault(require("axios"));
const LEDGER_BASE_URL = process.env.LEDGER_URL || 'http://localhost:7575';
/**
 * Canton JSON API client wrapper.
 *
 * `daml start` runs the JSON API on port 7575.
 * The sandbox accepts the party display name as a Bearer token for auth.
 */
class LedgerClient {
    packageId = null;
    moduleName = 'CrossBorderTransaction';
    getClient(party) {
        return axios_1.default.create({
            baseURL: LEDGER_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer `,
            },
        });
    }
    /**
     * Discover the package ID for our module by querying the ledger.
     */
    async getPackageId() {
        if (this.packageId)
            return this.packageId;
        try {
            // Try to get packages from the ledger
            const client = this.getClient('participant_admin');
            const response = await client.get('/v2/packages');
            const packages = response.data?.package_ids || response.data || [];
            // For now, we'll discover it via a query — the template ID comes back in results
            // We'll set it on first successful query
            return '';
        }
        catch (e) {
            console.warn('Could not discover package ID, will use unqualified names');
            return '';
        }
    }
    templateId(templateName) {
        if (this.packageId) {
            return `${this.packageId}:${this.moduleName}:${templateName}`;
        }
        // The JSON API accepts module:entity format when there's no ambiguity
        return `${this.moduleName}:${templateName}`;
    }
    /**
     * Query active contracts of a given template type.
     */
    async queryContracts(party, templateName) {
        const client = this.getClient(party);
        try {
            const response = await client.post('/v2/queries', {
                template_id: this.templateId(templateName),
            });
            const results = response.data?.results || response.data || [];
            // Extract package ID from first result if we don't have it
            if (!this.packageId && results.length > 0) {
                const firstTemplateId = results[0]?.template_id;
                if (firstTemplateId && typeof firstTemplateId === 'string') {
                    const parts = firstTemplateId.split(':');
                    if (parts.length === 3) {
                        this.packageId = parts[0];
                        console.log(`Discovered package ID: ${this.packageId}`);
                    }
                }
            }
            return results.map((r) => ({
                contractId: r.contract_id,
                templateId: r.template_id,
                payload: r.payload,
            }));
        }
        catch (error) {
            console.error(`Query failed for ${templateName}:`, error?.response?.data || error.message);
            return [];
        }
    }
    /**
     * Create a new contract on the ledger.
     */
    async createContract(parties, templateName, payload) {
        // Use the first party as the primary submitter
        const client = this.getClient(parties[0]);
        const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const body = {
            commands: [
                {
                    CreateCommand: {
                        template_id: this.templateId(templateName),
                        create_arguments: payload,
                    },
                },
            ],
            act_as: parties,
            command_id: commandId,
        };
        const response = await client.post('/v2/commands/submit-and-wait', body);
        return response.data;
    }
    /**
     * Exercise a choice on an existing contract.
     */
    async exerciseChoice(party, templateName, contractId, choice, args = {}) {
        const client = this.getClient(party);
        const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const body = {
            commands: [
                {
                    ExerciseCommand: {
                        template_id: this.templateId(templateName),
                        contract_id: contractId,
                        choice,
                        choice_argument: args,
                    },
                },
            ],
            act_as: [party],
            command_id: commandId,
        };
        const response = await client.post('/v2/commands/submit-and-wait', body);
        return response.data;
    }
}
exports.ledger = new LedgerClient();
