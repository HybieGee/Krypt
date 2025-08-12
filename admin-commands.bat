@echo off
echo ========================================
echo    KRYPT TERMINAL ADMIN COMMANDS
echo ========================================
echo.
echo Choose an option:
echo 1. Set visitor count to 1
echo 2. Set visitor count to custom number
echo 3. Reset ALL (progress, logs, visitors)
echo 4. Reset progress only
echo 5. NUCLEAR RESET (everything + visitor records)
echo 6. Add test user balance
echo 7. Set progress manually (for testing only)
echo 8. Set progress to ZERO (immediate)
echo 9. Set early access users to 0
echo 10. Initialize system data (fix deployment resets)
echo 11. Restore development logs (if missing)
echo 12. Exit
echo.
set /p choice="Enter your choice (1-12): "

if %choice%==1 goto SET_ONE
if %choice%==2 goto SET_CUSTOM
if %choice%==3 goto RESET_ALL
if %choice%==4 goto RESET_PROGRESS
if %choice%==5 goto CLEAR_VISITORS
if %choice%==6 goto ADD_BALANCE
if %choice%==7 goto SET_PROGRESS
if %choice%==8 goto SET_ZERO
if %choice%==9 goto SET_USERS_ZERO
if %choice%==10 goto INITIALIZE
if %choice%==11 goto RESTORE_LOGS
if %choice%==12 goto END

:SET_ONE
echo Setting visitor count to 1...
curl -X POST "https://kryptterminal.com/api/admin/set-count" -H "Content-Type: application/json" -d "{\"adminKey\":\"krypt_master_reset_2024\",\"count\":1}"
echo.
pause
goto END

:SET_CUSTOM
set /p count="Enter the visitor count: "
echo Setting visitor count to %count%...
curl -X POST "https://kryptterminal.com/api/admin/set-count" -H "Content-Type: application/json" -d "{\"adminKey\":\"krypt_master_reset_2024\",\"count\":%count%}"
echo.
pause
goto END

:RESET_ALL
echo WARNING: This will reset EVERYTHING for launch!
set /p confirm="Are you sure? (yes/no): "
if %confirm%==yes (
    echo Resetting all systems...
    curl -X POST "https://kryptterminal.com/api/admin/reset-all" -H "Content-Type: application/json" -d "{\"adminKey\":\"krypt_master_reset_2024\",\"resetVisitors\":true}"
    echo.
    echo Reset complete!
) else (
    echo Reset cancelled.
)
pause
goto END

:RESET_PROGRESS
echo Resetting development progress only...
curl -X POST "https://kryptterminal.com/api/admin/reset-all" -H "Content-Type: application/json" -d "{\"adminKey\":\"krypt_master_reset_2024\",\"resetVisitors\":false}"
echo.
pause
goto END

:CLEAR_VISITORS
echo =============================================
echo    ⚠️  NUCLEAR RESET WARNING ⚠️ 
echo =============================================
echo This will reset EVERYTHING:
echo - Development progress (back to 100 min)
echo - Development logs (all cleared)
echo - Visitor count (back to 0)
echo - ALL visitor records (everyone becomes new)
echo - ALL wallet balances (completely wiped)
echo - ALL milestone progress (reset)
echo - ALL raffle entries (cleared)
echo.
echo This is the ULTIMATE reset for testing!
set /p confirm="Are you ABSOLUTELY sure? (yes/no): "
if %confirm%==yes (
    echo Performing NUCLEAR RESET...
    curl -X POST "https://kryptterminal.com/api/admin/clear-visitors" -H "Content-Type: application/json" -d "{\"adminKey\":\"krypt_master_reset_2024\"}"
    echo.
    echo NUCLEAR RESET COMPLETE! Everything is now fresh.
    echo.
    echo ===============================================
    echo   FRESH WALLET SETUP REQUIRED
    echo ===============================================
    echo Run: fresh-start.bat
    echo This will auto-clear your browser data and give you
    echo a completely fresh wallet experience!
    echo ===============================================
) else (
    echo Nuclear reset cancelled - wise choice!
)
pause
goto END

:ADD_BALANCE
set /p wallet="Enter wallet address (e.g., 0x1234...): "
set /p balance="Enter balance amount: "
echo Adding balance for %wallet%...
curl -X POST "https://kryptterminal.com/api/user/balance" -H "Content-Type: application/json" -d "{\"walletAddress\": \"%wallet%\", \"balance\": %balance%}"
echo.
pause
goto END

:SET_PROGRESS
echo NOTE: Progress should only be updated by Krypt's API calls!
echo This manual setting is for testing purposes only.
set /p components="Enter number of components completed (0-4500): "
echo Setting progress to %components% components (TEST MODE)...
curl -X POST "https://kryptterminal.com/api/admin/set-progress" -H "Content-Type: application/json" -d "{\"adminKey\":\"krypt_master_reset_2024\",\"componentsCompleted\":%components%}"
echo.
pause
goto END

:SET_ZERO
echo Setting progress to ZERO components (immediate reset)...
curl -X POST "https://kryptterminal.com/api/admin/set-progress" -H "Content-Type: application/json" -d "{\"adminKey\":\"krypt_master_reset_2024\",\"componentsCompleted\":0}"
echo.
echo Progress set to 0!
pause
goto END

:SET_USERS_ZERO
echo Setting early access users to 0...
curl -X POST "https://kryptterminal.com/api/admin/set-count" -H "Content-Type: application/json" -d "{\"adminKey\":\"krypt_master_reset_2024\",\"count\":0}"
echo.
echo Early access users set to 0!
pause
goto END

:INITIALIZE
echo =============================================
echo    🔧 SYSTEM INITIALIZATION 🔧
echo =============================================
echo This will initialize system data if missing.
echo Use this to fix deployment resets!
echo.
echo This will ONLY create data if none exists.
echo Existing progress/logs will be preserved.
echo.
set /p confirm="Initialize system data? (yes/no): "
if %confirm%==yes (
    echo Initializing system...
    curl -X POST "https://kryptterminal.com/api/admin/initialize" -H "Content-Type: application/json" -d "{\"adminKey\":\"krypt_master_reset_2024\",\"forceReset\":false}"
    echo.
    echo System initialization complete!
) else (
    echo Initialization cancelled.
)
pause
goto END

:RESTORE_LOGS
echo =============================================
echo    📝 RESTORE DEVELOPMENT LOGS 📝
echo =============================================
echo This will restore development logs if they are missing.
echo Use this after deployments clear the log history.
echo.
set /p confirm="Restore development logs? (yes/no): "
if %confirm%==yes (
    echo Restoring logs using populate script...
    node populate-realistic-logs.js
    echo.
    echo Development logs restored!
) else (
    echo Log restoration cancelled.
)
pause
goto END

:END
echo Goodbye!