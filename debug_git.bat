@echo off
echo Starting git debug > debug_git.txt
git --version >> debug_git.txt 2>&1
echo Attempting git init >> debug_git.txt
git init >> debug_git.txt 2>&1
echo Checking status >> debug_git.txt
git status >> debug_git.txt 2>&1
echo Checking remote >> debug_git.txt
git remote -v >> debug_git.txt 2>&1
echo Done >> debug_git.txt
