/**
 * Open a print-ready view of the HTML document and trigger the browser
 * print dialog (users can "Save as PDF"). Faithful to the HTML export.
 */
export async function exportHtmlAsPdf(htmlDocument: string, title: string): Promise<void> {
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.style.opacity = "0";
    frame.style.pointerEvents = "none";
    document.body.appendChild(frame);

    const frameWindow = frame.contentWindow;
    const frameDoc = frame.contentDocument ?? frameWindow?.document;
    if (!frameWindow || !frameDoc) {
      frame.remove();
      resolve(); // Fail silently for promise
      throw new Error("Could not open print view.");
    }

    frameDoc.open();
    frameDoc.write(htmlDocument);
    frameDoc.close();

    try {
      frameDoc.title = title;
    } catch {
      // ignore
    }

    const cleanup = () => {
      frame.remove();
    };

    const triggerPrint = () => {
      try {
        frameWindow.focus();
        frameWindow.print();
      } finally {
        window.setTimeout(cleanup, 1000);
        resolve();
      }
    };

    const images = Array.from(frameDoc.images);
    if (images.length === 0) {
      window.setTimeout(triggerPrint, 50);
      return;
    }

    let remaining = images.length;
    const done = () => {
      remaining -= 1;
      if (remaining <= 0) triggerPrint();
    };

    for (const img of images) {
      if (img.complete) {
        done();
      } else {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      }
    }

    window.setTimeout(() => {
      if (remaining > 0) triggerPrint();
    }, 3000);
  });
}
