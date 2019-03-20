import { TSMap } from 'typescript-map';

export class PatchComment {
  type: string;
  payload: {
      id: string;
      changes: TSMap<string, any>;
  };

  constructor(id: string, changes: TSMap<string, any>) {
      this.type = 'PatchComment';
      this.payload = {
        id: id,
        changes: changes
      };
  }
}
