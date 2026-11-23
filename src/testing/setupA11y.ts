// Only `.tsx` tests render; the module is loaded lazily so the test renderer does not run before a
// test's own mocks.
afterEach(() => {
  if (!expect.getState().testPath?.endsWith('.tsx')) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- dynamic import() is not available in Jest here
  (require('./a11y') as typeof import('./a11y')).checkRenderedControls();
});
