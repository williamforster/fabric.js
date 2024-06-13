import { TMat2D } from '../../typedefs';
import { AnimationBase } from './AnimationBase';
import { iMatrix } from '../../constants';
import { TQrDecomposeOut, qrDecompose, composeMatrix, decomposedIdentity, TComposeMatrixArgs } from '../misc/matrix';
import { TransformAnimationOptions } from './types';

export class TransformAnimation extends AnimationBase<TMat2D> {
  constructor({
    startValue = iMatrix,
    endValue = [2, 0, 0, 2, 0, 0] as TMat2D,
    ...otherOptions
  } : TransformAnimationOptions) {
    super({
      ...otherOptions,
      startValue,
      byValue: TransformAnimation.getByValue(startValue, endValue),
    });
  }

  private static getByValue(from: TMat2D, to: TMat2D) : TQrDecomposeOut {
    const fromDecomp = qrDecompose(from);
    const toDecomp = qrDecompose(to);
    var ret = decomposedIdentity();
    let key : keyof typeof toDecomp;
    for (key in toDecomp) {
        if (toDecomp[key] as number !== undefined && fromDecomp[key] !== undefined) {
            ret[key] = (toDecomp[key] as number) - (fromDecomp[key] as number);
        }
    }
    return ret;
  }

  protected calculate(timeElapsed: number) {
    const fractionDuration = timeElapsed / this.duration;

    let key : keyof TQrDecomposeOut;
    var decomposedValues = decomposedIdentity();
    const startValues = qrDecompose(this.startValue);
    var index = 0;
    for (key in startValues) {
        if (this.byValue[key] as number !== undefined && startValues[key] as number !== undefined) {
            decomposedValues[key] = this.easing(
                timeElapsed,
                startValues[key],
                this.byValue[key],
                this.duration,
            );
        }
    }
    const ret = composeMatrix(decomposedValues as TComposeMatrixArgs);
    return {
        value: ret,
        valueProgress: 0,
    };
  }
}
