import { MethodDeclaration, SourceFile } from 'ts-morph';
import { RELEVANT_DECORATOR_NAMES } from '../constants.js';
import { ClassType } from '../types.js';
import { stdout } from 'process';
import { print } from '../output.js';

export interface MethodResult {
  fileName: string;
  directory: string;
  className: string;
  classType: ClassType;
  methodName: string;
}

export function findUnusedMethods(sourceFiles: SourceFile[]): MethodResult[] {
  const angularClasses = sourceFiles
    .filter((file) => !file.getBaseName().includes('.spec.ts'))
    .flatMap((file) => file.getClasses())
    .filter((declaration) => {
      const decorator = declaration.getDecorator((decorator) =>
        RELEVANT_DECORATOR_NAMES.includes(decorator.getFullName() as ClassType)
      );
      return decorator !== undefined;
    });

  const methods = angularClasses.flatMap((angularClass) =>
    angularClass.getMethods().map((method) => ({
      method,
      angularClass,
      decorator: angularClass.getDecorator((decorator) =>
        RELEVANT_DECORATOR_NAMES.includes(decorator.getFullName() as ClassType)
      )!,
    }))
  );

  return methods
    .filter((x, index, { length }) => {
      const percentage = Math.round(((index + 1) / length) * 100);
      if (stdout.isTTY) {
        print(`Analyzing ${index + 1}/${length} (${percentage}%)`, true);
        if (index === length - 1) stdout.write('\n');
      }
      return !isMethodUsed(x.method);
    })
    .map(({ method, angularClass, decorator }) => ({
      fileName: angularClass.getSourceFile().getBaseName(),
      directory: angularClass
        .getSourceFile()
        .getDirectory()
        .getPath()
        .toString(),
      className: angularClass.getName() ?? '',
      classType: decorator.getFullName() as ClassType,
      methodName: method.getName(),
    }));
}

function isMethodUsed(method: MethodDeclaration): boolean {
  const references = method.findReferencesAsNodes();
  return references.some((node) => {
    const sourceFile = node.getSourceFile();
    return (
      !sourceFile.isDeclarationFile() &&
      !sourceFile.getBaseName().includes('.spec.ts') &&
      !isInMethodDeclaration(node)
    );
  });
}

function isInMethodDeclaration(node: any): boolean {
  // Check if the reference is in the method's own declaration
  return node.getAncestors().some(
    (ancestor: any) => ancestor.getKind() === 152 // MethodDeclaration
  );
}
