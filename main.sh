#! /bin/bash
python3 src/main.py
cd root && python3 -m http.server 8888