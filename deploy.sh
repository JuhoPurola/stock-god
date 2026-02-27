#!/bin/bash
# One-command deployment for Stock Picker
# Bypasses CloudFormation export issues by updating Lambda directly

set -e

echo "🔨 Building all packages..."
pnpm run build

echo "📦 Synthesizing CDK stack..."
cd infrastructure
npx cdk synth StockPicker-production-Api --quiet --context environment=production > /dev/null 2>&1
cd ..

echo "📤 Packaging Lambda function..."
LATEST_ASSET=$(ls -t infrastructure/cdk.out/asset.*/index.js | head -1)
mkdir -p /tmp/stock-picker-deploy
cp "$LATEST_ASSET" /tmp/stock-picker-deploy/index.js
cd /tmp/stock-picker-deploy
rm -f lambda.zip
zip -q lambda.zip index.js

echo "🚀 Deploying Lambda to production..."
FUNCTION_NAME=$(aws lambda list-functions --region eu-west-1 \
  --query 'Functions[?contains(FunctionName, `StockPicker-production-Api`)].FunctionName' \
  --output text)

aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file fileb:///tmp/stock-picker-deploy/lambda.zip \
  --region eu-west-1 \
  --query 'LastModified' \
  --output text > /dev/null

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Frontend: https://d18x5273m9nt2k.cloudfront.net"
echo "🔌 API: https://t8touk4lch.execute-api.eu-west-1.amazonaws.com"
echo "🧪 Test endpoint: curl -X POST https://t8touk4lch.execute-api.eu-west-1.amazonaws.com/demo/micro-cap-backtest"
echo ""
