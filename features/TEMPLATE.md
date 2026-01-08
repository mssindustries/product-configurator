# Feature: {Feature Name}

**Status**: backlog | in-analysis | in-development | in-review | testing | ready-to-merge | complete | abandoned

**Folder**: backlog | in-analysis | in-development | complete

**Feature Slug**: {kebab-case-slug}

**Branch**: feature/{kebab-case-slug} _(filled when development starts)_

**Created**: {YYYY-MM-DD}

**Last Updated**: {YYYY-MM-DD}

---

## Summary

Brief 2-3 sentence description of what this feature does and why it's valuable to users (clients or customers).

## Requirements

### Functional Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

### Non-Functional Requirements
- [ ] Performance: {specific target if applicable}
- [ ] Security: {specific concerns if applicable}
- [ ] Accessibility: {WCAG compliance if applicable}

## Acceptance Criteria

1. **Given** {context}, **When** {action}, **Then** {expected result}
2. **Given** {context}, **When** {action}, **Then** {expected result}
3. **Given** {context}, **When** {action}, **Then** {expected result}

## Data Model Changes

### New Tables/Models
- `ModelName`: {brief description}

### Modified Tables/Models
- `ModelName`: Add field `fieldName` - {reason}
- `ModelName`: Remove field `oldField` - {reason}

### Migrations
- [ ] Migration description 1
- [ ] Migration description 2

## API Changes

### New Endpoints
- `POST /api/resource` - {description}
- `GET /api/resource/:id` - {description}

### Modified Endpoints
- `PATCH /api/resource/:id` - {what changed}

## Dependencies

### Depends On
- Feature: {feature-slug} - {why}

### Blocks
- Feature: {feature-slug} - {why}

### External Dependencies
- npm package: `package-name` - {reason}

---

## Planning
_This section is auto-filled by architect-reviewer and planning agents during the in-analysis phase_

### Architecture Review
**Reviewed By**: {agent-name}
**Date**: {YYYY-MM-DD}

#### Impact Assessment
- **Scope**: small | medium | large
- **Risk Level**: low | medium | high
- **Complexity**: {1-10}

#### Key Decisions
1. **Decision**: {what was decided}
   - **Rationale**: {why}
   - **Trade-offs**: {pros/cons}

#### Integration Points
- {Component/System 1}: {how it integrates}
- {Component/System 2}: {how it integrates}

#### Risks & Mitigations
1. **Risk**: {description}
   - **Mitigation**: {approach}

### Implementation Plan
**Planned By**: {agent-name}
**Date**: {YYYY-MM-DD}

#### Critical Files
1. `path/to/file1.tsx` - {what changes}
2. `path/to/file2.ts` - {what changes}
3. `path/to/file3.tsx` - {what changes}

#### Implementation Steps
1. {Step 1 description}
   - Task 1.1
   - Task 1.2
2. {Step 2 description}
   - Task 2.1
   - Task 2.2

#### Testing Strategy
- **Unit Tests**: {what to test}
- **Integration Tests**: {what to test}
- **E2E Tests**: {critical user flows}

---

## Development Notes
_Updated during implementation - key decisions, challenges, and learnings_

### {YYYY-MM-DD} - {Developer/Agent}
{Description of work, decisions made, challenges encountered}

---

## Code Review
_This section is auto-filled by code-reviewer agent_

**Reviewed By**: {agent-name}
**Date**: {YYYY-MM-DD}
**Status**: approved | needs-fixes

### Issues Found

#### Critical (Must Fix)
1. {Issue description} - `file.ts:line`

#### High Priority
1. {Issue description} - `file.ts:line`

#### Medium Priority
1. {Suggestion for improvement}

### Positive Observations
- {Good practice noted}

---

## Testing
_Updated during testing phase_

### Acceptance Criteria Validation
- [ ] Criterion 1 - {Pass/Fail} - {Date}
- [ ] Criterion 2 - {Pass/Fail} - {Date}
- [ ] Criterion 3 - {Pass/Fail} - {Date}

### Test Results
- **Unit Tests**: {X/Y passed}
- **Integration Tests**: {X/Y passed}
- **E2E Tests**: {X/Y passed}

### Issues Found in Testing
1. **Issue**: {description}
   - **Severity**: critical | high | medium | low
   - **Status**: fixed | open

---

## Completion

### Pull Request
**PR**: #{number} - {url}
**Merged**: {YYYY-MM-DD}

### Checklist
- [ ] All tests passing
- [ ] Code review approved
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] PR merged to main
- [ ] Feature branch deleted

### Abandonment
_Only if status is abandoned_

**Reason**: {why abandoned}
**Date**: {YYYY-MM-DD}
**Notes**: {additional context}

---

## References
- Related feature: {feature-slug}
- Documentation: {url}
- Design: {url}
