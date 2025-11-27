# Database Update Instructions for Character Scores

## Overview
The game now tracks additional data that needs to be stored in the database:
- **grinch_score**: Increments when the player hits obstacles (only when NOT in sprint mode)
- **elf_score**: Increments when the player collects collectibles
- **email**: Optional email address collected from players (not displayed on leaderboard)

## Database Schema Changes Required

### Firestore Collection: `scores`

Add three new optional fields to each document in the `scores` collection:

1. **grinch_score** (number, optional)
   - Type: `number`
   - Default value: `0` if not provided
   - Description: Number of times the player hit obstacles during the game

2. **elf_score** (number, optional)
   - Type: `number`
   - Default value: `0` if not provided
   - Description: Number of collectibles the player collected during the game

3. **email** (string, optional)
   - Type: `string`
   - Default value: `undefined` if not provided
   - Description: Player's email address (collected optionally, NOT displayed on leaderboard)
   - Validation: Should be a valid email format if provided
   - Privacy: This field is stored but never displayed in the UI/leaderboard

### Current Schema (for reference):
```typescript
{
  player_name: string,
  distance: number,
  max_combo?: number,
  created_at: string
}
```

### Updated Schema:
```typescript
{
  player_name: string,
  distance: number,
  max_combo?: number,
  grinch_score?: number,  // NEW FIELD
  elf_score?: number,     // NEW FIELD
  email?: string,         // NEW FIELD (optional, not displayed)
  created_at: string
}
```

## Migration Steps

### Option 1: Add Fields to Existing Documents (Recommended)
If you want to backfill existing scores with default values:

1. **Add the fields to all existing documents** in the `scores` collection:
   ```javascript
   // Example migration script (run once)
   const scoresRef = collection(db, 'scores');
   const snapshot = await getDocs(scoresRef);
   
   snapshot.docs.forEach(async (doc) => {
     const data = doc.data();
     const updates: any = {};
     
     if (data.grinch_score === undefined) {
       updates.grinch_score = 0;
     }
     if (data.elf_score === undefined) {
       updates.elf_score = 0;
     }
     // Note: email field doesn't need backfilling - it's optional and can remain undefined
     
     if (Object.keys(updates).length > 0) {
       await updateDoc(doc.ref, updates);
     }
   });
   ```

2. **Update Firestore Security Rules** (if needed):
   - Ensure the new fields can be written/read
   - No special rules needed if existing rules allow all fields

### Option 2: Leave Existing Documents As-Is
- New scores will automatically include the new fields
- Existing scores will have `undefined` values (handled gracefully in the frontend)
- No migration needed, but older scores won't display character scores
- Email field: No migration needed - it's optional and only saved when provided

## Firestore Indexes
No new indexes are required. The existing index on `distance` is sufficient.

## Testing Checklist
- [ ] Verify new scores are saved with `grinch_score` and `elf_score` fields
- [ ] Verify existing scores can still be read (should handle undefined gracefully)
- [ ] Verify leaderboard queries still work correctly
- [ ] Test that scores with 0 values are saved correctly
- [ ] Verify the frontend displays the scores correctly in the leaderboard
- [ ] Verify email field is saved when provided (optional)
- [ ] Verify email field is NOT displayed on leaderboard (privacy requirement)
- [ ] Test that scores can be saved without email (email is optional)
- [ ] Test that if email is provided, initials are required (frontend validation)

## Code Changes Already Made
The frontend code has been updated to:
- ✅ Save `grinch_score` and `elf_score` when submitting scores
- ✅ Read and display these scores in the leaderboard
- ✅ Handle missing/undefined values gracefully (shows nothing if score is 0 or undefined)
- ✅ Save `email` field when provided (optional)
- ✅ Validate email format if provided
- ✅ Require initials if email is provided (validation rule)
- ✅ Never display email on leaderboard (privacy)

## Notes
- These fields are **optional** - the frontend handles missing values
- Default values of `0` are used when saving new scores (for numeric fields)
- The leaderboard only displays character scores if they are greater than 0
- **Email field**: 
  - Optional - can be left empty
  - If provided, player must also enter initials (frontend validation)
  - Stored in database but NEVER displayed on leaderboard (privacy)
  - Only saved if a valid email format is provided
- No breaking changes - existing functionality remains intact

## Privacy Considerations
- Email addresses are collected for potential future communications (newsletters, updates, etc.)
- Email is stored in the database but **never displayed** in the UI or leaderboard
- Email is optional - players can save scores without providing an email
- If email is provided, initials are required (prevents anonymous email collection)

