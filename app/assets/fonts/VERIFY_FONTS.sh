#!/bin/bash
echo "Checking for required font files..."
echo ""

DUNBAR="DunbarTall-Regular.ttf"
CASLON="CaslonPro3-Regular.ttf"

if [ -f "$DUNBAR" ]; then
    echo "✅ Found: $DUNBAR"
else
    echo "❌ Missing: $DUNBAR"
fi

if [ -f "$CASLON" ]; then
    echo "✅ Found: $CASLON"
else
    echo "❌ Missing: $CASLON"
fi

echo ""
if [ -f "$DUNBAR" ] && [ -f "$CASLON" ]; then
    echo "🎉 All fonts are ready! Restart the app to load them."
else
    echo "⚠️  Some fonts are missing. The app will use system fonts as fallback."
fi
