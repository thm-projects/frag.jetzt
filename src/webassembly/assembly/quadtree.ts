import { WordCloudTopic } from './word-cloud-placing';

//ToDo: Update to T
export class Vector2 {
  private _directionX: f32;
  private _directionY: f32;

  constructor(directionX: f32, directionY: f32) {
    this._directionX = directionX;
    this._directionY = directionY;
  }

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
  public readonly points: StaticArray<Vector2> = new StaticArray<Vector2>(4);
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
    this.points[0] = new Vector2(x, y + height);
    this.points[1] = new Vector2(x + width, y + height);
    this.points[2] = new Vector2(x + width, y);
    this.points[3] = new Vector2(x, y);
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
  private readonly objects: Array<K> = new Array();
  private readonly children: StaticArray<QuadTree<T, K>>;
  private hasChildren: bool = false;

  constructor(
    private readonly collideFunc: QuadTreeCollideFunction<T, K>,
    private readonly container: AxisAlignedBoundingBox<T>,
    private readonly configuration: QuadTreeSpecifications,
    private readonly depth: usize = 0
  ) {
    this.children = new StaticArray(i32(configuration.divisionSize));
  }

  isEmpty(): bool {
    return !this.hasChildren && this.objects.length === 0;
  }

  queryObjects<J>(
    collisionObject: J,
    collideFunc: QuadTreeCollideFunction<T, J>,
    acceptor: QuadTreeQueryAcceptor<J, K>
  ): bool {
    if (!acceptor(collisionObject, this.objects)) {
      return false;
    }
    if (!this.hasChildren) {
      return true;
    }
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
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
    if (this.hasChildren) {
      let collideIndex: i32 = -1;
      for (let i = 0; i < this.children.length; i++) {
        if (this.children[i].collides(object)) {
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
        this.children[collideIndex].addElement(object);
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
    if (this.hasChildren) {
      return;
    }
    const size = i32(this.configuration.divisionFactor);
    const aabb = this.container;
    const newDepth = this.depth + 1;
    let currentY = aabb.y;
    for (let y: i32 = 0, i = 0; y < size; ) {
      let currentX = aabb.x;
      const nextY = aabb.y + (aabb.height * (++y as T)) / (size as T);
      const height = nextY - currentY;
      for (let x: i32 = 0; x < size; ) {
        const nextX = aabb.x + (aabb.width * (++x as T)) / (size as T);
        this.children[i++] = new QuadTree(
          this.collideFunc,
          new AxisAlignedBoundingBox(
            currentX,
            currentY,
            nextX - currentX,
            height
          ),
          this.configuration,
          newDepth
        );
        currentX = nextX;
      }
      currentY = nextY;
    }
    this.hasChildren = true;
    const cloned = StaticArray.fromArray(this.objects);
    this.objects.length = 0;
    for (let i = 0; i < cloned.length; i++) {
      this.addElement(cloned[i]);
    }
  }
}
