export enum LivepollTemplate {
  Character,
  Symbol
}

export interface LivepollTemplateContext {
  kind: LivepollTemplate;
  name: string;
  isPlain: boolean;
  symbols: [string, string, string, string];
}

export const templateContext: LivepollTemplateContext[] = [
  {
    kind: LivepollTemplate.Character,
    isPlain: true,
    name: 'character',
    symbols: ['A', 'B', 'C', 'D']
  } as LivepollTemplateContext,
  {
    kind: LivepollTemplate.Symbol,
    isPlain: false,
    name: 'symbol',
    symbols: ['sentiment_very_satisfied', 'sentiment_satisfied', 'sentiment_neutral', 'sentiment_very_dissatisfied']
  } as LivepollTemplateContext
];

