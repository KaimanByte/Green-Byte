# Diretrizes de interface e registro de usabilidade

Este documento registra as convenções de apresentação do Green-Byte e as evidências de IHC da Sprint 3. Ele não substitui os contratos da API ou as fórmulas descritas em `docs/api-externas.md` e `docs/calculos.md`.

## Protótipo de referência

O protótipo navegável e a referência visual do projeto estão no [Figma do Green-Byte](https://www.figma.com/design/UGCKmaZiect64Zh70T6pDQ/Greenbyte?node-id=0-1&p=f&t=au1eMTGdW9o8Wnld-0). Ele registra o fluxo e a intenção de interface; a implementação em `frontend/` continua sendo a fonte de verdade para o comportamento entregue.

## Indicadores e unidades

| Indicador | Unidade exibida | Regra de apresentação |
|---|---|---|
| Energia | kWh | Valores por coleta ou agregados no período selecionado; valores pequenos preservam algarismos significativos. |
| Emissão | gCO₂e ou kgCO₂e | Exibe kgCO₂e a partir de 1.000 g; abaixo disso preserva precisão para não ocultar emissões pequenas. |
| CPU | % | Uso percentual informado pela coleta. |
| Memória, disco e rede | GB | Valores de uso/tráfego recebidos nas coletas. |
| Potência do modelo | W ou W/GB | Parâmetros administrativos usados apenas nas próximas coletas; não recalculam o histórico. |
| Intervalo de coleta | s, min e h | A interface compacta o valor em unidades legíveis, por exemplo `45 s`, `1 min` ou `2 h`. |

## Período, atualização e estados

- Os painéis deixam explícito o período selecionado; gráficos de curta janela usam hora e os de janela longa usam data e hora.
- A data principal de **Última coleta** é a data/hora absoluta da coleta mais recente salva no banco.
- Na saúde administrativa, **Último ciclo** usa tempo relativo: abaixo de 60 segundos, mostra segundos (`há 12 s`); depois, minutos, horas e dias. O horário absoluto permanece disponível no título do elemento.
- O dashboard atualiza conforme o intervalo efetivo de coleta até o teto de 60 segundos. Se a consulta do intervalo falhar, usa 60 segundos como fallback seguro.
- Estados nunca dependem apenas de cor: são acompanhados por texto e, quando aplicável, ícone. Os estados de coleta são “Coletando agora”, “Em dia”, “Ciclo sem coletas gravadas”, “Último ciclo falhou” e “Sem resposta do servidor”.

## Administração e feedback

- A interface apresenta apenas os papéis `admin` e `operator`; não há fluxo para Leitor.
- O painel de administração informa os limites aceitos, mostra uma prévia do impacto do intervalo e confirma sucesso ou erro por mensagem textual.
- A auditoria exibe autor, data/hora, ação, alvo e alterações. Senhas não são apresentadas: uma troca é resumida como “senha redefinida”.
- Formulários exibem erro junto ao campo ou como alerta. Estados de carregamento, vazio e falha usam texto acessível (`role=status` ou `role=alert`).

## Responsividade e acesso

- O menu e os painéis usam layout de folha em telas compactas; em desktop os painéis aparecem ao lado do menu.
- Painéis de maior custo são carregados sob demanda e o globo é pausado quando fica encoberto no layout compacto, reduzindo uso de GPU e bateria.
- Controles de abas, filtros, formulários e ações usam rótulos acessíveis e podem ser operados por teclado.

## Avaliação de usabilidade — situação da Sprint 3

Não houve avaliação formal com usuários representativos registrada pela equipe nesta Sprint. Portanto, não há resultados nem achados que possam ser apresentados como feedback de usuários, e este documento **não declara** que a interface foi validada por participantes externos.

Como consequência, a issue #77 continua sem evidência de execução. A issue #78 não recebeu mudanças decorrentes de avaliação porque não existem achados formalmente coletados; ela só pode ser encerrada como concluída se a equipe registrar uma avaliação válida ou se a decisão de não executá-la for aceita como pendência justificada no fechamento da Sprint.
