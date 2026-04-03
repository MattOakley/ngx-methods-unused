import { ParsedArgs } from 'minimist';

export interface RuntimeConfig {
  sourceRoots: string[];
  tsConfigFilePath: string;
  decorateOutput: boolean;
  // decorate cli
  // ci -mode , whatever
}

export type ClassType = 'Component' | 'Injectable' | 'Pipe' | 'Directive';

export interface MethodResult {
  fileName: string;
  directory: string;
  className: string;
  classType: ClassType;
  methodName: string;
}

export interface CliArgs extends ParsedArgs {
  help?: boolean;
  project?: string;
  sourceRoots?: string[];
  decorateOutput?: string;
}
