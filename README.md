# SAMPA

**Sistema de Análise e Monitoramento do Planejamento de Aquisições**

---

## Objetivo

O projeto **SAMPA** tem como objetivo fornecer um dashboard visual e intuitivo para o acompanhamento do status de processos de aquisição. Utilizando uma interface no estilo Kanban, a ferramenta permite uma visualização clara e organizada do andamento de cada planejamento, desde a sua concepção até a conclusão.

## Autoria

Este projeto foi desenvolvido como parte do programa de **Residência em Tecnologia da Informação**, em parceria entre **Tribunal de Justiça do Estado de Goiás (TJGO)** e **Universidade Federal de Goiás (UFG)** para a **Coordenadoria de Contratos e Aquisições (CCA)** do **TJGO**.


## Funcionalidades

- **Visualização em Kanban:** Os processos são organizados em colunas que representam as diferentes fases do planejamento (Ex: Seleção, Gestão, Planejamento).
- **Cards Detalhados:** Cada processo é representado por um card que exibe informações essenciais como título, status e duração.
- **Carregamento Dinâmico:** Os dados do painel são consumidos de uma API externa, permitindo que o conteúdo seja atualizado diretamente da fonte de dados (planilha) sem a necessidade de fazer deploy de uma nova versão do site.
- **Design Limpo e Responsivo:** A interface é projetada para ser clara e funcional em diferentes tamanhos de tela.

## Tecnologias Utilizadas

- **Frontend:**
  - HTML5
  - CSS3 (com estilos customizados)
  - JavaScript

- **Backend (Desacoplado):**
  - **[Google Apps Script](https://developers.google.com/apps-script):** Utilizado para criar uma API que expõe os dados.
  - **[Google Sheets](https://www.google.com/sheets/about/):** Atua como banco de dados, armazenando as informações dos processos.

- **Frameworks e Bibliotecas:**
  - **[Jekyll](https://jekyllrb.com/):** Gerador de sites estáticos utilizado como base do projeto.
  - **[Bootstrap 5](https://getbootstrap.com/):** Framework CSS para componentes e responsividade.
  - **[Google Fonts](https://fonts.google.com/):** Para a tipografia (Roboto).

## Como Executar o Projeto Localmente

1.  Certifique-se de ter o [Ruby](https://www.ruby-lang.org/en/documentation/installation/) e o [Bundler](https://bundler.io/) instalados.
2.  Clone o repositório: `git clone https://github.com/arthurdelarge/sampa.git`
3.  Navegue até o diretório do projeto: `cd sampa`
4.  Instale as dependências do Jekyll: `bundle install`
5.  Inicie o servidor local: `bundle exec jekyll serve`
6.  Abra seu navegador e acesse `http://localhost:4000`.
