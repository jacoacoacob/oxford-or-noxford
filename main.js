import { checkOxfordComma } from "./check-oxford-comma.js";

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

  return { suggestions, text };
}

function handleTextareaInput(ev) {
  const suggestions = composeChecks(ev.target.value, checkAcronymPunctuationStyle, checkOxfordComma);
}

textarea.addEventListener("input", handleTextareaInput);