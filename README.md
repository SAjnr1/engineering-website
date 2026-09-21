# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

# SAVOS admin: Supabase setup

This project has a protected admin area built with React and Supabase.

- `/admin/login` is public. Every other `/admin/...` page needs a logged-in session.
- After login, the admin lands on `/admin/homepage` (`AdminHome.jsx`).
- On `/admin/student`, the admin creates **year group cards** with a year, a class nickname, and a cover picture.
- Clicking a card opens `/admin/student/<year>`, where the admin adds **students** (name and picture) for that year group.
- Year group cards and student cards can both be deleted, after a confirmation. Deleting a year group also deletes its students and all of their pictures.
- On `/admin/project`, the admin uploads **projects**: a name, a picture, and a PDF (PDF files only). Each project card has a **Read about project** button that takes the admin to a page inside the admin area (`/admin/project/<id>`) where the PDF is shown for reading. Projects can be deleted too, which also removes their picture and PDF.
- On `/admin/media`, the admin posts **pictures only** (JPG, PNG, WebP or GIF, several at once). Pictures show in a gallery and can be deleted.
- On `/admin/announcement`, the admin posts **announcements**, each with a date. They are listed newest date first and can be deleted.
- Visitors who are not logged in can open **public, view-only pages**: `/year-groups`, `/media`, `/projects`, and `/announcements`. They show what the admin has posted and have no edit or delete buttons.

Follow the steps in order. Setup takes about 15 minutes.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New project**.
3. Choose a name (for example `savos`), set a database password, and pick the region closest to your users.
4. Wait for the project to finish setting up.

## 2. Add your keys to the React app

1. In Supabase, open **Project Settings** and then **API**.
2. Copy the **Project URL** and the **anon public key** (newer dashboards may call it the publishable key).
3. In the root of your React project (next to `package.json`), create a file named `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

4. Add `.env` to your `.gitignore` so it isn't committed.
5. Restart the dev server after creating or changing `.env`.

> Using Create React App instead of Vite? Name the variables `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY`, and in `supabaseClient.js` read them with `process.env.REACT_APP_...`.

The anon key is safe to use in the browser. It is your row level security rules (step 4) that protect the data. Never put the `service_role` key in your React app.

## 3. Install the packages

```bash
npm install @supabase/supabase-js react-router-dom
```

## 4. Create the tables and permissions

In Supabase, open the **SQL Editor**, click **New query**, paste the whole script below, and click **Run**. It is safe to run more than once.

```sql
-- Year group cards
create table if not exists year_groups (
  id uuid default gen_random_uuid() primary key,
  year text unique not null,
  nickname text,
  cover_url text,
  created_at timestamptz default now()
);

-- Students inside each year group
create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  year text not null references year_groups(year) on delete cascade,
  name text not null,
  photo_url text,
  created_at timestamptz default now()
);

-- Turn on row level security
alter table year_groups enable row level security;
alter table students enable row level security;

-- year_groups: anyone can view, only logged-in users can change
drop policy if exists "Anyone can view year groups" on year_groups;
drop policy if exists "Logged-in users can add year groups" on year_groups;
drop policy if exists "Logged-in users can delete year groups" on year_groups;

create policy "Anyone can view year groups" on year_groups
  for select using (true);
create policy "Logged-in users can add year groups" on year_groups
  for insert to authenticated with check (true);
create policy "Logged-in users can delete year groups" on year_groups
  for delete to authenticated using (true);

-- students: anyone can view, only logged-in users can change
drop policy if exists "Anyone can view students" on students;
drop policy if exists "Logged-in users can add students" on students;
drop policy if exists "Logged-in users can delete students" on students;

create policy "Anyone can view students" on students
  for select using (true);
create policy "Logged-in users can add students" on students
  for insert to authenticated with check (true);
create policy "Logged-in users can delete students" on students
  for delete to authenticated using (true);
```

The `delete` policies are what allow the delete buttons to work. Without them, deleting fails. Deleting a year group removes its students automatically because of `on delete cascade`.

**Already created `year_groups` earlier without the nickname and cover columns?** Run this first:

```sql
alter table year_groups
  add column if not exists nickname text,
  add column if not exists cover_url text;
```

**Projects table.** Run this too, in a new query:

```sql
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  image_url text,
  file_url text,
  created_at timestamptz default now()
);

alter table projects enable row level security;

drop policy if exists "Anyone can view projects" on projects;
drop policy if exists "Logged-in users can add projects" on projects;
drop policy if exists "Logged-in users can delete projects" on projects;

create policy "Anyone can view projects" on projects
  for select using (true);
create policy "Logged-in users can add projects" on projects
  for insert to authenticated with check (true);
create policy "Logged-in users can delete projects" on projects
  for delete to authenticated using (true);
```

**Media table.** And this one, in another new query:

```sql
create table if not exists media (
  id uuid default gen_random_uuid() primary key,
  image_url text not null,
  created_at timestamptz default now()
);

alter table media enable row level security;

drop policy if exists "Anyone can view media" on media;
drop policy if exists "Logged-in users can add media" on media;
drop policy if exists "Logged-in users can delete media" on media;

create policy "Anyone can view media" on media
  for select using (true);
create policy "Logged-in users can add media" on media
  for insert to authenticated with check (true);
create policy "Logged-in users can delete media" on media
  for delete to authenticated using (true);
```

**Announcements table.** And one more, in another new query:

```sql
create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  message text not null check (char_length(message) <= 1000),
  announcement_date date not null,
  created_at timestamptz default now()
);

alter table announcements enable row level security;

drop policy if exists "Anyone can view announcements" on announcements;
drop policy if exists "Logged-in users can add announcements" on announcements;
drop policy if exists "Logged-in users can delete announcements" on announcements;

create policy "Anyone can view announcements" on announcements
  for select using (true);
create policy "Logged-in users can add announcements" on announcements
  for insert to authenticated with check (true);
create policy "Logged-in users can delete announcements" on announcements
  for delete to authenticated using (true);
```

Announcements have no pictures or files, so they need no storage bucket.

If you want the year groups, students, projects, media, and announcements to be visible only to logged-in admins (not on a public website), change `for select using (true)` to `for select to authenticated using (true)` in every select policy.

## 5. Create the storage bucket for pictures

Cover pictures and student pictures are stored in one bucket called `student-photos`.

**Option A: with SQL.** Open a new query in the SQL Editor and run:

```sql
insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view student photos" on storage.objects;
drop policy if exists "Logged-in users can upload student photos" on storage.objects;
drop policy if exists "Logged-in users can delete student photos" on storage.objects;

create policy "Anyone can view student photos" on storage.objects
  for select using (bucket_id = 'student-photos');
create policy "Logged-in users can upload student photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'student-photos');
create policy "Logged-in users can delete student photos" on storage.objects
  for delete to authenticated using (bucket_id = 'student-photos');
```

**Option B: in the dashboard.** Open **Storage**, click **New bucket**, name it `student-photos`, switch on **Public bucket**, and create it. Then run only the three `create policy` statements from Option A.

The bucket must be public so the pictures load through their image links.

**Project files bucket.** Projects use a second bucket called `project-files` for each project's picture and PDF. It must be public so the **Read about project** button can open the PDF. Run this in a new query:

```sql
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', true)
on conflict (id) do nothing;

drop policy if exists "Anyone can view project files" on storage.objects;
drop policy if exists "Logged-in users can upload project files" on storage.objects;
drop policy if exists "Logged-in users can delete project files" on storage.objects;

create policy "Anyone can view project files" on storage.objects
  for select using (bucket_id = 'project-files');
create policy "Logged-in users can upload project files" on storage.objects
  for insert to authenticated with check (bucket_id = 'project-files');
create policy "Logged-in users can delete project files" on storage.objects
  for delete to authenticated using (bucket_id = 'project-files');
```

Prefer the dashboard? Create a public bucket named `project-files` in **Storage**, then run only the three `create policy` statements above.

**Media bucket.** The media page uses a third bucket called `media-files`. This one also enforces "pictures only" on the server: it accepts only JPG, PNG, WebP and GIF files, up to 10 MB each, so a non-picture is rejected even if someone bypasses the page. Run this in a new query:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media-files',
  'media-files',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

drop policy if exists "Anyone can view media files" on storage.objects;
drop policy if exists "Logged-in users can upload media files" on storage.objects;
drop policy if exists "Logged-in users can delete media files" on storage.objects;

create policy "Anyone can view media files" on storage.objects
  for select using (bucket_id = 'media-files');
create policy "Logged-in users can upload media files" on storage.objects
  for insert to authenticated with check (bucket_id = 'media-files');
create policy "Logged-in users can delete media files" on storage.objects
  for delete to authenticated using (bucket_id = 'media-files');
```

Prefer the dashboard? Create a public bucket named `media-files`, open its settings, set the file size limit to 10 MB and the allowed MIME types to `image/jpeg, image/png, image/webp, image/gif`, then run only the three `create policy` statements above.

## 6. Create the admin account and lock down sign-ups

The permission rules treat every logged-in user as an admin, so only people you create should be able to log in.

1. Open **Authentication** and then **Users**.
2. Click **Add user** and choose **Create new user**.
3. Enter the admin's email and a strong password, and tick **Auto Confirm User** so they can log in right away.
4. Open the Authentication settings (**Sign In / Providers**) and turn **off** "Allow new users to sign up".

Dashboard labels change now and then, but the setting is always in Authentication.

## 7. File structure

Copy the files from `src/` into your project's `src/` folder:

```
src/
  App.jsx               routes (login is public, the rest is protected)
  ProtectedRoute.jsx    blocks /admin pages unless you are logged in
  supabaseClient.js     connects to Supabase using your .env keys
  AdminLogin.jsx        login page, redirects to /admin/homepage
  AdminHome.jsx         admin homepage with links and a log out button
  AdminStudent.jsx      create year group cards
  AdminStudent.css
  YearGroupPage.jsx     add students to one year group
  YearGroupPage.css
  AdminProject.jsx      upload projects (picture, name, PDF)
  AdminProject.css
  ProjectPage.jsx       page that shows one project's PDF for reading
  ProjectPage.css
  AdminMedia.jsx        post pictures (pictures only)
  AdminMedia.css
  AdminAnnouncement.jsx post announcements with a date
  AdminAnnouncement.css
  PublicYearGroups.jsx  public: year group cards and each year group's students
  PublicMedia.jsx       public: picture gallery with a full-screen viewer
  PublicProjects.jsx    public: project cards and the PDF reading page
  PublicAnnouncements.jsx  public: dated announcements
  PublicPages.css       styles shared by the four public pages
```

## Public pages

These four pages are for visitors and never ask for a login. They only read data, so there is nothing to edit or delete on them.

| Address | File | What visitors see |
| --- | --- | --- |
| `/year-groups` | `PublicYearGroups.jsx` | Year group cards. Clicking one opens `/year-groups/<year>` with that year's students. |
| `/media` | `PublicMedia.jsx` | The picture gallery. Clicking a picture opens a full-screen viewer with Previous and Next. |
| `/projects` | `PublicProjects.jsx` | Project cards. **Read about project** opens `/projects/<id>`, which shows the PDF on the page. |
| `/announcements` | `PublicAnnouncements.jsx` | Announcements with their dates, latest first. |

`PublicYearGroups.jsx` and `PublicProjects.jsx` each handle two addresses in one file: the list, and the detail page for one item.

To add them to your site, link to those addresses from your own menu.

They work because of the "Anyone can view" policies from steps 4 and 5 and the public buckets. If you changed the select policies to logged-in users only (the optional change in step 4), the public pages will show empty lists.

The public routes sit in `App.jsx` outside `ProtectedRoute`. The `/admin/...` pages stay protected.

## 8. Run and test

```bash
npm run dev
```

1. Open `/admin/homepage` while logged out. You should be sent to `/admin/login`.
2. Log in with the admin account. You should land on `/admin/homepage`.
3. Go to Students, create a card such as `2036` with the nickname `Class of Innovators` and a cover picture.
4. Click the card and add a student with a name and a picture.
5. Go to Projects. Enter a project name, choose a picture, attach a PDF, and click **Upload project**. Then click **Read about project** on the new card. You are taken to a page that shows the PDF. Use **Back to projects** to return. Try attaching a non-PDF file to confirm it is rejected.
6. Go to Media and choose one or more pictures. Check the previews, then click the **Post** button (it shows how many pictures it will post). They appear in the gallery. Try choosing a PDF or another non-picture file to confirm it is rejected.
7. Go to Announcements, write an announcement, pick a date, and click **Post announcement**. It appears in the list with the date shown above it. Announcements are sorted with the latest date first.
8. Click **Delete student** on a student card and confirm. The card disappears. Then click **Delete card** on a year group card and confirm. The card, its students, and their pictures are removed. Projects, media pictures, and announcements can be deleted the same way, with **Delete project**, **Delete picture**, and **Delete announcement**.
9. Click **Log out**, then try `/admin/student` again. You should be sent back to the login page.
10. Open a private or incognito window (so you are not logged in) and visit `/year-groups`, `/media`, `/projects`, and `/announcements`. You should see what you posted, with no edit or delete buttons. Click a year group card, a picture, and **Read about project** to check the detail views.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `new row violates row-level security policy` | You aren't logged in, or a policy from step 4 or 5 is missing. Run the SQL again. |
| `Invalid login credentials` | The user doesn't exist or isn't confirmed. Recreate it with **Auto Confirm User** ticked. |
| Pictures upload but don't show | The `student-photos` bucket isn't public. Open Storage, edit the bucket, and switch on Public. |
| `supabaseUrl is required` | The `.env` file is missing, in the wrong folder, or the dev server wasn't restarted. Variable names must start with `VITE_`. |
| "That year group already exists" | Year groups are unique. Use a different year or a slightly different label. |
| Delete says it couldn't delete | The delete policies from steps 4 and 5 are missing, or you're logged out. Run the SQL again. |
| "Only PDF files can be attached" | The project file must be a `.pdf`. Export or convert the document to PDF first. |
| "The PDF must be smaller than 10 MB" | Compress the PDF, or raise `MAX_PDF_MB` at the top of `AdminProject.jsx` (Supabase's free plan allows up to 50 MB per file). |
| The PDF page stays blank or says the PDF couldn't be displayed | The `project-files` bucket isn't public, or the view policy is missing. Repeat step 5. On some phones an embedded viewer shows only the first page. Use the **Open it directly** link under the viewer. |
| "Only pictures can be posted" | The media page accepts JPG, PNG, WebP and GIF files up to 10 MB. Convert other formats first. |
| Media upload fails with a mime type or size error | The `media-files` bucket limits (step 5) reject the file. Check its type and size. |
| The announcement won't post and mentions a check constraint | Announcements are limited to 1,000 characters. Shorten the text. |
| A public page says it couldn't load, or shows an empty list | The "Anyone can view" policy for that table is missing or was changed to logged-in users only. Run the step 4 SQL again. |
| Public pictures or PDFs don't load | The bucket isn't public. Repeat step 5. |
| Upload error about the file name | File names are cleaned automatically. If you still see an error, check that the bucket name is exactly `student-photos`. |

## Before you go live

- Confirm that sign-ups are off (step 6).
- Confirm that `.env` is not committed to Git.
- Add your live site's address under **Authentication** and then **URL Configuration** so Supabase accepts logins from it.
