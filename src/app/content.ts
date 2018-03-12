export enum Format {
  CHOICE,
  BINARY,
  SCALE,
  NUMBER,
  TEXT,
  GRID
}

export class Content {
  id: string;
  revision: string;
  roomId: string;
  subject: string;
  body: string;
  round: number;
  format: Format;
  formatAttributes: Map<string, string>;
}
