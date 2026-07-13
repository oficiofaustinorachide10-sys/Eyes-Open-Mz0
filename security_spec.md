# Security Specification - Eyes Open MZ Social Platform

This specification documents the security model and safety assertions for the Firebase Firestore database in Eyes Open MZ.

## 1. Data Invariants

1. **User Identity Invariant**: A user's profile can only be created or modified by the authenticated user whose `request.auth.uid` matches the document ID. No user can change their own VIP or verification status (`isVIP` or `isVerified`).
2. **Post Ownership Invariant**: Only the verified creator of a post can delete or update it. During creation, the author ID must match `request.auth.uid`.
3. **Friendship Invariant**: A friendship/vínculo request can only be accepted or ignored by the designated `receiverId`, not by the `senderId`.
4. **Chat Permission Invariant**: Messages in a chat can only be read or written if a valid, unexpired, and accepted `ChatPermission` exists between the sender and receiver.
5. **Audience-Restricted Visibility**: Posts with privacy settings restricted to 'friends', 'family', or 'conhecidos' are only readable by users who have an active, accepted relationship of that respective tier.

---

## 2. The "Dirty Dozen" Payloads

Here are the 12 malicious payloads designed to bypass security controls. The Firestore security rules are constructed to guarantee that all 12 of these attempts fail with `PERMISSION_DENIED`.

### Payload 1: Profile Spoofing / Hijacking
* **Attack**: User `attacker` tries to update the bio/profile of user `victim`.
* **Collection**: `users/victim`
* **Payload**: `{ "bio": "Hacked by attacker" }`
* **Result**: `PERMISSION_DENIED` (UID mismatch)

### Payload 2: Self-Promotion to VIP / Admin
* **Attack**: User `normal_user` tries to register or update their own profile to become a VIP or Verified.
* **Collection**: `users/normal_user`
* **Payload**: `{ "isVIP": true, "isVerified": true }`
* **Result**: `PERMISSION_DENIED` (Cannot self-assign VIP/Verification status)

### Payload 3: Post Creation with Spoofed Author
* **Attack**: User `attacker` tries to publish a post pretending to be user `victim`.
* **Collection**: `posts/malicious_post_1`
* **Payload**: `{ "id": "malicious_post_1", "author": { "id": "victim", "name": "victim" }, "text": "Spoofed text", "stars": 0, "views": 0, "timestamp": 1783337073381 }`
* **Result**: `PERMISSION_DENIED` (Author ID does not match request.auth.uid)

### Payload 4: Arbitrary Star Modification
* **Attack**: User `attacker` tries to force-edit a post to increment the `stars` counter arbitrarily.
* **Collection**: `posts/some_post`
* **Payload**: `{ "stars": 999999 }`
* **Result**: `PERMISSION_DENIED` (Stars must be modified only via the atomic like action or rules)

### Payload 5: Comment Deletion by Stranger
* **Attack**: User `attacker` tries to delete a comment that belongs to user `victim`.
* **Collection**: `posts/some_post`
* **Payload**: Request to delete the comment from comments list or write over comments array.
* **Result**: `PERMISSION_DENIED` (Only comment author or post owner can delete/update comments)

### Payload 6: Self-Approval of Friendship (Vínculo)
* **Attack**: User `attacker` sends a friendship request to `victim`, then tries to approve the request themselves.
* **Collection**: `friendships/req_123`
* **Payload**: `{ "id": "req_123", "senderId": "attacker", "receiverId": "victim", "status": "accepted", "level": "amigo", "timestamp": 1783337073381 }`
* **Result**: `PERMISSION_DENIED` (Sender cannot accept their own request)

### Payload 7: Chat Access Injection
* **Attack**: User `attacker` attempts to insert messages in `chats` to user `victim` without any accepted ChatPermission.
* **Collection**: `chats/message_abc`
* **Payload**: `{ "id": "message_abc", "sender": { "id": "attacker" }, "text": "Hi", "timestamp": 1783337073381 }`
* **Result**: `PERMISSION_DENIED` (Missing accepted ChatPermission)

### Payload 8: Read Blocked Private Posts
* **Attack**: User `stranger` tries to read posts with privacy level set to `friends` of user `target`.
* **Collection**: `posts/private_post_1`
* **Payload**: Request to read/get `posts/private_post_1`.
* **Result**: `PERMISSION_DENIED` (No accepted friendship found of status 'accepted')

### Payload 9: System Notifications Hijack
* **Attack**: User `attacker` tries to generate a system-wide notification mimicking system alerts.
* **Collection**: `notifications/notif_malicious`
* **Payload**: `{ "id": "notif_malicious", "recipientId": "all", "title": "System alert", "text": "Free VIP for everyone!", "type": "system", "sender": { "id": "system" }, "read": false, "timestamp": 1783337073381 }`
* **Result**: `PERMISSION_DENIED` (Standard user cannot write notifications of type 'system' or system sender)

### Payload 10: Value Poisoning (1MB String ID injection)
* **Attack**: User `attacker` injects a 1MB junk string as a document ID to exhaust resources.
* **Collection**: `posts/JUNK_STRING_POISON_123...`
* **Result**: `PERMISSION_DENIED` (ID exceeds standard length checks and fails `isValidId()` pattern)

### Payload 11: Chat Expiry Bypass
* **Attack**: User `attacker` tries to write to a chat where the `ChatPermission` has expired.
* **Collection**: `chats/msg_expired`
* **Result**: `PERMISSION_DENIED` (Permission expired)

### Payload 12: Terminal State Tampering
* **Attack**: User tries to update a deactivated account back to active without authorization, or edit other terminal records.
* **Collection**: `users/some_user`
* **Result**: `PERMISSION_DENIED`

---

## 3. Test Runner Design Pattern

Tests are designed to use `@firebase/rules-unit-testing` to verify that all the payloads above fail.
The final firestore.rules ensures this mathematically.
