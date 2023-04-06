# RNA.js

Este projeto é uma biblioteca de machine learn, baseado em redes MLP (Multi Layer Perceptron), com aprendizado por reforço.

OBS: Este projeto está em desenvolvimento, e ainda não está funcionando corretamente.

# Sobre

Todo o código da biblioteca está no arquivo [rna.js](./rna.js).

As redes neurais são compostas de 2 componentes básicos, as camadas ocultas, e a camada de saída. As camadas ocultas podem conter várias camadas, mas a camada de saída só possuí uma, e é ela que fornece o output da rede.

Todas as camadas possuem neurônios, e cada neurônio possui pesos e bias, que são usados de forma matemática para simular o comportamento de um neurônio biológico.

# Como usar

Para utilizar a biblioteca rna.js, certifique-se de adicionar uma cópia do arquivo [rna.js](./rna.js) ao seu projeto (caso estiver usando node), ou referênciar ela no seu html:

```html
<!--Exemplo com html e js puro-->
<script src="https://raffa064.github.io/rna.js/rna.js"></script>
<script>
    //Você pode por seu código aqui, ou via src, mas tem que ser após a tag script que carrega a biblioteca.
</script>

```
OBS: Caso você for usar com nodejs, você pode importar usando require()

## Simulação

Antes de usar uma RNA, você precisa treinar ela, e para isso, temos as simulações. 

Para criar uma simulação, use a função _createSimulation_, que é responsável por gerenciar os agentes durante o treinamento.

Veja abaixo um exemplo teórico de como funciona:

```javascript
const simulation = createSimulation(
    createAgentData,        // Função que cria um objeto com as informações básicas do agente de acordo com as informações específicas da sua IA, como posição, cor... é OBRIGATÓRIO que o objeto retornado contenha a fitness function da sua IA
    populationSize,         // Quantidade de agentes filhos por geração
    populationParentAmount, // Quantidade de agentes usados para criar a próxima geração 
    mutationRate,           // Taxa de mutação 
    rnaParams               // objeto com os parâmetros da rede neural (inputCount, hLayerCount, hNeuronCount, outputCount, memoryRate, parser)
)

function createAgentData() {
    return {
        //informações dos agentes
        fitness: (agent) => {
            //retorna pontuação do agente. (essa função é obrigatória)
        }
    }
}

while (true) {
    simulation.update(agente => {
        const data = /*Lista de input, com sensores e informações que a rede vai consumir*/
        const output = agent.predict(data)
    
        //faça algo com o output
        
        //rederize na tela
        
        //aplique a pontuação
        
        if (/*condição que "mata" o agente*/) {
            agente.dead()
            //aplicar punição
        }
    })
    
    if (simulation.autoPopulate()) {
        //Nova geração criada, use isso para resetar o ambiente da simulação 
    }
}

```

# Problemas conhecidos
- As IAs aparentam não evoluir
- A fitness function está sendo duplicada entre os agentes
- Não possui forma nativa de alterar a função de ativação (a padrão é tanh)
- Código não da biblioteca e do exemplo não estão bem refatorados
- Não possui save e load das redes