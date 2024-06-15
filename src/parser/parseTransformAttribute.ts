import { iMatrix } from '../constants';
import { reNum } from './constants';
import type { TMat2D } from '../typedefs';
import { cleanupSvgAttribute } from '../util/internals/cleanupSvgAttribute';
import {
  createRotateMatrix,
  createScaleMatrix,
  createSkewXMatrix,
  createSkewYMatrix,
  createTranslateMatrix,
  multiplyTransformMatrixArray,
} from '../util/misc/matrix';

// == begin transform regexp
const p = `(${reNum})`;
const skewX = String.raw`(skewX)\(${p}\)`;
const skewY = String.raw`(skewY)\(${p}\)`;
const rotate = String.raw`(rotate)\(${p}(?: ${p} ${p})?\)`;
const scale = String.raw`(scale)\(${p}(?: ${p})?\)`;
const translate = String.raw`(translate)\(${p}(?: ${p})?\)`;
const matrix = String.raw`(matrix)\(${p} ${p} ${p} ${p} ${p} ${p}\)`;
const transform = `(?:${matrix}|${translate}|${rotate}|${scale}|${skewX}|${skewY})`;
const transforms = `(?:${transform}*)`;
const transformList = String.raw`^\s*(?:${transforms}?)\s*$`;
// http://www.w3.org/TR/SVG/coords.html#TransformAttribute
const reTransformList = new RegExp(transformList);
const reTransform = new RegExp(transform);
const reTransformAll = new RegExp(transform, 'g');
// == end transform regexp

/**
 * Parses "transform" attribute, returning an array of values
 * @static
 * @function
 * @memberOf fabric
 * @param {String} attributeValue String containing attribute value
 * @return {TTransformMatrix} Array of 6 elements representing transformation matrix
 */
export function parseTransformAttribute(attributeValue: string): TMat2D {
  // first we clean the string
  attributeValue = cleanupSvgAttribute(attributeValue)
    // remove spaces around front parentheses
    .replace(/\s*([()])\s*/gi, '$1');

  // start with identity matrix
  const matrices: TMat2D[] = [];

  // return if no argument was given or
  // an argument does not match transform attribute regexp
  if (
    !attributeValue ||
    (attributeValue && !reTransformList.test(attributeValue))
  ) {
    return [...iMatrix];
  }

  for (const match of attributeValue.matchAll(reTransformAll)) {
    const transformMatch = reTransform.exec(match[0]);
    if (!transformMatch) {
      continue;
    }
    let matrix: TMat2D = iMatrix;
    const matchedParams = transformMatch.filter((m) => !!m);
    const [, operation, ...rawArgs] = matchedParams;
    const [arg0, arg1, arg2, arg3, arg4, arg5] = rawArgs.map((arg) =>
      parseFloat(arg)
    );

    switch (operation) {
      case 'translate':
        matrix = createTranslateMatrix(arg0, arg1);
        break;
      case 'rotate':
        matrix = createRotateMatrix({ angle: arg0 }, { x: arg1, y: arg2 });
        break;
      case 'scale':
        if (arg1 === undefined) {
          matrix = createScaleMatrix(arg0, arg0);
        } else {
          matrix = createScaleMatrix(arg0, arg1);
        }
        break;
      case 'skewX':
        matrix = createSkewXMatrix(arg0);
        break;
      case 'skewY':
        matrix = createSkewYMatrix(arg0);
        break;
      case 'matrix':
        matrix = [arg0, arg1, arg2, arg3, arg4, arg5];
        break;
    }

    // snapshot current matrix into matrices array
    matrices.push(matrix);
  }

  return multiplyTransformMatrixArray(matrices);
}

/**
 * Parses "transform-origin" attribute, returning a record with originX and originY filled in
 * @static
 * @memberOf fabric
 * @param {SVGElement} element Element to parse
 * @return {Record<string,number>} Objects with values parsed from transform-origin attribute of an element
 */
export function parseTransformOriginAttribute(
  element: HTMLElement
): Record<string, number> {
  const ret: Record<string, any> = {},
    vals = element.getAttribute('transform-origin');

  if (!vals) {
    return ret;
  }

  if (typeof vals === 'string') {
    const noWhitespace = vals.replaceAll(/[\s\,]+/g, ';');
    const split = noWhitespace.split(';');
    if (split.length < 2) { return ret; }
    const x = parseFloat(split[0]);
    const y = parseFloat(split[1]);
    if (!isNaN(x) && !isNaN(y)) {
      return {originX: x, originY: y};
    }
  }

  return ret;
}