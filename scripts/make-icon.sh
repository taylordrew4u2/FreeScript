#!/bin/sh
set -eu
swift scripts/make-icon.swift
mkdir -p build/icon.iconset
for size in 16 32 128 256 512; do
  sips -z "$size" "$size" build/icon-1024.png --out "build/icon.iconset/icon_${size}x${size}.png" >/dev/null
  double=$((size * 2))
  sips -z "$double" "$double" build/icon-1024.png --out "build/icon.iconset/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns build/icon.iconset -o build/icon.icns
rm -r build/icon.iconset
