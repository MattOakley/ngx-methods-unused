import { Project } from 'ts-morph';
import { findUnusedMethods } from '../lib/findUsages/findUnusedMethods.js';

describe('findUnusedMethods', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // ES2020
        module: 6, // ES2020
        strict: true,
      },
    });
  });

  it('should find unused methods in services', () => {
    // Create a service with used and unused methods
    const serviceFile = project.createSourceFile(
      'service.ts',
      `
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class TestService {
	usedMethod(): string {
		return 'used';
	}

	unusedMethod(): string {
		return 'unused';
	}

	privateMethod(): void {
		// private methods are considered used if called internally
	}
}
			`
    );

    // Create a component that uses the service method
    const componentFile = project.createSourceFile(
      'component.ts',
      `
import { Component } from '@angular/core';
import { TestService } from './service';

@Component({
	selector: 'app-test',
	template: ''
})
export class TestComponent {
	constructor(private service: TestService) {}

	ngOnInit() {
		this.service.usedMethod();
	}
}
			`
    );

    const sourceFiles = project.getSourceFiles();
    const results = findUnusedMethods(sourceFiles);

    expect(results).toHaveLength(2);
    const methodNames = results.map((r) => r.methodName).sort();
    expect(methodNames).toEqual(['privateMethod', 'unusedMethod']);
    expect(results[0].className).toBe('TestService');
  });

  it('should not find methods that are used', () => {
    const serviceFile = project.createSourceFile(
      'service.ts',
      `
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class TestService {
	usedMethod(): string {
		return 'used';
	}
}
			`
    );

    const componentFile = project.createSourceFile(
      'component.ts',
      `
import { Component } from '@angular/core';
import { TestService } from './service';

@Component({
	selector: 'app-test',
	template: ''
})
export class TestComponent {
	constructor(private service: TestService) {}

	ngOnInit() {
		this.service.usedMethod();
	}
}
			`
    );

    const sourceFiles = project.getSourceFiles();
    const results = findUnusedMethods(sourceFiles);

    expect(results).toHaveLength(0);
  });

  it('should ignore spec files', () => {
    const serviceFile = project.createSourceFile(
      'service.ts',
      `
import { Injectable } from '@angular/core';

@Injectable({
	providedIn: 'root'
})
export class TestService {
	method(): void {}
}
			`
    );

    // Create a spec file that uses the method
    const specFile = project.createSourceFile(
      'service.spec.ts',
      `
import { TestService } from './service';

describe('TestService', () => {
	let service: TestService;

	beforeEach(() => {
		service = new TestService();
	});

	it('should call method', () => {
		service.method();
	});
});
			`
    );

    const sourceFiles = project.getSourceFiles();
    const results = findUnusedMethods(sourceFiles);

    // Should still find it as unused because spec files are ignored
    expect(results).toHaveLength(1);
    expect(results[0].methodName).toBe('method');
  });

  it('should ignore unused methods in components (for now)', () => {
    const componentFile = project.createSourceFile(
      'component.ts',
      `
import { Component } from '@angular/core';

@Component({
	selector: 'app-test',
	template: '<button (click)="usedMethod()">Click</button>'
})
export class TestComponent {
	usedMethod(): void {
		console.log('used');
	}

	unusedMethod(): void {
		console.log('unused');
	}
}
			`
    );

    const sourceFiles = project.getSourceFiles();
    const results = findUnusedMethods(sourceFiles);

    expect(results).toHaveLength(1);
    expect(results[0].methodName).toBe('unusedMethod');
    expect(results[0].className).toBe('TestComponent');
    expect(results[0].classType).toBe('Component');
  });
});
