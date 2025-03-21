# Project Development Guide

## Version Control: Gitflow 

Instead of using simple git branching, we will be using a cleaner versioning system called gitflow. It may be a bit annoying for a project this small, but trust me you'll learn a lot using it.

I doubt you'll read it XD, but here's a good link on why gitflow is useful: [gitflow article](https://medium.com/novai-devops-101/understanding-gitflow-a-simple-guide-to-git-branching-strategy-4f079c12edb9)

Also, here is the documentation for your reference: [gitflow documentation](https://github.com/nvie/gitflow)

### Default Branches

Our repository has the following default branches:

- **main**: The production-ready code. All code in this branch should be stable and ready for deployment.
- **develop**: This is our primary working branch where features are integrated before being merged to main. If you are building something that you are sure will be included in all future features/branches, you can commit directly here, but I would discourage that as much as possible.


### Working with Feature Branches

#### Creating a New Feature Branch

1. Always create feature branches from the **develop** branch:
   ```bash
   git checkout develop
   git pull origin develop
   git feature start your-feature-name
   git checkout feature/your-feature-name
   ```

2. Use a descriptive name always for your feature, e.g. edge-only-distillation.

3. Make your changes, commit regularly with clear messages. Keep committing to the same branch until you are satisfied and want to merge, or you want to work on something else.

4. When ready, push your branch to the remote repository:

    Publish your branch from your IDE

    or

   ```bash
   git push -u origin feature/your-feature-name
   ```

5. Create a pull request to merge your feature branch into the development branch once you are happy with the code in your feature. Unless you are a command line wizard, please go to the Github website and do it from there. Getting other people to approve your code improves the robustness by having a second pair of eyes looking at the code.


## Our dependency manager - Goodbye pip and hello uv

### What is uv?

uv is a modern Python package installer and resolver designed as a faster, more reliable alternative to pip and other traditional Python package management tools. It's written in Rust and focuses on speed, reliability, and compatibility with the Python ecosystem.

### Why We Use uv

We've chosen uv for our project for several key reasons:

1. **Speed**: uv is significantly faster than pip, sometimes by 10-100x, which reduces waiting time during development.
2. **Reliability**: uv's dependency resolver is more reliable, reducing "dependency hell" issues.
3. **Compatibility**: uv works with all standard Python packaging formats and can be used as a drop-in replacement for pip.
4. **Reproducibility**: uv makes it easier to ensure everyone on the team has the exact same environment.


### Managing Dependencies with uv

#### Initial Setup

First, install uv if you haven't already:

```bash
pip install uv
```

#### Creating a Virtual Environment

```bash
uv venv
```

This creates a virtual environment in the `.venv` directory by default.

To activate the virtual environment:
- Windows: `.venv\Scripts\activate`
- macOS/Linux: `source .venv/bin/activate`

#### Installing Project Dependencies

To install all current dependencies (already there in pyproject.toml):

```bash
uv sync
```

#### Adding New Dependencies

To add a new package to your project:

```bash
uv add package_name
```

As you can see uv makes things super simple in terms of handling dependencies!

If you are unsure about anything, please read documentation at [official uv documentation](https://github.com/astral-sh/uv) or reach out Yousuf.
