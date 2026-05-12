# 3ª Cia PM MAmb — Sistema de Controle de Chamada

Sistema de controle de presença em instruções policiais militares.
Visual idêntico ao painel fornecido. Stack: Next.js 14 + Tailwind CSS + Google Sheets + Vercel.

---

## ESTRUTURA DE PASTAS

```
pmmg-chamada/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          ← Páginas protegidas (layout com sidebar)
│   │   │   ├── layout.tsx        ← Sidebar + autenticação
│   │   │   ├── dashboard/        ← Dashboard principal (idêntico à imagem)
│   │   │   ├── chamada/          ← Lançamento de chamada por grupamento
│   │   │   ├── consultas/        ← Pesquisa com filtros avançados
│   │   │   ├── relatorios/       ← Geração de PDF
│   │   │   ├── militares/        ← CRUD de militares (admin)
│   │   │   └── configuracoes/    ← Definir instrução atual (admin)
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ ← Autenticação NextAuth
│   │   │   ├── dashboard/        ← Stats do dashboard
│   │   │   ├── chamada/          ← GET/POST chamadas
│   │   │   ├── militares/        ← GET/POST/PUT militares
│   │   │   └── config/           ← GET/POST configuração instrução
│   │   ├── login/                ← Tela de login (idêntica à imagem)
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── lib/
│   │   ├── sheets.ts             ← Toda integração Google Sheets
│   │   ├── auth.ts               ← Configuração NextAuth
│   │   ├── pdf.ts                ← Geração de PDF com jsPDF
│   │   └── utils.ts              ← Helpers e constantes
│   └── types/index.ts            ← TypeScript types
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## PASSO 1 — GOOGLE SHEETS

### 1.1 Criar a planilha

Acesse https://sheets.google.com e crie uma planilha nova. Guarde o ID da URL:
`https://docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit`

### 1.2 Criar as abas

Crie estas 3 abas (exatamente com estes nomes):

**Aba: USUARIOS_MILITARES**
Cabeçalhos na linha 1 (colunas A até K):
```
id | posto | nome | nome_guerra | login | senha | perfil | pelotao | grupamento | funcao | ativo
```

**Aba: DADOS_CHAMADAS**
Cabeçalhos na linha 1 (colunas A até K):
```
data | assunto | grupamento | militar | posto | nome_guerra | pelotao | status | justificativa | responsavel | observacao
```

**Aba: CONFIG**
Cabeçalhos na linha 1 (colunas A e B):
```
data | assunto
```
Na linha 2, insira os valores iniciais:
```
10/05/2026 | Uso Progressivo da Força
```

### 1.3 Inserir militares de teste

Na aba USUARIOS_MILITARES, insira na linha 2:
```
0001 | Cap PM | Fulano de Tal | Fulano | 000.000-0 | 123456 | admin | ADM | ADM | Comandante | TRUE
```

### 1.4 Conta de serviço Google

1. Acesse https://console.cloud.google.com
2. Crie um projeto novo ou selecione um existente
3. Ative a **Google Sheets API** em "APIs e Serviços > Biblioteca"
4. Em "APIs e Serviços > Credenciais", clique em "Criar credenciais > Conta de serviço"
5. Dê um nome (ex: pmmg-sheets) e clique em "Criar"
6. Na conta de serviço criada, vá em "Chaves > Adicionar chave > Criar nova chave > JSON"
7. Baixe o arquivo JSON gerado
8. Copie o conteúdo completo do JSON (será usado como variável de ambiente)
9. Copie o e-mail da conta de serviço (formato: xxx@xxx.iam.gserviceaccount.com)

### 1.5 Compartilhar a planilha

Na planilha do Google Sheets, clique em "Compartilhar" e adicione o e-mail da conta de serviço com permissão de **Editor**.

---

## PASSO 2 — CONFIGURAR O PROJETO LOCAL

```bash
# Clone ou copie a pasta do projeto
cd pmmg-chamada

# Instalar dependências
npm install

# Criar arquivo de variáveis de ambiente
cp .env.local.example .env.local
```

Edite o `.env.local`:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=gere_uma_chave_aqui_use_openssl_rand_base64_32

GOOGLE_SPREADSHEET_ID=cole_o_id_da_planilha_aqui
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...cole o JSON completo aqui como uma linha só...}
```

> **Dica para NEXTAUTH_SECRET**: rode `openssl rand -base64 32` no terminal

```bash
# Rodar em desenvolvimento
npm run dev
```

Acesse http://localhost:3000 — será redirecionado para /login.

---

## PASSO 3 — DEPLOY NA VERCEL

### 3.1 Preparar o repositório

```bash
git init
git add .
git commit -m "Sistema PMMG Chamada"

# Crie um repositório no GitHub e faça push
git remote add origin https://github.com/seu-usuario/pmmg-chamada.git
git push -u origin main
```

### 3.2 Deploy na Vercel

1. Acesse https://vercel.com e faça login
2. Clique em "New Project" e importe o repositório do GitHub
3. Em "Environment Variables", adicione:

| Nome | Valor |
|------|-------|
| NEXTAUTH_URL | https://seu-projeto.vercel.app |
| NEXTAUTH_SECRET | sua_chave_secreta_gerada |
| GOOGLE_SPREADSHEET_ID | id_da_planilha |
| GOOGLE_SERVICE_ACCOUNT_KEY | conteúdo_completo_do_json_em_uma_linha |

4. Clique em "Deploy"
5. Após o deploy, copie a URL gerada e atualize `NEXTAUTH_URL` com ela
6. Faça um novo deploy (Settings > Deployments > Redeploy)

---

## FUNCIONALIDADES

### Login
- Número de Polícia e Senha
- Admin e Usuário (perfis distintos)
- Visual idêntico à imagem fornecida

### Dashboard (admin e usuário)
- Cards: Total de Militares, Presentes, Ausentes, ADM, Pendentes
- Gráfico de pizza: Presença por Grupamento
- Tabela: Pendências por Grupamento (PENDENTE/CONCLUÍDO)
- Tabela: Resumo por Pelotão com percentuais
- Instrução Atual no canto superior
- Visual 100% idêntico à imagem fornecida

### Lançar Chamada
- Usuário vê automaticamente seu grupamento
- Admin pode selecionar qualquer grupamento
- Preenchimento coletivo em tela única
- Botões P/A por militar
- Justificativa para ausentes
- Botões "Todos Presentes" / "Todos Ausentes"
- Salva cada militar como uma linha no Sheets

### Consultas
- Filtros: data início/fim, militar, grupamento, status, assunto, responsável
- Tabela com todos os registros filtrados

### Relatórios
- Seleciona data e grupamento
- Pré-visualização com estatísticas
- Geração de PDF completo com:
  - Header PMMG
  - Data, assunto, responsável
  - Tabela de presentes
  - Tabela de ausentes com justificativas
  - Paginação automática

### Militares (admin)
- Lista todos os militares com busca
- Cadastrar novo militar
- Editar dados
- Desativar

### Configurações (admin)
- Define data da instrução atual
- Define assunto da instrução atual

---

## FORMATO DOS DADOS NO GOOGLE SHEETS

### USUARIOS_MILITARES (A:K)
| id | posto | nome | nome_guerra | login | senha | perfil | pelotao | grupamento | funcao | ativo |
| 0001 | Cap PM | João Silva | Silva | 123.456-7 | senha123 | admin | ADM | ADM | Comandante | TRUE |

### DADOS_CHAMADAS (A:K)
| data | assunto | grupamento | militar | posto | nome_guerra | pelotao | status | justificativa | responsavel | observacao |

### CONFIG (A:B)
| data | assunto |
| 10/05/2026 | Uso Progressivo da Força |

---

## DÚVIDAS FREQUENTES

**A planilha não está sendo lida?**
- Verifique se o e-mail da conta de serviço tem permissão de Editor na planilha
- Confirme que `GOOGLE_SERVICE_ACCOUNT_KEY` está em uma única linha no .env
- Confirme o `GOOGLE_SPREADSHEET_ID` correto

**Erro de autenticação?**
- Verifique `NEXTAUTH_SECRET` e `NEXTAUTH_URL`
- Na Vercel, após alterar `NEXTAUTH_URL`, faça Redeploy

**PDF não gera?**
- jsPDF é client-side. A geração ocorre no browser do usuário.
- Verifique se há dados na data selecionada.
