Math.signum = function(n){
	return !n?0:n>0?1:-1;
}

Crafty.c("VoxelTile",{
	_neighbours:undefined,
	_getInverseDirection:function(dir){
		if(dir == "north") return "south";
		if(dir == "south") return "north";
		if(dir == "east") return "west";
		if(dir == "west") return "east";
	},
	init:function(){
		n = this._neighbours = {};
		n["_north"] = null;
		n["_south"] = null;
		n["_east"] = null;
		n["_west"] = null;
	},
	triggerNeighbours:function(evt,arg){
		for(i in this._neighbours)
			if(this._neighbours[i]!=null) this._neighbours[i].trigger(evt, arg);
	},
	hasNeighbour:function(){
		for(i in this._neighbours)
			if(this._neighbours[i] != null) return true;
		return false;
	},
	getNeighbours:function(){
		var ret = {};
		for(i in this._neighbours)
			if(this._neighbours[i] != null)
				ret[i] = this.neighbours[i];
		return ret;
	},
	removeNeighbours:function(){
		var n = this._neighbours;
		for(i in n){
			if(n[i] != null)
				n[i]._neighbours[this._getInverseDirection(i)] = null
				n[i] = null;	
		}
	},
	whichNeighbour:function(n){
		for(i in this._neighbours)
			if(this._neighbours[i] == n)
				return i;
		return false;
	}
});

Crafty.c("ChangeBodyType",{
	init:function(){
		this.requires("b2dObject")
	},
	changeToDynamic:function(){
		this.body().SetType(b2Body.b2_dynamicBody);
		this.body().SetAwake(true);
		this.trigger("ChangeToDynamic");
	},
	changeToStatic:function(){
		this.body().SetType(b2Body.b2_staticBody);
		this.trigger("ChangeToStatic");
	}
});

elementSprite = {
	"earth":["spr_earth","spr_rock"]
}

function createComplexTile(x,y,element){
	console.warn("DEPRECATED: Use createUnusableTile() for now;")
	return createUnusableTile(x,y,element);
	var floor = Crafty.e("TILE, FLOOR")
		.addComponent("b2dObject, b2dSimpleGraphics, b2dCollision, VoxelTile, Canvas")
		.addComponent(elementSprite[element][0])
		.attr({"_walls":[]})
		.attr({x:x,y:y,w:64,h:64})
		.b2d({
			body_type:b2Body.b2_staticBody,
			objects:[{
				type:"polygon",
				friction:1,
				density:1,
				polys:[[0,0],[64,0],[32,32]]
			}]
		})
		.bind("Remove",function(e){
			for(i in this._walls){
				console.log(i,this._walls[i],this._walls);
				this._walls[i].destroy();
			}
		})
	var wallLeft = Crafty.e("TILE, WALL")
		.addComponent("b2dObject, b2dCollision, 2D")
		.attr({x:x,y:y})
		.b2d({
			body_type:b2Body.b2_staticBody,
			objects:[{
				type:"polygon",
				friction:1,
				density:1,
				polys:[[0,0],[32,32],[32,64],[0,64]]
			}]
		})
		.bind("MouseDown",function(e){floor.trigger("MouseDown",e)})
	var wallRight = Crafty.e("TILE, WALL")
		.addComponent("b2dObject, b2dCollision, 2D")
		.attr({x:x,y:y})
		.b2d({
			body_type:b2Body.b2_staticBody,
			objects:[{
				type:"polygon",
				friction:1,
				density:1,
				polys:[[32,32],[64,0],[64,64],[32,64]]
			}]
		});
	floor._walls.push(wallLeft);
	floor._walls.push(wallRight);
	return floor;
}

function createUnusableTile(x,y,element){
	return Crafty.e("TILE, FLOOR")
		.addComponent("b2dObject, b2dSimpleGraphics, b2dCollision, VoxelTile, Canvas")
		.addComponent(elementSprite[element][0])
		.attr({x:x,y:y,w:64,h:64})
		.b2d({
			body_type:b2Body.b2_staticBody,
			objects:[{
				type:"box",
				friction:1,
				density:1,
				w:64,
				h:64
			}]
		});
}

function createUsableTile(x,y,element){
	return createComplexTile(x,y,element)
		.addComponent("b2dMouse, ChangeBodyType")
		.bind("MouseDown",function(e){
			if(e.b2dType=="inside"){
				this.changeToDynamic();
				this.removeNeighbours();
				this.unbind("MouseDown");
				this.addComponent("b2dDraggable");
			}
		})
		.bind("ChangeToDynamic",function(){
			this.removeComponent(elementSprite[element][0]);
			this.addComponent(elementSprite[element][1]);
			this._world.DestroyBody(this._body);
			this.b2d({
				body_type:b2Body.b2_dynamicBody,
				bullet:true,
				objects:[{
					/*ttype:"polygon",
					polys:[[0,17],[20,0],[44,0],[63,20],[63,39],[40,63],[17,63],[0,39]],
					friction:1,
					density:1*/
					type:"circle",
					friction:1,
					density:2,
					radius:62
				}]
			});
			this.body().SetAngularDamping(10);
			this.triggerNeighbours("NFell",this);
		})
		.bind("NFell",function(e){
			//if(this == e) return;
			//this.removeNeighbours();
			//this.changeToDynamic();
		});
}

Crafty.c("XML",{
	_xml:null,
	xml:function(path){
		if(window.XMLHttpRequest){
        	var Loader = new XMLHttpRequest();
        	Loader.open("GET", path ,false);
        	Loader.send(null);
        	this._xml = Loader.responseXML;
    	}else if(window.ActiveXObject){
        	var Loader = new ActiveXObject("Msxml2.DOMDocument.3.0");
        	Loader.async = false;
        	Loader.load(path);
        	this._xml = Loader;
    	}
    	return this._xml;
	}
});

Crafty.c("TilesHolder",{
	_mapData:{},
	_mapTiles:{},
	_addTile:function(col,line){
		var x = col;
		var y = parseInt(line.attributes["line"].nodeValue);
		var element = line.attributes["element"].nodeValue;
		var usable = line.attributes["type"].nodeValue;
		this._mapData[x+"_"+y] = {element:element,usable:usable};
		return this;
	},
	_createMap:function(){
		for(i in this._mapData){
			var pos = i.split("_");
			pos[0] = parseInt(pos[0]); pos[1] = parseInt(pos[1]);
			this._mapData[i].usable = "usable";
			if(this._mapData[i].usable == "usable")
				this._mapTiles[i] = createUsableTile(parseInt(pos[0])*64,parseInt(pos[1])*64,this._mapData[i].element)
			else
				this._mapTiles[i] = createComplexTile(parseInt(pos[0])*64,parseInt(pos[1])*64,this._mapData[i].element);
		}
		for(i in this._mapTiles){
			var pos = i.split("_");
			pos[0] = parseInt(pos[0]); pos[1] = parseInt(pos[1]);
			this._mapTiles[i]._neighbours["_north"] = this._mapTiles[pos[0]+"_"+(pos[1]-1)];
			this._mapTiles[i]._neighbours["_south"] = this._mapTiles[pos[0]+"_"+(pos[1]+1)];
			this._mapTiles[i]._neighbours["_east"] = this._mapTiles[(pos[0]+1)+"_"+pos[1]];
			this._mapTiles[i]._neighbours["_west"] = this._mapTiles[(pos[0]-1)+"_"+pos[1]];
		}
	},
	init:function(){
		this.requires("XML");
	},
	createMapFromXML:function(xmlpath){
		var xml = this.xml(xmlpath);
		var columns = xml.getElementsByTagName("column");
		for(var i=0;i<columns.length;i++){
			for(var j=0;j<columns[i].childNodes.length;j++){
				var line = columns[i].childNodes[j];
				if(line.nodeName!="tile") continue;
				this._addTile(i,line);
			}
		}
		this._createMap();
	}
});

Crafty.c("CharacterJump",{
	_onFloor:true,
	_floorFlag:"",
	init:function(){
		this.requires("b2dObject")
			.bind("EnterFrame",function(){
				var i = this.body().m_contactList;
				this._onFloor = false;
				while(i!=null){
					if(i.contact.m_fixtureA.GetUserData() == "feet" || i.contact.m_fixtureB.GetUserData() == "feet"){
						this._onFloor = true;
						return;
					}
					i = i.next;
				}
			})
	},
	onFloor:function(){
		return this._onFloor;
	},
	floorFlag:function(f){
		this._floorFlag = f;
		return this;
	},
	jump:function(){
		if(this._onFloor){
			this.trigger("Jumped");
			this._onFloor = false;
			var pos = this.body().GetPosition();
			var vel = this.body().GetLinearVelocity();
			this.body().SetLinearVelocity(new b2Vec2(vel.x,0));
			this.body().ApplyImpulse(new b2Vec2(0,-7.3),this.body().GetWorldCenter());
		}
	}
})

Crafty.c("CharacterMovement",{
	_walkLeft:false,
	_walkRight:false,
	_maxVelocity:0.5,
	init:function(){
		this.requires("b2dObject")
			.bind("EnterFrame",function(){
				var vel = this.body().GetLinearVelocity();
				if(Math.abs(vel.x)>this._maxVelocity){
					vel.x = Math.signum(vel.x) * this._maxVelocity;
					this.body().SetLinearVelocity(vel);
				}
				if(this._walkLeft || this._walkRight){
					this.body().SetLinearVelocity(new b2Vec2(vel.x*0.9,vel.y));
				}
				if(!this._onFloor){
					this.body().GetFixtureList().SetFriction(0);
				}
				else {
					if(!this._walkLeft && !this._walkRight){
						this.body().GetFixtureList().SetFriction(100);
					}
					else{
						this.body().GetFixtureList().SetFriction(0.2);
					}
				}
				//msg(this.body().GetFixtureList().GetFriction(),this._onFloor);
				if(this._walkLeft && vel.x > -this._maxVelocity){
					this.body().ApplyImpulse(new b2Vec2(-2,0),this.body().GetWorldCenter());
				}
				if(this._walkRight && vel.x < this._maxVelocity)
					this.body().ApplyImpulse(new b2Vec2(2,0),this.body().GetWorldCenter());
			})
	},
	walkLeft:function(){
		this.walkStop();
		this._walkLeft = true;
	},
	walkRight:function(){
		this.walkStop();
		this._walkRight = true;
	},
	walkStop:function(){
		this._walkLeft = this._walkRight = false;
	}
})

function createBasicCharacter(x,y){
	return Crafty.e("b2dObject, b2dSimpleGraphics, b2dCollision, CharacterMovement, CharacterJump, Color, Canvas")
		.attr({x:x,y:y,w:32,h:84})
		.color("#0af")
		.floorFlag("FLOOR")
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			fixedRotation:true,
			objects:[{
				type:"box",
				density:2,
				friction:0,
				w:32,
				h:64
			},{
				type:"circle",
				density:1,
				friction:1,
				radius:32,
				offY:34
			},{
				type:"box",
				w:16,
				h:8,
				offX:8,
				offY:42,
				isSensor:true,
				userData:"feet"
			}]
		})
}

function createPlayableCharacter(x,y){
	return createBasicCharacter(x,y)
		.addComponent("Keyboard")
		.bind("KeyDown",function(e){
			if(e.keyCode == 65)
				this.walkLeft();
			if(e.keyCode == 68)
				this.walkRight();
			if(e.keyCode == 87)
				this.jump();
		})
		.bind("KeyUp",function(e){
			if(e.keyCode == 65 || e.keyCode == 68)
				this.walkStop();
		})
		.bind("EnterFrame",function(){
				msg(this._onFloor);
		})
}

function createNpcCharacter(x,y){
	return createBasicCharacter(x,y)
		.attr({"_walkDir":0})
		.attr({"_walkAction":"walk"})
		.attr({"_lastFrame":0})
		.attr({"_skipFrame":100})
		.bind("EnterFrame",function(e){
			if(e.frame - this._skipFrame > this._lastFrame){
				this._lastFrame = e.frame;
				this._walkDir = Math.random()*100>50?-1:1;
				this._walkAction = Math.random()*100>50?"walk":"stop";
			}
			if(this._walkAction ==  "stop"){
				this.walkStop();
				return;
			}
			if(this.x >= 700) this._walkDir = -1;
			if(this.x <= 40) this._walkDir = 1;
			if(this._walkDir == -1) this.walkLeft();
			if(this._walkDir == 1) this.walkRight();
			
		})
}

Crafty.scene("DemoLevel",function(){
	Crafty.DRAW_SCALE = 64;
	Crafty.debugging = true;
	
	//Box2D world
	w = Crafty.e("b2dWorld");
	
	//Tile graphics:
	Crafty.sprite(64,"img/land.png",{spr_earth:[0,0]});
	Crafty.sprite(64,"img/rock.png",{spr_rock:[0,0]});
	
	Crafty.sprite(64,"img/tileset1.png",{simple:[0,0],top:[1,0],top_right:[2,0],top_left:[3,0],top_left_right:[4,0],
										right:[5,0],left:[6,0],left_right:[7,0],top_corner_right:[8,0],top_corner_left:[9,0],
										top_corner_left_right:[10,0]});
	
	//Background:
	Crafty.e("2D, Canvas, Image")
		.attr({w:800,h:600})
		.image("img/bg1.png")
	
	Crafty.e("TilesHolder").createMapFromXML("data/map.xml");

	//createPlayableCharacter(200,200);
	//createNpcCharacter(760,200);
	
	var body = Crafty.e("b2dObject, b2dDraggable")
		.attr({x:400,y:400})
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			fixedRotation:true,
			objects:[{
				type:"box",
				w:32,
				h:64,
				densisty:1,
				friction:0.5
			}]
		});
	var feet = Crafty.e("b2dObject, b2dDraggable")
		.attr({x:408,y:400})
		.b2d({
			body_type:b2Body.b2_dynamicBody,
			objects:[{
				type:"box",
				w:16,
				h:16,
				density:1,
				friction:0,
				restitution:0
			}]
		});
	Crafty.e("b2dJoint, Keyboard")
		.b2djoint({
			type:"prismatic",
			bodyA:feet.body(),
			bodyB:body.body(),
			worldAxis:new b2Vec2(0,-1),
			upperTranslation:1,
			lowerTranslation:-1,
			enableLimit:true,
			maxMotorForce:150,
			motorSpeed:0,
			enableMotor:false/*,
			localAnchorB:new b2Vec2(0.125,0)*/
		})
		.bind("EnterFrame",function(e){
			if(this.joint.m_motorSpeed > 0) this.joint.SetMotorSpeed(0);
		})
		.bind("KeyDown",function(e){
			if(e.keyCode == 87){
				this.joint.EnableMotor(true);
				this.joint.SetMotorSpeed(150);
			}
		})
		.bind("KeyUp",function(e){
			if(e.keyCode == 87)
				this.joint.EnableMotor(false);
		})
});

$(document).ready(function(){
	//Initialize crafty
	Crafty.init(800,600);
	Crafty.canvas.init();
	
	//Debug canvas
	$('#canvas')[0].width = 800;
	$('#canvas')[0].height = 600;

	//First Scene
	Crafty.scene("DemoLevel");
	
	Crafty("2D").each(function(){
		this.alpha = 1;
	});
	
});

function switchDebug(){
	Crafty.debugging = !Crafty.debugging;
	$("#"+Crafty.debug_ctx)[0].getContext("2d").clearRect(0,0,800,600);
}
