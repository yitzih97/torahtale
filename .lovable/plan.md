

# Plan: Add Authentication, Persist Generated Books, and Enhance Dashboard

## Overview
Add full user authentication (email/password), create database tables to store children profiles, generated books, and orders. Save books automatically after generation (even without checkout), and replace the mock dashboard with real data.

---

## Database Schema

### 1. `profiles` table
- `id` (uuid, PK, references auth.users)
- `full_name` (text, nullable)
- `email` (text)
- `created_at` (timestamptz)
- Auto-created via trigger on signup

### 2. `children` table
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, NOT NULL)
- `name` (text)
- `age` (int)
- `gender` (text)
- `photo_url` (text, nullable)
- `art_style` (text, nullable)
- `created_at` (timestamptz)

### 3. `books` table
- `id` (uuid, PK)
- `user_id` (uuid, references auth.users, NOT NULL)
- `child_id` (uuid, references children, nullable)
- `child_name` (text) -- denormalized for display
- `torah_portion` (text)
- `art_style` (text)
- `language` (text)
- `status` (text: "draft", "checkout", "ordered", "printing", "delivered")
- `cover_image_url` (text, nullable)
- `pages_data` (jsonb) -- full BookPage[] array with images and text
- `story_data` (jsonb) -- raw story generation response
- `questions` (jsonb) -- 20 questions array
- `shipping_data` (jsonb, nullable)
- `order_number` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 4. RLS Policies
- All tables: users can only CRUD their own rows (`user_id = auth.uid()`)

### 5. Storage bucket
- `book-images` for storing generated page images (or store as base64/URLs in jsonb)

---

## Authentication

### New files
- **`src/pages/Auth.tsx`** -- Login/Signup page with email+password, toggle between modes, password reset link
- **`src/pages/ResetPassword.tsx`** -- Password reset form at `/reset-password`
- **`src/contexts/AuthContext.tsx`** -- Auth provider with `onAuthStateChange`, `getSession`, user state, loading state

### Route changes (App.tsx)
- Add `/auth` and `/reset-password` routes
- Protect `/dashboard` with auth check (redirect to `/auth` if not logged in)
- Add auth context provider wrapping the app

### Navbar updates
- Show "Login" / "Dashboard" button based on auth state
- Add user avatar/menu with logout option when logged in

---

## Auto-Save Books After Generation

### CreationWizard changes
1. After story + images finish generating (end of step 4 → step 5), automatically save the book to the `books` table with status `"draft"`
2. On "Place Order" (step 7→8), update book status to `"ordered"` and save shipping data
3. If user is not logged in when generating, prompt them to sign up/login to save their book (or store temporarily in state and save after auth)

---

## Dashboard Overhaul

Replace all mock data with real database queries:

### "My Kids" tab
- Fetch from `children` table
- "Add Child" saves to database
- Edit/delete children

### "My Books" tab (new, replaces "Order History")
- Fetch from `books` table, show ALL books (drafts + ordered)
- Draft books show "Resume" button (opens wizard at checkout step) and "Preview" button
- Ordered books show status badge and PDF download
- Each book card shows cover image, torah portion, child name, date, status

### "Orders" tab
- Filter `books` where status is "ordered"/"printing"/"delivered"
- Show order number, shipping status, tracking

### "Subscriptions" tab
- Keep as-is for now (future feature)

### Additional dashboard features
- **Recent activity feed** -- latest book generations, status changes
- **Quick stats** -- total books created, children count
- **"Continue where you left off"** banner for draft books

---

## Technical Details

### Migration SQL (single migration)
```sql
-- profiles table with auto-creation trigger
-- children table with RLS
-- books table with RLS
-- Storage bucket for images
```

### Key code changes
| File | Change |
|------|--------|
| `src/contexts/AuthContext.tsx` | New auth provider |
| `src/pages/Auth.tsx` | New login/signup page |
| `src/pages/ResetPassword.tsx` | New reset password page |
| `src/App.tsx` | Add routes, auth provider, protected routes |
| `src/components/Navbar.tsx` | Auth-aware nav (login/dashboard/logout) |
| `src/components/CreationWizard.tsx` | Auto-save book to DB after generation |
| `src/pages/Dashboard.tsx` | Full rewrite with real data from DB |
| `src/hooks/useBooks.ts` | New hook for book CRUD operations |
| `src/hooks/useChildren.ts` | New hook for children CRUD operations |

