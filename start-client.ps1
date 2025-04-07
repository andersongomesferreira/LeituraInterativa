# Script PowerShell para iniciar o cliente
Write-Host "Iniciando o cliente..."

# Navegar para a pasta client e executar o cliente
Set-Location $PSScriptRoot\client
npm run dev 