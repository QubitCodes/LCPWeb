# QubitRequest

A powerful, unified request utility for Next.js (App Router). QubitRequest brings a consistent API for handling inputs, files, authentication, and routing metadata across Server Components, Actions, and API Routes.

## Features

- **Global-ish Access:** Call `await request()` anywhere in your server tree.
- **Unified Data:** Access Query Params, Form Data, and JSON bodies via a single `.input()` method.
- **Auto-Casting:** Use `.boolean()` or `.number()` to handle string-to-type conversion.
- **Pattern Matching:** Advanced path matching with wildcards (e.g., `req.matches('*/admin/*')`) and regex support.
- **File Management:** Built-in `.save()` method for local storage handling.
- **Auth Awareness:** Instant detection of Bearer tokens and Session cookies.
- **Metadata:** Out-of-the-box detection for `isMobile`, `wantsJson`, and `isAjax`.

---

## Setup

1. **Install:** Copy `lib/qubit-request.ts` to your project.
2. **Configure Middleware:** You **must** include the provided middleware in your project root. This enables the teleportation of URL and Auth metadata to Server Components.

---

## Usage

### In Server Components (.tsx)
```tsx
import { request } from '@/lib/qubit-request';

export default async function UserProfile() {
  const req = await request();

  return (
    <div>
      <h1>Current Path: {req.url.endpoint}</h1>
      {req.auth && <p>Auth Token: {req.auth.token}</p>}
      <p>Source IP: {req.ip}</p>
    </div>
  );
}
```

### In Server Actions
```typescript
'use server';
import { Action } from '@/lib/qubit-request';

export const uploadAvatar = Action(async (req) => {
  const isPublic = req.boolean('is_public');
  const file = req.file('avatar');

  if (file) {
    await file.save('public/avatars');
  }

  return { success: true };
});
```

### Path Matching
```typescript
const req = await request();

// Leading wildcards
if (req.matches('*/admin/*')) { /* ... */ }

// Explicit Regex
if (req.matches.regex(/\/api\/v[1-2]/)) { /* ... */ }
```

---

## Important Note
> **Request Validation features are coming soon!** Future updates will include schema-based validation directly on the `request` object.

## License
MIT