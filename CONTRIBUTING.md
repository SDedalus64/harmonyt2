# Contributing to HarmonyTi

Thank you for contributing to HarmonyTi! This guide will help you understand our development workflow and standards.

## 📝 Changelog Updates (REQUIRED)

**Every pull request that introduces user-facing changes MUST update the CHANGELOG.md file.**

### When to Update the Changelog

Update the changelog when you:

- Add new features
- Change existing functionality
- Fix bugs
- Remove features
- Make performance improvements
- Address security issues

### How to Update the Changelog

1. Open `CHANGELOG.md` in the root directory
2. Add your changes under the `[Unreleased]` section
3. Use the appropriate category:
   - `Added` - for new features
   - `Changed` - for changes in existing functionality
   - `Deprecated` - for soon-to-be removed features
   - `Removed` - for now removed features
   - `Fixed` - for any bug fixes
   - `Security` - in case of vulnerabilities
   - `Performance` - for performance improvements

4. Write clear, concise bullet points that users can understand

### Example Changelog Entry

```markdown
## [Unreleased]

### Added

- Export functionality for duty calculations to PDF format
- Batch lookup feature for multiple HTS codes

### Fixed

- Country dropdown not showing all available countries
- Unit cost calculations rounding incorrectly for large quantities
```

### AI Assistance for Changelog Updates

For help writing changelog entries:

1. **Before committing**, review your changes:

   ```bash
   git diff --cached --name-only
   ```

2. **Ask an AI assistant**: "Please review these changes and update CHANGELOG.md"

3. **Review and edit** the AI's suggestions before committing

4. **Commit both** your code and the changelog together

**Note**: A pre-commit hook will remind you if you forget to update the changelog!

## 🚀 Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Follow existing code style
   - Add tests if applicable

3. **Update the changelog**

   ```bash
   # Edit CHANGELOG.md and add your changes under [Unreleased]
   git add CHANGELOG.md
   ```

4. **Commit your changes**

   ```bash
   git commit -m "feat: add export functionality for duty calculations

   - Added PDF export button to results screen
   - Implemented PDF generation service
   - Updated CHANGELOG.md"
   ```

5. **Push and create a pull request**
   ```bash
   git push origin feature/your-feature-name
   ```

## 📋 Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Code builds without errors (`yarn build`)
- [ ] Tests pass (`yarn test`)
- [ ] Linting passes (`yarn lint`)
- [ ] **CHANGELOG.md is updated** with your changes
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional format

## 💬 Commit Message Format

We use conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or fixes
- `chore`: Maintenance tasks

Example:

```
feat(tariff): add USMCA origin certificate support

- Added toggle for USMCA certificate on CA/MX imports
- Implemented duty-free calculation logic
- Updated UI to show certificate status
```

## 🧪 Testing

- Run unit tests: `yarn test`
- Run integration tests: `yarn test:integration`
- Test on iOS: `yarn ios`
- Test on Android: `yarn android`

## 📱 Platform-Specific Guidelines

### iOS Development

- Test on both iPhone and iPad
- Check different screen sizes
- Verify splash screen and app icons

### Android Development

- Test on multiple Android versions
- Check permissions handling
- Verify back button behavior

## 📚 Documentation

- Update relevant documentation in `/docs`
- Add JSDoc comments for new functions
- Update README.md if adding new setup steps

## 🐛 Reporting Issues

When reporting bugs:

1. Check existing issues first
2. Use the bug report template
3. Include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Device/OS information
   - Screenshots if applicable

## 🤝 Code of Conduct

- Be respectful and constructive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## ❓ Questions?

- Check the `/docs` folder for technical documentation
- Ask in pull request comments
- Review existing issues and PRs for context

---

**Remember: No PR will be merged without an updated CHANGELOG.md for user-facing changes!**
