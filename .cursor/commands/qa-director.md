# QA director

Use this command after meaningful changes or before release to verify behavior with The Agentsy QA Director.

Target agent: `agentsy-qa-director`

Steps:

1. Read the user's current claim, diff, or requested validation target.
2. Use `agentsy-qa-director` as the primary reviewer when subagent delegation is available.
3. Verify against the brief, not just against file existence.
4. Run or recommend the most relevant tests and checks for this repo.
5. Report findings first:
   - Blocking issues
   - Non-blocking risks
   - Verification performed
   - Tests not run
   - Confidence level

If the user included task details after the slash command, treat those details as the validation target.
