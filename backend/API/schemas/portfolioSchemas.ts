import { z } from 'zod';

const MetadataSchema = z.record(z.string(), z.unknown()).optional();

const symbolField = z
  .string()
  .trim()
  .min(1, 'symbol requerido')
  .transform((value) => value.toUpperCase());

const PortfolioItemInputSchema = z.object({
  symbol: symbolField,
  amount: z.number().nonnegative().default(0),
  avgPrice: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  metadata: MetadataSchema,
});

export const ReplacePortfolioSchema = z.object({
  items: z.array(PortfolioItemInputSchema).max(2000, 'Número de items excede el límite permitido'),
});
export type ReplacePortfolioPayload = z.infer<typeof ReplacePortfolioSchema>;

export const AddItemSchema = z.object({
  symbol: symbolField,
  amount: z.number().nonnegative().default(0),
  avgPrice: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  metadata: MetadataSchema,
});
export type AddItemPayload = z.infer<typeof AddItemSchema>;

export const UpdateItemSchema = z.object({
  amount: z.number().nonnegative().optional(),
  avgPrice: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  metadata: MetadataSchema,
});
export type UpdateItemPayload = z.infer<typeof UpdateItemSchema>;

export const ImportItemsSchema = z.object({
  items: z.array(PortfolioItemInputSchema),
});
export type ImportItemsPayload = z.infer<typeof ImportItemsSchema>;

export type PortfolioItemInput = z.infer<typeof PortfolioItemInputSchema>;
