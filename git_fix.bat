@echo off
echo Fixing git repository configuration...

REM Set the correct remote URL
git remote set-url origin https://github.com/tryankita/car-game.git

REM Configure user
git config user.name "tryankita"
git config user.email "try.ankitasharma@gmail.com"

REM Show current status
echo.
echo === Remote Configuration ===
git remote -v

echo.
echo === Git Status ===
git status

echo.
echo === Staging all changes ===
git add .

echo.
echo === Committing ===
git commit -m "Update car game files" --allow-empty

echo.
echo === Pushing to GitHub ===
git push -u origin main --force

echo.
echo Done!
pause
