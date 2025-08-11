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
echo 5. Clear ALL visitor records (testing)
echo 6. Add test user balance
echo 7. Exit
echo.
set /p choice="Enter your choice (1-7): "

if %choice%==1 goto SET_ONE
if %choice%==2 goto SET_CUSTOM
if %choice%==3 goto RESET_ALL
if %choice%==4 goto RESET_PROGRESS
if %choice%==5 goto CLEAR_VISITORS
if %choice%==6 goto ADD_BALANCE
if %choice%==7 goto END

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
echo WARNING: This will clear ALL visitor tracking records!
echo This means ALL current users will be counted as new visitors when they return.
set /p confirm="Are you sure? (yes/no): "
if %confirm%==yes (
    echo Clearing all visitor records...
    curl -X POST "https://kryptterminal.com/api/admin/clear-visitors" -H "Content-Type: application/json" -d "{\"adminKey\":\"krypt_master_reset_2024\"}"
    echo.
    echo All visitor records cleared! Everyone will now count as new visitors.
) else (
    echo Clear cancelled.
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

:END
echo Goodbye!