b2Vec2 = Box2D.Common.Math.b2Vec2;
b2Body = Box2D.Dynamics.b2Body;

Crafty.extend({
	DRAW_SCALE:30,
	debugging:true
});

Crafty.c("b2dWorld",{
	_world:undefined,
	init:function(){
		//Before creating the world we have to check if another one alredy exists
		var world = Crafty(Crafty("b2dWorld")[0]);
		if(world._world != undefined){
			this._world = world._world;
			return;
		}
		
		//We create the world
		var gravity = new b2Vec2(0,10);
		this._world = new Box2D.Dynamics.b2World(gravity,false);
		
		//The debug data
		var debugDraw = new Box2D.Dynamics.b2DebugDraw();
		var ctx = $("#canvas")[0].getContext("2d");
		
		debugDraw.SetSprite(ctx);
		debugDraw.SetDrawScale(Crafty.DRAW_SCALE);
		debugDraw.SetFillAlpha(0.5);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(
			Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit
		);
		this._world.SetDebugDraw(debugDraw);
		
		//The collision listeners
		var contactListener = new Box2D.Dynamics.b2ContactListener();
		contactListener.BeginContact = function(contact){
			var bodyA = contact.GetFixtureA().GetBody().userData.crafty_entity;
			var bodyB = contact.GetFixtureB().GetBody().userData.crafty_entity;
			if(bodyA.has("b2dCollision") && bodyB.has("b2dCollision")){
				bodyA.contactStart(bodyB);
				bodyB.contactStart(bodyA);
			}
		}
		contactListener.EndContact = function(contact){
			var bodyA = contact.GetFixtureA().GetBody().userData.crafty_entity;
			var bodyB = contact.GetFixtureB().GetBody().userData.crafty_entity;
			if(bodyA.has("b2dCollision") && bodyB.has("b2dCollision")){
				bodyA.contactEnd(bodyB);
				bodyB.contactEnd(bodyA);
			}
		}
		this._world.SetContactListener(contactListener);
		
		//The main world loop
		this.bind("EnterFrame",function(){
			this._world.Step(1/24,10,10);
			this._world.DrawDebugData();
			this._world.ClearForces();
		});
	},
	world:function(){
		return this._world;
	}
});

Crafty.c("b2dCollision",{
	_collisionList:[],
	init:function(){
		this.bind("ContactStart",function(e){
			this._collisionList.push(e);
		});
		this.bind("ContactEnd",function(e){
			var removeIndex = this._collisionList.indexOf(e);
			this._collisionList.splice(removeIndex);
		});
	},
	contactStart:function(e){
		this.trigger("ContactStart",e);
	},
	contactEnd:function(e){
		this.trigger("ContactEnd",e);
	},
	hit:function(component){
		for(i in this._collisionList){
			if(this._collisionList[i].has(component))
				return this._collisionList[i];
		}
		return false;
	}
});

Crafty.c("b2dObject",{
	_body:undefined,
	init:function(){
		this.requires("b2dWorld");
	},
	b2d:function(args){
		var bodyDef = new Box2D.Dynamics.b2BodyDef();
		bodyDef.type = args.body_type;
		var x = args.x || this.x;
		var y = args.y || this.y;
		bodyDef.position.Set(x/Crafty.DRAW_SCALE,y/Crafty.DRAW_SCALE);
		bodyDef.angle = args.angle || 0;
		bodyDef.fixedRotation = args.fixedRotation || false;
		
		bodyDef.bullet = args.bullet || false;
		var body = this._world.CreateBody(bodyDef);
		
		for(i in args.objects){
			var obj_args = args.objects[i];
			var fixDef = new Box2D.Dynamics.b2FixtureDef();
			fixDef.density = obj_args.density || 0;
			fixDef.friction = obj_args.friction || 0;
			fixDef.restitution = obj_args.restitution || 0;
			
			if(obj_args.type == "circle"){
				var r = obj_args.radius/Crafty.DRAW_SCALE/2;
				fixDef.shape = new Box2D.Collision.Shapes.b2CircleShape(r);
				var offX = obj_args.offX*2/Crafty.DRAW_SCALE || r;
				var offY = obj_args.offY*2/Crafty.DRAW_SCALE || r;
				fixDef.shape.SetLocalPosition(new b2Vec2(offX,offY));
			}
			else if(obj_args.type == "polygon"){
				var vertexCount = obj_args.polys.length;
				fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
				var vertex = [];
				var offX = obj_args.offX*2/Crafty.DRAW_SCALE || 0;
				var offY = obj_args.offY*2/Crafty.DRAW_SCALE || 0;
				for(j in obj_args.polys){
					var poly = obj_args.polys[j];
					vertex.push(new b2Vec2(poly[0]/Crafty.DRAW_SCALE+offX,poly[1]/Crafty.DRAW_SCALE+offY));
				}
				fixDef.shape.SetAsVector(vertex,vertexCount);
			}
			else if(obj_args.type == "box"){
				fixDef.shape = new Box2D.Collision.Shapes.b2PolygonShape();
				var w = obj_args.w/Crafty.DRAW_SCALE/2;
				var h = obj_args.h/Crafty.DRAW_SCALE/2;
				var offX = obj_args.offX*2/Crafty.DRAW_SCALE || w;
				var offY = obj_args.offY*2/Crafty.DRAW_SCALE || h;
				fixDef.shape.SetAsOrientedBox(w, h,new b2Vec2(offX,offY),0.0);
			}
			else throw "Undefined b2d type: "+obj_args.type;
			
			body.CreateFixture(fixDef);
		}
		body.userData = {
			crafty_entity:this
		};
		this._body = body;
		return this;
	},
	body:function(){
		return this._body;
	}
});

Crafty.c("b2dSimpleGraphics",{
	init:function(){
		this.requires("2D, b2dObject")
			.bind("EnterFrame",function(){
				this.x = this._body.GetPosition().x * Crafty.DRAW_SCALE;
				this.y = this._body.GetPosition().y * Crafty.DRAW_SCALE;
				this.angle = this._body.GetAngle()*180/Math.PI;
			})
	}
})

$(document).ready(function(){
	//Initialize crafty
	Crafty.init(800,600);
	Crafty.canvas.init();
	
	//Debug canvas
	$('#canvas')[0].width = 750;
	$('#canvas')[0].height = 600;
	
	var w = Crafty.e("b2dWorld");
	var world = w.world();
	
	//static floor
	Crafty.e("b2dObject, b2dCollision, b2dSimpleGraphics, Color, Canvas")
		.color("#aa0")
		.attr({x:0,y:550,w:800,h:30})
		.b2d({
			body_type:b2Body.b2_staticBody,
			objects:[{
				type:"box",
				w:800,
				h:30
			}]
		})
		
	
	//dynamic box
	Crafty.e("b2dObject, b2dCollision, b2dSimpleGraphics, Color, Canvas")
		.color("#0af")
		.attr({x:100,y:0,w:30,h:30})
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			objects:[{
				type:"box",
				restitution:0.9,
				w:30,
				h:30
			}]
		})
	
	//dynamic complex object
	Crafty.e("b2dObject, b2dCollision, b2dSimpleGraphics, Color, Canvas, Keyboard")
		.color("#0af")
		.attr({x:200,y:100,w:30,h:30})
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			fixedRotation:true,
			objects:[{
				type:"circle",
				density:1,
				restitution:0.9,
				radius:30,
				offY:30
			}]
		})
		.bind("EnterFrame",function(){
			if(this.hit("2D")){
				console.log("a");
			}
		})
		.bind("KeyDown",function(e){
			console.log(this._collisionList)
		})
		
	
})
