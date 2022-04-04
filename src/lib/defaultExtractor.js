const PATTERNS = [
  /(?:\['([^'\s]+[^<>"'`\s:\\])')/.source, // ['text-lg' -> text-lg
  /(?:\["([^"\s]+[^<>"'`\s:\\])")/.source, // ["text-lg" -> text-lg
  /(?:\[`([^`\s]+[^<>"'`\s:\\])`)/.source, // [`text-lg` -> text-lg
  /([^${(<>"'`\s]*\[\w*'[^"`\s]*'?\])/.source, // font-['some_font',sans-serif]
  /([^${(<>"'`\s]*\[\w*"[^'`\s]*"?\])/.source, // font-["some_font",sans-serif]
  /([^<>"'`\s]*\[\w*\('[^"'`\s]*'\)\])/.source, // bg-[url('...')]
  /([^<>"'`\s]*\[\w*\("[^"'`\s]*"\)\])/.source, // bg-[url("...")]
  /([^<>"'`\s]*\[\w*\('[^"`\s]*'\)\])/.source, // bg-[url('...'),url('...')]
  /([^<>"'`\s]*\[\w*\("[^'`\s]*"\)\])/.source, // bg-[url("..."),url("...")]
  /([^<>"'`\s]*\[[^<>"'`\s]*\('[^"`\s]*'\)+\])/.source, // h-[calc(100%-theme('spacing.1'))]
  /([^<>"'`\s]*\[[^<>"'`\s]*\("[^'`\s]*"\)+\])/.source, // h-[calc(100%-theme("spacing.1"))]
  /([^${(<>"'`\s]*\['[^"'`\s]*'\])/.source, // `content-['hello']` but not `content-['hello']']`
  /([^${(<>"'`\s]*\["[^"'`\s]*"\])/.source, // `content-["hello"]` but not `content-["hello"]"]`
  /([^<>"'`\s]*\[[^<>"'`\s]*:[^\]\s]*\])/.source, // `[attr:value]`
  /([^<>"'`\s]*\[[^<>"'`\s]*:'[^"'`\s]*'\])/.source, // `[content:'hello']` but not `[content:"hello"]`
  /([^<>"'`\s]*\[[^<>"'`\s]*:"[^"'`\s]*"\])/.source, // `[content:"hello"]` but not `[content:'hello']`
  /([^<>"'`\s]*\[[^"'`\s]+\][^<>"'`\s]*)/.source, // `fill-[#bada55]`, `fill-[#bada55]/50`
  /([^"'`\s]*[^<>"'`\s:\\])/.source, //  `<sm:underline`, `md>:font-bold`
  /([^<>"'`\s]*[^"'`\s:\\])/.source, //  `px-1.5`, `uppercase` but not `uppercase:`

  // Arbitrary properties
  // /([^"\s]*\[[^\s]+?\][^"\s]*)/.source,
  // /([^'\s]*\[[^\s]+?\][^'\s]*)/.source,
  // /([^`\s]*\[[^\s]+?\][^`\s]*)/.source,
].join('|')

const BROAD_MATCH_GLOBAL_REGEXP = new RegExp(PATTERNS, 'g')
const INNER_MATCH_GLOBAL_REGEXP = /[^<>"'`\s.(){}[\]#=%$]*[^<>"'`\s.(){}[\]#=%:$]/g

/**
 * @param {any} context
 */
export function defaultExtractor(context) {
  const reRegExpChar = /[\\^$.*+?()[\]{}|]/g
  const reHasRegExpChar = RegExp(reRegExpChar.source)

  function escapeRegExp(string) {
    return (string && reHasRegExpChar.test(string))
      ? string.replace(reRegExpChar, '\\$&')
      : (string || '')
  }

  let pattern = new RegExp([
    '(',
      // Variants
      '(?:',
        /[^\s\\'"]+/.source,
        escapeRegExp(context.tailwindConfig.separator),
      ')*',

      // Important utilities (!underline, hover:!underline, etc…)
      /!?/.source,

      // Negative utilities (-inset-1, -tw-inset-1)
      /-?/.source,

      context.tailwindConfig.prefix,

      // Negative utilities (tw--inset-1)
      /-?/.source,

      '(?:',
        `(?:\\b|${escapeRegExp(context.tailwindConfig.separator)}?)`,
        // Utility Groups
        '(?:',
          '(?:',
            Array.from(new Set(context.getUtilityPrefixes())).sort((a, b) => {
              return (b.length - a.length)
                  || a.localeCompare(b)
            }).map(escapeRegExp).join('|'),
          ')',

          '(?:',
            '(?:',
              // Utility values the `5` in `inset-x-5`
              /[^\s\\'"=\[]+/.source,

              // or…
              '|',

              // Arbitrary values like the `['foo']` in `inset-x-['foo']`
              /\[[^\s]+\]/.source,
            ')',

            // Followed by an optional color opacity modifier
            /(?:\/[^\s\\'"]+)?/.source,
          ')?',
        ')',

        // Or arbitrary properties like the `[text-shadow:0_0_1px_magenta]`
        '|',
        /\[[^\s:'"]+:[^\s\]]+\]/.source,
      ')',
    ')',
  ].join(''), 'g')

  // console.log(pattern)

  /**
   * @param {string} content
   */
  return content => {
    return Array.from(content.matchAll(pattern)).flat().filter((v) => v !== undefined)
    // let broadMatches = content.matchAll(BROAD_MATCH_GLOBAL_REGEXP)
    let broadMatches = content.matchAll(pattern)
    let innerMatches = content.match(INNER_MATCH_GLOBAL_REGEXP) || []
    let results = [...broadMatches, ...innerMatches].flat().filter((v) => v !== undefined)

    return results
  }
}

// Regular utilities
// {{modifier}:}*{namespace}{-{suffix}}*{/{opacityModifier}}?

// Arbitrary values
// {{modifier}:}*{namespace}-[{arbitraryValue}]{/{opacityModifier}}?
// arbitraryValue: no whitespace, balanced quotes unless within quotes, balanced brackets unless within quotes

// Arbitrary properties
// {{modifier}:}*[{validCssPropertyName}:{arbitraryValue}]
