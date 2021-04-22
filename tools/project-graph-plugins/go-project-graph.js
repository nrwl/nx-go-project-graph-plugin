// @ts-check
const { DependencyType, ProjectGraphBuilder } = require('@nrwl/devkit');
const execa = require('execa');
const { join } = require('path');

/**
 * Nx Project Graph plugin for go
 *
 * @param {import('@nrwl/devkit').ProjectGraph} graph
 * @param {import('@nrwl/devkit').ProjectGraphProcessorContext} _context
 * @returns {import('@nrwl/devkit').ProjectGraph}
 */
exports.processProjectGraph = (graph, _context) => {
  const builder = new ProjectGraphBuilder(graph);

  const completedSubprocess = execa.sync('go', [
    'run',
    join(__dirname, 'get-package-metadata.go'),
  ]);

  const firstPartyData = JSON.parse(completedSubprocess.stdout);
  const workspaceGoModule = firstPartyData[0].Module.Path;

  for (const pkg of firstPartyData) {
    const projectName = deriveNxProjectNameFromGoImportPath(
      workspaceGoModule,
      pkg.ImportPath
    );

    for (const depImportPath of pkg.Deps) {
      const depProjectName = deriveNxProjectNameFromGoImportPath(
        workspaceGoModule,
        depImportPath
      );
      builder.addDependency(DependencyType.static, projectName, depProjectName);
    }
  }

  return builder.getProjectGraph();
};

function deriveNxProjectNameFromGoImportPath(
  workspaceGoModule,
  goPackageImportPath
) {
  return `${goPackageImportPath
    .replace(`${workspaceGoModule}/`, '')
    .replace(/\//g, '-')}`;
}
