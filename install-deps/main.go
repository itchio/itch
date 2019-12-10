package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/itchio/headway/united"
	"github.com/itchio/savior"
	"github.com/itchio/savior/zipextractor"
)

type NpmManifest struct {
	Butler struct {
		Development string `json:"development"`
		Production  string `json:"production"`
	} `json:"butler"`
}

type VersionOutput struct {
	Value struct {
		Version string `json:"version"`
		Commit  string `json:"commit"`
	} `json:"value"`
}

func main() {
	args := os.Args[1:]
	targetOS := runtime.GOOS
	targetArch := runtime.GOARCH
	manifestPath := ""
	environment := ""
	dir := ""
	var err error

	for i := 0; i < len(args); i++ {
		arg := args[i]

		switch arg {
		case "--development":
			environment = "development"
		case "--production":
			environment = "production"
		case "--os":
			i += 1
			targetOS = args[i]
		case "--arch":
			i += 1
			targetArch = args[i]
		case "--dir":
			i += 1
			dir = args[i]
		case "--manifest":
			i += 1
			manifestPath = args[i]
		default:
			log.Fatalf("Unknown command-line argument: %q", arg)
		}
	}

	if manifestPath == "" {
		log.Fatalf("Missing manifest path, use: --manifest path/to/package.json")
	}
	manifestPath, err = filepath.Abs(manifestPath)
	must(err)

	if dir == "" {
		log.Fatalf("Missing dir path, use: --dir path/to/application/")
	}
	dir, err = filepath.Abs(dir)
	must(err)

	if environment == "" {
		log.Fatalf("Missing environment, use --development or --production")
	}
	validateOSArch(targetOS, targetArch)

	butlerDir := filepath.Join(dir, "deps", "butler")
	butlerExePath := filepath.Join(butlerDir, "butler"+exeExt())
	manifestContents, err := ioutil.ReadFile(manifestPath)
	must(err)

	var manifest NpmManifest
	err = json.Unmarshal(manifestContents, &manifest)
	must(err)

	version := ""
	if environment == "development" {
		version = manifest.Butler.Development
	} else {
		version = manifest.Butler.Production
	}
	if version == "" {
		marshalled, _ := json.MarshalIndent(manifest, "", "  ")
		log.Printf("Note: parsed manifest was:\n%s", string(marshalled))
		log.Fatalf("Missing %s butler version in manifest %q", environment, manifestPath)
	}

	log.Printf("           dir: (%s)", dir)
	log.Printf("      manifest: (%s)", manifestPath)
	log.Printf("butler version: (%s)", version)

	grabButler := func() {
		suffix := ""
		if environment == "development" {
			suffix = "-head"
		}

		url := fmt.Sprintf("https://broth.itch.ovh/butler/%s-%s%s/%s/.zip", targetOS, targetArch, suffix, version)
		log.Printf("Source URL: (%s)", url)

		log.Printf("Downloading butler zip...")
		res, err := http.Get(url)
		must(err)

		zipPayload, err := ioutil.ReadAll(res.Body)
		must(err)

		log.Printf("Extracting butler zip...")
		ze, err := zipextractor.New(bytes.NewReader(zipPayload), int64(len(zipPayload)))
		must(err)

		sink := &savior.FolderSink{
			Directory: butlerDir,
		}
		zres, err := ze.Resume(nil, sink)
		must(err)

		log.Printf("Extracted %s, %d entries", united.FormatBytes(zres.Size()), len(zres.Entries))
	}

	isExpectedVersion := func() bool {
		cmd := exec.Command(butlerExePath, "--json", "version")
		out, err := cmd.CombinedOutput()
		if err != nil {
			// missing or something
			log.Printf("warn: in version check: %s", err)
			return false
		} else {
			var vo VersionOutput
			err = json.Unmarshal(out, &vo)
			if err != nil {
				log.Printf("warn: in version check: %s", err)
				return false
			}

			log.Printf("found butler version (%s), ref (%s)", vo.Value.Version, vo.Value.Commit)
			if environment == "development" {
				return vo.Value.Commit == version
			} else {
				return vo.Value.Version == version
			}
		}
	}

	_, err = os.Stat(butlerExePath)
	if err != nil {
		log.Printf("No file at (%s)", butlerExePath)
		grabButler()
	} else {
		if !isExpectedVersion() {
			grabButler()
		}
	}
}

func must(err error) {
	if err != nil {
		log.Fatalf("%+v", err)
	}
}

func exeExt() string {
	if runtime.GOOS == "windows" {
		return ".exe"
	}
	return ""
}

func validateOSArch(os string, arch string) {
	validCombos := []string{
		"windows-386",
		"windows-amd64",
		"linux-amd64",
		"darwin-amd64",
	}
	combo := fmt.Sprintf("%s-%s", os, arch)

	found := false
	for _, validCombo := range validCombos {
		if combo == validCombo {
			found = true
		}
	}

	if !found {
		log.Fatalf("Unsupported os-arch combo %q. Valid combos are: %+v", combo, validCombos)
	}
}
