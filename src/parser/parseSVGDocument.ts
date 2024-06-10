import { applyViewboxTransform } from './applyViewboxTransform';
import { svgValidTagNamesRegEx } from './constants';
import { hasInvalidAncestor } from './hasInvalidAncestor';
import { parseUseDirectives } from './parseUseDirectives';
import type { SVGParsingOutput, TSvgReviverCallback } from './typedefs';
import type { LoadImageOptions } from '../util/misc/objectEnlive';
import { ElementsParser } from './elements_parser';
import { log, SignalAbortedError } from '../util/internals/console';
import { getTagName } from './getTagName';
import { AnimateElement, FabricObject } from '../../fabric';
import { AnimatableObject } from '../shapes/Object/AnimatableObject';
import { setStrokeFillOpacity } from './setStrokeFillOpacity';
import { easeNone } from '../util/animation/easing';

const isValidSvgTag = (el: Element) =>
  svgValidTagNamesRegEx.test(getTagName(el));

export const createEmptyResponse = (): SVGParsingOutput => ({
  objects: [],
  elements: [],
  options: {},
  allElements: [],
});

/**
 * Parses an SVG document, converts it to an array of corresponding fabric.* instances and passes them to a callback
 * @static
 * @function
 * @memberOf fabric
 * @param {HTMLElement} doc SVG document to parse
 * @param {TSvgParsedCallback} callback Invoked when the parsing is done, with null if parsing wasn't possible with the list of svg nodes.
 * @param {TSvgReviverCallback} [revivattr: string, i: number, p0: { duration: number; onComplete: () => void; }, animatable: Record<string, T>, options?: Partial<AnimationOptions<T>>ic object has been created.
 * Takes as input the original svg element and the generated `FabricObject` as arguments. Used to inspect extra properties not parsed by fabric,
 * or extra custom manipulation
 * @param {Object} [options] Object containing options for parsing
 * @param {String} [options.crossOrigin] crossOrigin setting to use for external resources
 * @param {AbortSignal} [options.signal] handle aborting, see https://developer.mozilla.org/en-US/docs/Web/API/AbortController/signal
 * @return {SVGParsingOutput}
 * {@link SVGParsingOutput} also receives `allElements` array as the last argument. This is the full list of svg nodes available in the document.
 * You may want to use it if you are trying to regroup the objects as they were originally grouped in the SVG. ( This was the reason why it was added )
 */
export async function parseSVGDocument(
  doc: Document,
  reviver?: TSvgReviverCallback,
  { crossOrigin, signal }: LoadImageOptions = {}
): Promise<SVGParsingOutput> {
  if (signal && signal.aborted) {
    log('log', new SignalAbortedError('parseSVGDocument'));
    // this is an unhappy path, we dont care about speed
    return createEmptyResponse();
  }
  const documentElement = doc.documentElement;
  parseUseDirectives(doc);

  const descendants = Array.from(documentElement.getElementsByTagName('*')),
    options = {
      ...applyViewboxTransform(documentElement),
      crossOrigin,
      signal,
    };

  const elements = descendants.filter((el) => {
    applyViewboxTransform(el);
    return isValidSvgTag(el) && !hasInvalidAncestor(el); // http://www.w3.org/TR/SVG/struct.html#DefsElement
  });
  if (!elements || (elements && !elements.length)) {
    return {
      ...createEmptyResponse(),
      options,
      allElements: descendants,
    };
  }
  const localClipPaths: Record<string, Element[]> = {};
  descendants
    .filter((el) => getTagName(el) === 'clipPath')
    .forEach((el) => {
      el.setAttribute('originalTransform', el.getAttribute('transform') || '');
      const id = el.getAttribute('id')!;
      localClipPaths[id] = Array.from(el.getElementsByTagName('*')).filter(
        (el) => isValidSvgTag(el)
      );
    });

  // Precedence of rules:   style > class > attribute
  const elementParser = new ElementsParser(
    elements,
    options,
    reviver,
    doc,
    localClipPaths
  );

  const instances = await elementParser.parse();

  // Assign all the parents of instances
  for (var i = 0; i < elements.length; i++) {
    if ((elements[i].parentNode as Element) != undefined) {
      const parentIndex = elements.indexOf(elements[i].parentNode as Element);
      if (
        (instances as Array<FabricObject | null>) != undefined &&
        (instances[i] as FabricObject) != undefined
      ) {
        instances[i]!.parentFabricObject = instances[parentIndex];
      }
    }
  }

  // Animate all the parents of AnimateElements
  for (var inst of instances) {
    if (
      (inst as AnimateElement) != undefined &&
      (inst?.parentFabricObject as AnimatableObject) != undefined
    ) {
      const animEl = inst as AnimateElement;
      const parent = animEl.parentFabricObject as AnimatableObject;
      const attr = animEl.attributeName;
      if (!attr) {
        break;
      }
      // Convert strings to the values that fabric expects
      const normalizedValues = animEl.values.map((val: any) => {
        var ret: any = parseFloat(val);
        if (!isNaN(ret)) {
          return ret as number;
        }
        const asRecord: Record<string, any> = { [attr]: val };
        ret = setStrokeFillOpacity(asRecord);
        return ret[attr];
      });
      if (normalizedValues.length > 1) {
        parent.set(attr, normalizedValues[0]);

        function callback(valuesIndex: number, repeatCount: string | number) {
          var nextRepeatCount = repeatCount;
          if (valuesIndex >= normalizedValues.length) {
            nextRepeatCount =
              repeatCount === 'indefinite'
                ? repeatCount
                : (repeatCount as number) - 1;
            if (nextRepeatCount === 0) {
              return;
            }
            parent.set(attr, normalizedValues[0]);
            valuesIndex = 1;
          }

          const animRecord: Record<string, any> = {
            [attr]: normalizedValues[valuesIndex],
          };
          parent.animate(animRecord, {
            duration: (animEl.dur * 1000) / (normalizedValues.length - 1),
            onChange: (v: any) => {
              if (parent.canvas) {
                parent.canvas.requestRenderAll();
              }
            },
            onComplete: () => callback(valuesIndex + 1, nextRepeatCount),
            easing: easeNone,
          });
        }
        callback(1, animEl.repeatCount);
      }
    }
  }

  return {
    objects: instances,
    elements,
    options,
    allElements: descendants,
  };
}
