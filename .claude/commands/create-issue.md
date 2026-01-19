---
name: create-issue
description: Create a GitHub issue with proper issue type and add it to the project
arguments:
  - name: type
    description: "Issue type: Feature, User Story, Task, or Bug"
    required: true
---

# Create GitHub Issue

Create a GitHub issue with the specified type and add it to the project.

## Instructions

1. **Get the issue type ID and repository ID** from the `GitHub Issue Management` section in `CLAUDE.md`.

2. **Gather issue details** from the user or conversation context:
   - Title (concise, descriptive)
   - Description/body content
   - For User Stories: check if there's a parent Feature issue

3. **Format the body** based on issue type:

   **Feature:**
   ```markdown
   ## Feature: [Title]

   [Description]

   ### Goals
   - Goal 1
   - Goal 2

   ### Out of Scope
   - Item 1
   ```

   **User Story:**
   ```markdown
   ## User Story

   As a [role], I want [capability] so that [benefit].

   ### Acceptance Criteria
   - [ ] Criteria 1
   - [ ] Criteria 2
   ```

   **Task:**
   ```markdown
   ## Task: [Title]

   ### Overview
   [Description]

   ### Implementation
   [Steps or details]

   ### Acceptance Criteria
   - [ ] Criteria 1
   - [ ] Criteria 2
   ```

   **Bug:**
   ```markdown
   ## Bug: [Title]

   ### Description
   [What's happening]

   ### Expected Behavior
   [What should happen]

   ### Steps to Reproduce
   1. Step 1
   2. Step 2

   ### Environment
   - Browser/OS:
   - Version:
   ```

4. **Create the issue** using GraphQL:

   ```bash
   gh api graphql -f query='
   mutation {
     createIssue(input: {
       repositoryId: "R_kgDOQtah4Q"
       title: "ISSUE_TITLE"
       body: "ISSUE_BODY"
       issueTypeId: "ISSUE_TYPE_ID"
     }) {
       issue { id number title url }
     }
   }'
   ```

   For User Stories with a parent, add `parentIssueId: "PARENT_ID"` to the input.

5. **Add to the project:**

   ```bash
   gh project item-add 2 --owner ABladeLabs --url https://github.com/ABladeLabs/mss-industries-product-configurator/issues/ISSUE_NUMBER
   ```

6. **Report the result** to the user with the issue URL.

## Example Usage

User: `/create-issue Task` then describes what they want

Result: Creates a Task issue, adds it to project, returns URL.
