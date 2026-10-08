@echo off
chcp 65001 >nul
rem Video faylni (yoki bir nechta bo'lakni) shu fayl ustiga sichqoncha bilan tashlang.
rem Natija: public\media\tour-hd.mp4 va tour.mp4 yangilanadi.

if "%~1"=="" (
  echo.
  echo  Video faylni shu "video-yangilash.bat" ustiga sichqoncha bilan olib kelib tashlang.
  echo  Bir nechta bo'lak bo'lsa - hammasini birga belgilab tashlang ^(1.mp4, 2.mp4 ...^).
  echo.
  pause
  exit /b 1
)

cd /d "%~dp0"
echo  Video tayyorlanmoqda, 1-3 daqiqa kuting...
"C:\Program Files\Git\bin\bash.exe" scripts/prepare-video.sh %*
echo.
if errorlevel 1 (echo  XATO yuz berdi - yuqoridagi yozuvni Claude'ga yuboring.) else (echo  TAYYOR! Endi Claude'ga "video tayyor" deb yozing - bo'lim vaqtlarini moslaydi.)
pause
