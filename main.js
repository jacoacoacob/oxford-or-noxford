// *******************************************************
// *** User Interface Interactivity **********************
// *******************************************************

const textarea = document.querySelector("textarea");
const btnCompute = document.querySelector("#btn-compute");
const preferenceSelector = document.querySelector("#preference-selector");
const suggestionList = document.querySelector(".suggestions");

const suggestions = subject([]);

btnCompute.addEventListener("click", checkForSuggestions);
preferenceSelector.addEventListener("change", checkForSuggestions);

function checkForSuggestions() {
  const data = checkOxfordComma(textarea.value, preferenceSelector.value);
  suggestions.update(data);
}

suggestions.subscribe(setupSuggestionsList);

/**
 * 
 * @param {Suggestion[]} suggestions 
 */
function setupSuggestionsList(suggestions) {
  empty(suggestionList);

  suggestions.forEach((suggestion) => {
    const li = document.createElement("li");

    li.textContent = suggestion.description;

    suggestionList.appendChild(li);
  });
}

function empty(element) {
  while (element.lastChild) {
    element.removeChild(element.lastChild);
  }
}

function subject(initialValue) {
  let value = initialValue;

  const watchers = [];

  return {
    subscribe(watcher) {
      watcher(value);
      watchers.push(watcher);
    },
    update(newValue) {
      value = newValue;
      watchers.forEach((notify) => {
        notify(value);
      });
    }
  }
}


// *******************************************************
// *** Typedefs: Annotations to make coding easier :)  ***
// *******************************************************

/**
 * @typedef CommaStyleMatch 
 * @property {Token[]} sentence
 * @property {boolean} isOxfordComma
 */

/**
 * @typedef {"most_common" | "oxford" | "non_oxford"} CommaStylePreference
 */

/**
 * @typedef Suggestion The output of our grammar logic.
 * @property {string} description
 * @property {CommaStyleMatch} match
 * 
 */

/**
 * @typedef Token Data representing a unit of text
 * @property {string} kind The kind of token it is
 * @property {number} weight If a token's start/end range overlaps another token's, the higher weighted token should be given priority when reconciling overlaps
 * @property {string} match The actual characters that matched the pattern
 * @property {number} length The length of the string made up of the characters that matched the pattern - the number of characters in {@link Token.match}
 * @property {number} start The source index of the *first* character of the match
 * @property {number} end The source index of the *last* character of the match
 * @property {string} before The string of characters in the source that appear *before* the match
 * @property {string} after The string of characters in the source that appear *after* the match
 */


// *******************************************************
// *** Oxford Comma Grammar Logic  ***********************
// *******************************************************

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
 * @returns {CommaStyleMatch[]}
 */
function scanCommaStyle(tokens) {
  
  /** @type {CommaStyleMatch[]} */
  const matches = [];

  /** @type {Token[]} */
  let sentence = [];
  let commaCount = 0;
  let includesAnd = false;
  let isOxfordComma = false;

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];

    sentence.push(current);

    if (current.kind === TOKEN.EOS || i === tokens.length - 1) {

      if (
        commaCount >= 2 ||
        (
          includesAnd && commaCount >= 1
        )
      ) {
        matches.push({ isOxfordComma, sentence });
      }
      
      sentence = [];
      commaCount = 0;
      isOxfordComma = false;
      includesAnd = false;

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

        if (back && back.kind === TOKEN.COMMA && commaCount >= 2) {
          isOxfordComma = true;
        }
      }
    }
  }

  return matches;
}

/**
 * 
 * @param {Token[]} tokens 
 */
function tokensToString(tokens) {
  return tokens.map((token) => token.match).join("").trim();
}

/**
 * 
 * @param {CommaStyleMatch[]} matches 
 * @param {CommaStylePreference} preference
 * @returns {Suggestion[]}
 */
function generateSuggestions(matches, preference) {
  if (matches.length === 0) {
    return [];
  }

  const oxfordMatches = matches.filter((match) => match.isOxfordComma);
  const nonOxfordMatches = matches.filter((match) => !match.isOxfordComma);

  if (preference === "most_common") {
    return preferMostCommon();
  }

  if (preference === "oxford") {
    return preferOxford();
  }

  if (preference === "non_oxford") {
    return preferNonOxford();
  }

  /**
   * @returns {Suggestion[]}
   */
  function preferMostCommon() {
    if (matches.length === 1) {
      return [];
    }

    if (oxfordMatches.length === nonOxfordMatches.length) {
      if (matches[0].isOxfordComma) {
        return preferOxford();
      }
      return preferNonOxford();
    }

    if (oxfordMatches.length > nonOxfordMatches.length) {
      return preferOxford();
    }

    return preferNonOxford();
  }

  /**
   * @returns {Suggestion[]}
   */
  function preferOxford() {
    return nonOxfordMatches.map((match) => ({
      description: `It looks like the sentence "${tokensToString(match.sentence)}" might use non-Oxford comma style...🧐`,
      match,
    }));
  }

  /**
   * @returns {Suggestion[]}
   */
  function preferNonOxford() {
    return oxfordMatches.map((match) => ({
      description: `It looks like the sentence "${tokensToString(match.sentence)}" might use Oxford comma style...🧐`,
      match,
    }));
  }

}

/**
 * 
 * @param {string} source 
 * @param {CommaStylePreference} preference
 * @returns 
 */
function checkOxfordComma(source, preference) {
  const tokens = tokenize(source);
  const commaStyleMatches = scanCommaStyle(tokens);
  const suggestions = generateSuggestions(commaStyleMatches, preference);

  return suggestions;
}
