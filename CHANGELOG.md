# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-05-28

### Fixed

- Fixed an issue where `init()` would set `LogLevel` to `INFO` instead of its initial value.

## [1.1.0] - 2024-02-28

### Added

- Support for serializing BigInt via the option `supportBigInt`

## [1.0.0] - 2024-02-13

### Breaking Changes

- `init()` now resets all options to defaults unless explicitly set
  - Previously would maintain existing values for unspecified options
  - Now uses nullish coalescing to reset to defaults

### Added

- Added `@default` tags to document default values in types
- Improved documentation clarity around initialization behavior

## [0.1.0] - 2024-02-13

### Added

- Added compact JSON output option via `compactPrint`

## [0.0.3] - 2024-02-04

- Fixed non-standard output dir in build.

## [0.0.2] - 2019

- Second release

## [0.0.1] - 2019

- Initial release
