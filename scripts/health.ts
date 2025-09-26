#!/usr/bin/env tsx

import { PriceAnalyser } from '../lib/price-analyser';

async function main() {
  const analyser = new PriceAnalyser();
  await analyser.runHealthCheck();
}

main().catch(console.error);
