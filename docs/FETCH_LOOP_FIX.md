# Fetch Loop Fix - Root Cause Analysis & Solutions

## Problem Summary

Fetch calls were executing in infinite loops when browser extensions (e.g., SetIcon, uBlock Origin) triggered DOM mutations, causing React re-renders that created new object references for dependencies like `useSearchParams()`.

## Root Causes Identified

### 1. **Unstable `useSearchParams()` Dependency** (Primary Issue)
**Location**: `app/c/[slug]/page.tsx`

**Problem**: 
- `useSearchParams()` returns a new object instance on every render
- Browser extensions modifying the DOM (e.g., favicon changes) trigger React re-renders
- New `searchParams` object reference triggers `useEffect` even if values haven't changed
- This causes fetch to execute repeatedly

**Fix Applied**:
```typescript
// Before: searchParams object in dependency array
}, [categorySlug, searchParams]);

// After: Extract stable primitive values
const pageParam = searchParams.get('page') || '1';
const sortParam = searchParams.get('sort') || 'relevance';
const filtersParam = searchParams.get('filters') || '{}';

}, [categorySlug, pageParam, sortParam, filtersParam]);
```

### 2. **Missing Request Cancellation**
**Locations**: Multiple components

**Problem**: 
- Concurrent requests weren't cancelled when new requests started
- Multiple fetches for the same resource could run simultaneously
- No cleanup on component unmount

**Fix Applied**:
- Added `AbortController` to cancel requests on unmount or new requests
- Added `isMounted` flag to prevent state updates after unmount
- Added guards to prevent duplicate concurrent fetches

### 3. **Missing Fetch Guards**
**Locations**: `app/page.tsx`, `lib/hooks/useUser.ts`, `components/auth/UserProfile.tsx`

**Problem**:
- No protection against multiple mounts/unmounts triggering fetches
- Browser extension DOM mutations could cause remounts

**Fix Applied**:
- Added `useRef` guards (`hasFetchedRef`, `isFetchingRef`) to track fetch state
- Ensured fetch only runs once per mount
- Added request cancellation with AbortController

### 4. **OrderFilters Component - Unstable Callback**
**Location**: `components/orders/OrderFilters.tsx`

**Problem**:
- `onFiltersChange` called on every render if `filters` object changed reference
- Even if filter values were the same

**Fix Applied**:
- Added deep comparison using JSON.stringify to detect actual value changes
- Only call `onFiltersChange` when filters actually change

## Files Modified

### 1. `app/c/[slug]/page.tsx`
- **Change**: Extract stable values from `searchParams` before using in dependencies
- **Reason**: Prevents re-fetch when browser extensions cause DOM mutations
- **Comment Added**: Explains why stable primitives are used instead of object

### 2. `app/p/[slug]/page.tsx`
- **Change**: Added AbortController and isMounted guard
- **Reason**: Prevents state updates after unmount and cancels in-flight requests

### 3. `app/page.tsx`
- **Change**: Added `hasFetchedRef` guard and AbortController
- **Reason**: Ensures home page data fetches only once per mount

### 4. `components/orders/OrderFilters.tsx`
- **Change**: Added deep comparison before calling `onFiltersChange`
- **Reason**: Prevents unnecessary filter change events when values haven't actually changed

### 5. `components/search/GlobalSearchTrigger.tsx`
- **Change**: Added AbortController to cancel previous requests when new search starts
- **Reason**: Prevents race conditions and duplicate API calls

### 6. `lib/hooks/useUser.ts`
- **Change**: Added `isFetchingRef` guard to prevent concurrent fetches
- **Reason**: Prevents multiple simultaneous user fetches

### 7. `components/auth/UserProfile.tsx`
- **Change**: Added `hasFetchedRef` guard and isMounted flag
- **Reason**: Ensures user profile fetches only once per mount

### 8. `components/fetch-monitor-script.tsx`
- **Change**: Added initialization guard and improved request tracking
- **Reason**: Prevents multiple monitor initializations and better deduplication

## Best Practices Applied

1. **Stable Dependencies**: Use primitive values instead of objects in useEffect dependencies
2. **Request Cancellation**: Always use AbortController for fetch requests
3. **Mount Guards**: Track component mount state to prevent state updates after unmount
4. **Fetch Guards**: Use refs to prevent duplicate concurrent fetches
5. **Deep Comparison**: Compare objects by value, not reference, before triggering side effects

## Testing Recommendations

1. **Test with browser extensions enabled** (SetIcon, uBlock Origin, etc.)
2. **Monitor Network tab** for duplicate requests
3. **Check console** for fetch monitor warnings about continuous requests
4. **Verify** that changing filters/sorting doesn't cause excessive requests
5. **Test** rapid navigation between pages to ensure requests are cancelled

## Prevention Guidelines

1. **Never use object/array dependencies directly** - extract primitives first
2. **Always add AbortController** to async fetch operations
3. **Use refs for guards** - `hasFetchedRef`, `isFetchingRef`, `isMounted`
4. **Compare by value, not reference** - use JSON.stringify or deep comparison
5. **Cleanup on unmount** - cancel requests, remove event listeners

## Notes

- The fetch monitor script (`components/fetch-monitor-script.tsx`) filters out Chrome extension requests automatically
- All fixes maintain backward compatibility
- No breaking changes to API or component interfaces
