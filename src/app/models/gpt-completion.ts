import { verifyInstance } from 'app/utils/ts-utils';

export class GPTLogProbs {
  textOffset: number[];
  tokenLogprobs: number[];
  tokens: string[];
  topLogprobs: { [token: string]: number };

  constructor({
    textOffset = [],
    tokenLogprobs = [],
    tokens = [],
    topLogprobs = {},
  }: GPTLogProbs) {
    this.textOffset = textOffset ? [...textOffset] : null;
    this.tokenLogprobs = tokenLogprobs ? [...tokenLogprobs] : null;
    this.tokens = tokens ? [...tokens] : null;
    this.topLogprobs = topLogprobs ? { ...topLogprobs } : null;
  }
}

export class GPTChoice {
  text: string;
  index: number;
  logprobs: GPTLogProbs;
  finishReason: string;

  constructor({
    text = null,
    index = -1,
    logprobs = null,
    finishReason = null,
  }: GPTChoice) {
    this.text = text;
    this.index = index;
    this.logprobs = verifyInstance(GPTLogProbs, logprobs);
    this.finishReason = finishReason;
  }
}

export class GPTCompletionUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;

  constructor({
    promptTokens = 0,
    completionTokens = 0,
    totalTokens = 0,
  }: GPTCompletionUsage) {
    this.promptTokens = promptTokens;
    this.completionTokens = completionTokens;
    this.totalTokens = totalTokens;
  }
}

export class GPTCompletion {
  id: string;
  object: string;
  created: Date;
  model: string;
  choices: GPTChoice[];
  usage: GPTCompletionUsage;

  constructor({
    id = null,
    object = null,
    created = null,
    model = null,
    choices = [],
    usage = null,
  }: GPTCompletion) {
    this.id = id;
    this.object = object;
    this.created = verifyInstance(Date, created);
    this.model = model;
    this.choices = choices ? choices.map((v) => verifyInstance(GPTChoice, v)) : null;
    this.usage = verifyInstance(GPTCompletionUsage, usage);
  }
}
