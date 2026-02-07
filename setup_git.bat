@echo off
git init
git remote remove origin
git remote add origin https://github.com/tryankita/car-game.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main
