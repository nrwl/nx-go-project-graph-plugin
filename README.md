# Nx Go Project Graph Plugin

This repo is an example implementation of a project graph plugin. In this example, we will be adding dependencies between the Go projects in this repo to Nx's Project Graph.

The Project Graph Plugin is defined in [`nx.json`](./nx.json) as a _plugin_.
This can also be defined using an npm package name.

> Prerequisite: You need to have [Go](https://golang.org/) installed to run this repo.

## Seeing the `ProjectGraph`

Running `nx dep-graph` shows the following graph.

<p style="text-align: center;"><img src="https://raw.githubusercontent.com/nrwl/nx-go-project-graph-plugin/master/docs/assets/project-graph.png" width="600" alt="Nx Project Graph"></p>

## How it works

1. The plugin is a JavaScript function exported as `processProjectGraph` [here](./tools/project-graph-plugins/go-project-graph.js). It takes in the current `ProjectGraph` and some context.
2. The plugin first creates a `ProjectGraphBuilder` from the current graph which helps iteratively mutate the graph.
3. The plugin then runs a [Go script](./tools/project-graph-plugins/get-package-metadata.go) which eventually outputs project dependencies as JSON.
4. The Go script runs the `go list -json all` command which lists all of the different projects as well as the dependencies that they have.
5. Then this list is filtered down to only the projects in this repo (not external Go dependencies).
6. When the [JavaScript function](./tools/project-graph-plugins/go-project-graph.js) gets the result back, it maps the Go project names to the Nx project names.
7. Then, the plugin calls the `ProjectGraphBuilder.addDependency` function to add the dependencies of each project to the `ProjectGraph`.
8. Finally, the plugin returns `ProjectGraphBuilder.getProjectGraph()` which is the mutated `ProjectGraph`.

## Bonus: Running the Go projects

Like any other Nx project, the following commands work:

- `nx build executables-cmd-hello`
  - Builds the Hello Command
  - If you run this twice, the result will be cached!
- `nx test libs-pkg-hello`
  - Tests the Hello lib
