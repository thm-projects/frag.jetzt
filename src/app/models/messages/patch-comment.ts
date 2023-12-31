import { TSMap } from 'typescript-map';

export class PatchComment {
  type: string;
  payload: {
    id: string;
    changes: TSMap<string, unknown>;
  };

  constructor(id: string, changes: TSMap<string, unknown>) {
    this.type = 'PatchComment';
    this.payload = {
      id,
      changes,
    };
  }
}
