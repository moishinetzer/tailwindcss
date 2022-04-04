import * as regex from "./regex"

/**
 * @param {any} context
 */
export function defaultExtractor(context) {
  let patterns = Array.from(buildRegExps(context))

  console.log(patterns)

  /**
   * @param {string} content
   */
  return content => {
    let results = []

    for (let pattern of patterns) {
      results.push(...Array.from(content.matchAll(pattern)).flat().filter((v) => v !== undefined))
    }

    return results
  }
}

/**
 * @param {any} context
 */
function* buildRegExps(context) {
  let maybeImportant = /!?/
  let maybeNegative = /-?/

  let utilityGroups = regex.optional(regex.any(
      context.getUtilityPrefixes()
        .sort((a, b) => (b.length - a.length) || a.localeCompare(b))
        .map(regex.escape)
  ))

  let zeroOrMoreVariants = regex.zeroOrMore([
    /[^\s\\'"]+/,
    regex.escape(context.tailwindConfig.separator),
  ])

  let opacityModifier = regex.optional(regex.any([
    // Known opacity modifier
    /\/[^\s\\'"\[]+/,

    // Arbitrary opacity modifier
    /\/\[[^\s]+\]/
  ]))

  // 1. Normal utilities
  yield regex.pattern([
    // hover:, hover:focus:, hover:active:, etc…
    zeroOrMoreVariants,

    // Important utilities (!underline, hover:!underline, etc…)
    maybeImportant,

    // Negative utilities (before prefix: -inset-1, -tw-inset-1)
    maybeNegative,

    // A prefix (if one is configured)
    context.tailwindConfig.prefix,

    // Negative utilities (after prefix: tw--inset-1)
    maybeNegative,

    // sr-only, border, border-, border-r-, border-l-, etc…
    utilityGroups,

    // Utility values the `5` in `inset-x-5`
    /[^\s\\'"=\[\/]*/,

    // Followed by an optional color opacity modifier
    opacityModifier,
  ])

  // 2. Arbitrary value utilities
  yield regex.pattern([
    // hover:, hover:focus:, hover:active:, etc…
    zeroOrMoreVariants,

    // Important utilities (!underline, hover:!underline, etc…)
    maybeImportant,

    // A prefix (if one is configured)
    context.tailwindConfig.prefix,

    // sr-only, border, border-, border-r-, border-l-, etc…
    utilityGroups,

    // Arbitrary values like the `['foo']` in `inset-x-['foo']`
    /(?:\[[^\s\]]+\])/,

    // Followed by an optional color opacity modifier
    opacityModifier,
  ])

  // 3. Arbitrary property utilities
  yield regex.pattern([
    // hover:, hover:focus:, hover:active:, etc…
    zeroOrMoreVariants,

    // Important utilities (!underline, hover:!underline, etc…)
    maybeImportant,

    // A prefix (if one is configured)
    context.tailwindConfig.prefix,

    // Arbitrary properties like the `[text-shadow:0_0_1px_magenta]`
    /\[[^\s:'"]+:[^\s\]]+\]/,
  ])

  // 4. Inner matches
  yield /[^<>"'`\s.(){}[\]#=%$]*[^<>"'`\s.(){}[\]#=%:$]/g
}

// Regular utilities
// {{modifier}:}*{namespace}{-{suffix}}*{/{opacityModifier}}?

// Arbitrary values
// {{modifier}:}*{namespace}-[{arbitraryValue}]{/{opacityModifier}}?
// arbitraryValue: no whitespace, balanced quotes unless within quotes, balanced brackets unless within quotes

// Arbitrary properties
// {{modifier}:}*[{validCssPropertyName}:{arbitraryValue}]
