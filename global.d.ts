/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google: typeof google;
  }
}

// Adding an export {} to make it a module, ensuring 'declare global' works as expected.
// This is also a good practice for .d.ts files to avoid them being treated as scripts.
export {};
