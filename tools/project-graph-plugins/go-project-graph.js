// @ts-check
const { ProjectGraphBuilder } = require('@nrwl/devkit');
const execa = require('execa');
const { join } = require('path');

/**
 * Nx Project Graph plugin for go
 *
 * @param {import('@nrwl/devkit').ProjectGraph} graph
 * @param {import('@nrwl/devkit').ProjectGraphProcessorContext} context
 * @returns {import('@nrwl/devkit').ProjectGraph}
 */
exports.processProjectGraph = (graph, context) => {
  // This is an example so the `context` is not used for simplicity.
  // Let's take a look at some stuff that is included though.

  // The `workspace` property in `context` has the different projects in the workspace.
  // console.log(context.workspace);

  // The `fileMap` property in `context` has the files that belong to the different projects in the workspace
  // This only has files that need to be re-processsed because they've changed.
  // If you uncomment the next line and make a change in `./executables/cmd/hello/main.go`..
  // You will see that only that file shows up in the fileMap because other files do not need to be reprocessed.
  // console.log(context.fileMap);

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
      for (const file of pkg.GoFiles) {
        builder.addExplicitDependency(projectName, join(graph.nodes[projectName].data.root, file), depProjectName);
      }
    }
  }

  return builder.getUpdatedProjectGraph();
};

function deriveNxProjectNameFromGoImportPath(
  workspaceGoModule,
  goPackageImportPath
) {
  return `${goPackageImportPath
    .replace(`${workspaceGoModule}/`, '')
    .replace(/\//g, '-')}`;
}
