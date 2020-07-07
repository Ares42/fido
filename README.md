# Fido

![](https://github.com/terrace-co/fido/workflows/ci/badge.svg)
![](https://github.com/terrace-co/fido/workflows/pre-commit/badge.svg)

## Contributing

### Configure your local repository

```sh
# Install Git LFS (large file storage).
git lfs install

# Enable Git LFS file locking verification
git config lfs.http://github.com/terrace-co/fido.git/info/lfs.locksverify true

# Pull files stored in Git LFS (necessary if lfs was installed after clone).
git lfs pull

# Install pre-commit into your git hooks (https://pre-commit.com).
pre-commit install
```

### Install project dependencies

```sh
npm install

cli/fido.js pull-secrets
```

### Local Development

```sh
cli/fido.js run-local
```

The run-local script will kick-off several processes:

1. Start any downstream local services (EG: Redis)
2. Compile + run the API Server (default: port 3000)
3. Compile + run the Fido Dev Server (default: port 8080)

You should see something like this:

```sh
👂 [fido] Serving on localhost:8080
✅ [server] Built successfully [0m 0s]
Server listening on port 3000
✅ [fido] Built successfully [0m 2s]
```

At this point all systems are up and running! You can visit
[localhost:8080](http://localhost:8080) to begin interacting with Fido locally.

Occasionally, you will need to actually test Fido locally as an unpacked chrome
extension. To do this you'll need to explicitly build Fido with
`cli/fido.js build` in addition to using `run-local` and you'll need to
load/update the unpacked extension at
[chrome://extensions](chrome://extensions).

### Pull Requests

Please submit all contributions via pull requests where your branch matches the
pattern `<username>/<branch-name>`.
