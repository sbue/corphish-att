#!/usr/bin/env bash

set -euo pipefail

bash ./scripts/with-infisical.sh node apps/web/.next/standalone/apps/web/server.js
