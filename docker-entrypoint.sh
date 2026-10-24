#!/bin/sh
set -e

# Kalıcı volume boşsa (ilk kurulum) imajdaki blog verisiyle başla. Dosya varsa ASLA üzerine yazma:
# admin panelinden yapılan değişiklikler volume'da yaşar ve yeni deploy'larda korunur.
if [ ! -f /app/data/blog.json ] && [ -f /app/data-seed/blog.json ]; then
  cp /app/data-seed/blog.json /app/data/blog.json
  echo "[entrypoint] Boş veri klasörü: tohum blog verisi kopyalandı."
fi

# Volume yazılabilir değilse uygulama yine çalışır; yazma istekleri 503 döner (bkz. lib/blog/store.ts).
if [ ! -w /app/data ]; then
  echo "[entrypoint] UYARI: /app/data yazılabilir değil; admin panelinden yazı kaydedilemez."
fi

exec "$@"
