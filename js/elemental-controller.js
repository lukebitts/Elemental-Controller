function $(msg){
	console.log(msg);
}

Crafty.c("TilePhysics",{
	init:function(){
		this.requires("2D, Collision")
			.onHit("PLAYER",function(){
			//$("hitou");
		})
	}
})

Crafty.c("CharacterPhysics",{
	gravity:9.8,
	force:{x:0,y:0},
	floor:false,
	init:function(){
		this.requires("2D, Collision")
			.bind("EnterFrame",function(){
				this.force.y += this.gravity/10;
				this.force.y = this.floor?0:this.force.y;
				this.force.x *= 0.9;
				this.force.x = this.force.x<0.2&&this.force.x>-0.2?0:this.force.x;
				this.x += this.force.x;
				this.y += this.force.y;
				if(!this.hit("TILE")) this.floor = false;
			})
			.onHit("TILE",function(e){
				this.floor = true;
				for(i in e){
					var dir = []; //Where it collided = TOP, BOT, LEF, RIG, TOPLEF, TOPRIG, BOTLEF, BOTRIG
					var from = undefined; //Direction before collision = TOPBOT, LEFRIG
					var obj = e[i].obj;
					
					/*if(this.x <= obj.x) dir = "LEF";
					if(this.x+this.w >= obj.x+obj.w) dir = "RIG";
					
					if(this.y <= obj.y) dir = "TOP";
					if(this.y+this.h >= obj.y+obj.h) dir = "BOT";*/
					
					if(this.force.x > 0) dir.x = "LEF";
					if(this.force.x < 0) dir.x = "RIG";
					if(this.force.x == 0) dir.x = false;
					
					if(this.force.y > 0) dir.y = "TOP";
					if(this.force.y < 0) dir.y = "BOT";
					if(this.force.y == 0) dir.x = false;
					
					
					//$(dir);
					
					//if(!dir.x){
						if(dir.y == "TOP"){
							this.force.y = 0;
							this.y = obj.y - this.h;
						}
						if(dir.y == "BOT"){
							this.force.y = 0;
							this.y = obj.y + obj.h;
						}
					//}
					if(!dir.y){
						if(dir.x == "LEF"){
							this.force.x = 0;
							this.x = obj.x - this.w;
						}
						if(dir.x == "RIG"){
							this.force.x = 0;
							this.x = obj.x + obj.w;
						}
					}
					
				}
				/*var obj = e[0].obj;
				this.force.y = 0;
				this.y = obj.y - this.h;*/
				
			})
	}
})

Crafty.c("PlayerControl",{
	keys:[],
	init:function(){
		this.requires("CharacterPhysics, Keyboard")
			.bind("KeyDown",function(e){
				this.keys[e.key] = true;
			})
			.bind("KeyUp",function(e){
				this.keys[e.key] = false;
				if(e.key == 68 && this.floor)
					this.force.x = 0.5;
				if(e.key == 65 && this.floor)
					this.force.x = -0.5;
			})
			.bind("EnterFrame",function(){
				if(this.keys[68])
					if(this.force.x < 5)
						this.force.x += 0.5;
				if(this.keys[65])
					if(this.force.x > -5)
						this.force.x -= 0.5;
				if(this.keys[87] && this.floor){
					this.floor = false;
					this.force.y = -13;
				}
			})
	}
})

function createTile(position, args){
	return Crafty.e("TILE")
		.addComponent("2D, Canvas, TilePhysics, Color"+(args?", "+args:""))
		.attr({x:position.x,y:position.y,w:50,h:50})
		.color("#733D1A")
}

function createPlayer(position, args){
	return Crafty.e("PLAYER")
		.addComponent("2D, Canvas, CharacterPhysics, PlayerControl, Color"+(args?", "+args:""))
		.attr({x:position.x,y:position.y,w:10,h:10})
		.color("#733D1A")
}

window.onload = function(){
	Crafty.init(800,600);
	Crafty.canvas.init();
	
	for(var i = 0;i<10; i++){
		createTile({x:100+50*i,y:500},"DIRT");
	}
	createTile({x:300,y:450},"DIRT");
	
	
	createPlayer({x:360,y:440});
}
