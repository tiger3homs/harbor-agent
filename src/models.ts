import { z } from 'zod';

export const ObservationSchema = z.object({
  id: z.string().optional(),
  session_id: z.string(),
  type: z.enum(['tool_use', 'prompt', 'response', 'plan', 'summary']),
  tool: z.string().optional(),
  content: z.string(),
  compressed_content: z.string().optional(),
  ccr_key: z.string().optional(),
  timestamp: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional()
});

export type Observation = z.infer<typeof ObservationSchema>;

export const SessionSchema = z.object({
  id: z.string(),
  project_path: z.string(),
  started_at: z.string(),
  ended_at: z.string().optional(),
  summary: z.string().optional()
});

export type Session = z.infer<typeof SessionSchema>;

export const CCRBlobSchema = z.object({
  key: z.string(),
  original_content: z.string(),
  type: z.enum(['code', 'json', 'text', 'image']),
  created_at: z.string()
});

export type CCRBlob = z.infer<typeof CCRBlobSchema>;

export const MemorySearchResultSchema = z.object({
  id: z.string(),
  summary: z.string(),
  relevance: z.number(),
  timestamp: z.string()
});

export type MemorySearchResult = z.infer<typeof MemorySearchResultSchema>;