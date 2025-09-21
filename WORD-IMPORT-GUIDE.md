# 🎯 Guia de Importação de Palavras - WordZe

## 📋 Resumo

Agora você pode importar palavras diretamente no WordZe! Vá ao seu perfil e use a funcionalidade de importação para adicionar palavras de um ficheiro JSON.

## 🚀 Como Usar

### **Passo 1: Aceder ao Perfil**

1. Abra o WordZe no navegador
2. Faça login com a sua conta
3. Vá para a página **Profile** (perfil)

### **Passo 2: Importar Palavras**

1. Na página de perfil, você verá a secção **"Importar Palavras"**
2. Clique em **"Selecionar Ficheiro JSON"**
3. Escolha o ficheiro JSON com as suas palavras
4. Clique em **"Importar Palavras"**

### **Passo 3: Verificar Resultado**

- O sistema mostrará quantas palavras foram importadas
- Palavras duplicadas serão automaticamente ignoradas
- Erros serão mostrados se houver problemas

## 📁 Formato do Ficheiro JSON

O ficheiro deve ter a seguinte estrutura:

```json
{
  "words": [
    {
      "word": "example",
      "translation": "exemplo",
      "type": "noun",
      "difficulty": "intermediate",
      "examples": [
        {
          "sentence": "This is an example.",
          "translation": "Isto é um exemplo."
        }
      ],
      "notes": "Optional notes"
    }
  ]
}
```

### **Campos Obrigatórios:**

- `word` - A palavra em inglês
- `translation` - A tradução

### **Campos Opcionais:**

- `type` - Tipo da palavra (noun, verb, adjective, adverb, phrasal verb)
- `difficulty` - Dificuldade (beginner, intermediate, advanced)
- `examples` - Array de exemplos com frases
- `notes` - Notas adicionais

## 📊 Exemplo de Ficheiro

Use o ficheiro `example-words.json` como exemplo. Ele contém 5 palavras de teste que você pode importar.

## ✅ Funcionalidades

- **Importação automática** de palavras e exemplos
- **Verificação de duplicatas** - palavras já existentes são ignoradas
- **Validação de formato** - verifica se o ficheiro está correto
- **Relatório detalhado** - mostra quantas palavras foram importadas
- **Tratamento de erros** - mostra erros específicos se houver problemas

## 🎯 Para o Usuário boalrolo.diogo@gmail.com

1. **Vá ao perfil** no WordZe
2. **Use o ficheiro `adjectivesData.json`** que já tem as 49 palavras
3. **Importe as palavras** diretamente
4. **Verifique o resultado** - deve importar todas as 49 palavras

## 🔧 Troubleshooting

### **Erro: "Formato de ficheiro inválido"**

- Verifique se o ficheiro é um JSON válido
- Certifique-se de que tem a propriedade `words` ou `adjectives`

### **Erro: "word e translation são obrigatórios"**

- Verifique se todas as palavras têm `word` e `translation`

### **Nenhuma palavra importada**

- Verifique se as palavras já existem no seu vocabulário
- O sistema ignora palavras duplicadas automaticamente

## 🎉 Resultado

Após a importação, você terá:

- ✅ Todas as palavras adicionadas ao seu vocabulário
- ✅ Exemplos incluídos para cada palavra
- ✅ Notas e dificuldade configuradas
- ✅ Integração completa com os jogos (Flashcards e Quiz)

## 📞 Suporte

Se precisar de ajuda:

1. Verifique se o ficheiro JSON está no formato correto
2. Use o ficheiro `example-words.json` como referência
3. Verifique se está logado no WordZe
4. Certifique-se de que o ficheiro não está corrompido

