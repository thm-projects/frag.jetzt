export class PatchComment {
  type: string;
  payload: {
      commentId;
      changes: Map<string, any>;
  };

  constructor(commentId: string, changes: Map<string, any>) {
      this.type = 'PatchComment';
      this.payload = {
        commentId: commentId,
        changes: changes
      };
  }
}
