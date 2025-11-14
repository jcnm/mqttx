# GitHub Actions Workflows

This directory contains CI/CD workflows for the Sparkplug MQTT Platform.

## 📋 Available Workflows

### 1. **CI Pipeline** (`ci.yml`)
**Triggers:** All pushes and pull requests

**Jobs:**
- **Lint**: Runs Biome linter and formatter checks
- **Test**: Executes all unit and integration tests
- **Build**: Builds all 6 packages individually and collectively
- **Security**: Runs `pnpm audit` for vulnerability scanning
- **Summary**: Generates a comprehensive CI summary

**Status:** ✅ Active

---

### 2. **PR Checks** (`pr-checks.yml`)
**Triggers:** Pull request opened, synchronized, or reopened

**Jobs:**
- **PR Info**: Analyzes PR size and affected packages
- **Test Coverage**: Checks if changed files have corresponding tests
- **Dependencies**: Detects package.json changes
- **Breaking Changes**: Scans for breaking change markers
- **PR Comment**: Posts automated review comment

**Status:** ✅ Active

---

### 3. **Release** (`release.yml`)
**Triggers:** Version tags (e.g., `v1.0.0`)

**Jobs:**
- **Build and Test**: Full build and test suite
- **Create Release**: Generates GitHub release with changelog
- **Docker Build**: Builds Docker images for broker and UI
- **Notify**: Sends release notification

**Artifacts:**
- Release archives (`.tar.gz` and `.zip`) for each package
- Docker images

**Status:** ✅ Active

---

### 4. **CodeQL Security** (`codeql.yml`)
**Triggers:**
- Push to main/master/develop
- Pull requests
- Weekly schedule (Monday 6:00 UTC)

**Analysis:**
- JavaScript/TypeScript code scanning
- Security vulnerability detection
- Code quality checks

**Status:** ✅ Active

---

## 🚀 Quick Start

### Running Workflows Locally

You can test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run CI workflow
act -j lint
act -j test
act -j build

# Run PR checks
act pull_request
```

### Manual Workflow Triggers

Some workflows can be triggered manually from the GitHub Actions tab.

---

## 📊 Workflow Status Badges

Add these to your README.md:

```markdown
![CI](https://github.com/OWNER/REPO/actions/workflows/ci.yml/badge.svg)
![CodeQL](https://github.com/OWNER/REPO/actions/workflows/codeql.yml/badge.svg)
```

---

## 🔧 Configuration

### Required Secrets

For full functionality, configure these secrets in your GitHub repository:

**Optional (for Docker Hub push):**
- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

**Note:** Most workflows will run without secrets, but some features (like Docker push) require them.

---

## 📝 Workflow Customization

### Adding a New Job

1. Edit the appropriate workflow file
2. Add your job under the `jobs:` section
3. Define dependencies with `needs: [other-job]`
4. Test locally with `act`

Example:
```yaml
jobs:
  my-new-job:
    name: My Custom Job
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Run custom script
        run: ./scripts/my-script.sh
```

### Modifying Triggers

Edit the `on:` section:
```yaml
on:
  push:
    branches: ['main', 'develop']
    paths:
      - 'packages/**'
      - '.github/workflows/**'
  pull_request:
    branches: ['main']
```

---

## 🐛 Troubleshooting

### Workflow Failed

1. Check the Actions tab on GitHub
2. Click on the failed workflow run
3. Expand the failed job to see error logs
4. Common issues:
   - **Lint errors**: Run `pnpm check` locally
   - **Test failures**: Run `pnpm test` locally
   - **Build errors**: Run `pnpm build` locally

### Debugging Workflows

Add debug output:
```yaml
- name: Debug info
  run: |
    echo "Branch: ${{ github.ref }}"
    echo "Event: ${{ github.event_name }}"
    pwd
    ls -la
```

Enable debug logging:
- Repository Settings → Secrets → New secret
- Name: `ACTIONS_STEP_DEBUG`, Value: `true`

---

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [GitHub Actions Marketplace](https://github.com/marketplace?type=actions)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot)

---

## 🔄 Dependabot

Dependabot is configured in `.github/dependabot.yml` to:
- Check for npm dependency updates weekly
- Group updates by type (production, dev, TypeScript, testing)
- Auto-update GitHub Actions
- Ignore major version updates for stable dependencies

---

## ✅ Best Practices

1. **Keep workflows fast**: Use caching, parallel jobs, and minimal dependencies
2. **Fail fast**: Use `fail-fast: false` for matrix builds you want to complete
3. **Use artifacts**: Share build outputs between jobs
4. **Add summaries**: Use `$GITHUB_STEP_SUMMARY` for readable output
5. **Version pinning**: Pin action versions for reproducibility
6. **Security**: Never commit secrets; use GitHub Secrets

---

**Last Updated:** 2025-11-14
**Maintained By:** Development Team
