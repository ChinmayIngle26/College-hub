
// src/lib/firebase/admin.ts
// This file is now DEPRECATED and will be removed or serve as a general note.
// Use admin.node.ts for Node.js specific Admin SDK initialization.
// Use admin.edge.ts for Edge Runtime (which essentially does nothing for Admin SDK).

/**
 * @deprecated Use `admin.node.ts` for Node.js environments or handle Edge/Client specific logic separately.
 * This file is kept temporarily to avoid breaking existing direct imports but should be refactored.
 */

constdeprecationMessage = "src/lib/firebase/admin.ts is deprecated. Use admin.node.ts for Node.js Admin SDK or admin.edge.ts for Edge placeholder.";
console.warn(deprecationMessage);

// Exporting nulls or error objects to minimize breakage if anything still imports this directly.
export const adminApp = undefined;
export const adminAuth = null;
export const adminDb = null;
export const adminInitializationError = new Error(deprecationMessage + " No Admin SDK initialized from this file.");

// You might want to re-export from admin.node.ts if there's a common, non-environment-specific
// utility function that could live here, but generally, keep Node/Edge specific logic separate.
// For now, this file will act as a clear indicator of deprecation.

    