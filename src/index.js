// Entry point: build an analyzer from the lexicon JSON.
//   import { createAnalyzer } from './src/index.js';
//   const analyzer = createAnalyzer(lexiconJson, glossesJson);
//   analyzer.analyze('gidemeyeceklermiş');
import { Lexicon } from './lexicon.js';
import { Analyzer } from './analyzer.js';

export { Lexicon } from './lexicon.js';
export { Analyzer, segmentation } from './analyzer.js';
export { SUFFIXES } from './suffixes.js';

/**
 * @param {object} lexiconJson   contents of data/lexicon.json
 * @param {object} [glossesJson] contents of data/glosses.json (English meanings)
 */
export function createAnalyzer(lexiconJson, glossesJson = null) {
  return new Analyzer(Lexicon.fromJSON(lexiconJson, glossesJson));
}
