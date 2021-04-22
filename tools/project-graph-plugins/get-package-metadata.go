package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os/exec"
	"strings"
)

type module struct {
	Path string `json:"Path"`
}

// Check https://golang.org/pkg/cmd/go/internal/list/ from available fields
type pkg struct {
	Module      *module  `json:"Module,omitempty"`
	ImportPath  string   `json:"ImportPath"`
	Deps        []string `json:"Deps"`
	GoFiles     []string `json:"GoFiles"`
	TestGoFiles []string `json:"TestGoFiles"`
}

const workspaceGoModName = "github.com/nrwl/nx-go-project-graph-plugin"

func main() {
	listOutput, err := exec.Command("go", "list", "-json", "all").Output()

	if err != nil {
		log.Fatalf("failed fetching dependencies from go list: %v", err)
	}

	decoder := json.NewDecoder(bytes.NewReader(listOutput))

	packages := make([]pkg, 0)

	for {
		var p pkg

		if err := decoder.Decode(&p); err != nil {
			if err == io.EOF {
				break
			}

			log.Fatalf("reading go list output: %v", err)
		}

		// We only care about first party code for this dependency-graph use-case
		if p.Module != nil && p.Module.Path == workspaceGoModName {
			// Ignore anything from directories we know are not relevant
			if strings.HasPrefix(p.ImportPath, workspaceGoModName+"/dist") || strings.HasPrefix(p.ImportPath, workspaceGoModName+"/tools") || strings.HasPrefix(p.ImportPath, workspaceGoModName+"/surfaces") || strings.HasPrefix(p.ImportPath, workspaceGoModName+"/node_modules") {
				continue
			}

			filteredDeps := []string{}
			for d := range p.Deps {
				// Filter out any third party deps
				if strings.HasPrefix(p.Deps[d], workspaceGoModName) {
					filteredDeps = append(filteredDeps, p.Deps[d])
				}
			}
			p.Deps = filteredDeps
			packages = append(packages, p)
		}
	}

	json, err := json.Marshal(packages)

	if err != nil {
		log.Fatalf("failed marshaling packages: %v", err)
	}

	fmt.Println(string(json))
}
