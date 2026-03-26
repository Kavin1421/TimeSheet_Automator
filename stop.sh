#!/bin/bash
echo "Stopping Next.js dev server..."
fuser -k 3000/tcp
echo "Server stopped."
