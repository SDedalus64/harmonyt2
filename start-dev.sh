#!/bin/bash

################################################################################
# HarmonyTi Development Server Startup Script
# -------------------------------------------
# Kills stale Metro processes and starts the Expo dev server for dev-client builds.
#
# Usage:
#   chmod +x start-dev.sh   # (Run once to make executable)
#   ./start-dev.sh          # Start dev server
################################################################################

set -e  # Exit immediately on any error

#--------------------------------------
# Helper Functions
#--------------------------------------
info() {
  printf "\n👉  %s\n\n" "$1"
}

#--------------------------------------
# 1. Kill stale Metro / Node processes
#--------------------------------------
info "Killing stale Metro / port-8081 processes..."
killall -9 node 2>/dev/null || true
lsof -ti :8081 | xargs kill -9 2>/dev/null || true

#--------------------------------------
# 2. Start Expo dev server
#--------------------------------------
info "Starting Expo dev server for HarmonyTi dev-client..."
npx expo start --dev-client --clear 