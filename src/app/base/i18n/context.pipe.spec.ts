import { ContextPipe } from './context.pipe';

describe('ContextPipe', () => {
  it('create an instance', () => {
    const pipe = new ContextPipe();
    expect(pipe).toBeTruthy();
  });

  it('should substitute variables', () => {
    const pipe = new ContextPipe();
    const result = pipe.transform('Hello, {{name}}!', { name: 'World' });
    expect(result).toBe('Hello, World!');
  });

  it('should not substitute unknown variables', () => {
    const pipe = new ContextPipe();
    const result = pipe.transform('Hello, {{name}}! {{second}}', {
      second: 'Test',
    });
    expect(result).toBe('Hello, {{name}}! Test');
  });

  it('should do nothing to normal strings', () => {
    const pipe = new ContextPipe();
    const str = 'Do you like the new i18n feature?';
    const result = pipe.transform(str, { name: 'World' });
    expect(result).toBe(str);
  });
});
