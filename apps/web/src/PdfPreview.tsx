import { useEffect, useRef, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
  type PDFDocumentProxy,
} from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
GlobalWorkerOptions.workerSrc = workerUrl;
export default function PdfPreview({ url }: { url: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const holder = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [width, setWidth] = useState(400);
  useEffect(() => {
    const observer = new ResizeObserver((entries) =>
      setWidth(Math.max(200, entries[0].contentRect.width - 24)),
    );
    if (holder.current) observer.observe(holder.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let disposed = false;
    setDoc(null);
    setPage(1);
    setError("");
    setReady(false);
    const task = getDocument({
      url,
      withCredentials: true,
      isEvalSupported: false,
      useSystemFonts: true,
      cMapUrl: "/pdf-assets/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/pdf-assets/standard_fonts/",
      wasmUrl: "/pdf-assets/wasm/",
    });
    task.promise
      .then((pdf) => {
        if (!disposed) setDoc(pdf);
      })
      .catch((e) => {
        if (!disposed)
          setError(
            "PDF preview could not render this file. Download the original to inspect it. " +
              e.message,
          );
      });
    return () => {
      disposed = true;
      void task.destroy();
    };
  }, [url]);
  useEffect(() => {
    if (!doc || !canvas.current) return;
    let disposed = false;
    let renderTask:
      | ReturnType<Awaited<ReturnType<PDFDocumentProxy["getPage"]>>["render"]>
      | undefined;
    setReady(false);
    void doc
      .getPage(page)
      .then(async (pdfPage) => {
        if (disposed || !canvas.current) return;
        const natural = pdfPage.getViewport({ scale: 1 });
        const scale = Math.min(devicePixelRatio || 1, 2);
        const viewport = pdfPage.getViewport({
          scale: (width / natural.width) * scale,
        });
        canvas.current.width = Math.floor(viewport.width);
        canvas.current.height = Math.floor(viewport.height);
        canvas.current.style.width = "100%";
        canvas.current.style.height = "auto";
        renderTask = pdfPage.render({ canvas: canvas.current, viewport });
        await renderTask.promise;
        if (disposed) return;
        const content = await pdfPage.getTextContent();
        if (!disposed) {
          setText(
            content.items
              .map((item) => ("str" in item ? item.str : ""))
              .join(" "),
          );
          setReady(true);
        }
      })
      .catch((e) => {
        if (!disposed && e.name !== "RenderingCancelledException")
          setError("PDF render failed: " + e.message);
      });
    return () => {
      disposed = true;
      renderTask?.cancel();
    };
  }, [doc, page, width]);
  return (
    <div className="pdf-viewer">
      <div className="pdf-canvas-frame" ref={holder}>
        {error ? (
          <p role="alert" className="pdf-error">
            {error}
          </p>
        ) : (
          <>
            <canvas
              ref={canvas}
              role="img"
              aria-label={`Private evidence PDF page ${page}${doc ? " of " + doc.numPages : ""}`}
              data-rendered={ready}
            />
            {!ready && (
              <span className="pdf-loading" role="status">
                Rendering private PDF…
              </span>
            )}
          </>
        )}
      </div>
      <div className="pdf-controls">
        <button
          className="ghost"
          disabled={!doc || page <= 1}
          onClick={() => setPage(page - 1)}
        >
          Previous page
        </button>
        <span className="mono">
          {page} / {doc?.numPages ?? "—"}
        </span>
        <button
          className="ghost"
          disabled={!doc || page >= doc.numPages}
          onClick={() => setPage(page + 1)}
        >
          Next page
        </button>
      </div>
      {text && (
        <details>
          <summary>Extracted page text (accessible)</summary>
          <p className="pdf-text">{text}</p>
        </details>
      )}
    </div>
  );
}
