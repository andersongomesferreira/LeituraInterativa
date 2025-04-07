# Mapeamento da Estrutura de Documentação do LeiturinhaBot

Este documento serve como um guia para navegar e entender a organização da documentação do projeto LeiturinhaBot.

## Estrutura Principal

```
docs/
├── desenvolvimento/       # Padrões e convenções técnicas
│   ├── convencoes-codigo.md
│   └── ...
├── memoria/               # Estado e progresso do projeto
│   └── desenvolvimento/
│       ├── estado-atual.md
│       ├── proximos-passos.md
│       └── progresso.md
├── modulos/               # Documentação técnica de módulos
│   ├── geracao-imagens.md
│   └── ...
├── projeto/               # Arquitetura e visão geral
│   ├── melhorias-sistema-imagens.md
│   └── ...
├── componentes/           # Documentação de componentes UI
│   ├── [categoria]/
│   │   └── [nome-componente].md
│   └── ...
└── guia-ia/               # Guias para uso de IA no desenvolvimento
    ├── instrucoes-assistentes.md
    ├── mapeamento-estrutura-docs.md
    └── ...
```

## Descrição das Pastas Principais

### 1. `/docs/memoria/desenvolvimento/`

Esta pasta contém documentos que rastreiam o estado atual e o progresso do projeto:

- **`estado-atual.md`**: Visão geral atualizada do que está implementado
- **`proximos-passos.md`**: Lista priorizada de tarefas pendentes
- **`progresso.md`**: Métricas e histórico de atualizações

**Quando consultar:** No início de cada sessão de desenvolvimento para entender o contexto atual.

### 2. `/docs/desenvolvimento/`

Contém diretrizes técnicas e convenções de desenvolvimento:

- **`convencoes-codigo.md`**: Padrões de código, nomenclatura, estrutura
- Outros documentos relacionados a padrões de implementação

**Quando consultar:** Ao implementar novo código para garantir consistência.

### 3. `/docs/projeto/`

Documentos de alto nível sobre a arquitetura e decisões de projeto:

- **`melhorias-sistema-imagens.md`**: Documentação sobre melhorias específicas
- Outros documentos de visão geral e arquitetura

**Quando consultar:** Para compreender as decisões arquiteturais e de design.

### 4. `/docs/modulos/`

Documentação técnica detalhada sobre módulos específicos:

- **`geracao-imagens.md`**: Documentação do módulo de geração de imagens
- Outros módulos do sistema

**Quando consultar:** Ao trabalhar em um módulo específico para entender sua implementação.

### 5. `/docs/componentes/`

Documentação sobre componentes de UI, organizados por categoria:

- **`[categoria]/[nome-componente].md`**: Detalhes de implementação de componentes

**Quando consultar:** Ao desenvolver ou modificar componentes de interface.

### 6. `/docs/guia-ia/`

Guias e instruções para o uso de assistentes de IA no desenvolvimento:

- **`instrucoes-assistentes.md`**: Protocolo para assistentes de IA
- **`mapeamento-estrutura-docs.md`**: Este documento

**Quando consultar:** Ao iniciar uma nova sessão com assistentes de IA ou ao procurar documentação.

## Fluxo Recomendado para Consulta de Documentação

1. **Início de sessão**:
   - `/docs/memoria/desenvolvimento/estado-atual.md`
   - `/docs/memoria/desenvolvimento/proximos-passos.md`

2. **Implementação de tarefa específica**:
   - Documentação do módulo relevante em `/docs/modulos/`
   - Convenções em `/docs/desenvolvimento/convencoes-codigo.md`

3. **Após implementação**:
   - Atualizar `/docs/memoria/desenvolvimento/estado-atual.md`
   - Atualizar `/docs/memoria/desenvolvimento/proximos-passos.md`
   - Atualizar `/docs/memoria/desenvolvimento/progresso.md`

4. **Para documentar novo componente/módulo**:
   - Criar documentação no diretório apropriado seguindo os templates existentes

## Regras para Manutenção da Documentação

1. **Mantenha a documentação atualizada** - Atualize os documentos de memória após cada implementação
2. **Siga a estrutura existente** - Não crie novas pastas sem necessidade clara
3. **Respeite os templates** - Siga os formatos existentes para novos documentos
4. **Evite duplicação** - Referencie outros documentos em vez de duplicar informações
5. **Seja específico** - Use nomes claros e descritivos para novos arquivos
6. **Documente decisões** - Explique o porquê das escolhas importantes

## Convenções de Nomeação

- **Arquivos**: Use kebab-case para nomes de arquivos (ex: `convencoes-codigo.md`)
- **Pastas**: Use kebab-case para nomes de pastas (ex: `guia-ia`)
- **Títulos**: Use Título Case para títulos dentro dos documentos
- **Referências**: Ao referenciar arquivos, use caminhos relativos sempre que possível