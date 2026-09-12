const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/browserAll-CHTWmg3M.js","assets/Geometry-BoYANIBs.js","assets/Filter-A25okuyj.js","assets/getPo2TextureFromSource-C_XaZpnR.js","assets/canvasUtils-Bhi55MMK.js","assets/Cache-BLawoiD-.js","assets/init-DD_7MfUr.js","assets/CanvasPool-CGtEqevz.js","assets/webworkerAll-YTsHEnKb.js","assets/WebGPURenderer-CSj3opk1.js","assets/WebGPURenderer-CLc4ICqX.js","assets/RenderTargetSystem-BnPlVPtZ.js","assets/GCManagedHash-BKyJT0WI.js","assets/getTextureBatchBindGroup-DnSg18Eo.js","assets/BufferResource-CJgT71b2.js","assets/WebGLRenderer-CoEbKz1J.js","assets/WebGLRenderer-CZ5odcYc.js","assets/CanvasRenderer-07ii8MqV.js","assets/CanvasRenderer-BDhN9YiA.js","assets/GraphicsContext-D11ypeve.js","assets/BitmapFont-BMa3j29k.js","assets/BitmapFont-C_QyZzh5.js"])))=>i.map(i=>d[i]);
import{A as e,B as t,E as n,F as r,N as i,O as a,S as o,T as s,V as c,b as l,c as u,d,g as f,i as p,k as m,l as h,m as g,n as _,r as v,t as y,u as ee,x as te,y as b}from"./Geometry-BoYANIBs.js";import{S as x,a as ne,c as S,f as re,i as ie,l as C,m as ae,r as oe,s as se,u as ce,x as le}from"./Filter-A25okuyj.js";import{a as w,c as ue,i as de,n as fe,o as pe,r as me,s as he,t as ge}from"./getPo2TextureFromSource-C_XaZpnR.js";import{r as _e,t as ve}from"./canvasUtils-Bhi55MMK.js";import{n as ye,t as T}from"./Cache-BLawoiD-.js";import{d as be,f as xe,p as Se,u as Ce}from"./RenderTargetSystem-BnPlVPtZ.js";import{t as we}from"./GraphicsContext-D11ypeve.js";import{g as Te,p as Ee,t as De}from"./GCManagedHash-BKyJT0WI.js";import{t as Oe}from"./CanvasPool-CGtEqevz.js";import{n as ke}from"./CanvasRenderer-BDhN9YiA.js";import{a as E,i as Ae,n as je,r as Me}from"./BitmapFont-C_QyZzh5.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var Ne=class e{static toRadians(e){return Math.PI/180*e}static toDegrees(e){return 180/Math.PI*e}static fromVector(e){return Math.atan2(e.y,e.x)}static normalize(e){let t=Math.PI*2;return(e%t+t)%t}static normalizeSigned(t){let n=e.normalize(t);return n>Math.PI?n-Math.PI*2:n}static normalizeDegrees(e){return(e%360+360)%360}static normalizeSignedDegrees(t){let n=e.normalizeDegrees(t);return n>180?n-360:n}static difference(t,n){return e.normalizeSigned(n-t)}static lerp(t,n,r){let i=e.difference(t,n);return e.normalize(t+i*r)}},D=class{static epsilon=.001;static clamp(e,t,n){return Math.max(t,Math.min(n,e))}static lerp(e,t,n){return e+(t-e)*n}static nearlyEqual(e,t,n=1e-5){return Math.abs(e-t)<=n}},Pe=class e{x;y;constructor(e,t){this.x=e,this.y=t}magnitude(){return Math.hypot(this.x,this.y)}equals(e){return this.x===e.x&&this.y===e.y}add(t){return new e(this.x+t.x,this.y+t.y)}subtract(t){return new e(this.x-t.x,this.y-t.y)}multiplyByScalar(t){return new e(this.x*t,this.y*t)}divideByScalar(t){return new e(this.x/t,this.y/t)}distanceTo(e){return Math.hypot(e.x-this.x,e.y-this.y)}unitVectorTo(e){if(this.equals(e))throw Error(`Cannot calculate unit vector for two of the same points`);return e.subtract(this).divideByScalar(this.distanceTo(e))}},Fe=class{id;startNode;endNode;road;lateralOffset;constructor(e,t,n,r,i=0){if(t.equals(n))throw Error(`Lane can not start and end on the same node`);this.id=e,this.startNode=t,this.endNode=n,this.road=r,this.lateralOffset=i}getId(){return this.id}getStartNode(){return this.startNode}getEndNode(){return this.endNode}getRoad(){return this.road}getStartPosition(){return this.getOffsetPosition(this.startNode.getPosition())}getEndPosition(){return this.getOffsetPosition(this.endNode.getPosition())}getLateralOffset(){return this.lateralOffset}getLength(){return this.startNode.getPosition().distanceTo(this.endNode.getPosition())}getRotation(){let e=this.getEndPosition().subtract(this.getStartPosition());return Ne.fromVector(e)}getPosition(e){let t=this.getLength(),n=D.clamp(0,e,t),r=this.getStartPosition(),i=this.getEndPosition(),a=r.unitVectorTo(i);return r.add(a.multiplyByScalar(n))}getOffsetPosition(e){if(this.lateralOffset===0)return e;let t=this.startNode.getPosition(),n=this.endNode.getPosition(),r=n.x-t.x,i=n.y-t.y,a=Math.sqrt(r*r+i*i);if(a===0)return e;let o=-i/a,s=r/a;return new Pe(e.x+o*this.lateralOffset,e.y+s*this.lateralOffset)}},Ie=class{id;nodeA;nodeB;forwardLanes=[];backwardLanes=[];getId(){return this.id}getNodeA(){return this.nodeA}getNodeB(){return this.nodeB}getForwardLanes(){return this.forwardLanes}getBackwardLanes(){return this.backwardLanes}constructor(e,t,n){this.id=e,this.nodeA=t,this.nodeB=n}addForwardLane(e){this.forwardLanes.push(e)}addBackwardLane(e){this.backwardLanes.push(e)}},Le=class{id;position;type;roads=[];getId(){return this.id}getPosition(){return this.position}getType(){return this.type}getRoads(){return this.roads}constructor(e,t,n){this.id=e,this.position=t,this.type=n}equals(e){return this.getPosition().equals(e.getPosition())}addRoad(e){this.roads.push(e)}getIncomingLanes(){return this.roads.flatMap(e=>[e.getForwardLanes(),e.getBackwardLanes()]).flat().filter(e=>e.getEndNode()===this)}getOutgoingLanes(){return this.roads.flatMap(e=>[e.getForwardLanes(),e.getBackwardLanes()]).flat().filter(e=>e.getStartNode()===this)}},O={Corner:`Corner`,TJunction:`TJunction`,FourWayIntersection:`FourWayIntersection`},Re=class{nodes;lanes;roads;constructor(e,t,n){this.nodes=e,this.roads=t,this.lanes=n}getNodes(){return this.nodes}getLanes(){return this.lanes}getRoads(){return this.roads}getNode(e){return this.nodes.find(t=>t.getId()===e)}getLane(e){return this.lanes.find(t=>t.getId()===e)}getRoad(e){return this.roads.find(t=>t.getId()===e)}},ze=class{config;constructor(e){this.config=e}generate(){let e=this.createNodes(),t=[],n=[];return this.createHorizontalRoads(e,t,n),this.createVerticalRoads(e,t,n),new Re(e,t,n)}createNodes(){let e=[],t=0;for(let n=0;n<this.config.rows;n++)for(let r=0;r<this.config.columns;r++){let i=new Pe(r*this.config.blockSize,n*this.config.blockSize),a=this.getNodeType(n,r);e.push(new Le(t++,i,a))}return e}getNodeType(e,t){let n=e===0,r=e===this.config.rows-1,i=t===0,a=t===this.config.columns-1;return(n||r)&&(i||a)?O.Corner:n||r||i||a?O.TJunction:O.FourWayIntersection}createHorizontalRoads(e,t,n){for(let r=0;r<this.config.rows;r++)for(let i=0;i<this.config.columns-1;i++){let a=this.getNode(e,r,i),o=this.getNode(e,r,i+1),s=this.createRoad(a,o,t.length,n);t.push(s)}}createVerticalRoads(e,t,n){for(let r=0;r<this.config.rows-1;r++)for(let i=0;i<this.config.columns;i++){let a=this.getNode(e,r,i),o=this.getNode(e,r+1,i),s=this.createRoad(a,o,t.length,n);t.push(s)}}createRoad(e,t,n,r){let i=new Ie(n,e,t),a=this.config.laneWidth/2,o=new Fe(r.length,e,t,i,a);i.addForwardLane(o),r.push(o);let s=new Fe(r.length,t,e,i,a);return i.addBackwardLane(s),r.push(s),e.addRoad(i),t.addRoad(i),i}getNode(e,t,n){return e[t*this.config.columns+n]}},Be=class{incomingLane;outgoingLane;constructor(e,t){if(e.getEndNode()!==t.getStartNode())throw Error(`Incoming and outgoing lanes must be a part of the same road node.`);this.incomingLane=e,this.outgoingLane=t}getIncomingLane(){return this.incomingLane}getOutgoingLane(){return this.outgoingLane}getNode(){return this.incomingLane.getEndNode()}isEquivalentTo(e){return this.incomingLane===e.incomingLane&&this.outgoingLane===e.outgoingLane}},Ve=class{lane;distance;constructor(e,t){if(t<0||t>e.getLength())throw Error(`PathLocation distance must be within the lane.`);this.lane=e,this.distance=t}getLane(){return this.lane}getDistance(){return this.distance}getFullLaneLength(){return this.lane.getLength()}getPoint(){return this.lane.getPosition(this.distance)}},He=class{startLocation;endLocation;lanes;movements;laneStartDistances;movementDistances;lanePathLengths;totalLength;constructor(e,t,n,r){if(n.length===0)throw Error(`Path must contain at least one lane.`);if(r.length!==n.length-1)throw Error(`A path must contain exactly one movement between each pair of lanes.`);if(n[0]!==e.getLane())throw Error(`Path start location must belong to the first lane.`);if(n[n.length-1]!==t.getLane())throw Error(`Path end location must belong to the last lane.`);this.startLocation=e,this.endLocation=t,this.lanes=n,this.movements=r;let i=Array(n.length),a=Array(n.length),o=Array(r.length),s=0;for(let c=0;c<n.length;c++){let l=n[c];i[c]=s;let u;u=c===0?l.getLength()-e.getDistance():c===n.length-1?t.getDistance():l.getLength(),u=Math.max(0,u),a[c]=u,c<r.length&&(o[c]=s+u),s+=u}this.laneStartDistances=i,this.lanePathLengths=a,this.movementDistances=o,this.totalLength=Math.max(0,s)}getStartLocation(){return this.startLocation}getEndLocation(){return this.endLocation}getStartLane(){return this.startLocation.getLane()}getEndLane(){return this.endLocation.getLane()}getLanes(){return this.lanes}getMovements(){return this.movements}getTotalLength(){return this.totalLength}getPathLocationAtDistance(e){let t=D.clamp(e,0,this.totalLength),n=this.getLaneIndexAtDistance(t),r=this.laneStartDistances[n],i=this.lanes.length===1&&n===0?this.startLocation.getDistance()+t:n===0?this.startLocation.getDistance()+(t-r):t-r;return new Ve(this.lanes[n],Math.min(i,this.lanes[n].getLength()))}getLaneIndexAtDistance(e){if(this.lanes.length===1)return 0;let t=D.clamp(e,0,this.totalLength),n=0,r=this.lanes.length-1;for(;n<r;){let e=Math.floor((n+r+1)/2);this.laneStartDistances[e]<=t?n=e:r=e-1}return n>0&&Math.abs(t-this.laneStartDistances[n])<=D.epsilon?n-1:n}getPathDistanceAtLaneDistance(e,t){let n=this.lanes.indexOf(e);if(n===-1||t<-D.epsilon||t>e.getLength()+D.epsilon)return null;if(n===0){let e=t-this.startLocation.getDistance();return e<-D.epsilon||e>this.lanePathLengths[0]+D.epsilon?null:Math.max(0,e)}let r=this.laneStartDistances[n]+t;return t>this.lanePathLengths[n]+D.epsilon?null:r}getPositionAtDistance(e){return this.getPathLocationAtDistance(e).getPoint()}getNextMovement(e){let t=this.getLaneIndexAtDistance(e);return t>=this.movements.length?null:this.movements[t]}getMovementDistance(e){let t=this.movements.indexOf(e);return t===-1?null:this.movementDistances[t]}getMovementDistanceAtIndex(e){return e<0||e>=this.movementDistances.length?null:this.movementDistances[e]}getDistanceToMovement(e,t){let n=this.getMovementDistance(t);return n===null?null:n-e}},Ue=class{movementsByIncomingLane=new Map;constructor(e){this.indexMovements(e)}findPath(e,t){let n=this.search(e.getLane(),t.getLane());return n===null?null:this.createPath(e,t,n)}search(e,t){let n=[{lane:e,previous:null,movement:null}],r=new Set;r.add(e);let i=0;for(;i<n.length;){let e=n[i++];if(e.lane===t)return e;let a=this.movementsByIncomingLane.get(e.lane)??[];for(let t of a){let i=t.getOutgoingLane();r.has(i)||(r.add(i),n.push({lane:i,previous:e,movement:t}))}}return null}createPath(e,t,n){let r=[],i=[],a=n;for(;a!==null;)r.push(a.lane),a.movement!==null&&i.push(a.movement),a=a.previous;return r.reverse(),i.reverse(),new He(e,t,r,i)}indexMovements(e){for(let t of e){let e=t.getIncomingLane(),n=this.movementsByIncomingLane.get(e)??[];this.movementsByIncomingLane.set(e,[...n,t])}}},We=class{generate(e){let t=e.getIncomingLanes(),n=e.getOutgoingLanes(),r=[];for(let i of t)for(let t of n)i!==t&&(e.getType()===`Corner`&&i.getRoad()===t.getRoad()||r.push(new Be(i,t)));return r}},k=class{name;duration;allowedMovements;constructor(e,t,n){if(t<=0)throw Error(`Traffic light phase duration must be greater than zero.`);this.name=e,this.duration=t,this.allowedMovements=[...n]}getName(){return this.name}getDuration(){return this.duration}getAllowedMovements(){return this.allowedMovements}allowsMovement(e){return this.allowedMovements.some(t=>t.isEquivalentTo(e))}},Ge=class{phases;currentPhaseIndex=0;elapsedTime=0;constructor(e,t=0){if(e.length===0)throw Error(`Traffic light controller must contain at least one phase.`);for(let t of e)if(t.getDuration()<=0)throw Error(`Traffic light phase duration must be greater than zero.`);this.phases=[...e],this.setInitialTime(t)}update(e){if(!(e<=0))for(this.elapsedTime+=e;this.elapsedTime>=this.getCurrentPhase().getDuration();)this.elapsedTime-=this.getCurrentPhase().getDuration(),this.currentPhaseIndex=(this.currentPhaseIndex+1)%this.phases.length}getCurrentPhase(){return this.phases[this.currentPhaseIndex]}getRemainingTime(){return Math.max(0,this.getCurrentPhase().getDuration()-this.elapsedTime)}allowsMovement(e){return this.getCurrentPhase().allowsMovement(e)}setInitialTime(e){if(e<=0){this.elapsedTime=0;return}let t=e;for(;t>0;){let e=this.getCurrentPhase().getDuration();if(t<e){this.elapsedTime=t;return}t-=e,this.currentPhaseIndex=(this.currentPhaseIndex+1)%this.phases.length}this.elapsedTime=0}},Ke=class{config;constructor(e){this.config=e}createForNode(e,t){switch(e.getType()){case O.FourWayIntersection:return this.createFourWayPhases(t);case O.TJunction:return this.createTJunctionPhases(e,t);case O.Corner:return[];default:throw Error(`Unsupported node type: ${e.getType()}`)}}createFourWayPhases(e){let t=e.filter(e=>this.isVerticalIncomingLane(e.getIncomingLane())),n=e.filter(e=>this.isHorizontalIncomingLane(e.getIncomingLane()));return[new k(`Vertical Green`,this.config.greenDuration,t),new k(`Vertical Yellow`,this.config.yellowDuration,t),new k(`All Red`,this.config.allRedDuration,[]),new k(`Horizontal Green`,this.config.greenDuration,n),new k(`Horizontal Yellow`,this.config.yellowDuration,n),new k(`All Red`,this.config.allRedDuration,[])]}createTJunctionPhases(e,t){let n=this.getIncomingLanes(t);if(n.length!==3)throw Error(`T-junction ${e.getId()} expected 3 incoming lanes, but found ${n.length}.`);let r=this.findTJunctionStem(e,n),i=t.filter(e=>e.getIncomingLane()===r),a=t.filter(e=>e.getIncomingLane()!==r);return[new k(`T-Junction Stem Green`,this.config.greenDuration,i),new k(`T-Junction Stem Yellow`,this.config.yellowDuration,i),new k(`All Red`,this.config.allRedDuration,[]),new k(`T-Junction Side Green`,this.config.greenDuration,a),new k(`T-Junction Side Yellow`,this.config.yellowDuration,a),new k(`All Red`,this.config.allRedDuration,[])]}getIncomingLanes(e){return[...new Set(e.map(e=>e.getIncomingLane()))]}isVerticalIncomingLane(e){let t=e.getStartPosition(),n=e.getEndPosition(),r=n.x-t.x,i=n.y-t.y;return Math.abs(i)>Math.abs(r)}isHorizontalIncomingLane(e){let t=e.getStartPosition(),n=e.getEndPosition(),r=n.x-t.x,i=n.y-t.y;return Math.abs(r)>Math.abs(i)}findTJunctionStem(e,t){let n=t[0],r=this.getAxis(n),i=t.filter(e=>this.getAxis(e)===r);if(i.length===1)return i[0];let a=t.filter(e=>this.getAxis(e)!==r);if(a.length===1)return a[0];throw Error(`Could not determine T-junction stem for node ${e.getId()}.`)}getAxis(e){return this.isVerticalIncomingLane(e)?`vertical`:`horizontal`}},qe=class{controllers=new Map;add(e,t){this.controllers.set(e.getId(),t)}update(e){if(!(e<=0))for(let t of this.controllers.values())t.update(e)}getController(e){return this.controllers.get(e)}allowsMovement(e){let t=e.getNode().getId(),n=this.getController(t);return!n||n.allowsMovement(e)}},Je=class e{static MAX_ATTEMPTS=100;lanes;random;constructor(e,t){this.lanes=e,this.random=t}generate(t){if(this.lanes.length===0)throw Error(`Cannot generate a destination without lanes.`);for(let n=0;n<e.MAX_ATTEMPTS;n++){let e=this.getRandomLane(),n=this.getRandomDistance(e);if(t===void 0||!this.isSameLocation(t,e,n))return new Ve(e,n)}throw Error(`Failed to generate a valid destination.`)}getRandomLane(){let e=this.random.nextInt(0,this.lanes.length-1);return this.lanes[e]}getRandomDistance(e){return this.random.next()*e.getLength()}isSameLocation(e,t,n){return e.getLane()===t&&Math.abs(e.getDistance()-n)<D.epsilon}},Ye=class{path;acceleration;braking;maxSpeed;stoppingDistance;followingDistance;minimumGap;length;width;steeringSpeed=8;steeringSampleDistance=2;trafficLightSystem;vehicleDetector;pathfinder;destinationGenerator;currentSpeed=0;travelledDistance=0;currentAngle=0;angleInitialized=!1;stoppedForMovement=null;clearingMovement=null;currentLaneIndex=0;targetAngle=0;constructor(e,t,n,r,i,a){this.path=e,this.acceleration=t.acceleration,this.braking=t.braking,this.maxSpeed=t.maxSpeed,this.stoppingDistance=t.stoppingDistance,this.followingDistance=t.followDistance,this.minimumGap=t.minimumGap,this.length=t.length,this.width=t.width,this.trafficLightSystem=n,this.vehicleDetector=r,this.pathfinder=i,this.destinationGenerator=a,this.targetAngle=this.getPathAngle(),this.currentAngle=this.targetAngle,this.angleInitialized=!0}getState(){return{position:this.getPosition(),angle:this.getAngle()}}getPath(){return this.path}getCurrentSpeed(){return this.currentSpeed}getMaxSpeed(){return this.maxSpeed}getLength(){return this.length}getWidth(){return this.width}getTravelledDistance(){return this.travelledDistance}update(e){if(e<=0)return;let t=e/1e3;for(this.updateCurrentLane(),this.updateAngle(e);t>D.epsilon;){if(this.stoppedForMovement!==null){if(!this.trafficLightSystem.allowsMovement(this.stoppedForMovement)){this.currentSpeed=0;return}this.stoppedForMovement=null}this.updateCurrentLane(),this.updateClearingMovement();let n=this.clearingMovement===null?this.vehicleDetector.findVehicleAhead(this):null,r=this.path.getNextMovement(this.travelledDistance),i=this.getTargetSpeed(r,n),a=this.currentSpeed;this.currentSpeed=this.moveTowardsSpeed(a,i,t);let o=this.getRedLightStopDistance(r),s=Math.max(0,this.path.getTotalLength()-this.travelledDistance),c=(a+this.currentSpeed)/2*t;if(o!==null&&(c=Math.min(c,Math.max(0,o))),n!==null&&(c=Math.min(c,Math.max(0,n.gap-this.minimumGap))),c=Math.min(c,s),c<=D.epsilon){this.currentSpeed=0,this.tryStopAtRedLight(r);return}if(this.travelledDistance+=c,this.updateCurrentLane(),this.updateAngle(e),o!==null&&o-c<=D.epsilon&&(this.tryStopAtRedLight(r),this.stoppedForMovement!==null))return;if(this.travelledDistance>=this.path.getTotalLength()-D.epsilon){this.travelledDistance=this.path.getTotalLength(),this.changeDestination(),t=0;continue}this.updateClearingMovement();return}}getProgress(){let e=this.path.getTotalLength();return e<=0?1:this.travelledDistance/e}getPosition(){return this.path.getPositionAtDistance(this.travelledDistance)}getAngle(){return this.currentAngle}updateCurrentLane(){let e=this.path.getLaneIndexAtDistance(this.travelledDistance);e!==this.currentLaneIndex&&(this.currentLaneIndex=e,this.targetAngle=this.getPathAngle())}updateClearingMovement(){if(this.clearingMovement!==null){let e=this.path.getNextMovement(this.travelledDistance);(e===null||!this.clearingMovement.isEquivalentTo(e))&&(this.clearingMovement=null);return}let e=this.path.getNextMovement(this.travelledDistance);if(e===null)return;let t=this.path.getMovementDistance(e);if(t===null)return;let n=t-this.stoppingDistance;this.travelledDistance>=n-D.epsilon&&(this.clearingMovement=e)}updateAngle(e){if(!this.angleInitialized){this.currentAngle=this.targetAngle,this.angleInitialized=!0;return}let t=e/1e3,n=this.normalizeAngle(this.targetAngle-this.currentAngle),r=this.steeringSpeed*t;if(Math.abs(n)<=r){this.currentAngle=this.targetAngle;return}this.currentAngle=this.normalizeAngle(this.currentAngle+Math.sign(n)*r)}getPathAngle(){let e=this.path.getTotalLength();if(e<=0)return 0;let t=this.path.getLanes();if(this.currentLaneIndex>=0&&this.currentLaneIndex<t.length){let e=t[this.currentLaneIndex],n=e.getStartPosition(),r=e.getEndPosition(),i=r.x-n.x,a=r.y-n.y;if(Math.abs(i)>D.epsilon||Math.abs(a)>D.epsilon)return Math.atan2(a,i)}let n=D.clamp(this.travelledDistance,0,e),r=Math.min(this.steeringSampleDistance,e),i=Math.min(e,n+r),a=this.path.getPositionAtDistance(n),o=this.path.getPositionAtDistance(i),s=o.x-a.x,c=o.y-a.y;if(s*s+c*c>D.epsilon*D.epsilon)return Math.atan2(c,s);let l=Math.max(0,n-r),u=this.path.getPositionAtDistance(l),d=a.x-u.x,f=a.y-u.y;return d*d+f*f>D.epsilon*D.epsilon?Math.atan2(f,d):this.currentAngle}normalizeAngle(e){for(;e>Math.PI;)e-=Math.PI*2;for(;e<-Math.PI;)e+=Math.PI*2;return e}getTargetSpeed(e,t){if(this.stoppedForMovement!==null)return 0;let n=this.getTrafficLightTargetSpeed(e);return t!==null&&this.clearingMovement===null&&(n=Math.min(n,this.getFollowingTargetSpeed(t.gap,t.vehicle.getCurrentSpeed()))),D.clamp(n,0,this.maxSpeed)}getTrafficLightTargetSpeed(e){if(this.clearingMovement!==null||e===null||this.trafficLightSystem.allowsMovement(e))return this.maxSpeed;let t=this.path.getDistanceToMovement(this.travelledDistance,e);if(t===null)return this.maxSpeed;let n=t-this.stoppingDistance;if(n<=D.epsilon)return 0;if(this.braking<=D.epsilon)return this.maxSpeed;let r=Math.sqrt(2*this.braking*n);return Math.min(this.maxSpeed,Math.max(0,r))}getRedLightStopDistance(e){if(this.stoppedForMovement!==null)return 0;if(this.clearingMovement!==null||e===null||this.trafficLightSystem.allowsMovement(e))return null;let t=this.path.getDistanceToMovement(this.travelledDistance,e);return t===null?null:Math.max(0,t-this.stoppingDistance)}tryStopAtRedLight(e){if(this.clearingMovement!==null||e===null||this.trafficLightSystem.allowsMovement(e))return;let t=this.path.getDistanceToMovement(this.travelledDistance,e);if(t===null||t-this.stoppingDistance>D.epsilon)return;let n=this.path.getMovementDistance(e);n!==null&&(this.travelledDistance=Math.max(0,n-this.stoppingDistance)),this.currentSpeed=0,this.stoppedForMovement=e}getFollowingTargetSpeed(e,t){if(e<=this.minimumGap+D.epsilon)return 0;if(e>this.followingDistance)return this.maxSpeed;let n=e-this.followingDistance,r=t*t+2*this.braking*Math.max(0,n),i=Math.sqrt(Math.max(0,r));return Math.min(this.maxSpeed,Math.max(t,i))}moveTowardsSpeed(e,t,n){return n<=0?e:t>e?Math.min(t,e+this.acceleration*n):t<e?Math.max(t,e-this.braking*n):e}changeDestination(){let e=this.path.getEndLocation(),t=this.findNewPath(e);this.path=t,this.travelledDistance=0,this.currentSpeed=0,this.stoppedForMovement=null,this.clearingMovement=null,this.currentLaneIndex=0,this.targetAngle=this.getPathAngle(),this.currentAngle=this.targetAngle,this.angleInitialized=!0}findNewPath(e){for(let t=0;t<100;t++){let t=this.destinationGenerator.generate(e),n=this.pathfinder.findPath(e,t);if(n!==null)return n}throw Error(`Failed to find a new path after reaching vehicle destination.`)}},Xe=class{vehicles=[];vehiclesByLane=new Map;maximumLookAheadDistance=100;addVehicles(e){this.vehicles=e}rebuild(){this.vehiclesByLane.clear();for(let e=0;e<this.vehicles.length;e++){let t=this.vehicles[e],n=t.getPath(),r=t.getTravelledDistance(),i=n.getPathLocationAtDistance(r),a=i.getLane(),o=this.vehiclesByLane.get(a);o||(o=[],this.vehiclesByLane.set(a,o)),o.push({vehicle:t,laneDistance:i.getDistance()})}for(let e of this.vehiclesByLane.values())e.sort((e,t)=>e.laneDistance-t.laneDistance)}findVehicleAhead(e){let t=e.getPath(),n=e.getTravelledDistance(),r=this.getRelevantLanes(t,n),i=null;for(let a=0;a<r.length;a++){let o=r[a],s=this.vehiclesByLane.get(o);if(!s||s.length===0)continue;let c=t.getPathLocationAtDistance(n),l=c.getLane(),u=c.getDistance();if(o===l){let t=this.findFirstAhead(s,u);for(let n=t;n<s.length;n++){let t=s[n];if(t.vehicle===e)continue;let r=t.laneDistance-u;if(r<=0)continue;let a=r-t.vehicle.getLength();if(a<=0||a>this.maximumLookAheadDistance)break;(i===null||a<i.gap)&&(i={vehicle:t.vehicle,gap:a});break}continue}for(let r=0;r<s.length;r++){let a=s[r];if(a.vehicle===e)continue;let c=t.getPathDistanceAtLaneDistance(o,a.laneDistance);if(c===null)continue;let l=c-n;if(l<=0)continue;if(l>this.maximumLookAheadDistance)break;let u=l-a.vehicle.getLength();if(!(u<=0)){(i===null||u<i.gap)&&(i={vehicle:a.vehicle,gap:u});break}}}return i}getRelevantLanes(e,t){let n=e.getLanes();if(n.length===0)return[];let r=e.getLaneIndexAtDistance(t);return n.slice(r,Math.min(n.length,r+2))}findFirstAhead(e,t){let n=0,r=e.length;for(;n<r;){let i=Math.floor((n+r)/2);e[i].laneDistance<=t?n=i+1:r=i}return n}},Ze=class{lanes;pathfinder;destinationGenerator;vehicleConfig;trafficLightSystem;vehicleDetector;random;constructor(e,t,n,r,i,a,o){this.lanes=e,this.pathfinder=t,this.destinationGenerator=n,this.vehicleConfig=r,this.trafficLightSystem=i,this.vehicleDetector=a,this.random=o}spawn(){let e=this.generateStartLocation(),t=this.destinationGenerator.generate(e),n=this.pathfinder.findPath(e,t);if(n===null)throw Error(`Failed to find a path for spawned vehicle.`);return new Ye(n,this.vehicleConfig,this.trafficLightSystem,this.vehicleDetector,this.pathfinder,this.destinationGenerator)}generateStartLocation(){if(this.lanes.length===0)throw Error(`Cannot spawn a vehicle without lanes.`);let e=this.random.pick(this.lanes);return new Ve(e,this.random.next()*e.getLength())}},Qe=class{state;constructor(e){if(!Number.isFinite(e))throw Error(`SeededRandom seed must be a finite number.`);this.state=Math.trunc(e)>>>0}next(){this.state=this.state+1831565813>>>0;let e=this.state;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),e^=e>>>14,(e>>>0)/4294967296}nextInt(e,t){if(!Number.isInteger(e)||!Number.isInteger(t))throw Error(`SeededRandom.nextInt() requires integer bounds.`);if(t<e)throw Error(`SeededRandom.nextInt() requires max >= min.`);return e===t?e:Math.floor(this.next()*(t-e+1))+e}nextBoolean(){return this.next()<.5}pick(e){if(e.length===0)throw Error(`SeededRandom.pick() cannot choose from an empty array.`);return e[this.nextInt(0,e.length-1)]}getState(){return this.state>>>0}setState(e){if(!Number.isInteger(e))throw Error(`SeededRandom state must be an integer.`);this.state=e>>>0}},$e=class{config;random;roadMap;movements;trafficLightSystem;pathfinder;destinationGenerator;vehicleSpawner;vehicleDetector;vehicles=[];constructor(e){this.config=e,this.random=new Qe(e.seed),this.roadMap=this.createRoadMap(),this.movements=this.createMovements(this.roadMap),this.trafficLightSystem=this.createTrafficLightSystem(this.roadMap),this.pathfinder=new Ue(this.getMovementsArray()),this.destinationGenerator=new Je(this.roadMap.getLanes(),this.random),this.vehicleDetector=new Xe,this.vehicleSpawner=new Ze(this.roadMap.getLanes(),this.pathfinder,this.destinationGenerator,this.config.vehicles,this.trafficLightSystem,this.vehicleDetector,this.random),this.spawnVehicles(this.config.vehicles.count),this.vehicleDetector.addVehicles(this.vehicles)}update(e){if(!(e<=0)){this.trafficLightSystem.update(e),this.vehicleDetector.rebuild();for(let t of this.vehicles)t.update(e)}}spawnVehicle(){let e=this.vehicleSpawner.spawn();this.vehicles.push(e)}spawnVehicles(e){for(let t=0;t<e;t++)this.spawnVehicle()}createRoadMap(){return new ze(this.config.grid).generate()}createMovements(e){let t=new Map,n=new We;for(let r of e.getNodes())t.set(r.getId(),n.generate(r));return t}createTrafficLightSystem(e){let t=new qe,n=new Ke(this.config.trafficLightsPhase);for(let r of e.getNodes()){let e=r.getId(),i=this.getMovements(e);if(!i)throw Error(`Could not find the movements for node with id ${e}`);let a=n.createForNode(r,i);if(a.length===0)continue;let o=this.config.trafficLightsPhase.greenDuration+this.config.trafficLightsPhase.yellowDuration+this.config.trafficLightsPhase.allRedDuration,s=new Ge(a,this.random.nextInt(0,o-1));t.add(r,s)}return t}getRoadMap(){return this.roadMap}getMovementsMap(){return this.movements}getMovementsArray(){let e=[];for(let t of this.movements.values())e.push(...t);return e}getMovements(e){return this.movements.get(e)}getVehicles(){return this.vehicles}getTrafficLightSystem(){return this.trafficLightSystem}getPathfinder(){return this.pathfinder}getVehicleStates(){return this.vehicles.map(e=>e.getState())}},et=class e{static VEHICLE_IMAGE_URL=new URL(`data:image/webp;base64,UklGRkwDAABXRUJQVlA4WAoAAAAQAAAAPwAAHAAAQUxQSGABAAANkGtr2zE99/PO9/22bduo7BOwKsVJmzq9kwqlqlS2bdt2xvPN944neE4gIiYA/2/HuhXX8S/V5NzIKAC2X79AJIQfl667pOaSmks6PlUM7AAoMlQFpOmXHlRaRWtZLvyHhSFocsGXXKCn9sE5AAQXuYAXu+589Be1ZiQBQYfGBkNCIaGSUIRQAUMN/JOIqpss/3ph/TMdmCwCU6WqfWH7ZpnUC8Zhi/sf1f7mhOySY00aK8weKwHvgtwcZnG5icwoJ5UZmiK45URyI5UbpOBmiuKmqdx+xDO7wu7lxzRe8tGrXF4f39zKj2F10XgzLY2Tth83XfWcbr+Cc9toMp/HOwGcW9vbFRMfE03/mTT+eHriIHzv7zrngisipaEmDIA0PrdbNCXcEMDi0Cwup9nlqFy9d19YSU2KCkB+PXuZQhHYYfxh/PTp+gMDAJ0AwGnVAwQ5/PQIbI9v/1QI0BEkVlA4IMYBAAAwCQCdASpAAB0APrVInkonJCKhs/ZoAOAWiWUAx+utyQbwt2mPgH9yJdQ3RJzf27iXhdoib+AMkOD4QZeX/TnLHGsGU/nOgtzMYbuJf0vJU9noAP5hFaNAW+l9P5Jkadbg8bQPES4bLwZ3asRK+k3Cu14qJI7fqHt7W7s67G56VP77k48zcVu32xOxgUBvwI8mRDl06vMIn+nWieqUXWjhvVp3KH1I0QfYL/LkupNnJxXpr9rHT7rt+oWXMYh8dlCqd/ItdhCqb/ZRmfpfC3qKWyXzju7E/m4/Xal+IEf2rX58m9VN0JOgSY+ipKqYWPXrURrdyfSQAB6oUjlU182HU/YcR7cQEuHIXq49PqWYXJfOcecJOyJu24FtiZqc5d9XTdczEa7LYtXezxV1JlM8yjlxcYdN1f1Q2jaMCoB+BrXuWkaZITcz4tatE9J55GlZnX/NCLKz+ty97//JykMhafmSOvgbcGwrxvG74qsSP29mXebpkang1DV8ayPxnzwM0jYrSAbQopyL7Y7sSLUcOfgCCk6sBon8NPZ/xIAhH+yHrfCTb3cU6+znyTxi6JPqdMZa+G2nQR5dUpiEgppyendrQAAA`,``+import.meta.url).href;container;padding;roadWidth;vehicleLength;vehicleWidth;scene;roadsLayer;lanesLayer;trafficLightsLayer;vehiclesLayer;trafficLightElements=new Map;vehicleElements=new Map;initialized=!1;renderedRoadMap=null;constructor(e){this.container=e.container,this.padding=e.padding,this.roadWidth=e.roadWidth,this.vehicleLength=e.vehicleLength,this.vehicleWidth=e.vehicleWidth}initialize(){this.initialized||=(this.scene=this.createElement(`scene`),this.roadsLayer=this.createLayer(`roads-layer`),this.lanesLayer=this.createLayer(`lanes-layer`),this.trafficLightsLayer=this.createLayer(`traffic-lights-layer`),this.vehiclesLayer=this.createLayer(`vehicles-layer`),this.scene.append(this.roadsLayer,this.lanesLayer,this.trafficLightsLayer,this.vehiclesLayer),this.container.replaceChildren(this.scene),!0)}render(e){this.initialized||this.initialize(),e.roadMap!==this.renderedRoadMap&&(this.renderMap(e.roadMap),this.createTrafficLights(e.trafficLights),this.renderedRoadMap=e.roadMap),this.updateTrafficLights(e.trafficLights),this.updateVehicles(e.vehicles)}destroy(){this.vehicleElements.clear(),this.trafficLightElements.clear(),this.container.replaceChildren(),this.initialized=!1,this.renderedRoadMap=null}offsetX(e){return e+this.padding}offsetY(e){return e+this.padding}renderMap(e){this.roadsLayer.replaceChildren(),this.lanesLayer.replaceChildren();for(let t of e.getRoads())this.renderRoad(t),this.renderLaneDivider(t)}renderRoad(e){let t=e.getNodeA().getPosition(),n=e.getNodeB().getPosition(),r=n.x-t.x,i=n.y-t.y,a=Math.sqrt(r*r+i*i);if(a===0)return;let o=Math.atan2(i,r),s=this.roadWidth/2,c=t.x-Math.cos(o)*s,l=t.y-Math.sin(o)*s,u=a+s*2,d=this.createElement(`road`);d.style.left=`${this.offsetX(c)}px`,d.style.top=`${this.offsetY(l)}px`,d.style.width=`${u}px`,d.style.height=`${this.roadWidth}px`,d.style.transform=`translateY(-50%) rotate(${o}rad)`,this.roadsLayer.appendChild(d)}renderLaneDivider(e){let t=e.getNodeA().getPosition(),n=e.getNodeB().getPosition(),r=n.x-t.x,i=n.y-t.y,a=Math.sqrt(r*r+i*i);if(a===0)return;let o=Math.atan2(i,r),s=this.createElement(`lane-divider`);s.style.left=`${this.offsetX(t.x)}px`,s.style.top=`${this.offsetY(t.y)}px`,s.style.width=`${a}px`,s.style.transform=`translateY(-50%) rotate(${o}rad)`,this.lanesLayer.appendChild(s)}createTrafficLights(e){this.trafficLightsLayer.replaceChildren(),this.trafficLightElements.clear();for(let t of e){let e=this.createTrafficLight(t);this.trafficLightElements.set(t.key,e)}}createTrafficLight(e){let t=this.createElement(`traffic-light`);t.style.left=`${this.offsetX(e.position.x)}px`,t.style.top=`${this.offsetY(e.position.y)}px`;let n=this.createElement(`traffic-light-lamp`);n.classList.add(`traffic-light-lamp-red`);let r=this.createElement(`traffic-light-lamp`);r.classList.add(`traffic-light-lamp-yellow`);let i=this.createElement(`traffic-light-lamp`);i.classList.add(`traffic-light-lamp-green`);let a=this.createElement(`traffic-light-timer`);return t.append(n,r,i,a),this.trafficLightsLayer.appendChild(t),{root:t,red:n,yellow:r,green:i,timer:a}}updateTrafficLights(e){for(let t of e){let e=this.trafficLightElements.get(t.key);e&&(e.red.classList.toggle(`is-active`,t.color===`red`),e.yellow.classList.toggle(`is-active`,t.color===`yellow`),e.green.classList.toggle(`is-active`,t.color===`green`),e.timer.textContent=`${(t.remainingTime/1e3).toFixed(1)}s`)}}updateVehicles(e){let t=new Set;e.forEach((e,n)=>{t.add(n);let r=this.vehicleElements.get(n);r||(r=this.createVehicle(),this.vehicleElements.set(n,r),this.vehiclesLayer.appendChild(r)),r.style.transform=`translate3d(${this.offsetX(e.position.x)}px, ${this.offsetY(e.position.y)}px, 0) translate(-50%, -50%) rotate(${e.angle}rad)`});for(let[e,n]of this.vehicleElements)t.has(e)||(n.remove(),this.vehicleElements.delete(e))}createVehicle(){let t=document.createElement(`img`);return t.className=`vehicle`,t.src=e.VEHICLE_IMAGE_URL,t.alt=``,t.draggable=!1,t.decoding=`async`,t.setAttribute(`aria-hidden`,`true`),t.style.width=`${this.vehicleLength}px`,t.style.height=`${this.vehicleWidth}px`,t}createLayer(e){let t=this.createElement(e);return t.style.position=`absolute`,t.style.inset=`0`,t}createElement(e){let t=document.createElement(`div`);return t.className=e,t}},tt=`modulepreload`,nt=function(e){return`/traffic-sim-dom-pixi/`+e},rt={},it=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?import.meta.resolve(e):new URL(e,import.meta.url).href}r=o(t.map(t=>{if(t=nt(t,n),t=s(t),t in rt)return;rt[t]=!0;let r=t.endsWith(`.css`);for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}let i=document.createElement(`link`);if(i.rel=r?`stylesheet`:tt,r||(i.as=`script`),i.crossOrigin=``,i.href=t,a&&i.setAttribute(`nonce`,a),document.head.appendChild(i),r)return new Promise((e,n)=>{i.addEventListener(`load`,e),i.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},at={extension:{type:t.Environment,name:`browser`,priority:-1},test:()=>!0,load:async()=>{await it(()=>import(`./browserAll-CHTWmg3M.js`),__vite__mapDeps([0,1,2,3,4,5,6,7]))}},ot={extension:{type:t.Environment,name:`webworker`,priority:0},test:()=>typeof self<`u`&&self.WorkerGlobalScope!==void 0,load:async()=>{await it(()=>import(`./webworkerAll-YTsHEnKb.js`),__vite__mapDeps([8,3,1,2,4,5,6,7]))}},st;function ct(e){return st===void 0&&(st=(()=>{let t={stencil:!0,failIfMajorPerformanceCaveat:e??Se.defaultOptions.failIfMajorPerformanceCaveat};try{if(!g.get().getWebGLRenderingContext())return!1;let e=g.get().createCanvas().getContext(`webgl`,t),n=!!e?.getContextAttributes()?.stencil;if(e){let t=e.getExtension(`WEBGL_lose_context`);t&&t.loseContext()}return e=null,n}catch{return!1}})()),st}var lt;async function ut(e={}){return lt===void 0&&(lt=await(async()=>{let t=g.get().getNavigator().gpu;if(!t)return!1;try{return await(await t.requestAdapter(e)).requestDevice(),!0}catch{return!1}})()),lt}var dt=[`webgl`,`webgpu`,`canvas`];async function ft(e){let t=[];e.preference?Array.isArray(e.preference)?t=e.preference.slice():(t.push(e.preference),dt.forEach(n=>{n!==e.preference&&t.push(n)})):t=dt.slice();let n,r={};for(let i=0;i<t.length;i++){let a=t[i];if(a===`webgpu`&&await ut()){let{WebGPURenderer:t}=await it(async()=>{let{WebGPURenderer:e}=await import(`./WebGPURenderer-CSj3opk1.js`);return{WebGPURenderer:e}},__vite__mapDeps([9,10,1,2,11,12,13,7,14]));n=t,r={...e,...e.webgpu};break}else if(a===`webgl`&&ct(e.failIfMajorPerformanceCaveat??Se.defaultOptions.failIfMajorPerformanceCaveat)){let{WebGLRenderer:t}=await it(async()=>{let{WebGLRenderer:e}=await import(`./WebGLRenderer-CoEbKz1J.js`);return{WebGLRenderer:e}},__vite__mapDeps([15,16,1,2,11,12,14]));n=t,r={...e,...e.webgl};break}else if(a===`canvas`){let{CanvasRenderer:t}=await it(async()=>{let{CanvasRenderer:e}=await import(`./CanvasRenderer-07ii8MqV.js`);return{CanvasRenderer:e}},__vite__mapDeps([17,18,1,2,4,11,12,19,13]));n=t,r={...e,...e.canvasOptions};break}}if(delete r.webgpu,delete r.webgl,delete r.canvasOptions,!n)throw Error(`No available renderer for the current environment`);let i=new n;return await i.init(r),i}var pt=class{static init(e){Object.defineProperty(this,"resizeTo",{configurable:!0,set(e){globalThis.removeEventListener(`resize`,this.queueResize),this._resizeTo=e,e&&(globalThis.addEventListener(`resize`,this.queueResize),this.resize())},get(){return this._resizeTo}}),this.queueResize=()=>{this._resizeTo&&(this._cancelResize(),this._resizeId=requestAnimationFrame(()=>this.resize()))},this._cancelResize=()=>{this._resizeId&&=(cancelAnimationFrame(this._resizeId),null)},this.resize=()=>{if(!this._resizeTo)return;this._cancelResize();let e,t;if(this._resizeTo===globalThis.window)e=globalThis.innerWidth,t=globalThis.innerHeight;else{let{clientWidth:n,clientHeight:r}=this._resizeTo;e=n,t=r}this.renderer.resize(e,t),this.render()},this._resizeId=null,this._resizeTo=null,this.resizeTo=e.resizeTo||null}static destroy(){globalThis.removeEventListener(`resize`,this.queueResize),this._cancelResize(),this._cancelResize=null,this.queueResize=null,this.resizeTo=null,this.resize=null}};pt.extension=t.Application;var mt=class{static init(e){e=Object.assign({autoStart:!0,sharedTicker:!1},e),Object.defineProperty(this,"ticker",{configurable:!0,set(e){this._ticker&&this._ticker.remove(this.render,this),this._ticker=e,e&&e.add(this.render,this,ne.LOW)},get(){return this._ticker}}),this.stop=()=>{this._ticker.stop()},this.start=()=>{this._ticker.start()},this._ticker=null,this.ticker=e.sharedTicker?ie.shared:new ie,e.autoStart&&this.start()}static destroy(){if(this._ticker){let e=this._ticker;this.ticker=null,e.destroy()}}};mt.extension=t.Application,c.add(pt),c.add(mt);var ht=class t{constructor(...t){this.stage=new C,t[0]!==void 0&&m(e,`Application constructor options are deprecated, please use Application.init() instead.`)}async init(e){e={...e},this.stage||=new C,this.renderer=await ft(e),t._plugins.forEach(t=>{t.init.call(this,e)})}render(){this.renderer.render({container:this.stage})}get canvas(){return this.renderer.canvas}get view(){return m(e,`Application.view is deprecated, please use Application.canvas instead.`),this.renderer.canvas}get screen(){return this.renderer.screen}get domContainerRoot(){return this.renderer.renderPipes.dom?._domElement}destroy(e=!1,n=!1){let r=t._plugins.slice(0);r.reverse(),r.forEach(e=>{e.destroy.call(this)}),this.stage.destroy(n),this.stage=null,this.renderer.destroy(e),this.renderer=null}};ht._plugins=[];var gt=ht;c.handleByList(t.Application,gt._plugins),c.add(xe);var _t={test(e){return typeof e==`string`&&e.startsWith(`info face=`)},parse(e){let t=e.match(/^[a-z]+\s+.+$/gm),n={info:[],common:[],page:[],char:[],chars:[],kerning:[],kernings:[],distanceField:[]};for(let e in t){let r=t[e].match(/^[a-z]+/gm)[0],i=t[e].match(/[a-zA-Z]+=([^\s"']+|"([^"]*)")/gm),a={};for(let e in i){let t=i[e].split(`=`),n=t[0],r=t[1].replace(/"/gm,``),o=parseFloat(r);a[n]=isNaN(o)?r:o}n[r].push(a)}let r={chars:{},pages:[],lineHeight:0,fontSize:0,fontFamily:``,distanceField:null,baseLineOffset:0},[i]=n.info,[a]=n.common,[o]=n.distanceField??[];o&&(r.distanceField={range:parseInt(o.distanceRange,10),type:o.fieldType}),r.fontSize=parseInt(i.size,10),r.fontFamily=i.face,r.lineHeight=parseInt(a.lineHeight,10);let s=n.page;for(let e=0;e<s.length;e++)r.pages.push({id:parseInt(s[e].id,10)||0,file:s[e].file});let c={};r.baseLineOffset=a.base===void 0?0:r.lineHeight-parseInt(a.base,10);let l=n.char;for(let e=0;e<l.length;e++){let t=l[e],n=parseInt(t.id,10),i=t.letter??t.char??String.fromCharCode(n);i===`space`&&(i=` `),c[n]=i,r.chars[i]={id:n,page:parseInt(t.page,10)||0,x:parseInt(t.x,10),y:parseInt(t.y,10),width:parseInt(t.width,10),height:parseInt(t.height,10),xOffset:parseInt(t.xoffset,10),yOffset:parseInt(t.yoffset,10),xAdvance:parseInt(t.xadvance,10),kerning:{}}}let u=n.kerning||[];for(let e=0;e<u.length;e++){let t=parseInt(u[e].first,10),n=parseInt(u[e].second,10),i=parseInt(u[e].amount,10);r.chars[c[n]]&&(r.chars[c[n]].kerning[c[t]]=i)}return r}},vt={test(e){let t=e;return typeof t!=`string`&&`getElementsByTagName`in t&&t.getElementsByTagName(`page`).length&&t.getElementsByTagName(`info`)[0].getAttribute(`face`)!==null},parse(e){let t={chars:{},pages:[],lineHeight:0,fontSize:0,fontFamily:``,distanceField:null,baseLineOffset:0},n=e.getElementsByTagName(`info`)[0],r=e.getElementsByTagName(`common`)[0],i=e.getElementsByTagName(`distanceField`)[0];i&&(t.distanceField={type:i.getAttribute(`fieldType`),range:parseInt(i.getAttribute(`distanceRange`),10)});let a=e.getElementsByTagName(`page`),o=e.getElementsByTagName(`char`),s=e.getElementsByTagName(`kerning`);t.fontSize=parseInt(n.getAttribute(`size`),10),t.fontFamily=n.getAttribute(`face`),t.lineHeight=parseInt(r.getAttribute(`lineHeight`),10);for(let e=0;e<a.length;e++)t.pages.push({id:parseInt(a[e].getAttribute(`id`),10)||0,file:a[e].getAttribute(`file`)});let c={},l=r.getAttribute(`base`);t.baseLineOffset=l===null?0:t.lineHeight-parseInt(l,10);for(let e=0;e<o.length;e++){let n=o[e],r=parseInt(n.getAttribute(`id`),10),i=n.getAttribute(`letter`)??n.getAttribute(`char`)??String.fromCharCode(r);i===`space`&&(i=` `),c[r]=i,t.chars[i]={id:r,page:parseInt(n.getAttribute(`page`),10)||0,x:parseInt(n.getAttribute(`x`),10),y:parseInt(n.getAttribute(`y`),10),width:parseInt(n.getAttribute(`width`),10),height:parseInt(n.getAttribute(`height`),10),xOffset:parseInt(n.getAttribute(`xoffset`),10),yOffset:parseInt(n.getAttribute(`yoffset`),10),xAdvance:parseInt(n.getAttribute(`xadvance`),10),kerning:{}}}for(let e=0;e<s.length;e++){let n=parseInt(s[e].getAttribute(`first`),10),r=parseInt(s[e].getAttribute(`second`),10),i=parseInt(s[e].getAttribute(`amount`),10);t.chars[c[r]]&&(t.chars[c[r]].kerning[c[n]]=i)}return t}},yt={test(e){return typeof e==`string`&&e.match(/<font(\s|>)/)?vt.test(g.get().parseXML(e)):!1},parse(e){return vt.parse(g.get().parseXML(e))}},bt=[`.xml`,`.fnt`],xt={extension:{type:t.CacheParser,name:`cacheBitmapFont`},test:e=>!!e?.pages&&!!e?.chars&&typeof e?.fontFamily==`string`&&e.fontFamily!==``,getCacheableAssets(e,t){let n={};return e.forEach(e=>{n[e]=t,n[`${e}-bitmap`]=t}),n[`${t.fontFamily}-bitmap`]=t,n}},St={extension:{type:t.LoadParser,priority:pe.Normal},name:`loadBitmapFont`,id:`bitmap-font`,test(e){return bt.includes(w.extname(e).toLowerCase())},async testParse(e){return _t.test(e)||yt.test(e)},async parse(e,t,n){let r=_t.test(e)?_t.parse(e):yt.parse(e),{src:i}=t,{pages:a}=r,o=[],s=r.distanceField?{scaleMode:`linear`,alphaMode:`premultiply-alpha-on-upload`,autoGenerateMipmaps:!1,resolution:1}:{};for(let e=0;e<a.length;++e){let t=a[e].file,n=w.join(w.dirname(i),t);n=fe(n,i),o.push({src:n,data:s})}let[c,{BitmapFont:l}]=await Promise.all([n.load(o),it(()=>import(`./BitmapFont-BMa3j29k.js`),__vite__mapDeps([20,21,1,4,5,19,13,12,7]))]);return new l({data:r,textures:o.map(e=>c[e.src])},i)},async load(e,t){return await(await g.get().fetch(e)).text()},async unload(e,t,n){await Promise.all(e.pages.map(e=>n.unload(e.texture.source._sourceOrigin))),e.destroy()}},Ct=class{constructor(e,t=!1){this._loader=e,this._assetList=[],this._isLoading=!1,this._maxConcurrent=1,this.verbose=t}add(e){e.forEach(e=>{this._assetList.push(e)}),this.verbose&&console.log(`[BackgroundLoader] assets: `,this._assetList),this._isActive&&!this._isLoading&&this._next()}async _next(){if(this._assetList.length&&this._isActive){this._isLoading=!0;let e=[],t=Math.min(this._assetList.length,this._maxConcurrent);for(let n=0;n<t;n++)e.push(this._assetList.pop());await this._loader.load(e),this._isLoading=!1,this._next()}}get active(){return this._isActive}set active(e){this._isActive!==e&&(this._isActive=e,e&&!this._isLoading&&this._next())}},wt={extension:{type:t.CacheParser,name:`cacheTextureArray`},test:e=>Array.isArray(e)&&e.every(e=>e instanceof o),getCacheableAssets:(e,t)=>{let n={};return e.forEach(e=>{t.forEach((t,r)=>{n[e+(r===0?``:r+1)]=t})}),n}};async function Tt(e){if(`Image`in globalThis)return new Promise(t=>{let n=new Image;n.onload=()=>{t(!0)},n.onerror=()=>{t(!1)},n.src=e});if(`createImageBitmap`in globalThis&&`fetch`in globalThis){try{let t=await(await fetch(e)).blob();await createImageBitmap(t)}catch{return!1}return!0}return!1}var Et={extension:{type:t.DetectionParser,priority:1},test:async()=>Tt(`data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=`),add:async e=>[...e,`avif`],remove:async e=>e.filter(e=>e!==`avif`)},Dt=[`png`,`jpg`,`jpeg`],Ot={extension:{type:t.DetectionParser,priority:-1},test:()=>Promise.resolve(!0),add:async e=>[...e,...Dt],remove:async e=>e.filter(e=>!Dt.includes(e))},kt=`WorkerGlobalScope`in globalThis&&globalThis instanceof globalThis.WorkerGlobalScope;function At(e){return!kt&&document.createElement(`video`).canPlayType(e)!==``}var jt={extension:{type:t.DetectionParser,priority:0},test:async()=>At(`video/mp4`),add:async e=>[...e,`mp4`,`m4v`],remove:async e=>e.filter(e=>e!==`mp4`&&e!==`m4v`)},Mt={extension:{type:t.DetectionParser,priority:0},test:async()=>At(`video/ogg`),add:async e=>[...e,`ogv`],remove:async e=>e.filter(e=>e!==`ogv`)},Nt={extension:{type:t.DetectionParser,priority:0},test:async()=>At(`video/webm`),add:async e=>[...e,`webm`],remove:async e=>e.filter(e=>e!==`webm`)},Pt={extension:{type:t.DetectionParser,priority:0},test:async()=>Tt(`data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=`),add:async e=>[...e,`webp`],remove:async e=>e.filter(e=>e!==`webp`)},Ft=class e{constructor(){this.loadOptions={...e.defaultOptions},this._parsers=[],this._parsersValidated=!1,this.parsers=new Proxy(this._parsers,{set:(e,t,n)=>(this._parsersValidated=!1,e[t]=n,!0)}),this.promiseCache={}}reset(){this._parsersValidated=!1,this.promiseCache={}}_getLoadPromiseAndParser(e,t){let n={promise:null,parser:null};return n.promise=(async()=>{let r=null,i=null;if((t.parser||t.loadParser)&&(i=this._parserHash[t.parser||t.loadParser],t.loadParser&&b(`[Assets] "loadParser" is deprecated, use "parser" instead for ${e}`),i||b(`[Assets] specified load parser "${t.parser||t.loadParser}" not found while loading ${e}`)),!i){for(let n=0;n<this.parsers.length;n++){let r=this.parsers[n];if(r.load&&r.test?.(e,t,this)){i=r;break}}if(!i)return b(`[Assets] ${e} could not be loaded as we don't know how to parse it, ensure the correct parser has been added`),null}r=await i.load(e,t,this),n.parser=i;for(let e=0;e<this.parsers.length;e++){let i=this.parsers[e];i.parse&&i.parse&&await i.testParse?.(r,t,this)&&(r=await i.parse(r,t,this)||r,n.parser=i)}return r})(),n}async load(t,n){this._parsersValidated||this._validateParsers();let{onProgress:r,onError:i,strategy:a,retryCount:o,retryDelay:s}=typeof n==`function`?{...e.defaultOptions,...this.loadOptions,onProgress:n}:{...e.defaultOptions,...this.loadOptions,...n||{}},c=0,l={},u=de(t),d=ye(t,e=>({alias:[e],src:e,data:{}})),f=d.reduce((e,t)=>e+(t.progressSize||1),0),p=d.map(async e=>{let t=w.toAbsolute(e.src);l[e.src]||(await this._loadAssetWithRetry(t,e,{onProgress:r,onError:i,strategy:a,retryCount:o,retryDelay:s},l),c+=e.progressSize||1,r&&r(c/f))});return await Promise.all(p),u?l[d[0].src]:l}async unload(e){let t=ye(e,e=>({alias:[e],src:e})).map(async e=>{let t=w.toAbsolute(e.src),n=this.promiseCache[t];if(n){let r=await n.promise;delete this.promiseCache[t],await n.parser?.unload?.(r,e,this)}});await Promise.all(t)}_validateParsers(){this._parsersValidated=!0,this._parserHash=this._parsers.filter(e=>e.name||e.id).reduce((e,t)=>(!t.name&&!t.id?b(`[Assets] parser should have an id`):(e[t.name]||e[t.id])&&b(`[Assets] parser id conflict "${t.id}"`),e[t.name]=t,t.id&&(e[t.id]=t),e),{})}async _loadAssetWithRetry(e,t,n,r){let i=0,{onError:a,strategy:o,retryCount:s,retryDelay:c}=n,l=e=>new Promise(t=>setTimeout(t,e));for(;;)try{this.promiseCache[e]||(this.promiseCache[e]=this._getLoadPromiseAndParser(e,t)),r[t.src]=await this.promiseCache[e].promise;return}catch(n){if(delete this.promiseCache[e],delete r[t.src],i++,o===`retry`&&!(o!==`retry`||i>s)){a&&a(n,t),await l(c);continue}if(o===`skip`){a&&a(n,t);return}a&&a(n,t);let u=Error(`[Loader.load] Failed to load ${e}.
${n}`);throw n instanceof Error&&n.stack&&(u.stack=n.stack),u}}};Ft.defaultOptions={onProgress:void 0,onError:void 0,strategy:`throw`,retryCount:3,retryDelay:250};var It=Ft;function Lt(e,t){if(Array.isArray(t)){for(let n of t)if(e.startsWith(`data:${n}`))return!0;return!1}return e.startsWith(`data:${t}`)}function A(e,t){let n=e.split(`?`)[0],r=w.extname(n).toLowerCase();return Array.isArray(t)?t.includes(r):r===t}var Rt=`.json`,zt=`application/json`,Bt={extension:{type:t.LoadParser,priority:pe.Low},name:`loadJson`,id:`json`,test(e){return Lt(e,zt)||A(e,Rt)},async load(e){return await(await g.get().fetch(e)).json()}},Vt=`.txt`,Ht=`text/plain`,Ut={name:`loadTxt`,id:`text`,extension:{type:t.LoadParser,priority:pe.Low,name:`loadTxt`},test(e){return Lt(e,Ht)||A(e,Vt)},async load(e){return await(await g.get().fetch(e)).text()}},Wt=[`normal`,`bold`,`100`,`200`,`300`,`400`,`500`,`600`,`700`,`800`,`900`],Gt=[`.ttf`,`.otf`,`.woff`,`.woff2`],Kt=[`font/ttf`,`font/otf`,`font/woff`,`font/woff2`],qt=/^(--|-?[A-Z_])[0-9A-Z_-]*$/i;function Jt(e){let t=w.extname(e),n=w.basename(e,t).replace(/(-|_)/g,` `).toLowerCase().split(` `).map(e=>e.charAt(0).toUpperCase()+e.slice(1)),r=n.length>0;for(let e of n)if(!e.match(qt)){r=!1;break}let i=n.join(` `);return r||(i=`"${i.replace(/[\\"]/g,`\\$&`)}"`),i}var Yt=/^[0-9A-Za-z%:/?#\[\]@!\$&'()\*\+,;=\-._~]*$/;function Xt(e){return Yt.test(e)?e:encodeURI(e)}var Zt={extension:{type:t.LoadParser,priority:pe.Low},name:`loadWebFont`,id:`web-font`,test(e){return Lt(e,Kt)||A(e,Gt)},async load(e,t){let n=g.get().getFontFaceSet();if(n){let r=[],i=t.data?.family??Jt(e),a=t.data?.weights?.filter(e=>Wt.includes(e))??[`normal`],o=t.data??{};for(let t=0;t<a.length;t++){let s=a[t],c=new FontFace(i,`url('${Xt(e)}')`,{...o,weight:s});await c.load(),n.add(c),r.push(c)}return T.has(`${i}-and-url`)?T.get(`${i}-and-url`).entries.push({url:e,faces:r}):T.set(`${i}-and-url`,{entries:[{url:e,faces:r}]}),r.length===1?r[0]:r}return b(`[loadWebFont] FontFace API is not supported. Skipping loading font`),null},unload(e){let t=Array.isArray(e)?e:[e],n=t[0].family,r=T.get(`${n}-and-url`),i=r.entries.find(e=>e.faces.some(e=>t.indexOf(e)!==-1));i.faces=i.faces.filter(e=>t.indexOf(e)===-1),i.faces.length===0&&(r.entries=r.entries.filter(e=>e!==i)),t.forEach(e=>{g.get().getFontFaceSet().delete(e)}),r.entries.length===0&&T.remove(`${n}-and-url`)}};function Qt(e,t=1){let n=me.RETINA_PREFIX?.exec(e);return n?parseFloat(n[1]):t}function $t(e,t,n){e.label=n,e._sourceOrigin=n;let r=new o({source:e,label:n}),i=()=>{delete t.promiseCache[n],T.has(n)&&T.remove(n)};return r.source.once(`destroy`,()=>{t.promiseCache[n]&&(b(`[Assets] A TextureSource managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the TextureSource.`),i())}),r.once(`destroy`,()=>{e.destroyed||(b(`[Assets] A Texture managed by Assets was destroyed instead of unloaded! Use Assets.unload() instead of destroying the Texture.`),i())}),r}var en=`.svg`,tn=`image/svg+xml`,nn={extension:{type:t.LoadParser,priority:pe.Low,name:`loadSVG`},name:`loadSVG`,id:`svg`,config:{crossOrigin:`anonymous`,parseAsGraphicsContext:!1},test(e){return Lt(e,tn)||A(e,en)},async load(e,t,n){return t.data?.parseAsGraphicsContext??this.config.parseAsGraphicsContext?an(e):rn(e,t,n,this.config.crossOrigin)},unload(e){e.destroy(!0)}};async function rn(e,t,n,r){let i=await g.get().fetch(e),a=g.get().createImage();a.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(await i.text())}`,a.crossOrigin=r,await a.decode();let o=t.data?.width??a.width,s=t.data?.height??a.height,c=t.data?.resolution||Qt(e),l=Math.ceil(o*c),u=Math.ceil(s*c),d=g.get().createCanvas(l,u),f=d.getContext(`2d`);f.imageSmoothingEnabled=!0,f.imageSmoothingQuality=`high`,f.drawImage(a,0,0,o*c,s*c);let{parseAsGraphicsContext:p,...m}=t.data??{};return $t(new _e({resource:d,alphaMode:`premultiply-alpha-on-upload`,resolution:c,...m}),n,e)}async function an(e){let t=await(await g.get().fetch(e)).text(),n=new we;return n.svg(t),n}var on=`(function () {
    'use strict';

    const WHITE_PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=";
    async function checkImageBitmap() {
      try {
        if (typeof createImageBitmap !== "function") return false;
        const response = await fetch(WHITE_PNG);
        const imageBlob = await response.blob();
        const imageBitmap = await createImageBitmap(imageBlob);
        return imageBitmap.width === 1 && imageBitmap.height === 1;
      } catch (_e) {
        return false;
      }
    }
    void checkImageBitmap().then((result) => {
      self.postMessage(result);
    });

})();
`,sn=null,cn=class{constructor(){sn||=URL.createObjectURL(new Blob([on],{type:`application/javascript`})),this.worker=new Worker(sn)}};cn.revokeObjectURL=function(){sn&&=(URL.revokeObjectURL(sn),null)};var ln=`(function () {
    'use strict';

    async function loadImageBitmap(url, alphaMode) {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(\`[WorkerManager.loadImageBitmap] Failed to fetch \${url}: \${response.status} \${response.statusText}\`);
      }
      const imageBlob = await response.blob();
      return alphaMode === "premultiplied-alpha" ? createImageBitmap(imageBlob, { premultiplyAlpha: "none" }) : createImageBitmap(imageBlob);
    }
    self.onmessage = async (event) => {
      try {
        const imageBitmap = await loadImageBitmap(event.data.data[0], event.data.data[1]);
        self.postMessage({
          data: imageBitmap,
          uuid: event.data.uuid,
          id: event.data.id
        }, [imageBitmap]);
      } catch (e) {
        self.postMessage({
          error: e,
          uuid: event.data.uuid,
          id: event.data.id
        });
      }
    };

})();
`,un=null,dn=class{constructor(){un||=URL.createObjectURL(new Blob([ln],{type:`application/javascript`})),this.worker=new Worker(un)}};dn.revokeObjectURL=function(){un&&=(URL.revokeObjectURL(un),null)};var fn=0,pn,mn=new class{constructor(){this._initialized=!1,this._createdWorkers=0,this._workerPool=[],this._queue=[],this._resolveHash={}}isImageBitmapSupported(){return this._isImageBitmapSupported===void 0&&(this._isImageBitmapSupported=new Promise(e=>{let{worker:t}=new cn;t.addEventListener(`message`,n=>{t.terminate(),cn.revokeObjectURL(),e(n.data)})})),this._isImageBitmapSupported}loadImageBitmap(e,t){return this._run(`loadImageBitmap`,[e,t?.data?.alphaMode])}async _initWorkers(){this._initialized||=!0}_getWorker(){pn===void 0&&(pn=navigator.hardwareConcurrency||4);let e=this._workerPool.pop();return!e&&this._createdWorkers<pn&&(this._createdWorkers++,e=new dn().worker,e.addEventListener(`message`,e=>{this._complete(e.data),this._returnWorker(e.target),this._next()})),e}_returnWorker(e){this._workerPool.push(e)}_complete(e){this._resolveHash[e.uuid]&&(e.error===void 0?this._resolveHash[e.uuid].resolve(e.data):this._resolveHash[e.uuid].reject(e.error),delete this._resolveHash[e.uuid])}async _run(e,t){await this._initWorkers();let n=new Promise((n,r)=>{this._queue.push({id:e,arguments:t,resolve:n,reject:r})});return this._next(),n}_next(){if(!this._queue.length)return;let e=this._getWorker();if(!e)return;let t=this._queue.pop(),n=t.id;this._resolveHash[fn]={resolve:t.resolve,reject:t.reject},e.postMessage({data:t.arguments,uuid:fn++,id:n})}reset(){this._workerPool.forEach(e=>e.terminate()),this._workerPool.length=0,Object.values(this._resolveHash).forEach(({reject:e})=>{e?.(Error(`WorkerManager has been reset before completion`))}),this._resolveHash={},this._queue.length=0,this._initialized=!1,this._createdWorkers=0}},hn=[`.jpeg`,`.jpg`,`.png`,`.webp`,`.avif`],gn=[`image/jpeg`,`image/png`,`image/webp`,`image/avif`];async function _n(e,t){let n=await g.get().fetch(e);if(!n.ok)throw Error(`[loadImageBitmap] Failed to fetch ${e}: ${n.status} ${n.statusText}`);let r=await n.blob();return t?.data?.alphaMode===`premultiplied-alpha`?createImageBitmap(r,{premultiplyAlpha:`none`}):createImageBitmap(r)}var vn={name:`loadTextures`,id:`texture`,extension:{type:t.LoadParser,priority:pe.High,name:`loadTextures`},config:{preferWorkers:!0,preferCreateImageBitmap:!0,crossOrigin:`anonymous`},test(e){return Lt(e,gn)||A(e,hn)},async load(e,t,n){let r=null;return r=globalThis.createImageBitmap&&this.config.preferCreateImageBitmap?this.config.preferWorkers&&await mn.isImageBitmapSupported()?await mn.loadImageBitmap(e,t):await _n(e,t):await new Promise((t,n)=>{r=g.get().createImage(),r.crossOrigin=this.config.crossOrigin,r.src=e,r.complete?t(r):(r.onload=()=>{t(r)},r.onerror=n)}),$t(new _e({resource:r,alphaMode:`premultiply-alpha-on-upload`,resolution:t.data?.resolution||Qt(e),...t.data}),n,e)},unload(e){e.destroy(!0)}},yn=[`.mp4`,`.m4v`,`.webm`,`.ogg`,`.ogv`,`.h264`,`.avi`,`.mov`],bn,xn;function Sn(e,t,n){n===void 0&&!t.startsWith(`data:`)?e.crossOrigin=wn(t):n!==!1&&(e.crossOrigin=typeof n==`string`?n:`anonymous`)}function Cn(e){return new Promise((t,n)=>{e.addEventListener(`canplaythrough`,r),e.addEventListener(`error`,i),e.load();function r(){a(),t()}function i(e){a(),n(e)}function a(){e.removeEventListener(`canplaythrough`,r),e.removeEventListener(`error`,i)}})}function wn(e,t=globalThis.location){if(e.startsWith(`data:`))return``;t||=globalThis.location;let n=new URL(e,document.baseURI);return n.hostname!==t.hostname||n.port!==t.port||n.protocol!==t.protocol?`anonymous`:``}function Tn(){let e=[],t=[];for(let n of yn){let r=he.MIME_TYPES[n.substring(1)]||`video/${n.substring(1)}`;At(r)&&(e.push(n),t.includes(r)||t.push(r))}return{validVideoExtensions:e,validVideoMime:t}}var En={name:`loadVideo`,id:`video`,extension:{type:t.LoadParser,name:`loadVideo`},test(e){if(!bn||!xn){let{validVideoExtensions:e,validVideoMime:t}=Tn();bn=e,xn=t}let t=Lt(e,xn),n=A(e,bn);return t||n},async load(e,t,n){let r={...he.defaultOptions,resolution:t.data?.resolution||Qt(e),alphaMode:t.data?.alphaMode||await ue(),...t.data},i=document.createElement(`video`),a={preload:r.autoLoad===!1?void 0:`auto`,"webkit-playsinline":r.playsinline===!1?void 0:``,playsinline:r.playsinline===!1?void 0:``,muted:r.muted===!0?``:void 0,loop:r.loop===!0?``:void 0,autoplay:r.autoPlay===!1?void 0:``};Object.keys(a).forEach(e=>{let t=a[e];t!==void 0&&i.setAttribute(e,t)}),r.muted===!0&&(i.muted=!0),Sn(i,e,r.crossorigin);let o=document.createElement(`source`),s;if(r.mime)s=r.mime;else if(e.startsWith(`data:`))s=e.slice(5,e.indexOf(`;`));else if(!e.startsWith(`blob:`)){let t=e.split(`?`)[0].slice(e.lastIndexOf(`.`)+1).toLowerCase();s=he.MIME_TYPES[t]||`video/${t}`}return o.src=e,s&&(o.type=s),new Promise((a,s)=>{r.preload&&!r.autoPlay&&i.load(),i.addEventListener(`canplay`,c),i.addEventListener(`error`,l),o.addEventListener(`error`,l),i.appendChild(o);async function c(){let o=new he({...r,resource:i});u(),t.data.preload&&await Cn(i),a($t(o,n,e))}function l(e){u(),s(e)}function u(){i.removeEventListener(`canplay`,c),i.removeEventListener(`error`,l),o.removeEventListener(`error`,l)}})},unload(e){e.destroy(!0)}},Dn={extension:{type:t.ResolveParser,name:`resolveTexture`},test:vn.test,parse:e=>({resolution:parseFloat(me.RETINA_PREFIX.exec(e)?.[1]??`1`),format:e.split(`.`).pop(),src:e})},On={extension:{type:t.ResolveParser,priority:-2,name:`resolveJson`},test:e=>me.RETINA_PREFIX.test(e)&&e.endsWith(`.json`),parse:Dn.parse},kn=new class{constructor(){this._detections=[],this._initialized=!1,this.resolver=new me,this.loader=new It,this.cache=T,this._backgroundLoader=new Ct(this.loader),this._backgroundLoader.active=!0,this.reset()}async init(e={}){if(this._initialized){b(`[Assets]AssetManager already initialized, did you load before calling this Assets.init()?`);return}if(this._initialized=!0,e.defaultSearchParams&&this.resolver.setDefaultSearchParams(e.defaultSearchParams),e.basePath&&(this.resolver.basePath=e.basePath),e.bundleIdentifier&&this.resolver.setBundleIdentifier(e.bundleIdentifier),e.manifest){let t=e.manifest;typeof t==`string`&&(t=await this.load(t)),this.resolver.addManifest(t)}let t=e.texturePreference?.resolution??1,n=typeof t==`number`?[t]:t,r=await this._detectFormats({preferredFormats:e.texturePreference?.format,skipDetections:e.skipDetections,detections:this._detections});this.resolver.prefer({params:{format:r,resolution:n}}),e.preferences&&this.setPreferences(e.preferences),e.loadOptions&&(this.loader.loadOptions={...this.loader.loadOptions,...e.loadOptions})}add(e){this.resolver.add(e)}async load(e,t){this._initialized||await this.init();let n=de(e),r=ye(e).map(e=>{if(typeof e!=`string`){let t=this.resolver.getAlias(e);return t.some(e=>!this.resolver.hasKey(e))&&this.add(e),Array.isArray(t)?t[0]:t}return this.resolver.hasKey(e)||this.add({alias:e,src:e}),e}),i=this.resolver.resolve(r),a=await this._mapLoadToResolve(i,t);return n?a[r[0]]:a}addBundle(e,t){this.resolver.addBundle(e,t)}async loadBundle(e,t){this._initialized||await this.init();let n=!1;typeof e==`string`&&(n=!0,e=[e]);let r=this.resolver.resolveBundle(e),i={},a=Object.keys(r),o=0,s=[],c=()=>{t?.(s.reduce((e,t)=>e+t,0)/o)},l=a.map((e,t)=>{let n=r[e],a=Object.values(n),l=[...new Set(a.flat())].reduce((e,t)=>e+(t.progressSize||1),0);return s.push(0),o+=l,this._mapLoadToResolve(n,e=>{s[t]=e*l,c()}).then(t=>{i[e]=t})});return await Promise.all(l),n?i[e[0]]:i}async backgroundLoad(e){this._initialized||await this.init(),typeof e==`string`&&(e=[e]);let t=this.resolver.resolve(e);this._backgroundLoader.add(Object.values(t))}async backgroundLoadBundle(e){this._initialized||await this.init(),typeof e==`string`&&(e=[e]);let t=this.resolver.resolveBundle(e);Object.values(t).forEach(e=>{this._backgroundLoader.add(Object.values(e))})}reset(){this.resolver.reset(),this.loader.reset(),this.cache.reset(),this._initialized=!1}get(e){if(typeof e==`string`)return T.get(e);let t={};for(let n=0;n<e.length;n++)t[n]=T.get(e[n]);return t}async _mapLoadToResolve(e,t){let n=[...new Set(Object.values(e))];this._backgroundLoader.active=!1;let r=await this.loader.load(n,t);this._backgroundLoader.active=!0;let i={};return n.forEach(e=>{let t=r[e.src],n=[e.src];e.alias&&n.push(...e.alias),n.forEach(e=>{i[e]=t}),T.set(n,t)}),i}async unload(e){this._initialized||await this.init();let t=ye(e).map(e=>typeof e==`string`?e:e.src),n=this.resolver.resolve(t);await this._unloadFromResolved(n)}async unloadBundle(e){this._initialized||await this.init(),e=ye(e);let t=this.resolver.resolveBundle(e),n=Object.keys(t).map(e=>this._unloadFromResolved(t[e]));await Promise.all(n)}async _unloadFromResolved(e){let t=Object.values(e);t.forEach(e=>{T.remove(e.src)}),await this.loader.unload(t)}async _detectFormats(e){let t=[];e.preferredFormats&&(t=Array.isArray(e.preferredFormats)?e.preferredFormats:[e.preferredFormats]);for(let n of e.detections)e.skipDetections||await n.test()?t=await n.add(t):e.skipDetections||(t=await n.remove(t));return t=t.filter((e,n)=>t.indexOf(e)===n),t}get detections(){return this._detections}setPreferences(e){this.loader.parsers.forEach(t=>{t.config&&Object.keys(t.config).filter(t=>t in e).forEach(n=>{t.config[n]=e[n]})})}};c.handleByList(t.LoadParser,kn.loader.parsers).handleByList(t.ResolveParser,kn.resolver.parsers).handleByList(t.CacheParser,kn.cache.parsers).handleByList(t.DetectionParser,kn.detections),c.add(wt,Ot,Et,Pt,jt,Mt,Nt,Bt,Ut,Zt,nn,vn,En,St,xt,Dn,On);var An={loader:t.LoadParser,resolver:t.ResolveParser,cache:t.CacheParser,detection:t.DetectionParser};c.handle(t.Asset,e=>{let t=e.ref;Object.entries(An).filter(([e])=>!!t[e]).forEach(([e,n])=>c.add(Object.assign(t[e],{extension:t[e].extension??n})))},e=>{let t=e.ref;Object.keys(An).filter(e=>!!t[e]).forEach(e=>c.remove(t[e]))});var jn=class extends S{constructor(e,t){let{text:n,resolution:r,style:i,anchor:a,width:o,height:s,roundPixels:c,...l}=e;super({...l}),this.batched=!0,this._resolution=null,this._autoResolution=!0,this._didTextUpdate=!0,this._styleClass=t,this.text=n??``,this.style=i,this.resolution=r??null,this.allowChildren=!1,this._anchor=new x({_onUpdate:()=>{this.onViewUpdate()}}),a&&(this.anchor=a),this.roundPixels=c??!1,o!==void 0&&(this.width=o),s!==void 0&&(this.height=s)}get anchor(){return this._anchor}set anchor(e){typeof e==`number`?this._anchor.set(e):this._anchor.copyFrom(e)}set text(e){e=e.toString(),this._text!==e&&(this._text=e,this.onViewUpdate())}get text(){return this._text}set resolution(e){this._autoResolution=e===null,this._resolution=e,this.onViewUpdate()}get resolution(){return this._resolution}get style(){return this._style}set style(e){e||={},this._style?.off(`update`,this.onViewUpdate,this),e instanceof this._styleClass?this._style=e:this._style=new this._styleClass(e),this._style.on(`update`,this.onViewUpdate,this),this.onViewUpdate()}get width(){return Math.abs(this.scale.x)*this.bounds.width}set width(e){this._setWidth(e,this.bounds.width)}get height(){return Math.abs(this.scale.y)*this.bounds.height}set height(e){this._setHeight(e,this.bounds.height)}getSize(e){return e||={},e.width=Math.abs(this.scale.x)*this.bounds.width,e.height=Math.abs(this.scale.y)*this.bounds.height,e}setSize(e,t){typeof e==`object`?(t=e.height??e.width,e=e.width):t??=e,e!==void 0&&this._setWidth(e,this.bounds.width),t!==void 0&&this._setHeight(t,this.bounds.height)}containsPoint(e){let t=this.bounds.width,n=this.bounds.height,r=-t*this.anchor.x,i=0;return e.x>=r&&e.x<=r+t&&(i=-n*this.anchor.y,e.y>=i&&e.y<=i+n)}onViewUpdate(){this.didViewUpdate||(this._didTextUpdate=!0),super.onViewUpdate()}destroy(e=!1){this._style?.off(`update`,this.onViewUpdate,this),super.destroy(e),this.owner=null,this._bounds=null,this._anchor=null,(typeof e==`boolean`?e:e?.style)&&this._style.destroy(e),this._style=null,this._text=null}get styleKey(){return`${this._text}:${this._style.styleKey}:${this._resolution}`}};function Mn(t,n){let r=t[0]??{};return(typeof r==`string`||t[1])&&(m(e,`use new ${n}({ text: "hi!", style }) instead`),r={text:r,style:t[1]}),r}var j=null,M=null;function Nn(e,t){j||(j=g.get().createCanvas(256,128),M=j.getContext(`2d`,{willReadFrequently:!0}),M.globalCompositeOperation=`copy`,M.globalAlpha=1),(j.width<e||j.height<t)&&(j.width=a(e),j.height=a(t))}function Pn(e,t,n){for(let r=0,i=4*n*t;r<t;++r,i+=4)if(e[i+3]!==0)return!1;return!0}function Fn(e,t,n,r,i){let a=4*t;for(let t=r,o=r*a+4*n;t<=i;++t,o+=a)if(e[o+3]!==0)return!1;return!0}function In(...e){let t=e[0];t.canvas||(t={canvas:e[0],resolution:e[1]});let{canvas:n}=t,r=Math.min(t.resolution??1,1),a=t.width??n.width,o=t.height??n.height,s=t.output;if(Nn(a,o),!M)throw TypeError(`Failed to get canvas 2D context`);M.drawImage(n,0,0,a,o,0,0,a*r,o*r);let c=M.getImageData(0,0,a,o).data,l=0,u=0,d=a-1,f=o-1;for(;u<o&&Pn(c,a,u);)++u;if(u===o)return i.EMPTY;for(;Pn(c,a,f);)--f;for(;Fn(c,a,l,u,f);)++l;for(;Fn(c,a,d,u,f);)--d;return++d,++f,M.globalCompositeOperation=`source-over`,M.strokeRect(l,u,d-l,f-u),M.globalCompositeOperation=`copy`,s??=new i,s.set(l/r,u/r,(d-l)/r,(f-u)/r),s}var Ln=new i;function N(e){let t=0;for(let n=0;n<e.length;n++)e.charCodeAt(n)===32&&t++;return t}var Rn=new class{getCanvasAndContext(e){let{text:t,style:n,resolution:r=1}=e,i=n._getFinalPadding(),a=E.measureText(t||` `,n),o=Math.ceil(Math.ceil(Math.max(1,a.width)+i*2)*r),s=Math.ceil(Math.ceil(Math.max(1,a.height)+i*2)*r),c=Oe.getOptimalCanvasAndContext(o,s);return this._renderTextToCanvas(n,i,r,c,a),{canvasAndContext:c,frame:n.trim?In({canvas:c.canvas,width:o,height:s,resolution:1,output:Ln}):Ln.set(0,0,o,s)}}returnCanvasAndContext(e){Oe.returnCanvasAndContext(e)}_renderTextToCanvas(e,t,n,r,i){if(i.runsByLine&&i.runsByLine.length>0){this._renderTaggedTextToCanvas(i,e,t,n,r);return}let{canvas:a,context:o}=r,s=Ae(e),c=i.lines,l=i.lineHeight,u=i.lineWidths,d=i.maxLineWidth,f=i.fontProperties,p=a.height;if(o.resetTransform(),o.scale(n,n),o.textBaseline=e.textBaseline,e._stroke?.width){let t=e._stroke;o.lineWidth=t.width,o.miterLimit=t.miterLimit,o.lineJoin=t.join,o.lineCap=t.cap}o.font=s;let m,h,g=e.dropShadow?2:1,_=(e._stroke?.width??0)/2,v=(l-f.fontSize)/2;l-f.fontSize<0&&(v=0);for(let a=0;a<g;++a){let s=e.dropShadow&&a===0,g=s?Math.ceil(Math.max(1,p)+t*2):0,y=g*n;if(s)this._setupDropShadow(o,e,n,y);else{let n=e._gradientBounds,r=e._gradientOffset;if(n){let a={width:n.width,height:n.height,lineHeight:n.height,lines:i.lines};this._setFillAndStrokeStyles(o,e,a,t,_,r?.x??0,r?.y??0)}else r?this._setFillAndStrokeStyles(o,e,i,t,_,r.x,r.y):this._setFillAndStrokeStyles(o,e,i,t,_);o.shadowColor=`rgba(0,0,0,0)`}for(let n=0;n<c.length;n++){m=_,h=_+n*l+f.ascent+v,m+=this._getAlignmentOffset(u[n],d,e.align);let i=0;if(e.align===`justify`&&e.wordWrap&&n<c.length-1){let e=N(c[n]);e>0&&(i=(d-u[n])/e)}e._stroke?.width&&this._drawLetterSpacing(c[n],e,r,m+t,h+t-g,!0,i),e._fill!==void 0&&this._drawLetterSpacing(c[n],e,r,m+t,h+t-g,!1,i)}}}_renderTaggedTextToCanvas(e,t,n,r,i){let{canvas:a,context:o}=i,{runsByLine:s,lineWidths:c,maxLineWidth:l,lineAscents:u,lineHeights:d,hasDropShadow:f}=e,p=a.height;o.resetTransform(),o.scale(r,r),o.textBaseline=t.textBaseline;let m=f?2:1,h=t._stroke?.width??0;for(let e of s)for(let t of e){let e=t.style._stroke?.width??0;e>h&&(h=e)}let g=h/2,_=[];for(let e=0;e<s.length;e++){let t=s[e],n=[];for(let e of t){let t=Ae(e.style);o.font=t,n.push({width:E._measureText(e.text,e.style.letterSpacing,o),font:t})}_.push(n)}for(let e=0;e<m;++e){let a=f&&e===0,m=a?Math.ceil(Math.max(1,p)+n*2):0,h=m*r;a||(o.shadowColor=`rgba(0,0,0,0)`);let v=g;for(let e=0;e<s.length;e++){let f=s[e],p=c[e],y=u[e],ee=d[e],te=_[e],b=g;b+=this._getAlignmentOffset(p,l,t.align);let x=0;if(t.align===`justify`&&t.wordWrap&&e<s.length-1){let e=0;for(let t of f)e+=N(t.text);e>0&&(x=(l-p)/e)}let ne=v+y,S=b+n;for(let e=0;e<f.length;e++){let t=f[e],{width:s,font:c}=te[e];if(o.font=c,o.textBaseline=t.style.textBaseline,t.style._stroke?.width){let e=t.style._stroke;if(o.lineWidth=e.width,o.miterLimit=e.miterLimit,o.lineJoin=e.join,o.lineCap=e.cap,a)if(t.style.dropShadow)this._setupDropShadow(o,t.style,r,h);else{let e=N(t.text);S+=s+e*x;continue}else{let r=E.measureFont(c),i=t.style.lineHeight||r.fontSize;o.strokeStyle=Me(e,o,{width:s,height:i,lineHeight:i,lines:[t.text]},n*2,S-n,v)}this._drawLetterSpacing(t.text,t.style,i,S,ne+n-m,!0,x)}let l=N(t.text);S+=s+l*x}S=b+n;for(let e=0;e<f.length;e++){let t=f[e],{width:s,font:c}=te[e];if(o.font=c,o.textBaseline=t.style.textBaseline,t.style._fill!==void 0){if(a)if(t.style.dropShadow)this._setupDropShadow(o,t.style,r,h);else{let e=N(t.text);S+=s+e*x;continue}else{let e=E.measureFont(c),r=t.style.lineHeight||e.fontSize,i={width:s,height:r,lineHeight:r,lines:[t.text]};o.fillStyle=Me(t.style._fill,o,i,n*2,S-n,v)}this._drawLetterSpacing(t.text,t.style,i,S,ne+n-m,!1,x)}let l=N(t.text);S+=s+l*x}v+=ee}}}_setFillAndStrokeStyles(e,t,n,r,i,a=0,o=0){if(e.fillStyle=t._fill?Me(t._fill,e,n,r*2,a,o):null,t._stroke?.width){let s=i+r*2;e.strokeStyle=Me(t._stroke,e,n,s,a,o)}}_setupDropShadow(e,t,n,r){e.fillStyle=`black`,e.strokeStyle=`black`;let i=t.dropShadow,a=i.color,o=i.alpha;e.shadowColor=l.shared.setValue(a).setAlpha(o).toRgbaString();let s=i.blur*n,c=i.distance*n;e.shadowBlur=s,e.shadowOffsetX=Math.cos(i.angle)*c,e.shadowOffsetY=Math.sin(i.angle)*c+r}_getAlignmentOffset(e,t,n){return n===`right`?t-e:n===`center`?(t-e)/2:0}_drawLetterSpacing(e,t,n,r,i,a=!1,o=0){let{context:s}=n,c=t.letterSpacing,l=!1;if(E.experimentalLetterSpacingSupported&&(E.experimentalLetterSpacing?(s.letterSpacing=`${c}px`,s.textLetterSpacing=`${c}px`,l=!0):(s.letterSpacing=`0px`,s.textLetterSpacing=`0px`)),(c===0||l)&&o===0){a?s.strokeText(e,r,i):s.fillText(e,r,i);return}if(o!==0&&(c===0||l)){let t=e.split(` `),n=r,c=s.measureText(` `).width;for(let e=0;e<t.length;e++)a?s.strokeText(t[e],n,i):s.fillText(t[e],n,i),n+=s.measureText(t[e]).width+c+o;return}let u=r,d=E.graphemeSegmenter(e),f=s.measureText(e).width,p=0;for(let e=0;e<d.length;++e){let t=d[e];a?s.strokeText(t,u,i):s.fillText(t,u,i);let n=``;for(let t=e+1;t<d.length;++t)n+=d[t];p=s.measureText(n).width,u+=f-p+c,t===` `&&(u+=o),f=p}}};function zn(e,t){let{texture:n,bounds:r}=e,i=t._style._getFinalPadding();le(r,t._anchor,n);let a=t._anchor._x*i*2,o=t._anchor._y*i*2;r.minX-=i-a,r.minY-=i-o,r.maxX-=i-a,r.maxY-=i-o}var Bn=class extends Ce{},Vn=class{constructor(e){this._renderer=e,e.runners.resolutionChange.add(this),this._managedTexts=new De({renderer:e,type:`renderable`,onUnload:this.onTextUnload.bind(this),name:`canvasText`})}resolutionChange(){for(let e in this._managedTexts.items){let t=this._managedTexts.items[e];t?._autoResolution&&t.onViewUpdate()}}validateRenderable(e){let t=this._getGpuText(e),n=e.styleKey;return t.currentKey!==n||e._didTextUpdate}addRenderable(e,t){let n=this._getGpuText(e);if(e._didTextUpdate){let t=e._autoResolution?this._renderer.resolution:e.resolution;(n.currentKey!==e.styleKey||e._resolution!==t)&&this._updateGpuText(e),e._didTextUpdate=!1,zn(n,e)}this._renderer.renderPipes.batch.addToBatch(n,t)}updateRenderable(e){let t=this._getGpuText(e);t._batcher.updateElement(t)}_updateGpuText(e){let t=this._getGpuText(e);t.texture&&this._renderer.canvasText.decreaseReferenceCount(t.currentKey),e._resolution=e._autoResolution?this._renderer.resolution:e.resolution,t.texture=this._renderer.canvasText.getManagedTexture(e),t.currentKey=e.styleKey}_getGpuText(e){return e._gpuData[this._renderer.uid]||this.initGpuText(e)}initGpuText(e){let t=new Bn;return t.currentKey=`--`,t.renderable=e,t.transform=e.groupTransform,t.bounds={minX:0,maxX:1,minY:0,maxY:0},t.roundPixels=this._renderer._roundPixels|e._roundPixels,e._gpuData[this._renderer.uid]=t,this._managedTexts.add(e),t}onTextUnload(e){let t=e._gpuData[this._renderer.uid];if(!t)return;let{canvasText:n}=this._renderer;n.getReferenceCount(t.currentKey)>0?n.decreaseReferenceCount(t.currentKey):t.texture&&n.returnTexture(t.texture)}destroy(){this._managedTexts.destroy(),this._renderer=null}};Vn.extension={type:[t.WebGLPipes,t.WebGPUPipes,t.CanvasPipes],name:`text`};var Hn=class{constructor(e,t){this._activeTextures={},this._renderer=e,this._retainCanvasContext=t}getTexture(e,t,r,i){typeof e==`string`&&(m(`8.0.0`,`CanvasTextSystem.getTexture: Use object TextOptions instead of separate arguments`),e={text:e,style:r,resolution:t}),e.style instanceof je||(e.style=new je(e.style)),e.textureStyle instanceof n||(e.textureStyle=new n(e.textureStyle)),typeof e.text!=`string`&&(e.text=e.text.toString());let{text:a,style:o,textureStyle:s,autoGenerateMipmaps:c}=e,l=e.resolution??this._renderer.resolution,{frame:u,canvasAndContext:d}=Rn.getCanvasAndContext({text:a,style:o,resolution:l}),f=ge(d.canvas,u.width,u.height,l,c);if(s&&(f.source.style=s),o.trim&&(u.pad(o.padding),f.frame.copyFrom(u),f.frame.scale(1/l),f.updateUvs()),o.filters){let e=this._applyFilters(f,o.filters);return this.returnTexture(f),Rn.returnCanvasAndContext(d),e}return this._renderer.texture.initSource(f._source),this._retainCanvasContext||Rn.returnCanvasAndContext(d),f}returnTexture(e){let t=e.source,n=t.resource;if(this._retainCanvasContext&&n?.getContext){let e=n.getContext(`2d`);e&&Rn.returnCanvasAndContext({canvas:n,context:e})}t.resource=null,t.uploadMethodId=`unknown`,t.alphaMode=`no-premultiply-alpha`,re.returnTexture(e,!0)}renderTextToCanvas(){m(`8.10.0`,`CanvasTextSystem.renderTextToCanvas: no longer supported, use CanvasTextSystem.getTexture instead`)}getManagedTexture(e){e._resolution=e._autoResolution?this._renderer.resolution:e.resolution;let t=e.styleKey;if(this._activeTextures[t])return this._increaseReferenceCount(t),this._activeTextures[t].texture;let n=this.getTexture({text:e.text,style:e.style,resolution:e._resolution,textureStyle:e.textureStyle,autoGenerateMipmaps:e.autoGenerateMipmaps});return this._activeTextures[t]={texture:n,usageCount:1},n}decreaseReferenceCount(e){let t=this._activeTextures[e];t&&(t.usageCount--,t.usageCount===0&&(this.returnTexture(t.texture),this._activeTextures[e]=null))}getReferenceCount(e){return this._activeTextures[e]?.usageCount??0}_increaseReferenceCount(e){this._activeTextures[e].usageCount++}_applyFilters(e,t){let n=this._renderer.renderTarget.renderTarget,r=this._renderer.filter.generateFilteredTexture({texture:e,filters:t});return this._renderer.renderTarget.bind({target:n,clear:!1}),r}destroy(){this._renderer=null;for(let e in this._activeTextures)this._activeTextures[e]&&this.returnTexture(this._activeTextures[e].texture);this._activeTextures=null}},Un=class extends Hn{constructor(e){super(e,!0)}};Un.extension={type:[t.CanvasSystem],name:`canvasText`};var Wn=class extends Hn{constructor(e){super(e,!1)}};Wn.extension={type:[t.WebGLSystem,t.WebGPUSystem],name:`canvasText`},c.add(Un),c.add(Wn),c.add(Vn);var Gn=class extends jn{constructor(...e){let t=Mn(e,`Text`);super(t,je),this.renderPipeId=`text`,t.textureStyle&&(this.textureStyle=t.textureStyle instanceof n?t.textureStyle:new n(t.textureStyle)),this.autoGenerateMipmaps=t.autoGenerateMipmaps??s.defaultOptions.autoGenerateMipmaps}updateBounds(){let e=this._bounds,t=this._anchor,n=0,r=0;if(this._style.trim){let{frame:e,canvasAndContext:t}=Rn.getCanvasAndContext({text:this.text,style:this._style,resolution:1});Rn.returnCanvasAndContext(t),n=e.width,r=e.height}else{let e=E.measureText(this._text,this._style);n=e.width,r=e.height}e.minX=-t._x*n,e.maxX=e.minX+n,e.minY=-t._y*r,e.maxY=e.minY+r}},Kn=class{execute(e,t){let n=e.renderer,r=n.canvasContext.activeContext,i=t.particleChildren,a=t.texture;r.save(),n.canvasContext.setContextTransform(t.worldTransform,t.roundPixels),n.canvasContext.setBlendMode(t.groupBlendMode);let o=t.groupColorAlpha,s=n.filter?.alphaMultiplier??1,c=(o>>>24&255)/255*s;for(let e=0;e<i.length;e++){let t=i[e],n=t.texture||a;if(!n?.source?.resource)continue;let o=t.color,s=(o>>>24&255)/255*c;if(s<=0)continue;let l=o&16777215,u=((l&255)<<16)+(l&65280)+(l>>16&255),d=n.source.resource;u!==16777215&&(d=ve.getTintedCanvas({texture:n},u));let f=n.frame,p=n.source.resolution,m=f.x*p,h=f.y*p,g=f.width*p,_=f.height*p;r.globalAlpha=s;let v=-t.anchorX*f.width,y=-t.anchorY*f.height;t.rotation!==0||t.scaleX!==1||t.scaleY!==1?(r.save(),r.translate(t.x,t.y),r.rotate(t.rotation),r.scale(t.scaleX,t.scaleY),r.drawImage(d,m,h,g,_,v,y,f.width,f.height),r.restore()):r.drawImage(d,m,h,g,_,t.x+v,t.y+y,f.width,f.height)}r.restore()}};function qn(e,t=null){let n=e*6;if(n>65535?t||=new Uint32Array(n):t||=new Uint16Array(n),t.length!==n)throw Error(`Out buffer length is incorrect, got ${t.length} and expected ${n}`);for(let e=0,r=0;e<n;e+=6,r+=4)t[e+0]=r+0,t[e+1]=r+1,t[e+2]=r+2,t[e+3]=r+0,t[e+4]=r+2,t[e+5]=r+3;return t}function Jn(e){return{dynamicUpdate:Yn(e,!0),staticUpdate:Yn(e,!1)}}function Yn(e,t){let n=[];n.push(`

        var index = 0;

        for (let i = 0; i < ps.length; ++i)
        {
            const p = ps[i];

            `);let r=0;for(let i in e){let a=e[i];if(t!==a.dynamic)continue;n.push(`offset = index + ${r}`),n.push(a.code);let o=ee(a.format);r+=o.stride/4}n.push(`
            index += stride * 4;
        }
    `),n.unshift(`
        var stride = ${r};
    `);let i=n.join(`
`);return Function(`ps`,`f32v`,`u32v`,i)}var Xn=class{constructor(e){this._size=0,this._generateParticleUpdateCache={};let t=this._size=e.size??1e3,n=e.properties,r=0,i=0;for(let e in n){let t=n[e],a=ee(t.format);t.dynamic?i+=a.stride:r+=a.stride}this._dynamicStride=i/4,this._staticStride=r/4,this.staticAttributeBuffer=new Te(t*4*r),this.dynamicAttributeBuffer=new Te(t*4*i),this.indexBuffer=qn(t);let a=new y,o=0,s=0;this._staticBuffer=new _({data:new Float32Array(1),label:`static-particle-buffer`,shrinkToFit:!1,usage:v.VERTEX|v.COPY_DST}),this._dynamicBuffer=new _({data:new Float32Array(1),label:`dynamic-particle-buffer`,shrinkToFit:!1,usage:v.VERTEX|v.COPY_DST});for(let e in n){let t=n[e],r=ee(t.format);t.dynamic?(a.addAttribute(t.attributeName,{buffer:this._dynamicBuffer,stride:this._dynamicStride*4,offset:o*4,format:t.format}),o+=r.size):(a.addAttribute(t.attributeName,{buffer:this._staticBuffer,stride:this._staticStride*4,offset:s*4,format:t.format}),s+=r.size)}a.addIndex(this.indexBuffer);let c=this.getParticleUpdate(n);this._dynamicUpload=c.dynamicUpdate,this._staticUpload=c.staticUpdate,this.geometry=a}getParticleUpdate(e){let t=Zn(e);return this._generateParticleUpdateCache[t]||(this._generateParticleUpdateCache[t]=this.generateParticleUpdate(e)),this._generateParticleUpdateCache[t]}generateParticleUpdate(e){return Jn(e)}update(e,t){e.length>this._size&&(t=!0,this._size=Math.max(e.length,this._size*1.5|0),this.staticAttributeBuffer=new Te(this._size*this._staticStride*4*4),this.dynamicAttributeBuffer=new Te(this._size*this._dynamicStride*4*4),this.indexBuffer=qn(this._size),this.geometry.indexBuffer.setDataWithSize(this.indexBuffer,this.indexBuffer.byteLength,!0));let n=this.dynamicAttributeBuffer;if(this._dynamicUpload(e,n.float32View,n.uint32View),this._dynamicBuffer.setDataWithSize(this.dynamicAttributeBuffer.float32View,e.length*this._dynamicStride*4,!0),t){let t=this.staticAttributeBuffer;this._staticUpload(e,t.float32View,t.uint32View),this._staticBuffer.setDataWithSize(t.float32View,e.length*this._staticStride*4,!0)}}destroy(){this._staticBuffer.destroy(),this._dynamicBuffer.destroy(),this.geometry.destroy()}};function Zn(e){let t=[];for(let n in e){let r=e[n];t.push(n,r.code,r.dynamic?`d`:`s`)}return t.join(`_`)}var Qn=`varying vec2 vUV;
varying vec4 vColor;

uniform sampler2D uTexture;

void main(void){
    vec4 color = texture2D(uTexture, vUV) * vColor;
    gl_FragColor = color;
}`,$n=`attribute vec2 aVertex;
attribute vec2 aUV;
attribute vec4 aColor;

attribute vec2 aPosition;
attribute float aRotation;

uniform mat3 uTranslationMatrix;
uniform float uRound;
uniform vec2 uResolution;
uniform vec4 uColor;

varying vec2 vUV;
varying vec4 vColor;

vec2 roundPixels(vec2 position, vec2 targetSize)
{       
    return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}

void main(void){
    float cosRotation = cos(aRotation);
    float sinRotation = sin(aRotation);
    float x = aVertex.x * cosRotation - aVertex.y * sinRotation;
    float y = aVertex.x * sinRotation + aVertex.y * cosRotation;

    vec2 v = vec2(x, y);
    v = v + aPosition;

    gl_Position = vec4((uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

    if(uRound == 1.0)
    {
        gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
    }

    vUV = aUV;
    vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uColor;
}
`,er=`
struct ParticleUniforms {
  uTranslationMatrix:mat3x3<f32>,
  uColor:vec4<f32>,
  uRound:f32,
  uResolution:vec2<f32>,
};

fn roundPixels(position: vec2<f32>, targetSize: vec2<f32>) -> vec2<f32>
{
  return (floor(((position * 0.5 + 0.5) * targetSize) + 0.5) / targetSize) * 2.0 - 1.0;
}

@group(0) @binding(0) var<uniform> uniforms: ParticleUniforms;

@group(1) @binding(0) var uTexture: texture_2d<f32>;
@group(1) @binding(1) var uSampler : sampler;

struct VSOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv : vec2<f32>,
    @location(1) color : vec4<f32>,
  };
@vertex
fn mainVertex(
  @location(0) aVertex: vec2<f32>,
  @location(1) aPosition: vec2<f32>,
  @location(2) aUV: vec2<f32>,
  @location(3) aColor: vec4<f32>,
  @location(4) aRotation: f32,
) -> VSOutput {
  
   let v = vec2(
       aVertex.x * cos(aRotation) - aVertex.y * sin(aRotation),
       aVertex.x * sin(aRotation) + aVertex.y * cos(aRotation)
   ) + aPosition;

   var position = vec4((uniforms.uTranslationMatrix * vec3(v, 1.0)).xy, 0.0, 1.0);

   if(uniforms.uRound == 1.0) {
       position = vec4(roundPixels(position.xy, uniforms.uResolution), position.zw);
   }

    let vColor = vec4(aColor.rgb * aColor.a, aColor.a) * uniforms.uColor;

  return VSOutput(
   position,
   aUV,
   vColor,
  );
}

@fragment
fn mainFragment(
  @location(0) uv: vec2<f32>,
  @location(1) color: vec4<f32>,
  @builtin(position) position: vec4<f32>,
) -> @location(0) vec4<f32> {

    var sample = textureSample(uTexture, uSampler, uv) * color;
   
    return sample;
}`,tr=class extends p{constructor(){let e=d.from({vertex:$n,fragment:Qn}),t=h.from({fragment:{source:er,entryPoint:`mainFragment`},vertex:{source:er,entryPoint:`mainVertex`}});super({glProgram:e,gpuProgram:t,resources:{uTexture:o.WHITE.source,uSampler:new n({}),uniforms:{uTranslationMatrix:{value:new r,type:`mat3x3<f32>`},uColor:{value:new l(16777215),type:`vec4<f32>`},uRound:{value:1,type:`f32`},uResolution:{value:[0,0],type:`vec2<f32>`}}}})}},nr=class{constructor(e,t){this.state=oe.for2d(),this.localUniforms=new u({uTranslationMatrix:{value:new r,type:`mat3x3<f32>`},uColor:{value:new Float32Array(4),type:`vec4<f32>`},uRound:{value:1,type:`f32`},uResolution:{value:[0,0],type:`vec2<f32>`}}),this.renderer=e,this.adaptor=t,this.defaultShader=new tr,this.state=oe.for2d(),this._managedContainers=new De({renderer:e,type:`renderable`,name:`particleContainer`})}validateRenderable(e){return!1}addRenderable(e,t){this.renderer.renderPipes.batch.break(t),t.add(e)}getBuffers(e){return e._gpuData[this.renderer.uid]||this._initBuffer(e)}_initBuffer(e){return e._gpuData[this.renderer.uid]=new Xn({size:e.particleChildren.length,properties:e._properties}),this._managedContainers.add(e),e._gpuData[this.renderer.uid]}updateRenderable(e){}execute(e){let t=e.particleChildren;if(t.length===0)return;let n=this.renderer,r=this.getBuffers(e);e.texture||=t[0].texture;let i=this.state;r.update(t,e._childrenDirty),e._childrenDirty=!1,i.blendMode=Ee(e.groupBlendMode,e.texture._source);let a=this.localUniforms.uniforms,o=a.uTranslationMatrix;e.worldTransform.copyTo(o);let s=n.globalUniforms.globalUniformData;o.tx-=s.offset.x,o.ty-=s.offset.y,o.prepend(s.projectionMatrix),a.uResolution=s.resolution,a.uRound=n._roundPixels|e._roundPixels;let c=e.groupColorAlpha,l=s.worldColor,u=(c>>>24)*(l>>>24)/255|0,d=f(c&16777215,l&16777215);be((u<<24|d)>>>0,a.uColor,0),this.adaptor.execute(this,e)}destroy(){this._managedContainers.destroy(),this.renderer=null,this.defaultShader&&=(this.defaultShader.destroy(),null)}};nr.extension={type:[t.CanvasPipes],name:`particle`};var rr=class extends nr{constructor(e){super(e,new Kn)}};rr.extension={type:[t.CanvasPipes],name:`particle`};var ir=class{execute(e,t){let n=e.state,r=e.renderer,i=t.shader||e.defaultShader;i.resources.uTexture=t.texture._source,i.resources.uniforms=e.localUniforms;let a=r.gl,o=e.getBuffers(t);r.shader.bind(i),r.state.set(n),r.geometry.bind(o.geometry,i.glProgram);let s=o.geometry.indexBuffer.data.BYTES_PER_ELEMENT===2?a.UNSIGNED_SHORT:a.UNSIGNED_INT;a.drawElements(a.TRIANGLES,t.particleChildren.length*6,s,0)}},ar=class extends nr{constructor(e){super(e,new ir)}};ar.extension={type:[t.WebGLPipes],name:`particle`};var or=class{execute(e,t){let n=e.renderer,r=t.shader||e.defaultShader;r.groups[0]=n.renderPipes.uniformBatch.getUniformBindGroup(e.localUniforms,!0),r.groups[1]=n.texture.getTextureBindGroup(t.texture);let i=e.state,a=e.getBuffers(t);n.encoder.draw({geometry:a.geometry,shader:t.shader||e.defaultShader,state:i,size:t.particleChildren.length*6})}},sr=class extends nr{constructor(e){super(e,new or)}};sr.extension={type:[t.WebGPUPipes],name:`particle`};var cr=class e{constructor(t){if(t instanceof o)this.texture=t,ce(this,e.defaultOptions,{});else{let n={...e.defaultOptions,...t};ce(this,n,{})}}get alpha(){return this._alpha}set alpha(e){this._alpha=Math.min(Math.max(e,0),1),this._updateColor()}get tint(){return ae(this._tint)}set tint(e){this._tint=l.shared.setValue(e??16777215).toBgrNumber(),this._updateColor()}_updateColor(){this.color=this._tint+((this._alpha*255|0)<<24)}};cr.defaultOptions={anchorX:0,anchorY:0,x:0,y:0,scaleX:1,scaleY:1,rotation:0,tint:16777215,alpha:1};var lr=cr,ur={vertex:{attributeName:`aVertex`,format:`float32x2`,code:`
            const texture = p.texture;
            const sx = p.scaleX;
            const sy = p.scaleY;
            const ax = p.anchorX;
            const ay = p.anchorY;
            const trim = texture.trim;
            const orig = texture.orig;

            if (trim)
            {
                w1 = trim.x - (ax * orig.width);
                w0 = w1 + trim.width;

                h1 = trim.y - (ay * orig.height);
                h0 = h1 + trim.height;
            }
            else
            {
                w1 = -ax * (orig.width);
                w0 = w1 + orig.width;

                h1 = -ay * (orig.height);
                h0 = h1 + orig.height;
            }

            f32v[offset] = w1 * sx;
            f32v[offset + 1] = h1 * sy;

            f32v[offset + stride] = w0 * sx;
            f32v[offset + stride + 1] = h1 * sy;

            f32v[offset + (stride * 2)] = w0 * sx;
            f32v[offset + (stride * 2) + 1] = h0 * sy;

            f32v[offset + (stride * 3)] = w1 * sx;
            f32v[offset + (stride * 3) + 1] = h0 * sy;
        `,dynamic:!1},position:{attributeName:`aPosition`,format:`float32x2`,code:`
            var x = p.x;
            var y = p.y;

            f32v[offset] = x;
            f32v[offset + 1] = y;

            f32v[offset + stride] = x;
            f32v[offset + stride + 1] = y;

            f32v[offset + (stride * 2)] = x;
            f32v[offset + (stride * 2) + 1] = y;

            f32v[offset + (stride * 3)] = x;
            f32v[offset + (stride * 3) + 1] = y;
        `,dynamic:!0},rotation:{attributeName:`aRotation`,format:`float32`,code:`
            var rotation = p.rotation;

            f32v[offset] = rotation;
            f32v[offset + stride] = rotation;
            f32v[offset + (stride * 2)] = rotation;
            f32v[offset + (stride * 3)] = rotation;
        `,dynamic:!1},uvs:{attributeName:`aUV`,format:`float32x2`,code:`
            var uvs = p.texture.uvs;

            f32v[offset] = uvs.x0;
            f32v[offset + 1] = uvs.y0;

            f32v[offset + stride] = uvs.x1;
            f32v[offset + stride + 1] = uvs.y1;

            f32v[offset + (stride * 2)] = uvs.x2;
            f32v[offset + (stride * 2) + 1] = uvs.y2;

            f32v[offset + (stride * 3)] = uvs.x3;
            f32v[offset + (stride * 3) + 1] = uvs.y3;
        `,dynamic:!1},color:{attributeName:`aColor`,format:`unorm8x4`,code:`
            const c = p.color;

            u32v[offset] = c;
            u32v[offset + stride] = c;
            u32v[offset + (stride * 2)] = c;
            u32v[offset + (stride * 3)] = c;
        `,dynamic:!1}};c.add(ar),c.add(sr),c.add(rr);var dr=new te(0,0,0,0),fr=class e extends S{constructor(t={}){t={...e.defaultOptions,...t,dynamicProperties:{...e.defaultOptions.dynamicProperties,...t?.dynamicProperties}};let{dynamicProperties:n,shader:r,roundPixels:i,texture:a,particles:o,...s}=t;super({label:`ParticleContainer`,...s}),this.renderPipeId=`particle`,this.batched=!1,this._childrenDirty=!1,this.texture=a||null,this.shader=r,this._properties={};for(let e in ur){let t=ur[e],r=n[e];this._properties[e]={...t,dynamic:r}}this.allowChildren=!0,this.roundPixels=i??!1,this.particleChildren=o??[]}addParticle(...e){for(let t=0;t<e.length;t++)this.particleChildren.push(e[t]);return this.onViewUpdate(),e[0]}removeParticle(...e){let t=!1;for(let n=0;n<e.length;n++){let r=this.particleChildren.indexOf(e[n]);r>-1&&(this.particleChildren.splice(r,1),t=!0)}return t&&this.onViewUpdate(),e[0]}update(){this._childrenDirty=!0}onViewUpdate(){this._childrenDirty=!0,super.onViewUpdate()}get bounds(){return dr}updateBounds(){}destroy(e=!1){if(super.destroy(e),typeof e==`boolean`?e:e?.texture){let t=typeof e==`boolean`?e:e?.textureSource,n=this.texture??this.particleChildren[0]?.texture;n&&n.destroy(t)}this.texture=null,this.shader?.destroy()}removeParticles(e,t){e??=0,t??=this.particleChildren.length;let n=this.particleChildren.splice(e,t-e);return this.onViewUpdate(),n}removeParticleAt(e){let t=this.particleChildren.splice(e,1);return this.onViewUpdate(),t[0]}addParticleAt(e,t){return this.particleChildren.splice(t,0,e),this.onViewUpdate(),e}addChild(...e){throw Error(`ParticleContainer.addChild() is not available. Please use ParticleContainer.addParticle()`)}removeChild(...e){throw Error(`ParticleContainer.removeChild() is not available. Please use ParticleContainer.removeParticle()`)}removeChildren(e,t){throw Error(`ParticleContainer.removeChildren() is not available. Please use ParticleContainer.removeParticles()`)}removeChildAt(e){throw Error(`ParticleContainer.removeChildAt() is not available. Please use ParticleContainer.removeParticleAt()`)}getChildAt(e){throw Error(`ParticleContainer.getChildAt() is not available. Please use ParticleContainer.getParticleAt()`)}setChildIndex(e,t){throw Error(`ParticleContainer.setChildIndex() is not available. Please use ParticleContainer.setParticleIndex()`)}getChildIndex(e){throw Error(`ParticleContainer.getChildIndex() is not available. Please use ParticleContainer.getParticleIndex()`)}addChildAt(e,t){throw Error(`ParticleContainer.addChildAt() is not available. Please use ParticleContainer.addParticleAt()`)}swapChildren(e,t){throw Error(`ParticleContainer.swapChildren() is not available. Please use ParticleContainer.swapParticles()`)}reparentChild(...e){throw Error(`ParticleContainer.reparentChild() is not available with the particle container`)}reparentChildAt(e,t){throw Error(`ParticleContainer.reparentChildAt() is not available with the particle container`)}};fr.defaultOptions={dynamicProperties:{vertex:!1,position:!0,rotation:!1,uvs:!1,color:!1},roundPixels:!1};var pr=fr;c.add(at,ot);var mr=new URL(`data:image/webp;base64,UklGRkwDAABXRUJQVlA4WAoAAAAQAAAAPwAAHAAAQUxQSGABAAANkGtr2zE99/PO9/22bduo7BOwKsVJmzq9kwqlqlS2bdt2xvPN944neE4gIiYA/2/HuhXX8S/V5NzIKAC2X79AJIQfl667pOaSmks6PlUM7AAoMlQFpOmXHlRaRWtZLvyHhSFocsGXXKCn9sE5AAQXuYAXu+589Be1ZiQBQYfGBkNCIaGSUIRQAUMN/JOIqpss/3ph/TMdmCwCU6WqfWH7ZpnUC8Zhi/sf1f7mhOySY00aK8weKwHvgtwcZnG5icwoJ5UZmiK45URyI5UbpOBmiuKmqdx+xDO7wu7lxzRe8tGrXF4f39zKj2F10XgzLY2Tth83XfWcbr+Cc9toMp/HOwGcW9vbFRMfE03/mTT+eHriIHzv7zrngisipaEmDIA0PrdbNCXcEMDi0Cwup9nlqFy9d19YSU2KCkB+PXuZQhHYYfxh/PTp+gMDAJ0AwGnVAwQ5/PQIbI9v/1QI0BEkVlA4IMYBAAAwCQCdASpAAB0APrVInkonJCKhs/ZoAOAWiWUAx+utyQbwt2mPgH9yJdQ3RJzf27iXhdoib+AMkOD4QZeX/TnLHGsGU/nOgtzMYbuJf0vJU9noAP5hFaNAW+l9P5Jkadbg8bQPES4bLwZ3asRK+k3Cu14qJI7fqHt7W7s67G56VP77k48zcVu32xOxgUBvwI8mRDl06vMIn+nWieqUXWjhvVp3KH1I0QfYL/LkupNnJxXpr9rHT7rt+oWXMYh8dlCqd/ItdhCqb/ZRmfpfC3qKWyXzju7E/m4/Xal+IEf2rX58m9VN0JOgSY+ipKqYWPXrURrdyfSQAB6oUjlU182HU/YcR7cQEuHIXq49PqWYXJfOcecJOyJu24FtiZqc5d9XTdczEa7LYtXezxV1JlM8yjlxcYdN1f1Q2jaMCoB+BrXuWkaZITcz4tatE9J55GlZnX/NCLKz+ty97//JykMhafmSOvgbcGwrxvG74qsSP29mXebpkang1DV8ayPxnzwM0jYrSAbQopyL7Y7sSLUcOfgCCk6sBon8NPZ/xIAhH+yHrfCTb3cU6+znyTxi6JPqdMZa+G2nQR5dUpiEgppyendrQAAA`,``+import.meta.url).href,hr=4,gr=18,_r=38,vr=4,yr=4,P=8,br=15680580,xr=16096779,Sr=2278750,Cr=4146251,wr=14078929,Tr=.18,Er=1,Dr=4,Or=11,kr=8,Ar=6,jr=.07,Mr=.14,Nr=.24,Pr=2e3,Fr=300,Ir=500,Lr=5,Rr=class{container;padding;roadWidth;vehicleLength;vehicleWidth;preference;app;scene;world;roadsLayer;lanesLayer;trafficLightsLayer;vehiclesLayer;initialized=!1;renderedRoadMap=null;webGl=null;webGlTimerExtension=null;webGlActiveQuery=null;webGlPendingQueries=[];gpuTimingFrameCounter=0;gpuTimingSampleThisFrame=!1;latestGpuTimeMs=null;gpuTimeAvailable=!1;vehicleTexture;trafficLightHousingTexture;trafficLightRedTexture;trafficLightYellowTexture;trafficLightGreenTexture;trafficLightElements=new Map;vehicleParticles=[];staticMapChunks=new Map;mapMinX=0;mapMinY=0;mapMaxX=0;mapMaxY=0;cameraX=0;cameraY=0;viewportWidth=1;viewportHeight=1;resizeObserver;isDragging=!1;dragStartX=0;dragStartY=0;dragOriginX=0;dragOriginY=0;constructor(e){this.container=e.container,this.padding=e.padding,this.roadWidth=e.roadWidth,this.vehicleLength=e.vehicleLength,this.vehicleWidth=e.vehicleWidth,this.preference=e.preference??`webgl`}async initialize(){if(this.initialized)return;let e=window.devicePixelRatio||1,t=Math.min(Math.max(e,1),2);this.app=new gt,await this.app.init({width:1,height:1,resolution:t,autoDensity:!0,antialias:!1,backgroundAlpha:0,autoStart:!1,preference:this.preference}),this.scene=new C,this.world=new C,this.roadsLayer=new C,this.lanesLayer=new C,this.trafficLightsLayer=new C,this.vehiclesLayer=new pr({dynamicProperties:{position:!0,rotation:!0,scale:!1,color:!1},boundsArea:new i(0,0,1,1)}),this.scene.label=`scene`,this.world.label=`world`,this.roadsLayer.label=`roads-layer`,this.lanesLayer.label=`lanes-layer`,this.trafficLightsLayer.label=`traffic-lights-layer`,this.vehiclesLayer.label=`vehicles-layer`,this.vehicleTexture=await this.createVehicleTexture(),this.trafficLightHousingTexture=this.createTrafficLightHousingTexture(),this.trafficLightRedTexture=this.createTrafficLightLampTexture(br),this.trafficLightYellowTexture=this.createTrafficLightLampTexture(xr),this.trafficLightGreenTexture=this.createTrafficLightLampTexture(Sr),this.world.addChild(this.roadsLayer,this.lanesLayer,this.trafficLightsLayer,this.vehiclesLayer),this.scene.addChild(this.world),this.app.stage.addChild(this.scene),this.container.replaceChildren(this.app.canvas),this.app.canvas.style.display=`block`,this.app.canvas.style.width=`100%`,this.app.canvas.style.height=`100%`,this.app.canvas.style.background=`transparent`,this.app.canvas.style.borderRadius=`16px`,this.app.canvas.style.border=`1px solid #475569`,this.app.canvas.style.boxSizing=`border-box`,this.bindPointerEvents(),this.bindResize(),this.initialized=!0,this.setupWebGlGpuTiming(),this.resizeViewport()}render(e){this.initialized&&(e.roadMap!==this.renderedRoadMap&&(this.buildMap(e.roadMap),this.buildTrafficLights(e.trafficLights),this.renderedRoadMap=e.roadMap,this.resizeViewport()),this.updateTrafficLights(e.trafficLights),this.updateVehicles(e.vehicles),this.updateCameraTransform(),this.updateStaticChunkVisibility(),this.updateTrafficLightVisibility(),this.app.render())}beginGpuTiming(){if(this.preference!==`webgl`||(this.gpuTimingFrameCounter+=1,this.gpuTimingSampleThisFrame=this.gpuTimingFrameCounter%Lr===0,!this.gpuTimingSampleThisFrame)||!this.webGl||!this.webGlTimerExtension||this.webGlActiveQuery)return;let e=this.webGl.createQuery();e&&(this.webGl.beginQuery(this.webGlTimerExtension.TIME_ELAPSED_EXT,e),this.webGlActiveQuery=e)}endGpuTiming(){this.preference!==`webgl`||!this.gpuTimingSampleThisFrame||!this.webGl||!this.webGlTimerExtension||!this.webGlActiveQuery||(this.webGl.endQuery(this.webGlTimerExtension.TIME_ELAPSED_EXT),this.webGlPendingQueries.push(this.webGlActiveQuery),this.webGlActiveQuery=null)}consumeGpuTime(){return this.preference!==`webgl`||(this.pollWebGlTiming(),!this.gpuTimeAvailable)?null:(this.gpuTimeAvailable=!1,this.latestGpuTimeMs)}resetGpuTiming(){this.resetWebGlTiming(),this.gpuTimingFrameCounter=0,this.gpuTimingSampleThisFrame=!1,this.latestGpuTimeMs=null,this.gpuTimeAvailable=!1}setupWebGlGpuTiming(){if(this.preference!==`webgl`)return;let e=this.app.renderer;this.webGl=e.gl,this.webGlTimerExtension=this.webGl.getExtension(`EXT_disjoint_timer_query_webgl2`)}pollWebGlTiming(){if(!(!this.webGl||!this.webGlTimerExtension)&&!this.webGl.getParameter(this.webGlTimerExtension.GPU_DISJOINT_EXT))for(let e=this.webGlPendingQueries.length-1;e>=0;--e){let t=this.webGlPendingQueries[e];if(!this.webGl.getQueryParameter(t,this.webGl.QUERY_RESULT_AVAILABLE))continue;let n=this.webGl.getQueryParameter(t,this.webGl.QUERY_RESULT);this.webGl.deleteQuery(t),this.webGlPendingQueries.splice(e,1),this.latestGpuTimeMs=n/1e6,this.gpuTimeAvailable=!0}}resetWebGlTiming(){if(!this.webGl){this.webGlPendingQueries.length=0,this.webGlActiveQuery=null;return}this.webGlActiveQuery&&=(this.webGl.deleteQuery(this.webGlActiveQuery),null);for(let e of this.webGlPendingQueries)this.webGl.deleteQuery(e);this.webGlPendingQueries.length=0}async createVehicleTexture(){let e=await kn.load(mr);if(!e)throw Error(`Unable to load vehicle image: ${mr}`);let t=hr,n=Math.max(1,Math.ceil(this.vehicleLength*t)),r=Math.max(1,Math.ceil(this.vehicleWidth*t)),i=document.createElement(`canvas`);i.width=n,i.height=r;let a=i.getContext(`2d`);if(!a)throw e.destroy(!0),Error(`Unable to create vehicle texture canvas.`);a.imageSmoothingEnabled=!0,a.imageSmoothingQuality=`high`,a.clearRect(0,0,n,r);let s=e.source.resource;if(!this.isCanvasImageSource(s))throw e.destroy(!0),Error(`Vehicle texture source is not a drawable image.`);a.drawImage(s,0,0,n,r);let c=o.from(i,!0);return c.source.scaleMode=`linear`,c.source.autoGenerateMipmaps=!1,e.destroy(!0),c}isCanvasImageSource(e){return typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof HTMLVideoElement<`u`&&e instanceof HTMLVideoElement||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas}createTrafficLightHousingTexture(){let e=Dr,t=document.createElement(`canvas`);t.width=gr*e,t.height=_r*e;let n=t.getContext(`2d`);if(!n)throw Error(`Unable to create traffic light housing texture canvas.`);return n.scale(e,e),this.drawRoundedRectPath(n,.5,.5,gr-1,_r-1,5),n.fillStyle=`#111827`,n.fill(),n.strokeStyle=`#374151`,n.lineWidth=1,n.stroke(),o.from(t,!0)}createTrafficLightLampTexture(e){let t=Dr,n=document.createElement(`canvas`);n.width=P*t,n.height=P*t;let r=n.getContext(`2d`);if(!r)throw Error(`Unable to create traffic light lamp texture canvas.`);return r.scale(t,t),r.beginPath(),r.arc(yr,yr,yr-.25,0,Math.PI*2),r.closePath(),r.fillStyle=this.numberToCssColor(e),r.fill(),o.from(n,!0)}numberToCssColor(e){return`#${e.toString(16).padStart(6,`0`)}`}drawRoundedRectPath(e,t,n,r,i,a){let o=Math.min(a,r/2,i/2);e.beginPath(),e.moveTo(t+o,n),e.lineTo(t+r-o,n),e.quadraticCurveTo(t+r,n,t+r,n+o),e.lineTo(t+r,n+i-o),e.quadraticCurveTo(t+r,n+i,t+r-o,n+i),e.lineTo(t+o,n+i),e.quadraticCurveTo(t,n+i,t,n+i-o),e.lineTo(t,n+o),e.quadraticCurveTo(t,n,t+o,n),e.closePath()}buildMap(e){this.roadsLayer.removeChildren(),this.lanesLayer.removeChildren(),this.staticMapChunks.clear();let t=e.getNodes();if(t.length===0){this.mapMinX=0,this.mapMinY=0,this.mapMaxX=1,this.mapMaxY=1;return}let n=1/0,r=1/0,a=-1/0,o=-1/0;for(let e of t){let t=e.getPosition();n=Math.min(n,t.x),r=Math.min(r,t.y),a=Math.max(a,t.x),o=Math.max(o,t.y)}this.mapMinX=n,this.mapMinY=r,this.mapMaxX=a,this.mapMaxY=o;let s=this.roadWidth/2,c=this.mapMaxX-this.mapMinX+this.padding*2+s*2,l=this.mapMaxY-this.mapMinY+this.padding*2+s*2;this.vehiclesLayer.boundsArea=new i(0,0,Math.max(1,c),Math.max(1,l));for(let t of e.getRoads()){let e=this.getOrCreateStaticChunk(t);this.addRoadGeometry(e.roads,t),this.addLaneDividerGeometry(e.lanes,t)}this.updateStaticChunkVisibility()}getOrCreateStaticChunk(e){let t=e.getNodeA().getPosition(),n=e.getNodeB().getPosition(),r=(this.offsetX(t.x)+this.offsetX(n.x))/2,i=(this.offsetY(t.y)+this.offsetY(n.y))/2,a=Math.floor(r/Pr),o=Math.floor(i/Pr),s=`${a}:${o}`,c=this.staticMapChunks.get(s);if(c)return c;let l=a*Pr-Ir,u=o*Pr-Ir,d=(a+1)*Pr+Ir,f=(o+1)*Pr+Ir,p=new ke,m=new ke;p.label=`roads-chunk-${s}`,m.label=`lanes-chunk-${s}`,this.roadsLayer.addChild(p),this.lanesLayer.addChild(m);let h={roads:p,lanes:m,minX:l,minY:u,maxX:d,maxY:f};return this.staticMapChunks.set(s,h),h}addRoadGeometry(e,t){let n=t.getNodeA().getPosition(),r=t.getNodeB().getPosition(),i=this.offsetX(n.x),a=this.offsetY(n.y),o=this.offsetX(r.x),s=this.offsetY(r.y),c=o-i,l=s-a,u=Math.sqrt(c*c+l*l);if(u===0)return;let d=c/u,f=l/u,p=this.roadWidth/2,m=i-d*p,h=a-f*p,g=o+d*p,_=s+f*p,v=-f*p,y=d*p;e.moveTo(m+v,h+y).lineTo(g+v,_+y).lineTo(g-v,_-y).lineTo(m-v,h-y).closePath(),e.fill({color:Cr,alpha:1})}addLaneDividerGeometry(e,t){let n=t.getNodeA().getPosition(),r=t.getNodeB().getPosition(),i=this.offsetX(n.x),a=this.offsetY(n.y),o=this.offsetX(r.x),s=this.offsetY(r.y),c=o-i,l=s-a,u=Math.sqrt(c*c+l*l);if(u===0)return;let d=c/u,f=l/u,p=-f,m=d,h=.5;for(let t=0;t<u;t+=20){let n=Math.min(10,u-t);if(n<=0)break;let r=i+d*t,o=a+f*t,s=r+d*n,c=o+f*n,l=p*h,g=m*h;e.moveTo(r+l,o+g).lineTo(s+l,c+g).lineTo(s-l,c-g).lineTo(r-l,o-g).closePath()}e.fill({color:wr,alpha:.8})}updateStaticChunkVisibility(){let e=-this.cameraX-Fr,t=-this.cameraY-Fr,n=-this.cameraX+this.viewportWidth+Fr,r=-this.cameraY+this.viewportHeight+Fr;for(let i of this.staticMapChunks.values()){let a=i.maxX>=e&&i.minX<=n&&i.maxY>=t&&i.minY<=r;i.roads.visible=a,i.lanes.visible=a}}buildTrafficLights(e){this.trafficLightsLayer.removeChildren(),this.trafficLightElements.clear();for(let t of e){let e=this.createTrafficLight(t);this.trafficLightElements.set(t.key,e),this.trafficLightsLayer.addChild(e.root)}}createTrafficLight(e){let t=new C;t.position.set(this.offsetX(e.position.x),this.offsetY(e.position.y));let n=new se(this.trafficLightHousingTexture);n.anchor.set(.5,.5),n.width=gr,n.height=_r;let r=this.createLamp(this.trafficLightRedTexture,-15),i=this.createLamp(this.trafficLightYellowTexture,-8/2),a=this.createLamp(this.trafficLightGreenTexture,_r/2-vr-P),o=new Gn({text:``,style:{fontFamily:`Arial, sans-serif`,fontSize:10,fill:15067115}});o.anchor.set(0,.5),o.position.set(14,0),t.addChild(n,r.glowOuter,r.glowMiddle,r.glowInner,i.glowOuter,i.glowMiddle,i.glowInner,a.glowOuter,a.glowMiddle,a.glowInner,r.lamp,i.lamp,a.lamp,o);let s={root:t,housing:n,red:r,yellow:i,green:a,timer:o,lastColor:null,lastTimerText:``};return this.updateTrafficLightObject(s,e),s}createLamp(e,t){let n=new se(e);n.anchor.set(.5,.5),n.width=P,n.height=P,n.position.set(0,t+P/2),n.alpha=Tr;let r=new ke;r.circle(Or,Or,Or).fill({color:16777215,alpha:1}),r.position.set(-11,t+P/2-Or),r.visible=!1,r.alpha=0;let i=new ke;i.circle(kr,kr,kr).fill({color:16777215,alpha:1}),i.position.set(-8,t+P/2-kr),i.visible=!1,i.alpha=0;let a=new ke;return a.circle(Ar,Ar,Ar).fill({color:16777215,alpha:1}),a.position.set(-6,t+P/2-Ar),a.visible=!1,a.alpha=0,{lamp:n,glowOuter:r,glowMiddle:i,glowInner:a}}updateTrafficLights(e){for(let t of e){let e=this.trafficLightElements.get(t.key);e&&this.updateTrafficLightObject(e,t)}}updateTrafficLightObject(e,t){e.lastColor!==t.color&&(e.red.lamp.alpha=t.color===`red`?Er:Tr,e.yellow.lamp.alpha=t.color===`yellow`?Er:Tr,e.green.lamp.alpha=t.color===`green`?Er:Tr,this.setGlowState(e.red,t.color===`red`,br),this.setGlowState(e.yellow,t.color===`yellow`,xr),this.setGlowState(e.green,t.color===`green`,Sr),e.lastColor=t.color);let n=`${(t.remainingTime/1e3).toFixed(1)}s`;e.lastTimerText!==n&&(e.timer.text=n,e.lastTimerText=n)}setGlowState(e,t,n){if(!t){e.glowOuter.visible=!1,e.glowMiddle.visible=!1,e.glowInner.visible=!1;return}e.glowOuter.tint=n,e.glowMiddle.tint=n,e.glowInner.tint=n,e.glowOuter.alpha=jr,e.glowMiddle.alpha=Mr,e.glowInner.alpha=Nr,e.glowOuter.visible=!0,e.glowMiddle.visible=!0,e.glowInner.visible=!0}updateVehicles(e){let t=e.length;this.ensureVehicleCount(t);for(let n=0;n<t;n+=1){let t=e[n],r=this.vehicleParticles[n];r.x=this.offsetX(t.position.x),r.y=this.offsetY(t.position.y),r.rotation=t.angle}}ensureVehicleCount(e){let t=this.vehicleParticles.length;if(e!==t){if(e>t){for(let n=t;n<e;n+=1){let e=this.createVehicle();this.vehicleParticles.push(e),this.vehiclesLayer.addParticle(e)}this.vehiclesLayer.update();return}this.vehiclesLayer.removeParticles(e,t),this.vehicleParticles.length=e}}createVehicle(){let e=this.vehicleTexture.width,t=this.vehicleTexture.height;if(e<=0||t<=0)throw Error(`Vehicle texture has invalid dimensions.`);let n=1/hr;return new lr({texture:this.vehicleTexture,x:0,y:0,scaleX:n,scaleY:n,anchorX:.5,anchorY:.5,rotation:0,tint:16777215})}offsetX(e){return e-this.mapMinX+this.padding}offsetY(e){return e-this.mapMinY+this.padding}updateCameraTransform(){this.world.position.set(this.cameraX,this.cameraY)}resizeViewport(){if(!this.initialized)return;let e=Math.max(1,this.container.clientWidth),t=Math.max(1,this.container.clientHeight);this.viewportWidth=e,this.viewportHeight=t,this.app.renderer.resize(e,t),this.clampCamera(),this.updateCameraTransform(),this.updateStaticChunkVisibility(),this.updateTrafficLightVisibility()}clampCamera(){let e=this.mapMaxX-this.mapMinX+this.padding*2,t=this.mapMaxY-this.mapMinY+this.padding*2,n=Math.min(0,this.viewportWidth-e),r=Math.min(0,this.viewportHeight-t);this.cameraX=Math.min(0,Math.max(n,this.cameraX)),this.cameraY=Math.min(0,Math.max(r,this.cameraY))}updateTrafficLightVisibility(){let e=-this.cameraX,t=-this.cameraY,n=e+this.viewportWidth,r=t+this.viewportHeight;for(let i of this.trafficLightElements.values()){let a=i.root.x,o=i.root.y;i.root.visible=a>=e-50&&a<=n+50&&o>=t-50&&o<=r+50}}bindPointerEvents(){let e=this.app.canvas;e.style.touchAction=`none`,e.addEventListener(`pointerdown`,this.handlePointerDown),e.addEventListener(`pointermove`,this.handlePointerMove),e.addEventListener(`pointerup`,this.handlePointerUp),e.addEventListener(`pointercancel`,this.handlePointerUp),e.addEventListener(`pointerleave`,this.handlePointerUp)}unbindPointerEvents(){if(!this.app?.canvas)return;let e=this.app.canvas;e.removeEventListener(`pointerdown`,this.handlePointerDown),e.removeEventListener(`pointermove`,this.handlePointerMove),e.removeEventListener(`pointerup`,this.handlePointerUp),e.removeEventListener(`pointercancel`,this.handlePointerUp),e.removeEventListener(`pointerleave`,this.handlePointerUp)}handlePointerDown=e=>{e.button===0&&(this.isDragging=!0,this.dragStartX=e.clientX,this.dragStartY=e.clientY,this.dragOriginX=this.cameraX,this.dragOriginY=this.cameraY,this.app.canvas.setPointerCapture(e.pointerId))};handlePointerMove=e=>{this.isDragging&&(this.cameraX=this.dragOriginX+(e.clientX-this.dragStartX),this.cameraY=this.dragOriginY+(e.clientY-this.dragStartY),this.clampCamera(),this.updateCameraTransform(),this.updateStaticChunkVisibility(),this.updateTrafficLightVisibility())};handlePointerUp=e=>{this.isDragging&&(this.isDragging=!1,this.app.canvas.hasPointerCapture(e.pointerId)&&this.app.canvas.releasePointerCapture(e.pointerId))};bindResize(){this.resizeObserver=new ResizeObserver(()=>{this.resizeViewport()}),this.resizeObserver.observe(this.container)}destroy(){this.resizeObserver?.disconnect(),this.resizeObserver=void 0,this.unbindPointerEvents(),this.trafficLightElements.clear(),this.vehicleParticles.length=0,this.staticMapChunks.clear(),this.vehicleTexture&&this.vehicleTexture.destroy(!0),this.trafficLightHousingTexture&&this.trafficLightHousingTexture.destroy(!0),this.trafficLightRedTexture&&this.trafficLightRedTexture.destroy(!0),this.trafficLightYellowTexture&&this.trafficLightYellowTexture.destroy(!0),this.trafficLightGreenTexture&&this.trafficLightGreenTexture.destroy(!0),this.resetGpuTiming(),this.webGl=null,this.webGlTimerExtension=null,this.app&&this.app.destroy(!0,{children:!0,texture:!1}),this.container.replaceChildren(),this.initialized=!1,this.renderedRoadMap=null,this.cameraX=0,this.cameraY=0,this.viewportWidth=1,this.viewportHeight=1}};function zr(e,t){switch(e){case`dom`:return new et(t.dom);case`pixi-webgl`:return new Rr({...t.pixiWebgl,preference:`webgl`});case`pixi-webgpu`:return new Rr({...t.pixiWebgpu,preference:`webgpu`});default:throw Error(`Unsupported renderer: ${e}`)}}var Br=38,Vr=30;function Hr(e){return{roadMap:e.getRoadMap(),trafficLights:Ur(e),vehicles:e.getVehicleStates()}}function Ur(e){let t=[];for(let n of e.getRoadMap().getNodes()){let r=e.getTrafficLightSystem().getController(n.getId());if(!r)continue;let i=e.getMovements(n.getId());if(!i||i.length===0)continue;let a=Wr(i,r);for(let[e,r]of a)t.push(Gr(n,e,r))}return t}function Wr(e,t){let n=new Map,r=t.getCurrentPhase(),i=t.getRemainingTime();for(let a of e){let e=a.getIncomingLane(),o=String(e.getId()),s=n.get(o);if(s){s.movements.push(a);continue}let c=t.allowsMovement(a);n.set(o,{color:qr(r.getName(),c),remainingTime:i,movements:[a]})}return n}function Gr(e,t,n){let r=n.movements[0].getIncomingLane();return{key:`${e.getId()}:${t}`,nodeId:e.getId(),position:Kr(r),color:n.color,remainingTime:n.remainingTime}}function Kr(e){let t=e.getStartPosition(),n=e.getEndPosition(),r=n.x-t.x,i=n.y-t.y,a=Math.sqrt(r*r+i*i);if(a===0)return n;let o=r/a,s=i/a,c=-s,l=o;return new Pe(n.x-o*Br+c*Vr,n.y-s*Br+l*Vr)}function qr(e,t){let n=e.trim().toLowerCase();return t?n.includes(`yellow`)?`yellow`:n.includes(`green`)?`green`:`red`:`red`}var Jr=class{recording=!1;recordingRenderer=null;recordingStartedAt=0;recordingSamples=[];recordingMemoryStartMb=null;recordingMemoryPeakMb=null;currentMemoryMb=null;lastMemorySampleTime=0;liveFrameTimes=[];liveFrameTimeLimit=60;latestGpuTimeMs=null;gpuTimes=[];currentMetrics={renderer:`dom`,fps:0,frameTimeMs:0,simulationTimeMs:0,renderTimeMs:0,gpuTimeMs:null,mainThreadUtilization:0,memoryMb:null,vehicleCount:0,frameCount:0};constructor(){this.currentMemoryMb=this.readMemoryMb()}isRecording(){return this.recording}getCurrentMetrics(){return{...this.currentMetrics}}recordGpuTime(e){!Number.isFinite(e)||e<0||(this.latestGpuTimeMs=e,this.recording&&this.gpuTimes.push(e))}resetLiveMetrics(e,t){this.liveFrameTimes.length=0,this.currentMemoryMb=this.readMemoryMb(),this.lastMemorySampleTime=performance.now(),this.latestGpuTimeMs=null,this.gpuTimes.length=0,this.currentMetrics={renderer:e,fps:0,frameTimeMs:0,simulationTimeMs:0,gpuTimeMs:null,renderTimeMs:0,mainThreadUtilization:0,memoryMb:this.currentMemoryMb,vehicleCount:t,frameCount:0}}getEnvironment(){let e=navigator;return{logicalProcessors:navigator.hardwareConcurrency||1,deviceMemoryGb:typeof e.deviceMemory==`number`?e.deviceMemory:null}}startRecording(e){this.recording||(this.recording=!0,this.recordingRenderer=e,this.recordingStartedAt=performance.now(),this.recordingSamples=[],this.gpuTimes.length=0,this.latestGpuTimeMs=null,this.recordingMemoryStartMb=this.readMemoryMb(),this.recordingMemoryPeakMb=this.recordingMemoryStartMb,this.lastMemorySampleTime=performance.now())}stopRecording(e,t,n,r){if(!this.recording)throw Error(`No benchmark recording is active.`);let i=performance.now();this.recording=!1;let a=this.readMemoryMb();a!==null&&(this.recordingMemoryPeakMb===null||a>this.recordingMemoryPeakMb)&&(this.recordingMemoryPeakMb=a);let o=this.recordingSamples,s=Math.max(0,i-this.recordingStartedAt),c={renderer:this.recordingRenderer??e,durationMs:s,frameCount:o.length,averageFps:this.average(o.map(e=>e.fps)),low1PercentFps:this.calculateLow1PercentFps(o),averageFrameTime:this.average(o.map(e=>e.frameTime)),p95FrameTime:this.percentile(o.map(e=>e.frameTime),95),averageSimulationTime:this.average(o.map(e=>e.simulationTime)),p95SimulationTime:this.percentile(o.map(e=>e.simulationTime),95),averageRenderTime:this.average(o.map(e=>e.renderTime)),p95RenderTime:this.percentile(o.map(e=>e.renderTime),95),averageGpuTime:this.gpuTimes.length===0?null:this.average(this.gpuTimes),p95GpuTime:this.gpuTimes.length===0?null:this.percentile(this.gpuTimes,95),peakGpuTime:this.gpuTimes.length===0?null:Math.max(...this.gpuTimes),averageMainThreadUtilization:this.average(o.map(e=>e.mainThreadUtilization)),peakMainThreadUtilization:o.length===0?0:Math.max(...o.map(e=>e.mainThreadUtilization)),memoryStartMb:this.recordingMemoryStartMb,memoryEndMb:a,memoryPeakMb:this.recordingMemoryPeakMb,vehicleCount:t,rows:n,columns:r,environment:this.getEnvironment()};return this.recordingRenderer=null,this.recordingStartedAt=0,this.recordingSamples=[],this.gpuTimes.length=0,this.latestGpuTimeMs=null,this.recordingMemoryStartMb=null,this.recordingMemoryPeakMb=null,c}recordFrame(e,t,n,r,i){let a=Math.max(t,.001);this.liveFrameTimes.push(a),this.liveFrameTimes.length>this.liveFrameTimeLimit&&this.liveFrameTimes.shift();let o=this.average(this.liveFrameTimes),s=o>0?1e3/o:0,c=n+r,l=Math.min(100,Math.max(0,c/a*100));e-this.lastMemorySampleTime>=250&&(this.currentMemoryMb=this.readMemoryMb(),this.lastMemorySampleTime=e,this.recording&&this.currentMemoryMb!==null&&(this.recordingMemoryPeakMb===null||this.currentMemoryMb>this.recordingMemoryPeakMb)&&(this.recordingMemoryPeakMb=this.currentMemoryMb)),this.currentMetrics={renderer:this.recordingRenderer??this.currentMetrics.renderer,fps:s,frameTimeMs:a,simulationTimeMs:n,gpuTimeMs:this.latestGpuTimeMs,renderTimeMs:r,mainThreadUtilization:l,memoryMb:this.currentMemoryMb,vehicleCount:i,frameCount:this.currentMetrics.frameCount+1},this.recording&&this.recordingSamples.push({timestamp:e,frameTime:a,simulationTime:n,renderTime:r,fps:s,mainThreadUtilization:l})}readMemoryMb(){let e=performance.memory;return e?e.usedJSHeapSize/(1024*1024):null}calculateLow1PercentFps(e){if(e.length===0)return 0;let t=e.map(e=>e.frameTime).sort((e,t)=>t-e),n=Math.max(1,Math.ceil(t.length*.01)),r=t.slice(0,n),i=this.average(r);return i>0?1e3/i:0}average(e){if(e.length===0)return 0;let t=0;for(let n of e)t+=n;return t/e.length}percentile(e,t){if(e.length===0)return 0;let n=[...e].sort((e,t)=>e-t),r=t/100*(n.length-1),i=Math.floor(r),a=Math.ceil(r);if(i===a)return n[i];let o=r-i;return n[i]+(n[a]-n[i])*o}},Yr=class{monitor;callbacks;running=!1;constructor(e,t){this.monitor=e,this.callbacks=t}isRunning(){return this.running}async run(e,t={}){if(this.running)throw Error(`A benchmark suite is already running.`);this.validateConfig(e),this.running=!0;let n=[],r=e.setups.length*e.renderers.length,i=0;try{for(let a of e.setups)for(let o of e.renderers){t.onProgress?.({completedRuns:i,totalRuns:r,setup:a,renderer:o,phase:`reset`});let s=!1;try{s=await this.callbacks.prepareRun(a,o,e.seed)}catch(e){n.push({setup:a,renderer:o,status:`failed`,snapshot:null,reason:Zr(e)}),i+=1;continue}if(!s){n.push({setup:a,renderer:o,status:`skipped`,snapshot:null,reason:`${o} is unavailable.`}),i+=1;continue}e.warmupMs>0&&(t.onProgress?.({completedRuns:i,totalRuns:r,setup:a,renderer:o,phase:`warmup`}),await Xr(e.warmupMs)),t.onProgress?.({completedRuns:i,totalRuns:r,setup:a,renderer:o,phase:`recording`});try{this.monitor.startRecording(o),await Xr(e.durationMs);let t=this.monitor.stopRecording(o,this.callbacks.getVehicleCount(),a.rows,a.columns);n.push({setup:a,renderer:o,status:`complete`,snapshot:t,reason:null})}catch(e){if(this.monitor.isRecording())try{this.monitor.stopRecording(o,this.callbacks.getVehicleCount(),a.rows,a.columns)}catch{}n.push({setup:a,renderer:o,status:`failed`,snapshot:null,reason:Zr(e)}),i+=1;continue}i+=1}return n}finally{this.running=!1}}validateConfig(e){if(!Number.isInteger(e.seed)||e.seed<0)throw Error(`Benchmark suite seed must be a non-negative integer.`);if(!Number.isInteger(e.warmupMs)||e.warmupMs<0)throw Error(`Benchmark warmup duration must be a non-negative integer.`);if(!Number.isInteger(e.durationMs)||e.durationMs<=0)throw Error(`Benchmark recording duration must be a positive integer.`);if(e.renderers.length===0)throw Error(`At least one renderer must be selected.`);if(e.setups.length===0)throw Error(`At least one benchmark setup is required.`);for(let t of e.setups){if(!Number.isInteger(t.rows)||t.rows<2)throw Error(`Setup "${t.name}" has an invalid row count.`);if(!Number.isInteger(t.columns)||t.columns<2)throw Error(`Setup "${t.name}" has an invalid column count.`);if(!Number.isInteger(t.vehicleCount)||t.vehicleCount<1)throw Error(`Setup "${t.name}" has an invalid vehicle count.`)}}};function Xr(e){return new Promise(t=>{window.setTimeout(t,e)})}function Zr(e){return e instanceof Error?e.message:String(e)}var F=25,Qr=1e3,$r=5,ei=10,ti=100,ni={seed:123456789,warmupMs:3e3,durationMs:1e4,renderers:[`dom`,`pixi-webgl`],setups:[{id:`vehicles-1000`,name:`${F}x${F} • 1000 vehicles`,rows:F,columns:F,vehicleCount:1e3},{id:`vehicles-2000`,name:`${F}x${F} • 2000 vehicles`,rows:F,columns:F,vehicleCount:2e3},{id:`vehicles-4000`,name:`${F}x${F} • 4000 vehicles`,rows:F,columns:F,vehicleCount:4e3},{id:`map-20x20`,name:`20x20 • ${Qr} vehicles`,rows:20,columns:20,vehicleCount:Qr},{id:`map-40x40`,name:`40x40 • ${Qr} vehicles`,rows:40,columns:40,vehicleCount:Qr},{id:`map-60x60`,name:`60x60 • ${Qr} vehicles`,rows:60,columns:60,vehicleCount:Qr},{id:`map-60x60`,name:`${$r}x${$r} • ${ti} vehicles`,rows:$r,columns:$r,vehicleCount:ti},{id:`map-60x60`,name:`${ei}x${ei} • ${ti} vehicles`,rows:ei,columns:ei,vehicleCount:ti}]},I={rows:5,columns:5,blockSize:250,roadWidth:30,laneWidth:15,padding:64},ri={greenDuration:1e4,yellowDuration:2e3,allRedDuration:3e3},L={acceleration:30,braking:50,length:18,width:8,maxSpeed:50,count:100,followDistance:20,minimumGap:15,stoppingDistance:35};function ii(){return Math.floor(Math.random()*4294967296)>>>0}var ai=ii();function oi(){return{grid:{...I},trafficLightsPhase:{...ri},vehicles:{...L},seed:ai}}var R={seed:ii(),warmupMs:3e3,durationMs:1e4,renderers:[`dom`,`pixi-webgl`,`pixi-webgpu`],setups:[{id:`setup-1`,name:`Baseline`,rows:I.rows,columns:I.columns,vehicleCount:L.count}]},z=!1,si=[],ci=document.querySelector(`#app`);if(!ci)throw Error(`Could not find #app.`);ci.innerHTML=`
    <div class="simulation-toolbar">
        <div class="simulation-toolbar-left">
            <h1 class="simulation-title">
                Traffic Simulation
            </h1>
            <div class="scenario-controls">
                <label class="scenario-control">
                    <span>Rows</span>
                    <input
                        id="rows-input"
                        type="number"
                        min="2"
                        step="1"
                        value="${I.rows}"
                        inputmode="numeric"
                    />
                </label>
                <label class="scenario-control">
                    <span>Columns</span>
                    <input
                        id="columns-input"
                        type="number"
                        min="2"
                        step="1"
                        value="${I.columns}"
                        inputmode="numeric"
                    />
                </label>
                <label class="scenario-control">
                    <span>Vehicles</span>
                    <input
                        id="vehicles-input"
                        type="number"
                        min="1"
                        step="1"
                        value="${L.count}"
                        inputmode="numeric"
                    />
                </label>
            </div>
        </div>
        <label class="renderer-selector">
            <span>Renderer</span>
            <select id="renderer-select">
                <option value="dom">
                    DOM
                </option>
                <option value="pixi-webgl">
                    PixiJS WebGL
                </option>
                <option value="pixi-webgpu">
                    PixiJS WebGPU
                </option>
            </select>
        </label>
    </div>
    <div class="simulation-body">
        <div class="simulation-main">
            <div
                id="simulation-root"
                class="simulation-scroll"
            >
                <div
                    id="simulation-content"
                    class="simulation-content"
                >
                    <div
                        id="dom-renderer-host"
                        class="renderer-host"
                    ></div>
                    <div
                        id="pixi-webgl-renderer-host"
                        class="renderer-host"
                    ></div>
                    <div
                        id="pixi-webgpu-renderer-host"
                        class="renderer-host"
                    ></div>
                </div>
            </div>
        </div>
        <aside
            id="benchmark-panel"
            class="benchmark-panel"
        >
            <div class="benchmark-panel-header">
                <div>
                    <h2>Benchmark</h2>
                    <span
                        id="benchmark-status"
                        class="benchmark-status"
                    >
                        Live
                    </span>
                </div>
                <div class="benchmark-panel-actions">
                    <button
                        id="benchmark-configure"
                        class="benchmark-record-button"
                        type="button"
                    >
                        Configure Suite
                    </button>
                    <button
                        id="benchmark-suite-run"
                        class="benchmark-record-button benchmark-primary-button"
                        type="button"
                    >
                        Run Standard Suite
                    </button>
                    <button
                        id="benchmark-record"
                        class="benchmark-record-button"
                        type="button"
                    >
                        Record Snapshot
                    </button>
                </div>
            </div>
            <section class="benchmark-section">
                <h3>Current</h3>
                <div
                    id="benchmark-current"
                    class="benchmark-grid"
                ></div>
            </section>
            <section class="benchmark-section">
                <h3>Snapshot</h3>
                <div
                    id="benchmark-snapshot"
                    class="benchmark-snapshot"
                >
                    <div class="benchmark-empty">
                        No snapshot recorded.
                    </div>
                </div>
            </section>
        </aside>
    </div>
    <div
        id="benchmark-config-modal"
        class="benchmark-modal"
        hidden
    >
        <div
            class="benchmark-modal-backdrop"
            data-close-modal="benchmark-config-modal"
        ></div>
        <div
            class="benchmark-modal-dialog benchmark-config-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="benchmark-config-title"
        >
            <div class="benchmark-modal-header">
                <div>
                    <h2 id="benchmark-config-title">
                        Custom Benchmark Suite
                    </h2>
                    <p>
                        Configure a custom benchmark sequence and scenario setups.
                    </p>
                </div>
                <button
                    id="benchmark-config-close"
                    class="benchmark-modal-close"
                    type="button"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>
            <div class="benchmark-config-content">
                <div class="benchmark-config-global">
                    <label class="benchmark-config-field">
                        <span>Warmup (ms)</span>
                        <input
                            id="suite-warmup-input"
                            type="number"
                            min="0"
                            step="500"
                        />
                    </label>
                    <label class="benchmark-config-field">
                        <span>Recording (ms)</span>
                        <input
                            id="suite-duration-input"
                            type="number"
                            min="100"
                            step="500"
                        />
                    </label>
                </div>
                <div class="benchmark-config-group">
                    <div class="benchmark-config-group-header">
                        <div>
                            <h3>Renderers</h3>
                            <span>
                                Runs are executed in the order shown.
                            </span>
                        </div>
                    </div>
                    <div
                        id="suite-renderer-options"
                        class="benchmark-renderer-options"
                    ></div>
                </div>
                <div class="benchmark-config-group">
                    <div class="benchmark-config-group-header">
                        <div>
                            <h3>Scenario setups</h3>
                            <span>
                                Each setup runs once per selected renderer.
                            </span>
                        </div>
                        <button
                            id="suite-add-setup"
                            class="benchmark-record-button"
                            type="button"
                        >
                            Add Setup
                        </button>
                    </div>
                    <div
                        id="suite-setups"
                        class="benchmark-setups"
                    ></div>
                </div>
            </div>
            <div class="benchmark-modal-footer">
                <button
                    id="benchmark-config-cancel"
                    class="benchmark-record-button"
                    type="button"
                >
                    Close
                </button>
                <button
                    id="benchmark-config-run"
                    class="benchmark-record-button benchmark-primary-button"
                    type="button"
                >
                    Run Custom Suite
                </button>
            </div>
        </div>
    </div>
    <div
        id="benchmark-results-modal"
        class="benchmark-modal"
        hidden
    >
        <div
            class="benchmark-modal-backdrop"
            data-close-modal="benchmark-results-modal"
        ></div>
        <div
            class="benchmark-modal-dialog benchmark-results-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="benchmark-results-title"
        >
            <div class="benchmark-modal-header">
                <div>
                    <h2 id="benchmark-results-title">
                        Benchmark Results
                    </h2>
                    <p
                        id="benchmark-results-summary"
                    ></p>
                </div>
                <button
                    id="benchmark-results-close"
                    class="benchmark-modal-close"
                    type="button"
                    aria-label="Close"
                >
                    ×
                </button>
            </div>
            <div
                id="benchmark-results-content"
                class="benchmark-results-content"
            ></div>
            <div class="benchmark-modal-footer">
                <button
                    id="benchmark-results-copy"
                    class="benchmark-record-button"
                    type="button"
                >
                    Copy JSON
                </button>
                <button
                    id="benchmark-results-footer-close"
                    class="benchmark-record-button benchmark-primary-button"
                    type="button"
                >
                    Close
                </button>
            </div>
        </div>
    </div>
`;function B(e){let t=document.querySelector(e);if(!t)throw Error(`Could not find required element: ${e}`);return t}var li=B(`#simulation-content`),ui=B(`#dom-renderer-host`),di=B(`#pixi-webgl-renderer-host`),fi=B(`#pixi-webgpu-renderer-host`),V=B(`#renderer-select`),H=B(`#rows-input`),U=B(`#columns-input`),W=B(`#vehicles-input`),pi=B(`#benchmark-record`),mi=B(`#benchmark-configure`),hi=B(`#benchmark-suite-run`),G=B(`#benchmark-status`),gi=B(`#benchmark-current`),_i=B(`#benchmark-snapshot`),vi=B(`#benchmark-config-modal`),yi=B(`#benchmark-results-modal`),bi=B(`#benchmark-config-close`),xi=B(`#benchmark-config-cancel`),Si=B(`#benchmark-config-run`),Ci=B(`#suite-warmup-input`),wi=B(`#suite-duration-input`),Ti=B(`#suite-renderer-options`),Ei=B(`#suite-setups`),Di=B(`#suite-add-setup`),Oi=B(`#benchmark-results-close`),ki=B(`#benchmark-results-footer-close`),Ai=B(`#benchmark-results-copy`),ji=B(`#benchmark-results-content`),Mi=B(`#benchmark-results-summary`);li.style.position=`relative`;var Ni={dom:ui,"pixi-webgl":di,"pixi-webgpu":fi};for(let e of Object.values(Ni))e.style.position=`absolute`,e.style.inset=`0`,e.style.display=`none`;var K=new Jr,Pi=null;function Fi(e){return e.setups.length*e.renderers.length}var Ii=!1;async function Li(){if(!(`gpu`in navigator))return!1;let e=navigator.gpu;if(!e)return!1;try{return await e.requestAdapter()!==null}catch{return!1}}function Ri(){let e=V.querySelector(`option[value="pixi-webgpu"]`);e&&(e.disabled=!Ii,e.textContent=Ii?`PixiJS WebGPU`:`PixiJS WebGPU (Unavailable)`,oa())}function zi(e){return e!==`pixi-webgpu`||Ii}var q=new $e(oi()),Bi={dom:{container:ui,padding:I.padding,roadWidth:I.roadWidth,vehicleLength:L.length,vehicleWidth:L.width},pixiWebgl:{container:di,padding:I.padding,roadWidth:I.roadWidth,vehicleLength:L.length,vehicleWidth:L.width,preference:`webgl`},pixiWebgpu:{container:fi,padding:I.padding,roadWidth:I.roadWidth,vehicleLength:L.length,vehicleWidth:L.width,preference:`webgpu`}},Vi={dom:zr(`dom`,Bi),"pixi-webgl":zr(`pixi-webgl`,Bi),"pixi-webgpu":zr(`pixi-webgpu`,Bi)},J=`dom`,Hi=Vi.dom,Ui=new Set,Y=!1,X=!1;function Z(e){switch(e){case`dom`:return`DOM`;case`pixi-webgl`:return`PixiJS WebGL`;case`pixi-webgpu`:return`PixiJS WebGPU`}}function Wi(e){for(let t of Object.keys(Ni))Ni[t].style.display=t===e?`block`:`none`}async function Gi(e){if(Ui.has(e))return!0;if(!zi(e))return!1;try{return await Vi[e].initialize(),Ui.add(e),!0}catch(t){return console.error(`Failed to initialize ${Z(e)}.`,t),e===`pixi-webgpu`&&(Ii=!1,Ri()),!1}}function Ki(){Hi.render(Hr(q))}function qi(){return Hi}function Ji(){let e=qi().consumeGpuTime?.()??null;e!==null&&K.recordGpuTime(e)}async function Yi(e){if(X||Y||z||K.isRecording()){V.value=J;return}await Xi(e)}async function Xi(e){if(e===J)return Wi(J),Ui.has(J)&&Ki(),!0;if(!zi(e))return V.value=J,!1;Y=!0;try{return await Gi(e)?(J=e,Hi=Vi[e],V.value=J,Wi(J),K.isRecording()||K.resetLiveMetrics(J,q.getVehicles().length),Ki(),ta=0,na(performance.now()),!0):(V.value=J,!1)}finally{Y=!1}}V.addEventListener(`change`,()=>{Yi(V.value)});function Zi(e){H.disabled=e,U.disabled=e,W.disabled=e}function Qi(e,t,n){let r=Number.parseInt(e.value,10);if(!Number.isInteger(r)||r<n)throw Error(`${t} must be an integer greater than or equal to ${n}.`);return r}async function $i(e,t,n,r){if(!X&&!(!r.force&&e===I.rows&&t===I.columns&&n===L.count)){X=!0;try{I.rows=e,I.columns=t,L.count=n,r.updateInputs&&(H.value=String(e),U.value=String(t),W.value=String(n));let i=new $e(oi()),a=J;if(q=i,Hi.destroy(),Ui.delete(a),!await Gi(a))throw Error(`Failed to reinitialize ${Z(a)}.`);K.resetLiveMetrics(J,q.getVehicles().length),Wi(J),Ki()}finally{X=!1,Sa=performance.now()}}}async function ea(){if(X||Y||z||K.isRecording())return;let e,t,n;try{e=Qi(H,`Rows`,2),t=Qi(U,`Columns`,2),n=Qi(W,`Vehicles`,1)}catch(e){console.error(`Invalid scenario configuration.`,e),H.value=String(I.rows),U.value=String(I.columns),W.value=String(L.count);return}try{await $i(e,t,n,{force:!1,updateInputs:!0}),Pi=null,ra(null),G.textContent=`Live`}catch(e){console.error(`Could not restart simulation.`,e)}}H.addEventListener(`change`,()=>{ea()}),U.addEventListener(`change`,()=>{ea()}),W.addEventListener(`change`,()=>{ea()});for(let e of[H,U,W])e.addEventListener(`keydown`,t=>{t.key===`Enter`&&e.blur()});var ta=0;function na(e){if(e-ta<250)return;ta=e;let t=K.getCurrentMetrics();gi.innerHTML=`
        ${Q(`Renderer`,Z(J))}
        ${Q(`FPS`,t.fps.toFixed(1))}
        ${Q(`Frame`,`${t.frameTimeMs.toFixed(2)} ms`)}
        ${Q(`Simulation`,`${t.simulationTimeMs.toFixed(2)} ms`)}
        ${Q(`Renderer time`,`${t.renderTimeMs.toFixed(2)} ms`)}
        ${Q(`GPU time`,t.gpuTimeMs===null?`N/A`:`${t.gpuTimeMs.toFixed(2)} ms`)}
        ${Q(`Main thread`,`${t.mainThreadUtilization.toFixed(1)}%`)}
        ${Q(`JS heap (Chromium only)`,t.memoryMb===null?`N/A`:`${t.memoryMb.toFixed(1)} MB`)}
        ${Q(`Frame count`,String(t.frameCount))}
        ${Q(`CPU cores`,String(K.getEnvironment().logicalProcessors))}
    `}function Q(e,t){return`
        <div class="benchmark-metric">
            <span class="benchmark-metric-label">${$(e)}</span>
            <strong class="benchmark-metric-value">${$(t)}</strong>
        </div>
    `}function ra(e){if(!e){_i.innerHTML=`
            <div class="benchmark-empty">
                No snapshot recorded.
            </div>
        `;return}let t=e.environment;_i.innerHTML=`
        <div class="benchmark-snapshot-meta">
            <span>
                ${$(Z(e.renderer))}
            </span>
            <span>
                ${(e.durationMs/1e3).toFixed(1)}s
            </span>
        </div>
        <div class="benchmark-grid">
            ${Q(`Average FPS`,e.averageFps.toFixed(1))}
            ${Q(`1% low FPS`,e.low1PercentFps.toFixed(1))}
            ${Q(`Avg frame`,`${e.averageFrameTime.toFixed(2)} ms`)}
            ${Q(`P95 frame`,`${e.p95FrameTime.toFixed(2)} ms`)}
            ${Q(`Avg simulation`,`${e.averageSimulationTime.toFixed(2)} ms`)}
            ${Q(`P95 simulation`,`${e.p95SimulationTime.toFixed(2)} ms`)}
            ${Q(`Avg renderer`,`${e.averageRenderTime.toFixed(2)} ms`)}
            ${Q(`P95 renderer`,`${e.p95RenderTime.toFixed(2)} ms`)}
            ${Q(`Avg GPU`,aa(e.averageGpuTime))}
            ${Q(`P95 GPU`,aa(e.p95GpuTime))}
            ${Q(`Peak GPU`,aa(e.peakGpuTime))}
            ${Q(`Main thread`,`${e.averageMainThreadUtilization.toFixed(1)}%`)}
            ${Q(`Peak main thread`,`${e.peakMainThreadUtilization.toFixed(1)}%`)}
            ${Q(`Memory start`,ia(e.memoryStartMb))}
            ${Q(`Memory end`,ia(e.memoryEndMb))}
            ${Q(`Memory peak`,ia(e.memoryPeakMb))}
            ${Q(`Vehicles`,String(e.vehicleCount))}
            ${Q(`Map`,`${e.rows} × ${e.columns}`)}
            ${Q(`CPU cores`,String(t.logicalProcessors))}
            ${Q(`Device memory`,t.deviceMemoryGb===null?`N/A`:`${t.deviceMemoryGb} GB`)}
        </div>
        <button
            id="benchmark-copy"
            class="benchmark-copy-button"
            type="button">
            Copy Snapshot
        </button>
    `,_i.querySelector(`#benchmark-copy`)?.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(JSON.stringify(e,null,2))}catch{console.warn(`Could not copy benchmark snapshot to clipboard.`)}})}function ia(e){return e===null?`N/A`:`${e.toFixed(1)} MB`}function aa(e){return e===null?`N/A`:`${e.toFixed(2)} ms`}pi.addEventListener(`click`,()=>{if(!(z||Y||X)){if(K.isRecording()){Pi=K.stopRecording(J,q.getVehicles().length,I.rows,I.columns),G.textContent=`Complete`,pi.textContent=`Record Snapshot`,V.disabled=!1,Zi(!1),hi.disabled=!1,mi.disabled=!1,ra(Pi),na(performance.now());return}qi().resetGpuTiming?.(),K.startRecording(J),G.textContent=`Recording…`,pi.textContent=`Stop Recording`,V.disabled=!0,Zi(!0),hi.disabled=!0,mi.disabled=!0}});function oa(){Ti.innerHTML=[`dom`,`pixi-webgl`,`pixi-webgpu`].map(e=>{let t=R.renderers.includes(e),n=!zi(e);return`
                <label class="benchmark-renderer-option">
                    <input
                        type="checkbox"
                        data-suite-renderer="${e}"
                        ${t&&!n?`checked`:``}
                        ${n?`disabled`:``}
                    />
                    <span>
                        ${$(Z(e))}
                    </span>
                    ${n?`
                                <small>
                                    Unavailable
                                </small>
                            `:``}
                </label>
            `}).join(``)}function sa(){Ei.innerHTML=R.setups.map((e,t)=>`
                    <div
                        class="benchmark-setup-row"
                        data-setup-id="${$(e.id)}"
                    >
                        <div class="benchmark-setup-index">
                            ${t+1}
                        </div>
                        <label class="benchmark-config-field">
                            <span>Name</span>
                            <input
                                type="text"
                                data-field="name"
                                value="${$(e.name)}"
                            />
                        </label>
                        <label class="benchmark-config-field">
                            <span>Rows</span>
                            <input
                                type="number"
                                min="2"
                                step="1"
                                data-field="rows"
                                value="${e.rows}"
                            />
                        </label>
                        <label class="benchmark-config-field">
                            <span>Columns</span>
                            <input
                                type="number"
                                min="2"
                                step="1"
                                data-field="columns"
                                value="${e.columns}"
                            />
                        </label>
                        <label class="benchmark-config-field">
                            <span>Vehicles</span>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                data-field="vehicleCount"
                                value="${e.vehicleCount}"
                            />
                        </label>
                        <button
                            class="benchmark-remove-setup"
                            type="button"
                            data-remove-setup="${$(e.id)}"
                            ${R.setups.length<=1?`disabled`:``}
                        >
                            Remove
                        </button>
                    </div>
                `).join(``)}function ca(){Ci.value=String(R.warmupMs),wi.value=String(R.durationMs),oa(),sa(),vi.hidden=!1}function la(){vi.hidden=!0}function ua(){let e=Array.from(Ei.querySelectorAll(`.benchmark-setup-row`));if(e.length===0)throw Error(`Add at least one setup.`);return e.map((e,t)=>{let n=e.dataset.setupId??`setup-${t+1}`,r=fa(e,`name`),i=fa(e,`rows`),a=fa(e,`columns`),o=fa(e,`vehicleCount`),s=r.value.trim()||`Setup ${t+1}`;return{id:n,name:s,rows:ha(i,`Rows for ${s}`,2),columns:ha(a,`Columns for ${s}`,2),vehicleCount:ha(o,`Vehicles for ${s}`,1)}})}function da(){let e=pa(Ci,`Warmup duration`),t=ma(wi,`Recording duration`),n=Array.from(Ti.querySelectorAll(`input[data-suite-renderer]:checked`)).map(e=>e.dataset.suiteRenderer);if(n.length===0)throw Error(`Select at least one renderer.`);return{seed:ai,warmupMs:e,durationMs:t,renderers:n,setups:ua()}}function fa(e,t){let n=e.querySelector(`input[data-field="${t}"]`);if(!n)throw Error(`Could not find setup field: ${t}`);return n}function pa(e,t){return ha(e,t,0)}function ma(e,t){return ha(e,t,1)}function ha(e,t,n){let r=Number.parseInt(e.value,10);if(!Number.isInteger(r)||r<n)throw Error(`${t} must be an integer greater than or equal to ${n}.`);return r}Di.addEventListener(`click`,()=>{try{let e=ua();R.setups=e;let t=R.setups.length+1;R.setups.push({id:`setup-${Date.now()}-${t}`,name:`Setup ${t}`,rows:I.rows,columns:I.columns,vehicleCount:L.count}),sa()}catch(e){console.error(`Could not add benchmark setup.`,e),window.alert(e instanceof Error?e.message:String(e))}}),Ei.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof HTMLButtonElement))return;let n=t.dataset.removeSetup;if(n&&!(R.setups.length<=1)){try{R.setups=ua()}catch(e){console.error(`Could not save benchmark setups.`,e),window.alert(e instanceof Error?e.message:String(e));return}R.setups=R.setups.filter(e=>e.id!==n),sa()}}),mi.addEventListener(`click`,()=>{z||K.isRecording()||ca()}),bi.addEventListener(`click`,la),xi.addEventListener(`click`,la);for(let e of document.querySelectorAll(`[data-close-modal]`))e.addEventListener(`click`,()=>{let t=e.dataset.closeModal;t===`benchmark-config-modal`&&la(),t===`benchmark-results-modal`&&ba()});var ga=new Yr(K,{prepareRun:async(e,t,n)=>{ai=n,await $i(e.rows,e.columns,e.vehicleCount,{force:!0,updateInputs:!0});let r=await Xi(t);return r&&qi().resetGpuTiming?.(),r},getVehicleCount:()=>q.getVehicles().length});function _a(e){mi.disabled=e,hi.disabled=e,pi.disabled=e,V.disabled=e,Zi(e),Di.disabled=e,Si.disabled=e}async function va(e){if(z||K.isRecording()||X||Y)return;let t=I.rows,n=I.columns,r=L.count,i=J,a=ai;z=!0,_a(!0),Pi=null,ra(null),si=[];let o=Fi(e);try{G.textContent=`Suite starting • 1/${o}`,si=await ga.run(e,{onProgress:({completedRuns:e,totalRuns:t,setup:n,renderer:r,phase:i})=>{let a=`Recording`;i===`reset`?a=`Resetting`:i===`warmup`&&(a=`Warming up`);let o=Math.min(e+1,t);G.textContent=`${a} • ${n.name} • ${Z(r)} • ${o}/${t}`}})}catch(e){console.error(`Benchmark suite failed.`,e)}finally{G.textContent=`Restoring scenario…`;try{ai=a,await $i(t,n,r,{force:!0,updateInputs:!0}),await Xi(i)}catch(e){console.error(`Could not restore scenario after benchmark suite.`,e)}z=!1,_a(!1),G.textContent=`Complete`,na(performance.now()),xa(si),ya()}}hi.addEventListener(`click`,()=>{z||K.isRecording()||X||Y||va(ni)}),Si.addEventListener(`click`,()=>{if(z)return;let e;try{e=da()}catch(e){console.error(`Invalid custom benchmark suite configuration.`,e),window.alert(e instanceof Error?e.message:String(e));return}e.seed=ii(),R=e,la(),va(e)});function ya(){yi.hidden=!1}function ba(){yi.hidden=!0}Oi.addEventListener(`click`,ba),ki.addEventListener(`click`,ba),Ai.addEventListener(`click`,async()=>{try{await navigator.clipboard.writeText(JSON.stringify(si,null,2))}catch{console.warn(`Could not copy benchmark suite results.`)}});function xa(e){if(Mi.textContent=`${e.filter(e=>e.status===`complete`).length} complete · ${e.filter(e=>e.status===`skipped`).length} skipped · ${e.filter(e=>e.status===`failed`).length} failed`,e.length===0){ji.innerHTML=`
            <div class="benchmark-empty">
                No benchmark results were produced.
            </div>
        `;return}ji.innerHTML=`
        <div class="benchmark-results-table-wrapper">
            <table class="benchmark-results-table">
                <thead>
                    <tr>
                        <th>Setup</th>
                        <th>Renderer</th>
                        <th>Status</th>
                        <th>Map Size</th>
                        <th>Vehicles</th>
                        <th>Avg FPS</th>
                        <th>1% Low</th>
                        <th>Avg Frame</th>
                        <th>P95 Frame</th>
                        <th>Avg Sim</th>
                        <th>P95 Sim</th>
                        <th>Avg Render</th>
                        <th>Avg GPU</th>
                        <th>P95 GPU</th>
                        <th>Main Thread</th>
                        <th>Memory Peak</th>
                    </tr>
                </thead>
                <tbody>
                    ${e.map(e=>{let t=e.snapshot,n=e.status===`complete`?`Complete`:e.status===`skipped`?`Skipped`:`Failed`;return t?`
                <tr>
                    <td>
                        ${$(e.setup.name)}
                    </td>
                    <td>
                        ${$(Z(e.renderer))}
                    </td>
                    <td>
                        <span class="benchmark-result-status is-complete">
                            Complete
                        </span>
                    </td>
                    <td>
                        ${t.rows} × ${t.columns}
                    </td>
                    <td>
                        ${t.vehicleCount}
                    </td>
                    <td>
                        ${t.averageFps.toFixed(1)}
                    </td>
                    <td>
                        ${t.low1PercentFps.toFixed(1)}
                    </td>
                    <td>
                        ${t.averageFrameTime.toFixed(2)} ms
                    </td>
                    <td>
                        ${t.p95FrameTime.toFixed(2)} ms
                    </td>
                    <td>
                        ${t.averageSimulationTime.toFixed(2)} ms
                    </td>
                    <td>
                        ${t.p95SimulationTime.toFixed(2)} ms
                    </td>
                    <td>
                        ${t.averageRenderTime.toFixed(2)} ms
                    </td>
                    <td>
                        ${aa(t.averageGpuTime)}
                    </td>
                    <td>
                        ${aa(t.p95GpuTime)}
                    </td>
                    <td>
                        ${t.averageMainThreadUtilization.toFixed(1)}%
                    </td>
                    <td>
                        ${ia(t.memoryPeakMb)}
                    </td>
                </tr>
            `:`
                    <tr>
                        <td>
                            ${$(e.setup.name)}
                        </td>
                        <td>
                            ${$(Z(e.renderer))}
                        </td>
                        <td>
                            <span class="benchmark-result-status is-${e.status}">
                                ${n}
                            </span>
                        </td>
                        <td colspan="14">
                            ${$(e.reason??``)}
                        </td>
                    </tr>
                `}).join(``)}
                </tbody>
            </table>
        </div>
    `}function $(e){return e.replaceAll(`&`,`&amp;`).replaceAll(`<`,`&lt;`).replaceAll(`>`,`&gt;`).replaceAll(`"`,`&quot;`).replaceAll(`'`,`&#039;`)}var Sa=performance.now();function Ca(e){if(X||Y){Sa=e,requestAnimationFrame(Ca);return}try{let t=performance.now(),n=Math.min(e-Sa,100);Sa=e;let r=performance.now();q.update(n);let i=performance.now()-r,a=Hr(q),o=performance.now(),s=qi();s.beginGpuTiming?.();try{Hi.render(a)}finally{s.endGpuTiming?.()}let c=performance.now()-o;Ji();let l=performance.now()-t;K.recordFrame(e,l,i,c,q.getVehicles().length),na(e)}catch(e){console.error(`Simulation frame failed.`,e)}requestAnimationFrame(Ca)}if(Ii=await Li(),Ri(),!await Gi(`dom`))throw Error(`Failed to initialize the DOM renderer.`);J=`dom`,Hi=Vi.dom,V.value=`dom`,Wi(`dom`),K.resetLiveMetrics(`dom`,q.getVehicles().length),Ki(),ra(Pi),oa(),sa(),Sa=performance.now(),requestAnimationFrame(Ca);