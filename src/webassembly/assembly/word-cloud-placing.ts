import { debugLog } from './env';
import { calcMinMax, isDebug, tryPlaceOnFourSides } from './placing-four-sides';
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
  public isInvalid: bool;
  constructor(private start: f32, private end: f32) {
    this.isInvalid = start > end;
    assert(!this.isInvalid, 'Cant create invalid range!');
  }

  clone(): Range {
    return new Range(this.start, this.end);
  }

  getEnd(): f32 {
    return this.end;
  }

  getStart(): f32 {
    return this.start;
  }

  collapse(start: f32, end: f32): void {
    this.start = f32(Math.max(this.start, start));
    this.end = f32(Math.min(this.end, end));
    this.isInvalid = this.start > this.end;
  }

  /**
   * When trying to execute this method, begin from end
   */
  splitIfNecessary(
    otherRange: Range,
    rangeList: Array<Range>,
    currentIndex: i32
  ): bool {
    if (otherRange.start <= this.start) {
      if (otherRange.end >= this.end) {
        rangeList.splice(currentIndex, 1);
      } else if (otherRange.end > this.start) {
        this.start = otherRange.end;
      }
      return false;
    }
    if (otherRange.start >= this.end) {
      return true;
    }
    if (otherRange.end < this.end) {
      assert(
        currentIndex + 1 <= rangeList.length,
        rangeList.length.toString() + ' ' + currentIndex.toString()
      );
      pushAt(rangeList, currentIndex + 1, new Range(otherRange.end, this.end));
    }
    this.end = otherRange.start;
    return true;
  }

  setInvalid(): void {
    this.isInvalid = true;
    this.end = this.start - 1;
  }

  collides(other: Range): bool {
    assert(!this.isInvalid, 'Range is invalid');
    // no equality, touching should not be colliding
    return other.start < this.end && other.end > this.start;
  }

  toString(): string {
    if (this.isInvalid) {
      return '[INVALID]';
    }
    return '[' + this.start.toString() + ',' + this.end.toString() + ']';
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
    if (
      pos.yRange.getStart() >= box.y + box.height ||
      pos.yRange.getEnd() <= box.y
    )
      return false;
    if (
      pos.xRange.getStart() >= box.x + box.width ||
      pos.xRange.getEnd() <= box.x
    )
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
    if (isDebug()) debugLog('\n  - ' + i.toString());
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
