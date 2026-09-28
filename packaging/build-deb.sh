#!/usr/bin/env bash
# Builds a self-contained gexam_<version>_<arch>.deb (bundled Node runtime, server, UI and question bank).
#   ./packaging/build-deb.sh                # version from $VERSION or 1.0.0
#   QUESTIONS_DIR=/path/to/gate-questions VERSION=1.2.0 ./packaging/build-deb.sh
set -euo pipefail
cd "$(dirname "$0")/.."

VERSION="${VERSION:-1.0.1}"
QUESTIONS_DIR="${QUESTIONS_DIR:-../gate-questions}"
case "$(uname -m)" in
  x86_64) ARCH=amd64 ;;
  aarch64) ARCH=arm64 ;;
  *) echo "Unsupported build architecture: $(uname -m)" >&2; exit 1 ;;
esac

[ -d "$QUESTIONS_DIR" ] || { echo "Question bank not found at $QUESTIONS_DIR (set QUESTIONS_DIR)" >&2; exit 1; }
NODE_BIN="$(readlink -f "$(command -v node)")"
file "$NODE_BIN" | grep -q ELF || { echo "node at $NODE_BIN is not a real binary (version-manager shim?)" >&2; exit 1; }

OUT=packaging/build
STAGE="$OUT/gexam_${VERSION}_${ARCH}"
APP="$STAGE/opt/gexam"
rm -rf "$STAGE"
mkdir -p "$APP" "$STAGE/DEBIAN" "$STAGE/etc/gexam" "$STAGE/etc/logrotate.d" "$STAGE/lib/systemd/system" \
  "$STAGE/usr/bin" "$STAGE/usr/share/applications" "$STAGE/usr/share/icons/hicolor/scalable/apps" "$STAGE/usr/share/polkit-1/rules.d"

echo "==> Building UI"
npm run build

echo "==> Bundling server"
npx esbuild server/index.ts --bundle --platform=node --format=esm --target=node22 \
  --outfile="$APP/server.mjs" --external:vite --external:fsevents --log-level=warning \
  --banner:js="import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);"

echo "==> Copying runtime, UI and question bank"
cp "$NODE_BIN" "$APP/node"
cp -r dist "$APP/dist"
mkdir -p "$APP/gate-questions"
tar -C "$QUESTIONS_DIR" --exclude=.git --exclude=extracted_questions.json -cf - . | tar -C "$APP/gate-questions" -xf -

echo "==> Checking control panel starts"
python3 packaging/gexam-panel --check

echo "==> Installing control panel"
install -m 755 packaging/gexam-panel "$STAGE/usr/bin/gexam-panel"
install -m 644 packaging/gexam.desktop "$STAGE/usr/share/applications/gexam.desktop"
install -m 644 packaging/gexam.svg "$STAGE/usr/share/icons/hicolor/scalable/apps/gexam.svg"
install -m 644 packaging/50-gexam.rules "$STAGE/usr/share/polkit-1/rules.d/50-gexam.rules"
install -m 644 packaging/gexam.logrotate "$STAGE/etc/logrotate.d/gexam"

echo "==> Writing package metadata"
cat > "$STAGE/etc/gexam/gexam.env" <<'EOF'
# GExam LAN server settings. Restart after editing:  sudo systemctl restart gexam
PORT=3000
EOF

cat > "$STAGE/lib/systemd/system/gexam.service" <<'EOF'
[Unit]
Description=GExam LAN exam server
After=network.target

[Service]
User=gexam
Group=gexam
WorkingDirectory=/opt/gexam
Environment=NODE_ENV=production
Environment=DATA_DIR=/var/lib/gexam
Environment=QUESTIONS_DIR=/opt/gexam/gate-questions
EnvironmentFile=-/etc/gexam/gexam.env
ExecStart=/opt/gexam/node /opt/gexam/server.mjs
StandardOutput=append:/var/log/gexam.log
StandardError=inherit
Restart=always
RestartSec=3
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/var/lib/gexam

[Install]
WantedBy=multi-user.target
EOF

cat > "$STAGE/usr/bin/gexam-reset-admin" <<'EOF'
#!/bin/sh
# Forgot the admin password? This removes the admin account so /admin shows first-time setup again.
# Exams, students and results are kept.
set -e
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo." >&2; exit 1; }
rm -f /var/lib/gexam/admin.json
systemctl restart gexam
echo "Admin account removed. Open the site and create a new admin."
EOF
chmod 755 "$STAGE/usr/bin/gexam-reset-admin"

cat > "$STAGE/DEBIAN/control" <<EOF
Package: gexam
Version: $VERSION
Section: web
Priority: optional
Architecture: $ARCH
Depends: systemd, python3, python3-gi, gir1.2-gtk-3.0, pkexec | policykit-1, xdg-utils, adduser, libc6, libstdc++6
Maintainer: GExam <admin@localhost>
Installed-Size: $(du -sk "$STAGE" | cut -f1)
Description: Offline GATE mock-exam server for a local network
 Runs the GExam admin console and student exam site on port 3000,
 with the GATE question bank and its own Node.js runtime bundled.
 No internet connection or database server is needed.
EOF

echo "/etc/gexam/gexam.env" > "$STAGE/DEBIAN/conffiles"

cat > "$STAGE/DEBIAN/postinst" <<'EOF'
#!/bin/sh
set -e
if [ "$1" = "configure" ]; then
  getent group gexam >/dev/null || addgroup --system gexam
  getent passwd gexam >/dev/null || adduser --system --ingroup gexam --home /var/lib/gexam --no-create-home --shell /usr/sbin/nologin gexam
  mkdir -p /var/lib/gexam
  chown -R gexam:gexam /var/lib/gexam
  chmod 750 /var/lib/gexam
  gtk-update-icon-cache -q /usr/share/icons/hicolor 2>/dev/null || true
  systemctl daemon-reload || true
  systemctl enable gexam.service >/dev/null 2>&1 || true
  systemctl restart gexam.service || true
  PORT=$(sed -n 's/^PORT=//p' /etc/gexam/gexam.env | tail -1); PORT=${PORT:-3000}
  IP=$(hostname -I 2>/dev/null | cut -d' ' -f1)
  echo ""
  echo "GExam is running. Open the \"GExam Server\" app from your applications menu to start/stop it, or open  http://${IP:-localhost}:${PORT}/admin  to set up the admin account."
  echo "Students open  http://${IP:-localhost}:${PORT}  on their lab PCs (allow the port in your firewall if needed)."
fi
exit 0
EOF

cat > "$STAGE/DEBIAN/prerm" <<'EOF'
#!/bin/sh
set -e
if [ "$1" = "remove" ] || [ "$1" = "upgrade" ] || [ "$1" = "deconfigure" ]; then
  systemctl stop gexam.service >/dev/null 2>&1 || true
fi
if [ "$1" = "remove" ]; then
  systemctl disable gexam.service >/dev/null 2>&1 || true
fi
exit 0
EOF

cat > "$STAGE/DEBIAN/postrm" <<'EOF'
#!/bin/sh
set -e
systemctl daemon-reload >/dev/null 2>&1 || true
if [ "$1" = "purge" ]; then
  # purge deletes exam data too; a plain "remove" keeps it
  rm -rf /var/lib/gexam /etc/gexam /var/log/gexam.log*
  deluser --system gexam >/dev/null 2>&1 || true
fi
exit 0
EOF
chmod 755 "$STAGE/DEBIAN/postinst" "$STAGE/DEBIAN/prerm" "$STAGE/DEBIAN/postrm"

# normalize permissions (dpkg keeps the build user's umask otherwise)
find "$STAGE" -path "$STAGE/DEBIAN" -prune -o -type d -exec chmod 755 {} +
find "$STAGE" -path "$STAGE/DEBIAN" -prune -o -type f ! -perm -u+x -exec chmod 644 {} +

echo "==> Building .deb"
dpkg-deb --root-owner-group -Zxz -z6 --build "$STAGE" "$OUT/gexam_${VERSION}_${ARCH}.deb"
ls -lh "$OUT/gexam_${VERSION}_${ARCH}.deb"
