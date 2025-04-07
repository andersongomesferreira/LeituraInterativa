# Script para iniciar o ambiente de desenvolvimento completo
Write-Host "Iniciando o ambiente de desenvolvimento..."

# Matar processos nas portas 3000, 3001 e 3002
function KillProcessOnPort($port) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($connections) {
            foreach ($conn in $connections) {
                $process = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "Matando processo: $($process.ProcessName) (PID: $($process.Id)) na porta $port"
                    Stop-Process -Id $process.Id -Force
                }
            }
            Write-Host "Porta $port liberada"
        }
        else {
            Write-Host "Nenhum processo encontrado na porta $port"
        }
    }
    catch {
        Write-Host "Erro ao verificar porta $port`: $_"
    }
}

Write-Host "Limpando portas..."
KillProcessOnPort 3000
KillProcessOnPort 3001
KillProcessOnPort 3002

Write-Host "Aguardando 3 segundos para garantir que os processos foram encerrados..."
Start-Sleep -Seconds 3

# Iniciar o servidor como job em background
Write-Host "Iniciando o servidor na porta 3002..."
$env:PORT = 3002
Start-Process powershell -ArgumentList "-Command `"cd '$PSScriptRoot'; npm run dev`"" -WindowStyle Normal

# Aguardar um pouco para o servidor iniciar
Write-Host "Aguardando o servidor iniciar..."
Start-Sleep -Seconds 5

# Iniciar o cliente em outra janela
Write-Host "Iniciando o cliente..."
Start-Process powershell -ArgumentList "-Command `"cd '$PSScriptRoot\client'; npm run dev`"" -WindowStyle Normal

Write-Host "Ambiente de desenvolvimento iniciado!"
Write-Host "Frontend: http://localhost:5173"
Write-Host "Backend: http://localhost:3002"
Write-Host "Teste de Imagens: http://localhost:3002/admin/ai-test/image" 