@echo off
echo Testing Leaderboard Functionality
echo ==================================
echo.

echo Step 1: Adding test users with balances...
echo.

echo Adding User 1 (0x1234...abcd) with 1000 tokens
curl -X POST "https://kryptterminal.com/api/user/balance" -H "Content-Type: application/json" -d "{\"walletAddress\": \"0x1234567890abcdef1234567890abcdef12345678\", \"balance\": 1000}"
echo.

echo Adding User 2 (0xabcd...1234) with 750 tokens
curl -X POST "https://kryptterminal.com/api/user/balance" -H "Content-Type: application/json" -d "{\"walletAddress\": \"0xabcdef1234567890abcdef1234567890abcdef12\", \"balance\": 750}"
echo.

echo Adding User 3 (0x9876...5432) with 500 tokens
curl -X POST "https://kryptterminal.com/api/user/balance" -H "Content-Type: application/json" -d "{\"walletAddress\": \"0x9876543210fedcba9876543210fedcba98765432\", \"balance\": 500}"
echo.
echo.

echo Step 2: Fetching leaderboard...
echo.
curl -X GET "https://kryptterminal.com/api/leaderboard"
echo.
echo.

echo Step 3: Checking if leaderboard appears on website...
echo Please check https://kryptterminal.com to see if Top Holders shows the test users.
echo.

pause