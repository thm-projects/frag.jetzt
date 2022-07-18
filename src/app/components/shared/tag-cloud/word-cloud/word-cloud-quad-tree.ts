import { ActiveWord, WordMeta } from './word-cloud.component';

interface WordCloudQuadTreeOptions {
  capacity: number;
  maxDepth: number;
}

export interface SATQuadCollision {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

type WordCloudQuadTreeQuadrants<T extends WordMeta, K> = [
  northWest: WordCloudQuadTree<T, K>,
  northEast: WordCloudQuadTree<T, K>,
  southWest: WordCloudQuadTree<T, K>,
  southEast: WordCloudQuadTree<T, K>,
];

export class WordCloudQuadTree<T extends WordMeta, K> {
  private _quads: WordCloudQuadTreeQuadrants<T, K> = null;
  private _elements: [ActiveWord<T, K>, SATQuadCollision][] = [];
  private readonly endX: number;
  private readonly endY: number;

  constructor(
    private readonly x: number,
    private readonly y: number,
    private readonly width: number,
    private readonly height: number,
    private readonly configuration: WordCloudQuadTreeOptions,
    private readonly depth: number = 0,
  ) {
    this.endX = x + width;
    this.endY = y + height;
  }

  collideSAT(collideProjection: SATQuadCollision, collideFunc: (elements: ActiveWord<T, K>[]) => boolean): boolean {
    if (collideFunc(this._elements.map(e => e[0]))) {
      return true;
    }
    this._quads?.forEach(quad => {
      if (quad.isCollidingSAT(collideProjection) && quad.collideSAT(collideProjection, collideFunc)) {
        return true;
      }
    });
  }

  insertElement(word: ActiveWord<T, K>, collideProjection: SATQuadCollision) {
    if (this._elements.length === this.configuration.capacity && this.depth < this.configuration.maxDepth) {
      this.divide();
    }
    this._add(word, collideProjection);
  }

  isEmpty() {
    return this._quads === null && this._elements.length === 0;
  }

  private _add(word: ActiveWord<T, K>, collideProjection: SATQuadCollision) {
    const possibleQuads = [];
    this._quads?.forEach((quad, i) => {
      if (quad.isCollidingSAT(collideProjection)) {
        possibleQuads.push(i);
      }
    });
    if (possibleQuads.length === 1) {
      this._quads[possibleQuads[0]].insertElement(word, collideProjection);
      return;
    }
    this._elements.push([word, collideProjection]);
  }

  private isCollidingSAT(collideProjection: SATQuadCollision) {
    return collideProjection.xMin < this.endX && collideProjection.xMax > this.x &&
      collideProjection.yMin < this.endY && collideProjection.yMax > this.y;
  }

  private divide() {
    if (this._quads !== null) {
      return;
    }
    const w = this.width / 2;
    const h = this.height / 2;
    this._quads = [
      new WordCloudQuadTree(this.x, this.y, w, h, this.configuration, this.depth + 1),
      new WordCloudQuadTree(this.x + w, this.y, w, h, this.configuration, this.depth + 1),
      new WordCloudQuadTree(this.x, this.y + h, w, h, this.configuration, this.depth + 1),
      new WordCloudQuadTree(this.x + w, this.y + h, w, h, this.configuration, this.depth + 1),
    ];
    const copy = [...this._elements];
    this._elements.length = 0;
    copy.forEach(e => this._add(e[0], e[1]));
  }
}
