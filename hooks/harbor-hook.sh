#!/bin/bash
# Harbor UserPromptSubmit hook — reads prompt from STDIN, calls daemon, injects skill context
INPUT=$(cat)
if [ -z "$INPUT" ]; then exit 0; fi

MSG=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('message') or d.get('prompt') or '')
except:
    pass
" 2>/dev/null)

if [ -z "$MSG" ]; then exit 0; fi

# Start daemon if not running
if ! curl -sf http://localhost:37701/harness/status > /dev/null 2>&1; then
    HARBOR_DIR="${HARBOR_PLUGIN_ROOT:-/root/harbor-agent}"
    cd "$HARBOR_DIR" && node dist/index.js &>/dev/null & disown
    sleep 1
fi

# Call plugin hook
PAYLOAD=$(python3 -c "import json,sys; print(json.dumps({'type':'UserPromptSubmit','data':{'message':sys.argv[1]}}))" "$MSG" 2>/dev/null)
RESULT=$(curl -sf -X POST http://localhost:37701/plugin/hook \
    -H 'Content-Type: application/json' \
    -d "$PAYLOAD" 2>/dev/null)

if [ -z "$RESULT" ]; then exit 0; fi

CTX=$(echo "$RESULT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    ctx = d.get('inject_context','')
    if ctx:
        print(json.dumps({'additionalContext': ctx, 'continue': True}))
except:
    pass
" 2>/dev/null)

if [ -n "$CTX" ]; then echo "$CTX"; fi
exit 0
