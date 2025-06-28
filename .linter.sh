#!/bin/bash
cd /home/kavia/workspace/code-generation/reactfasttodo-94580-e2f83af4/todo_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

