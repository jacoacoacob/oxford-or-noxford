/**
 * @typedef Token
 * @property {string} kind The kind of token it is
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
function matchAll(kind, pattern, source) {
  return Array.from(source.matchAll(pattern)).map((match) => ({
    kind,
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
 * @param {string} srouce 
 */
function tokenize(source) {
  const tokens = [
    matchAll("end_sentence",  /(\.|!|\?)+/g,  source),
    matchAll("comma",         /,/g,           source),
    matchAll("word",          /\w+/g,         source),
    matchAll("whitespace",    /\s+/g,         source), 
  ];

  return tokens
    .flat()
    .sort((tokenA, tokenB) => tokenA.start - tokenB.start);
}


/**
 * 
 * @param {Token[]} tokens 
 * @returns {Token[][]}
 */
function groupSentences(tokens) {
  const groups = [];

  let group = [];

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];

    group.push(current);

    if (current.kind === "end_sentence") {
      groups.push(group);
      group = [];
    }
  }

  const wordTokensInGroup = group.filter((token) => token.kind === "word");

  if (wordTokensInGroup.length > 0) {
    groups.push(group);
  }

  return groups;
}


/**
 * @typedef Suggestion
 * 
 */


/**
 * 
 * @param {Token[][]} sentences 
 * @returns {Suggestion[]}
 */
function findOxfordCommas(sentences) {
  return sentences.reduce((accum, sentence) => {

  }, []);
}


export function checkOxfordComma({ suggestions, text }) {
  const tokens = tokenize(text);
  const sentences = groupSentences(tokens);

  const oxfordCommas = findOxfordCommas(sentences);

  return { suggestions, text };
}
