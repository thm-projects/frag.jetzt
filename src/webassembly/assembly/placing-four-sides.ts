import { AxisAlignedBoundingBox, QuadTree, Vector2 } from './quadtree';
import {
  isZero,
  PositionInfo,
  Range,
  WordCloudTopic,
} from './word-cloud-placing';

export function calcMinMax(dir: Vector2, points: StaticArray<Vector2>): Range {
  let max = f32.MIN_VALUE;
  let min = f32.MAX_VALUE;
  for (let i = 0; i < points.length; i++) {
    const v = dir.dot(points[i]);
    if (max < v) max = v;
    if (min > v) min = v;
  }
  return new Range(min, max);
}

/**
 * @returns
 * null, if no collision can occur
 *
 * a valid range, if the ranges can be merged
 *
 * an invalid range, if there is always a collision
 */
export function mergeTRanges(
  baseRange: Range,
  staticRange: Range,
  tRange: Range,
  tProjectedOnRange: f32
): Range | null {
  if (isZero(tProjectedOnRange)) {
    if (staticRange.isInvalid) {
      return baseRange;
    }
    if (staticRange.collides(tRange)) {
      baseRange.setInvalid();
      return baseRange;
    }
    return null;
  }
  const t1 = (tRange.getStart() - staticRange.getEnd()) / -tProjectedOnRange;
  const t2 = (staticRange.getStart() - tRange.getEnd()) / tProjectedOnRange;
  if (t1 > t2) {
    baseRange.collapse(t2, t1);
  } else {
    baseRange.collapse(t1, t2);
  }
  return baseRange;
}

class SimpleCollisionBox {
  private readonly points: StaticArray<Vector2> = new StaticArray<Vector2>(4);
  private readonly completeMoveRange: Range;
  private readonly collRange: Range;
  private readonly moveRange: Range;
  private readonly xRange: Range;
  private readonly yRange: Range;
  private readonly tRange: Array<Range> = new Array<Range>();

  /**
   * @param midPoint Currently testing mid point
   * @param moveDir direction of movement for t (is perpendicular to one side)
   * @param addCollDir direction of second normal (perpendicular to move)
   * @param moveSize size of normal box along move dir
   * @param addCollSize size of normal box along second normal
   * @param moveTSize size of t range (at least moveSize)
   */
  constructor(
    public readonly midPoint: Vector2,
    public readonly moveDir: Vector2,
    public readonly addCollDir: Vector2,
    private readonly moveSize: f32,
    private readonly addCollSize: f32,
    moveTSize: f32
  ) {
    this.points[0] = moveDir
      .clone()
      .scale(moveSize)
      .add(addCollDir.clone().scale(addCollSize))
      .add(midPoint);
    this.points[1] = moveDir
      .clone()
      .scale(moveSize)
      .add(addCollDir.clone().scale(-addCollSize))
      .add(midPoint);
    this.points[2] = moveDir
      .clone()
      .scale(-moveSize)
      .add(addCollDir.clone().scale(addCollSize))
      .add(midPoint);
    this.points[3] = moveDir
      .clone()
      .scale(-moveSize)
      .add(addCollDir.clone().scale(-addCollSize))
      .add(midPoint);
    this.moveRange = calcMinMax(this.moveDir, this.points);
    this.completeMoveRange = new Range(
      this.moveRange.getStart() - moveTSize,
      this.moveRange.getEnd() + moveTSize
    );
    this.collRange = calcMinMax(this.addCollDir, this.points);
    this.tRange.push(new Range(-moveTSize, moveTSize));
    // calculate for sat
    const edgePoints = new StaticArray<Vector2>(4);
    {
      const fullyLength = moveSize + moveTSize;
      edgePoints[0] = this.moveDir
        .clone()
        .scale(fullyLength)
        .add(this.addCollDir.clone().scale(addCollSize))
        .add(this.midPoint);
      edgePoints[1] = this.moveDir
        .clone()
        .scale(fullyLength)
        .add(this.addCollDir.clone().scale(-addCollSize))
        .add(this.midPoint);
      edgePoints[2] = this.moveDir
        .clone()
        .scale(-fullyLength)
        .add(this.addCollDir.clone().scale(addCollSize))
        .add(this.midPoint);
      edgePoints[3] = this.moveDir
        .clone()
        .scale(-fullyLength)
        .add(this.addCollDir.clone().scale(-addCollSize))
        .add(this.midPoint);
    }
    this.xRange = calcMinMax(new Vector2(1, 0), edgePoints);
    this.yRange = calcMinMax(new Vector2(0, 1), edgePoints);
  }

  /**
   * @param aspectRatio width / height from screen
   */
  constructPosition(aspectRatio: f32): PositionInfo | null {
    if (this.tRange.length < 1) return null;
    /*
    get minimal distance with using perpendicular side
    from equality (distance to center):
     (0 0) + k * (c1 c2) = (m1 m2) + t * (move1 move2)
    */
    const c1 = this.addCollDir.getDirectionX();
    const c2 = this.addCollDir.getDirectionY();
    const m1 = this.midPoint.getDirectionX();
    const m2 = this.midPoint.getDirectionY();
    const move1 = this.moveDir.getDirectionX();
    const move2 = this.moveDir.getDirectionY();
    const optimalT = (c2 * m1 - c1 * m2) / (c1 * move2 - c2 * move1);
    // find possible t
    let distance = f32.MAX_VALUE;
    let t = optimalT;
    for (let i = 0; i < this.tRange.length; i++) {
      const range = this.tRange[i];
      if (optimalT > range.getEnd()) {
        const dist = f32(Math.abs(optimalT - range.getEnd()));
        if (dist < distance) {
          distance = dist;
          t = range.getEnd();
        }
      } else if (optimalT < range.getStart()) {
        const dist = f32(Math.abs(optimalT - range.getStart()));
        if (dist < distance) {
          distance = dist;
          t = range.getStart();
        }
        break; // sorted ascending -> break if before
      } else {
        t = optimalT;
        distance = 0;
        break;
      }
    }
    // construct position
    const midPoint = this.moveDir.clone().scale(t).add(this.midPoint);
    return new PositionInfo(
      midPoint,
      midPoint.lengthSquared(aspectRatio),
      this.moveDir,
      this.addCollDir,
      this.moveSize,
      this.addCollSize
    );
  }

  /**
   * @returns
   * true, if the collision checks can continue
   *
   * false, if it has no space, collision checks can be aborted
   */
  collideTRange(topic: WordCloudTopic): bool {
    const pos = topic.position!;
    let currentRange: Range | null = this.completeMoveRange.clone();
    // self move dir
    currentRange = mergeTRanges(
      currentRange!,
      calcMinMax(this.moveDir, pos.points),
      this.moveRange,
      1
    );
    // No collision can occur, continue
    if (currentRange === null) return true;
    // self additional dir
    currentRange = mergeTRanges(
      currentRange,
      calcMinMax(this.addCollDir, pos.points),
      this.collRange,
      0
    );
    if (currentRange === null) return true;
    // other up
    currentRange = mergeTRanges(
      currentRange,
      pos.normal1Range,
      calcMinMax(pos.normal1, this.points),
      pos.normal1.dot(this.moveDir)
    );
    if (currentRange === null) return true;
    // other right
    currentRange = mergeTRanges(
      currentRange,
      pos.normal2Range,
      calcMinMax(pos.normal2, this.points),
      pos.normal2.dot(this.moveDir)
    );
    if (currentRange === null) return true;
    if (currentRange.isInvalid) {
      // Checks only at end, a object is only colliding if all normals on each polygon collide.
      //  -> Invalid can be ignored till end
      this.tRange.length = 0;
      return false;
    }
    // update possible t ranges
    for (let i = this.tRange.length - 1; i >= 0; --i) {
      if (this.tRange[i].splitIfNecessary(currentRange, this.tRange, i)) break;
    }
    return this.tRange.length > 0;
  }

  collideSAT(box: AxisAlignedBoundingBox<f32>): bool {
    // box up
    if (
      this.yRange.getStart() >= box.y + box.height ||
      this.yRange.getEnd() <= box.y
    )
      return false;
    // box right
    if (
      this.xRange.getStart() >= box.x + box.width ||
      this.xRange.getEnd() <= box.x
    )
      return false;
    // self up
    if (!this.completeMoveRange.collides(calcMinMax(this.moveDir, box.points)))
      return false;
    // self right
    if (!this.collRange.collides(calcMinMax(this.addCollDir, box.points)))
      return false;
    return true;
  }
}

export const tryPlaceOnFourSides = (
  topic: WordCloudTopic,
  newTopic: WordCloudTopic,
  quadTree: QuadTree<f32, WordCloudTopic>,
  aspectRatio: f32
): PositionInfo | null => {
  const rotation: f32 = newTopic.rotation - topic.rotation;
  let rotIndex: i32 = i32(
    ((rotation < 0 ? rotation + 405 : rotation + 45) / 90) % 4
  );
  let newSideIndex = (rotIndex + 2) % 4;
  let minimal: PositionInfo | null = null;
  for (let i = 0; i < 4; ++i, newSideIndex = (newSideIndex + 1) % 4) {
    const newSide = newTopic.buildInfo.sides[newSideIndex];
    const side = topic.buildInfo.sides[i];
    const currentMid = topic.position!.mid;
    const newMid = side.sideNormal
      .clone()
      .scale(side.distToMid + newSide.distToMid)
      .add(currentMid);
    const collisionBox = new SimpleCollisionBox(
      newMid,
      side.perpendicularNormal.clone(),
      side.sideNormal.clone(),
      newSide.otherDirMidDist,
      newSide.distToMid,
      side.otherDirMidDist + newSide.otherDirMidDist
    );
    quadTree.queryObjects(
      collisionBox,
      (alignedBox, box) => box.collideSAT(alignedBox),
      (object, topics) => {
        for (let j = 0; j < topics.length; j++) {
          if (!object.collideTRange(topics[j])) {
            return false;
          }
        }
        return true;
      }
    );
    const t = collisionBox.constructPosition(aspectRatio);
    if (t == null) {
      continue;
    }
    if (minimal == null) {
      minimal = t;
    } else if (minimal.distanceSquared > t.distanceSquared) {
      minimal = t;
    }
  }
  return minimal;
};
