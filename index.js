//UI
const W = 600
const H = 600

//Simulation enviroment
const DELTA = 1 / 64
const GRAVITY = 100
const PIPE_SPEED = 10
const PIPE_WIDTH = 50
const PIPE_GAP_SIZE = 180
const PIPES = []
const PIPE_SPAWN_DELAY = 0.5
var spawnTimer = 0

//Player
const PLAYER_X_POSITION = 248
const PLAYER_SIZE = 32
const PLAYER_JUMP_HEIGHT = 20

const canvas = document.querySelector("#game")
canvas.width = W
canvas.height = H
const ctx = canvas.getContext('2d')

const simulation = setupSimulation()

spawnPipe()
requestAnimationFrame(update)

function setupSimulation() {
    const parser = createOutputParser('jump', 1)
    const simulation = createSimulation(createAgentData, 400, 20, 0.1, {
        inputCount: 3,
        hLayerCount: 2,
        hNeuronCount: 4,
        outputCount: 1,
        parser
    })

    simulation.populate()

    function randomColor() {
        const colors = ['red', 'purple', 'orange']
        return colors[Math.floor(Math.random() * colors.length)]
    }

    function createAgentData() {
        const data = {
            pos: { x: PLAYER_X_POSITION, y: 300 },
            vel: { x: 0, y: 0 },
            color: randomColor(),
            points: 0,
            fitness: (agent) => agent.points
        }
        
        return data
    }

    return simulation
}

function update() {
    ctx.clearRect(0, 0, W, H)
    
    var nearestPipe = null
    
    PIPES.forEach(pipe => {
        pipe.moveAndUpdate(PIPE_SPEED)
        
        setColor('green')
        rect(
            pipe.top.pos.x,
            pipe.top.pos.y,
            pipe.top.size.width,
            pipe.top.size.height
        )
        
        rect(
            pipe.bottom.pos.x,
            pipe.bottom.pos.y,
            pipe.bottom.size.width,
            pipe.bottom.size.height
        )
        
        if (pipe.position < -PIPE_WIDTH) {
            PIPES.splice(pipe)
        } else if (nearestPipe != null) {
            if (nearestPipe.position <= -PIPE_WIDTH || nearestPipe.position > pipe.position) {
                nearestPipe = pipe
            }
        } else {
            nearestPipe = pipe
        }
    })
    
    simulation.update((agent) => {
        agent.vel.y -= DELTA * GRAVITY
    
        var data = [agent.pos.y, 0, 0]
        
        if (nearestPipe != null) {
            data = [agent.pos.y, nearestPipe.position - agent.pos.x, nearestPipe.displacement]
        }
    
        const output = agent.predict(data)
    
        if (output.jump > 0.8) {
            agent.vel.y = PLAYER_JUMP_HEIGHT
        }
    
        agent.pos.x += agent.vel.x
        agent.pos.y += agent.vel.y
        
        setColor(agent.color)
        rect(agent.pos.x - PLAYER_SIZE / 2, agent.pos.y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE)
        
        agent.points++
    
        if (agent.pos.y < 0 || agent.pos.y > H) {
            agent.dead()
            agent.points /= 2
        }
    })
    
    setColor('black')
    setFont('20px Arial')
    ctx.fillText('POPULATION: '+simulation.population+' AGENTS: '+simulation.getAgentCount()+' HI: '+simulation.highScore+' '+' PIPES: '+PIPES.length, 20, 20)

    spawnTimer += DELTA

    if (spawnTimer > PIPE_SPAWN_DELAY) {
        spawnPipe()
        spawnTimer = 0
    }
    
    if (simulation.autoPopulate()) {
        PIPES.splice(0, PIPES.length)
        spawnTimer = 0
    }

    requestAnimationFrame(update)
}

function setColor(color) {
    ctx.fillStyle = color
}

function setFont(font) {
    ctx.font = font
}

function rect(x, y, w, h) {
    ctx.fillRect(x, H - y, w, -h)
}

function square(x, y, s) {
    rect(x, y, s)
}

function spawnPipe() {
    const pipe = {
        position: W
    }
    
    const displacement = (-1 + Math.random() * 2) * (PIPE_GAP_SIZE / 2) 
    pipe.displacement = displacement
    
    pipe.top = createRetangle(
        0,
        H/2 + PIPE_GAP_SIZE/2 - displacement,
        PIPE_WIDTH,
        H/2 - PIPE_GAP_SIZE/2 + displacement
    )
    
    pipe.bottom = createRetangle(
        0, 
        0, 
        PIPE_WIDTH, 
        H / 2 - PIPE_GAP_SIZE/2 - displacement
    )
    
    pipe.moveAndUpdate = (velX) => {
        pipe.position -= velX
        pipe.top.pos.x = pipe.position
        pipe.bottom.pos.x = pipe.position
    }

    PIPES.push(pipe)
}

function createRetangle(x, y, w, h) {
    const rect = {
        pos: { x, y },
        size: { 
            width: w, 
            height: h 
        }
    }

    rect.overlaps = (other) => {
        return (this.pos.x < other.pos.x + other.size.width || this.pos.x + this.size.width > other.pos.x) && (this.pos.y < other.pos.y + other.size.height || this.pos.y + this.size.height > other.pos.y)
    }

    return rect
}