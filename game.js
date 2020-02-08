let game;
let colors = [
    [0x1abc9c, 0x2980b9, 0x9b59b6, 0xf1c40f, 0xc0392b, 0xecf0f1],
    [0xdce0d9, 0x31081f, 0x86baa1, 0x6b0f1a, 0x595959, 0xfcfaf1],
    [0x628395, 0xdfd5a5, 0x86baa1, 0xdbad6a, 0xcf995f, 0x13f5fa]
]
let gameOptions = {
    ballSpeed: 4,
    jumpForce: 30,
    bars: 4,
    barColors: colors[Math.floor(Math.random() * colors.length)]
}

const LEFT = 0;
const RIGHT = 1;
let score = 0;
let style = { font: "bold 190px Arial", fill: "rgba(255, 255, 255, 0.5)", boundsAlignH: "center", boundsAlignV: "middle" };
let play = false

window.onload = function() {
    let gameConfig = {
        type: Phaser.AUTO,
        width: 750,
        height: 1334,
        backgroundColor: 0x000000,
        scene: [Menu, playGame],
        physics: {
            default: "matter",
            matter: {
                gravity: {
                    x: 0,
                    y: 4
                },
                debug: true
            }
        }
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
    resize();
    window.addEventListener("resize", resize, false);
}

class Menu extends Phaser.Scene {
    constructor() {
        super("Menu")
    }

    preload() {
    }

    create() {
        this.playText = this.add.text(game.config.width / 2, game.config.height / 2, "Click to start", {
            font: "bold 64px Arial", boundsAlignH: "center", boundsAlignV: "middle" 
        });
        this.playText.x -= this.playText.width / 2
        this.playText.y -= this.playText.height / 2
        this.playText.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.playText.width, this.playText.height), Phaser.Geom.Rectangle.Contains);
        this.playText.on("pointerdown", this.startGame)
    }

    startGame() {
        play = true
    }
    
    update() {
        if (play){
            this.scene.start("PlayGame");
        }
    }
}

class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    preload(){
        this.load.image("wall", "wall.png");
        this.load.image("ball", "ball.png");
    }
    create(){
        score = 0;
        this.leftWalls = [];
        this.rightWalls = [];
        for(let i = 0; i < gameOptions.bars; i++){
            this.leftWalls[i] = this.addWall(i, LEFT);
            this.rightWalls[i] = this.addWall(i, RIGHT);
        }

        this.score = this.add.text(game.config.width / 2, game.config.height / 2, score, style);
        this.score.x -= this.score.width / 2
        this.score.y -= this.score.height / 2

        this.ball = this.matter.add.image(game.config.width / 4, game.config.height / 2, "ball");
        this.ball.setBody({
            type: "circle"
        });
        let randomWall = Phaser.Math.RND.pick(this.rightWalls);
        this.ball.setTint(randomWall.body.color);
        this.ball.setVelocity(gameOptions.ballSpeed, 0);
        this.input.on("pointerdown", this.jump, this);
        this.matter.world.on("collisionstart", function (e, b1, b2) {
            if(b1.label == "leftwall" || b2.label == "leftwall"){
                this.handleWallCollision(LEFT, b1, b2);
            }
            if(b1.label == "rightwall" || b2.label == "rightwall"){
                this.handleWallCollision(RIGHT, b1, b2);
            }
        }, this);
    }
    addWall(wallNumber, side){
        let wallTexture = this.textures.get("wall");
        let wallHeight = game.config.height / gameOptions.bars;
        let wallX = side * game.config.width + wallTexture.source[0].width / 2 - wallTexture.source[0].width * side;
        let wallY = wallHeight * wallNumber + wallHeight / 2;
        let wall = this.matter.add.image(wallX, wallY, "wall", null, {
            isStatic: true,
            label: (side == RIGHT) ? "rightwall" : "leftwall"
        });
        wall.displayHeight = wallHeight;
        return wall
    }
    handleWallCollision(side, bodyA, bodyB){
        if(bodyA.color != bodyB.color){
            this.scene.start("Menu");
        }
        this.paintWalls((side == LEFT) ? this.rightWalls : this.leftWalls);
        this.ball.setVelocity(gameOptions.ballSpeed, this.ball.body.velocity.y);

        this.score.destroy()
        score++
        this.score = this.add.text(game.config.width / 2, game.config.height / 2, score, style);
        this.score.x -= this.score.width / 2
        this.score.y -= this.score.height / 2
    }
    
    paintWalls(walls){
        walls.forEach(function(wall){
            let color = Phaser.Math.RND.pick(gameOptions.barColors);
            wall.setTint(color);
            wall.body.color = color;
        });
        let randomWall = Phaser.Math.RND.pick(walls);
        this.ball.setTint(randomWall.body.color);
        this.ball.body.color = randomWall.body.color;
        this.score.style.color = randomWall.body.color;
    }
    jump(){
        this.ball.setVelocity((this.ball.body.velocity.x > 0) ? gameOptions.ballSpeed : -gameOptions.ballSpeed, -gameOptions.jumpForce);
    }
    update(){
        this.ball.setVelocity((this.ball.body.velocity.x > 0) ? gameOptions.ballSpeed : -gameOptions.ballSpeed, this.ball.body.velocity.y);
        if(this.ball.y < 0 || this.ball.y > game.config.height){
            var particles = this.add.particles('ball');
            var emitter = particles.createEmitter();
            emitter.setPosition(this.ball.x, this.ball.y);
            emitter.setSpeed(200);
            emitter.setBlendMode(Phaser.BlendModes.ADD);
            let that = this

            this.time.addEvent({
                delay: 750,
                callback: function() {
                    that.scene.stop()
                    that.leftWalls.forEach(wall => {
                        wall.destroy()
                    })
                    that.rightWalls.forEach(wall => {
                        wall.destroy()
                    })
                    that.score.destroy()
                    particles.destroy()
                    //that.ball.setVelocity(0, 0)
                    //that.ball.y = game.canvas.height * 2

                    play = false
                    game.scene.start("Menu");
                }
            })
        }
    }
};
function resize(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
