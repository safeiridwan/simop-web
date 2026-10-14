# AGENTS.md — simop-web

Vue 3 SPA frontend for SIMOP. See the parent
[`../../AGENTS.md`](../../AGENTS.md), [`../../planning/SIMOP_Coding_Plan.md`](../../planning/SIMOP_Coding_Plan.md),
and [`../../docs/development-patterns.md`](../../docs/development-patterns.md)
first; this file covers only app-specific conventions.

## Stack

- Vue 3 + TypeScript + Vite.
- Pinia (state), Vue Router.
- Tailwind CSS.
- Vitest (unit tests, happy-dom).

## Layout

```
src/
  app/
    router/        # route table
    stores/        # Pinia stores
    layouts/       # shared shells
  modules/
    <feature>/
      pages/
      components/
      api.ts       # calls the Go API
      types.ts
      routes.ts
  components/      # shared components
  composables/
  services/        # HTTP client, shared clients
  types/
  utils/
```

## Rules

- Data flow: `Page → composable/store → api.ts → services/http → Go API` (plan §46).
- Keep business logic out of components.
- Every list view ships loading, empty, and error states (plan §53).
- Mask sensitive data (e.g. NIK) by default (plan §24, §51).
- Do not add a UI library without an ADR.

## Theme

- Primary brand color is orange `#FF5001`, exposed as Tailwind `brand-*` tokens
  in `src/style.css`. Use `brand-500`/`brand-600` for primary actions and links.
  See `docs/design-guide.md`.

## Modules

- `auth`, `dashboard`, `health`, `users`, `roles`, `permissions` (Phase 1).
- `people` (Phase 2): list/create/detail/edit, addresses with region cascade,
  documents. `PersonForm.vue` is shared by create and edit.
- Sidebar group "Keanggotaan" groups `people`, `members` (Anggota Partai),
  `cadres` (Kader), `non-party` (Non-Kader) and `cadre-training` (Pelatihan).
- `members` (Phase 3): list/create/detail, status change, history, CSV export.- `non-party` (Phase 3): `/non-party` merged view of non-member affiliations
  with a search box and per-type checkboxes (sympathizer, volunteer,
  beneficiary, event/program participant, other).
- `kaderisasi` (ADR-028): sidebar group after Keanggotaan with
  `/kaderisasi/taklimat` (Taklimat) and `/kaderisasi/grup-pembinaan` (Grup
  Pembinaan). Groups search participants from Kader via `cadreApi`.
- `organization` (Phase 4): unit tree at `/organization`, unit detail at
  `/organization/units/:id` with children, positions, periods and officers.
  `TreeNode.vue` is recursive; `UnitForm.vue` is shared by create and edit.
- `cadre` (Phase 5): cadres list/detail with promotion and history, plus
  `/cadre-training` and `/cadre-training/:id` (batches, participants, sessions,
  attendance, assessments, certificates) via `BatchPanel.vue`.
- `programs` (Phase 6): `/programs` list/create, `/programs/:id` detail with
  workflow actions (Draft → Diajukan → Direvisi/Disetujui → Selesai), an
  editable Proposal section (dropzone file + committed amount) and LPJ section
  (file + realised amount), shown as read-only once saved with Edit/Hapus.
  Creation requires all fields, a valid date range and an existing unit
  anggaran. Filenames on the list are truncated to 50 chars. ADR-026 merged the
  former Activity entity into Program and dropped participation and Target.
- `finance` (Phase 7): `/finance/accounts`, `/finance/anggaran` (per-unit
  anggaran/komitmen/realisasi/sisa with a manual add form),
  `/finance/journals` (+ detail), `/finance/reports` (tabbed; the Buku Jurnal tab
  shows Nomor Jurnal, Waktu Transaksi, Keterangan, Status, Total Debit). The
  Dana, SPJ and flat Anggaran menus are removed; the backend endpoints remain.
- `documents` (Phase 8): `/documents` list/create with file upload,
  `/documents/:id` detail with versions, downloads, and access grants.
- `governance` (Phase 9): `/meetings` list/create, `/meetings/:id` detail with
  participants/attendance, agenda, minutes, decisions and action items, plus
  `/tasks` list/create with completion.
- `ethics` (Phase 10): `/ethics/cases` list/create and `/ethics/cases/:id`
  detail with reports, investigations, evidence, hearings, decisions and
  sanctions. Restricted — only rendered for users with `ethics:read`; never on
  the dashboard.
- `assets` (Phase 11): `/assets` list/create (7 required fields + Lokasi),
  `/assets/transactions` borrowing requests (multi-category lines with condition
  breakdowns + photo) and `/assets/transactions/:id` detail (read-only/Edit,
  Return section from Disetujui), plus `/assets/categories` ("Pengaturan Aset"
  for categories/locations). The Aset group sits after Keuangan.
- `dashboard` (Phase 12): `/dashboard` renders permission-filtered summary
  cards and grouped breakdowns.
- `reports` (Phase 12): `/reports` tabbed report viewer with CSV export.
- `data-quality` (Phase 13): `/data-quality` shows the issue ledger, a
  per-rule summary, a scan action and resolve/ignore actions.
- `election-readiness` (Phase 14): `/election-readiness` shows the readiness
  overview, per-check breakdown, scan, resolve/ignore and CSV export.
- `notifications` (Phase 15): `/notifications` inbox with mark-read actions and
  `/notification-preferences` channel matrix.
- `administration` (ADR-027): the "Administrasi" sidebar group holds
  `/administration/letters` (Manajemen Surat), `/administration/classifications`
  (Klasifikasi & Kode Surat), `/administration/agenda` (Buku Agenda) and
  `/administration/notulae` (Notula Rapat). The former "Administrasi" group is
  relabelled "Sistem"; the old Rapat/Tugas/Surat/Dokumen sidebar links are gone
  (routes remain).
- `security` (Phase 16): `/security/events` lists authentication/abuse signals
  (gated on `security:read`).

## Responsive UI

- Mobile-first. The dashboard shell uses a drawer sidebar (`lg:` breakpoint);
  content is offset with `lg:pl-64`.
- Tables are wrapped in `overflow-x-auto` with a `min-w-[...]` table so they
  scroll on small screens. Prefer stacking toolbars/headers with
  `flex-col sm:flex-row`.
- Forms use `grid gap-3 sm:grid-cols-2`. Never fixed-width inputs on mobile.

## Auth (Phase 1)

- Access token lives in memory (`services/http`); the refresh token is an
  httpOnly cookie handled by the browser.
- `services/http` attaches the bearer token, retries once after a 401 by calling
  `/api/v1/auth/refresh`, and throws `HttpError` on failure.
- `stores/auth` (Pinia) holds the user, `can(code)` permission checks, and
  `bootstrap()` which resolves the session from the refresh cookie on load.
- Route guards use `meta.requiresAuth` and `meta.permission`.

## Commands

```bash
make check      # install + type-check + test + build
make dev        # dev server on :5173
```
