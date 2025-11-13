# Contributing to RSP Stories Studio

Thank you for your interest in contributing to RSP Stories Studio! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/YOUR-ORG/rsp-studio/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Environment details (OS, browser, etc.)

### Suggesting Enhancements

1. Open an issue with the `enhancement` label
2. Describe the feature and its benefits
3. Provide examples or mockups if possible

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Make your changes following our coding standards

4. Test your changes:
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Frontend tests
   cd frontend && npm test
   
   # Integration test
   docker-compose up -d
   ```

5. Commit with clear messages:
   ```bash
   git commit -m "feat: add user profile page"
   ```

6. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

7. Open a Pull Request with:
   - Clear description of changes
   - Link to related issue(s)
   - Screenshots (if UI changes)
   - Test results

## Development Setup

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Local Setup

```bash
# Clone repository
git clone https://github.com/YOUR-ORG/rsp-studio.git
cd rsp-studio

# Set up backend
cd backend
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma generate

# Set up frontend
cd ../frontend
cp .env.example .env
npm install

# Start all services
cd ..
docker-compose up -d
```

## Coding Standards

### JavaScript/TypeScript

- Use ES6+ features
- Follow ESLint configuration
- Use TypeScript for type safety (frontend)
- Use async/await over callbacks
- Keep functions small and focused
- Add JSDoc comments for complex functions

### Example:

```typescript
/**
 * Fetches stories accessible to the authenticated user
 * @param {string} tier - User's access tier
 * @returns {Promise<Story[]>} Array of accessible stories
 */
async function getAccessibleStories(tier: string): Promise<Story[]> {
  // Implementation
}
```

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow mobile-first approach
- Maintain consistent spacing
- Use semantic class names when custom CSS is needed

### Git Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```bash
git commit -m "feat: add story sharing functionality"
git commit -m "fix: resolve authentication token refresh issue"
git commit -m "docs: update API documentation"
```

## Project Structure

```
rsp-studio/
├── backend/           # Express.js API
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── middleware/# Express middleware
│   │   ├── models/    # Data models
│   │   └── utils/     # Utility functions
│   └── prisma/        # Database schema
├── frontend/          # Next.js app
│   ├── src/
│   │   ├── app/       # Pages (App Router)
│   │   ├── components/# React components
│   │   └── lib/       # Utilities
├── infra/            # Infrastructure
│   ├── terraform/    # IaC
│   ├── ansible/      # Configuration
│   └── monitoring/   # Prometheus/Grafana
└── .github/          # CI/CD workflows
```

## Testing

### Backend Tests

```bash
cd backend
npm test                    # Run all tests
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:coverage      # Coverage report
```

### Frontend Tests

```bash
cd frontend
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

### Manual Testing

1. Start local environment:
   ```bash
   docker-compose up -d
   ```

2. Test key flows:
   - User registration/login
   - Story creation
   - Chapter management
   - Media upload
   - Access control

3. Check different tiers:
   - Create users with different tiers
   - Verify access restrictions work

## Documentation

### Code Comments

- Add comments for complex logic
- Document all public APIs
- Include usage examples

### README Updates

- Update README.md for new features
- Keep setup instructions current
- Add screenshots for UI changes

### API Documentation

Update API docs when changing endpoints:
- Request/response formats
- Authentication requirements
- Error responses
- Usage examples

## Release Process

1. Version bump in `package.json`
2. Update CHANGELOG.md
3. Create release branch:
   ```bash
   git checkout -b release/v1.1.0
   ```
4. Test thoroughly
5. Merge to `main`
6. Tag release:
   ```bash
   git tag -a v1.1.0 -m "Release version 1.1.0"
   git push origin v1.1.0
   ```

## Getting Help

- **Questions**: Open a discussion on GitHub
- **Bugs**: Create an issue with `bug` label
- **Security**: Email security@your-domain.com (don't create public issues)

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in the project README

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to RSP Stories Studio! 🚀
