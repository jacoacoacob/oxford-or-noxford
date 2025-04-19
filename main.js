
const textarea = document.querySelector("textarea");

function composeChecks(text, ...fns) {
  const { suggestions } = fns.reduce((accum, fn) => fn(accum), { suggestions: [], text });

  return suggestions;
}

function checkAcronymPunctuationStyle({ suggestions, text }) {
  const withPeriodsPattern = /([A-Z]\.){3,}/g;
  const withoutPeriodsPattern = /[A-Z]{3,}/g;

  const withPeriodsMatches = text.matchAll(withPeriodsPattern);
  const withoutPeriodsMatches = text.matchAll(withoutPeriodsPattern);

  console.log({
    withPeriodsMatches: Array.from(withPeriodsMatches),
    withoutPeriodsMatches: Array.from(withoutPeriodsMatches)
  });

  return { suggestions, text };
}

function handleTextareaInput(ev) {
  const suggestions = composeChecks(ev.target.value, checkAcronymPunctuationStyle)
}

textarea.addEventListener("input", handleTextareaInput);