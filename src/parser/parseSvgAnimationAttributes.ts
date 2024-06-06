import {attributesMap} from './constants';

/**
 * Parses "values" attribute, returning an object with values
 * @static
 * @memberOf fabric
 * @param {SVGElement} element Element to parse
 * @return {Object} Objects with values parsed from style attribute of an element
 */
export function parseValuesAttribute(element: HTMLElement): Record<string, any> {
  const ret: Record<string, number[]> = {},
    vals = element.getAttribute('values');

  if (!vals) {
    return ret;
  }

  if (typeof vals === 'string') {
    const split = vals.replaceAll(';', ' ').split(' ');
    for (var substring of split) {
        if (isNaN(parseFloat(substring))) {
            return ret;
        }
    }
    // Success
    return {values : split.map(parseFloat)};
  }

  return ret;
}


/**
 * Convert svg attributeNames to fabric attribute names
 * @static
 * @memberOf fabric
 * @param {SVGElement} element Element to parse
 * @return {Object} Objects with values parsed from style attribute of an element
 */
export function convertAttributeNames(element: HTMLElement): Record<string, any> {
    const ret: Record<string, string> = {},
      val = element.getAttribute('attributeName');
  
    if (!val) {
      return ret;
    }
  
    if (typeof val === 'string' && val as keyof typeof attributesMap != undefined) {
        const key = val as keyof typeof attributesMap;
        if (key in attributesMap && typeof attributesMap[key] === 'string') {
            return {attributeName: attributesMap[key]};
        }
        return {attributeName: val};
    }
  
    return ret;
  }
  