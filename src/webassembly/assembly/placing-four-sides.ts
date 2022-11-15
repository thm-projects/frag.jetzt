import { AxisAlignedBoundingBox, QuadTree, Vector2 } from './quadtree';
import {
  isZero,
  NULL_RANGE,
  PositionInfo,
  Range,
  TRangeSet,
  WordCloudTopic,
} from './word-cloud-placing';

export function calcMinMax(dir: Vector2, points: StaticArray<Vector2>): Range {
  let max = -f32.MAX_VALUE;
  let min = f32.MAX_VALUE;
  for (let i = 0; i < points.length; i++) {
    const v = dir.dot(points[i]);
    if (max < v) max = v;
    if (min > v) min = v;
  }
  return new Range(min, max);
}

class SimpleCollisionBox {
  private readonly points: StaticArray<Vector2> = new StaticArray<Vector2>(4);
  private readonly completeMoveRange: Range;
  private readonly collRange: Range;
  private readonly moveRange: Range;
  private readonly xRange: Range;
  private readonly yRange: Range;
  private resultTRange: TRangeSet;

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
    private readonly rotation: f32,
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
      this.moveRange.start - moveTSize,
      this.moveRange.end + moveTSize
    );
    this.collRange = calcMinMax(this.addCollDir, this.points);
    this.resultTRange = new TRangeSet(moveTSize);
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
    if (this.resultTRange.isEmpty()) return null;
    /*
    get minimal distance with using perpendicular side
    from equality (distance to center):
     (0 0) + k * (c1 c2) = (m1 m2) + t * (move1 move2)
    */
    const c1 = this.addCollDir.getDirectionX() / aspectRatio;
    const c2 = this.addCollDir.getDirectionY();
    const m1 = this.midPoint.getDirectionX() / aspectRatio;
    const m2 = this.midPoint.getDirectionY();
    const move1 = this.moveDir.getDirectionX() / aspectRatio;
    const move2 = this.moveDir.getDirectionY();
    const optimalT = (c2 * m1 - c1 * m2) / (c1 * move2 - c2 * move1);
    // find possible t
    const t = this.resultTRange.getBestTValue(optimalT);
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
    // self move dir
    const selfDir1 = this.resultTRange.mergeTRange(
      calcMinMax(this.moveDir, pos.points),
      this.moveRange,
      1
    );
    if (selfDir1 === NULL_RANGE) {
      return true;
    }
    // self additional dir
    const selfDir2 = this.resultTRange.mergeTRange(
      calcMinMax(this.addCollDir, pos.points),
      this.collRange,
      0
    );
    if (selfDir2 === NULL_RANGE) {
      return true;
    }
    const rotation = this.rotation - topic.rotation;
    if (isZero(rotation % 90)) {
      if (selfDir1 !== null) {
        this.resultTRange.splitByRange(selfDir1.start, selfDir1.end);
      }
      if (selfDir2 !== null) {
        this.resultTRange.splitByRange(selfDir2.start, selfDir2.end);
      }
      return !this.resultTRange.isEmpty();
    }
    // other up
    const otherDir1 = this.resultTRange.mergeTRange(
      pos.normal1Range,
      calcMinMax(pos.normal1, this.points),
      pos.normal1.dot(this.moveDir)
    );
    if (otherDir1 === NULL_RANGE) {
      return true;
    }
    // other right
    const otherDir2 = this.resultTRange.mergeTRange(
      pos.normal2Range,
      calcMinMax(pos.normal2, this.points),
      pos.normal2.dot(this.moveDir)
    );
    if (otherDir2 === NULL_RANGE) {
      return true;
    }
    // update possible t ranges
    if (selfDir1 !== null) {
      this.resultTRange.splitByRange(selfDir1.start, selfDir1.end);
    }
    if (selfDir2 !== null) {
      this.resultTRange.splitByRange(selfDir2.start, selfDir2.end);
    }
    if (otherDir1 !== null) {
      this.resultTRange.splitByRange(otherDir1.start, otherDir1.end);
    }
    if (otherDir2 !== null) {
      this.resultTRange.splitByRange(otherDir2.start, otherDir2.end);
    }
    return !this.resultTRange.isEmpty();
  }

  collideSAT(box: AxisAlignedBoundingBox<f32>): bool {
    // box up
    if (this.yRange.start >= box.y + box.height || this.yRange.end <= box.y) {
      return false;
    }
    // box right
    if (this.xRange.start >= box.x + box.width || this.xRange.end <= box.x) {
      return false;
    }
    // self up
    if (
      !this.completeMoveRange.collides(calcMinMax(this.moveDir, box.points))
    ) {
      return false;
    }
    // self right
    if (!this.collRange.collides(calcMinMax(this.addCollDir, box.points))) {
      return false;
    }
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
      newTopic.rotation,
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
