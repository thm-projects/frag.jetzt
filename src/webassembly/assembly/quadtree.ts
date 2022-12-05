import { WordCloudTopic } from './word-cloud-placing';

//ToDo: Update to T
export class Vector2 {
  private _directionX: f32;
  private _directionY: f32;

  constructor(directionX: f32, directionY: f32) {
    this._directionX = directionX;
    this._directionY = directionY;
  }

  static readonly X: Vector2 = new Vector2(1, 0);
  static readonly Y: Vector2 = new Vector2(0, 1);

  getDirectionX(): f32 {
    return this._directionX;
  }

  getDirectionY(): f32 {
    return this._directionY;
  }

  dot(other: Vector2): f32 {
    return (
      other._directionX * this._directionX +
      other._directionY * this._directionY
    );
  }

  lengthSquared(aspectRatio: f32): f32 {
    return (this._directionX / aspectRatio) ** 2 + this._directionY ** 2;
  }

  length(): f32 {
    return f32(Math.sqrt(this._directionX ** 2 + this._directionY ** 2));
  }

  clone(): Vector2 {
    return new Vector2(this._directionX, this._directionY);
  }

  add(vec2: Vector2): Vector2 {
    this._directionX += vec2._directionX;
    this._directionY += vec2._directionY;
    return this;
  }

  subtract(vec2: Vector2): Vector2 {
    this._directionX -= vec2._directionX;
    this._directionY -= vec2._directionY;
    return this;
  }

  scale(num: f32): Vector2 {
    this._directionX *= num;
    this._directionY *= num;
    return this;
  }

  toString(): string {
    return (
      'Vec2{x:' +
      this._directionX.toString() +
      ',y:' +
      this._directionY.toString() +
      '}'
    );
  }
}

export class AxisAlignedBoundingBox<T> {
  public readonly points: StaticArray<Vector2>;
  constructor(
    public readonly x: T,
    public readonly y: T,
    public readonly width: T,
    public readonly height: T
  ) {
    assert(
      isFloat<T>() || isInteger<T>(),
      'QuadTree needs type float or integer!'
    );
    this.points = StaticArray.fromArray([
      new Vector2(x, y + height),
      new Vector2(x + width, y + height),
      new Vector2(x + width, y),
      new Vector2(x, y)
    ]);
  }
}

export class QuadTreeSpecifications {
  public readonly divisionSize: usize;
  constructor(
    public readonly maxDepth: usize,
    public readonly divisionFactor: usize = 2,
    public readonly objectCapacity: usize = 4
  ) {
    assert(divisionFactor > 1 && divisionFactor < 6);
    this.divisionSize = divisionFactor * divisionFactor;
  }
}

type QuadTreeCollideFunction<T, K> = (
  rectangle: AxisAlignedBoundingBox<T>,
  collideObject: K
) => bool;

type QuadTreeQueryAcceptor<J, K> = (
  object: J,
  collideObjects: Array<K>
) => bool;

export class QuadTree<T, K> {
  private readonly objects: Array<K> = [];
  private children: StaticArray<QuadTree<T, K>> | null = null;

  constructor(
    private readonly collideFunc: QuadTreeCollideFunction<T, K>,
    private readonly container: AxisAlignedBoundingBox<T>,
    private readonly configuration: QuadTreeSpecifications,
    private readonly depth: usize = 0
  ) {
  }

  isEmpty(): bool {
    return this.children === null && this.objects.length === 0;
  }

  queryObjects<J>(
    collisionObject: J,
    collideFunc: QuadTreeCollideFunction<T, J>,
    acceptor: QuadTreeQueryAcceptor<J, K>
  ): bool {
    if (!acceptor(collisionObject, this.objects)) {
      return false;
    }
    if (this.children === null) {
      return true;
    }
    const childs = this.children!;
    for (let i = 0; i < childs.length; i++) {
      const child = childs[i];
      if (
        collideFunc(child.container, collisionObject) &&
        !child.queryObjects(collisionObject, collideFunc, acceptor)
      ) {
        return false;
      }
    }
    return true;
  }

  collides(object: K): bool {
    return this.collideFunc(this.container, object);
  }

  addElement(object: K): void {
    if (this.children !== null) {
      const childs = this.children!;
      let collideIndex: i32 = -1;
      for (let i = 0; i < childs.length; i++) {
        if (childs[i].collides(object)) {
          if (collideIndex !== -1) {
            this.objects.push(object);
            return;
          }
          collideIndex = i;
        }
      }
      // touching does not count as colliding: -1 is possible
      if (collideIndex === -1) {
        this.objects.push(object);
      } else {
        childs[collideIndex].addElement(object);
      }
      return;
    }
    if (
      this.objects.length === i32(this.configuration.objectCapacity) &&
      this.depth < this.configuration.maxDepth
    ) {
      this.objects.push(object);
      this.divide();
    } else {
      this.objects.push(object);
    }
  }

  private divide(): void {
    if (this.children !== null) {
      return;
    }
    const size = i32(this.configuration.divisionFactor);
    const aabb = this.container;
    const newDepth = this.depth + 1;
    let currentY = aabb.y;
    const newChilds = new Array<QuadTree<T, K>>();
    for (let y: i32 = 0, i = 0; y < size; ) {
      let currentX = aabb.x;
      const nextY = aabb.y + (aabb.height * (++y as T)) / (size as T);
      const height = nextY - currentY;
      for (let x: i32 = 0; x < size; ) {
        const nextX = aabb.x + (aabb.width * (++x as T)) / (size as T);
        newChilds.push(new QuadTree(
          this.collideFunc,
          new AxisAlignedBoundingBox(
            currentX,
            currentY,
            nextX - currentX,
            height
          ),
          this.configuration,
          newDepth
        ));
        currentX = nextX;
      }
      currentY = nextY;
    }
    this.children = StaticArray.fromArray(newChilds);
    const cloned = StaticArray.fromArray(this.objects);
    this.objects.length = 0;
    for (let i = 0; i < cloned.length; i++) {
      this.addElement(cloned[i]);
    }
  }
}
