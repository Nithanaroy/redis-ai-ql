
export interface SchemaExample {
  name: string;
  description: string;
  keyPatterns: string;
  sampleData: string;
  indexInfo: string;
  otherMetadata: string;
  query: string;
}

export interface GenerationResult {
  command: string;
  explanation: string;
}
