import { 
  Shield, 
  Database, 
  Server, 
  Lock,
  EyeOff
} from 'lucide-react';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header';

export default function PrivacyPage() {
  return (
    <div className="h-screen overflow-y-auto flex flex-col font-sans transition-colors duration-300 bg-canvas text-ink">
      <Header />


      <main className="flex-1 max-w-4xl w-full mx-auto px-6 pt-24 pb-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border bg-surface-1 border-hairline text-primary mb-4 text-[10px] font-semibold tracking-eyebrow uppercase">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacy Guarantee</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-display-md text-ink uppercase">
            PRIVACY <span className="text-primary">POLICY</span>
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto leading-relaxed text-ink-muted tracking-body">
            We believe your documents belong to you. Our system operates on a zero-tracking, client-first storage model ensuring absolute data privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="p-6 lg:p-8 rounded-lg border bg-surface-1 border-hairline">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary/10 text-primary rounded-md">
                <Server className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold tracking-card-title text-ink uppercase">
                Zero Server Storage
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              When you upload a PDF for editing, the file is parsed dynamically in-memory on the server to extract text fields and positions. The backend service processes this on-the-fly and never writes your files, data, or output to persistent storage. All data is cleared from the server memory immediately after processing.
            </p>
          </div>

          <div className="p-6 lg:p-8 rounded-lg border bg-surface-1 border-hairline">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary/10 text-primary rounded-md">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold tracking-card-title text-ink uppercase">
                Local Browser Storage
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              All progress, including modifications, layouts, and document buffers saved via the &quot;Save to Draft&quot; button, is stored directly inside your browser using IndexedDB. None of your drafts, content, or credentials are sent to external cloud servers, databases, or third-party storage solutions.
            </p>
          </div>

          <div className="p-6 lg:p-8 rounded-lg border bg-surface-1 border-hairline">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary/10 text-primary rounded-md">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold tracking-card-title text-ink uppercase">
                Secure Sandboxed Runs
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              The editing interface and Konva rendering operate entirely within your local browser sandbox. This ensures that modifications made to standard invoices, slips, or challans are isolated. We do not use tracking pixels, session replays, or any form of logging.
            </p>
          </div>

          <div className="p-6 lg:p-8 rounded-lg border bg-surface-1 border-hairline">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-primary/10 text-primary rounded-md">
                <EyeOff className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold tracking-card-title text-ink uppercase">
                Zero Tracking & Analytics
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-ink-muted">
              FieldFlow PDF does not run background telemetry, usage tracking, or traffic monitoring. We do not collect device info, location data, or metadata from edited files. Your document edits are entirely private and visible only to you.
            </p>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
