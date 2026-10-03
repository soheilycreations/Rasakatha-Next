import { z } from "zod";
import { ROLES } from "../permissions";

// Shared by the browser (form validation) and the server (every API handler re-validates).

export const roleSchema = z.enum(ROLES);

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address").max(160);
export const passwordSchema = z.string().min(10, "Use at least 10 characters").max(200);
export const totpCodeSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");
export const pinSchema = z.string().regex(/^\d{4,6}$/, "PIN must be 4 to 6 digits");

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(200) });
export const emergencyLoginSchema = z.object({ password: z.string().min(1).max(200) });
// `code` is the 6-digit authenticator code OR a one-time recovery code (XXXXX-XXXXX)
export const recoveryCodeSchema = z.string().trim().regex(/^[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}$/, "That isn't a recovery code");
export const totpLoginSchema = z.object({ ticket: z.string().min(10).max(600), code: z.union([totpCodeSchema, recoveryCodeSchema]) });
export const pinSwitchSchema = z.object({ staffId: z.string().uuid(), pin: pinSchema });

export const staffCreateSchema = z.object({
  email: emailSchema,
  fullName: z.string().trim().min(2, "Enter a name").max(120),
  role: roleSchema,
  password: passwordSchema,
  pin: pinSchema.optional(),
});
export const staffUpdateSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().trim().min(2).max(120).optional(),
  role: roleSchema.optional(),
  active: z.boolean().optional(),
  password: passwordSchema.optional(),
  pin: pinSchema.nullable().optional(), // null clears the PIN
  resetTotp: z.boolean().optional(),
});

const money = z.number().min(0).max(100);
export const settingsSchema = z.object({
  store: z.object({
    name: z.string().trim().min(1).max(120),
    address: z.string().trim().max(300),
    phone: z.string().trim().max(40),
    email: z.string().trim().max(160),
  }),
  receipt: z.object({ header: z.string().max(300), footer: z.string().max(300) }),
  tax: z.object({ enabled: z.boolean(), rate: money, label: z.string().trim().min(1).max(20) }),
  discountLimits: z.object({ owner: money, manager: money, cashier: money, stock: money }),
  lowStockThreshold: z.number().int().min(0).max(1000),
  defaults: z.object({ royaltyPercent: money, consignmentPayablePercent: money }),
  creditTermsDays: z.number().int().min(0).max(365),
  couriers: z.array(z.object({ name: z.string().trim().min(1).max(60), trackingUrl: z.string().trim().max(200) })).max(30),
});
export type Settings = z.infer<typeof settingsSchema>;

export const auditQuerySchema = z.object({
  actor: z.string().trim().max(120).optional(),
  entity: z.string().trim().max(60).optional(),
  from: z.string().trim().max(30).optional(),
  to: z.string().trim().max(30).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const archiveBookSchema = z.object({ id: z.string().min(1).max(40), reason: z.string().trim().min(3, "Say why").max(300) });

// ---- schemas for the existing admin write endpoints --------------------------------------------------
const optionalText = (max: number) => z.string().max(max).optional();

export const categoryPutSchema = z.object({ name: z.string().trim().min(1).max(80), image: optionalText(600), order: z.number().int().min(0).max(100000).optional() });
export const authorPutSchema = z.object({ name: z.string().trim().min(1).max(200), bio: optionalText(10000), photo: optionalText(600) });
export const heroSlideSchema = z.object({
  id: z.string().trim().max(60).optional(),
  title: z.string().max(300).optional(),
  cover: z.string().max(600).optional(),
  author: z.string().max(200).nullable().optional(),
  price: z.number().min(0).max(10_000_000).nullable().optional(),
});
export const orderPatchSchema = z.object({
  id: z.string().min(1).max(40),
  status: z.enum(["processing", "packed", "shipped", "delivered"]),
});
export const reviewPatchSchema = z.object({ id: z.string().min(1).max(60), approved: z.boolean() });
export const posSaleSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1).max(40), qty: z.number().int().min(1).max(1000), price: z.number().min(0).max(10_000_000) }).passthrough())
    .min(1, "Add at least one item to the bill")
    .max(200),
  discount: z.number().min(0).max(10_000_000).optional(),
  payment: z.string().max(20).optional(),
  customerName: z.string().max(120).nullish(),
  customerPhone: z.string().max(30).nullish(),
  customerEmail: z.string().max(160).nullish(),
  note: z.string().max(500).nullish(),
});
// Book create/update: loose on shape (the route normalises) but strict on types and ranges.
// There is deliberately NO length limit on the description.
export const bookInputSchema = z
  .object({
    id: z.string().trim().max(40).optional(),
    title: z.string().max(400).optional(),
    author: z.string().max(200).optional(),
    publisher: z.string().max(200).nullish(),
    category: z.string().max(80).optional(),
    regularPrice: z.number().min(0).max(10_000_000).optional(),
    salePrice: z.number().min(0).max(10_000_000).nullish(),
    onSale: z.boolean().optional(),
    inStock: z.boolean().optional(),
    rating: z.number().min(0).max(5).optional(),
    blurb: z.string().optional(),
    cover: z.string().max(600).nullish(),
    weight: z.number().min(0).max(100_000).optional(),
    stockQty: z.number().min(0).max(1_000_000).nullish(),
    isbn: z.string().max(40).nullish(),
    pages: z.number().nullish(),
    language: z.string().max(5).nullish(),
    publishedYear: z.number().nullish(),
    binding: z.string().max(40).nullish(),
    translator: z.string().max(200).nullish(),
    isOwnTitle: z.boolean().optional(),
  })
  .passthrough();
