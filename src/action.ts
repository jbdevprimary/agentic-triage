import * as core from '@actions/core';
import { ollama } from 'ai-sdk-ollama';
import { analyzeIssue } from './handlers/index.js';

async function run() {
  try {
    const issueBody = core.getInput('issue_body') || process.env.INPUT_ISSUE_BODY || '';
    if (!issueBody) {
      core.warning(
        'No issue body found. Set issue_body input or INPUT_ISSUE_BODY environment variable.'
      );
      return;
    }

    // Use default model or from env
    const modelId = process.env.OLLAMA_MODEL || 'llama3';
    const result = await analyzeIssue(issueBody, ollama(modelId));

    // Consume the stream to extract text (High Severity fix)
    const text = await result.text;

    console.log('Analysis Result:', text);

    // Set the output (High Severity fix)
    core.setOutput('result', text);

    console.log('Analysis completed successfully.');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('Action failed with an unknown error');
    }
  }
}

run().catch((err) => {
  core.setFailed(`Unhandled error: ${err}`);
});
