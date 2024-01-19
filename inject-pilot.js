#!/usr/bin/env node
import {
    createProject,
    editImports,
    getClasses,
    getConstructors,
    getImports,
    getParams,
    NgMorphTree, saveActiveProject,
    setActiveProject,
} from 'ng-morph';
import chalk from 'chalk';
import ora from 'ora';

const spinner = ora({
    spinner: 'bluePulse',
});

async function injectPilot() {
    console.log(chalk.magenta(`
============================================
💉 inject-it: Dependency Injection Migration
============================================
`));
    spinner.start('Migrating to inject');
    setActiveProject(
        createProject(new NgMorphTree(), '/', ['**/*.ts', '**/*.json'])
    );

    const components = getClasses('**/*.ts', {
        name: '*Component',
    });

    components.forEach((component) => {
        const constructorParams = getParams(getConstructors(component));
        if (constructorParams.length === 0) {
            return;
        }

        fixInjectImport(component.getSourceFile().getFilePath());

        component.insertProperties(
            0,
            constructorParams.map((param) => ({
                name: param.getName(),
                type: param.getTypeNode()?.getText(),
                isReadonly: param.isReadonly(),
                scope: param.getScope(),
                initializer: getInjectStatement(param)
            }))
        );

        constructorParams.forEach((param) => {
            param.remove();
        });
    });

    saveActiveProject();

    spinner.succeed('Successfully migrated all components.');
    console.log(chalk.bgGreen.white(`
💉 inject-it: ✅ Successfully migrated all components.
`));
    console.log(chalk.magenta(`
=====================================================
`));
}

function getInjectStatement(param) {
    const injectOptions = convertToInjectOptions(param.getDecorators());
    return `inject(${param.getDecorator('Inject')?.getArguments()[0].getText() ?? param.getTypeNode()?.getText()}${Object.keys(injectOptions).length !== 0 ? `,${stringifyObjectWithoutQuotes(injectOptions)})` : ')'}`;
}

function convertToInjectOptions(decorators) {
    return decorators.reduce((acc, currentDecorator) => {
        switch (currentDecorator.getText()) {
            case '@Optional()':
                return {...acc, optional: true}
            case '@Self()':
                return {...acc, self: true}
            case '@SkipSelf()':
                return {...acc, skipSelf: true}
            case '@Host()':
                return {...acc, host: true}
            default:
                return acc;
        }
    }, {})

}

function stringifyObjectWithoutQuotes(obj) {
    const keyValuePairs = Object.entries(obj).map(([key, value]) => {
        let formattedValue = value;
        if (typeof value === 'string') {
            formattedValue = `'${value}'`;
        }
        return `${key}: ${formattedValue}`;
    });
    return `{\n${keyValuePairs.join(',\n')}\n}`;
}

function fixInjectImport(file) {
    const angularCoreImports = getImports(file, {
        moduleSpecifier: '@angular/core',
    });

    if (!isInjectImported(angularCoreImports)) {
        // if @angular/core has more than one import statement, then add 'inject' import into the first statement
        const firstCoreImportStatement =
          angularCoreImports.length > 1
            ? angularCoreImports[0]
            : angularCoreImports;
    
        editImports(firstCoreImportStatement, (entity) => ({
          namedImports: [...entity.namedImports, "inject"],
        }));
    }
}

/**
 * Checks whether the 'inject' fn is already imported in the file.
 * 
 * @param {*} angularCoreImports - array of all "@angular/core" imports in the file
 * @returns boolean - value that confirms if 'inject' is already imported or not
 */
function isInjectImported(angularCoreImports) {
    return angularCoreImports.find((coreImport) =>
      coreImport
        .getNamedImports()
        .find((namedImport) => namedImport.getName() == "inject")
    );
  }

try {
    await injectPilot();
} catch (e) {
    spinner.fail('Failed to migrate components.');
    console.error(e)
}
