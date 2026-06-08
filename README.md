# FieldFlow PDF Editor

FieldFlow is a smart, simple tool designed to help you edit text inside PDF documents—like school fee slips, bank challans, utility bills, and invoices—without ruining their layout.

---

## 🌟 Key Features (Simply Explained)

### 1. 📂 Drag, Drop & Edit
No need to convert your PDFs to other formats. Simply drag and drop your file into the browser. If it is longer than 5 pages, select the pages you want to load onto the canvas, and the tool will automatically detect and draw boxes around the text on only those pages. Once a PDF is loaded in the editor, navigation menu links are automatically hidden so that only editing options are shown for a focused, distraction-free editing workflow.


### 2. ✏️ Click & Type Editing
Click on any boxed text directly on the selected document pages, or double-click to type. You can also edit values in the side panel. The tool will automatically shrink the text if you type a longer name to make sure it fits perfectly within the original box!

### 3. 🔗 Magic Connected Fields (Linked Editing)
If a name, invoice number, or price appears multiple times on the same page (for example, in a "Bank Copy," "Office Copy," and "Customer Copy" of a challan), you only need to edit it once. FieldFlow will instantly update all other copies for you! You can turn this off in the side panel if you wish to edit a single copy.

### 4. ➕ Add Custom Text
Need to add a signature date, note, or extra text where there wasn't any before? Use the "Add Field" button to place a new box anywhere on the document, adjust its size, and type whatever you need.

### 5. 🎨 Linear Design System (Dynamic Dark/Light Themes)
The entire user interface is styled according to the strict Linear design system. It features a responsive light/dark theme toggle that adapts instantly across all pages, components, panels, scrollbars, and modal structures. By default, it adheres to the signature Linear dark canvas (`#010102`), featuring a four-step charcoal surface ladder (`bg-surface-1` through `bg-surface-4`), hairline borders (`#23252a`), Inter typography, and the signature lavender-blue (`#5e6ad2`) brand accent. Toggling theme switches all mapping tokens dynamically (e.g. changing backgrounds to clean whites and light slate tones, and adjusting text contrast ratios) using native CSS theme variable bindings for fluid, zero-latency transitions. Theme preferences are persisted in `localStorage` using the prefix `_ff` (stored as `_ff_is_dark_mode`) and are loaded via a non-blocking layout head script to ensure consistency across page navigations and prevent screen flashing. All localStorage operations for this application strictly use the `_ff` prefix constraint.

### 6. 💾 High-Fidelity Export
Save your work with one click. The tool prints your modifications directly onto the PDF canvas, ensuring your saved file remains crisp, printable, and vector-perfect.

### 7. 💾 Local Drafts & Real-Time Reload Persistence
Never lose your progress! Click "Save to Draft" at any time to save your PDF modifications locally on your device, and click the "Drafts" link in the top bar to see all your saved drafts and resume them instantly. Additionally, the editor automatically auto-saves your active working session in the background. If you refresh or reload the page, your complete editor workspace—including file name, loaded file content, page picker selections, zoom, page coordinates, and edits—is instantly restored automatically. Loading a new PDF or opening a different draft properly replaces and overwrites the existing active session state.


### 8. 📐 Real-Time Text Alignment
Click any text field on the PDF canvas to display options to center, left-align, or right-align the text. The text is aligned dynamically on screen and stays perfectly aligned in the exported PDF file.

### 9. 📏 Smart Alignment Spacing Guides
When a text field is selected, the editor renders real-time dotted guide lines showing the exact distance (in PDF points) from the field to the left and right borders of the page. This helps with precision alignment and centering when moving elements!

### 10. 🔔 Toast Notification System
Native browser alert boxes are replaced with a premium, animated toast notification system that slides in from the bottom-right corner. It supports success, error, warning, and info messages in both dark and light modes.

### 11. 🛡️ Dedicated Privacy Policy Page
We added a dedicated Privacy Policy page explaining exactly how files and data are processed and handled. It guarantees that no documents are permanently stored on the backend, and that draft progress stays entirely local in your browser.

### 12. 📦 Reusable Premium Footer
Introduced a production-ready, dense footer grid matching the Linear design system. It includes organized site directories (Product, Resources, Legal) using responsive list layouts, a custom operational systems indicator, the FieldFlow branding tag, and quick legal/support navigators.

### 13. 💳 Premium Pricing Page & Standalone Route
Integrated a professional 3-tier pricing structure (Monthly at 500 PKR, Yearly at 5,000 PKR, and Lifetime at 15,000 PKR) featuring billing period toggles, tier highlights, and recommendation badges. This module is available as a standalone route at `/pricing` and is embedded as an interactive component inside the landing page flow.

### 14. 🎨 Favicon SVG & Dynamic Title Manager
Designed a custom vector icon representing "EDIT PDF" inside `public/favicon.svg` and configured it as the root favicon. Mounted a global client-side document title listener (`DynamicTitle.tsx`) that changes titles based on route routes, selected context (such as active file name and field edits), and user tab activity (showing "Come back! ✏️" when inactive).

### 15. 🔐 Clerk Authentication Integration
Integrated Clerk Authentication into the Next.js App Router workspace. All page headers (including the landing page, pricing page, guide page, privacy page, and editor toolbar) dynamically render Clerk's `<SignInButton>` (in a modal dialog) and `<UserButton>` widgets wrapped in Clerk's `<Show>` wrapper component. A global API and route interceptor is configured in `src/middleware.ts`, and the application wrapper is defined within `src/app/layout.tsx`.

### 16. 🍃 MongoDB Connection & Clerk Authentication Sync
Integrated the backend with a MongoDB cluster. Implemented a `DatabaseManager` using `motor` that pings the database and handles automatic reconnection before performing any database action. Developed schemas and endpoints to mirror Clerk user profiles (email, Google, Facebook) inside MongoDB. Built a client-side `UserSyncManager` to automatically trigger user mirroring upon successful sign-in. All configurations, including connection strings and database names, are loaded from an environment `.env` file before any other module imports in the backend, and are imported from centralized constants files in both the frontend and backend. The client-side sync features a composite validation token that reactively monitors profile updates (such as updating profile pictures or linking new login credentials) to guarantee instant database mirroring.

### 17. 🛠️ Admin Panel
Built a standalone admin panel (Next.js) at `admin/` following the same Linear dark design system. Features include:
- **Login page** — JWT-based authentication using admin credentials stored in the backend `.env` file.
- **Users page** — Displays all users mirrored from Clerk in a styled data table with avatars, auth methods, external accounts, token balances, total PDFs uploaded, total PDFs exported, average rating, and timestamps. Renders a distinct amber "Dev" badge next to usernames tagged in the database to separate development mock accounts from live users. Allows administrators to award free credits (tokens) with a mandatory comment/reason, view user feedback details/comments popup, or click to open a dedicated **User Activity Monitoring Dashboard** showing comprehensive metrics, daily activity graphs, detailed logs, payment receipts, and referrals. All user dashboard components and custom charts are strictly typed.
- **Analytics page** — Comprehensive metrics dashboard showcasing overall PDF uploads, exports, export conversion/success rate, average ratings, daily PDF activity area graphs (uploads vs. exports), star rating distributions, and recent review feedback. Custom SVG chart elements are fully typed to avoid compiler errors.
- **Plans page** — Custom tier manager to edit prices and token rewards for Starter, Standard, Pro, and Enterprise tiers.
- **Payment Proofs page** — View payment proofs submitted by users. Renders a distinct amber "Dev" badge next to user references if the payment proof has been tagged in the database. Allows manually approving payments, entering the actual amount received, and dynamically crediting the user's wallet with rounded whole-number tokens.
- **Payment Accounts page** — Manage active payment accounts (JazzCash, Easypaisa, NayaPay, Meezan Bank), enabling or disabling them individually. Toggles are reflected on the frontend payment checkout UI in real-time.
- **Settings page** — Adjust the global PKR-to-token conversion rate and manually trigger a full Clerk-to-MongoDB user sync.

### 18. 🤝 Referral & Token Systems
- **Referral System** — Users can share their unique referral link. When a referred friend creates an account and makes their first purchase, the referrer is rewarded with **10 tokens** (capped at a maximum of **10 referrals** per user).
- **Token Pricing** — Structural transition to pay-as-you-go token packs: Starter, Standard, Pro, and Enterprise tiers (fully dynamic, pulled from database and manageable from the admin panel).
- **Free Welcome Credit** — Every new account (referred or direct) is automatically credited with **5 free tokens** on signup.
- **Token Usage** — Gated multi-page PDF exports behind token balances. Each page loaded to the canvas costs **0.5 tokens** upon export. Any single-page PDF is 100% free to edit and export unlimited times for everyone, with no account or tokens required! User balance and transaction history are viewable on a dedicated `/token-usage` dashboard, which includes a navigation link to a detailed `/token-usage/how-to-use` guidelines guide. If an administrator awards free credits, the comment/reason is displayed directly under the transaction item in the user's history list.
- **PDF Rating & Comments** — Shows a non-dismissible rating toast on PDF export asking for a 5-star rating. Clicking stars immediately fires an API call to record the rating, then opens an optional review text input to save comments. Rating metrics are tracked in the database and displayed inside the Admin dashboard.
- **Usage Tracking & Logs** — Tracks every upload and export event in MongoDB under the `pdf_usage_logs` collection, which is used to calculate per-user metrics and overall website usage statistics.
- **Separate PDF Upload Route** — Moved PDF uploading logic to a dedicated `/upload` route. Landing page CTA buttons ("Launch Editor", "Launch App") redirect to this page. The editor route `/editor` automatically redirects users back to `/upload` if no active session or file is currently loaded in memory.

- **Manual Payment Flow** — Checkout page showing dynamic accounts (number, title, and IBAN) with branding logos. Includes account creation warnings and proof image upload capability (stored as binary data in MongoDB). Purchased token payouts are rounded off to integer values before crediting the wallet.

The admin backend routes (`/api/admin/*`) are protected by JWT bearer tokens. All constants are centralized in `backend/constants.py` and `admin/src/constants.ts`, with all URLs, origins, secrets, credentials, payment configurations, and limits loaded dynamically and strictly from environment variables without any hardcoded fallbacks. A comprehensive root `.gitignore` is configured to prevent committing these environment configuration files (`.env`, `.env.local`), vendor dependencies, compiler build directories, and IDE/editor files to the repository.


---

## 🛑 Tool Boundaries & Limitations

To keep the application fast and reliable, it operates with the following boundaries:
* **Page Selection & Cost**: No page limits anymore. For multi-page PDFs, a Visual Picker lets you select exactly which pages you want to load onto the editing canvas. Each page loaded costs 0.5 tokens upon export.
* **Free Single-Page Tier**: Any user (including guests) can edit and export a single-page PDF unlimited times for free, with no account or tokens required.
* **File Size Cap**: The maximum supported file size is **10MB**.
* **Scanned Documents**: The tool detects selectable digital text. It cannot edit text on scanned PDFs where pages are saved as flat photos/images (unless they have editable text layers).
* **Complex Patterns**: Very complex graphics, solid background patterns, or overlapping text lines may not hide the original text perfectly.
* **Standard Fonts**: To guarantee your document opens on any computer or phone, edited text falls back to standard clean fonts (Helvetica, Times New Roman, or Courier).

---

## 🛡️ Resilience & High Concurrency

To ensure the application remains stable and highly available under extreme loads:
* **Concurrency Protection**: Uses an `asyncio.Semaphore` (configurable via `MAX_CONCURRENT_PDF_TASKS`) to safely throttle active PDF processing tasks, queueing incoming requests without consuming excessive RAM.
* **Non-blocking Event Loop**: Delegates CPU-bound PDF parsing and exporting to a separate thread pool (`asyncio.to_thread`) so the FastAPI event loop stays completely responsive to other requests.
* **Auto-Restart Supervisor**: The backend server is run under a process supervisor. If the worker process crashes (e.g. from an out-of-memory error or PyMuPDF core issue), the supervisor automatically restarts the worker process within 2 seconds.

---


## 🚀 How to Run the App (For Creators)

### Prerequisites
* Node.js (Version 18.17 or higher)
* Python (Version 3.10 or higher)
* `pnpm` (Node package manager)

### Quick Setup

#### 1. Start the Server (Backend)
The backend does the heavy lifting of reading and writing the PDFs.
```bash
cd backend
pip install -r requirements.txt
python main.py
```
This runs the server at `http://localhost:8000`.

#### 2. Start the Website (Frontend)
The website is the interface you interact with in your browser.
```bash
cd frontend
pnpm install
pnpm dev
```
Open your browser and navigate to `http://localhost:3000` to start editing.

#### 3. Start the Admin Panel
The admin panel provides user management and Clerk sync controls.
```bash
cd admin
pnpm install
pnpm dev
```
Open your browser and navigate to `http://localhost:3001` to access the admin panel.

---

### 🔍 Troubleshooting

#### 1. "Cannot find module `bson`" or Interpreter Errors
This occurs if the IDE or terminal session uses the global Python interpreter instead of the workspace virtual environment where the packages are installed.

* **VS Code configuration**: The workspace settings in `.vscode/settings.json` are pre-configured to point to `"backend/venv/Scripts/python.exe"`. If VS Code displays an error:
  1. Open the command palette (`Ctrl + Shift + P`).
  2. Select **`Python: Select Interpreter`**.
  3. Select the Python executable pointing to `backend/venv/Scripts/python.exe`.
* **Terminal activation**: Ensure your terminal is activated before running the backend:
  ```powershell
  # Powershell
  cd backend
  .\venv\Scripts\Activate.ps1
  python main.py
  ```

#### 2. "You're importing a module that depends on `useRouter`..."
This occurs when a client-side hook/API like `useRouter` is imported in components that are rendered as React Server Components by default. Ensure the component file contains the **`"use client";`** directive at the very top.




