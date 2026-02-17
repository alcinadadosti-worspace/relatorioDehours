# Relatório de Horas - Análise de Ponto

Aplicação front-end (Static Site) para análise de planilhas Excel de controle de ponto, com geração de gráficos e exportação de relatório PDF.

## Funcionalidades

- **Upload de Excel**: Arraste ou selecione arquivos .xlsx/.xls
- **Múltiplas abas**: Consolidação automática de várias abas
- **Parser inteligente**: Interpreta a coluna "Diferenca" em formatos como `+2h55min`, `-30min`, etc.
- **Agrupamento por ID**: Consolida registros por colaborador
- **Ajustes configuráveis**: Bônus para Hora Extra e penalidade para Atraso
- **Dashboard interativo**: KPIs, gráficos e tabelas filtráveis
- **Visualização individual**: Detalhes por colaborador com gráfico de evolução
- **Exportação PDF**: Relatório completo com design profissional

## Tecnologias

- **Vite** - Build tool rápido
- **React 18** - Biblioteca UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **SheetJS (xlsx)** - Leitura de Excel
- **ECharts** - Gráficos interativos
- **jsPDF** - Geração de PDF (via print)

## Pré-requisitos

- Node.js 18+
- npm ou yarn

## Instalação

```bash
# Clone o repositório
git clone https://github.com/alcinadadosti-worspace/relatorioDehours.git
cd relatorioDehours

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:5173`

## Build para Produção

```bash
# Gera os arquivos estáticos em /dist
npm run build

# Preview do build
npm run preview
```

## Deploy no Render

### Opção 1: Static Site (Recomendado)

1. Acesse [render.com](https://render.com) e faça login
2. Clique em **New +** → **Static Site**
3. Conecte seu repositório GitHub
4. Configure:
   - **Name**: `relatorio-de-horas`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
5. Clique em **Create Static Site**

### Opção 2: Usando render.yaml

Crie um arquivo `render.yaml` na raiz do projeto:

```yaml
services:
  - type: web
    name: relatorio-de-horas
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    headers:
      - path: /*
        name: Cache-Control
        value: public, max-age=31536000
```

Depois, no Render:
1. **New +** → **Blueprint**
2. Conecte o repositório
3. O Render detectará automaticamente o `render.yaml`

## Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Upload.tsx       # Área de upload drag & drop
│   ├── Filters.tsx      # Filtros e configurações
│   ├── KPI.tsx          # Cards de indicadores
│   ├── Charts.tsx       # Gráficos ECharts
│   ├── Tables.tsx       # Tabelas de dados
│   ├── PDFReport.tsx    # Componente de relatório PDF
│   └── CollaboratorDetail.tsx
│
├── lib/                 # Utilitários e lógica
│   ├── types.ts         # Interfaces TypeScript
│   ├── time.ts          # Parser de tempo/diferença
│   ├── excel.ts         # Parser de Excel
│   └── aggregation.ts   # Agregação e cálculos
│
├── App.tsx              # Componente principal
├── main.tsx             # Entry point
└── index.css            # Estilos Tailwind
```

## Formato da Planilha

### Colunas Obrigatórias

| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| **ID** | Identificador único do colaborador | `123` |
| **Colaborador** | Nome do colaborador | `João Silva` |
| **Classificacao** | Tipo do registro | `Normal`, `Hora Extra`, `Atraso` |
| **Diferenca** | Diferença de tempo | `+2h30min`, `-15min`, `-` |

### Colunas Opcionais

- `Data` - Data do registro (DD/MM/YYYY)
- `Dia` - Dia da semana
- `Entrada` - Horário de entrada
- `Saida` - Horário de saída
- `Gestor` - Nome do gestor
- `Intervalo` / `Retorno` - Horários de intervalo

### Formato da coluna "Diferenca"

O parser aceita os seguintes formatos:

- `+5min` - 5 minutos positivos
- `-30min` - 30 minutos negativos
- `+2h` - 2 horas positivas
- `-1h30min` - 1 hora e 30 minutos negativos
- `+2h55min` - 2 horas e 55 minutos positivos
- `-` ou vazio - Sem dados (não computado)

## Regras de Cálculo

### Ajustes por Classificação

Por padrão:
- **Hora Extra**: +4 horas de bônus por registro
- **Atraso**: -2 horas de penalidade por registro

Esses valores são configuráveis na interface.

### Fórmula do Total Ajustado

```
Total Ajustado = Total Bruto + (Qtd Hora Extra × Bônus) - (Qtd Atraso × Penalidade)
```

## Limitações Conhecidas

1. **Tamanho do arquivo**: Arquivos muito grandes (>50MB) podem demorar para processar
2. **Formatos de data**: Apenas DD/MM/YYYY e YYYY-MM-DD são suportados
3. **PDF**: A exportação usa `window.print()`, dependendo do navegador para gerar PDF
4. **Navegadores**: Testado em Chrome, Firefox e Edge modernos

## Decisões Técnicas

1. **SheetJS** foi escolhido por ser a biblioteca mais robusta para leitura de Excel no browser
2. **ECharts** oferece melhor performance que Chart.js para datasets grandes
3. **Print to PDF** foi preferido sobre jsPDF puro para manter a qualidade visual dos gráficos
4. **Tailwind CSS** permite desenvolvimento rápido com design consistente

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

MIT
