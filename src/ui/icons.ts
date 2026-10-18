const paths: Record<string, string> = {
  mark: '<path d="m12 2 9 5v10l-9 5-9-5V7Z"/><path d="m12 7 5 5-5 5-5-5Z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  heart:
    '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  coin: '<path d="m12 3 8 9-8 9-8-9Z"/><path d="M12 8v8"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-13h-8Z"/>',
  shield:
    '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z"/><path d="m8 12 3 3 5-6"/>',
  target:
    '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  sound:
    '<path d="m11 4-6 5H2v6h3l6 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="m11 4-6 5H2v6h3l6 5ZM16 9l6 6m0-6-6 6"/>',
  repeat:
    '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 11-2l3 3M4 16l3 3a7 7 0 0 0 11-2"/>',
  crown: '<path d="m3 6 4 5 5-7 5 7 4-5-2 13H5Z"/>',
  book: '<path d="M12 6C9 3 5 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-3-1-7-1-10 2Zm0 0v15"/>',
};
export const icon = (name: string, className = "") =>
  `<svg class="icon ${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.mark}</svg>`;
