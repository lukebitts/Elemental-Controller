function createFollowerSquare(physicsModel,size){
	var r = Crafty.e("2D, Canvas, Color")
		.color("#0af")
		.attr({w:size.w*2,h:size.h*2})
		.bind("EnterFrame",function(){
			this.lucas.m_rotation = 0;
			this.rotation = this.lucas.m_rotation*180/Math.PI;
			this.x = this.lucas.m_position.x - this.w/2;
			this.y = this.lucas.m_position.y - this.w/2;
		})
		.lucas = physicsModel;
	return r;
}

Crafty.c("Box2DWorld",{
	debugging:false,
	world:undefined,
	init:function(){
		this.requires("2D, Canvas")
		var worldAABB = new b2AABB();
		worldAABB.minVertex.Set(0, 0);
		worldAABB.maxVertex.Set(800, 600);
		var gravity = new b2Vec2(0, 20);
		this.world = new b2World(worldAABB, gravity, true);
	}
})

window.onload = function(){
	Crafty.init(800,600);
	Crafty.canvas.init();
	
	Crafty.e("2D, Canvas, Color")
		.attr({w:800,h:600})
		.color("#000");
	
	var world = Crafty.e("Box2DWorld").world;
	world.debugging = true;
	
	var boxSd = new b2BoxDef();
	boxSd.density = 1.0; 
	boxSd.restitution = 0.2;
	boxSd.friction = 1.0;
	boxSd.extents.Set(20, 20);
	var boxBd = new b2BodyDef();
	boxBd.AddShape(boxSd);
	boxBd.position.Set(30,30);
	var boxr = world.CreateBody(boxBd);
	
	createFollowerSquare(boxr,{w:20,h:20})
	
	console.log(boxr)
	
	var groundSd = new b2BoxDef();
	groundSd.restitution = 0.5;
	groundSd.friction = 1.0;
	groundSd.extents.Set(800, 20);
	var groundBd = new b2BodyDef();
	groundBd.AddShape(groundSd);
	groundBd.position.Set(0,590);
	var groundr = world.CreateBody(groundBd);

	//We have to simulate the world in its own loop
	var timeStep = 1.0/60;
	var iteration = 1;
	setInterval(function(){
		world.Step(timeStep, iteration);
		var ctx = Crafty.canvas.context; 
	},1);
	
}
