const core   = require('@actions/core');
const github = require('@actions/github');
const fs     = require('fs');
const path   = require('path');
const yaml   = require('js-yaml');

async function run() {
  try {
    const token   = core.getInput('repo-token', { required: true });
    const mode    = core.getInput('mode', { required: true }).toLowerCase();
    const disable = core.getInput('disable-default-blocklist') === 'true';
    const cfgPath = core.getInput('config-file');
    const classifier = core.getInput('classifier');

    // 1) Load built-in defaults
    const defaultsPath = path.join(__dirname, 'default-blocklist.json');
    let defaults = { users: [], messages: [] };
    try {
      defaults = JSON.parse(fs.readFileSync(defaultsPath, 'utf8'));
    } catch (e) {
      core.warning(`Unable to load default blocklist: ${e.message}`);
    }

    // 2) Load repo config (if present)
    let repoConfig = { users: [], messages: [] };
    const fullCfgPath = path.join(process.env.GITHUB_WORKSPACE || '', cfgPath);
    if (fs.existsSync(fullCfgPath)) {
      const raw = fs.readFileSync(fullCfgPath, 'utf8');
      repoConfig = cfgPath.endsWith('.json')
        ? JSON.parse(raw)
        : yaml.load(raw);
      // ensure arrays
      repoConfig.users    = Array.isArray(repoConfig.users)    ? repoConfig.users    : [];
      repoConfig.messages = Array.isArray(repoConfig.messages) ? repoConfig.messages : [];
    } else {
      core.info(`No config file found at ${cfgPath}; using defaults only.`);
    }

    // 3) Build final lists
    const users = (disable ? [] : defaults.users)
      .concat(repoConfig.users)
      .map(u => u.trim().toLowerCase())
      .filter(u => u.length > 0);

    const messages = (disable ? [] : defaults.messages)
      .concat(repoConfig.messages)
      .map(m => m.trim())
      .filter(m => m.length > 0);

    // 4) Event check
    const { context } = github;
    if (!['issue_comment','pull_request_review_comment'].includes(context.eventName)) {
      core.info(`Ignored event: ${context.eventName}`);
      return;
    }

    const comment = context.payload.comment;
    const author  = comment.user.login.toLowerCase();
    const body    = comment.body.trim();

    // 5) Match?
    const matchUser    = users.includes(author);
    const matchMessage = messages.includes(body);
    if (!matchUser && !matchMessage) {
      core.info('No filters matched; leaving comment.');
      return;
    }

    const octokit = github.getOctokit(token);

    // 6a) Delete
    if (mode === 'delete') {
      if (context.eventName === 'issue_comment') {
        await octokit.rest.issues.deleteComment({
          owner: context.repo.owner,
          repo:  context.repo.repo,
          comment_id: comment.id
        });
      } else {
        await octokit.rest.pulls.deleteReviewComment({
          owner: context.repo.owner,
          repo:  context.repo.repo,
          comment_id: comment.id
        });
      }
      core.info(`Deleted comment #${comment.id}`);
    }
    // 6b) Hide
    else if (mode === 'hide') {
      await octokit.graphql(
        `
        mutation($id:ID!,$cls:ReportedContentClassifiers!) {
          minimizeComment(input:{subjectId:$id,classifier:$cls}) {
            minimizedComment { isMinimized }
          }
        }`,
        {
          id: comment.node_id,
          cls: classifier
        }
      );
      core.info(`Hidden (minimized) comment #${comment.id}`);
    }
    else {
      core.setFailed(`Invalid mode: ${mode}`);
    }
  }
  catch (err) {
    core.setFailed(err.message);
  }
}

run();
