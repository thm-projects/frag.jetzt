import { readdir, readFile } from 'fs';
import * as ts from 'typescript';
import { ScriptTarget } from 'typescript';

class FileSearcher {
  static findFile(baseDir, extension, callback: (files: string[]) => void, finishedCallback: () => void) {
    extension = extension.toLowerCase();
    readdir(baseDir, { withFileTypes: true }, (err, files) => {
      if (err) {
        console.error(err);
        return;
      }
      let count = 1;
      let finished = 0;
      const result = [];
      files.forEach(file => {
        if (file.isFile() && file.name.toLowerCase().endsWith(extension)) {
          result.push(baseDir + file.name);
        } else if (file.isDirectory()) {
          count += 1;
          this.findFile(baseDir + file.name + '/', extension, (newFiles) => {
            callback(newFiles);
          }, () => {
            finished += 1;
            if (finished === count) {
              finishedCallback();
            }
          });
        }
      });
      callback(result);
      if (--count === finished) {
        finishedCallback();
      }
    });
  }

  static analyzeComponent(file: string) {
    readFile(file, { encoding: 'utf-8' }, (err, data) => {
      if (err) {
        console.error(err);
        return;
      }
      const matches = data.match(/{{([^}]+)}}/g) ?? [];
      for (const elem of matches) {
        const hit = elem.substring(2, elem.length - 2);
        if (hit.includes('translate')) {
          this.analyzeHTML(ts.createSourceFile(
            file,
            hit,
            ts.ScriptTarget.ES2015,
            /*setParentNodes */ true
          ));
        }
      }
    });
  }

  static analyzeHTML(sourceFile: ts.SourceFile) {
    // Expression => Block | Identifier (translate: {} | translate: elem) ignorieren
    sourceFile.statements.forEach(node => {
      let success = false;
      console.log(ts.SyntaxKind[node.kind], node.getText());
      if (node.kind === ts.SyntaxKind.ExpressionStatement) {
        const stmt = node as ts.ExpressionStatement;
        console.log(ts.SyntaxKind[stmt.expression.kind], stmt.expression.getText());
        if (stmt.expression.kind === ts.SyntaxKind.BinaryExpression) {
          const expr = stmt.expression as ts.BinaryExpression;
          if (expr.right.kind === ts.SyntaxKind.Identifier && (expr.right as ts.Identifier).escapedText === 'translate') {
            if (expr.left.kind === ts.SyntaxKind.StringLiteral) {
              success = true;
              keys.push((expr.left as ts.StringLiteral).text);
            }
          }
        }
      }
      if (!success) {
        console.log(sourceFile.getText());
      }
    });
  }
}

export const delint = (sourceFile: ts.SourceFile) => {
  const report = (node: ts.Node, message: string) => {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    console.log(`${sourceFile.fileName} (${line + 1},${character + 1}): ${message}`);
  };
  const delintNode = (node: ts.Node) => {
    console.log(node, ts.SyntaxKind[node.kind]);
    switch (node.kind) {
      case ts.SyntaxKind.ForStatement:
      case ts.SyntaxKind.ForInStatement:
      case ts.SyntaxKind.WhileStatement:
      case ts.SyntaxKind.DoStatement:
        if ((node as ts.IterationStatement).statement.kind !== ts.SyntaxKind.Block) {
          report(
            node,
            'A looping statement\'s contents should be wrapped in a block body.'
          );
        }
        break;

      case ts.SyntaxKind.IfStatement:
        const ifStatement = node as ts.IfStatement;
        if (ifStatement.thenStatement.kind !== ts.SyntaxKind.Block) {
          report(ifStatement.thenStatement, 'An if statement\'s contents should be wrapped in a block body.');
        }
        if (
          ifStatement.elseStatement &&
          ifStatement.elseStatement.kind !== ts.SyntaxKind.Block &&
          ifStatement.elseStatement.kind !== ts.SyntaxKind.IfStatement
        ) {
          report(
            ifStatement.elseStatement,
            'An else statement\'s contents should be wrapped in a block body.'
          );
        }
        break;

      case ts.SyntaxKind.BinaryExpression:
        const op = (node as ts.BinaryExpression).operatorToken.kind;
        if (op === ts.SyntaxKind.EqualsEqualsToken || op === ts.SyntaxKind.ExclamationEqualsToken) {
          report(node, 'Use \'===\' and \'!==\'.');
        }
        break;
    }

    ts.forEachChild(node, delintNode);
  };

  delintNode(sourceFile);
};

const d = process.argv[2];
if (!d) {
  console.log('Kein Ordner angegeben!');
  process.exit(1);
}
const dir = d.endsWith('/') ? d : d + '/';

FileSearcher.analyzeHTML(ts.createSourceFile('d', '"text" | translate: { hallo: 1 }', ScriptTarget.ES2015, true));

process.exit(0);
FileSearcher.findFile(dir, '.component.html', (files) => {
  files.forEach(file => FileSearcher.analyzeComponent(file));
}, () => console.log('finished'));
