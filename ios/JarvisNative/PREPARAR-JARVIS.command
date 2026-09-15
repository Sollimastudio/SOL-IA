#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

echo ""
echo "JARVIS — PREPARAÇÃO DO APP NATIVO"
echo "=================================="
echo ""

if ! command -v xcodebuild >/dev/null 2>&1; then
  echo "Xcode não foi encontrado neste Mac. Instale/abra o Xcode uma vez e execute este arquivo novamente."
  read -r -p "Pressione Enter para fechar."
  exit 1
fi

if ! xcodebuild -version >/dev/null 2>&1; then
  echo "O Xcode existe, mas ainda não está pronto. Abra o Xcode, aceite os termos e conclua a instalação dos componentes."
  read -r -p "Pressione Enter para fechar."
  exit 1
fi

if ! command -v xcodegen >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    echo "Falta apenas o XcodeGen, ferramenta gratuita que transforma project.yml em projeto Xcode."
    read -r -p "Posso instalar o XcodeGen pelo Homebrew agora? [s/N] " answer
    case "$answer" in
      s|S|sim|SIM|Sim) brew install xcodegen ;;
      *) echo "Nada foi alterado. Quando quiser, instale XcodeGen e execute novamente."; read -r -p "Pressione Enter para fechar."; exit 1 ;;
    esac
  else
    echo "XcodeGen não está instalado e este Mac não tem Homebrew disponível."
    echo "Abra esta pasta no ChatGPT quando chegar a esta etapa para eu te orientar sem comandos manuais."
    read -r -p "Pressione Enter para fechar."
    exit 1
  fi
fi

echo "Gerando o projeto nativo..."
xcodegen generate --spec project.yml

echo "Compilando uma prova no SDK do iPhone, sem instalar nada ainda..."
set +e
xcodebuild \
  -project JarvisNative.xcodeproj \
  -scheme JarvisNative \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGNING_ALLOWED=NO \
  build | tee /tmp/jarvis-native-build.log
build_status=${PIPESTATUS[0]}
set -e

if [ "$build_status" -ne 0 ]; then
  echo ""
  echo "A compilação encontrou um erro. Não tente instalar ainda."
  echo "O relatório ficou em /tmp/jarvis-native-build.log. Traga esse arquivo para o chat e eu corrijo o código."
  read -r -p "Pressione Enter para fechar."
  exit "$build_status"
fi

echo ""
echo "✓ Código nativo compilado no SDK da Apple."
echo "Abrindo o projeto no Xcode."
echo "A partir daqui será necessário o seu iPhone conectado e a sua autorização de assinatura Apple."
open JarvisNative.xcodeproj
