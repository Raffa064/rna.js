//UI
const W = 600
const H = 600

//Simulation enviroment
const DELTA = 1 / 64
const GRAVITY = 100
const PIPE_SPEED = 10
const PIPE_WIDTH = 50
const PIPE_GAP_SIZE = 280
const PIPES = []
const PIPE_SPAWN_DELAY = 0.5
var spawnTimer = 0

//Player
const PLAYER_X_POSITION = 200
const PLAYER_SIZE = 32
const PLAYER_JUMP_HEIGHT = 20

const canvas = document.querySelector("#game")
canvas.width = W
canvas.height = H
const ctx = canvas.getContext('2d')

const simulation = setupSimulation()

spawnPipe()
requestAnimationFrame(update)

// requestAnimationFrame(teste)

const a = createRetangle(0, H/2-PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE)
const b = createRetangle(W/2-PLAYER_SIZE/2, 0, PLAYER_SIZE, H)
function teste() {
    ctx.clearRect(0, 0, W, H)
    
    setColor('gray')
    rect(b.pos.x, b.pos.y, b.size.width, b.size.height)
    
    setColor(a.overlaps(b) ? 'red' : 'green')
    rect(a.pos.x, a.pos.y, a.size.width, a.size.height)
    
    a.pos.x = (a.pos.x + 1) % W
    
    requestAnimationFrame(teste)
}

function setupSimulation() {
    const parser = createOutputParser('jump', 1)
    const simulation = createSimulation(createAgentData, 20, 5, 0.2, {
        inputCount: 2,
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
        
        if (pipe.position < -PIPE_WIDTH) {
            PIPES.splice(pipe)
        } else if (nearestPipe != null) {
            if (nearestPipe.position <= PLAYER_X_POSITION - PLAYER_SIZE || pipe.position < nearestPipe.position) {
                nearestPipe = pipe
            }
        } else {
            nearestPipe = pipe
        }
        
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
    })
    
    if (nearestPipe != null) {
        const s = 10
        
        setColor('red')
        rect(
            nearestPipe.top.pos.x + s,
            nearestPipe.top.pos.y + s,
            nearestPipe.top.size.width - s*2,
            nearestPipe.top.size.height - s*2
        )
        
        rect(
            nearestPipe.bottom.pos.x + s,
            nearestPipe.bottom.pos.y + s,
            nearestPipe.bottom.size.width - s*2,
            nearestPipe.bottom.size.height - s*2
        )
        
        ctx.beginPath()
        ctx.arc(nearestPipe.getCenter().x, H-nearestPipe.getCenter().y, 5, 0, 2 * Math.PI);
        ctx.stroke()
        ctx.closePath()
    }
    
    simulation.update((agent) => {
        agent.vel.y -= DELTA * GRAVITY
    
        var data = [0, 0]
        
        if (nearestPipe != null) {
            const center = nearestPipe.getCenter()
            data = [
                center.x - agent.pos.x,
                center.y - agent.pos.y
            ]
        }
    
        const output = agent.predict(data)
    
        if (output.jump > 0.5) {
            agent.vel.y = PLAYER_JUMP_HEIGHT
        }
    
        agent.pos.x += agent.vel.x
        agent.pos.y += agent.vel.y
        
        const agentRect = createRetangle(agent.pos.x - PLAYER_SIZE / 2, agent.pos.y - PLAYER_SIZE / 2, PLAYER_SIZE, PLAYER_SIZE)
        const isOverlaping = nearestPipe == null? false : nearestPipe.overlaps(agentRect)
        
        if (isOverlaping) {
            agent.color = 'gray'
        }
        
        setColor(agent.color)
        rect(agentRect.pos.x, agentRect.pos.y, agentRect.size.width, agentRect.size.height)
        
        
        agent.points++
        
        if (agent.pos.y < 0 || agent.pos.y > H || isOverlaping) {
            agent.dead()
            agent.points /= 4
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
        spawnPipe()
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
    
    pipe.overlaps = (rect) => {
        return pipe.top.overlaps(rect) || pipe.bottom.overlaps(rect)
    }
    
    pipe.getCenter = () => {
        return {
            x: pipe.position + PIPE_WIDTH/2,
            y: H/2 - displacement
        }
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
        return ((rect.pos.x < other.pos.x + other.size.width) && (rect.pos.x + rect.size.width > other.pos.x)) &&
               ((rect.pos.y < other.pos.y + other.size.height) && (rect.pos.y + rect.size.height > other.pos.y))
    }

    return rect
}