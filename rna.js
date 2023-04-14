/*
    Este código é uma biblioteca para
    criar redes neurais artificiais (RNA) 
    utilizando a linguagem de programação
    JavaScript. Ele define funções para criar 
    neurônios, camadas de neurônios, camadas 
    ocultas de neurônios, além de funções para
    realizar o treinamento da RNA, como a mutação
    e a mistura de RNAs. Também há funções 
    para criar um analisador de saída da RNA 
    e para criar um agente que pode utilizar a 
    RNA criada para tomar decisões em um ambiente.
*/

const defaultFunction = (u) => {
    return Math.tanh(u)
}

function rand() {
    return -1 + Math.random() * 2
}

function createNeuron(inputCount, memoryRate, f = defaultFunction) {
    const neuron = {}
    neuron.bias = rand()
    neuron.weights = []
    neuron.output = 0
    
    for (let i = 0; i < inputCount+2; i++) {
        neuron.weights.push(rand())
    }
    
    neuron.predict = (data) => {
        var sum = neuron.bias * neuron.weights[0] + (neuron.output * neuron.weights[1] * memoryRate)
        
        for (let i = 0; i < inputCount; i++) {
            sum += data[i] * neuron.weights[i+2]
        }
        
        neuron.output = f(sum)
    }
    
    return neuron
}

function createLayer(inputCount, outputCount, memoryRate) {
    const layer = {}
    layer.neurons = []
    
    for (let i = 0; i < outputCount; i++) {
        layer.neurons.push(createNeuron(inputCount, memoryRate))
    }
    
    layer.predict = (data) => {
        const output = []
        for (let i = 0; i < outputCount; i++) {
            layer.neurons[i].predict(data)
            output.push(layer.neurons[i].output)
        }
        
        return output
    }
    
    return layer
}

function createHiddenLayers(inputCount, layerCount, outputCount, memoryRate) {
    const hidden = {}
    hidden.layers = []
    
    for (let i = 0; i < layerCount; i++) {
        hidden.layers.push(createLayer(inputCount, outputCount, memoryRate))
        inputCount = outputCount
    }
    
    hidden.predict = (data) => {
        for (let i = 0; i < hidden.layers.length; i++) {
            data = hidden.layers[i].predict(data)
        }
        
        return data
    }
    
    return hidden
}

function merge(a, b, rate) {
    if (Math.random() < rate) return b
    return a
}

function mutate(x, rate) {
    if (rand() > rate) return x
    return x + rand()
}

function createRNA(inputCount, hLayerCount, hNeuronCount, outputCount, memoryRate) {
    var rna = null
    
    if (inputCount > 0) {
        rna = {
            inputCount,
            hLayerCount,
            hNeuronCount,
            outputCount,
            memoryRate,
            hiddenLayers: createHiddenLayers(inputCount, hLayerCount, hNeuronCount, memoryRate),
            outputLayer: createLayer(hNeuronCount, outputCount, memoryRate)
        }
    } else {
        const rnaJSON = inputCount
        rna = JSON.parse(rnaJSON)
    }
    
    rna.predict = (data) => {
        return rna.outputLayer.predict(rna.hiddenLayers.predict(data))
    }
    
    rna.merge = (other, rate = 0.5) => {
        const child = createRNA(inputCount, hLayerCount, hNeuronCount, outputCount, memoryRate)
       
        for (let layer = 0; layer < rna.hiddenLayers.layers.length; layer++) {
            const l1 = rna.hiddenLayers.layers[layer]
            const l2 = other.hiddenLayers.layers[layer]
            const l3 = child.hiddenLayers.layers[layer]
            
            for (let neuron = 0; neuron < l1.neurons.length; neuron++) {
                const n1 = l1.neurons[neuron]
                const n2 = l2.neurons[neuron]
                const n3 = l3.neurons[neuron]
                
                n3.bias = merge(n1.bias, n2.bias, rate)
                
                for (let weight = 0; weight < n1.weights.length; weight++) {
                    const w1 = n1.weights[weight]
                    const w2 = n2.weights[weight]
                    n3.weights[weight] = merge(w1, w2, rate)
                }
            }
        }
        return child
    }
    
    rna.mutate = (rate = 0.5) => {
        for (let layer = 0; layer < rna.hiddenLayers.layers.length; layer++) {
            const l = rna.hiddenLayers.layers[layer]
    
            for (let neuron = 0; neuron < l.neurons.length; neuron++) {
                const n = l.neurons[neuron]
    
                n.bias = mutate(n.bias)
    
                for (let weight = 0; weight < n.weights.length; weight++) {
                    n.weights[weight] = mutate(n.weights[weight], rate)
                }
            }
        }
    }
    
    rna.json = () => {
        return JSON.stringify(rna)
    }
    
    return rna
}

function loadFromJSON(json) {
    return createRNA(json)
}

function createOutputParser(...outputLabels) {
    const parser = (output) => {
        var obj = {}
        var index = 0
        for (let i = 0; i < outputLabels.length; i += 2) {
            const name = outputLabels[i]
            const amount = outputLabels[i + 1]
            
            if (amount > 1) {
                obj[name] = []
                for (let i = index; i < index + amount; i++) {
                    obj[name].push(output[i])
                }
            } else {
                obj[name] = output[index]
            }
            
            index += amount
        }
        
        return obj
    }
    
    return parser
}

function createAgent({hLayerCount, hNeuronCount, inputCount, outputCount, memoryRate = 0, parser = null, noBrain = false, data = {}}) {
    const agent = {
        ...data
    }
   
    agent.hLayerCount = hLayerCount
    agent.hNeuronCount = hNeuronCount
    agent.inputCount = inputCount
    agent.outputCount = outputCount
    agent.brain = noBrain? null : createRNA(inputCount, hLayerCount, hNeuronCount, outputCount, memoryRate)
    agent.parser = data.parser || parser
    agent.isDead = false
    agent.dead = () => { 
        agent.isDead = true
    }
    
    agent.predict = (data) => {
        const brainOutput = agent.brain.predict(data)
        return agent.parser == null? brainOutput : agent.parser(brainOutput)
    }

    agent.merge = (other, rate) => {
        const child = createAgent({ 
            hLayerCount, 
            hNeuronCount, 
            inputCount, 
            outputCount, 
            parser: agent.parser,
            noBrain: true,
            data
        })
        child.brain = agent.brain.merge(other.brain, rate)
        return child
    }
    
    agent.mutate = (rate) => agent.brain.mutate(rate)

    agent.json = () => agent.brain.json()

    return agent
}

function createSimulation(agentDataFactory, populationSize, populationParentAmount, mutationRate, rnaParams) {
    if (agentDataFactory().fitness == null) {
        throw new Error('Invalid agent data factory, fitness function not found!');
    }
    
    const simulation = {}
    simulation.agents = []
    simulation.population = 0
    simulation.highScore = 0
    simulation.populationBest = 0
    simulation.currentID = 0
    
    simulation.populate = () => {
        simulation.population += 1
        simulation.populationBest = 0
        
        if (simulation.agents.length > 0) {
            //Create new population
            simulation.agents.sort((a, b) => b.fitness(b) - a.fitness(a))
            
            const best = simulation.agents[0]
            if (best.fitness(best) > simulation.highScore) {
                simulation.highScore = best.fitness(best)
                if (simulation.updateBest) {
                    simulation.updateBest(best)
                }
            }
            
            const newPopulation = []
            
            for (let i = 0; i < populationParentAmount; i++) {
                const agent = createAgent({
                    ...rnaParams,
                    noBrain: true,
                    data: agentDataFactory() 
                })
                agent.isParent = true 
                agent.brain = simulation.agents[i].brain
                agent.id = simulation.currentID++
                
                newPopulation.push(agent)
            }
            
            for (let i = 0; i < populationSize; i++) {
                const mom = simulation.agents[Math.floor(Math.random() * populationParentAmount)]
                const dad = simulation.agents[Math.floor(Math.random() * populationParentAmount)]
                const child = mom.merge(dad, 0.5)
                child.mutate(mutationRate)
                child.id = simulation.currentID++
                
                newPopulation.push(child)
            }
            
            simulation.agents = newPopulation
        } else {
            //Create initial population
            for (let i = 0; i < populationSize; i++) {
                const data = agentDataFactory()
                const agent = createAgent({
                    ...rnaParams,
                    data: data //Factory for the agent data (fitness function, simulation data, and the createRNA params)
                })
                
                agent.id = simulation.currentID++

                simulation.agents.push(agent)
            }
        }
    }
    
    simulation.update = (renderFunction) => {
        for (let agentIndex in simulation.agents) {
            const agent = simulation.agents[agentIndex]
            
            const fitness = agent.fitness(agent)
            if (fitness > simulation.populationBest) {
                simulation.populationBest = fitness
            }
            
            if (agent.isDead) continue
            renderFunction(agent)
        }
    }
    
    simulation.getAgentCount = () => {
        var count = 0
        simulation.agents.forEach(agent => {
            if (!agent.isDead) count++
        })
        
        return count
    }
    
    simulation.autoPopulate = () => {
        if (simulation.getAgentCount() == 0) {
            simulation.populate()
            return true
        }
        return false
    }
    
    return simulation 
}

try {
    if (module != undefined) {
        module.exports = {
            createSimulation,
            createAgent,
            createRNA,
            createHiddenLayers,
            createLayer,
            createNeuron,
            createOutputParser,
            rnaTest
        }
    }
} catch {}