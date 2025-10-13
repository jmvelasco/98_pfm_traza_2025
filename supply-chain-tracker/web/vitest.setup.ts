// vitest setup file
import '@testing-library/jest-dom'

// Provide a minimal ethereum mock when needed in tests (opt-in per test)
declare global {
  interface Window {
    ethereum?: any
  }
}
