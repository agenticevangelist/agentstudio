# Backend environment setup

This folder is reserved for the Django backend.

## Virtual environment
Create a local venv inside this directory:

```bash
python3 -m venv .venv
```

Activate it:

```bash
source .venv/bin/activate
```

## Auto-activation options

- direnv (recommended):
  - Install direnv and hook it into your shell once (see https://direnv.net/)
  - Then run in this folder:
    ```bash
    direnv allow
    ```
  - The provided `.envrc` will automatically activate `.venv` when you enter this directory.

- zsh fallback (without direnv):
  Add this snippet to the end of your `~/.zshrc` (one-time):
  ```zsh
  # Auto-activate local .venv when cd'ing into a directory
  function auto_venv() {
    if [[ -f .venv/bin/activate ]]; then
      source .venv/bin/activate
    fi
  }
  autoload -U add-zsh-hook
  add-zsh-hook chpwd auto_venv
  # Also run for the current shell session
  auto_venv
  ```

## Next steps (later)
- Install backend requirements once we finalize versions:
  ```bash
  pip install -r requirements.txt
  ```
- Scaffold Django project here (not yet executed):
  ```bash
  django-admin startproject backend .
  ```
