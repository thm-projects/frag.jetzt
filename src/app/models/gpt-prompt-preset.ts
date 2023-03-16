import { UUID, verifyInstance } from 'app/utils/ts-utils';

export class GPTPromptPreset {
  id: UUID;
  accountId: UUID;
  act: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;

  constructor({
    id = null,
    accountId = null,
    act = null,
    prompt = null,
    createdAt = new Date(),
    updatedAt = null,
  }: GPTPromptPreset) {
    this.id = id;
    this.accountId = accountId;
    this.act = act;
    this.prompt = prompt;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}
