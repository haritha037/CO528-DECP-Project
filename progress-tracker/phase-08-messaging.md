# Phase 8: Firebase Realtime Messaging

## Status: COMPLETE

## Steps

- [x] Step 8.1 — Firebase RTDB structure defined (`conversations/{id}/metadata`, `conversations/{id}/messages/{pushId}`, `user_conversations/{uid}/{convId}`)
- [x] Step 8.2 — Firebase security rules for messaging (see Pending Actions — must be applied in Firebase Console)
- [x] Step 8.3 — MessagingService interface + FirebaseMessagingService implementation
- [x] Step 8.4 — Next.js messaging UI (/messages — two-panel layout, real-time updates)
- [x] Step 8.5 — Message button on user profile pages

## RTDB Structure

```
/conversations/{conversationId}
  /metadata
    participantA: string     ← sorted uid
    participantB: string     ← sorted uid
    lastMessage: string
    lastMessageAt: number
    lastMessageSenderId: string
  /messages/{pushId}
    senderId: string
    text: string
    sentAt: number           ← Date.now()

/user_conversations/{uid}/{conversationId}
  otherUid: string
  lastMessage: string
  lastMessageAt: number
  unreadCount: number
```

Conversation ID is deterministic: `[uidA, uidB].sort().join('_')`

## Frontend Deliverables

| File | Action | Description |
|------|--------|-------------|
| `lib/messaging/MessagingService.ts` | Rewrite | Typed interface: `Message`, `ConversationMetadata`, `MessagingService` |
| `lib/messaging/FirebaseMessagingService.ts` | Rewrite | Full RTDB implementation: `ensureConversation`, `sendMessage`, `subscribeToMessages`, `subscribeToConversationList`, `markConversationRead` |
| `lib/messaging/index.ts` | Create | Barrel + singleton `messagingService` |
| `app/messages/page.tsx` | Rewrite | Two-panel layout: conversation list (left) + message thread (right). Mobile toggles between panels. Real-time via `onValue`. |
| `app/users/[firebaseUid]/page.tsx` | Update | Added "Message" button (hidden on own profile). Calls `ensureConversation` then navigates to `/messages?with={uid}`. |

## Pending Actions for User

### Firebase RTDB Security Rules

Apply these rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    "notifications": {
      "$userId": {
        ".read": "auth != null && $userId === auth.uid",
        ".write": "auth != null"
      }
    },
    "conversations": {
      "$conversationId": {
        ".read": "auth != null && (data.child('metadata/participantA').val() === auth.uid || data.child('metadata/participantB').val() === auth.uid)",
        "metadata": {
          ".write": "auth != null && (!data.exists() || data.child('participantA').val() === auth.uid || data.child('participantB').val() === auth.uid)"
        },
        "messages": {
          ".write": "auth != null && (root.child('conversations').child($conversationId).child('metadata/participantA').val() === auth.uid || root.child('conversations').child($conversationId).child('metadata/participantB').val() === auth.uid)",
          "$messageId": {
            ".validate": "newData.hasChildren(['senderId','text','sentAt']) && newData.child('senderId').val() === auth.uid && newData.child('text').isString() && newData.child('text').val().length > 0 && newData.child('sentAt').isNumber()"
          }
        }
      }
    },
    "user_conversations": {
      "$uid": {
        ".read": "auth != null && $uid === auth.uid",
        "$conversationId": {
          ".write": "auth != null && ($uid === auth.uid || root.child('conversations').child($conversationId).child('metadata/participantA').val() === auth.uid || root.child('conversations').child($conversationId).child('metadata/participantB').val() === auth.uid)"
        }
      }
    }
  }
}
```

> **Note**: Until rules are applied, keep test mode rules (open read/write) so messaging works during development.
