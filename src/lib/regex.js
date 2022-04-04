
const REGEX_SPECIAL = /[\\^$.*+?()[\]{}|]/g
const REGEX_HAS_SPECIAL = RegExp(REGEX_SPECIAL.source)

/**
 * @param {string|RegExp|Array<string|RegExp>} source
 */
function toSource (source) {
  source = Array.isArray(source)
    ? source
    : [source]

  source = source.map(item =>
    item instanceof RegExp
      ? item.source
      : item
  )

  return source.join('')
}

/**
 * @param {string|RegExp|Array<string|RegExp>} source
 */
export function pattern (source) {
  return new RegExp(`(${toSource(source)})`, 'g')
}

/**
 * @param {Array<string|RegExp>} sources
 */
export function any (sources) {
  return sources.map(toSource).join('|')
}

/**
 * @param {string|RegExp} source
 */
export function optional (source) {
  return `(${toSource(source)})?`
}

/**
 * @param {string|RegExp|Array<string|RegExp>} source
 */
export function zeroOrMore (source) {
  return `(${toSource(source)})*`
}

export function escape(string) {
  return (string && REGEX_HAS_SPECIAL.test(string))
    ? string.replace(REGEX_SPECIAL, '\\$&')
    : (string || '')
}
