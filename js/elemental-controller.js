function pTOm(n){
	return n/30;
}

var b2Vec2 = Box2D.Common.Math.b2Vec2,
	b2AABB = Box2D.Collision.b2AABB,
	b2BodyDef = Box2D.Dynamics.b2BodyDef,
	b2Body = Box2D.Dynamics.b2Body,	
	b2FixtureDef = Box2D.Dynamics.b2FixtureDef,	
	b2Fixture = Box2D.Dynamics.b2Fixture,	
	b2World = Box2D.Dynamics.b2World,	
	b2MassData = Box2D.Collision.Shapes.b2MassData,	
	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,	
	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,	
	b2DebugDraw = Box2D.Dynamics.b2DebugDraw,  
	b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;

Crafty.c("Box2DWorld",{
	_world:undefined,
	_debug:false,
	init:function(){
		world = Crafty(Crafty("Box2DWorld")[0]);
		if(world.world() != undefined){
			//we can't have more than one world at a time
			this._world = world.world();
			return;
		}
		var gravity = new b2Vec2(0,10);
		var allowSleep = true;
		this._world = new b2World(gravity,allowSleep);
		this.bind("EnterFrame",function(){
			//console.log();
			this._world.Step(1/60, 10, 10);
            this._world.DrawDebugData();
            this._world.ClearForces();
		})
	},
	debug:function(option){
		this._debug = option;
		if(option){
			var debugDraw = new b2DebugDraw();
			var ctx = document.getElementById("cr-stage2").getContext('2d');
			debugDraw.SetSprite(ctx);
			debugDraw.SetDrawScale(30.0);
			debugDraw.SetFillAlpha(0.5);
			debugDraw.SetLineThickness(1.0);
			debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
			this._world.SetDebugDraw(debugDraw);
		}
		else {
			this._world.SetDebugDraw(null);
		}
		return this;
	},
	world:function(){
		return this._world;
	}
});

Crafty.c("Box2DPhysics",{
	_box2dPhysicsModel:undefined,
	init:function(){
		this.requires("2D")
			.bind("EnterFrame",function(){
				if(!this._box2dPhysicsModel) return;
				this._origin = {x:this.w/2,y:this.h/2};
				this.rotation = this._box2dPhysicsModel.GetAngle() * 180/Math.PI;
				this.x = this._box2dPhysicsModel.GetPosition().x*30 - this.w / 2;
				this.y = this._box2dPhysicsModel.GetPosition().y*30 - this.h / 2;
			})
	},
	physicsModel:function(model){
		this._box2dPhysicsModel = model;
		return this;
	}
})

window.onload = function(){
	Crafty.init(800,600);
	Crafty.canvas.init();
	
	//debug rendering in another canvas
	canvas2 = document.getElementById("cr-stage2");
	canvas2.width = 800;
	canvas2.height = 600;

	Crafty.e("2D, Canvas, Color")
		.attr({w:800,h:600})
		.color("#0af");
	
	//We have to create a physics world if we want to control the debug
	//without hassle
	var debug = true;
	var world = Crafty.e("Box2DWorld").debug(debug).world();
	
	//Basic fixture and body declarations
	Crafty.e("Canvas, Color, Box2DPhysics")
		.physicsModel(createStaticBox(world,110,500,200,50,null,null,0,0.3))
		.color("#faf")
		.attr({w:200,h:50})
		
	Crafty.e("Canvas, Color, Box2DPhysics")
		.physicsModel(createStaticBox(world,310,510,300,50,null,null,0,-0.0))
		.color("#faf")
		.attr({w:300,h:50})
    
    Crafty.sprite(40,"img/ball.png",{b:[0,0]});
    Crafty.e("Canvas, Color, Box2DPhysics, Keyboard")
    	.physicsModel(createDynamicCircle(world,40,40,40,null,null,0))
    	.color("#faa")
		.attr({w:40,h:40})
		.bind("KeyUp",function(e){
			this.keys[e.key] = false;
		})
		.bind("KeyDown",function(e){
			this.keys[e.key] = true;
			if(e.key == 87)
				this._box2dPhysicsModel.ApplyImpulse(new b2Vec2(0,-10),new b2Vec2(0,0));
		})
		.bind("EntreFrame",function(){
			var mod = this._box2dPhysicsModel;
			if(this.keys[68])
				mod.ApplyImpulse(new b2Vec2(0,0),new b2Vec2(0,0));
		})
		.keys=[];
    

}