# N8N Workflow Mass Import - NixOS Setup Guide

This guide helps you set up and use the Python script to mass import n8n workflows on NixOS.

## Prerequisites

Since you're on NixOS, Python and pip should already be available in your environment. If not, add them to your `configuration.nix` or use a development shell.

## Setup Steps

### 1. Install Required Python Package

```bash
# Install requests library (the only dependency)
pip install requests

# Or if you prefer using user directory:
pip install --user requests
```

### 2. Verify Your n8n Instance

Make sure your n8n instance is running and accessible:

```bash
# Test if n8n is running (default port 5678)
curl http://localhost:5678/rest/workflows

# If you get a 401 error, that's normal - it means n8n is running but needs auth
# If you get connection refused, start n8n first
```

### 3. Create Configuration (Optional)

Generate a configuration file to customize settings:

```bash
python mass_import_workflows.py --config
```

This creates `n8n_import_config.json` with settings you can modify:

```json
{
  "n8n": {
    "base_url": "http://localhost:5678",
    "api_key": null,
    "username": null,
    "password": null
  },
  "import": {
    "workflows_dir": "exported-workflows",
    "update_existing": true,
    "activate_after_import": false,
    "skip_invalid": true,
    "delay_between_imports": 2,
    "max_retries": 3,
    "retry_delay": 5
  },
  "logging": {
    "verbose": true,
    "log_file": null,
    "include_timestamps": true
  }
}
```

### 4. Run the Import Script

Choose from these options:

```bash
# Preview what would be imported (dry run)
python mass_import_workflows.py --dry-run

# Import all workflows
python mass_import_workflows.py

# Import only LinkedIn-related workflows
python mass_import_workflows.py --filter linkedin

# Import with verbose output
python mass_import_workflows.py --verbose

# Import specific workflows matching a pattern
python mass_import_workflows.py --filter "scraper|recruitment"
```

## Authentication Options

### Option 1: No Authentication (Local Development)
If n8n is running locally without authentication, no additional setup is needed.

### Option 2: API Key Authentication
If you have an n8n API key:

1. Edit `n8n_import_config.json`
2. Set `"api_key": "your_api_key_here"`

### Option 3: Username/Password Authentication
If using basic authentication:

1. Edit `n8n_import_config.json`
2. Set both `"username"` and `"password"`

## Troubleshooting

### Common Issues

**Connection Refused Error:**
```bash
# Make sure n8n is running
systemctl status n8n  # if using systemd
# or check your process manager

# Test connection manually
curl http://localhost:5678/rest/workflows
```

**Permission Errors:**
```bash
# Install requests for your user only
pip install --user requests

# Or use a virtual environment
python -m venv venv
source venv/bin/activate
pip install requests
```

**Import Failures:**
```bash
# Run with verbose logging to see detailed errors
python mass_import_workflows.py --verbose

# Check individual workflow files for JSON validity
python -m json.tool exported-workflows/problematic_workflow.json
```

## Features

### Workflow Filtering
- Filter by name: `--filter "linkedin"`
- Use regex patterns: `--filter "scraper|recruitment"`
- Case-insensitive matching

### Safety Features
- Dry run mode to preview imports
- Automatic retry on failures
- Configurable delays between imports
- Skip invalid workflows option
- Backup existing workflows (if configured)

### Monitoring
- Real-time progress display
- Detailed logging with timestamps
- Import summary statistics
- Optional log file output

## Advanced Usage

### Batch Processing
```bash
# Import workflows in smaller batches
python mass_import_workflows.py --filter "1_|2_|3_"  # First 3 workflows
python mass_import_workflows.py --filter "4_|5_|6_"  # Next 3 workflows
```

### Custom Configuration
```bash
# Create custom config for different environments
cp n8n_import_config.json n8n_production_config.json
# Edit the production config as needed
# Then use it by renaming back when needed
```

### Logging
```bash
# Enable file logging by editing config:
"log_file": "import_log.txt"

# Then view logs:
tail -f import_log.txt
```

## NixOS-Specific Notes

### System Integration
If you want to add this as a system service or scheduled task:

```nix
# In your configuration.nix or home-manager config
systemd.user.services.n8n-import = {
  description = "N8N Workflow Import";
  serviceConfig = {
    Type = "oneshot";
    ExecStart = "${pkgs.python3}/bin/python /path/to/mass_import_workflows.py";
    WorkingDirectory = "/path/to/your/project";
  };
};
```

### Development Shell
For isolated development:

```nix
# shell.nix
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    python3
    python3Packages.requests
    curl
    jq
  ];
  
  shellHook = ''
    echo "N8N Import Environment Ready"
    echo "Python: $(python --version)"
    echo "Available: python, curl, jq"
  '';
}
```

Then use: `nix-shell` or `nix develop` (if using flakes)

## Your Workflow Count

Based on your `exported-workflows` directory, you have **42 workflow files** ready to import:

- Various AI and automation workflows
- LinkedIn scraping and recruitment tools
- Video processing and content creation
- Social media management tools
- And many more!

Run the script and get all your workflows imported efficiently! 🚀 