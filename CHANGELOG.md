# claude-pretty-printer

## 1.2.0

### Minor Changes

- Add hook helpers API with `withLogging()`, `createLoggingHooks()`, and `createSingleLoggingHook()` for easy integration with Claude Agent SDK hooks
- Add `getRawText()` utility function to extract raw text content from any SDK message type
- Refactor codebase with modular architecture: separate formatters by message type, dedicated validation module, and utility functions
- Add comprehensive hook callback formatting for all SDK hook types (PreToolUse, PostToolUse, Notification, UserPromptSubmit, SessionStart, SessionEnd, Stop, SubagentStop, PreCompact)
- Add new `/hooks` export path for hook utilities
- Expand test coverage with dedicated formatter tests and hook integration tests

## 1.1.0

### Minor Changes

- Fix system message handling to return empty string for null content instead of crashing
- Fix test failures by disabling TTY colors in test environment to prevent color code interference

## 1.0.4

### Minor Changes

- Add Changesets for intelligent version management
- Add Biome formatting and Husky pre-commit hooks
- Add minification to build process

## 1.0.3

### Patch Changes

- Add field validation for different message types with helpful error messages
- Improve CLI error handling for incomplete JSON objects
- Fix inline JSON parsing with detailed validation feedback

## 1.0.2

### Patch Changes

- Add comprehensive unit test suite with 28 tests covering all message types
- Add UUID package for proper test data generation
- Fix TypeScript errors in test files
- Improve type safety and error handling

## 1.0.1

### Patch Changes

- Simplify API from two functions to single `formatMessage`
- Add smart tool result detection in user messages
- Update README with problem/solution focused messaging
- Improve code organization and documentation

## 1.0.0

### Major Changes

- Initial release of claude-pretty-printer
- Transform raw Claude Agent SDK messages into beautiful CLI output
- Support for all message types: assistant, user, result, system, stream_event
- CLI with stdin, file, and inline JSON input methods
- Color-coded terminal boxes with full-width formatting
- TypeScript support with proper type definitions
