const fs = require('fs');
const {exec} = require('child_process');

const PREFIX_NOT_TRANSLATED = '--TODO-- | ';
const RED = '\033[0;31m';
const YELLOW = '\033[0;33m';
const MAGENTA = '\033[0;35m';
const NO_COLOR = '\033[0m';

class LanguageDirectory {
  constructor (directory, languages) {
    this.directory = directory;
    this.languages = languages;
  }

  addNew (language) {
    if (this.languages.includes(language)) {
      return;
    }
    const removeEntries = (elem) => {
      for (const key of Object.keys(elem)) {
        if (typeof elem[key] === 'object' && !Array.isArray(elem[key])) {
          removeEntries(elem[key]);
        } else if (typeof elem[key] === 'string') {
          elem[key] = PREFIX_NOT_TRANSLATED + elem[key];
        }
      }
      return elem;
    };
    this.#write(language, removeEntries(this.#read(ref)));
    this.languages.push(language);
  }

  sort () {
    this.languages.forEach(lang => {
      const sortElement = (elem) => {
        if (typeof elem !== 'object' || Array.isArray(elem)) {
          return elem;
        }
        return Object.keys(elem).sort().reduce((acc, key) => {
          acc[key] = sortElement(elem[key]);
          return acc;
        }, {});
      };
      this.#write(lang, sortElement(this.#read(lang)));
    });
  }

  findMissing () {
    const keyReference = {};
    this.getAllKeys((key, _, lang) => {
      if (!keyReference[key]) {
        keyReference[key] = [];
      }
      keyReference[key].push(lang);
    });
    let str = RED;
    Object.keys(keyReference).forEach(key => {
      const arr = keyReference[key];
      if (arr.length < this.languages.length) {
        str += `${key}: Missing ${this.languages.filter(e => !arr.includes(e)).join(', ')}\n`;
      }
    });
    return str + NO_COLOR;
  }

  findUntranslated (showAll = false) {
    const notTranslated = {};
    this.getAllKeys((key, elem, lang) => {
      if (typeof elem === 'string' && elem.startsWith(PREFIX_NOT_TRANSLATED)) {
        if (!notTranslated[key]) {
          notTranslated[key] = [];
        }
        notTranslated[key].push(lang);
      }
    });
    const result = Object.keys(notTranslated).reduce((acc, key) => {
      acc[0] = acc[0] + notTranslated[key].length;
      notTranslated[key].forEach(e => acc[1].add(e));
      return acc;
    }, [0, new Set()]);
    const count = result[0];
    const langs = [...result[1]].join(', ');
    if (count < 1) {
      return '';
    }
    let str = YELLOW + 'Not Translated (' + count + '): ' + langs + '\n';
    if (showAll) {
      Object.keys(notTranslated).forEach(key => {
        str += `${key}: ${notTranslated[key].join(', ')}\n`;
      });
    }
    return str + NO_COLOR;
  }

  getAllKeys (func) {
    const prepareFunction = (elem, previous, lang) => {
      Object.keys(elem).forEach(key => {
        const newKey = previous ? previous + '.' + key : key;
        if (typeof elem[key] === 'object' && !Array.isArray(elem[key])) {
          prepareFunction(elem[key], newKey, lang);
        } else {
          func(newKey, elem[key], lang);
        }
      });
    };
    this.languages.forEach(lang => prepareFunction(this.#read(lang), '', lang));
  }

  #read (lang) {
    return JSON.parse(fs.readFileSync(this.directory + lang + '.json', {
      encoding: 'utf8'
    }));
  }

  #write (lang, object) {
    fs.writeFileSync(
      this.directory + lang + '.json',
      JSON.stringify(object, undefined, 2) + '\n',
      {
        encoding: 'utf8'
      }
    );
  }
}

const printHelp = () => {
  console.log(`
${RED}sort${NO_COLOR} - sort all files alphabetically
${RED}add-language <lang-name>${NO_COLOR} - add language file
${RED}missing${NO_COLOR} - find missing keys, based on other language files
${RED}untranslated [--show-all]${NO_COLOR} - finds untraslated texts
${RED}project-unused${NO_COLOR} - (TODO) find unused labels from the project
`);
  process.exit(1);
}

const findFiles = () => {
  const arr = [];
  const findInFolder = (folderName) => {
    const languages = [];
    fs.readdirSync(folderName, {
      encoding: 'utf8',
      withFileTypes: true,
    }).forEach(c => {
      if (c.isDirectory()) {
        findInFolder(folderName + c.name + '/');
      } else if (c.isFile() && c.name.toLowerCase().endsWith('.json')) {
        languages.push(c.name.substring(0, c.name.length - 5));
      }
    });
    if (languages.length) {
      arr.push(new LanguageDirectory(folderName, languages));
    }
  };
  findInFolder(__dirname + '/');
  return arr;
};

const escapeForRegex = (str) => str.replace(/[.*+\-?^${}()|\[\]\\]/g, '\\$&');

const searchKeys2 = (remaining, moreWork) => {
  let foundOkay = '';
  let foundProbablyNot = '';
  [...moreWork].forEach(e => {
    if (e.indexOf('.', 1) < 0) {
      return;
    }
    const foundNotOkay = e.endsWith('.');
    [...remaining].forEach(key => {
      if (key.startsWith(e)) {
        if (foundNotOkay) {
          foundProbablyNot += key + '\n';
        } else {
          foundOkay += key + '\n';
        }
        remaining.delete(key);
      }
    });
  });
  if (foundOkay) {
    console.log(MAGENTA + 'Probably used:\n' + foundOkay + NO_COLOR);
  }
  if (foundProbablyNot) {
    console.log(YELLOW + 'Could be used:\n' + foundProbablyNot + NO_COLOR);
  }
  if (remaining.size > 0) {
    console.log(RED + 'Investigate:\n' + [...remaining].join('\n') + '\n' + NO_COLOR);
  }
};

const searchKeys = () => {
  const filename = __dirname + '/../../'; // src directory
  const set = new Set();
  findFiles().forEach(elem => elem.getAllKeys((key) => set.add(key)));
  const wasPresent = new Set();
  const moreWork = new Set();
  exec('grep --include=\\*.html --include=\\*.ts --exclude=\\*.spec.ts -ohr "' + filename + '" -e "\'[^\']\\+\'"',
    (err, stdout, stderr) => {
      stdout.split('\n').forEach(e => {
        const key = e.substring(1, e.length - 1);
        if (set.delete(key)) {
          wasPresent.add(key);
        } else if (!wasPresent.has(key)) {
          moreWork.add(key);
        }
      });
      searchKeys2(set, moreWork);
    });
};

const sort = () => {
  findFiles().forEach(elem => elem.sort());
};

const addNew = (language) => {
  findFiles().forEach(elem => elem.addNew(language));
};

const findMissing = () => {
  findFiles().forEach(elem => {
    const str = elem.findMissing();
    if (str !== RED + NO_COLOR) {
      console.log('\n\n-------------------------\n' + elem.directory + '\n' + str);
    }
  });
};

const findUntranslated = (showAll) => {
  findFiles().forEach(elem => {
    const str = elem.findUntranslated(showAll);
    if (str) {
      console.log('\n\n-------------------------\n' + elem.directory + '\n' + str);
    }
  });
};


const args = process.argv.slice(2);

if (args.length < 1) {
  printHelp();
}

switch (args[0].toLowerCase()) {
  case 'sort':
    sort();
    break;
  case 'add-language':
    if (args.length < 2) {
      printHelp();
    }
    addNew(args[1]);
    break;
  case 'missing':
    findMissing();
    break;
  case 'untranslated':
    findUntranslated(args[1]?.toLowerCase() === '--show-all');
    break;
  case 'project-unused':
    searchKeys();
    break;
  default:
    printHelp();
    break;
}
