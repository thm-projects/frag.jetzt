
class Vector2 {
  constructor(
    public readonly directionX: f32,
    public readonly directionY: f32
  ) {
  }
}

class WordCloudTopic {
  private readonly normalUp: Vector2;
  private readonly normalRight: Vector2;
  constructor(
    private readonly width: f32,
    private readonly height: f32,
    private readonly rotation: f32
  ) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    this.normalUp = new Vector2()
  }
}

export function calculateWordCloudPlacing(boundsArray: Array<f32>): StaticArray<f32> {
  // width, height, rotation
}
