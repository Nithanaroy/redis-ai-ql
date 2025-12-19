
import { SchemaExample } from './types';

export const EXAMPLES: SchemaExample[] = [
  {
    name: 'E-commerce (JSON + Search)',
    description: 'Modern Redis Stack approach',
    keyPatterns: 'product:{sku}, category:{name}:products',
    sampleData: `{
  "sku": "KB-99",
  "name": "Mechanical Keyboard",
  "price": 89.99,
  "stock": 12,
  "tags": ["peripherals", "gaming"]
}`,
    indexInfo: `INDEX: idx:products ON JSON
FIELDS: $.name TEXT, $.price NUMERIC, $.tags[*] TAG`,
    otherMetadata: 'Using RedisJSON and RediSearch modules.',
    query: 'Find all gaming tags with price under 100 sorted by price'
  },
  {
    name: 'User Session (Hashes)',
    description: 'High performance hash structure',
    keyPatterns: 'user:session:{uid}, user:active_sessions (SET)',
    sampleData: `HSET user:session:101 
  username "jdoe" 
  last_ip "192.168.1.1" 
  login_ts 1715602000`,
    indexInfo: 'No search index. Primary key access only.',
    otherMetadata: 'login_ts is a Unix Timestamp. user:active_sessions is a Set of UIDs.',
    query: 'How do I add user 101 to active sessions?'
  }
];

export const SYSTEM_PROMPT = `You are a Senior Redis Architect. Your goal is to generate precise Redis commands.

INPUT CONTEXT:
1. KEY PATTERNS: How keys are named in the DB.
2. SAMPLE DATA: An example of the record structure.
3. INDEX INFO: Search index definitions (RediSearch).
4. OTHER METADATA: Module info, TTLs, or logical relationships.

RULES:
- PRIORITIZE KEY PATTERNS: Use the patterns (e.g., product:{sku}) exactly as defined.
- SEARCH COMMANDS: Use FT.SEARCH if index info is provided.
- DEBUGGING: If the user provides an error, cross-reference these 4 inputs to find the mismatch.
- OUTPUT: Valid Redis commands for Redis Insight or redis-cli.

Return your response in JSON:
{
  "command": "The exact Redis command(s)",
  "explanation": "Brief reasoning based on the provided context"
}`;
