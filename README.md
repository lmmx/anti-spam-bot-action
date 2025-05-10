# Spam Filter Action

A reusable GitHub Action to automatically **delete** or **hide** comments matching exact messages or from specified users, with built-in defaults.

## Inputs

| Input                       | Description                                                                     | Required | Default                          |
| --------------------------- | ------------------------------------------------------------------------------- | -------- | -------------------------------- |
| `repo-token`                | GitHub token (usually `${{ secrets.GITHUB_TOKEN }}`).                           | yes      |                                  |
| `mode`                      | Action to take: `delete` or `hide`.                                             | yes      | `delete`                         |
| `disable-default-blocklist` | Set to `true` to ignore the built-in defaults entirely.                         | no       | `false`                          |
| `config-file`               | Path to a JSON or YAML file containing `users` and `messages` arrays.           | no       | `.github/spam-filter-config.yml` |
| `classifier`                | GraphQL `minimizeComment` classifier when hiding (e.g. `OUTDATED`, `RESOLVED`). | no       | `OUTDATED`                       |

## Usage

```yaml
name: Spam-filter comments
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]

jobs:
  filter:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run spam filter
        uses: your-org/spam-filter-action@v1
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          mode: hide                 # or 'delete'
          # disable-default-blocklist: 'true'  # uncomment to disable built-in defaults
          config-file: .github/spam-filter-config.yml
          # you can also use .github/spam-filter-config.json
          classifier: RESOLVED       # for 'hide' mode
```

## Config File

Place a config file at `.github/spam-filter-config.yml` or `.github/spam-filter-config.json` in your repo:

Examples of these are included below and in this repo.

### YAML example

```yaml
users:
  - spam_bot3
  - other_bot

messages:
  - "Yet another exact spam message!"
  - "One more two-sentence spam example to catch."
```

### JSON example

```json
{
  "users": ["spam_bot3", "other_bot"],
  "messages": [
    "Yet another exact spam message!",
    "One more two-sentence spam example to catch."
  ]
}
```

## Defaults

The action includes a built-in blocklist (`default-blocklist.json`) with these entries:

* **Users**: `spam_bot1`, `spam_bot2`
* **Messages**:

  * "The performance optimizations here are quite clever. Nice engineering work!"
  * "Great implementation of this feature. I particularly like the approach to error handling."
  * "Interesting solution to this problem! I've been working on similar challenges recently."
  * "Excellent contribution to open source! The community will benefit greatly from this."
  * "I'm impressed by the modularity of this codebase. Makes it very maintainable."
  * "This is a well-structured codebase. I appreciate the clean separation of concerns."

You can disable these defaults by setting `disable-default-blocklist: 'true'`.

## License

MIT
