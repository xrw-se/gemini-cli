# Cherry-picking to Release Branches

This document describes the automated workflows available for cherry-picking changes from pull requests into release branches, which is essential for creating patch releases and hotfixes.

## Overview

There are two ways to cherry-pick a pull request into a release branch:

1. **Manual Workflow Trigger**: Use the GitHub Actions interface to manually trigger the cherry-pick workflow
2. **PR Comment Trigger**: Use a comment command directly on the pull request

## Manual Workflow Trigger

### Usage

1. Go to the [Actions tab](../../actions/workflows/cherry-pick-to-release.yml) in the repository
2. Click "Run workflow" on the "Cherry-pick to Release Branch" workflow
3. Fill in the required parameters:
   - **PR Number**: The number of the pull request to cherry-pick
   - **Target Release Branch**: The target release branch (e.g., `release/v0.2.0-preview.1` or `release/v0.2.0`)
   - **Create Patch Release**: Whether to create a new patch release branch
   - **Patch Version**: New patch version (required if creating patch release)

**Note**: The workflow will only appear in the Actions tab after the workflow files have been merged to the main branch.

### Examples

**Cherry-pick to existing release branch:**
- PR Number: `123`
- Target Release Branch: `release/v0.2.0`
- Create Patch Release: `false`

**Create new patch release:**
- PR Number: `123`
- Target Release Branch: `release/v0.2.0`
- Create Patch Release: `true`
- Patch Version: `v0.2.1`

## PR Comment Trigger

### Usage

Maintainers can trigger cherry-picking directly from a pull request by commenting with specific commands.

**Syntax:**
```
/cherry-pick to <target-branch> [--patch <version>]
```

### Examples

**Cherry-pick to existing release branch:**
```
/cherry-pick to release/v0.2.0
```

**Create new patch release:**
```
/cherry-pick to release/v0.2.0 --patch v0.2.1
```

### Permissions

Only users with the following GitHub permissions can trigger cherry-picks via comments:
- Repository members
- Repository owners
- Repository collaborators

## Workflow Behavior

### Successful Cherry-pick

When a cherry-pick is successful:

1. **For existing release branches**: A new branch is created with the cherry-picked changes, and a pull request is opened for review
2. **For new patch releases**: A new release branch is created with the format `release/<patch-version>`

### Cherry-pick Conflicts

When conflicts occur during cherry-picking:

1. The workflow automatically creates a GitHub issue with:
   - Details about the conflict
   - List of conflicting files
   - Step-by-step manual resolution instructions
   - The original PR author is tagged for assistance

2. The issue includes labels `cherry-pick-conflict` and `release` for easy tracking

### Manual Conflict Resolution

If you encounter a cherry-pick conflict, follow these steps:

1. Check out the target branch:
   ```bash
   git checkout <target-branch>
   ```

2. Cherry-pick the commit:
   ```bash
   git cherry-pick <commit-hash>
   ```

3. Resolve conflicts in the conflicting files

4. Complete the cherry-pick:
   ```bash
   git add .
   git cherry-pick --continue
   ```

5. Push the changes or create a pull request

## Integration with Release Process

This cherry-pick workflow integrates with the existing release process documented in [releases.md](releases.md):

### For Preview Releases

When cherry-picking to a preview release branch (`release/x.y.z-preview.n`):
- The changes will be included in the next preview release
- After release, merge the release branch back to the preview branch to keep version numbers current
- Cherry-pick the feature commit back to main

### For Stable Releases

When cherry-picking to a stable release branch (`release/x.y.z`):
- The changes will be included in the next patch release
- After release, merge the release branch back to main via PR to keep version numbers current

### Creating Patch Releases

Use the `--patch` option to create new patch release branches:
- The new branch follows the naming convention `release/<patch-version>`
- Version numbers should follow semantic versioning (increment patch version)
- The new branch can be used with the existing release workflow

## Monitoring and Troubleshooting

### Monitoring

- All cherry-pick operations are logged in the [Actions tab](../../actions/workflows/cherry-pick-to-release.yml)
- Successful operations include a summary with links to created branches/PRs
- Failed operations create issues for manual resolution

### Common Issues

1. **Target branch doesn't exist**: Ensure the release branch exists before cherry-picking
2. **Invalid PR number**: Verify the PR number is correct and the PR has been merged
3. **Permission denied**: Only repository maintainers can trigger cherry-picks via comments
4. **Cherry-pick conflicts**: Follow the manual resolution steps provided in the auto-created issue

## Best Practices

1. **Review before merging**: Always review cherry-picked changes before merging, even if the cherry-pick was automatic
2. **Test thoroughly**: Patch releases should be tested to ensure the cherry-picked changes work correctly in the release context
3. **Document changes**: Update release notes and documentation as appropriate
4. **Coordinate with team**: Communicate with the team when creating patch releases to avoid conflicts

## Examples

### Hotfix Scenario

A critical bug is found in the current stable release `v0.2.0`. A fix has been merged in PR #456.

1. Comment on PR #456:
   ```
   /cherry-pick to release/v0.2.0 --patch v0.2.1
   ```

2. The workflow creates branch `release/v0.2.1` with the fix

3. Use the release workflow to deploy `v0.2.1`

### Preview Release Patch

A issue is found in preview release `v0.3.0-preview.0`. A fix has been merged in PR #789.

1. Comment on PR #789:
   ```
   /cherry-pick to release/v0.3.0-preview.0 --patch v0.3.0-preview.1
   ```

2. The workflow creates branch `release/v0.3.0-preview.1` with the fix

3. Use the release workflow to deploy the updated preview release
