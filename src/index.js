// Entry point: build an analyzer from the lexicon JSON.
//   import { createAnalyzer } from './src/index.js';
//   const analyzer = createAnalyzer(lexiconJson);
//   analyzer.analyze('gidemeyeceklermiş');
import { Lexicon } from './lexicon.js';
import { Analyzer } from './analyzer.js';

export { Lexicon } from './lexicon.js';
export { Analyzer, segmentation } from './analyzer.js';
export { SUFFIXES } from './suffixes.js';

export function createAnalyzer(lexiconJson) {
  return new Analyzer(Lexicon.fromJSON(lexiconJson));
}
