var
b2Vec2 = Box2D.Common.Math.b2Vec2,
b2Transform = Box2D.Common.Math.b2Transform,
b2Mat22 = Box2D.Common.Math.b2Mat22,
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
b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJointDef;

Crafty.c("b2dWorld",{
	_world:undefined,
	init:function(){
		world = Crafty(Crafty("b2dWorld")[0]);
		if(world._world != undefined){
			//we can't have more than one world at a time
			this._world = world.world();
			return;
		}
		//we set the world
		var gravity = new b2Vec2(0,10);
		var allowSleep = false;
		this._world = new b2World(gravity, allowSleep);
		this._world.drawScale = 30;
		
		//we set the debug data
		var debugDraw = new b2DebugDraw();
		var ctx = $('#canvas')[0].getContext('2d');
		debugDraw.SetSprite(ctx);
		debugDraw.SetDrawScale(this._world.drawScale);
		debugDraw.SetFillAlpha(0.5);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(
			b2DebugDraw.e_shapeBit | 
			b2DebugDraw.e_jointBit //|
			//b2DebugDraw.e_aabbBit |
			//b2DebugDraw.e_centerOfMassBit |
			//b2DebugDraw.e_pairBit |
			//b2DebugDraw.e_controllerBit
			);
		this._world.SetDebugDraw(debugDraw);
		
		//we set the contact listeners
		var contactListener = new Box2D.Dynamics.b2ContactListener;
		contactListener.BeginContact = function(contact) {
			var eA, eB, _ref, _ref2;
			eA = (_ref = contact.GetFixtureA().GetBody().userData) != null ? _ref.b2d_entity : void 0;
			eB = (_ref2 = contact.GetFixtureB().GetBody().userData) != null ? _ref2.b2d_entity : void 0;
			if (eA && eB) {
				if (typeof eA._onContact === 'function') {
					eA._onContact(eB);
				}
				if (typeof eB._onContact === 'function') {
					eB._onContact(eA);
				}
				console.log(contact);
			}
		};
		contactListener.EndContact = function(contact) {
			var eA, eB, _ref, _ref2;
			eA = (_ref = contact.GetFixtureA().GetBody().userData) != null ? _ref.b2d_entity : void 0;
			eB = (_ref2 = contact.GetFixtureB().GetBody().userData) != null ? _ref2.b2d_entity : void 0;
			if (eA && eB) {
				if (typeof eA._onContactEnd === 'function') {
					eA._onContactEnd(eB);
				}
				if (typeof eB._onContactEnd === 'function') {
					eB._onContactEnd(eA);
				}
			}
		}
		this._world.SetContactListener(contactListener);
		
		//and finally the events
		this.bind("EnterFrame",function(){
			this._world.Step(1/24, 10, 10);
            this._world.DrawDebugData();
            this._world.ClearForces();
		});
	},
	world:function(){
		return this._world;
	}
});

Crafty.c('b2dObject',{
	_b2de:undefined,
	body:undefined,
	onContact:undefined,
	init:function(){
		this.requires('2D, b2dWorld');
	},
	b2d:function(args){
		var x = this.x != null ? this.x : (args.x != null ? args.x : 0);
		var y = this.y != null ? this.y : (args.y != null ? args.y : 0);
		//@TODO: Gotta fix this damn not knowing if x,y,w or h were set
		var param = {
			//mandatory parameters
			world: this._world,
			body_type: args.body_type,
			position: new b2Vec2(x,y),
			crafty_entity: this
		}
		for(i in args){
			//optional parameters
			if(param[i] == undefined)
				param[i] = args[i];
		}
		this._b2de = new B2DEntity(param);
		this._b2de.contactListen('crafty',this);
		this._b2de.contactEndListen('crafty',this);
		this.body = this._b2de.body;
		this.bind("EnterFrame",function(){
			var angle, position;
			position = this.body.GetPosition();
			angle = this.body.GetAngle()*180/Math.PI;

			this.rotation = angle;
			this.attr({
				x: (position.x*this._world.drawScale),
				y: (position.y*this._world.drawScale)
			});
		})
		.bind("Remove",function(){
			var destroyBody = function(world,body){
				world.DestroyBody(body);
			}
			setTimeout(destroyBody,0,this._world,this.body);
		})
		return this;
	}
});

Crafty.c('b2dJoint',{
	joint:undefined,
	init:function(){
		this.requires('b2dWorld')
	},
	b2djoint:function(args){
		var bodyA = args.bodyA;
		var bodyB = args.bodyB;
		if(args.type == "distance"){
			var jointDef = new b2DistanceJointDef;
			jointDef.Initialize(bodyA,bodyB,bodyA.GetWorldCenter(),bodyB.GetWorldCenter());
			jointDef.length = 200/this._world.drawScale;
			jointDef.dampingRatio = 1;
			jointDef.frequencyHz = 1;
			this.joint = this._world.CreateJoint(jointDef);
		}
	}
})

Crafty.c("AlphaOnTouch",{
	_flag:undefined,
	_touchObj:undefined,
	init:function(){
		this.requires('b2dObject')
			.bind("Contact",function(e){
				var obj = e.body.userData.crafty_entity;
				if(obj.has(this._flag)){
					this.alpha = 0.5;
					this._touchObj = obj;
				}
			})
			.bind("ContactEnd",function(e){
				var obj = e.body.userData.crafty_entity;
				if(obj == this._touchObj){
					this.alpha = 1;
					this._touchObj = undefined;
				}
			})
	},
	flag:function(s){
		this._flag = s;
	}
});

$(document).mousemove(function(e){
	msg(e.clientX,e.clientY);
})

$(document).ready(function(){
	//We initialize the basic Crafty Canvas 
	Crafty.init(750,600);
	Crafty.canvas.init();
	
	//And our physics debug canvas
	$('#canvas')[0].width = 750;
	$('#canvas')[0].height = 600;
	
	//we should create a world, just to be sure we have the right pointer
	// since every b2d entity will also have a pointer to this world
	var w = Crafty.e('b2dWorld');
	var world = w.world();
	
	b = Crafty.e("PLAYER, 2D, Canvas, Color, b2dObject, Keyboard")
		.attr({x:40,y:40,w:40,h:30})
		.color("#0af")
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			bullet:true,
			fixedRotation:true,
			objects:[{
				w:40,
				h:20,
				restitution:0,
				density:1
			},{
				type:"circle",
				radius:15,
				restitution:0,
				offY:20,
				density:1
			},{
				type:"circle",
				radius:15,
				restitution:0,
				offY:20,
				offX:33,
				density:1
			}]
		})
		.bind("KeyDown",function(e){
			//console.log(e.key);
			if(e.key == 87){
				this.body.ApplyImpulse(new b2Vec2(0,-12),this.body.GetWorldCenter())
			}
			if(e.key == 68){
				this.body.ApplyImpulse(new b2Vec2(5,0),this.body.GetWorldCenter())
			}
			if(e.key == 65){
				this.body.ApplyImpulse(new b2Vec2(-5,0),this.body.GetWorldCenter())
			}
		});
		
	//Crafty.viewport.follow(b,0,0);
	
	//TILE-FLOOR EXAMPLE:
	for(var i = 0;i < 9;i++){
		Crafty.e("TILE, 2D, Canvas, Color, b2dObject")
			.attr({x:80*i,y:540,w:80,h:50})
			.color("#0a0")
			.b2d({
				body_type:b2Body.b2_staticBody,
				angle:0.0,
				objects:[{
					w:80,
					h:50,
					restitution:0
				}]
			});
	}
	
	//DYNAMIC CIRCLE EXAMPLE
	Crafty.e("2D, Canvas, Color, b2dObject")
		.attr({x:200,y:400,w:30,h:30})
		.color("#0ff")
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			objects:[{
				type:"circle",
				radius:30,
				restitution:0.5
			}]
		})
	
	//COMPLEX BODY AND POLYGON EXAMPLE
	Crafty.e("2D, Canvas, Color, b2dObject")
		.attr({x:300,y:300,w:50,h:50})
		.color("#0aa")
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			objects:[{
				type:"polygon",
				polys:[[25,0],[50,50],[0,50],[5,25]]
			},{
				type:"circle",
				radius:50
			}]
		})
	
	//DYNAMIC BOX EXAMPLE
	Crafty.e("2D, Canvas, Color, b2dObject, AlphaOnTouch, CRATE")
		.attr({x:400,y:200,w:30,h:30})
		.color("#0af")
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			objects:[{
				type:"box",
				w:30,
				h:30,
				density:2,
				restitution:0
			}]
		})
		.flag("PLAYER");
		
	//JOINT-OBJECTS EXAMPLE
	var je1 = Crafty.e("2D, Canvas, Color, b2dObject")
		.attr({x:400,y:0,w:20,h:20})
		.color("#0af")
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			objects:[{
				type:"box",
				w:20,
				h:20,
				density:1
			}]
		}).body;
	var je2 = Crafty.e("2D, Canvas, Color, b2dObject")
		.attr({x:600,y:0,w:20,h:20})
		.color("#0af")
		.b2d({
			body_type:b2Body.b2_staticBody,
			objects:[{
				type:"box",
				w:20,
				h:20,
				density:1
			}]
		}).body;
	Crafty.e("b2dJoint")
		.b2djoint({
			type:"distance",
			bodyA:je1,
			bodyB:je2
		})
		
	/*setTimeout(function(){
		Crafty("TILE").each(function(){
			this.body.SetType(b2Body.b2_dynamicBody);
		})
	},2000);*/
});
