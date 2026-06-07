This is the Next.js frontend of the FieldFlow PDF Editor. It features a high-fidelity editor restyled to strictly follow the Linear style system (using Inter font, lavender-blue accent color #5e6ad2, adaptive surface elevations, hairline borders, and responsive single-column collapse layouts). It supports an instant light/dark theme toggle that adapts all page backgrounds, panels, text labels, borders, scrollbars, and modals automatically via custom CSS theme variables. This theme state is persisted in localStorage under the key prefix _ff (specifically _ff_is_dark_mode) and is loaded on initial render by a head layout script to eliminate layout flash during navigation. All key visual modules (including toolbar, drafts list, upload area, viewer canvas, field inspector sidebar, shortcuts panel, Konva interactive overlay tools, and all subpages) comply with these styling metrics. It also features real-time canvas editing, dynamic text field alignment (left, center, right), real-time horizontal guide lines for centering/spacing, a persistent local drafts system powered by IndexedDB (with complete page layout, selected page picker selections, store state restoration, and automatic real-time session recovery across browser refreshes), a custom toast notification system, a dedicated Privacy Policy page, a reusable premium Footer component, a standalone pricing page (/pricing) with an embedded landing page pricing grid, a custom edit-pdf favicon SVG, a global dynamic document title manager, a fully-integrated Clerk Authentication module, a dynamic client-side UserSyncManager that mirrors authenticated profiles (reactive to image updates and linked social account events) to MongoDB, and a centralized constants configuration module. The upload flow isolates user-selected pages dynamically on the viewer canvas (only rendering selected page index canvases), while the backend maintains full original file preservation and page ordering during export. Single-page PDFs are 100% free to edit and export unlimited times for guests and signed-in users alike. For multi-page PDFs, each page sent to the canvas costs 0.5 tokens upon export. The backend uvicorn service is managed by a process supervisor that automatically restarts the server on crash and has been enhanced with asyncio semaphores and thread offloading to safely handle 1,000+ concurrent files. User balance and transaction history (including custom administrator credit adjustments and reasons explaining the credits) are viewable on a dedicated /token-usage dashboard, which includes a navigation link to a detailed /token-usage/how-to-use guidelines guide. Once a PDF file is loaded inside the editor layout, navigation menu links are dynamically hidden to focus strictly on editing options and actions.


## Environment Variables

For Clerk authentication to function correctly, ensure that the following keys are set up in your local `.env.local` file under the `frontend` directory:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
```


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
