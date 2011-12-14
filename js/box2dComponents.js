b2Vec2 = Box2D.Common.Math.b2Vec2;
b2Body = Box2D.Dynamics.b2Body;

Crafty.extend({
	DRAW_SCALE:30,
	debugging:true,
	debug_ctx:"canvas"
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
		var ctx = $("#"+Crafty.debug_ctx)[0].getContext("2d");
		
		debugDraw.SetSprite(ctx);
		debugDraw.SetDrawScale(Crafty.DRAW_SCALE);
		debugDraw.SetFillAlpha(0.5);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(
			Box2D.Dynamics.b2DebugDraw.e_shapeBit | Box2D.Dynamics.b2DebugDraw.e_jointBit | 0x0010
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
			if(Crafty.debugging) this._world.DrawDebugData();
			this._world.ClearForces();
		});
	},
	world:function(){
		return this._world;
	}
});

Crafty.c("ArrayAdd",{
	addArray:function(name){
		this[name] = [];
		return this;
	}
});

$(document).mousemove(function(e){
	//if(e.clientX > 800 || e.clientY > 600) return;
	Crafty("b2dMouse").each(function(){
		this.mouseMove(e);
	});
});
$(document).mousedown(function(e){
	//if(e.clientX > 800 || e.clientY > 600) return;
	Crafty("b2dMouse").each(function(){
		this.mouseDown(e);
	});
});
$(document).mouseup(function(e){
	//if(e.clientX > 800 || e.clientY > 600) return;
	Crafty("b2dMouse").each(function(){
		this.mouseUp(e);
	});
});

Crafty.c("b2dMouse",{
	_mouseX:0,
	_mouseY:0,
	_mouseOver:false,
	_getBodyAtMouse:function(e){
		var mousePVec = new b2Vec2(e.clientX/Crafty.DRAW_SCALE,e.clientY/Crafty.DRAW_SCALE);
		var aabb = new Box2D.Collision.b2AABB();
		aabb.lowerBound.Set(e.clientX/Crafty.DRAW_SCALE - 0.001, e.clientY/Crafty.DRAW_SCALE - 0.001);
		aabb.upperBound.Set(e.clientX/Crafty.DRAW_SCALE + 0.001, e.clientY/Crafty.DRAW_SCALE + 0.001);
		var body;
		var fixture;
		var GetBodyCallback = function(fixture){
			var shape = fixture.GetShape();
			var inside = shape.TestPoint(fixture.GetBody().GetTransform(),mousePVec);
			if(inside){
				body = fixture.GetBody();
				return false;
			}
			return true;
		}
		this._world.QueryAABB(GetBodyCallback,aabb);
		return body;
	},
	init:function(){
		this.requires("b2dObject");
	},
	mouseDown:function(e){
		if(e.clientX > 800 || e.clientY > 600) return;
		var result = this._getBodyAtMouse(e);
		if(result != this._body) result = undefined;
		if(result)
			e.b2dType = "inside";
		else
			e.b2dType = "outside";
		this.trigger("MouseDown",e);
	},
	mouseUp:function(e){
		var result = this._getBodyAtMouse(e);
		if(result != this._body) result = undefined;
		if(result)
			e.b2dType = "inside";
		else
			e.b2dType = "outside";
		this.trigger("MouseUp",e);
	},
	mouseMove:function(e){
		this._mouseX = e.clientX;
		this._mouseY = e.clientY;
		this.trigger("MouseMove",e)
		var result = this._getBodyAtMouse(e);
		if(result != this._body) result = undefined;
		if(result){
			this.trigger("MouseOver",e);
			this._mouseOver = true;
		}
		else
			if(this._mouseOver){
				this.trigger("MouseOut",e);
				this._mouseOver = false;
			}
	}
})

Crafty.c("b2dDraggable",{
	_mouseJoint:undefined,
	_dragging:false,
	init:function(){
		this.requires("b2dWorld, b2dMouse")
			.bind("MouseDown",function(e){
				if(e.b2dType != "inside") return;
				this._dragging = true;
			})
			.bind("MouseMove",function(e){
				if(!this._dragging) return;
				if(!this._mouseJoint){
					var body = this.body();
					if(body){
						var md = new Box2D.Dynamics.Joints.b2MouseJointDef();
						md.bodyA = this._world.GetGroundBody();
						md.bodyB = body;
						md.target.Set(this._mouseX/Crafty.DRAW_SCALE, this._mouseY/Crafty.DRAW_SCALE);
						md.collideConnected = true;
						md.maxForce = 300.0 * body.GetMass();
						this._mouseJoint = this._world.CreateJoint(md);
						body.SetAwake(true);
					}
				}
				var target = new b2Vec2(this._mouseX/Crafty.DRAW_SCALE,this._mouseY/Crafty.DRAW_SCALE);
				this._mouseJoint.SetTarget(target);
			})
			.bind("MouseUp",function(){
				if(!this._mouseJoint) return;
				this._world.DestroyJoint(this._mouseJoint);
				this._mouseJoint = undefined;
				this._dragging = false;
			});
	}
})

Crafty.c("b2dCollision",{
	init:function(){
		this.requires("ArrayAdd")
			.addArray("_collisionList");
	},
	contactStart:function(e){
		this._collisionList.push(e);
		this.trigger("ContactStart",e);
	},
	contactEnd:function(e){
		var removeIndex = this._collisionList.indexOf(e);
		this._collisionList.splice(removeIndex);
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
		this.requires("b2dWorld")
			.bind("Remove",function(){
				setTimeout(function(e,f){
					f.DestroyBody(e)
				},0,this.body(),this._world);
			})
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
		
		if(!args.objects) throw "Missing OBJECTS parameter";
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

Crafty.c("b2dJoint",{
	joint:undefined,
	init:function(){
		this.requires('b2dWorld')
	},
	b2djoint:function(args){
		var bodyA = args.bodyA;
		var bodyB = args.bodyB || this._world.GetGroundBody();
		var aX = bodyA.GetWorldCenter().x+(args.aOffX/Crafty.DRAW_SCALE || 0);
		var aY = bodyA.GetWorldCenter().y+(args.aOffY/Crafty.DRAW_SCALE || 0);
		var bX = bodyB.GetWorldCenter().x+(args.bOffX/Crafty.DRAW_SCALE || 0);
		var bY = bodyB.GetWorldCenter().y+(args.bOffY/Crafty.DRAW_SCALE || 0);
		var jointDef;
		if(args.type == "distance"){
			jointDef = new Box2D.Dynamics.Joints.b2DistanceJointDef();
			jointDef.Initialize(bodyA,bodyB,new b2Vec2(aX,aY),new b2Vec2(bX,bY));
			jointDef.length = args.distance/Crafty.DRAW_SCALE;
			jointDef.dampingRatio = args.dampingRatio || 0;
			jointDef.frequencyHz = args.frequencyHz || 0;
		}
		else if(args.type == "revolute"){
			console.log(bodyA);
			if(bodyA.m_fixtureList.m_density == 0)
				throw "Body mass should be higher than 0 for a revolute joint";
			jointDef = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
			jointDef.Initialize(bodyA,bodyB,new b2Vec2(aX,aY),new b2Vec2(bX,bY));
			jointDef.maxMotorTorque = args.maxMotorTorque || 0;
			jointDef.enableMotor = args.enableMotor || false;
		}
		else if(args.type == "prismatic"){
			jointDef = new Box2D.Dynamics.Joints.b2PrismaticJointDef();
			var worldAxis = args.worldAxis || new b2Vec2(0,0)
			jointDef.Initialize(bodyA,bodyB,new b2Vec2(aX,aY),worldAxis);
			jointDef.lowerTranlation = args.lowerTranslation || 0;
			jointDef.upperTranslation = args.upperTranslation || 0;
			jointDef.enableLimit = args.enableLimit || false;
			jointDef.maxMotorForce = args.maxMotorForce || 0;
			jointDef.motorSpeed = args.motorSpeed || 0;
			jointDef.enableMotor = args.enableMotor || true;
		}
		else throw "Undefined joint type: "+args.type;
		this.joint = this._world.CreateJoint(jointDef);
	}
})

Crafty.c("b2dSimpleGraphics",{
	init:function(){
		this.requires("2D, b2dObject")
			.bind("EnterFrame",function(){
				this.x = this._body.GetPosition().x * Crafty.DRAW_SCALE;
				this.y = this._body.GetPosition().y * Crafty.DRAW_SCALE;
				this.rotation = this.body().GetAngle() * 180/Math.PI;
			})
	}
})