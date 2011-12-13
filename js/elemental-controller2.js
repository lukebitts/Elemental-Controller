Crafty.c("VoxelTile",{
	_north:null,
	_south:null,
	_east:null,
	_west:null,
	triggerNeighbours:function(evt,arg){
		if(this._north) this._north.trigger(evt,arg);
		if(this._south) this._south.trigger(evt,arg);
		if(this._east) this._east.trigger(evt,arg);
		if(this._west) this._west.trigger(evt,arg);
	},
	hasNeighbour:function(){
		if(!this._north && !this._south && !this._east && !this._west )
			return false;
		return true;
	},
	getNeighbours:function(){
		var ret = [];
		if(this._north) ret.push(this._north);
		if(this._south) ret.push(this._south);
		if(this._east) ret.push(this._east);
		if(this._west) ret.push(this._west);
	},
	removeNeighbours:function(){
		if(this._north){
			this._north._south = null;
			this._north = null;
		};
		if(this._south){
			this._south._north = null;
			this._south = null;
		}
		if(this._east){
			this._east._west = null;
			this._east = null;
		}
		if(this._west){
			this._west._east = null;
			this._west = null;
		}
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
	return Crafty.e("TILE, FLOOR")
		.addComponent("b2dObject, b2dSimpleGraphics, b2dCollision, b2dMouse, VoxelTile, ChangeBodyType, Canvas")
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
		})
		.bind("MouseDown",function(e){
			if(e.b2dType!="inside") return;
			this.changeToDynamic();
			this.removeNeighbours();
			this.unbind("MouseDown");
			this.addComponent("b2dDraggable");
		})
		.bind("ChangeToDynamic",function(){
			this.removeComponent(elementSprite[element][0]);
			this.addComponent(elementSprite[element][1]);
			this._world.DestroyBody(this._body);
			this.b2d({
				body_type:b2Body.b2_dynamicBody,
				bullet:true,
				objects:[{
					type:"circle",
					friction:1,
					density:1,
					radius:62
				}]
			});
			this.body().SetAngularDamping(10);
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
		
			if(this._mapData[i].usable == "usable")
				this._mapTiles[i] = createUsableTile(parseInt(pos[0])*64,parseInt(pos[1])*64,this._mapData[i].element)
			else
				this._mapTiles[i] = createUnusableTile(parseInt(pos[0])*64,parseInt(pos[1])*64,this._mapData[i].element);
		}
		for(i in this._mapTiles){
			var pos = i.split("_");
			pos[0] = parseInt(pos[0]); pos[1] = parseInt(pos[1]);
			this._mapTiles[i]._north = this._mapTiles[pos[0]+"_"+(pos[1]-1)];
			this._mapTiles[i]._south = this._mapTiles[pos[0]+"_"+(pos[1]+1)];
			this._mapTiles[i]._east = this._mapTiles[(pos[0]+1)+"_"+pos[1]];
			this._mapTiles[i]._west = this._mapTiles[(pos[0]-1)+"_"+pos[1]];
		}
	},
	createMapFromXML:function(xmlpath){
		var xml = Crafty.e("XML").xml(xmlpath);
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

Crafty.scene("DemoLevel",function(){
	Crafty.DRAW_SCALE = 64;
	Crafty.debugging = false;
	
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
	})
});