# Script PowerShell para iniciar o servidor
Write-Host "Verificando e encerrando processos nas portas 3000, 3001 e 3002..."

# Matar processos nas portas 3000, 3001 e 3002
$ports = @(3000, 3001, 3002)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
    if ($process) {
        Write-Host "Encerrando processo na porta $port (PID: $process)"
        taskkill /F /PID $process
    }
}

# Definir a variável de ambiente PORT
$env:PORT = 3002

# Navegar para a raiz do projeto e executar o servidor
Set-Location $PSScriptRoot
Write-Host "Iniciando o servidor na porta 3002..."
npm run dev 