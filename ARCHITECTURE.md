# Application Architecture Documentation

## Overview

This is a **Task/Event Management Calendar Application** built with React, TypeScript, Vite, and Supabase (via Lovable Cloud). The application allows users to manage their calendar events/tasks and track their performance on a leaderboard.

---

## Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - UI component library
- **React Router DOM** - Client-side routing
- **Recharts** - Data visualization for charts
- **date-fns** - Date manipulation utilities
- **Sonner** - Toast notifications

### Backend
- **Supabase (Lovable Cloud)** - Backend as a Service
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)
  - File Storage (for evidence uploads)

---

## Application Structure

### Pages

```
src/pages/
├── Auth.tsx          - Authentication (login/signup)
├── Index.tsx         - Main calendar view
├── Leaderboard.tsx   - Performance leaderboard
└── NotFound.tsx      - 404 error page
```

### Components

```
src/components/
├── AddEventDialog.tsx       - Modal for creating new events
├── BottomNav.tsx           - Mobile navigation bar
├── CalendarEvent.tsx       - Individual event display
├── CalendarGrid.tsx        - Calendar grid layout
├── CalendarHeader.tsx      - Calendar navigation header
├── CalendarSidebar.tsx     - Sidebar with mini calendar
├── EventDetailsDialog.tsx  - Modal for viewing/editing event details
└── EventFilters.tsx        - Filter events by category
```

### Hooks
```
src/hooks/
├── use-install-pwa.ts  - PWA installation functionality
├── use-mobile.tsx      - Mobile device detection
└── use-toast.ts        - Toast notification management
```

---

## Database Schema

### Tables

#### 1. `events` Table
Stores all calendar events/tasks for users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | gen_random_uuid() | Primary key |
| `user_id` | uuid | No | - | Foreign key to auth.users |
| `title` | text | No | - | Event title |
| `description` | text | Yes | - | Event description |
| `category` | text | No | - | Event category (e.g., "work", "personal") |
| `start_time` | timestamp with time zone | No | - | Event start date/time |
| `end_time` | timestamp with time zone | No | - | Event end date/time |
| `status` | text | Yes | 'pending' | Event status: 'pending', 'completed', 'cancelled' |
| `image_url` | text | Yes | - | Optional event image URL |
| `evidence_url` | text | Yes | - | URL to completion evidence (photo/video) |
| `completed_at` | timestamp with time zone | Yes | - | Timestamp when task was marked complete |
| `created_at` | timestamp with time zone | No | now() | Record creation timestamp |
| `updated_at` | timestamp with time zone | No | now() | Record last update timestamp |

**Row Level Security (RLS) Policies:**
- ✅ Users can view their own events (`auth.uid() = user_id`)
- ✅ Users can create their own events (`auth.uid() = user_id`)
- ✅ Users can update their own events (`auth.uid() = user_id`)
- ✅ Users can delete their own events (`auth.uid() = user_id`)

**Triggers:**
- `update_events_updated_at` - Automatically updates `updated_at` column on row changes

---

#### 2. `leaderboard_users` Table
Stores performance metrics for users to display on the leaderboard.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | uuid | No | gen_random_uuid() | Primary key |
| `user_id` | uuid | Yes | - | Reference to auth.users (nullable for flexibility) |
| `name` | text | No | - | User's display name |
| `designation` | text | No | - | User's role/title |
| `profile_image_url` | text | Yes | - | URL to user's profile image |
| `total_tasks_achieved` | integer | Yes | 0 | Total number of completed tasks |
| `average_daily_tasks` | numeric | Yes | 0 | Average tasks completed per day |
| `cancellation_rate` | numeric | Yes | 0 | Percentage of cancelled tasks (0-100) |
| `completion_rate` | numeric | Yes | 0 | Percentage of completed tasks (0-100) |
| `current_streak` | integer | Yes | 0 | Current consecutive days of task completion |
| `tasks_on_time` | integer | Yes | 0 | Number of tasks completed on/before deadline |
| `total_points` | integer | Yes | 0 | Total gamification points earned |
| `created_at` | timestamp with time zone | No | now() | Record creation timestamp |
| `updated_at` | timestamp with time zone | No | now() | Record last update timestamp |

**Row Level Security (RLS) Policies:**
- ✅ All authenticated users can view leaderboard data (`true`)
- ✅ Users can insert their own leaderboard data (`auth.uid() = user_id`)
- ✅ Users can update their own leaderboard data (`auth.uid() = user_id`)
- ❌ Users cannot delete leaderboard records

**Triggers:**
- `update_leaderboard_users_updated_at` - Automatically updates `updated_at` column on row changes

---

### Storage Buckets

#### 1. `fashion-events` Bucket
- **Public:** Yes
- **Purpose:** Store event images
- **File Types:** Images

#### 2. `task-evidence` Bucket
- **Public:** Yes
- **Purpose:** Store task completion evidence (photos/videos)
- **File Types:** Images and videos (up to 50MB)
- **Usage:** When users mark tasks as complete, they can upload evidence

---

## Database Functions

### `update_updated_at_column()`
```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
```

**Purpose:** Automatically updates the `updated_at` timestamp whenever a row is modified.

**Applied to:**
- `events` table
- `leaderboard_users` table

---

## Authentication

### Supabase Auth Configuration
- **Auto-confirm emails:** Enabled (for development)
- **Authentication methods:**
  - Email/Password
  - (Additional methods can be configured via Supabase dashboard)

### Authentication Flow
1. User visits `/auth` page
2. User signs up or logs in
3. Session token stored in localStorage
4. User redirected to main calendar (`/`)
5. Protected routes check for valid session

---

## Application Features

### 1. Calendar/Task Management
- **View modes:** Month view with day cells
- **Create events:** Click on date or use "Add Event" button
- **Edit events:** Click on existing event
- **Delete events:** From event details dialog
- **Filter by category:** Filter events by category type
- **Event status tracking:**
  - Pending (default)
  - Completed (with evidence upload)
  - Cancelled

### 2. Task Completion Evidence
- Users can mark tasks as complete
- Upload photo or video evidence (up to 50MB)
- Evidence stored in `task-evidence` storage bucket
- Evidence URL saved to `events.evidence_url`

### 3. Leaderboard System
**Metrics tracked:**
- Total Tasks Achieved
- Average Daily Tasks
- Completion Rate (%)
- Cancellation Rate (%)
- Current Streak (consecutive days)
- Tasks Completed On Time
- Total Points (gamification score)

**Display:**
- Top 3 users shown in featured cards with progress charts
- Full table view with all metrics
- Searchable by name or designation
- Sortable by total points

### 4. Responsive Design
- Mobile-first design
- Bottom navigation on mobile
- Sidebar navigation on desktop
- Touch-friendly UI elements

---

## Data Flow Examples

### Creating an Event
```
User fills form → AddEventDialog component
  ↓
Supabase client → INSERT into events table
  ↓
RLS checks auth.uid() = user_id
  ↓
Event created → Index page refetches events
  ↓
Calendar updates with new event
```

### Completing a Task
```
User clicks "Mark as Completed" → EventDetailsDialog
  ↓
Evidence upload dialog opens
  ↓
User selects photo/video → Uploads to task-evidence bucket
  ↓
UPDATE events SET status='completed', evidence_url='...', completed_at=now()
  ↓
RLS validates user owns event
  ↓
Event status updated → Calendar refreshes
```

### Viewing Leaderboard
```
User navigates to /leaderboard
  ↓
Fetch leaderboard_users ordered by total_points DESC
  ↓
RLS allows all authenticated users to read
  ↓
Display top 3 in featured cards
  ↓
Display all in sortable table
```

---

## Security Considerations

### Row Level Security (RLS)
All tables have RLS enabled with appropriate policies:
- Users can only access their own events
- Leaderboard data is readable by all authenticated users
- Write operations require user authentication

### Storage Security
- Both storage buckets are public for easy access
- Files are namespaced by user ID to prevent conflicts
- File size limits enforced (50MB for evidence)

### Authentication
- JWT tokens stored in localStorage
- Auto-refresh enabled for sessions
- Protected routes redirect to `/auth` if not authenticated

---

## Environment Variables

```
VITE_SUPABASE_URL              - Supabase project URL
VITE_SUPABASE_PUBLISHABLE_KEY  - Supabase anon/public key
VITE_SUPABASE_PROJECT_ID       - Supabase project identifier
```

These are automatically configured by Lovable Cloud and should not be edited manually.

---

## Progressive Web App (PWA)

The application is configured as a PWA with:
- Service worker for offline functionality
- Install prompt for mobile devices
- Icon sets (192x192, 512x512)
- Manifest file for app metadata

---

## Future Enhancement Opportunities

### Potential Database Extensions
1. **User Profiles Table:**
   - Avatar images
   - Bio information
   - Notification preferences

2. **Event Categories Table:**
   - Custom user-defined categories
   - Category colors and icons
   - Category-specific settings

3. **Notifications Table:**
   - Reminders for upcoming events
   - Achievement notifications
   - Streak maintenance alerts

4. **Achievements Table:**
   - Badges and achievements
   - Unlock conditions
   - User achievement progress

### Potential Features
- Team/shared calendars
- Recurring events
- Task dependencies
- Calendar integrations (Google Calendar, Outlook)
- Advanced analytics dashboard
- Social features (activity feed, comments)
- Real-time collaboration

---

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check
```

---

## Deployment

The application is automatically deployed via Lovable platform:
- Frontend: Static hosting
- Backend: Lovable Cloud (Supabase)
- Domain: Custom domain configurable in project settings

---

## Support and Resources

- **Lovable Documentation:** https://docs.lovable.dev
- **Supabase Documentation:** https://supabase.com/docs
- **React Documentation:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com/docs

---

**Last Updated:** 2025-10-28
**Version:** 1.0
