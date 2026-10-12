# Bug Fix & Issue Tracking Plan

## Overview
This document tracks all bugs and issues identified in the ElectrooBuddy codebase, organized by priority level.

---

## P0 - CRITICAL (Fix Immediately)

### 1. Cart Security Issue - Loads ALL Users' Items
**File:** `src/contexts/CartContext.tsx`
**Lines:** 57-72
**Issue:** Cart query doesn't filter by `user_id`, showing all users' items
**Fix:** Add `.eq("user_id", user.id)` to the Supabase query
```typescript
// Before
const { data } = await supabase.from("cart_items").select(...);

// After
const { data } = await supabase.from("cart_items").select(...).eq("user_id", user.id);
```
**Status:** [ ] Pending

---

### 2. React Hooks Violation in Checkout
**File:** `src/pages/Checkout.tsx`
**Lines:** 127-145
**Issue:** `useState` hooks called after conditional `return` statements
**Fix:** Move all hooks to the top of the component, before any conditional returns
**Status:** [ ] Pending

---

### 3. Plain-Text Password in Database
**File:** `src/integrations/supabase/types.ts`
**Line:** 1037
**Issue:** `shipping_settings` table stores password in plain text
**Fix:** 
- Encrypt passwords before storing
- Or use Supabase Vault for sensitive credentials
- Update the shipping integration to decrypt when needed
**Status:** [ ] Pending

---

## P1 - HIGH (Fix Soon)

### 4. Broken CSS in UserAuth
**File:** `src/pages/user/UserAuth.tsx`
**Lines:** 396-399
**Issue:** Orphaned CSS properties applied to wrong element
**Fix:** Wrap the CSS in a proper `.auth-divider` class selector
```css
.auth-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, hsl(var(--border) / 0.3), transparent);
  margin: 20px 0;
}
```
**Status:** [ ] Pending

---

### 5. Shipping Calculation Uses Wrong Data
**File:** `src/pages/Checkout.tsx`
**Lines:** 179-180
**Issue:** `metroCities` contains city names but compares with `info.state`
**Fix:** Either change `metroCities` to state names or use `info.city` if available
```typescript
// Option 1: Use state names
const metroStates = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat'];

// Option 2: Use city field if available in shipping info
metroCities.includes(info.city)
```
**Status:** [ ] Pending

---

### 6. Installation Charge Lost on Toggle
**File:** `src/contexts/CartContext.tsx`
**Lines:** 168-184
**Issue:** Original installation charge is overwritten when toggled off
**Fix:** Store original charge separately or fetch from product data
```typescript
// Store original charge in item
const toggleInstallation = (productId: string) => {
  setItems(items.map(item => {
    if (item.product_id === productId) {
      const newInstallation = !item.installation_service;
      return {
        ...item,
        installation_service: newInstallation,
        installation_charge: newInstallation ? (item.original_installation_charge || 0) : 0
      };
    }
    return item;
  }));
};
```
**Status:** [ ] Pending

---

### 7. Cart DB Sync Not Implemented
**File:** `src/contexts/CartContext.tsx`
**Lines:** 103-111
**Issue:** `saveCart()` has TODO for database sync
**Fix:** Implement full sync between localStorage and Supabase cart_items table
```typescript
const saveCart = async (newItems: CartItem[]) => {
  if (user) {
    // Sync to database
    await supabase.from("cart_items").delete().eq("user_id", user.id);
    if (newItems.length > 0) {
      await supabase.from("cart_items").insert(
        newItems.map(item => ({ ...item, user_id: user.id }))
      );
    }
  }
  localStorage.setItem("cart", JSON.stringify(newItems));
};
```
**Status:** [ ] Pending

---

### 8. Order Number Not Unique
**File:** `src/pages/Checkout.tsx`
**Line:** 301
**Issue:** Uses `Date.now()` which can create duplicates
**Fix:** Use the database function `generate_order_number` or add random suffix
```typescript
// Option 1: Use DB function
const { data: orderNumber } = await supabase.rpc('generate_order_number');

// Option 2: Add random suffix
const orderNumber = `ORD${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
```
**Status:** [ ] Pending

---

### 9. Missing subscription_type Column
**Files:** Multiple files referencing `subscription_type`
**Issue:** Column doesn't exist in generated types
**Fix:** 
- Add column to database if needed: `ALTER TABLE push_subscriptions ADD COLUMN subscription_type text;`
- Or remove references if not needed
**Status:** [ ] Pending

---

## P2 - MEDIUM (Fix When Possible)

### 10. Double Navbar/Footer on Login Page
**Files:** `src/pages/user/UserAuth.tsx`, `src/App.tsx`
**Issue:** Login page renders Navbar/Footer from both UserAuth and App.tsx
**Fix:** 
- Option A: Remove Navbar/Footer from UserAuth.tsx
- Option B: Add `/login` to exclusion list in App.tsx
**Status:** [ ] Pending

---

### 11. "assigned" Status Not in STATUS_CONFIG
**File:** `src/pages/admin/AdminBookings.tsx`
**Lines:** 14-19
**Issue:** Missing status config for "assigned" status
**Fix:** Add "assigned" to STATUS_CONFIG
```typescript
const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-700" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-700" },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};
```
**Status:** [ ] Pending

---

### 12. Refresh Button Doesn't Re-fetch
**File:** `src/pages/admin/AdminUsers.tsx`
**Lines:** 125-133
**Issue:** Refresh only clears cache, doesn't trigger re-fetch
**Fix:** Call the fetch function after invalidating cache
```typescript
const handleRefresh = async () => {
  setRefreshing(true);
  invalidateUsers();
  await fetchUsers(); // Add this line
  setTimeout(() => setRefreshing(false), 500);
};
```
**Status:** [ ] Pending

---

### 13. servicesStore Queries Non-existent Columns
**File:** `src/stores/servicesStore.ts`
**Lines:** 169-172
**Issue:** Queries columns that don't exist in the database
**Fix:** 
- Option A: Add columns to database
- Option B: Remove the column references and use fallback
**Status:** [ ] Pending

---

### 14. Sequential DB Queries in Admin Dashboard
**File:** `src/hooks/useOptimizedData.ts`
**Lines:** 263
**Issue:** Dashboard stats fetched sequentially instead of parallel
**Fix:** Use `Promise.all` for parallel execution
```typescript
const [bookingsCount, productsCount, usersCount] = await Promise.all([
  supabase.from('bookings').select('*', { count: 'exact', head: true }),
  supabase.from('products').select('*', { count: 'exact', head: true }),
  supabase.from('user_roles').select('*', { count: 'exact', head: true }),
]);
```
**Status:** [ ] Pending

---

## P3 - LOW (Technical Debt)

### 15. Pervasive `any` Types
**Multiple Files**
**Issue:** TypeScript type safety compromised
**Fix:** Gradually add proper types to all functions and components
**Status:** [ ] Pending

---

### 16. process.env vs import.meta.env
**File:** `src/components/ErrorBoundary.tsx`
**Lines:** 41, 80
**Issue:** Uses Node.js `process.env` instead of Vite's `import.meta.env`
**Fix:** Replace with `import.meta.env.DEV` or `import.meta.env.MODE`
**Status:** [ ] Pending

---

## Implementation Order

### Phase 1: Critical Security & Crash Fixes (Day 1)
1. Fix cart user_id filter (#1)
2. Fix React Hooks violation in Checkout (#2)
3. Address plain-text password issue (#3)

### Phase 2: High Priority Functionality (Day 2-3)
4. Fix CSS in UserAuth (#4)
5. Fix shipping calculation (#5)
6. Fix installation charge toggle (#6)
7. Implement cart DB sync (#7)
8. Fix order number uniqueness (#8)

### Phase 3: Medium Priority UX (Day 4-5)
9. Fix double navbar/footer (#10)
10. Add "assigned" status (#11)
11. Fix refresh button (#12)
12. Fix servicesStore columns (#13)
13. Parallelize dashboard queries (#14)

### Phase 4: Low Priority Cleanup (Ongoing)
14. Add proper TypeScript types (#15)
15. Fix environment variable access (#16)

---

## Testing Checklist

After each fix, verify:
- [ ] No TypeScript errors
- [ ] Build succeeds
- [ ] Feature works as expected
- [ ] No regression in related features
- [ ] Mobile responsiveness maintained
- [ ] Dark mode works correctly

---

## Notes

- Always test in both development and production builds
- Check Supabase RLS policies after database changes
- Update this document as fixes are completed
