# Node.js Installation Guide for Django BlockNote Development

This guide covers installing Node.js and npm for Django BlockNote development across Windows, macOS, and Linux platforms.

## Overview

Django BlockNote requires Node.js for building frontend assets with Vite. This guide will help you:

- Install Node.js and npm on your operating system
- Set up Node Version Manager (NVM) for version management
- Install project dependencies for Django BlockNote
- Verify your installation

## System Requirements

**Minimum Requirements:**
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- 4GB RAM (for Vite builds)
- 1GB free disk space

**Recommended:**
- Node.js 22.x (LTS)
- npm 10.x
- 8GB RAM (for faster builds)

## Installation by Operating System

### Linux (Ubuntu/Debian)

#### Option 1: Using NVM (Recommended)

NVM allows you to install and switch between multiple Node.js versions easily.

**Install NVM:**
```bash
# Download and install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload your shell configuration
source ~/.bashrc

# Verify NVM installation
nvm --version
```

**Install Node.js:**
```bash
# Install latest LTS version (Node 22)
nvm install 22

# Use Node 22 as default
nvm use 22
nvm alias default 22

# Verify installation
node --version    # Should show v22.x.x
npm --version     # Should show 10.x.x
```

#### Option 2: Using NodeSource Repository

For system-wide installation without version management:

```bash
# Remove existing Node.js (if any)
sudo apt-get remove nodejs npm

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Option 3: Using Snap

Simple but less flexible option:

```bash
# Remove existing Node.js
sudo apt-get remove nodejs npm

# Install via Snap
sudo snap install node --classic

# Verify installation
node --version
```

### macOS

#### Option 1: Using NVM (Recommended)

**Install NVM:**
```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.zshrc  # or ~/.bash_profile if using bash

# Verify NVM installation
nvm --version
```

**Install Node.js:**
```bash
# Install latest LTS version
nvm install 22
nvm use 22
nvm alias default 22

# Verify installation
node --version
npm --version
```

#### Option 2: Using Homebrew

If you have Homebrew installed:

```bash
# Install Node.js via Homebrew
brew install node@22

# Link the version (if needed)
brew link node@22

# Verify installation
node --version
npm --version
```

#### Option 3: Official Installer

Download from [nodejs.org](https://nodejs.org):

1. Visit https://nodejs.org
2. Download the LTS version (22.x)
3. Run the `.pkg` installer
4. Follow installation prompts
5. Verify in Terminal:
   ```bash
   node --version
   npm --version
   ```

### Windows

#### Option 1: Using NVM for Windows (Recommended)

**Install NVM for Windows:**

1. Download NVM for Windows from: https://github.com/coreybutler/nvm-windows/releases
2. Download `nvm-setup.exe` from the latest release
3. Run the installer with administrator privileges
4. Restart Command Prompt or PowerShell

**Install Node.js:**
```cmd
# List available versions
nvm list available

# Install latest LTS version
nvm install 22.0.0

# Use the installed version
nvm use 22.0.0

# Verify installation
node --version
npm --version
```

#### Option 2: Official Installer

1. Visit https://nodejs.org
2. Download the Windows Installer (LTS version)
3. Run the `.msi` file
4. Follow installation wizard
5. Restart Command Prompt
6. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

#### Option 3: Using Chocolatey

If you have Chocolatey package manager:

```cmd
# Install Node.js
choco install nodejs

# Verify installation
node --version
npm --version
```

## Post-Installation Setup

### Configure npm (All Platforms)

Set up npm for better performance and security:

```bash
# Set npm registry (optional, for faster downloads)
npm config set registry https://registry.npmjs.org/

# Configure npm for global packages (Linux/macOS)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'

# Add to your shell profile (Linux/macOS)
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

### Update npm

Ensure you have the latest npm:

```bash
# Update npm to latest version
npm install -g npm@latest

# Verify npm version
npm --version
```

## Installing Django BlockNote Dependencies

Once Node.js is installed, set up your Django BlockNote project:

### Navigate to Project Directory

```bash
cd /path/to/your/django-blocknote-project
```

### Install Project Dependencies

```bash
# Install all dependencies from package.json
npm install
```

### Verify Dependencies

Check that key dependencies are installed:

```bash
# Check installed packages
npm list --depth=0

# Should include:
# ├── @blocknote/core@^0.31.1
# ├── @blocknote/react@^0.31.1
# ├── @blocknote/mantine@^0.31.1
# ├── react@^18.0.0
# ├── react-dom@^18.0.0
# └── vite@^6.0.0
```

## Testing Your Installation

### Run Development Build

Test that Vite can build your assets:

```bash
# Run development build
npm run dev

# Should output something like:
# > vite
# 
# VITE v6.3.5  ready in 543ms
# ➜  Local:   http://localhost:5173/
```

### Run Production Build

Test production build process:

```bash
# Run production build
npm run build

# Should create files in django_blocknote/static/django_blocknote/
# ├── js/
# │   ├── blocknote.[hash].min.js
# │   └── widget.[hash].min.js
# ├── css/
# │   └── blocknote.[hash].min.css
# └── manifest.json
```

## Troubleshooting

### Common Issues

**Node Version Conflicts:**
```bash
# Check current Node version
node --version

# If using NVM, switch versions
nvm use 22

# Set as default
nvm alias default 22
```

**Permission Errors (Linux/macOS):**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.npm-global
```

**Windows Path Issues:**
- Restart Command Prompt after installation
- Ensure Node.js is in your PATH environment variable
- Try running as Administrator if needed

**Vite Engine Warnings:**
```bash
# Check Node version compatibility
node --version

# Should be 18.x, 20.x, or 22.x+
# If not, install correct version:
nvm install 22
nvm use 22
```

### Verification Checklist

Run these commands to verify your setup:

```bash
# Check versions
node --version     # Should be v22.x.x
npm --version      # Should be 10.x.x

# Check NVM (if using)
nvm --version      # Should show version
nvm current        # Should show v22.x.x

# Test npm functionality
npm --help         # Should show help text

# Check project dependencies
cd /path/to/project
npm list           # Should show dependency tree
```

## Managing Multiple Projects

### Using NVM for Project-Specific Versions

Create `.nvmrc` files for automatic version switching:

```bash
# In your project directory
echo "22" > .nvmrc

# Use project-specific version
nvm use

# Automatically use correct version when entering directory
# Add to ~/.bashrc or ~/.zshrc:
autoload -U add-zsh-hook
load-nvmrc() {
  local node_version="$(nvm version)"
  local nvmrc_path="$(nvm_find_nvmrc)"
  
  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "${nvmrc_path}")")
    
    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install
    elif [ "$nvmrc_node_version" != "$node_version" ]; then
      nvm use
    fi
  elif [ "$node_version" != "$(nvm version default)" ]; then
    nvm use default
  fi
}

add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

## Security Considerations

### npm Security Best Practices

```bash
# Enable npm audit
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Check for outdated packages
npm outdated

# Update packages
npm update
```

### Package Verification

```bash
# Verify package integrity
npm install --package-lock-only
npm ci  # Clean install from package-lock.json
```

## Performance Optimization

### npm Configuration

```bash
# Enable parallel downloads
npm config set prefer-offline true
npm config set progress false

# Use npm cache
npm config set cache ~/.npm-cache

# Set reasonable timeout
npm config set timeout 60000
```

### Build Performance

For faster builds on development machines:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Use faster source maps in development
# (Configure in vite.config.js)
```

## Upgrading Node.js

### Using NVM

```bash
# List installed versions
nvm list

# Install new version
nvm install 23  # When available

# Switch to new version
nvm use 23

# Update default
nvm alias default 23

# Remove old versions
nvm uninstall 20
```

### Without NVM

Follow the same installation steps for your platform to upgrade to newer versions.

## Getting Help

### Useful Commands

```bash
# Node.js help
node --help

# npm help
npm help
npm help install

# NVM help
nvm --help

# Check npm configuration
npm config list
```

### Resources

- **Node.js Documentation**: https://nodejs.org/docs/
- **npm Documentation**: https://docs.npmjs.com/
- **NVM Documentation**: https://github.com/nvm-sh/nvm
- **Vite Documentation**: https://vitejs.dev/
- **Django BlockNote Issues**: https://github.com/your-repo/issues

## Next Steps

After completing this installation:

1. **Verify your setup** using the verification checklist
2. **Run the development server** with `npm run dev`
3. **Build production assets** with `npm run build`
4. **Integrate with Django** using the widget configuration
5. **Set up your development workflow** with hot reloading

Your Node.js environment is now ready for Django BlockNote development!