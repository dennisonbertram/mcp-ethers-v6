import { TestEnvironment, getHardhatTestProvider } from './hardhatTestProvider.js';

let globalTestEnv: TestEnvironment | undefined;

export async function getTestEnvironment(): Promise<TestEnvironment> {
  if (!globalTestEnv) {
    globalTestEnv = await getHardhatTestProvider();
  }
  return globalTestEnv;
}

export async function cleanupTestEnvironment(): Promise<void> {
  globalTestEnv = undefined;
}

export async function resetTestEnvironment(): Promise<void> {
  globalTestEnv = await getHardhatTestProvider();
} 