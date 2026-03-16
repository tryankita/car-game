// Shared mutable touch-key state — written by HUD touch buttons, read by Car.jsx
// Plain object (no React state) so writes are synchronous and zero GC cost.
export const touchKeys = {}
