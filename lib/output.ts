import { relative } from 'path';
import { cwd, stdout } from 'process';
import { MethodResult } from './types.js';

export const CLI_DECORATOR = '[ngx-unused]';

export function usage() {
  stdout.write('ngx-unused-methods <directory> -p <tsconfig-file>\n');
  stdout.write('Invoke ngx-unused --help for more details\n');
}

export function help() {
  stdout.write(`ngx-unused-methods - find unused methods in Angular codebase


	\rUsage: ngx-unused-methods <directory> [-p | --project] <tsconfig-file>
	
	\r<directory>     - directory to be scanned
	\r                  to scan multiple directories pass names separated by space
	\r                  (usages of classes from source roots will be also searched in source roots)
	
	\r<tsconfig-file> - main tsconfig file
  \r                  should be one containing @paths definitions
  \r                  for NX projects its usually tsconfig.base.json\n

Options:
 \r-p | --project <tsconfigfile>  - tsconfig file path (required) 
 \r-h | --help                    - print this help
Source root directories and tsconfig file must be under the same root directory.

Examples:
ngx-unused-methods . -p tsconfig.base.json
ngx-unused-methods  libs apps/my-app -p tsconfig.base.json
`);
}

export function invalidTsConfig() {
  stdout.write("Provided tsconfig file doesn't exists\n"); //eslint-disable-line
}

export function printNoFiles() {
  stdout.write('No relevant .ts files found in provided source root(s)\n');
}

export function print(content: string, progress: boolean = false) {
  if (stdout.isTTY) {
    if (progress) {
      stdout.write('\r');
    }
    stdout.write(`${CLI_DECORATOR} `);
  }

  stdout.write(content);
}

export function printResults(results: MethodResult[]) {
  if (results.length === 0) {
    print('No unused Angular methods found\n');
    return;
  }

  let output = '';
  const groupedResults = results.reduce((grouped, result) => {
    const groupName = `${relative(cwd(), result.directory)}/${result.fileName}`;
    if (grouped[groupName] !== undefined) {
      grouped[groupName]?.push(result);
    } else {
      grouped[groupName] = [result];
    }
    return grouped;
  }, {} as Record<string, MethodResult[] | undefined>);

  Object.entries(groupedResults).map((group) => {
    output += group[0];
    output += '\n';
    output +=
      group[1]
        ?.map((result) => `- ${result.className}.${result.methodName}\n`)
        .join('') + '\n';
  });
  output += '\n\n';
  stdout.write('\n');
  print(`${results.length} (probably) unused methods\n`);
  stdout.write(output);
}
