
/**
 * @typedef Suggestion
 * 
 */

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

  const remove = [];
  
  for (let a = 0; a < tokens.length; a++) {
    const tokenA = tokens[a];
    
    for (let b = 0; b < tokens.length; b++) {
      if (a === b) {
        continue;
      }

      const tokenB = tokens[b];

      // tokenA    ****
      // tokenB    ****
      if (tokenA.start >= tokenB.start && tokenA.end <= tokenB.end) {
        if (tokenA.weight > tokenB.weight) {
          remove.push(b);
        }

        if (tokenA.weight < tokenB.weight) {
          remove.push(a);
        }
      }
    }

    if (remove.includes(a)) {
      continue;
    }

    final.push(tokenA);
  }

  return Array
    .from(final)
    .sort((tokenA, tokenB) => tokenA.start - tokenB.start);
}

const TOKEN = {
  /** End of Sentence */
  EOS:        "eos",
  /** A comma (`","`) */
  COMMA:      "comma",
  /** The word `"and"` */
  AND:        "and",
  /** Any word */
  WORD:       "word",
  /** Whitespace (`" "`) */
  WHITESPACE: "whitespace",
}

/**
 * 
 * @param {string} srouce 
 */
function tokenize(source) {
  const tokens = [
    matchAll(TOKEN.EOS,         /(\.|!|\?)+/g,        1,  source),
    matchAll(TOKEN.COMMA,       /,/g,                 1,  source),
    matchAll(TOKEN.AND,         /(?<=\W)and(?=\W)/g,  2,  source),
    matchAll(TOKEN.WORD,        /\w+/g,               1,  source),
    matchAll(TOKEN.WHITESPACE,  /\s+/g,               1,  source),
  ];

  return reconcileOverlaps(tokens.flat());
}

/**
 * 
 * @param {Token[]} tokens 
 * @returns {}
 */
function scanCommaStyle(tokens) {
  const matches = [];

  /** @type {Token[]} */
  let sequence = [];
  let commaCount = 0;
  let includesAnd = false;
  let isOxfordComma = false;

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];

    sequence.push(current);

    if (current.kind === TOKEN.EOS || i === tokens.length - 1) {

      if (
        commaCount >= 2 ||
        (
          includesAnd && commaCount >= 1
        )
      ) {
        matches.push({
          isOxfordComma,
          sequence,
          text: sequence.map((token) => token.match).join(""),
        });
      }
      
      sequence = [];
      commaCount = 0;
      isOxfordComma = false;

      continue;
    }
    
    if (current.kind === TOKEN.COMMA) {
      commaCount += 1;
    }

    if (current.kind === TOKEN.AND) {
      includesAnd = true;

      let b = i;
      
      // look back
      while (true) {
        b -= 1;

        if (b < 0) {
          break;
        }

        const back = tokens[b];

        if (back && [TOKEN.AND, TOKEN.WORD, TOKEN.EOS].includes(back.kind)) {
          break;
        }

        if (back && back.kind === TOKEN.COMMA) {
          isOxfordComma = true;
        }
      }
    }
  }

  return matches;
}


export function checkOxfordComma({ suggestions, text }) {
  const tokens = tokenize(text);
  const commaStyleMatches = scanCommaStyle(tokens);

  console.log(commaStyleMatches)


  return { suggestions, text };
}
