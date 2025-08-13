@echo off
echo ================================
echo  KRYPT TERMINAL UNIFIED DEPLOYMENT
echo ================================
echo.

echo [1/3] Deploying unified worker to Cloudflare...
call npx wrangler deploy
if %ERRORLEVEL% neq 0 (
    echo ❌ Deployment failed!
    pause
    exit /b 1
)

echo.
echo [2/3] Waiting for deployment to propagate...
timeout /t 10 /nobreak

echo.
echo [3/3] Running acceptance tests...
node test-unified-worker.js
if %ERRORLEVEL% neq 0 (
    echo ❌ Tests failed!
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS: Unified worker deployed and verified!
echo.
echo 🌐 Worker URL: https://krypt-terminal-unified.kimberly-92f.workers.dev
echo 📊 Frontend: https://kryptterminal.com
echo.

pause