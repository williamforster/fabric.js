import { Path } from '../shapes/Path';
import { loadSVGFromString } from './loadSVGFromString';
import { AnimateElement } from '../shapes/Object/AnimateElement';
import { runningAnimations } from '../util/animation/AnimationRegistry';

describe('loadSVGFromString', () => {
  it('returns successful parse of svg with use tag containing bad reference', async () => {
    // in this case, ignore bad use but still load rest of svg
    const str = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect width="10" height="10" />
      <use href="#missing" x="50" y="50" ></use>
      </svg>`;

    const parsedSvg = await loadSVGFromString(str);
    expect(parsedSvg.objects[0]).not.toBeNull();
    if (parsedSvg.objects[0] !== null) {
      expect(parsedSvg.objects[0].isType('Rect')).toBe(true);
    }
  });

  it('returns successful parse of svg with use tag containing bad clip-path', async () => {
    // in this case, load svg but ignore clip-path attribute in <use>
    const str = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
      <path id="heart" d="M10,30 A20,20,0,0,1,50,30 A20,20,0,0,1,90,30 Q90,60,50,90 Q10,60,10,30 Z" />
      </defs>
      <use clip-path="url(#myClip)" href="#heart" fill="red" />
      </svg>`;
    // need to load Path here for it to populate in class registry; loadSvgFromString does not
    // import Path so we'd fail the test without this.
    const unused = Path.name;

    const parsedSvg = await loadSVGFromString(str);
    if (parsedSvg.objects[0] !== null) {
      expect(parsedSvg.objects[0].isType('Path')).toBe(true);
    }
  });

  it('returns successful parse of svg with animate element', async () => {
    const str = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect width="10" height="10">
        <animate attributeName="x" values="0;10" dur="1"/>
      </rect>
      </svg>`;
    // need to load AnimateElement here for it to populate in class registry;
    const unused = AnimateElement.name;
    const parsedSvg = await loadSVGFromString(str);
    expect(parsedSvg.objects[1]).not.toBeNull();
    if (parsedSvg.objects[1] !== null) {
      expect(parsedSvg.objects[1].isType('AnimateElement')).toBe(true);
    }
    runningAnimations.cancelAll();
  });

  it('parses the transform and transform-origin attribute into fabrics attributes', async () => {
    const str = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <rect width="10" height="10" transform-origin="10 20" transform="rotate(45)">
      </rect>
      <rect width="10" height="10" transform-origin="0,20" transform="rotate(45)">
      </rect>
      </svg>`;
    const parsedSvg = await loadSVGFromString(str);
    expect(parsedSvg.objects[0]!.originX).toBe(10);
    expect(parsedSvg.objects[0]!.originY).toBe(20);
    expect(parsedSvg.objects[0]!.angle).toBe(45);
    expect(parsedSvg.objects[1]!.originX).toBe(0);
    expect(parsedSvg.objects[1]!.originY).toBe(20);
  });
});

// jest.useFakeTimers();
// describe('animated svg from string tests', () => {
//   const animatedSvgString01 = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
//       <rect width="10" height="10" fill="aliceblue">
//         <animate attributeName="fill" from="hsla(180, 50%, 50%, 0.5)" to="hsla(0, 50%, 50%, 1)" dur="1"/>
//       </rect>
//       </svg>`;
//   const animatedSvgString02 = `<svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
//       <rect width="10" height="10" fill="aliceblue">
//         <animate attributeName="width" values="10;50" dur="2"/>
//       </rect>
//       </svg>`;

//   afterEach(() => {
//     // 'runningAnimations should be empty at the end of a test'
//     expect(runningAnimations.length).toBe(0);
//     runningAnimations.cancelAll();
//     jest.runAllTimers();
//   });
//   it('animates a shapes width from 10 to 50 over 2 seconds', async () => {
//     const svg = await loadSVGFromString(animatedSvgString02);
//     jest.advanceTimersByTime(500);
//     expect(svg.objects[0]!.width).toBeCloseTo(20, 1);
//     jest.clearAllTimers();
//     runningAnimations.cancelAll();
//   });
//   // it('animates a color in a fill', async () => {
//   //   const svg = await loadSVGFromString(animatedSvgString01);
//   //   jest.advanceTimersByTime(500);

//   //   // const defaultColorEasing: TEasingFunction = (
//   //   //   timeElapsed,
//   //   //   startValue,
//   //   //   byValue,
//   //   //   duration
//   //   // ) => {
//   //   //   const durationProgress = 1 - Math.cos((timeElapsed / duration) * halfPI);
//   //   //   return startValue + byValue * durationProgress;
//   //   // };
//   //   console.log(runningAnimations);
//   //   const durationProgress = 1 - Math.cos((500 / 1000) * halfPI);
//   //   const r = Math.round(64 + 127 * durationProgress);
//   //   const gb = Math.round(191 + -127 * durationProgress);
//   //   const a = 0.5 + 1.0 * durationProgress;
//   //   const resultColor = new Color(svg.objects[0]!.fill as string);
//   //   expect(resultColor.getSource()[0]).toBeCloseTo(r);
//   //   expect(resultColor.getSource()[1]).toBeCloseTo(gb);
//   //   expect(resultColor.getSource()[2]).toBeCloseTo(gb);
//   //   expect(resultColor.getSource()[3]).toBeCloseTo(a);
//   //   jest.advanceTimersByTime(510);
//   // });
// });
