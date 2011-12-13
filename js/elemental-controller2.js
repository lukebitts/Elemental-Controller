Math.signum = function(n){
	return !n?0:n>0?1:-1;
}

Crafty.c("HarmfulAtSpeed",{
	_damageSpeed:5,
	_baseDamage:0.5,
	_damageFlag:"",
	_eventCall:"",
	init:function(){
		this.requires("b2dObject, b2dCollision")
			.bind("ContactStart",function(e){
				if(e.has(this._damageFlag)){
					var vel = this.body().GetLinearVelocity();
					var damage = 0;
					var speed;
					if(vel.x * vel.y == 0)
						speed = vel.x + vel.y;
					else
						speed = Math.sqrt(Math.pow(vel.x,2)+Math.pow(vel.y,2));
					if(Math.abs(speed) > this._damageSpeed){
						var info = {
							obj:this,
							speed:speed
						}
						e.trigger(this._eventCall,info);
						this.trigger("DamageTo",e);
					}
				}
			});
	},
	setHarmful:function(damageSpeed,baseDamage,damageFlag,eventCall){
		this._damageSpeed = damageSpeed;
		this._baseDamage = baseDamage;
		this._damageFlag = damageFlag;
		this._eventCall = eventCall;
		return this;
	}
});

Crafty.c("ElementType",{
	_element:"",
	element:function(e){
		if(!e) return this._element;
		this._element = e;
		return this;
	}
});

Crafty.c("ChangeToDynamic",{
	init:function(){
		this.requires("b2dObject");
	},
	changeToDynamic:function(){
		this.body().SetType(b2Body.b2_dynamicBody);
		this.body().SetAwake(true);
		this.trigger("ChangeToDynamic");
	}
});

Crafty.c("Jumper",{
	_onFloor:false,
	init:function(){
		this.requires("b2dObject, b2dCollision")
			.bind("ContactStart",function(e){
				if(e.has("FLOOR"))
					this._onFloor = true;
			})
	},
	jump:function(){
		if(!this._onFloor) return;
		this._onFloor = false;
		var pos = this.body().GetPosition();
		var vel = this.body().GetLinearVelocity();
		this.body().SetLinearVelocity(new b2Vec2(vel.x,0));
		this.body().ApplyImpulse(new b2Vec2(0,-8),this.body().GetWorldCenter());
	}
});

Crafty.c("Health",{
	_health:100,
	init:function(){
		this.bind("Damage",function(e){
			damage = e.obj._baseDamage + e.speed*10 * e.obj._baseDamage;
			this._health -= Math.ceil(damage);
			if(this._health <= 0)
				this.trigger("NoHealth");
		})
		.bind("EnterFrame",function(e){
			if(e.frame % 20 == 0 && this._health < 100)
				this._health += 1;
		})
	}
});

Crafty.c("TileVoxel",{
	_tileWest:null,
	_tileEast:null,
	_tileNorth:null,
	_tileSouth:null
})

function staticTile(x,y,type,sprite,body){
	return Crafty.e("STATIC_TILE, FLOOR")
		.addComponent("b2dObject, b2dCollision, b2dSimpleGraphics, ElementType, Canvas, "+sprite)
		.attr({x:x,y:y,w:60,h:60})
		.element(type)
		.b2d({
			body_type:b2Body.b2_staticBody,
			objects:[{
				type:body,
				friction:1,
				density:1,
				w:60,
				h:60,
				radius:60
			}]
		})
}

Crafty.scene("DemoLevel",function(){
	Crafty.sprite(60,"img/land.png",{land_spr:[0,0]});
	Crafty.sprite(60,"img/rock.png",{rock_spr:[0,0]});
	
	Crafty.e("2D, Canvas, Image")
		.attr({x:0,y:0,w:800,h:600})
		.image("img/bg1.png");
	
	for(var i=0;i<14;i++)
		staticTile(i*60,540,"earth","land_spr","box");
		
	for(var i=0;i<14;i++)
		staticTile(i*60,0,"earth","land_spr","circle")
			.addComponent("HarmfulAtSpeed, ChangeToDynamic, b2dMouse")
			.setHarmful(5,0.5,"PLAYER","Damage")
			.bind("MouseDown",function(e){
				if(e.b2dType != "inside") return;
				this.changeToDynamic();
			})
			.bind("ChangeToDynamic",function(){
				this.removeComponent("land_spr");
				this.addComponent("rock_spr");
				this.addComponent("b2dDraggable");
				this.body().SetAngularDamping(10);
			});
	
	Crafty.e("PLAYER")
		.addComponent("b2dObject, b2dCollision, b2dSimpleGraphics, Jumper, Health, Canvas, Color, Keyboard")
		.attr({x:200,y:200,w:30,h:80})
		.attr({"_maxVelocity":5})
		.color("#0af")
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			fixedRotation:true,
			objects:[{
				//body
				type:"box",
				offY:20,
				density:1,
				w:30,
				h:30
			},{
				//head
				type:"circle",
				radius:30
			},{
				//feet
				type:"circle",
				radius:30,
				offY:32,
				friction:1
			}]
		})
		.bind("NoHealth",function(){
			Crafty("obj").destroy();
			Crafty.scene("DemoLevel");
		})
		.bind("KeyDown",function(e){
			if(e.keyCode == 87)
				this.jump();
		})
		.bind("KeyUp",function(e){
			if(e.keyCode == 65 || e.keyCode == 68)
				this.body().SetLinearVelocity(new b2Vec2(0,this.body().GetLinearVelocity().y));
		})
		.bind("EnterFrame",function(){
			msg(this._health);
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
			//msg(this.body().GetFixtureList().GetFriction(),this._onFloor);
			if(this.isDown(65) && vel.x > -this._maxVelocity){
				this.body().ApplyImpulse(new b2Vec2(-2,0),this.body().GetWorldCenter());
			}
			if(this.isDown(68) && vel.x < this._maxVelocity){
				this.body().ApplyImpulse(new b2Vec2(2,0),this.body().GetWorldCenter());
			}
		})
});

Crafty.scene("Middle",function(){
	Crafty.scene("DemoLevel");
})

$(document).ready(function(){
	//Initialize crafty
	Crafty.init(800,600);
	Crafty.canvas.init();
	
	//Debug canvas
	$('#canvas')[0].width = 800;
	$('#canvas')[0].height = 600;
	
	Crafty.DRAW_SCALE = 30;
	Crafty.debugging = true;
	
	//Box2D world
	Crafty.e("b2dWorld");

	//First Scene
	Crafty.scene("DemoLevel");
	
	Crafty("2D").each(function(){
		this.alpha = 1;
	})
});