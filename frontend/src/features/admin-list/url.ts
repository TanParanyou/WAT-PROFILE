import {
  ADMIN_PAGE_SIZES,
  type AdminFilterRecord,
  type AdminListParams,
  type AdminPageSize,
  type AdminSortOrder,
} from "./types";

export interface AdminListUrlSchema<TFilters extends AdminFilterRecord> {
  defaultSort?: string;
  defaultOrder?: AdminSortOrder;
  multi: readonly (keyof TFilters & string)[];
  single?: readonly (keyof TFilters & string)[];
  allowedSorts: readonly string[];
}

const positiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export function parseAdminListParams<TFilters extends AdminFilterRecord>(
  input: URLSearchParams,
  schema: AdminListUrlSchema<TFilters>,
): AdminListParams<TFilters> {
  const rawLimit = positiveInt(input.get("limit"), 25);
  const limit = (
    ADMIN_PAGE_SIZES.includes(rawLimit as AdminPageSize) ? rawLimit : 25
  ) as AdminPageSize;
  const requestedSort = input.get("sort") || undefined;
  const sort =
    requestedSort && schema.allowedSorts.includes(requestedSort)
      ? requestedSort
      : schema.defaultSort;
  const order = input.get("order") === "asc" ? "asc" : schema.defaultOrder ?? "desc";
  const filters: AdminFilterRecord = {};

  for (const key of schema.multi) {
    const values = [...new Set(input.getAll(key).map((value) => value.trim()).filter(Boolean))];
    if (values.length > 0) filters[key] = values;
  }
  for (const key of schema.single ?? []) {
    const value = input.get(key)?.trim();
    if (value) filters[key] = value;
  }

  return {
    page: positiveInt(input.get("page"), 1),
    limit,
    search: input.get("search")?.trim() ?? "",
    sort,
    order,
    filters: filters as TFilters,
  };
}

export function serializeAdminListParams<TFilters extends AdminFilterRecord>(
  params: AdminListParams<TFilters>,
): URLSearchParams {
  const output = new URLSearchParams();
  if (params.page !== 1) output.set("page", String(params.page));
  if (params.limit !== 25) output.set("limit", String(params.limit));
  if (params.search) output.set("search", params.search);
  if (params.sort) output.set("sort", params.sort);
  if (params.order !== "desc") output.set("order", params.order);

  for (const key of Object.keys(params.filters).sort()) {
    const value = params.filters[key];
    const values = Array.isArray(value) ? [...value].sort() : value ? [value] : [];
    for (const item of values) output.append(key, item);
  }
  return output;
}
