Math.signum = function(n){
	return !n?0:n>0?1:-1;
}

Crafty.c("ElementType",{
	_type:undefined, //earth, water, fire
	type:function(s){
		this._type = s;
		return this;
	}
});

Crafty.c("Jumper",{
	_onFloor:false,
	init:function(){
		this.requires("b2dCollision")
			.bind("ContactStart",function(e){
				if(e.has("FLOOR"))
					this._onFloor = true;
			})
			.bind("ContactEnd",function(e){
				console.log("D:");
				if(e.has("FLOOR"))
					this._onFloor = false;
			})
	}
});

Crafty.c("PlayerController",{
	_maxVelocity:0.5,
	init:function(){
		this.requires("b2dObject, Jumper, Keyboard")
			.bind("KeyDown",function(e){
				if(e.keyCode == 87){
					if(this._onFloor){
						var pos = this.body().GetPosition();
						var vel = this.body().GetLinearVelocity();
						this.body().SetLinearVelocity(new b2Vec2(vel.x,0));
						var vecpos = new b2Vec2(pos.x,pos.y+0.01);
						var matpos = new Box2D.Common.Math.b2Mat22(0,1);
						var transform = new Box2D.Common.Math.b2Transform(vecpos,matpos);
						this.body().SetTransform(transform);
						this.body().ApplyImpulse(new b2Vec2(0,-6),this.body().GetWorldCenter());
					}
				}
			})
			.bind("KeyUp",function(e){
				if(e.keyCode == 65 || e.keyCode == 68)
					this.body().SetLinearVelocity(new b2Vec2(0,this.body().GetLinearVelocity().y));
			})
			.bind("EnterFrame",function(){
				this.body().ApplyImpulse(new b2Vec2(0,1),this.body().GetWorldCenter());
				var vel = this.body().GetLinearVelocity();
				if(Math.abs(vel.x)>this._maxVelocity){
					vel.x = Math.signum(vel.x) * this._maxVelocity;
					this.body().SetLinearVelocity(vel);
				}
				if(this.isDown(65) || this.isDown(68)){
					this.body().SetLinearVelocity(new b2Vec2(vel.x*0.9,vel.y));
				}
				if(!this._onFloor){
					this.body().GetFixtureList().SetFriction(0);
				}
				else {
					if(!this.isDown(65) && !this.isDown(68)){
						this.body().GetFixtureList().SetFriction(100);
					}
					else{
						this.body().GetFixtureList().SetFriction(0.2);
					}
				}
				msg(this.body().GetFixtureList().GetFriction(),this._onFloor);
				if(this.isDown(65) && vel.x > -this._maxVelocity){
					this.body().ApplyImpulse(new b2Vec2(-2,0),this.body().GetWorldCenter());
				}
				if(this.isDown(68) && vel.x < this._maxVelocity)
					this.body().ApplyImpulse(new b2Vec2(2,0),this.body().GetWorldCenter());
			})
	}
})

Crafty.scene("DemoLevel",function(){
	Crafty.sprite(60,"img/land.gif",{spr_land:[0,0]});
	
	for(var i=0;i<20;i++){
		Crafty.e("b2dObject, b2dSimpleGraphics, b2dCollision, spr_land, Canvas, ElementType, FLOOR")
			.attr({x:i*60,y:540,w:60,h:60})
			.type("earth")
			.b2d({
				body_type:b2Body.b2_staticBody,
				friction:1,
				objects:[{
					type:"box",
					w:60,
					h:60
				}]
			});
	}
	
	Crafty.e("b2dObject, b2dSimpleGraphics, b2dCollision, 2D, Canvas, Color, PlayerController, PLAYER")
		.attr({x:60,y:20,w:30,h:75})
		.color("#0af")
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			density:1,
			friction:1,
			fixedRotation:true,
			objects:[{
				type:"box",
				w:30,
				h:60
			},{
				type:"circle",
				radius:30,
				offY:30
			}]
		})
});

$(document).ready(function(){
	//Initialize crafty
	Crafty.init(800,600);
	Crafty.canvas.init();
	
	//Debug canvas
	$('#canvas')[0].width = 800;
	$('#canvas')[0].height = 600;
	
	Crafty.DRAW_SCALE = 60;
	Crafty.debugging = true;
	
	var w = Crafty.e("b2dWorld");
	var world = w.world();

	Crafty.scene("DemoLevel");
	
	Crafty("2D").each(function(){
		this.alpha = 0.1;
	})
	
});
