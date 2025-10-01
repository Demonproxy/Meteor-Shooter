<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Meteor Shooter</title>
<link rel="icon" type="image/png" href="/meteor-shooter.png" />
<style>
html,body{margin:0;padding:0;background:#000;display:flex;align-items:center;justify-content:center;height:100%;overflow:hidden;}
canvas{background:#000;image-rendering:pixelated;}
button{font-family:monospace;image-rendering:pixelated;}
#restart,#playBtn{position:absolute;left:50%;transform:translateX(-50%);
background:#66ff99;border:none;padding:12px 24px;font-size:18px;cursor:pointer;z-index:10;border:3px solid #0f0;box-shadow:0 0 8px #0f0;text-shadow:1px 1px #000;}
#restart{top:65%;display:none;}
#playBtn{top:60%;}
</style>
</head>
<body>
<canvas id="c"></canvas>
<button id="playBtn">PLAY</button>
<script>
const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
let CANVAS_SIZE=Math.min(window.innerWidth,window.innerHeight);
canvas.width=canvas.height=CANVAS_SIZE;

const PLAYER={x:CANVAS_SIZE/2-15,y:CANVAS_SIZE-100,w:30,h:30,speed:220};
let keys={}, last=0, gameOver=false, score=0, spawnTimer=0, gameStarted=false;
const BULLET_SPEED=400,FIRE_RATE=0.5;
let shootTimer=0;
const bullets=[],obstacles=[],stars=[];
for(let i=0;i<50;i++) stars.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,size:Math.random()*2+1,speed:Math.random()*20+10});
let highScore=parseInt(localStorage.getItem('highScore'))||0;

const METEOR_VARIATIONS=[
{pattern:[[0,0,0,5,5,0,0,0],[0,0,0,4,5,0,0,0],[0,0,4,5,4,5,0,0],[0,0,5,5,5,5,0,0],[0,0,4,4,4,5,0,0],[0,5,5,4,4,4,5,0],[0,4,4,4,5,4,4,0],[4,4,5,4,4,4,5,4],[5,4,1,1,1,1,4,4],[4,1,3,1,1,1,1,4],[1,2,2,2,1,1,2,1],[1,3,2,2,3,1,1,1],[1,1,1,2,2,1,1,1],[0,1,2,1,1,2,1,0],[0,0,1,1,1,1,0,0]],colors:{1:'#a33',2:'#f55',3:'#722',4:'#ff6600',5:'#ffcc00'},rockStartRow:8,rockHeightRows:7},
{pattern:[[0,0,0,5,5,0,0,0],[0,0,0,4,5,0,0,0],[0,0,4,5,4,5,0,0],[0,0,5,5,5,5,0,0],[0,0,4,4,4,5,0,0],[0,5,5,4,4,4,5,0],[0,4,4,4,5,4,4,0],[4,4,5,4,4,4,5,4],[5,4,3,1,3,1,4,4],[4,3,1,3,1,3,1,4],[2,3,2,1,3,1,2,3],[3,1,3,2,1,3,1,1],[1,2,1,3,2,1,3,1],[0,1,3,1,3,2,1,0],[0,0,1,3,1,1,0,0]],colors:{1:'#a33',2:'#f55',3:'#722',4:'#ff6600',5:'#ffcc00'},rockStartRow:8,rockHeightRows:7},
{pattern:[[0,0,0,5,5,0,0,0],[0,0,0,4,5,0,0,0],[0,0,4,5,4,5,0,0],[0,0,5,5,5,5,0,0],[0,0,4,4,4,5,0,0],[0,5,5,4,4,4,5,0],[0,4,4,4,5,4,4,0],[4,4,5,4,4,4,5,4],[5,4,1,2,1,2,4,4],[4,2,3,2,1,2,2,4],[1,2,1,3,2,1,2,1],[2,3,2,1,3,2,1,2],[1,2,1,2,1,2,1,1],[0,1,2,1,2,2,1,0],[0,0,1,1,2,1,0,0]],colors:{1:'#a33',2:'#f55',3:'#722',4:'#ff6600',5:'#ffcc00'},rockStartRow:8,rockHeightRows:7},
{pattern:[[0,0,0,5,5,0,0,0],[0,0,0,4,5,0,0,0],[0,0,4,5,4,5,0,0],[0,0,5,5,5,5,0,0],[0,0,4,4,4,5,0,0],[0,5,5,4,4,4,5,0],[0,4,4,4,5,4,4,0],[4,4,5,4,4,4,5,4],[5,4,1,1,1,1,4,4],[4,1,1,1,1,1,1,4],[1,1,2,1,1,1,1,1],[1,1,1,2,1,1,1,1],[1,1,1,1,2,1,1,1],[0,1,1,1,1,1,1,0],[0,0,1,1,1,1,0,0]],colors:{1:'#811',2:'#a33',3:'#600',4:'#ff6600',5:'#ffcc00'},rockStartRow:8,rockHeightRows:7},
{pattern:[[0,0,0,5,5,0,0,0],[0,0,0,4,5,0,0,0],[0,0,4,5,4,5,0,0],[0,0,5,5,5,5,0,0],[0,0,4,4,4,5,0,0],[0,5,5,4,4,4,5,0],[0,4,4,4,5,4,4,0],[4,4,5,4,4,4,5,4],[5,4,2,3,2,3,4,4],[4,3,1,3,1,2,2,4],[1,2,1,2,3,1,2,3],[2,3,2,1,3,2,1,2],[1,2,1,3,2,1,3,1],[0,1,2,1,3,2,1,0],[0,0,3,1,2,1,0,0]],colors:{1:'#ff9933',2:'#cc0000',3:'#330000',4:'#ff6600',5:'#ffcc00'},rockStartRow:8,rockHeightRows:7}
];

const shipPattern=[[0,0,0,1,1,0,0,0],[0,0,1,2,2,1,0,0],[0,1,2,3,3,2,1,0],[1,2,3,4,4,3,2,1],[1,2,3,3,3,3,2,1],[2,2,2,2,2,2,2,2],[5,1,5,0,0,5,1,5],[0,0,0,6,6,0,0,0]];

function spawnObstacle(){const w=(Math.floor(Math.random()*4)+3)*8,hp=w/8-2,xp=w/8*10,typeIndex=Math.floor(Math.random()*METEOR_VARIATIONS.length);obstacles.push({x:Math.random()*(canvas.width-w),y:-w,size:w,speed:80+Math.random()*100,type:typeIndex,hp:hp,xpValue:xp});}
function shoot(){bullets.push({x:PLAYER.x+PLAYER.w/2-2,y:PLAYER.y,w:4,h:8,speed:BULLET_SPEED});}
function collide(a,b){const m=METEOR_VARIATIONS[b.type],px=b.size/8,offsetY=m.rockStartRow*px,h=m.rockHeightRows*px;return a.x<b.x+b.size&&a.x+a.w>b.x&&a.y<b.y+offsetY+h&&a.y+a.h>b.y+offsetY;}
function bulletCollide(b,m){const mt=METEOR_VARIATIONS[m.type],px=m.size/8,offsetY=mt.rockStartRow*px,h=mt.rockHeightRows*px;return b.x<m.x+m.size&&b.x+b.w>m.x&&b.y<m.y+offsetY+h&&b.y+b.h>m.y+offsetY;}
function drawMeteor(x,y,size,type,hp){const m=METEOR_VARIATIONS[type],p=m.pattern,colors=m.colors,rows=p.length,px=size/8;for(let r=0;r<rows;r++){for(let cI=0;cI<8;cI++){const v=p[r][cI];if(v===0)continue;ctx.fillStyle=colors[v]||'#722';ctx.fillRect(x+cI*px,y+r*px,px,px);}}}
function drawPlayer(){const g=8,px=PLAYER.w/g,c={1:'#66ffcc',2:'#33ccff',3:'#ccffff',4:'#006699',5:'#999999',6:'#ffff00'};for(let r=0;r<g;r++){for(let cI=0;cI<g;cI++){const v=shipPattern[r][cI];if(v===0)continue;ctx.fillStyle=c[v];ctx.fillRect(PLAYER.x+cI*px,PLAYER.y+r*px,px,px);}}}
function drawBullets(){ctx.fillStyle='#00ffff';for(const b of bullets)ctx.fillRect(b.x,b.y,b.w,b.h);}
function update(dt){if(!gameStarted)return;if(gameOver)return;const isMobile=/Mobi|Android/i.test(navigator.userAgent);if(isMobile){keys.shoot=true;}if(keys.left)PLAYER.x-=PLAYER.speed*dt;if(keys.right)PLAYER.x+=PLAYER.speed*dt;PLAYER.x=Math.max(0,Math.min(canvas.width-PLAYER.w,PLAYER.x));shootTimer+=dt;if(keys.shoot&&shootTimer>=FIRE_RATE){shoot();shootTimer=0;}for(let i=bullets.length-1;i>=0;i--){const b=bullets[i];b.y-=b.speed*dt;if(b.y+b.h<0){bullets.splice(i,1);continue;}for(let j=obstacles.length-1;j>=0;j--){const o=obstacles[j];if(bulletCollide(b,o)){o.hp--;if(o.hp<=0){score+=o.xpValue;obstacles.splice(j,1);}bullets.splice(i,1);break;}}}spawnTimer+=dt;if(spawnTimer>0.6){spawnObstacle();spawnTimer=0;}for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i];o.y+=o.speed*dt;if(collide(PLAYER,o)){gameOver=true;if(score>highScore){highScore=score;localStorage.setItem('highScore',highScore);}}if(o.y>canvas.height+50){obstacles.splice(i,1);score+=1;}o.speed+=dt*2;}}
function resetGame(){PLAYER.x=canvas.width/2-15;PLAYER.y=canvas.height-100;obstacles.length=0;bullets.length=0;score=0;gameOver=false;shootTimer=0;document.getElementById('restart').style.display='none';}
function draw(){
ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.fillStyle='#555';for(const s of stars){s.y+=s.speed*0.016;if(s.y>canvas.height)s.y=0;ctx.fillRect(s.x,s.y,s.size,s.size);}
if(gameStarted){if(!gameOver)drawPlayer();drawBullets();for(const o of obstacles)drawMeteor(o.x,o.y,o.size,o.type,o.hp);
ctx.fillStyle='#ddd';ctx.font='16px monospace';ctx.fillText('Score: '+String(score).padStart(4,'0'),10,20);ctx.textAlign='right';ctx.fillText('High Score: '+String(highScore).padStart(4,'0'),canvas.width-10,20);ctx.textAlign='left';
if(gameOver){ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(0,canvas.height/2-50,canvas.width,120);ctx.fillStyle='#fff';ctx.font='28px monospace';ctx.textAlign='center';ctx.fillText('Game Over',canvas.width/2,canvas.height/2-10);ctx.font='16px monospace';ctx.fillText('Final Score: '+score,canvas.width/2,canvas.height/2+20);if(score===highScore&&score>0){ctx.fillStyle='#66ff99';ctx.fillText('NEW HIGH SCORE!',canvas.width/2,canvas.height/2+45);}else{ctx.fillStyle='#ddd';ctx.fillText('High Score: '+highScore,canvas.width/2,canvas.height/2+45);}document.getElementById('restart').style.display='block';}}
else{ctx.fillStyle='#fff';ctx.font='32px monospace';ctx.textAlign='center';ctx.fillText('METEOR SHOOTER',canvas.width/2,canvas.height/2-60);ctx.font='16px monospace';ctx.fillText('by MarkGames',canvas.width/2,canvas.height/2-30);
ctx.font='14px monospace';ctx.textAlign='right';ctx.fillText('HOW TO PLAY: Arrow keys / A-D to move, Space to shoot',canvas.width-10,canvas.height-20);ctx.textAlign='left';}
}
function loop(ts){if(!last)last=ts;const dt=Math.min(0.05,(ts-last)/1000);update(dt);draw();last=ts;requestAnimationFrame(loop);}
const playBtn=document.getElementById('playBtn');
playBtn.addEventListener('click',()=>{gameStarted=true;playBtn.style.display='none';requestAnimationFrame(loop);});
const restartBtn=document.createElement('button');
restartBtn.id='restart';restartBtn.textContent='RESTART';document.body.appendChild(restartBtn);
restartBtn.addEventListener('click',()=>{resetGame();gameStarted=true;requestAnimationFrame(loop);});
const isMobile=/Mobi|Android/i.test(navigator.userAgent);
if(isMobile){canvas.addEventListener('touchstart',e=>{e.preventDefault();const t=e.touches[0];if(t.clientX<window.innerWidth/2)keys.left=true,keys.right=false;else keys.right=true,keys.left=false;});canvas.addEventListener('touchend',e=>{keys.left=false;keys.right=false;});}else{window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')keys.left=true;if(e.key==='ArrowRight'||e.key==='d')keys.right=true;if(e.key===' '||e.key==='Spacebar')keys.shoot=true;});window.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='a')keys.left=false;if(e.key==='ArrowRight'||e.key==='d')keys.right=false;if(e.key===' '||e.key==='Spacebar')keys.shoot=false;});}
window.addEventListener('resize',()=>{CANVAS_SIZE=Math.min(window.innerWidth,window.innerHeight);canvas.width=canvas.height=CANVAS_SIZE;PLAYER.x=canvas.width/2-15;PLAYER.y=canvas.height-100;});
requestAnimationFrame(loop);
</script>
</body>
</html>
