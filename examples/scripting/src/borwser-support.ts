const isSupported =
  typeof window !== 'undefined' &&
  'navigator' in window &&
  'VideoDecoder' in window &&
  'VideoEncoder' in window &&
  'AudioEncoder' in window &&
  'AudioContext' in window &&
  'chrome' in window;


if (!isSupported) {
  const el = document.querySelector('[id="browser-not-supported"]') as HTMLParagraphElement;
  el.style.display = 'block';
}
