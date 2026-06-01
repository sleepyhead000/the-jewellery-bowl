export type SaleDiscountType = "PRICE" | "PERCENT";

export type SaleSettingsInput = {
  price: number;
  salePrice?: number | null | undefined;
  saleEnabled?: boolean | undefined;
  saleStartsAt?: Date | null | undefined;
  saleEndsAt?: Date | null | undefined;
  saleDiscountType?: SaleDiscountType | undefined;
  saleDiscountValue?: number | null | undefined;
};

export type NormalizedSaleSettings = {
  salePrice: number | null;
  saleEnabled: boolean;
  saleStartsAt: Date | null | undefined;
  saleEndsAt: Date | null | undefined;
  saleDiscountType: SaleDiscountType;
  saleDiscountValue: number | null;
};

export type SaleVariant = {
  id: string;
  price: number;
  salePrice: number | null;
  saleEnabled: boolean;
  saleStartsAt: Date | string | null;
  saleEndsAt: Date | string | null;
  isActive?: boolean;
};

export type DisplayVariant<T extends SaleVariant> = T & {
  effectivePrice: number;
  activeSalePrice: number | null;
};

export function isVariantSaleActive(variant: SaleVariant, now: Date): boolean {
  if (!variant.saleEnabled) return false;
  if (variant.salePrice === null) return false;
  if (variant.salePrice <= 0 || variant.salePrice >= variant.price) return false;

  const startsAt = variant.saleStartsAt ? new Date(variant.saleStartsAt) : null;
  const endsAt = variant.saleEndsAt ? new Date(variant.saleEndsAt) : null;

  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;

  return true;
}

export function resolveVariantSalePrice(variant: SaleVariant, now: Date): number | null {
  return isVariantSaleActive(variant, now) ? variant.salePrice : null;
}

export function getProductDisplayVariant<T extends SaleVariant>(
  variants: T[],
  now: Date
): DisplayVariant<T> | null {
  const activeVariants = variants.filter((variant) => variant.isActive !== false);
  const candidates = activeVariants.length > 0 ? activeVariants : variants;
  if (candidates.length === 0) return null;

  return candidates
    .map((variant) => {
      const activeSalePrice = resolveVariantSalePrice(variant, now);
      return {
        ...variant,
        activeSalePrice,
        effectivePrice: activeSalePrice ?? variant.price,
      };
    })
    .sort((a, b) => a.effectivePrice - b.effectivePrice)[0];
}

export function calculateSalePrice(price: number, saleDiscountType: SaleDiscountType, saleDiscountValue: number): number {
  if (saleDiscountType === "PRICE") return saleDiscountValue;
  return Math.round(price * (100 - saleDiscountValue) / 100);
}

export function normalizeSaleSettings(input: SaleSettingsInput): NormalizedSaleSettings {
  const saleEnabled = input.saleEnabled ?? false;
  const saleDiscountType = input.saleDiscountType ?? "PRICE";
  if (!saleEnabled) {
    return {
      salePrice: null,
      saleEnabled: false,
      saleStartsAt: input.saleStartsAt,
      saleEndsAt: input.saleEndsAt,
      saleDiscountType,
      saleDiscountValue: null,
    };
  }

  const saleDiscountValue = input.saleDiscountValue ?? input.salePrice;
  if (!saleDiscountValue) {
    throw new Error("Sale value is required when sale is enabled");
  }
  if (saleDiscountType === "PERCENT" && (saleDiscountValue < 1 || saleDiscountValue > 99)) {
    throw new Error("Sale percentage must be between 1 and 99");
  }

  const salePrice = calculateSalePrice(input.price, saleDiscountType, saleDiscountValue);
  if (salePrice <= 0 || salePrice >= input.price) {
    throw new Error("Sale price must be lower than the variant price");
  }

  const startsAt = input.saleStartsAt ? new Date(input.saleStartsAt) : null;
  const endsAt = input.saleEndsAt ? new Date(input.saleEndsAt) : null;
  if (startsAt && endsAt && startsAt > endsAt) {
    throw new Error("Sale start date must be before sale end date");
  }

  return {
    salePrice,
    saleEnabled: true,
    saleStartsAt: input.saleStartsAt,
    saleEndsAt: input.saleEndsAt,
    saleDiscountType,
    saleDiscountValue,
  };
}
