/**
 * Universal Mobile & Web PDF Exporter / Sharer
 * Works across iOS, Android, and Desktop browsers.
 */
export async function downloadOrSharePdf(url: string, fileName: string) {
  try {
    // Check if running inside Capacitor native container with Share API available
    const isCapacitor = typeof (window as any)?.Capacitor !== 'undefined';

    if (isCapacitor && navigator.share) {
      // Use native share sheet (WhatsApp, AirDrop, Save to Files, Print)
      await navigator.share({
        title: fileName,
        text: `Official Document: ${fileName}`,
        url: url
      });
      return;
    }

    // Standard Web & PWA fallback
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error: any) {
    console.warn('Share/Download fallback triggered:', error);
    // Direct open fallback
    window.open(url, '_blank');
  }
}
