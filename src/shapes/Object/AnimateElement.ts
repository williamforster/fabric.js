/**
 * A class that represents an svg <animate> element, however
 * actual animation is done by a FabicObject.animate function
 * This just helps with parsing svgs
 */
import type { ObjectEvents } from '../../EventTypeDefs';
import { classRegistry } from '../../ClassRegistry';
import { FabricObject, cacheProperties } from './FabricObject';
import { parseAttributes } from '../../parser/parseAttributes';
import type { Abortable, TClassProperties, TOptions } from '../../typedefs';
import type { FabricObjectProps, SerializedObjectProps } from './types';
import type { CSSRules } from '../../parser/typedefs';
import { AnimatableObject } from './AnimatableObject';


interface UniqueAnimateProps {
    /**
     * Attribute to animate eg. 'cx' for circle x-position
     * @type String
     * @default '''
     */
    attributeName: string;
  
    /**
     * List of space/semicolon separated numbers or strings describing what values to animate
     * attributeName by. Could be for example 0;10 or hsl(0,1%,90%),hsl(0,0,0)
     * @type string[]
     * @default ''
     */
    values: string[];
  
    /**
     * For a simple 2-value animation, where to start the animation. Overriden by 'values' tag
     * @type Any
     * @default 0
     */
    from: any;
  
    /**
     * For a simple 2-value animation, where to end the animation. Overriden by 'values' tag
     * @type Any
     * @default 0
     */
    to: any;

    /**
     * Duration of the animation in seconds
     * @type Number
     * @default 1
     */
    dur: number;
  }

  export interface SerializedAnimateProps
  extends SerializedObjectProps,
    UniqueAnimateProps {}

  export interface AnimateProps extends FabricObjectProps, UniqueAnimateProps {}

  const ANIMATE_PROPS = [
    'attributeName',
    'values',
    'from',
    'to',
    'dur',
  ] as const;

  export const animateDefaultValues: Partial<TClassProperties<AnimateElement>> = {
    attributeName: '',
    values: [],
    from: 0,
    to: 0,
    dur: 0,
  };

  export class AnimateElement<
    Props extends TOptions<AnimateProps> = Partial<AnimateProps>,
    SProps extends SerializedAnimateProps = SerializedAnimateProps,
    EventSpec extends ObjectEvents = ObjectEvents
  >
  extends FabricObject<Props, SProps, EventSpec>
  implements UniqueAnimateProps
{
  declare attributeName: string;
  declare values: string[];
  declare from: number;
  declare to: any;
  declare dur: any;

  static type = 'AnimateElement';

  static cacheProperties = [...cacheProperties, ...ANIMATE_PROPS];

  static ownDefaults = animateDefaultValues;

  static getDefaults(): Record<string, any> {
    return {
      ...super.getDefaults(),
      ...AnimateElement.ownDefaults,
    };
  }

  /**
   * @private
   * @param {String} key
   * @param {*} value
   */
  _set(key: string, value: any) {
    super._set(key, value);

    return this;
  }

  /**
   * @private
   * @param {CanvasRenderingContext2D} ctx context to render on
   */
  _render(ctx: CanvasRenderingContext2D) {
    /*ctx.beginPath();
    ctx.arc(
      0,
      0,
      this.radius,
      degreesToRadians(this.startAngle),
      degreesToRadians(this.endAngle),
      this.counterClockwise
    );
    this._renderPaintInOrder(ctx);*/
  }


  /**
   * Returns object representation of an instance
   * @param {Array} [propertiesToInclude] Any properties that you might want to additionally include in the output
   * @return {Object} object representation of an instance
   */
  toObject<
    T extends Omit<Props & TClassProperties<this>, keyof SProps>,
    K extends keyof T = never
  >(propertiesToInclude: K[] = []): Pick<T, K> & SProps {
    return super.toObject([...ANIMATE_PROPS, ...propertiesToInclude]);
  }

  /* _TO_SVG_START_ */

  /**
   * Returns svg representation of an instance
   * @return {Array} an array of strings with the specific svg representation
   * of the instance
   *//*
  _toSVG(): string[] {
    const angle = (this.endAngle - this.startAngle) % 360;

    if (angle === 0) {
      return [
        '<circle ',
        'COMMON_PARTS',
        'cx="0" cy="0" ',
        'r="',
        `${this.radius}`,
        '" />\n',
      ];
    } else {
      const { radius } = this;
      const start = degreesToRadians(this.startAngle),
        end = degreesToRadians(this.endAngle),
        startX = cos(start) * radius,
        startY = sin(start) * radius,
        endX = cos(end) * radius,
        endY = sin(end) * radius,
        largeFlag = angle > 180 ? 1 : 0,
        sweepFlag = this.counterClockwise ? 0 : 1;
      return [
        `<path d="M ${startX} ${startY} A ${radius} ${radius} 0 ${largeFlag} ${sweepFlag} ${endX} ${endY}" `,
        'COMMON_PARTS',
        ' />\n',
      ];
    }
  }*/
  /* _TO_SVG_END_ */

  /* _FROM_SVG_START_ */
  /**
   * List of attribute names to account for when parsing SVG element (used by {@link AnimateElement.fromElement})
   * @static
   * @memberOf Circle
   * @see: http://www.w3.org/TR/SVG/shapes.html#CircleElement
   */
  static ATTRIBUTE_NAMES = [...ANIMATE_PROPS];

  /**
   * Returns {@link AnimateElement} instance from an SVG element
   * @static
   * @memberOf AnimateElement
   * @param {HTMLElement} element Element to parse
   * @param {Object} [options] Partial Circle object to default missing properties on the element.
   * @throws {Error} If value of `r` attribute is missing or invalid
   */
  static async fromElement(
    element: HTMLElement,
    options: Abortable,
    cssRules?: CSSRules
  ): Promise<AnimateElement> {
    const {
        attributeName='',
        values=[],
        dur=0,
        from=0,
        to=0,
      ...otherParsedAttributes
    } = parseAttributes(
      element,
      this.ATTRIBUTE_NAMES,
      cssRules
    ) as Partial<AnimateProps>;

    const ret = new this({
        ...otherParsedAttributes,
        attributeName,
        values,
        dur,
        from,
        to,
    });

    return ret;
  }

  /* _FROM_SVG_END_ */

  /**
   * @todo how do we declare this??
   */
  static fromObject<T extends TOptions<SerializedAnimateProps>>(object: T) {
    return super._fromObject<AnimateElement>(object);
  }
}

classRegistry.setClass(AnimateElement);
classRegistry.setSVGClass(AnimateElement, 'animate');
