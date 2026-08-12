# Admin Token Refresh Design

## Goal

Recover an Admin API request after its access token has expired, and make a failed donation filter-options request visible to the user.

## Scope

- Force the Admin API client to refresh after a protected request responds with HTTP 401, even if an expired access token is still stored in memory.
- Preserve the existing single-flight refresh behavior so concurrent 401 responses issue one refresh request.
- Add a regression test covering an expired in-memory token.
- Surface an error state for donation filter options rather than silently treating a failed request as empty options.

## Design

`adminApi` will distinguish an initial request from a retry after a 401. The response interceptor will explicitly request a fresh access token from `/auth/admin/refresh`; it must not reuse the in-memory token that caused the 401. The existing `refreshPromise` remains the synchronization point for concurrent callers. If refresh fails, the existing auth-loss handler continues to clear the admin session state.

The client test will begin with an expired token in the Admin token store, return 401 for the protected route, return a fresh token from the refresh route, and assert that the protected route is replayed successfully. The test also asserts that one refresh is shared across concurrent requests.

The Donations page will read the query error returned by TanStack Query and show an actionable inline message for the filter area. List rendering and the staff donation form remain usable; category and payment-method choices are not presented as though the backend returned an empty set.

## Error Handling

- A 401 with a valid Admin refresh cookie refreshes and retries once.
- A refresh failure invokes the existing auth-loss handler; the original request remains rejected.
- A filter-options failure is visible in the Donations UI and does not alter current list filters.

## Acceptance Criteria

1. A stale in-memory Admin token is replaced through `/auth/admin/refresh` after a protected request returns 401.
2. The original protected request is retried once with the refreshed token.
3. Concurrent 401s share one refresh request.
4. A failed donation filter-options query produces visible feedback in the Donations page.
5. Existing admin authentication behavior for 403 responses and failed refreshes remains unchanged.
