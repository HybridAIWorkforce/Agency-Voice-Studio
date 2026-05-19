# Contributing to Agency Voice Studio

Thank you for your interest in contributing to Agency Voice Studio! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to:

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints and experiences

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Agency-Voice-Studio.git
   cd Agency-Voice-Studio
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env.local` file:
   ```bash
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

2. **Make your changes** following our coding standards

3. **Test your changes** locally

4. **Commit** your changes with a descriptive message

5. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request** against the `main` branch

## Pull Request Process

1. Ensure your PR description clearly describes the problem and solution
2. Reference any related issues using `#issue_number`
3. Ensure all CI checks pass
4. Update documentation if needed
5. Request review from maintainers
6. Address any feedback promptly

### PR Checklist

- [ ] Code follows the style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests pass
- [ ] No console warnings or errors

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Use functional components with hooks

### File Organization

```
components/     # Reusable UI components
services/       # API and business logic
constants/      # Application constants
types/          # TypeScript type definitions
```

### Style Guidelines

- Use 2 spaces for indentation
- Use single quotes for strings
- Add trailing commas
- Maximum line length: 100 characters
- Use semicolons

## Testing

- Write unit tests for new functionality
- Run tests before submitting PR:
  ```bash
  npm test
  ```
- Aim for good test coverage
- Test edge cases and error conditions

## Commit Messages

Follow conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(audio): add waveform visualization component

fix(api): handle Gemini API rate limiting

docs(readme): update installation instructions
```

## Questions?

If you have questions, feel free to:

- Open an issue with the `question` label
- Reach out to maintainers
- Check existing issues and discussions

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to Agency Voice Studio! 🚀
