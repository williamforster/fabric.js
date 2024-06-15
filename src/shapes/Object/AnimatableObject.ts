import { TMat2D } from '../../typedefs';
import type { TColorArg } from '../../color/typedefs';
import type { ObjectEvents } from '../../EventTypeDefs';
import type { TAnimation } from '../../util/animation/animate';
import { animate, animateColor, animateTransform } from '../../util/animation/animate';
import type {
  AnimationOptions,
  ArrayAnimationOptions,
  ColorAnimationOptions,
  ValueAnimationOptions,
  TransformAnimationOptions,
} from '../../util/animation/types';
import { StackedObject } from './StackedObject';
import { FabricObject } from './FabricObject';
import { applyTransformToObject } from '../../util/misc/objectTransforms';

export abstract class AnimatableObject<
  EventSpec extends ObjectEvents = ObjectEvents
> extends StackedObject<EventSpec> {
  /**
   * List of properties to consider for animating colors.
   * @type String[]
   */
  static colorProperties: string[] = ['fill', 'stroke', 'backgroundColor'];

  /**
   * Animates object's properties
   * @param {Record<string, number | number[] | TColorArg>} animatable map of keys and end values
   * @param {Partial<AnimationOptions<T>>} options
   * @tutorial {@link http://fabricjs.com/fabric-intro-part-2#animation}
   * @return {Record<string, TAnimation<T>>} map of animation contexts
   *
   * As object — multiple properties
   *
   * object.animate({ left: ..., top: ... });
   * object.animate({ left: ..., top: ... }, { duration: ... });
   */
  animate<T extends number | number[] | TColorArg | TMat2D>(
    animatable: Record<string, T>,
    options?: Partial<AnimationOptions<T>>
  ): Record<string, TAnimation<T>> {
    return Object.entries(animatable).reduce((acc, [key, endValue]) => {
      acc[key] = this._animate(key, endValue, options);
      return acc;
    }, {} as Record<string, TAnimation<T>>);
  }

  /**
   * @private
   * @param {String} key Property to animate
   * @param {String} to Value to animate to
   * @param {Object} [options] Options object
   */
  _animate<T extends number | number[] | TColorArg | TMat2D>(
    key: string,
    endValue: T,
    options: Partial<AnimationOptions<T>> = {}
  ): TAnimation<T> {
    const path = key.split('.');
    const propIsColor = (
      this.constructor as typeof AnimatableObject
    ).colorProperties.includes(path[path.length - 1]);
    const propIsTransform = key.toLowerCase() === 'transformmatrix';
    const { abort, startValue, onChange, onComplete } = options;
    const animationOptions = {
      ...options,
      target: this,
      startValue:
        startValue ?? (function(animateObj) {
          if (propIsTransform) {
            return animateObj.calcOwnMatrix();
          }
          return path.reduce((deep: any, key) => deep[key], animateObj)
        })(this),
      endValue,
      abort: abort?.bind(this),
      onChange: (
        value: number | number[] | string | TMat2D,
        valueProgress: number,
        durationProgress: number
      ) => {
        // Set the value for this frame, and call the user onChange
        // key could be keypath like 'shadow.offsetX' or just a property
        if (path.length > 1) {
          path.reduce((accumulator: Record<string, any>, key, index) => {
            if (index === path.length - 1) {
              accumulator[key] = value;
              return null;
            }
            return accumulator[key];
          }, this);
        } else if (key.toLowerCase() === 'transformmatrix') {
          if (this as unknown as FabricObject !== undefined) {
            applyTransformToObject(this as unknown as FabricObject, value as TMat2D);
          }
        } else {
          // For some reason the above doesn't work for single key paths.
          this.set(key, value);
        }
        onChange &&
          // @ts-expect-error generic callback arg0 is wrong
          onChange(value, valueProgress, durationProgress);
      },
      onComplete: (
        value: number | number[] | string | TMat2D,
        valueProgress: number,
        durationProgress: number
      ) => {
        this.setCoords();
        onComplete &&
          // @ts-expect-error generic callback arg0 is wrong
          onComplete(value, valueProgress, durationProgress);
      },
    } as AnimationOptions<T>;

    return (
      propIsColor
        ? animateColor(animationOptions as ColorAnimationOptions)
        : propIsTransform 
        ? animateTransform(animationOptions as TransformAnimationOptions)
        : animate(
            animationOptions as ValueAnimationOptions | ArrayAnimationOptions | TransformAnimationOptions
          )
    ) as TAnimation<T>;
  }
}
