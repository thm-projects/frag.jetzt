import { ActiveWord, WordMeta } from './word-cloud.component';

interface WordCloudQuadTreeOptions {
  capacity: number; // Math.round(maxSize/minSize)
  maxDepth: number; // Math.round(Math.log2(width/maxSize))
}

type WordCloudQuadTreeQuadrants<T extends WordMeta> = [
  northWest: WordCloudQuadTree<T>,
  northEast: WordCloudQuadTree<T>,
  southWest: WordCloudQuadTree<T>,
  southEast: WordCloudQuadTree<T>,
];

export class WordCloudQuadTree<T extends WordMeta> {
  private _quads: WordCloudQuadTreeQuadrants<T>;
  private _elements: ActiveWord<T>[] = [];

  constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly width: number,
    private readonly height: number,
    private readonly depth: number = 0,
  ) {
  }

  insertElement() {
    // [-1,1] => [0, 0.5]
    // rotation => 6-eck (mit t), 4-eck (mit t)
  }

  private divide() {
    if (this._quads) {
      return;
    }
    const w = this.width / 2;
    const h = this.height / 2;
    this._quads = [
      new WordCloudQuadTree(this.x, this.y, w, h, this.depth + 1),
      new WordCloudQuadTree(this.x + w, this.y, w, h, this.depth + 1),
      new WordCloudQuadTree(this.x, this.y + h, w, h, this.depth + 1),
      new WordCloudQuadTree(this.x + w, this.y + h, w, h, this.depth + 1),
    ];
  }
}
