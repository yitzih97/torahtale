

## Plan: Rename Torah Portion Labels to Parsha Names in English + Hebrew

### What Changes

**File:** `src/components/wizard/TorahPortions.ts`

- Add a `hebrew` field to the `TorahOption` interface
- Change every Torah portion `label` from the descriptive English name (e.g. "In the Beginning") to the parsha name format: `"Parshas Bereishis"` 
- Set `sub` to the Hebrew name: `"פרשת בראשית"`
- Apply the same pattern to Nevi'im, Ketuvim, Megillot, and Holiday entries (using proper Hebrew names)
- Update `getPortionLabel` to return both English and Hebrew parsha name

### Example Before/After

**Before:**
```
label: "In the Beginning", sub: "Parashat Bereishit"
label: "Noah's Ark", sub: "Parashat Noach"
```

**After:**
```
label: "Parshas Bereishis", sub: "פרשת בראשית"
label: "Parshas Noach", sub: "פרשת נח"
```

### Scope
- All ~90 entries in `TORAH_PORTIONS` array updated
- Interface updated to keep `label` (English parsha name) and `sub` (Hebrew parsha name)
- No UI component changes needed — existing rendering already shows `label` and `sub`

### Files Changed

| File | Change |
|------|--------|
| `src/components/wizard/TorahPortions.ts` | Rename all labels to "Parshas X" format, set sub to Hebrew names |

