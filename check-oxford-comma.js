/**
 * @typedef Token
 * @property {string} kind The kind of token it is
 * @property {number} weight If a token's start/end range overlaps another token's, the higher weighted token should be given priority when reconciling overlaps
 * @property {string} match The actual characters that matched the pattern
 * @property {number} length The length of the string made up of the characters that matched the pattern - the number of characters in {@link Token.match}
 * @property {number} start The source index of the *first* character of the match
 * @property {number} end The source index of the *last* character of the match
 * @property {string} before The string of characters in the source that appear *before* the match
 * @property {string} after The string of characters in the source that appear *after* the match
 */


/**
 * 
 * @param {string} kind
 * @param {RegExp} pattern 
 * @param {string} source 
 * @returns {Token[]}
 */
function matchAll(kind, pattern, weight, source) {
  return Array.from(source.matchAll(pattern)).map((match) => ({
    kind,
    weight,
    match: match[0],
    length: match[0].length,
    start: match.index,
    end: match.index + match[0].length,
    before: match.input.slice(0, match.index),
    after: match.input.slice(match.index + match[0].length)
  }));
}


/**
 * 
 * @param {Token[]} tokens 
 */
function reconcileOverlaps(tokens) {
  /** @type {Token[]} */
  const final = [];
  
  for (let a = 0; a < tokens.length; a++) {
    const tokenA = tokens[a];
    
    for (let b = 0; b < tokens.length; b++) {
      if (a === b) {
        continue;
      }

      const tokenB = tokens[b];

      if (tokenA.weight !== tokenB.weight) {

        // tokenA    ****
        // tokenB    ****
        if (tokenA.start >= tokenB.start && tokenA.end <= tokenB.end) {

          console.log("OVERLAP", {
            tokenA: { kind: tokenA.kind, match: tokenA.match },
            tokenB: { kind: tokenB.kind, match: tokenB.match },
          });
          continue;
        }

        // tokenA   ****
        // tokenB     ****
        if (tokenA.end >= tokenB.start && tokenB.end <= tokenB.end) {
          // this shouldn't happen...
          console.log(`
            tokenA   ****
            tokenB     ****
          `);
          continue;
        }
  
        // tokenA     ****
        // tokenB   ****
        if (tokenA.start >= tokenB.start <= tokenB.end) {
          // this shouldn't happen...
          console.log(`
            tokenA     ****
            tokenB   ****
          `);
          continue;
        }
      }

      final.push(tokenA);
    }
  }

  return Array
    .from(final)
    .sort((tokenA, tokenB) => tokenA.start - tokenB.start);
}


/**
 * 
 * @param {string} srouce 
 */
function tokenize(source) {
  const tokens = [
    matchAll("end_sentence",  /(\.|!|\?)+/g,        1,  source),
    matchAll("comma",         /,/g,                 1,  source),
    matchAll("and",           /(?<=\W)and(?=\W)/g,  2,  source),
    matchAll("word",          /\w+/g,               1,  source),
    matchAll("whitespace",    /\s+/g,               1,  source),
  ];

  return reconcileOverlaps(tokens.flat());
}


/**
 * @typedef Suggestion
 * 
 */


const SEQUENCE = [
  "word",
  ""
]

/**
 * 
 * @param {Token[]} sentences 
 * @returns {Suggestion[]}
 */
function scanOxfordCommaStyle(tokens) {

}


export function checkOxfordComma({ suggestions, text }) {
  const tokens = tokenize(text);
  const oxfordCommaStyles = scanOxfordCommaStyle(tokens);



  return { suggestions, text };
}
