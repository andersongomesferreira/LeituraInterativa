@echo off
echo Verificando e encerrando processos nas portas 3000, 3001 e 3002...

REM Verificar porta 3000
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000') DO (
  echo Processo usando porta 3000: %%P
  taskkill /F /PID %%P
  echo Processo encerrado: %%P
)

REM Verificar porta 3001
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3001') DO (
  echo Processo usando porta 3001: %%P
  taskkill /F /PID %%P
  echo Processo encerrado: %%P
)

REM Verificar porta 3002
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3002') DO (
  echo Processo usando porta 3002: %%P
  taskkill /F /PID %%P
  echo Processo encerrado: %%P
)

echo Portas liberadas, agora você pode iniciar o servidor. 