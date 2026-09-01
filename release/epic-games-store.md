# Publishing the itch app on the Epic Games Store

We upload the itch-setup bootstrapper as the "game", not the full app. Epic's
launcher runs itch-setup, which installs the real app and keeps it updated
through our own channels. Store updates are only needed when itch-setup changes.

Uploads use Epic's BuildPatchTool (BPT). It has a native Linux binary, so no
Windows machine or Wine is needed.

## Prerequisites

1. BuildPatchTool: download from the Dev Portal Library Items page. The binary
   is `Engine/Binaries/Linux/BuildPatchTool`.
2. `bpt_creds` file (kept outside this repo), one `KEY="value"` per line:

   ```
   BPT_CLIENT_ID="..."
   BPT_CLIENT_SECRET="..."
   ORGANIZATION_ID="..."
   PARMESAN_PRODUCT_ID="..."
   LIBRARY_PARMESAN_STAGING_ID="..."
   LIBRARY_PARMESAN_PRODUCTION_ID="..."
   ```

   `LIBRARY_*` are the library item IDs from the Dev Portal; BPT calls them
   ArtifactId. The client credentials come from the "BPT credentials" tab in
   Product Settings.

Setup for all commands below:

```sh
set -a; source /path/to/bpt_creds; set +a
BPT=/path/to/BuildPatchTool_1.8.8/Engine/Binaries/Linux/BuildPatchTool
CREDS=(
  -OrganizationId="$ORGANIZATION_ID"
  -ProductId="$PARMESAN_PRODUCT_ID"
  -ArtifactId="$LIBRARY_PARMESAN_PRODUCTION_ID"
  -ClientId="$BPT_CLIENT_ID"
  -ClientSecretEnvVar=BPT_CLIENT_SECRET
)
```

## Check current state

```sh
"$BPT" -mode=ListBinaries "${CREDS[@]}"
```

Add `-OutputFile=binaries.json` for JSON with signed manifest URLs. To inspect
an uploaded binary's launch config and file list, download its manifest URL and
run `"$BPT" -mode=ExtractMetaData -InputFile=x.manifest -OutputFile=x.json`.

## Upload Windows

```sh
mkdir buildroot-win64
curl -sL https://broth.itch.zone/itch-setup/windows-amd64/LATEST/archive.zip -o win64.zip
unzip -d buildroot-win64 win64.zip   # contains itch-setup.exe

"$BPT" -mode=UploadBinary "${CREDS[@]}" \
  -BuildRoot="$PWD/buildroot-win64" \
  -BuildVersion="itch-setup-X.Y.Z-win64" \
  -AppLaunch="itch-setup.exe" \
  -AppArgs="--prefer-launch" \
  -CloudDir="$PWD/clouddir"
```

- Add `-DryRun` first to validate without uploading.
- `--prefer-launch` is required. Epic runs the exe on every launch; without it
  itch-setup shows the installer window every time.
- `BuildVersion` must be unique per artifact across all platforms. Allowed
  characters: `a-z A-Z 0-9 . + - _`. No spaces.
- `-CloudDir` is scratch space, delete afterwards.

## Upload Mac

Upload the signed `Install itch.app` from the install-itch DMG. Not the DMG
itself: Epic installs raw files and cannot mount disk images. The bundle's
itch-setup is universal (x86_64 + arm64), one upload covers both.

```sh
curl -sL https://broth.itch.zone/install-itch/darwin-universal/LATEST/archive.zip -o mac.zip
unzip mac.zip                        # contains Install itch.dmg
mkdir buildroot-mac && cd buildroot-mac
7z x "../Install itch.dmg"           # extracts Install itch.app
cd ..

# Mark the binary executable (we upload from Linux). \r\n ending required.
printf '"Install itch.app/Contents/MacOS/itch-setup" executable\r\n' > mac-attributes.txt

"$BPT" -mode=UploadBinary "${CREDS[@]}" \
  -BuildRoot="$PWD/buildroot-mac" \
  -BuildVersion="itch-setup-X.Y.Z-mac" \
  -AppLaunch="Install itch.app/Contents/MacOS/itch-setup" \
  -AppArgs="--prefer-launch" \
  -FileAttributeList="$PWD/mac-attributes.txt" \
  -CloudDir="$PWD/clouddir-mac"
```

Before going live, check with ExtractMetaData that itch-setup has
`IsExecutable: true`.

## Go live

Uploading changes nothing for users until the Live label points at the binary:

```sh
"$BPT" -mode=LabelBinary "${CREDS[@]}" \
  -BuildVersion="itch-setup-X.Y.Z-win64" \
  -Label="Live" \
  -Platform="Windows"    # or "Mac"
```

Applying Live demotes the previous live binary to Rollback and unlabels the old
rollback. To roll back, point Live at the previous version.

Verify with ListBinaries.
