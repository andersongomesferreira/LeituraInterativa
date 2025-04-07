# Script para matar processos nas portas 3000, 3001 e 3002
Write-Host "Limpando portas 3000, 3001 e 3002..."

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

KillProcessOnPort 3000
KillProcessOnPort 3001
KillProcessOnPort 3002

Write-Host "Aguardando 3 segundos para garantir que os processos foram encerrados..."
Start-Sleep -Seconds 3
Write-Host "Portas liberadas!" 