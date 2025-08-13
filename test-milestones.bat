@echo off
echo ========================================
echo        KRYPT MILESTONE TESTING
echo ========================================
echo.

:menu
echo Choose an option:
echo.
echo 1. Set early access count to 25 (trigger Early Pioneers)
echo 2. Set early access count to 125 (trigger Growing Community) 
echo 3. Set early access count to 500 (trigger Established Base)
echo 4. Set early access count to 1500 (trigger Thriving Ecosystem)
echo 5. Set early access count to 5000 (trigger Massive Adoption)
echo 6. Manually trigger specific milestone by ID
echo 7. Reset to current count (1)
echo 8. Check current stats
echo 9. Exit
echo.
set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto set25
if "%choice%"=="2" goto set125
if "%choice%"=="3" goto set500
if "%choice%"=="4" goto set1500
if "%choice%"=="5" goto set5000
if "%choice%"=="6" goto manual
if "%choice%"=="7" goto reset
if "%choice%"=="8" goto stats
if "%choice%"=="9" goto exit
goto menu

:set25
echo Setting early access count to 25...
curl -X POST "https://kryptterminal.com/api/admin/set-early-access-count" ^
     -H "Content-Type: application/json" ^
     -d "{\"count\": 25, \"adminKey\": \"krypt_admin_test_2024\"}"
echo.
pause
goto menu

:set125
echo Setting early access count to 125...
curl -X POST "https://kryptterminal.com/api/admin/set-early-access-count" ^
     -H "Content-Type: application/json" ^
     -d "{\"count\": 125, \"adminKey\": \"krypt_admin_test_2024\"}"
echo.
pause
goto menu

:set500
echo Setting early access count to 500...
curl -X POST "https://kryptterminal.com/api/admin/set-early-access-count" ^
     -H "Content-Type: application/json" ^
     -d "{\"count\": 500, \"adminKey\": \"krypt_admin_test_2024\"}"
echo.
pause
goto menu

:set1500
echo Setting early access count to 1500...
curl -X POST "https://kryptterminal.com/api/admin/set-early-access-count" ^
     -H "Content-Type: application/json" ^
     -d "{\"count\": 1500, \"adminKey\": \"krypt_admin_test_2024\"}"
echo.
pause
goto menu

:set5000
echo Setting early access count to 5000...
curl -X POST "https://kryptterminal.com/api/admin/set-early-access-count" ^
     -H "Content-Type: application/json" ^
     -d "{\"count\": 5000, \"adminKey\": \"krypt_admin_test_2024\"}"
echo.
pause
goto menu

:manual
echo.
echo Available milestone IDs:
echo - milestone_1 (Early Pioneers - 250 tokens)
echo - milestone_2 (Growing Community - 350 tokens)
echo - milestone_3 (Established Base - 500 tokens)
echo - milestone_4 (Thriving Ecosystem - 1000 tokens)
echo - milestone_5 (Massive Adoption - 2000 tokens)
echo.
set /p milestone_id="Enter milestone ID: "
echo Triggering milestone %milestone_id%...
curl -X POST "https://kryptterminal.com/api/admin/trigger-milestone" ^
     -H "Content-Type: application/json" ^
     -d "{\"milestoneId\": \"%milestone_id%\", \"adminKey\": \"krypt_admin_test_2024\"}"
echo.
pause
goto menu

:reset
echo Resetting early access count to 1...
curl -X POST "https://kryptterminal.com/api/admin/set-early-access-count" ^
     -H "Content-Type: application/json" ^
     -d "{\"count\": 1, \"adminKey\": \"krypt_admin_test_2024\"}"
echo.
pause
goto menu

:stats
echo Checking current stats...
curl -X GET "https://kryptterminal.com/api/stats"
echo.
pause
goto menu

:exit
echo Goodbye!
pause
exit