#!/usr/bin/env bash

set -euo pipefail

bash ./scripts/with-infisical.sh bash ./scripts/railway/build-inner.sh
