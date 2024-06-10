import { attributesMap } from './constants';

/**
 * Parses "values" attribute, returning an object with values
 * @static
 * @memberOf fabric
 * @param {SVGElement} element Element to parse
 * @return {Record<string,any[]>} Objects with values parsed from style attribute of an element
 */
export function parseValuesAttribute(
  element: HTMLElement
): Record<string, any[]> {
  const ret: Record<string, any[]> = {},
    vals = element.getAttribute('values');

  if (!vals) {
    return ret;
  }

  if (typeof vals === 'string') {
    const split = vals.split(';');
    // Success
    return { values: split };
  }

  return ret;
}

/**
 * Convert svg attributeNames to fabric attribute names
 * @static
 * @memberOf fabric
 * @param {SVGElement} element Element to parse
 * @return {Record<string,any>} Record with attributeName attribute converted
 * to fabric nomenclature
 */
export function convertAttributeNames(
  element: HTMLElement
): Record<string, any> {
  const ret: Record<string, string> = {},
    val = element.getAttribute('attributeName');

  if (!val) {
    return ret;
  }

  if (
    typeof val === 'string' &&
    (val as keyof typeof attributesMap) != undefined
  ) {
    const key = val as keyof typeof attributesMap;
    if (key in attributesMap && typeof attributesMap[key] === 'string') {
      return { attributeName: attributesMap[key] };
    }
    return { attributeName: val };
  }

  return ret;
}

/**
 * TODO: Handle if 'by' is in fancy units
 * Parse from-to-by attributes. From/to/by are attributes for when
 * you just have a simple 2-value animation.
 * To be called after attempting to parse
 * values attribute: just make values the main one and convert
 * from-to/by to values
 * @static
 * @memberOf fabric
 * @param {SVGElement} element Element to parse
 * @return {Record<string, any>} Objects with values parsed from style attribute of an element
 */
export function parseFromToByAttribute(
  element: HTMLElement
): Record<string, any> {
  const from = element.getAttribute('from'),
    to = element.getAttribute('to'),
    by = parseFloat(element.getAttribute('by') ?? 'NaN');
  // values attribute overrides all 3 of the above
  const values = element.getAttribute('values');
  if (values || !from || (!to && !by)) {
    return {};
  }

  // Parse from/by pair
  if (!to) {
    if (isNaN(parseFloat(from))) {
      return {};
    }
    return { values: [from, parseFloat(from) + by] };
  }

  return { values: [from, to] };
}
