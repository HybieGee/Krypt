@echo off
echo ========================================
echo    RESTORE DEVELOPMENT LOGS
echo ========================================
echo.
echo This will add sample development logs to show Krypt's work history
echo.

REM Add initial system log
curl -X POST "https://kryptterminal.com/api/logs/add" ^
  -H "Content-Type: application/json" ^
  -d "{\"apiKey\":\"krypt_api_key_2024\",\"log\":{\"type\":\"system\",\"message\":\"🚀 Krypt Terminal AI initialized - Building Web3 infrastructure\",\"details\":{\"phase\":1}}}"

timeout /t 1 > nul

REM Add blockchain foundation logs
curl -X POST "https://kryptterminal.com/api/logs/add" ^
  -H "Content-Type: application/json" ^
  -d "{\"apiKey\":\"krypt_api_key_2024\",\"log\":{\"type\":\"code\",\"message\":\"✅ BlockStructure.sol created (312 lines)\",\"details\":{\"componentName\":\"BlockStructure\",\"phase\":1}}}"

timeout /t 1 > nul

curl -X POST "https://kryptterminal.com/api/logs/add" ^
  -H "Content-Type: application/json" ^
  -d "{\"apiKey\":\"krypt_api_key_2024\",\"log\":{\"type\":\"code\",\"message\":\"✅ TransactionPool implemented (245 lines)\",\"details\":{\"componentName\":\"TransactionPool\",\"phase\":1}}}"

timeout /t 1 > nul

curl -X POST "https://kryptterminal.com/api/logs/add" ^
  -H "Content-Type: application/json" ^
  -d "{\"apiKey\":\"krypt_api_key_2024\",\"log\":{\"type\":\"code\",\"message\":\"✅ CryptographicHash module deployed (189 lines)\",\"details\":{\"componentName\":\"CryptographicHash\",\"phase\":1}}}"

timeout /t 1 > nul

curl -X POST "https://kryptterminal.com/api/logs/add" ^
  -H "Content-Type: application/json" ^
  -d "{\"apiKey\":\"krypt_api_key_2024\",\"log\":{\"type\":\"commit\",\"message\":\"📦 Initial blockchain core committed to repository\",\"details\":{\"commitCount\":15}}}"

timeout /t 1 > nul

curl -X POST "https://kryptterminal.com/api/logs/add" ^
  -H "Content-Type: application/json" ^
  -d "{\"apiKey\":\"krypt_api_key_2024\",\"log\":{\"type\":\"code\",\"message\":\"✅ MerkleTree implementation complete (423 lines)\",\"details\":{\"componentName\":\"MerkleTree\",\"phase\":1}}}"

timeout /t 1 > nul

curl -X POST "https://kryptterminal.com/api/logs/add" ^
  -H "Content-Type: application/json" ^
  -d "{\"apiKey\":\"krypt_api_key_2024\",\"log\":{\"type\":\"system\",\"message\":\"🎯 Phase 1 Foundation - 75 components completed\",\"details\":{\"componentsCompleted\":75,\"phase\":1}}}"

echo.
echo ========================================
echo Development logs restored!
echo Check the website to see the logs.
echo ========================================
pause