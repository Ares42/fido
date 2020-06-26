# Fido

## Contributing

### Install Dependencies

- [pre-commit]: used to configure Git hooks
- [prettier]: used to lint + auto format files

[pre-commit]: https://pre-commit.com/#install
[prettier]: https://prettier.io/docs/en/install.html

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

### Building

```
cli/fido.js build --help
```

### Pull Requests

Please submit all contributions via pull requests where your branch matches the
pattern `<username>/<branch-name>`.
