import { HighlightOptions } from 'ngx-highlightjs';

export const HighlightJsDefaults: HighlightOptions = {
  coreLibraryLoader: () => import('highlight.js/lib/core'),
  lineNumbersLoader: () => import('highlightjs-line-numbers.js'), // Optional, only if you want the line numbers
  languages: {
    // Arduino (II)
    arduino: () => import('highlight.js/lib/languages/arduino'),
    // Shell / Terminal / Windows Batch
    bash: () => import('highlight.js/lib/languages/bash'),
    dos: () => import('highlight.js/lib/languages/dos'),
    powershell: () => import('highlight.js/lib/languages/powershell'),
    shell: () => import('highlight.js/lib/languages/shell'),
    // Assembly (Compiler)
    armasm: () => import('highlight.js/lib/languages/armasm'),
    avrasm: () => import('highlight.js/lib/languages/avrasm'),
    x86asm: () => import('highlight.js/lib/languages/x86asm'),
    // Programming languages
    c: () => import('highlight.js/lib/languages/c'),
    csharp: () => import('highlight.js/lib/languages/csharp'),
    cpp: () => import('highlight.js/lib/languages/cpp'),
    java: () => import('highlight.js/lib/languages/java'),
    kotlin: () => import('highlight.js/lib/languages/kotlin'),
    delphi: () => import('highlight.js/lib/languages/delphi'),
    fortran: () => import('highlight.js/lib/languages/fortran'),
    lisp: () => import('highlight.js/lib/languages/lisp'),
    lua: () => import('highlight.js/lib/languages/lua'),
    objectivec: () => import('highlight.js/lib/languages/objectivec'),
    php: () => import('highlight.js/lib/languages/php'),
    perl: () => import('highlight.js/lib/languages/perl'),
    processing: () => import('highlight.js/lib/languages/processing'),
    python: () => import('highlight.js/lib/languages/python'),
    r: () => import('highlight.js/lib/languages/r'),
    ruby: () => import('highlight.js/lib/languages/ruby'),
    rust: () => import('highlight.js/lib/languages/rust'),
    scala: () => import('highlight.js/lib/languages/scala'),
    swift: () => import('highlight.js/lib/languages/swift'),
    // SQL
    pgsql: () => import('highlight.js/lib/languages/pgsql'),
    sql: () => import('highlight.js/lib/languages/sql'),
    // Web (xml is html)
    css: () => import('highlight.js/lib/languages/css'),
    scss: () => import('highlight.js/lib/languages/scss'),
    xml: () => import('highlight.js/lib/languages/xml'),
    http: () => import('highlight.js/lib/languages/http'),
    javascript: () => import('highlight.js/lib/languages/javascript'),
    typescript: () => import('highlight.js/lib/languages/typescript'),
    wasm: () => import('highlight.js/lib/languages/wasm'),
    // Web extensions
    graphql: () => import('highlight.js/lib/languages/graphql'),
    json: () => import('highlight.js/lib/languages/json'),
    gherkin: () => import('highlight.js/lib/languages/gherkin'),
    markdown: () => import('highlight.js/lib/languages/markdown'),
    // Configuration
    ini: () => import('highlight.js/lib/languages/ini'),
    apache: () => import('highlight.js/lib/languages/apache'),
    nginx: () => import('highlight.js/lib/languages/nginx'),
    yaml: () => import('highlight.js/lib/languages/yaml'),
    dockerfile: () => import('highlight.js/lib/languages/dockerfile'),
    // Utility
    latex: () => import('highlight.js/lib/languages/latex'),
    cmake: () => import('highlight.js/lib/languages/cmake'),
    makefile: () => import('highlight.js/lib/languages/makefile'),
    matlab: () => import('highlight.js/lib/languages/matlab'),
  },
  themePath: '',
};
