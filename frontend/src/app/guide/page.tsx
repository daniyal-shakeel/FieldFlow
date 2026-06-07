import { 
  UploadCloud, 
  BookOpen, 
  HelpCircle, 
  ShieldAlert, 
  AlertCircle,
  MousePointer,
  Link,
  Layers,
  Download
} from 'lucide-react';
import { Footer } from '@/components/Footer/Footer';
import { Header } from '@/components/Header';

export default function GuidePage() {
  return (
    <div className="h-screen overflow-y-auto flex flex-col font-sans transition-colors duration-300 bg-canvas text-ink">
      <Header />


      <main className="flex-1 max-w-6xl w-full mx-auto px-6 pt-24 pb-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border bg-surface-1 border-hairline text-primary mb-4 text-[10px] font-semibold tracking-eyebrow uppercase">
            <BookOpen className="w-3.5 h-3.5" />
            <span>User Documentation</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold mb-4 tracking-display-md text-ink uppercase">
            HOW TO USE <span className="text-primary">& LIMITATIONS</span>
          </h2>
          <p className="text-sm md:text-base max-w-2xl mx-auto leading-relaxed text-ink-muted tracking-body">
            Welcome to the FieldFlow PDF guide. Here you will find simple, step-by-step instructions on how to use the editor, along with the technical boundaries of the tool.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 lg:p-8 rounded-lg border bg-surface-1 border-hairline">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-primary/10 text-primary rounded-md">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-card-title text-ink uppercase">
                  Guide: Step-by-Step
                </h3>
              </div>

              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-2 border border-hairline-strong text-primary font-mono text-[11px] shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Upload Your PDF Document</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      Drag and drop your file into the blue upload box, or click the button to browse. FieldFlow will quickly scan and isolate all fields.
                    </p>
                    <div className="flex items-center space-x-2 pt-1 text-[10px] text-primary font-medium uppercase">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Supports PDF files up to 10MB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-2 border border-hairline-strong text-primary font-mono text-[11px] shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Select and Double-Click Fields</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      All text detected in the document is boxed in dashed lines. Click a box once to select it, or double-click to edit its text directly on the document. Alternatively, use the right side &quot;Field Value&quot; inspector panel to edit the values.
                    </p>
                    <div className="flex items-center space-x-2 pt-1 text-[10px] text-primary font-medium uppercase">
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>Select to move/resize with keyboard arrows</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-2 border border-hairline-strong text-primary font-mono text-[11px] shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Magic Connected Updates (Linked Mode)</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      Does your name or invoice ID appear multiple times? FieldFlow links repetitive fields automatically. Editing one copy will instantly update all other matching copies in the document.
                    </p>
                    <div className="flex items-center space-x-2 pt-1 text-[10px] text-brand-secure font-medium uppercase">
                      <Link className="w-3.5 h-3.5" />
                      <span>Can be disabled in the Inspector Panel</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-2 border border-hairline-strong text-primary font-mono text-[11px] shrink-0 mt-0.5">
                    4
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Add Custom Text Box</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      Need to add signatures, notes, or entirely new text? Click &quot;Add Field&quot; in the toolbar to place a new box. Position, scale, and type any content inside it.
                    </p>
                    <div className="flex items-center space-x-2 pt-1 text-[10px] text-brand-secure font-medium uppercase">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Adjust font size or add white backdrops</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-surface-2 border border-hairline-strong text-primary font-mono text-[11px] shrink-0 mt-0.5">
                    5
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Export Your PDF</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      Click &quot;Export&quot; in the toolbar. The server will bake your text overlays directly into the PDF, rendering a high-fidelity copy preserving the exact vector/layout structure of the original!
                    </p>
                    <div className="flex items-center space-x-2 pt-1 text-[10px] text-primary font-medium uppercase">
                      <Download className="w-3.5 h-3.5" />
                      <span>Saves as &quot;edited_[filename].pdf&quot;</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 lg:p-8 rounded-lg border bg-surface-1 border-hairline">
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 bg-primary/10 text-primary rounded-md">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-card-title text-ink uppercase">
                  Limits & Boundaries
                </h3>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-4 h-4 text-brand-secure shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">File Constraints</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      Maximum file size is limited to <strong className="text-ink font-semibold">10MB</strong>. PDF files larger than 10MB will be rejected during upload to maintain server responsiveness.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-4 h-4 text-brand-secure shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Page Selection & Cost</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      There are <strong className="text-ink font-semibold">no page limits</strong> anymore. For multi-page PDFs, a Visual Picker lets you select exactly which pages to load onto the editing canvas. Each page loaded costs <strong className="text-primary font-semibold">0.5 tokens</strong> upon export.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-4 h-4 text-brand-secure shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Free Single-Page Tier</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      Any document containing exactly <strong className="text-ink font-semibold">1 page</strong> is 100% free to edit and export unlimited times. No account or tokens are required.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-4 h-4 text-brand-secure shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Raster/Scanned PDF Limitation</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      This tool processes digital text metadata. If you upload a scanned document (where text is saved as an image rather than selectable digital font characters), the tool will not detect editable text fields.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-4 h-4 text-brand-secure shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Complex Layout Shift</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      Text fields are covered with matching background color patches. Extremely complex gradients, watermark backgrounds, or complex layered overlapping graphics behind text may not patch perfectly, and background patterns might show edge alignments.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-4 h-4 text-brand-secure shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Font Support bounds</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      Exported text will use core standard PDF fonts (Helvetica, Times, Courier) to ensure full compatibility. Custom proprietary web-fonts embedded inside original fields will fall back to their matching standard family (Serif, Sans-Serif, or Monospace).
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-4 h-4 text-brand-secure shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-ink">Payment Note</h4>
                    <p className="text-xs leading-relaxed text-ink-muted">
                      If you have already sent payment and proof but did not create an account, contact the author — no need to worry.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
}
