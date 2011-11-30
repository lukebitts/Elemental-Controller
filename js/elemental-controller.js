Crafty.c("Box2DWorld",{
	debugging:true,
	world:undefined,
	init:function(){
		this.requires("2D, Canvas")
		var worldAABB = new b2AABB();
		worldAABB.minVertex.Set(0, 0);
		worldAABB.maxVertex.Set(800, 600);
		var gravity = new b2Vec2(0, 300);
		this.world = new b2World(worldAABB, gravity, true);
		this.bind("EnterFrame",function(){
			var timeStep = 1.0/60;
			var iteration = 1;
			this.world.Step(timeStep, iteration);
		})
	}
});

Crafty.c("PhysicsModel",{
	_physicsModel:undefined,
	_world:Crafty(Crafty("Box2DWorld")[0]).world,
	physicsModel:function(obj){
		this._physicsModel = obj;
		this.trigger("PhysicsModelChange");
		return this;
	}
});

Crafty.c("PhysicsEnabled",{
	init:function(){
		this.requires("2D, PhysicsModel")
			.bind("PhysicsModelChange",function(){
				//console.log("Modelo mudado");
			})
			.bind("EnterFrame",function(){
				if(this._physicsModel == undefined) return;
				//@TODO: Fix the rotation from the physics to the graphics
				//this._physicsModel.m_rotation = 0;
				this.rotation = this._physicsModel.m_rotation*180/Math.PI;
				this.x = this._physicsModel.m_position.x  - this.w/2;
				this.y = this._physicsModel.m_position.y  - this.h/2;
			});
	}
})

function createSimpleRigidBody(world,x,y,w,h,density){
	var boxSd = new b2BoxDef();
	boxSd.density = density==undefined?1:density; 
	boxSd.restitution = 0.2;
	boxSd.friction = 0.8;
	boxSd.extents.Set(w/2, h/2);
	var boxBd = new b2BodyDef();
	boxBd.AddShape(boxSd);
	boxBd.position.Set(x,y);
	var boxr = world.CreateBody(boxBd);
	
	var r = Crafty.e("Canvas, PhysicsEnabled")
		.attr({w:w,h:h})
		.physicsModel(boxr);
		
	return r;
}

window.onload = function(){
	Crafty.init(800,600);
	Crafty.canvas.init();
	
	Crafty.e("2D, Canvas, Color")
		.attr({w:800,h:600})
		.color("#000");
	
	//Create the World;
	var world = Crafty.e("Box2DWorld");
	
	console.log(world.world);
	
	createSimpleRigidBody(world.world,50,50,40,40,0.1)
		.addComponent("Keyboard, Color")
		.color("#0af")
		.bind("KeyDown",function(e){
			console.log(e.key);
			this.keys[e.key] = true;
		})
		.bind("KeyUp",function(e){
			this.keys[e.key] = false;
		})
		.bind("EnterFrame",function(){
			if(!this.keys) this.keys = [];
			if(this.keys[68]){
				//this._physicsModel.ApplyForce(new b2Vec2(0,-500),new b2Vec2(20,20));
				//this._physicsModel.ApplyTorque(450);
				this._physicsModel.ApplyForce(new b2Vec2(-100,-300),new b2Vec2(0,0));
			}
		})
	createSimpleRigidBody(world.world,0,200,800,40,0)
		.addComponent("Color")
		.color("#af0")
		
	setInterval(function(){
		drawWorld(world.world,Crafty.canvas.context);
	},1);
}