import { calcMinMax, tryPlaceOnFourSides } from './placing-four-sides';
import { AxisAlignedBoundingBox, QuadTree, Vector2 } from './quadtree';

export function isZero(t: f32): bool {
  return Math.abs(t) <= f32.EPSILON;
}

export function pushAt<T>(array: Array<T>, index: i32, element: T): void {
  assert(index <= array.length, 'pushAt should not exceed the array!');
  array.length += 1;
  array.copyWithin(index + 1, index, array.length - 1);
  array[index] = element;
}

export class Range {
  constructor(public readonly start: f32, public readonly end: f32) {
    assert(start <= end, 'Cant create invalid range!');
  }

  collides(other: Range): bool {
    // no equality, touching should not be colliding
    return other.start < this.end && other.end > this.start;
  }

  toString(): string {
    return '[' + this.start.toString() + ',' + this.end.toString() + ']';
  }
}

export const NULL_RANGE = new Range(0, 0);

export class TRangeSet {
  public readonly tRanges: Array<Range> = new Array<Range>();

  constructor(tRangeSize: f32) {
    if (tRangeSize !== 0) {
      this.tRanges.push(new Range(-tRangeSize, tRangeSize));
    }
  }

  clone(): TRangeSet {
    const newRange = new TRangeSet(0);
    for (let i = 0; i < this.tRanges.length; i++) {
      newRange.tRanges.push(this.tRanges[i]);
    }
    return newRange;
  }

  isEmpty(): bool {
    return this.tRanges.length === 0;
  }

  getBestTValue(optimalT: f32): f32 {
    let distance = f32.MAX_VALUE;
    let t = optimalT;
    for (let i = 0; i < this.tRanges.length; i++) {
      const range = this.tRanges[i];
      if (optimalT > range.end) {
        const dist = f32(Math.abs(optimalT - range.end));
        if (dist < distance) {
          distance = dist;
          t = range.end;
        }
      } else if (optimalT < range.start) {
        const dist = f32(Math.abs(optimalT - range.start));
        if (dist < distance) {
          distance = dist;
          t = range.start;
        }
        break; // sorted ascending -> break if before
      } else {
        t = optimalT;
        distance = 0;
        break;
      }
    }
    return t;
  }

  /**
   * @returns the possible range, where it collides
   *
   * returns null if it always collides
   *
   * returns NULL_RANGE if there is never a collision
   */
  mergeTRange(
    staticRange: Range,
    tRange: Range,
    tProjectedOnRange: f32
  ): Range | null {
    if (this.tRanges.length < 1) {
      return null;
    }
    if (isZero(tProjectedOnRange)) {
      return staticRange.collides(tRange) ? null : NULL_RANGE;
    }
    let tmin = (tRange.start - staticRange.end) / -tProjectedOnRange;
    let tmax = (staticRange.start - tRange.end) / tProjectedOnRange;
    if (tmax < tmin) {
      const temp = tmax;
      tmax = tmin;
      tmin = temp;
    }
    if (
      tmax <= this.tRanges[0].start ||
      tmin >= this.tRanges[this.tRanges.length - 1].end
    ) {
      return NULL_RANGE;
    }
    return new Range(tmin, tmax);
  }

  splitByRange(start: f32, end: f32): void {
    for (let i = this.tRanges.length - 1; i >= 0; i--) {
      const currentRange = this.tRanges[i];
      if (start <= currentRange.start) {
        if (end >= currentRange.end) {
          this.tRanges.splice(i, 1);
        } else if (end > currentRange.start) {
          this.tRanges[i] = new Range(end, currentRange.end);
        }
        continue;
      }
      // From here: No more collisions possible, always break
      if (start >= currentRange.end) {
        break;
      }
      if (end < currentRange.end) {
        pushAt(this.tRanges, i + 1, new Range(end, currentRange.end));
      }

      this.tRanges[i] = new Range(currentRange.start, start);
      break;
    }
  }
}

class SideAccessInformation {
  constructor(
    public readonly sideNormal: Vector2,
    public readonly perpendicularNormal: Vector2,
    public readonly sideOffset: Vector2,
    public readonly distToMid: f32,
    public readonly otherDirMidDist: f32
  ) {}
}

const DEG_TO_RAD = Math.PI / 180;

class PreparedBuildInformation {
  // topLeft, rightTop, bottomRight, leftBottom
  public readonly sides: StaticArray<SideAccessInformation> =
    new StaticArray<SideAccessInformation>(4);
  public readonly normal1: Vector2;
  public readonly normal2: Vector2;

  constructor(width: f32, height: f32, rotation: f32) {
    width /= 2;
    height /= 2;
    const cos = f32(Math.cos(rotation * DEG_TO_RAD));
    const sin = f32(Math.sin(rotation * DEG_TO_RAD));
    const normalUp = new Vector2(-sin, cos);
    const normalRight = new Vector2(cos, sin);
    this.normal1 = normalUp;
    this.normal2 = normalRight;
    this.sides[0] = new SideAccessInformation(
      normalUp.clone(),
      normalRight.clone().scale(-1),
      normalUp.clone().scale(height).add(normalRight.clone().scale(-width)),
      height,
      width
    );
    this.sides[1] = new SideAccessInformation(
      normalRight.clone(),
      normalUp.clone(),
      normalRight.clone().scale(width).add(normalUp.clone().scale(height)),
      width,
      height
    );
    this.sides[2] = new SideAccessInformation(
      normalUp.clone().scale(-1),
      normalRight.clone(),
      normalUp.clone().scale(-height).add(normalRight.clone().scale(width)),
      height,
      width
    );
    this.sides[3] = new SideAccessInformation(
      normalRight.clone().scale(-1),
      normalUp.clone().scale(-1),
      normalRight.clone().scale(-width).add(normalUp.clone().scale(-height)),
      width,
      height
    );
  }
}

class PlacedTopic {
  public readonly points: StaticArray<Vector2> = new StaticArray<Vector2>(4);
  public readonly normal1Range: Range;
  public readonly normal2Range: Range;
  public readonly xRange: Range;
  public readonly yRange: Range;

  constructor(
    public readonly mid: Vector2,
    public readonly normal1: Vector2,
    public readonly normal2: Vector2,
    public readonly normal1Size: f32,
    public readonly normal2Size: f32,
    public readonly distance: f32
  ) {
    this.points[0] = normal1
      .clone()
      .scale(normal1Size)
      .add(normal2.clone().scale(-normal2Size))
      .add(mid);
    this.points[1] = normal1
      .clone()
      .scale(normal1Size)
      .add(normal2.clone().scale(normal2Size))
      .add(mid);
    this.points[2] = normal1
      .clone()
      .scale(-normal1Size)
      .add(normal2.clone().scale(normal2Size))
      .add(mid);
    this.points[3] = normal1
      .clone()
      .scale(-normal1Size)
      .add(normal2.clone().scale(-normal2Size))
      .add(mid);
    const n1Dot = mid.dot(normal1);
    this.normal1Range = new Range(n1Dot - normal1Size, n1Dot + normal1Size);
    const n2Dot = mid.dot(normal2);
    this.normal2Range = new Range(n2Dot - normal2Size, n2Dot + normal2Size);
    this.xRange = calcMinMax(new Vector2(1, 0), this.points);
    this.yRange = calcMinMax(new Vector2(0, 1), this.points);
  }
}

export class PositionInfo {
  constructor(
    public readonly position: Vector2,
    public readonly distanceSquared: f32,
    public readonly normal1: Vector2,
    public readonly normal2: Vector2,
    public readonly normal1Size: f32,
    public readonly normal2Size: f32
  ) {}

  toPlacedPos(): PlacedTopic {
    return new PlacedTopic(
      this.position,
      this.normal1,
      this.normal2,
      this.normal1Size,
      this.normal2Size,
      f32(Math.sqrt(this.distanceSquared))
    );
  }
}

export class WordCloudTopic {
  public readonly buildInfo: PreparedBuildInformation;
  public position: PlacedTopic | null = null;
  constructor(
    public readonly width: f32,
    public readonly height: f32,
    public readonly rotation: f32
  ) {
    this.buildInfo = new PreparedBuildInformation(width, height, rotation);
  }

  collideSAT(box: AxisAlignedBoundingBox<f32>): bool {
    const pos = this.position!;
    if (pos.yRange.start >= box.y + box.height || pos.yRange.end <= box.y)
      return false;
    if (pos.xRange.start >= box.x + box.width || pos.xRange.end <= box.x)
      return false;
    if (!pos.normal1Range.collides(calcMinMax(pos.normal1, box.points)))
      return false;
    if (!pos.normal2Range.collides(calcMinMax(pos.normal2, box.points)))
      return false;
    return true;
  }

  /**
   * Only callable when current topic has a position
   * @param otherTopic topic to place around this topic
   * @returns minimal distance with position
   */
  tryPlace(
    quadTree: QuadTree<f32, WordCloudTopic>,
    otherTopic: WordCloudTopic,
    aspectRatio: f32
  ): PositionInfo | null {
    assert(this.position !== null, 'Current topic must have a position!');
    let diffAngle = (this.rotation - otherTopic.rotation) % 90;
    if (isZero(diffAngle) || isZero(diffAngle - 90)) {
      // perpendicular or colinear
      return tryPlaceOnFourSides(this, otherTopic, quadTree, aspectRatio);
    }
    assert(false, 'For testing purpose, should not happen.');
    return null;
  }
}

export function findBestPlace(
  index: i32,
  newTopic: WordCloudTopic,
  elements: StaticArray<WordCloudTopic>,
  tree: QuadTree<f32, WordCloudTopic>,
  aspectRatio: f32
): void {
  if (index === 0) {
    const side = newTopic.buildInfo.sides[0];
    newTopic.position = new PlacedTopic(
      new Vector2(0, 0),
      side.sideNormal,
      side.perpendicularNormal,
      side.distToMid,
      side.otherDirMidDist,
      0
    );
    tree.addElement(newTopic);
    return;
  }
  let posInfo: PositionInfo | null = null;
  for (let i = 0; i < index; i++) {
    const nearestPos = elements[i].tryPlace(tree, newTopic, aspectRatio);
    if (nearestPos === null) continue;
    if (posInfo === null) {
      posInfo = nearestPos;
      continue;
    } else if (posInfo.distanceSquared > nearestPos.distanceSquared) {
      posInfo = nearestPos;
    }
  }
  if (posInfo !== null) {
    newTopic.position = posInfo.toPlacedPos();
    tree.addElement(newTopic);
  }
}
