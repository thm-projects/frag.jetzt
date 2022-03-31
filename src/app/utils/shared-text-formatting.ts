export class SharedTextFormatting {
  static getWords(text: string): string[] {
    return text.split(/\s+/g).filter(e => e.trim().length);
  }

  static getTerm(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}
