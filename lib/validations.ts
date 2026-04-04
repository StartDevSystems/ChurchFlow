import { z } from "zod";

// --- ESQUEMA DE TRANSACCIONES ---
export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("El monto debe ser mayor a cero"),
  date: z.string().or(z.date()).transform((val) => new Date(val)),
  description: z.string().min(3, "La descripción debe tener al menos 3 caracteres").max(200),
  categoryId: z.string().uuid("ID de categoría inválido"),
  memberId: z.string().uuid().optional().nullable(),
  eventId: z.string().uuid().optional().nullable(),
});

// --- ESQUEMA DE MIEMBROS ---
export const memberSchema = z.object({
  name: z.string().min(3, "Nombre muy corto").max(100),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.string().email("Correo inválido").optional().nullable().or(z.literal("")),
  role: z.string().default("Joven"),
  position: z.string().optional().nullable(),
  status: z.enum(["ACTIVO", "INACTIVO", "OBSERVACION"]).default("ACTIVO"),
  monthlyDue: z.number().nonnegative("La cuota no puede ser negativa").default(0),
  birthDate: z.string().or(z.date()).optional().nullable().transform((val) => val ? new Date(val) : null),
});

// --- ESQUEMA DE EVENTOS ---
export const eventSchema = z.object({
  name: z.string().min(3, "Nombre de evento muy corto").max(100),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(["EVENTO", "VENTA"]).default("EVENTO"),
  investment: z.number().min(0).optional().nullable(),
  salesGoal: z.number().min(0).optional().nullable(),
  startDate: z.string().or(z.date()).transform((val) => new Date(val)),
  endDate: z.string().or(z.date()).optional().nullable().transform((val) => val ? new Date(val) : null),
  status: z.enum(["ACTIVO", "FINALIZADO"]).default("ACTIVO"),
});

// --- ESQUEMA DE CATEGORÍAS ---
export const categorySchema = z.object({
  name: z.string().min(2, "Nombre de categoría muy corto"),
  type: z.enum(["income", "expense"]),
});

// --- ESQUEMA DE PRODUCTOS DE VENTA ---
export const saleProductSchema = z.object({
  name: z.string().min(2, "Nombre del producto muy corto").max(100),
  price: z.number().positive("El precio debe ser mayor a cero"),
  unitDescription: z.string().max(100).optional().nullable(),
  sortOrder: z.number().int().nonnegative().default(0),
});

// --- ESQUEMA DE ITEMS DE ENTRADA ---
export const saleEntryItemSchema = z.object({
  saleProductId: z.string().uuid("ID de producto inválido"),
  quantity: z.number().int().nonnegative("La cantidad no puede ser negativa"),
});

// --- ESQUEMA DE ENTRADA DE VENTA (CLIENTE) ---
export const saleEntrySchema = z.object({
  clientName: z.string().min(2, "Nombre del cliente muy corto").max(150),
  deliveryDate: z.string().or(z.date()).optional().nullable().transform((val) => val ? new Date(val) : null),
  amountPaid: z.number().nonnegative("El monto pagado no puede ser negativo").default(0),
  comment: z.string().max(500).optional().nullable(),
  items: z.array(saleEntryItemSchema).min(1, "Debe incluir al menos un producto"),
});

// --- ESQUEMA DE PAGOS ---
export const paymentSchema = z.object({
  amount: z.number().positive("El monto debe ser mayor a cero"),
  note: z.string().max(200).optional().nullable(),
});
