import { ActiveWord, WordMeta } from './word-cloud.component';
import { WordCloudQuadTree } from './word-cloud-quad-tree';

export interface CloudDrawFuncType<T extends WordMeta> {
  neighbours: [
    top: ActiveWord<T, CloudDrawFuncType<T>>,
    bottom: ActiveWord<T, CloudDrawFuncType<T>>,
    right: ActiveWord<T, CloudDrawFuncType<T>>,
    left: ActiveWord<T, CloudDrawFuncType<T>>
  ];
  distanceToOriginSquared: number;
  separatingAxisTheorem: {
    normalX: Vec2;
    normalY: Vec2;
  };
}

export type Vec2 = [x: number, y: number];
type TRanges = [low: number, high: number][];

interface CollideArguments {
  elemNormalX: Vec2;
  elemNormalY: Vec2;
  currentXMin: number;
  currentXMax: number;
  currentYMin: number;
  currentYMax: number;
  currentTGradientX: number;
  currentTGradientY: number;
  tRanges: TRanges;
}

interface AccumulationResult {
  bestPos: Vec2;
  bestDistSquared: number;
  currentIndex: [elemIndex: number, neighbourIndex: number];
}

interface PrepareCollideArguments {
  // collision element props
  tDirection: Vec2;
  normalDirection: Vec2;
  origin: Vec2;
  // new element props for collision
  tElemValue: number;
  midElemValue: number;
  // new element props
  elemNormalX: Vec2;
  elemNormalY: Vec2;
  elemOffDirX: Vec2;
  elemOffDirY: Vec2;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  elemMinX: number;
  elemMaxX: number;
  elemMinY: number;
  elemMaxY: number;
}

export class WordCloudDrawFunctions {

  static calculateCloud<T extends WordMeta>(elements: ActiveWord<T>[], parentWidth: number, parentHeight: number, minHeight: number) {
    const currentElements = [] as ActiveWord<T>[];
    const aspectSquared = Math.pow(parentHeight / parentWidth, 2);
    const width = parentWidth * 2;
    const height = parentHeight * 2;
    const capacity = 4;
    const quadTree = new WordCloudQuadTree<T, CloudDrawFuncType<T>>(-parentWidth, -parentWidth, width, height, {
      capacity,
      maxDepth: Math.round(Math.log2(Math.min(width, height) * capacity / minHeight))
    });
    elements.forEach((word) => {
      if (this.findPlaceInCloud(quadTree, currentElements, word, aspectSquared)) {
        word.visible = true;
        currentElements.push(word);
        return;
      }
      word.visible = false;
    });
    currentElements.forEach(e => {
      e.buildInformation.origin[0] -= e.buildInformation.position.width / 2;
      e.buildInformation.origin[1] -= e.buildInformation.position.height / 2;
    });
  }

  static calculateGridStructure<T extends WordMeta>(elements: ActiveWord<T>[], parentWidth: number, parentHeight: number) {
    const fullwidth = parentWidth * 2;
    let lines = 1;
    let counter = 0;
    const drawIndices = [];
    let heightAcc = 0;
    let maxHeight = 0;
    for (let i = 0, lastIndex = 0; i < elements.length; i++) {
      const word = elements[i];
      const { width, height } = word.buildInformation.position;
      maxHeight = Math.max(maxHeight, height);
      if (i > lastIndex && counter + width > fullwidth) {
        lastIndex = i;
        ++lines;
        heightAcc += maxHeight;
        drawIndices.push([i, counter, maxHeight]);
        maxHeight = 0;
        counter = width;
      } else {
        counter += width;
      }
    }
    drawIndices.push([elements.length, counter, maxHeight]);
    const fullheight = parentHeight * 2;
    const ySpace = (fullheight - heightAcc) / (lines + 1);
    let lastElemIndex = drawIndices[0][0];
    let xSpace = (fullwidth - drawIndices[0][1]) / (lastElemIndex + 1);
    let xOffset = xSpace;
    for (let i = 0, yOffset = ySpace; i < elements.length; i++, xOffset += xSpace) {
      if (i === lastElemIndex) {
        drawIndices.shift();
        xSpace = (fullwidth - drawIndices[0][1]) / (drawIndices[0][0] - lastElemIndex + 1);
        xOffset = xSpace;
        lastElemIndex = drawIndices[0][0];
        yOffset += ySpace;
      }
      const info = elements[i].buildInformation;
      const { height } = info.position;
      info.origin = [
        -parentWidth + xOffset,
        -parentHeight + yOffset + height / 2
      ];
    }
  }


  private static findPlaceInCloud<T extends WordMeta>(
    quadTree: WordCloudQuadTree<T, CloudDrawFuncType<T>>,
    elements: ActiveWord<T, CloudDrawFuncType<T>>[],
    newElement: ActiveWord<T, CloudDrawFuncType<T>>,
    aspectSquared: number,
  ): boolean {
    const {
      width: elemWidth,
      height: elemHeight,
      normalizedVerticalLine,
      offsetHorizontalLine: elemOffDirX,
      normalizedHorizontalLine,
      offsetVerticalLine: elemOffDirY,
    } = newElement.buildInformation.position;
    const elemWidthHalf = elemWidth / 2;
    const elemHeightHalf = elemHeight / 2;
    const normalX = this.mult(normalizedVerticalLine, -1);
    const normalY = normalizedHorizontalLine;
    newElement.buildInformation.additional = {
      neighbours: [null, null, null, null],
      distanceToOriginSquared: null,
      separatingAxisTheorem: {
        normalX,
        normalY,
      },
    };
    const elemMinX = Math.min(elemOffDirX[0], -elemOffDirX[0], elemOffDirY[0], -elemOffDirY[0]);
    const elemMaxX = Math.max(elemOffDirX[0], -elemOffDirX[0], elemOffDirY[0], -elemOffDirY[0]);
    const elemMinY = Math.min(elemOffDirX[1], -elemOffDirX[1], elemOffDirY[1], -elemOffDirY[1]);
    const elemMaxY = Math.max(elemOffDirX[1], -elemOffDirX[1], elemOffDirY[1], -elemOffDirY[1]);
    if (quadTree.isEmpty()) {
      newElement.buildInformation.origin = [0, 0];
      newElement.buildInformation.additional.distanceToOriginSquared = 0;
      quadTree.insertElement(newElement, {
        xMin: elemMinX,
        xMax: elemMaxX,
        yMin: elemMinY,
        yMax: elemMaxY,
      });
      return true;
    }
    // SAT to base axis (1, 0) and (0, 1)
    const prepare: PrepareCollideArguments = {
      tDirection: null,
      normalDirection: null,
      origin: null,
      tElemValue: null,
      midElemValue: null,
      elemNormalX: normalX,
      elemNormalY: normalY,
      elemOffDirX,
      elemOffDirY,
      elemMinX,
      elemMaxX,
      elemMinY,
      elemMaxY,
      // reversed order of axis, because normal projection (90°)
      xMin: -elemHeightHalf,
      yMin: -elemWidthHalf,
      xMax: elemHeightHalf,
      yMax: elemWidthHalf,
    };
    const acc: AccumulationResult = {
      bestPos: null,
      bestDistSquared: null,
      currentIndex: null,
    };
    // TO-DO: Check place
    /*
    Constraint:
      - not closer than last element weight class
      - no comparisons between more than one weight class lower
     */
    let lastLowerWeightClass = null;
    for (let i = elements.length - 1; i >= 0; --i) {
      if (elements[i].weightClass < newElement.weightClass) {
        if (lastLowerWeightClass === null) {
          lastLowerWeightClass = elements[i].weightClass;
        } else if (lastLowerWeightClass > elements[i].weightClass) {
          // Not more than one lower weight class, since it could be inside the wrong "ring"
          // Update to rotation based?
          break;
        }
      }
      this.checkElementSides(elements[i], i, quadTree, prepare, acc, aspectSquared);
    }
    if (acc.bestDistSquared === null) {
      return false;
    }
    newElement.buildInformation.origin = acc.bestPos;
    newElement.buildInformation.additional.distanceToOriginSquared = acc.bestDistSquared;
    quadTree.insertElement(newElement, {
      xMin: acc.bestPos[0] + prepare.elemMinX,
      xMax: acc.bestPos[0] + prepare.elemMaxX,
      yMin: acc.bestPos[1] + prepare.elemMinY,
      yMax: acc.bestPos[1] + prepare.elemMaxY,
    });
    elements[acc.currentIndex[0]].buildInformation.additional.neighbours[acc.currentIndex[1]] = newElement;
    return true;
  }

  private static dot(vec1: Vec2, vec2: Vec2): number {
    return vec1[0] * vec2[0] + vec1[1] * vec2[1];
  }

  private static mult(vec: Vec2, factor: number): Vec2 {
    return [vec[0] * factor, vec[1] * factor] as Vec2;
  }

  private static add(vec1: Vec2, vec2: Vec2) {
    return [vec1[0] + vec2[0], vec1[1] + vec2[1]] as Vec2;
  }

  private static sub(vec1: Vec2, vec2: Vec2) {
    return [vec1[0] - vec2[0], vec1[1] - vec2[1]] as Vec2;
  }

  private static checkElementSides<T extends WordMeta>(
    element: ActiveWord<T, CloudDrawFuncType<T>>,
    index: number,
    quadTree: WordCloudQuadTree<T, CloudDrawFuncType<T>>,
    prepare: PrepareCollideArguments,
    acc: AccumulationResult,
    aspectSquared: number,
  ) {
    const checkBetter = (elemIndex: number, neighbourIndex: number, orig: Vec2) => {
      if (orig === null) {
        return;
      }
      const size = orig[0] * orig[0] * aspectSquared + orig[1] * orig[1];
      if (acc.bestDistSquared === null || size < acc.bestDistSquared) {
        acc.bestPos = orig;
        acc.bestDistSquared = size;
        acc.currentIndex = [elemIndex, neighbourIndex];
      }
    };
    const { additional, origin, position } = element.buildInformation;
    const { normalX, normalY } = additional.separatingAxisTheorem;
    const currentElementWidthHalf = position.width / 2;
    const currentElementHeightHalf = position.height / 2;
    if (additional.neighbours[0] === null) {
      prepare.tDirection = normalY;
      prepare.normalDirection = normalX;
      prepare.origin = origin;
      prepare.midElemValue = currentElementHeightHalf;
      prepare.tElemValue = currentElementWidthHalf;
      checkBetter(index, 0, this.prepareCollisionFromElement(quadTree, prepare));
    }
    if (additional.neighbours[1] === null) {
      prepare.tDirection = this.mult(normalX, -1);
      prepare.normalDirection = normalY;
      prepare.origin = origin;
      prepare.midElemValue = currentElementWidthHalf;
      prepare.tElemValue = currentElementHeightHalf;
      checkBetter(index, 1, this.prepareCollisionFromElement(quadTree, prepare));
    }
    if (additional.neighbours[2] === null) {
      prepare.tDirection = this.mult(normalY, -1);
      prepare.normalDirection = this.mult(normalX, -1);
      prepare.origin = origin;
      prepare.midElemValue = currentElementHeightHalf;
      prepare.tElemValue = currentElementWidthHalf;
      checkBetter(index, 2, this.prepareCollisionFromElement(quadTree, prepare));
    }
    if (additional.neighbours[3] === null) {
      prepare.tDirection = normalX;
      prepare.normalDirection = this.mult(normalY, -1);
      prepare.origin = origin;
      prepare.midElemValue = currentElementWidthHalf;
      prepare.tElemValue = currentElementHeightHalf;
      checkBetter(index, 3, this.prepareCollisionFromElement(quadTree, prepare));
    }
  }

  private static prepareCollisionFromElement<T extends WordMeta>(
    quadTree: WordCloudQuadTree<T, CloudDrawFuncType<T>>,
    args: PrepareCollideArguments,
  ) {
    const addT = Math.max(Math.abs(this.dot(args.tDirection, args.elemOffDirX)),
      Math.abs(this.dot(args.tDirection, args.elemOffDirY)));
    const midAdd = Math.max(Math.abs(this.dot(args.normalDirection, args.elemOffDirX)),
      Math.abs(this.dot(args.normalDirection, args.elemOffDirY)));
    const elemOrigin = this.add(this.mult(args.normalDirection, midAdd + args.midElemValue), args.origin);
    const halfT = args.tElemValue + addT;
    const optimalTPosition = this.calculateOptimalTPosition(elemOrigin, args.tDirection, args.normalDirection);
    const tRanges: TRanges = [[-halfT, halfT]];
    // SAT to base axis (1, 0) and (0, 1)
    const x = args.tDirection[0];
    const y = args.tDirection[1];
    const quadTreeSAT = {
      xMin: elemOrigin[0] + args.elemMinX + Math.min(tRanges[0][0] * x, tRanges[0][1] * x),
      xMax: elemOrigin[0] + args.elemMaxX + Math.max(tRanges[0][0] * x, tRanges[0][1] * x),
      yMin: elemOrigin[1] + args.elemMinY + Math.min(tRanges[0][0] * y, tRanges[0][1] * y),
      yMax: elemOrigin[1] + args.elemMaxY + Math.max(tRanges[0][0] * y, tRanges[0][1] * y),
    };
    // TO-DO: Check Height limits, create range with optimalTPosition and subtract with filterTRanges
    const baseOffsetX = this.dot(elemOrigin, args.elemNormalX);
    const baseOffsetY = this.dot(elemOrigin, args.elemNormalY);
    const options: CollideArguments = {
      tRanges,
      currentXMin: args.xMin + baseOffsetX,
      currentXMax: args.xMax + baseOffsetX,
      currentYMin: args.yMin + baseOffsetY,
      currentYMax: args.yMax + baseOffsetY,
      elemNormalX: args.elemNormalX,
      elemNormalY: args.elemNormalY,
      currentTGradientX: this.dot(args.tDirection, args.elemNormalX),
      currentTGradientY: this.dot(args.tDirection, args.elemNormalY),
    };
    // start colliding
    quadTree.collideSAT(quadTreeSAT, (possibleCollisions) => {
      for (const coll of possibleCollisions) {
        this.collide(coll.buildInformation, options);
        if (options.tRanges.length === 0) {
          return true;
        }
      }
      return false;
    });
    const returnValue = this.getBestTValue(options.tRanges, optimalTPosition);
    return returnValue === null ? null : this.add(elemOrigin, this.mult(args.tDirection, returnValue));
  }

  private static getBestTValue(tRanges: TRanges, optimalValue: number): number {
    if (tRanges.length === 0) {
      return null;
    }
    let best = tRanges[0][0];
    let dist = Math.abs(optimalValue - best);
    for (const range of tRanges) {
      let currentDist = Math.abs(optimalValue - range[0]);
      if (optimalValue < range[0]) {
        if (currentDist < dist) {
          best = range[0];
          dist = currentDist;
        }
        continue;
      }
      currentDist = Math.abs(optimalValue - range[1]);
      if (optimalValue > range[1]) {
        if (currentDist < dist) {
          best = range[1];
          dist = currentDist;
        }
        continue;
      }
      return optimalValue;
    }
    return best;
  }

  private static calculateOptimalTPosition(origin: Vec2, tDir: Vec2, gDir: Vec2) {
    if (Math.abs(tDir[0]) > Number.EPSILON) {
      return (gDir[0] - origin[0]) / tDir[0];
    }
    return (gDir[1] - origin[1]) / tDir[1];
  }

  private static collide<T extends WordMeta>(
    build: ActiveWord<T, CloudDrawFuncType<T>>['buildInformation'],
    options: CollideArguments,
  ) {
    const collOffV = build.position.offsetVerticalLine;
    const collOffH = build.position.offsetHorizontalLine;
    const origin = build.origin;
    const mappings = [
      this.add(origin, collOffV), this.sub(origin, collOffV), this.add(origin, collOffH), this.sub(origin, collOffH)
    ];
    const rangeX = this.collideSATRange(
      mappings, options.elemNormalX, options.currentXMin, options.currentXMax, options.currentTGradientX,
    );
    if (rangeX === false) {
      return;
    }
    const rangeY = this.collideSATRange(
      mappings, options.elemNormalY, options.currentYMin, options.currentYMax, options.currentTGradientY,
    );
    if (rangeY === false) {
      return;
    }
    if (rangeX === true) {
      if (rangeY === true) {
        // Always collides, no t possible
        options.tRanges.length = 0;
        return;
      }
      this.filterTRanges(options, rangeY as [number, number]);
      return;
    }
    if (rangeY === true) {
      this.filterTRanges(options, rangeX as [number, number]);
      return;
    }
    const min = Math.max(rangeY[0], rangeX[0]);
    const max = Math.min(rangeY[1], rangeX[1]);
    if (max - min < Number.EPSILON) {
      return;
    }
    this.filterTRanges(options, [min, max]);
  }

  private static filterTRanges(options: CollideArguments, currentTRange: TRanges[number]) {
    const newTRanges = [];
    options.tRanges.forEach(range => {
      if (range[0] >= currentTRange[1] || range[1] <= currentTRange[0]) {
        newTRanges.push(range);
        return;
      }
      const leftBoundaryDiff = currentTRange[0] - range[0];
      const rightBoundaryDiff = range[1] - currentTRange[1];
      if (leftBoundaryDiff > 0) {
        newTRanges.push([range[0], currentTRange[0]]);
      }
      if (rightBoundaryDiff > 0) {
        newTRanges.push([currentTRange[1], range[1]]);
      }
    });
    options.tRanges = newTRanges;
  }

  private static collideSATRange(points: Vec2[], normal: Vec2, min: number, max: number, tGradient: number) {
    const point1 = this.dot(normal, points[0]);
    const point2 = this.dot(normal, points[1]);
    const point3 = this.dot(normal, points[2]);
    const point4 = this.dot(normal, points[3]);
    const cMin = Math.min(point1, point2, point3, point4);
    const cMax = Math.max(point1, point2, point3, point4);
    let tmin = cMin - max;
    let tmax = cMax - min;
    if (Math.abs(tGradient) <= Number.EPSILON) {
      // return if it collides
      return tmin < 0 && tmax > 0;
    }
    tmin /= tGradient;
    tmax /= tGradient;
    if (tGradient > 0) {
      const temp = tmin;
      tmin = tmax;
      tmax = temp;
    }
    return [tmax, tmin];
  }
}
