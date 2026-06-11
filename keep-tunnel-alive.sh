#!/bin/bash
TUNNEL_URL="https://froch-test.loca.lt"
CHECK_INTERVAL=30

while true; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$TUNNEL_URL" 2>/dev/null)
  
  if [ "$HTTP_CODE" != "200" ]; then
    echo "[$(date)] Tunnel down (HTTP $HTTP_CODE). Restarting..."
    pkill -f "lt --port 4280" 2>/dev/null
    sleep 2
    nohup npx lt --port 4280 --subdomain froch-test > /tmp/lt.log 2>&1 &
    echo "[$(date)] Tunnel restarted"
  fi
  
  sleep $CHECK_INTERVAL
done
