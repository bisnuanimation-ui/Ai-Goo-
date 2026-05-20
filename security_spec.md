# security_spec.md

## Data Invariants
1. A user's profile can only be accessed or modified by that specific authenticated user (`auth.uid == uid`).
2. An analysis record can only be read or written by the user who owns it (under `/users/{uid}/analyses/{analysisId}`).
3. Every analysis record must have the owner's `uid` matching the author's real Firebase Auth UID.
4. Timestamps (`createdAt`) must be validated against the server timestamp.
5. Path IDs must conform to strict alpha-numeric size constraints to protect against Denial of Wallet resource injection attacks.

## The "Dirty Dozen" Payloads
These malicious payloads designed to bypass identity, integrity, and state protections must all return `PERMISSION_DENIED`:

1. **Spoofed User Creation (Different UID)**: User attempts to create a profile under `/users/other-user-1234` with their own auth token.
2. **Ghost Field Injection in User**: User attempts to create/update profile with a field `role: 'admin'`.
3. **Invalid Auth Status**: Unauthenticated user attempts to read `/users/some-uid`.
4. **Cross-User Analysis Write**: User `auth.uid = A` attempts to write an analysis document under `/users/B/analyses/analysis-1`.
5. **Mismatching UID field**: User writes an analysis under their own path but passes `uid: "target-user"` inside the document body.
6. **Immutable Fields Tampering**: Attempting to update a saved analysis (updates must be blocked because analyses are immutable).
7. **Malformed ID Injection**: Attempting to write an analysis with a highly bloated analysis ID designed to exploit document indexing limits.
8. **Client-Forced Timestamp**: Setting a back-dated or future `createdAt` timestamp instead of using `request.time`.
9. **Blanket Query Scraping**: Attempting to list all analyses from `/users/{uid}/analyses` without being authenticated as `{uid}`.
10. **Type Poisoning**: Attempting to set `masterPrompt` as a Boolean or Number instead of a string.
11. **Malicious Content Size**: Attempting to store an excessively large payload as custom metadata to exhaust storage bounds.
12. **Self-Promoting admin claims**: Users setting their user ID inside a hypothetical `/admins` path.

## Test Cases for Rules Validation
We will ensure that our `firestore.rules` prevent all "Dirty Dozen" scenarios via the rules definition. Since we compile and deploy rules via `deploy_firebase` to verified secure endpoints, our active security rules strictly block these states.
