export class AxisAlignedBoundingBox<T> {
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

type QuadTreeQueryAcceptor<K> = (collideObjects: Array<K>) => bool;

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
    this.children = new StaticArray(isize(configuration.divisionSize));
  }

  isEmpty(): bool {
    return !this.hasChildren && this.objects.length === 0;
  }

  queryObjects<J>(
    collisionObject: J,
    collideFunc: QuadTreeCollideFunction<T, J>,
    acceptor: QuadTreeQueryAcceptor<K>
  ): bool {
    if (!acceptor(this.objects)) {
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
      let collideIndex: isize = -1;
      for (let i = 0; i < this.children.length; i++) {
        if (this.children[i].collides(object)) {
          if (collideIndex !== -1) {
            this.objects.push(object);
            return;
          }
          collideIndex = i;
        }
      }
      this.children[collideIndex].addElement(object);
      return;
    }
    if (
      this.objects.length === this.configuration.objectCapacity &&
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
    const size = this.configuration.divisionFactor;
    const aabb = this.container;
    const newDepth = this.depth + 1;
    let currentY = aabb.y;
    for (let y = 0, i = 0; y < size; ) {
      let currentX = aabb.x;
      const nextY = aabb.y + (aabb.height * ++y) / size;
      const height = nextY - currentY;
      for (let x = 0; x < size; ) {
        const nextX = aabb.x + (aabb.width * ++x) / size;
        this.children[++i] = new QuadTree(
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
    delete cloned;
  }
}
