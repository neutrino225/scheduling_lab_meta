**SocialQueue**

Facebook Post Scheduling Platform

**Build Plan & Technical Reference**

Stack: Next.js · Bun · SQLite · MinIO · Facebook Graph API

Version 1.0 · April 2026

# **1\. Project Overview**

SocialQueue is an in-house Facebook post scheduling platform built on a modern, lean stack. Instead of paying for a Zapier or Buffer subscription, you own the entire pipeline - from composing a post to the moment it publishes on a Facebook Page.

## **What the app does**

- Connect one or more Facebook Pages via OAuth
- Compose posts: text, images, or text + image
- Schedule posts to any future date/time (10 min → 6 months out)
- Bulk-import post schedules from a CSV file
- A background worker auto-publishes posts when their time arrives
- Dashboard showing scheduled, published, and failed posts
- Retry failed posts, delete scheduled posts, edit drafts

## **Why this stack**

| **Technology**          | **Role**                                   | **Why**                                                      |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| Next.js 14 (App Router) | Frontend + API routes                      | Unified full-stack React - no separate backend server needed |
| Bun                     | Runtime + package manager + worker process | Fast, native SQLite bindings, runs TypeScript directly       |
| SQLite (via bun:sqlite) | Primary database                           | Zero-config, single-file DB, perfect for this scale          |
| MinIO                   | Media object storage                       | S3-compatible, self-hosted, free - stores uploaded images    |
| Facebook Graph API      | Publishing target                          | The only official way to post to Facebook Pages              |

# **2\. System Architecture**

The system has two main runtime components: the Next.js app (handles the UI and API) and the Bun scheduler worker (a separate long-running process that checks for due posts every 30 seconds and publishes them).

## **2.1 Request flow - creating a scheduled post**

- User fills out the compose form in the browser (Next.js UI)
- Browser uploads the image file to POST /api/upload → stored in MinIO, returns a URL
- Browser submits post data to POST /api/posts → saved as a row in SQLite with status='scheduled'
- The Bun worker polls SQLite every 30s for rows where scheduled_at <= now
- Worker fetches the image from MinIO, uploads to Facebook /photos, gets a photo_id
- Worker creates the Facebook feed post with the attached photo_id
- Worker updates the SQLite row: status='published', fb_post_id='...'
- Dashboard reflects the published status in real-time via polling

## **2.2 Component map**

| **Component**                    | **Description**                                       |
| -------------------------------- | ----------------------------------------------------- |
| app/ (Next.js)                   | All UI pages and React components                     |
| app/api/ (Next.js API Routes)    | REST endpoints consumed by the UI                     |
| worker.ts (Bun)                  | Standalone process - the publishing engine            |
| lib/ (shared utilities)          | DB access, MinIO client, Facebook helpers, validators |
| db.sqlite                        | Single file - all posts, pages, tokens, job logs      |
| MinIO bucket: social-media-posts | Stores all user-uploaded media files                  |

## **2.3 How scheduling works (the core concept)**

There is no magic. Scheduling is simply: save a row in SQLite with a future timestamp, then have a background process check that timestamp repeatedly.

**Key insight**

Facebook's own scheduled posts API (published=false + scheduled_publish_time) has quirks - posts can silently fail to appear on the timeline. Instead, SocialQueue manages its own schedule in SQLite and publishes immediately when the time arrives. This gives you full control and visibility over every post.

The worker flow in pseudocode:

- Every 30 seconds: SELECT \* FROM posts WHERE status='scheduled' AND scheduled_at <= now()
- For each due post: set status='publishing', call Facebook API, then set status='published' or 'failed'
- Failed posts store the error message. You can retry them from the dashboard.

# **3\. Database Design**

SQLite is the only database. Three tables cover everything. You'll initialise them once by running a migration script.

## **3.1 Table: facebook_pages**

Stores connected Facebook Pages and their access tokens. A user connects a page via OAuth; the resulting never-expiring Page Access Token is stored here.

| **Column**   | **Type** | **Notes**                                                        |
| ------------ | -------- | ---------------------------------------------------------------- |
| page_id      | TEXT PK  | Facebook's Page ID (e.g. 123456789)                              |
| name         | TEXT     | Page display name                                                |
| access_token | TEXT     | Never-expiring Page Access Token - store encrypted in production |
| picture_url  | TEXT     | Page profile picture URL for UI display                          |
| connected_at | INTEGER  | UNIX timestamp of when the page was connected                    |

## **3.2 Table: posts**

The central table. Every scheduled, published, draft, and failed post lives here.

| **Column**   | **Type** | **Notes**                                                         |
| ------------ | -------- | ----------------------------------------------------------------- |
| id           | TEXT PK  | UUID (first 16 chars via crypto.randomUUID())                     |
| page_id      | TEXT FK  | References facebook_pages.page_id                                 |
| message      | TEXT     | Post text content (can be null if media-only)                     |
| media_url    | TEXT     | Full URL to the image in MinIO (null for text-only)               |
| media_type   | TEXT     | 'image' \| 'video' \| null                                        |
| status       | TEXT     | 'draft' \| 'scheduled' \| 'publishing' \| 'published' \| 'failed' |
| scheduled_at | INTEGER  | UNIX timestamp (seconds) for when to publish                      |
| published_at | INTEGER  | Filled in by worker when actually published                       |
| fb_post_id   | TEXT     | Facebook's post ID after successful publish                       |
| error        | TEXT     | Error message if status='failed'                                  |
| retry_count  | INTEGER  | Number of retry attempts (default 0)                              |
| created_at   | INTEGER  | UNIX timestamp of record creation                                 |
| updated_at   | INTEGER  | Updated on every status change                                    |

## **3.3 Table: worker_logs**

Each worker run logs what it did. Useful for debugging missed or double-published posts.

| **Column**      | **Type**   | **Notes**                     |
| --------------- | ---------- | ----------------------------- |
| id              | INTEGER PK | Auto-increment                |
| run_at          | INTEGER    | When the worker ran           |
| posts_checked   | INTEGER    | How many due posts were found |
| posts_published | INTEGER    | How many succeeded            |
| posts_failed    | INTEGER    | How many failed               |

# **4\. Project Folder Structure**

Below is the complete file and folder structure you'll build. Everything under app/ is Next.js. Everything under lib/ is shared code used by both Next.js and the worker.

| **Path**                              | **Purpose**                                       |
| ------------------------------------- | ------------------------------------------------- |
| socialqueue/                          | Root project directory                            |
| ├── app/                              | Next.js App Router - all pages and API routes     |
| │ ├── layout.tsx                      | Root layout: sidebar, nav, global providers       |
| │ ├── page.tsx                        | Dashboard (redirects to /dashboard)               |
| │ ├── dashboard/page.tsx              | Main posts calendar and status overview           |
| │ ├── compose/page.tsx                | Single post compose + schedule form               |
| │ ├── bulk/page.tsx                   | CSV bulk upload page                              |
| │ ├── pages-connect/page.tsx          | Facebook page connection flow                     |
| │ └── api/                            | API route handlers                                |
| │ ├── auth/facebook/route.ts          | Initiates Facebook OAuth                          |
| │ ├── auth/facebook/callback/route.ts | Handles OAuth callback + token storage            |
| │ ├── pages/route.ts                  | GET connected pages                               |
| │ ├── posts/route.ts                  | GET all posts, POST create single post            |
| │ ├── posts/\[id\]/route.ts           | GET, PATCH (edit/retry), DELETE a post            |
| │ ├── posts/bulk/route.ts             | POST: CSV bulk schedule endpoint                  |
| │ └── upload/route.ts                 | POST: upload media to MinIO, return URL           |
| ├── lib/                              | Shared utilities (used by API routes AND worker)  |
| │ ├── db.ts                           | SQLite connection singleton + migration runner    |
| │ ├── schema.sql                      | CREATE TABLE statements - source of truth for DB  |
| │ ├── facebook.ts                     | Graph API helpers: token exchange, post publish   |
| │ ├── minio.ts                        | MinIO client setup + upload/presign helpers       |
| │ └── validators.ts                   | Zod schemas for all API request bodies            |
| ├── components/                       | Reusable React components                         |
| │ ├── PostCard.tsx                    | Single post card (status badge, preview, actions) |
| │ ├── ComposeForm.tsx                 | Post compose form with media preview              |
| │ ├── BulkUpload.tsx                  | CSV drag-and-drop upload component                |
| │ ├── CalendarView.tsx                | Month/week grid showing scheduled posts           |
| │ ├── PageSelector.tsx                | Dropdown to pick which FB page to post to         |
| │ └── StatusBadge.tsx                 | draft/scheduled/published/failed pill badge       |
| ├── worker.ts                         | Bun scheduler worker - runs as a separate process |
| ├── db.sqlite                         | SQLite database file (gitignored)                 |
| ├── .env.local                        | Environment variables (gitignored)                |
| ├── package.json                      | Dependencies                                      |
| └── tsconfig.json                     | TypeScript config                                 |

# **5\. API Design**

All endpoints are Next.js API routes under app/api/. They communicate with the SQLite database via lib/db.ts. The frontend calls these from React components using fetch().

## **5.1 Authentication endpoints**

| **Method + Path**               | **What it does**                                                                                                  |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| GET /api/auth/facebook          | Redirects user to Facebook OAuth consent screen                                                                   |
| GET /api/auth/facebook/callback | Facebook redirects here with ?code=. Exchanges code for tokens, stores page tokens in DB, redirects to /dashboard |

## **5.2 Pages endpoints**

| **Method + Path**        | **What it does**                             |
| ------------------------ | -------------------------------------------- |
| GET /api/pages           | Returns all connected Facebook pages from DB |
| DELETE /api/pages/\[id\] | Disconnects a page (deletes token from DB)   |

## **5.3 Posts endpoints**

| **Method + Path**        | **Request body / params**                                 | **What it does**                                                                 |
| ------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------- |
| GET /api/posts           | ?page_id=&status=&limit=&offset=                          | Paginated list of posts, filterable by page and status                           |
| POST /api/posts          | { page_id, message, media_url, media_type, scheduled_at } | Create a single scheduled or draft post                                          |
| GET /api/posts/\[id\]    | -                                                         | Get a single post's full details                                                 |
| PATCH /api/posts/\[id\]  | { message?, scheduled_at?, status? }                      | Edit a scheduled post or manually retry a failed one                             |
| DELETE /api/posts/\[id\] | -                                                         | Delete a draft or scheduled post (cannot delete published)                       |
| POST /api/posts/bulk     | multipart/form-data: file (CSV), page_id                  | Parse CSV and insert all valid rows as scheduled posts in one SQLite transaction |

## **5.4 Upload endpoint**

| **Method + Path** | **Request body**                        | **Response**                                      |
| ----------------- | --------------------------------------- | ------------------------------------------------- |
| POST /api/upload  | multipart/form-data: file (image/video) | { url: string } - MinIO URL for the uploaded file |

## **5.5 Validation rules (enforced server-side)**

- scheduled_at must be a valid ISO 8601 string or UNIX timestamp
- scheduled_at must be >= now + 10 minutes
- scheduled_at must be <= now + 6 months (Facebook API limit)
- page_id must exist in the facebook_pages table
- message or media_url must be present (cannot have an empty post)
- media uploads: max 10MB, accepted types: image/jpeg, image/png, image/gif, image/webp

# **6\. Facebook OAuth & Token Flow**

This is the most important thing to get right. Facebook has three types of tokens and you need to understand all three before writing any code.

## **6.1 Token types**

| **Token type**         | **Lifetime**                                  | **What it can do**                | **Where you use it**                                  |
| ---------------------- | --------------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| Short-lived User Token | ~2 hours                                      | Basic Graph API calls as the user | Received from OAuth callback - discard after exchange |
| Long-lived User Token  | ~60 days                                      | Can request page tokens           | Intermediate - use to call /me/accounts               |
| Page Access Token      | Never expires (if from long-lived user token) | Post, schedule, manage the Page   | Store this in your DB - this is what you use forever  |

## **6.2 Token exchange flow**

- User clicks 'Connect Facebook Page' in your app
- Your app redirects to: <https://www.facebook.com/v21.0/dialog/oauth> with client_id, redirect_uri, scope=pages_manage_posts,pages_read_engagement
- User approves permissions, Facebook redirects to your callback URL with ?code=XXXX
- Your callback route POSTs to Facebook's token endpoint to exchange the code for a short-lived user token
- Your callback route exchanges the short-lived token for a long-lived token (60 days) using client_id + client_secret
- Your callback route calls GET /me/accounts?access_token=LONG_LIVED_TOKEN - this returns all pages the user manages, each with their own never-expiring Page Access Token
- Store each page's page_id, name, and access_token in your facebook_pages table
- The Page Access Token is what the worker uses forever (until the user disconnects)

**Critical:**

Never store the short-lived user token or intermediate long-lived user token. Only store the Page Access Token from step 6. If you store the wrong token and use it to publish, it will work initially then break after 60 days.

## **6.3 Required Facebook app permissions**

In your Meta Developer Dashboard, under your app's permissions, you need:

- pages_manage_posts - allows creating/scheduling posts on pages the user manages
- pages_read_engagement - allows reading post insights and page info
- pages_show_list - allows listing which pages the user manages

For a Development-mode app (not yet submitted for App Review), these permissions work for you and any Test Users you add. You do not need App Review to test with your own account.

# **7\. Facebook Publishing - Graph API Details**

The worker calls two Facebook Graph API endpoints to publish a post with an image. For text-only posts, only one call is needed.

## **7.1 Text-only post**

One API call to /{page-id}/feed:

- **Endpoint:** POST <https://graph.facebook.com/v21.0/{page_id}/feed>
- **Required params:** message (the text), access_token (page token), published=true
- **Response:** { "id": "123456_789012" } - store this as fb_post_id

## **7.2 Post with image (two-step process)**

Facebook requires you to upload the image first, then attach it to the post. You cannot inline base64 images.

Step 1 - Upload image (get a photo_id back):

- **Endpoint:** POST <https://graph.facebook.com/v21.0/{page_id}/photos>
- **Params:** url (the MinIO URL), published=false (don't post it yet), access_token
- **Response:** { "id": "photo_id_here" }

Step 2 - Create the feed post with the attached photo:

- **Endpoint:** POST <https://graph.facebook.com/v21.0/{page_id}/feed>
- **Params:** message, attached_media: \[{ media_fbid: "photo_id_here" }\], published=true, access_token

## **7.3 Important constraints**

**Facebook API constraints to validate before publishing:**

• The MinIO image URL must be publicly accessible - Facebook's servers fetch the image. Use a public bucket policy or a presigned URL valid for at least 24h. • For video posts, the upload API is different (/videos endpoint) and requires the video to be already uploaded - video support is a phase 2 feature. • Rate limits: 200 calls per hour per Page token. At normal scheduling volumes, you will never hit this.

# **8\. MinIO Setup & Media Handling**

MinIO is your S3-compatible object store for all uploaded images. You run it locally with Docker. In production you would deploy it to a server or switch to AWS S3 (the SDK is identical).

## **8.1 Local setup**

- Install Docker Desktop if not already installed
- Run MinIO: docker run -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=admin -e MINIO_ROOT_PASSWORD=password123 minio/minio server /data --console-address ':9001'
- Open <http://localhost:9001> in your browser, log in with admin / password123
- Create a bucket called social-media-posts
- Set the bucket policy to Public so Facebook can fetch images (Manage → Access → Public)

## **8.2 Upload flow**

- User selects a file in the ComposeForm component
- Browser sends the file to POST /api/upload as multipart/form-data
- API route reads the file, generates a unique key: {timestamp}-{originalname}
- Uploads to MinIO using the minio SDK: minio.putObject(bucket, key, buffer)
- Returns { url: '<http://localhost:9000/social-media-posts/{key}>' } to the browser
- Browser stores this URL in the compose form state, submits it as media_url when creating the post
- The worker later passes this URL to Facebook's /photos endpoint

## **8.3 Production considerations**

- Switch to an S3-compatible cloud provider (AWS S3, Cloudflare R2) by changing the endpoint in .env
- Use a private bucket + generate presigned URLs that expire in 7 days - regenerate them before the worker publishes if needed
- Consider running MinIO on a VPS with a domain so the URLs are publicly accessible without extra tunneling

# **9\. Bulk Scheduling**

Bulk scheduling lets users upload a CSV file with multiple posts and have them all imported at once. This is the equivalent of Zapier's 'add multiple rows to a table' flow.

## **9.1 CSV format**

The expected CSV format (first row is the header):

| **Column**   | **Required?**                   | **Format / Example**                            |
| ------------ | ------------------------------- | ----------------------------------------------- |
| page_id      | No (can default to query param) | 123456789                                       |
| message      | Yes (unless media_url present)  | Check out our latest product!                   |
| media_url    | No                              | <https://your-minio/img.jpg> (already uploaded) |
| media_type   | No                              | 'image' or 'video'                              |
| scheduled_at | Yes                             | ISO 8601: 2026-05-01T09:00:00Z                  |

## **9.2 Bulk import rules**

- All inserts happen inside a single SQLite transaction - either all succeed or none do (for data integrity)
- Each row is individually validated. Invalid rows are skipped and reported back in the response (not rejected wholesale)
- Duplicate detection: if a post with the same page_id, message, and scheduled_at already exists, the row is skipped
- Maximum 500 rows per CSV upload to prevent abuse
- The API returns a summary: { created: 48, skipped: 2, errors: \['Row 12: too soon', ...\] }

## **9.3 UI for bulk upload**

The /bulk page has:

- A CSV template download button (so users get the right column headers)
- A drag-and-drop file upload area (accepts .csv files only)
- A preview table showing the first 5 rows of the parsed CSV before confirming
- A 'Page' dropdown to set the default page_id for all rows that don't specify one
- Submit button → shows progress spinner → result summary

# **10\. UI Pages & Components**

## **10.1 Dashboard (/dashboard)**

The main landing page. Shows all posts across all connected pages.

- Status filter tabs: All / Scheduled / Published / Failed / Draft
- Posts listed in reverse chronological order by scheduled_at
- Each PostCard shows: page name + avatar, post message preview, media thumbnail if present, scheduled time (relative: 'in 2 hours' / 'tomorrow at 9am'), status badge, and action buttons
- Action buttons: Edit (scheduled/draft only), Delete (scheduled/draft only), Retry (failed only), View on Facebook (published only)
- Refresh button (or auto-poll every 30s) to see worker updates

## **10.2 Compose (/compose)**

Single post creation form.

- Page selector dropdown (loads from GET /api/pages)
- Message textarea with character count (Facebook limit: 63,206 chars - show warning at 500)
- Image upload: drag-and-drop or click to select, shows preview, sends to POST /api/upload on select
- Date + time picker for scheduled_at (shows user's local timezone, converts to UTC before storing)
- 'Schedule' button → POST /api/posts → success toast → redirect to dashboard
- 'Save as draft' button → saves with status='draft', no scheduled_at

## **10.3 Bulk Upload (/bulk)**

Described in Section 9.3 above.

## **10.4 Connect Pages (/pages-connect)**

- Shows currently connected Facebook pages with their profile pictures and names
- 'Connect Page' button → GET /api/auth/facebook → Facebook OAuth flow → returns to this page
- 'Disconnect' button per page → removes the page token from DB
- If no pages are connected, shows an empty state with a prominent 'Connect a Facebook Page' CTA

# **11\. Build Phases**

Work through these phases in order. Each phase ends with a concrete testing checkpoint. Do not move to the next phase until the checkpoint passes.

| **Phase 1 - Foundation (1-2 days)** |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Goal**                            | Project skeleton, DB migrations, MinIO running, environment wired up                                                                                   |
| **1\. Init project**                | bun create next-app socialqueue --typescript. Install dependencies: minio, zod, bun:sqlite (built-in).                                                 |
| **2\. Write schema.sql**            | Create all three tables (facebook_pages, posts, worker_logs) with indexes.                                                                             |
| **3\. Write lib/db.ts**             | Create the SQLite singleton. On startup, read and execute schema.sql to create tables if they don't exist.                                             |
| **4\. Start MinIO**                 | Run the Docker command from Section 8.1. Create the bucket. Set it to public.                                                                          |
| **5\. Write .env.local**            | Add all env vars: FB_APP_ID, FB_APP_SECRET, FB_REDIRECT_URI, MINIO_ENDPOINT, MINIO_PORT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY.                           |
| **Checkpoint**                      | Run bun run dev. Open <http://localhost:3000> - Next.js default page loads. SQLite db.sqlite file exists. MinIO console is at <http://localhost:9001>. |

| **Phase 2 - Facebook OAuth (1 day)**               |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Goal**                                           | Connect a real Facebook Page and store its access token in SQLite                                                                                      |
| **1\. Write lib/facebook.ts**                      | Implement: buildOAuthUrl(), exchangeCodeForToken(), getLongLivedToken(), getUserPages()                                                                |
| **2\. Write /api/auth/facebook/route.ts**          | Redirect to Facebook OAuth URL                                                                                                                         |
| **3\. Write /api/auth/facebook/callback/route.ts** | Handle code exchange, store page tokens in DB                                                                                                          |
| **4\. Write /api/pages/route.ts**                  | Return all rows from facebook_pages as JSON                                                                                                            |
| **5\. Basic UI**                                   | Add a 'Connect Facebook Page' button to the home page that hits /api/auth/facebook                                                                     |
| **Checkpoint**                                     | Click the button, complete OAuth, then query your SQLite DB: SELECT \* FROM facebook_pages - you should see at least one row with a real access_token. |

| **Phase 3 - Post Creation & Storage (1 day)** |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Goal**                                      | Create a post via the API and see it in the DB                                                                                                                                           |
| **1\. Write lib/validators.ts**               | Zod schema for CreatePostInput with all validation rules from Section 5.5                                                                                                                |
| **2\. Write /api/posts/route.ts**             | Implement GET (list posts) and POST (create post)                                                                                                                                        |
| **3\. Write /api/posts/\[id\]/route.ts**      | Implement GET, PATCH, DELETE                                                                                                                                                             |
| **4\. Write /api/upload/route.ts**            | Upload file to MinIO, return URL                                                                                                                                                         |
| **5\. Write lib/minio.ts**                    | MinIO client singleton, ensureBucket(), uploadMedia()                                                                                                                                    |
| **Checkpoint**                                | Use curl or Postman: POST /api/posts with a valid page_id and scheduled_at 15 minutes in the future. Check SQLite: SELECT \* FROM posts - the row should appear with status='scheduled'. |

| **Phase 4 - The Worker (1 day)** |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Goal**                         | Worker picks up the due post from Phase 3 and publishes it to Facebook                                                                  |
| **1\. Write worker.ts**          | Implement the poll loop, status transitions, Facebook publish calls (text-only first, then image)                                       |
| **2\. Test with short delay**    | Update your test post's scheduled_at to now - 60 in SQLite, run bun run worker.ts                                                       |
| **3\. Add error handling**       | Catch Facebook API errors, write to posts.error, set status='failed'                                                                    |
| **4\. Add worker_logs**          | Write a log entry after each poll run                                                                                                   |
| **Checkpoint**                   | Worker publishes the test post. Go to your Facebook Page - the post appears. The DB row shows status='published' and a real fb_post_id. |

| **Phase 5 - Full UI (2-3 days)**   |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Goal**                           | Complete dashboard, compose form, pages UI - fully usable app                                                                                                               |
| **1\. Build layout.tsx**           | Sidebar with links to Dashboard, Compose, Bulk, Pages                                                                                                                       |
| **2\. Build Dashboard**            | PostCard components, status filter tabs, polling refresh                                                                                                                    |
| **3\. Build ComposeForm**          | Page selector, message textarea, image upload preview, datetime picker                                                                                                      |
| **4\. Build Connect Pages UI**     | Connected pages list, connect/disconnect buttons                                                                                                                            |
| **5\. Wire all components to API** | Replace any hardcoded data with real API calls                                                                                                                              |
| **Checkpoint**                     | Full end-to-end: connect a page in the UI, compose a post with an image, schedule it 12 minutes from now, watch the dashboard update to 'published' after the worker fires. |

| **Phase 6 - Bulk Scheduling (1 day)**  |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Goal**                               | CSV upload endpoint and bulk UI working                                                                                            |
| **1\. Write /api/posts/bulk/route.ts** | Parse CSV, validate rows, bulk insert in a single transaction                                                                      |
| **2\. Build BulkUpload component**     | File dropzone, CSV preview table, submit with result summary                                                                       |
| **3\. Add CSV template download**      | Generate and serve a sample CSV via a route or static file                                                                         |
| **Checkpoint**                         | Upload a 10-row CSV. Confirm 10 rows in SQLite with the correct scheduled times. Wait for the worker to publish the first due row. |

# **12\. Testing with Your Existing Facebook App**

You already have a Facebook app. Here is the exact sequence to wire it up and verify every piece is working correctly.

## **12.1 Facebook app settings to check first**

- Go to developers.facebook.com → Your App → Settings → Basic
- Note your App ID and App Secret - these go into FB_APP_ID and FB_APP_SECRET in .env.local
- Under 'App Domains', add localhost
- Under Facebook Login → Settings, add <http://localhost:3000/api/auth/facebook/callback> to 'Valid OAuth Redirect URIs'
- Make sure the App is in Development mode (top of the page) - this allows testing without App Review

## **12.2 Verify your permissions**

- Go to App Review → Permissions and Features
- Confirm pages_manage_posts and pages_read_engagement are listed (in development mode these work automatically)
- If they're not listed, go to Add a Feature/Permission and request them - in Development mode, they're immediately available for you and your test users

## **12.3 Manual token testing (before building OAuth)**

Before writing OAuth code, verify that posting actually works by getting a token manually:

- Go to developers.facebook.com/tools/explorer
- Select your app from the top-right dropdown
- Click 'Generate Access Token' and grant pages_manage_posts and pages_read_engagement
- In the left panel, change the endpoint to GET /me/accounts and click Submit
- Copy the access_token from one of your pages (not from the user-level response)
- Paste this token directly into your database: INSERT INTO facebook_pages VALUES ('YOUR_PAGE_ID', 'Test Page', 'PASTE_TOKEN_HERE', null, unixepoch())
- Now run the worker against a test post - it should publish using this manually-added token

**Why test this manually first?**

This isolates the Facebook publishing logic from the OAuth flow. If publishing works with a manual token, then any OAuth issues are purely in your auth code, not in the worker or Graph API calls. Saves a lot of debugging time.

## **12.4 Verifying a post was published**

- Check your SQLite row: SELECT id, status, fb_post_id, error FROM posts WHERE id='your_post_id'
- If status='published': go to your Facebook Page, check the Posts section - it should appear
- If status='failed': check the error column - common errors below

| **Error message**                          | **Cause**                                          | **Fix**                                                                  |
| ------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------ |
| OAuthException: Invalid token              | Token expired or wrong scope                       | Re-generate the token in Graph API Explorer with correct permissions     |
| OAuthException: #200 requires manage_pages | Using user token instead of page token             | Use the access_token from /me/accounts, not the top-level user token     |
| (#100) No permission to access URL         | MinIO URL not publicly accessible                  | Set bucket policy to public or use a presigned URL accessible externally |
| (#368) Feature restricted                  | App in development mode posting to a non-test page | Add the page owner as a Test User or switch to a test page               |

# **13\. Environment Variables & Dependencies**

## **13.1 Full .env.local**

| **Variable**        | **Value / Notes**                                           |
| ------------------- | ----------------------------------------------------------- |
| FB_APP_ID           | From Meta Developer Dashboard → Your App → Settings → Basic |
| FB_APP_SECRET       | Same location - never commit this to git                    |
| FB_REDIRECT_URI     | <http://localhost:3000/api/auth/facebook/callback>          |
| MINIO_ENDPOINT      | localhost (or your MinIO server hostname in production)     |
| MINIO_PORT          | 9000                                                        |
| MINIO_USE_SSL       | false (true in production with HTTPS)                       |
| MINIO_ACCESS_KEY    | admin (or your MinIO access key)                            |
| MINIO_SECRET_KEY    | password123 (use a strong secret in production)             |
| MINIO_BUCKET        | social-media-posts                                          |
| DATABASE_PATH       | ./db.sqlite (or an absolute path)                           |
| NEXT_PUBLIC_APP_URL | <http://localhost:3000>                                     |

## **13.2 npm dependencies (package.json)**

| **Package**       | **Version** | **Purpose**                                |
| ----------------- | ----------- | ------------------------------------------ |
| next              | ^14.x       | The Next.js framework                      |
| react / react-dom | ^18.x       | React runtime                              |
| minio             | ^8.x        | MinIO/S3 client SDK                        |
| zod               | ^3.x        | Request body validation and type inference |
| typescript        | ^5.x        | TypeScript compiler                        |
| @types/node       | ^20.x       | Node types for bun/node compatibility      |

Note: bun:sqlite is built into Bun - no additional package needed. The worker uses this directly.

## **13.3 package.json scripts**

| **Script** | **Command**               | **What it does**                                         |
| ---------- | ------------------------- | -------------------------------------------------------- |
| dev        | next dev                  | Starts Next.js in development mode with hot reload       |
| build      | next build                | Builds the production Next.js bundle                     |
| start      | next start                | Runs the production Next.js server                       |
| worker     | bun run worker.ts         | Starts the scheduler worker (run in a separate terminal) |
| worker:dev | bun --watch run worker.ts | Worker with hot reload (restarts on file changes)        |
| migrate    | bun run lib/db.ts         | Runs the DB migration manually (also runs on app start)  |

# **14\. Security & Production Notes**

For a personal/internal tool, the above is fine to ship. Before exposing this to other users or the internet, address these points:

## **14.1 Encrypt stored tokens**

Page Access Tokens are sensitive credentials. In production, encrypt them before storing in SQLite using AES-256 with a master key from your environment. Decrypt only in the worker at publish time. A simple way to do this in Bun: use the built-in crypto.subtle with AES-GCM.

## **14.2 Authentication for the app itself**

Right now there is no login. Anyone who can reach <http://localhost:3000> can manage your Facebook pages. Before deploying:

- Add HTTP Basic Auth via Next.js middleware for a quick internal solution
- Or add a proper auth layer: NextAuth.js, Clerk, or Auth.js

## **14.3 Running the worker in production**

In production, the worker must stay alive permanently. Options:

- PM2: pm2 start worker.ts --interpreter bun - process manager, restarts on crash
- Systemd service: write a unit file pointing to bun run /path/to/worker.ts
- Docker: run the worker as a sidecar container alongside your Next.js app

## **14.4 SQLite backups**

SQLite is a single file (db.sqlite). Back it up regularly:

- Set up a daily cron job that copies db.sqlite to a MinIO bucket or S3
- Use SQLite's .backup command for a hot backup: sqlite3 db.sqlite .backup backup.sqlite

## **14.5 MinIO for production**

- Run MinIO on a dedicated server (or use a VPS with Docker)
- Enable TLS (MINIO_USE_SSL=true) and point it at a domain with a real certificate
- Or migrate to AWS S3 / Cloudflare R2 - the SDK calls are identical, just change the endpoint and credentials

# **15\. Build Checklist**

Use this as a running checklist as you build. Each item corresponds to a section in this document.

## **Phase 1 - Foundation**

- bun create next-app with TypeScript
- Install dependencies: minio, zod
- Write lib/schema.sql with all three tables
- Write lib/db.ts with migration runner
- MinIO running via Docker, bucket created, public policy set
- .env.local fully filled in
- Checkpoint: Next.js app loads, SQLite file exists, MinIO console accessible

## **Phase 2 - Facebook OAuth**

- Facebook app redirect URI added in Meta Developer Dashboard
- lib/facebook.ts: buildOAuthUrl, exchangeCodeForToken, getLongLivedToken, getUserPages
- /api/auth/facebook/route.ts and /callback/route.ts
- /api/pages/route.ts returns connected pages
- Checkpoint: OAuth flow completes, page token stored in SQLite

## **Phase 3 - Posts API**

- lib/validators.ts: Zod schemas with all validation rules
- lib/minio.ts: client, ensureBucket, uploadMedia
- /api/upload/route.ts returns MinIO URL
- /api/posts/route.ts: GET list + POST create
- /api/posts/\[id\]/route.ts: GET, PATCH, DELETE
- Checkpoint: POST /api/posts creates a row in SQLite with status='scheduled'

## **Phase 4 - Worker**

- worker.ts: poll loop, status transitions, text-only publish
- worker.ts: image upload (Step 1 /photos, Step 2 /feed with attached_media)
- worker.ts: error handling, status='failed', error column written
- worker.ts: worker_logs table updated after each run
- Checkpoint: worker publishes test post, FB page shows the post, SQLite row shows published

## **Phase 5 - UI**

- layout.tsx: sidebar navigation
- dashboard/page.tsx: PostCard list with status filter tabs
- compose/page.tsx: full ComposeForm with image upload + datetime picker
- pages-connect/page.tsx: connected pages list + OAuth connect button
- Checkpoint: full end-to-end without touching the terminal or curl

## **Phase 6 - Bulk**

- /api/posts/bulk/route.ts: CSV parse, validate, transaction insert
- bulk/page.tsx: BulkUpload component with dropzone + preview table
- CSV template download
- Checkpoint: 10-row CSV imported, posts appear in dashboard, worker publishes first due

**You're done.**

With all six phases complete, you have a fully functional Facebook post scheduling platform that replicates the core functionality of Zapier's social media scheduling - running entirely on your own infrastructure, for free.