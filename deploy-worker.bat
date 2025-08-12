@echo off
echo ======================================
echo   DEPLOY CLOUDFLARE WORKER
echo ======================================
echo.
echo This will deploy the enhanced worker with nuclear reset fixes.
echo Make sure you're logged into Cloudflare CLI first.
echo.
set /p confirm="Deploy now? (yes/no): "

if %confirm%==yes (
    echo Deploying enhanced worker...
    npx wrangler deploy cloudflare-worker-enhanced.js
    echo.
    echo Deployment complete! 
    echo The nuclear reset should now work properly.
    echo Test it using: admin-commands.bat (Option 5)
) else (
    echo Deployment cancelled.
)

echo.
pause