import assert from "node:assert/strict";
import test from "node:test";
import { fetchAllAdminPages } from "./fetchAllAdminPages";

test("fetchAllAdminPages loads every page for a calendar range", async () => {
  const requestedPages: number[] = [];
  const result = await fetchAllAdminPages(
    {
      page: 1,
      limit: 100,
      search: "",
      order: "asc",
      filters: {},
    },
    async (params) => {
      requestedPages.push(params.page);
      return {
        data: [params.page],
        pagination: { page: params.page, limit: 100, total: 250, totalPages: 3 },
      };
    },
  );

  assert.deepEqual(requestedPages, [1, 2, 3]);
  assert.deepEqual(result.data, [1, 2, 3]);
  assert.deepEqual(result.pagination, {
    page: 1,
    limit: 100,
    total: 250,
    totalPages: 1,
  });
});
