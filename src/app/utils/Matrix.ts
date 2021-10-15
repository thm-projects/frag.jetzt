export class Matrix {
  public readonly rows;
  public readonly cols;
  private readonly _data;

  constructor(rows = 4, cols = 4, data = new Array(rows * cols)) {
    console.assert(rows * cols === data.length, 'data has not the right format');
    this.rows = rows;
    this.cols = cols;
    this._data = data;
  }

  static rotateAroundZin3D(degrees: number) {
    const sin = Math.sin(degrees);
    const cos = Math.cos(degrees);
    return new Matrix(4, 4, [
      cos, -sin, 0, 0,
      sin, cos, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  static translateIn3D(x: number, y: number = 0, z: number = 0) {
    return new Matrix(4, 4, [
      1, 0, 0, x,
      0, 1, 0, y,
      0, 0, 1, z,
      0, 0, 0, 1
    ]);
  }

  get data() {
    return [...this._data];
  }

  multiply(matrix: Matrix): Matrix {
    console.assert(this.cols === matrix.rows, 'Matrix dimensions mismatch');
    const result = new Matrix(this.rows, matrix.cols);
    result._data.fill(0);
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < matrix.cols; j++) {
        const index = i * matrix.cols + j;
        for (let k = 0; k < this.cols; k++) {
          result._data[index] += this._data[i * this.cols + k] * matrix._data[k * matrix.rows + j];
        }
      }
    }
    return result;
  }

  transpose(): Matrix {
    const result = new Matrix(this.cols, this.rows);
    const len = this._data.length;
    for (let i = 0, index = 0; i < this.cols; i++) {
      for (let j = i; j < len; j += this.cols, index++) {
        result._data[index] = this._data[j];
      }
    }
    return result;
  }

  log() {
    const table = new Array(this.rows);
    for (let i = 0, counter = 0; i < table.length; i++, counter += this.cols) {
      table[i] = this._data.slice(counter, counter + this.cols);
    }
    console.table(table);
  }
}
