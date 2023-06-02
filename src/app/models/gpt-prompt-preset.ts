import { FieldsOf, UUID, verifyInstance } from 'app/utils/ts-utils';

export class GPTPromptPreset {
  id: UUID;
  accountId: UUID;
  act: string;
  prompt: string;
  language: string;
  temperature: number;
  presencePenalty: number;
  frequencyPenalty: number;
  topP: number;
  createdAt: Date;
  updatedAt: Date;

  constructor({
    id = null,
    accountId = null,
    act = null,
    prompt = null,
    language = null,
    temperature = 1,
    presencePenalty = 0,
    frequencyPenalty = 0,
    topP = 1,
    createdAt = new Date(),
    updatedAt = null,
  }: FieldsOf<GPTPromptPreset>) {
    this.id = id;
    this.accountId = accountId;
    this.act = act;
    this.prompt = prompt;
    this.language = language;
    this.temperature = temperature;
    this.presencePenalty = presencePenalty;
    this.frequencyPenalty = frequencyPenalty;
    this.topP = topP;
    this.createdAt = verifyInstance(Date, createdAt);
    this.updatedAt = verifyInstance(Date, updatedAt);
  }
}
