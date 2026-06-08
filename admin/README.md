# FieldFlow Admin Panel

Admin panel for the FieldFlow PDF Editor. Provides user management and Clerk sync controls for administrators.

## Features

- **Login** — JWT-based authentication using credentials stored in backend `.env`
- **Users** — View all users synced from Clerk with avatar, email, auth methods, external accounts, token balances, and timestamps. Renders a distinct amber "Dev" tag next to usernames tagged in the database to separate development mock accounts. Features an "Award Credits" action to grant free credits/tokens with a mandatory explanation comment. Displays total uploads, exports, average rating, and a review comments popup modal for user feedback. Includes click navigators to open a dynamic **User Activity Monitoring Page** showing graphs, logs, transaction tables, and receipts.
- **Analytics** — Dedicated usage metrics dashboard with daily uploads/exports SVG line/area graphs, rating distributions, KPIs, and a list of recent feedback comments. Graph node structures are strictly typed to ensure error-free compilation.
- **Plans** — Custom tier manager to edit prices and token rewards for Starter, Standard, Pro, and Enterprise tiers
- **Payment Proofs** — View payment proofs submitted by users, approve payments, enter actual amount received, and dynamically credit user wallets (rounded to whole numbers). Tagged development proofs display an amber "Dev" indicator badge.
- **Payment Accounts** — Enable or disable specific bank/provider accounts in real-time
- **Settings** — Manage token conversion rates and manually trigger Clerk-to-MongoDB user sync

## Design

Follows the same Linear dark design system as the main frontend:
- Canvas `#010102`, four-step surface ladder, hairline borders
- Lavender-blue accent (`#5e6ad2`)
- Inter typography with negative tracking on display text

## Setup

### Prerequisites
- Backend must be running on `http://localhost:8000`
- Clerk secret key must be configured in `backend/.env` for the sync feature

### Environment Variables
Create a `.env.local` file under the `admin` directory and define the backend API URL (this local configuration file is ignored by the root `.gitignore` to prevent environment leakage):
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Running
```bash
pnpm install
pnpm dev
```

Open `http://localhost:3001` in your browser.

### Default Credentials
The default admin credentials and signing keys are now loaded dynamically and strictly from the backend environment configuration (`backend/.env`) with no fallback values stored in the source code. An example setup is:
- Email: `admin@fieldflow.dev`
- Password: `admin123456`

## Pages

| Route | Description |
|---|---|
| `/` | Login page |
| `/users` | Synced users table with tokens, upload counts, export counts, average rating, and action buttons |
| `/users/[id]` | Comprehensive dynamic user activity monitoring dashboard page |
| `/analytics` | Dynamic PDF usage line graphs, rating distributions, KPIs, and recent reviews list |
| `/plans` | Dynamic plans pricing & payout configuration |
| `/payments` | Payment proof manual approvals |
| `/accounts` | Toggle active payment accounts |
| `/settings` | Clerk sync & Token conversion rate controls |


## Troubleshooting

### Python Interpreter Errors ("Cannot find module `bson`")
If the backend throws import errors or module-not-found errors for `bson` or `pymongo`, it means the global python environment is active instead of the workspace virtual environment:
1. VS Code: Select `Python: Select Interpreter` from the command palette (`Ctrl + Shift + P`) and select the interpreter under `backend/venv/Scripts/python.exe`.
2. Terminal: Activate the virtual environment before running the server:
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   python main.py
   ```

*Note: **User token guidelines** are accessible on the main frontend site route at **`/token-usage/how-to-use`**, and document upload is managed at the separate **`/upload`** route (which correctly replaces/overwrites the active canvas state upon new uploads or draft loading).*


