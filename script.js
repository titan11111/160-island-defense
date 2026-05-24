const Sound={
    ctx:null,enabled:true,bgmOn:false,bgmTimer:null,bgmStep:0,currentMood:'build',
    bgmTracks:{
        build:{seq:[196,220,247,262,247,220],stepMs:420,leadVol:.032,harmonyVol:.018},
        wave:{seq:[220,247,294,330,294,262,247,220],stepMs:320,leadVol:.04,harmonyVol:.024},
        boss:{seq:[165,196,220,175,196,165,147,131],stepMs:250,leadVol:.05,harmonyVol:.02}
    },
    init(){if(!this.ctx)this.ctx=new(window.AudioContext||window.webkitAudioContext)();if(this.ctx.state==='suspended')this.ctx.resume()},
    _play(f0,f1,dur,type='triangle',vol=.12,ramp='exp'){
        if(!this.enabled)return;this.init();
        const o=this.ctx.createOscillator(),g=this.ctx.createGain();
        o.type=type;o.frequency.setValueAtTime(f0,this.ctx.currentTime);
        ramp==='exp'?o.frequency.exponentialRampToValueAtTime(f1,this.ctx.currentTime+dur):o.frequency.linearRampToValueAtTime(f1,this.ctx.currentTime+dur);
        g.gain.setValueAtTime(vol,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.01,this.ctx.currentTime+dur);
        o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+dur)
    },
    playShoot(){this._play(300,100,.15,'triangle',.13)},
    playMagic(){this._play(150,600,.3,'sine',.1)},
    playExplode(){this._play(100,10,.4,'sawtooth',.2)},
    playHeal(){this._play(400,1200,.35,'sine',.1,'linear')},
    playUpgrade(){
        this.init();const ctx=this.ctx;
        [300,450,600].forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.07,ctx.currentTime+i*.1);g.gain.exponentialRampToValueAtTime(.01,ctx.currentTime+i*.1+.09);o.connect(g);g.connect(ctx.destination);o.start(ctx.currentTime+i*.1);o.stop(ctx.currentTime+i*.1+.09)})
    },
    playHit(){this._play(80,80,.1,'sawtooth',.15)},
    playBuild(){this._play(180,240,.15,'triangle',.14)},
    playCannon(){this._play(60,20,.5,'sawtooth',.25)},
    playBossAppear(){
        this.init();const ctx=this.ctx,o=ctx.createOscillator(),g=ctx.createGain();
        o.type='sawtooth';o.frequency.setValueAtTime(800,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(40,ctx.currentTime+1.2);
        g.gain.setValueAtTime(.2,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.01,ctx.currentTime+1.2);
        o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+1.2)
    },
    _bgmNote(freq,dur=.34,vol=.04){
        if(!this.enabled||!this.ctx)return;
        const ctx=this.ctx,o=ctx.createOscillator(),g=ctx.createGain();
        o.type='triangle';
        o.frequency.setValueAtTime(freq,ctx.currentTime);
        g.gain.setValueAtTime(.001,ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(vol,ctx.currentTime+.02);
        g.gain.exponentialRampToValueAtTime(.01,ctx.currentTime+dur);
        o.connect(g);g.connect(ctx.destination);
        o.start();o.stop(ctx.currentTime+dur+.01);
    },
    startBgm(mood='build'){
        if(this.bgmOn||!this.enabled)return;
        this.init();
        this.bgmOn=true;
        this.bgmStep=0;
        this.currentMood=mood;
        this._bgmLoop();
    },
    setMood(mood){
        if(!this.bgmTracks[mood])return;
        this.currentMood=mood;
        if(!this.bgmOn&&this.enabled)return;
        this.bgmStep=0;
    },
    _bgmLoop(){
        if(!this.bgmOn||!this.enabled)return;
        const track=this.bgmTracks[this.currentMood]||this.bgmTracks.build;
        const freq=track.seq[this.bgmStep%track.seq.length];
        this._bgmNote(freq,Math.max(.22,track.stepMs/1000-.02),track.leadVol);
        if(this.bgmStep%2===0)this._bgmNote(freq*1.5,Math.max(.18,track.stepMs/1000-.08),track.harmonyVol);
        this.bgmStep++;
        this.bgmTimer=setTimeout(()=>this._bgmLoop(),track.stepMs);
    },
    stopBgm(){
        this.bgmOn=false;
        if(this.bgmTimer){clearTimeout(this.bgmTimer);this.bgmTimer=null;}
        this.bgmStep=0;
    },
    playClearJingle(){
        if(!this.enabled)return;
        this.init();
        [392,523,659,784].forEach((f,i)=>this._bgmNote(f,.22,.055-(i*0.006)));
    },
    playGameOverJingle(){
        if(!this.enabled)return;
        this.init();
        [220,196,165,147].forEach((f,i)=>setTimeout(()=>this._bgmNote(f,.26,.045),i*120));
    }
};

// iOS Safari gesture guards
let lastTap=0;
document.addEventListener('touchmove',e=>{
    const tgt=e.target;
    if(tgt&&tgt.closest&&(tgt.closest('#side-pane')||tgt.closest('#modal-help')))return;
    e.preventDefault();
},{passive:false});
document.addEventListener('touchstart',e=>{
    const now=Date.now();
    if(now-lastTap<300)e.preventDefault();
    lastTap=now;
},{passive:false});
document.addEventListener('dblclick',e=>e.preventDefault(),{passive:false});
document.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('pointerdown',()=>Sound.init(),{once:true});
document.addEventListener('keydown',()=>Sound.init(),{once:true});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 定数・設定
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const GRID=9, MID=Math.floor(GRID/2);
const TILE={DEEP:0,SHALLOW:1,LAND:2,VILLAGE:3};
const CFG={maxHP:100,baseGold:120,waveSec:30};
const TIDE_CFG={maxChanges:4,minWave:1,protectCore:true};
const SUPER_WEAPON={
    orbital:{
        id:'orbital',
        name:'天罰衛星レーザー',
        icon:'☄️',
        cost:220,
        damage:120,
        cooldownSec:30,
        unlockWave:1,
        effect:'orbital'
    },
    meteor:{
        id:'meteor',
        name:'星砕メテオ',
        icon:'🌠',
        cost:280,
        damage:140,
        cooldownSec:36,
        unlockWave:11,
        effect:'meteor'
    },
    tempest:{
        id:'tempest',
        name:'雷獄テンペスト',
        icon:'⚡',
        cost:340,
        damage:95,
        cooldownSec:28,
        unlockWave:14,
        effect:'tempest'
    },
    glacier:{
        id:'glacier',
        name:'零式グレイシャル',
        icon:'❄️',
        cost:390,
        damage:110,
        cooldownSec:34,
        unlockWave:17,
        effect:'glacier'
    }
};

const TowerSpecs={
    archer:{name:"弓兵台",  emoji:"🏹",cost:30, range:2.5,cooldown:50, damage:10,maxHp:200,type:'archer'},
    mage:  {name:"魔法塔",  emoji:"🔮",cost:60, range:1.8,cooldown:110,damage:18,maxHp:250,type:'mage',  splash:0.9},
    cannon:{name:"カノン砲",emoji:"💣",cost:100,range:2.0,cooldown:200,damage:40,maxHp:300,type:'cannon',splash:1.4},
    wall:  {name:"防壁",    emoji:"🧱",cost:20, range:0,  cooldown:0,  damage:0, maxHp:800,type:'wall'},
    spring:{name:"回復の泉",emoji:"💧",cost:80, range:0,  cooldown:300,damage:0, maxHp:150,type:'spring',heal:2}
};

const UPG_MULT=[1.0,1.5,2.2];
const UPG_COST=[0,1.5,2.0];

const EnemySpecs={
    slime:    {name:"スライム",emoji:"🟢",hp:30, speed:0.8, gold:5,  power:2,  color:"#10b981",r:12,spawnInt:45},
    goblin:   {name:"ゴブリン",emoji:"👺",hp:55, speed:1.4, gold:8,  power:4,  color:"#f97316",r:13,spawnInt:42},
    orc:      {name:"オーク",  emoji:"🐗",hp:160,speed:0.5, gold:15, power:10, color:"#ef4444",r:16,spawnInt:60},
    dragon:   {name:"ドラゴン",emoji:"🐲",hp:750,speed:0.35,gold:50, power:25, color:"#a855f7",r:22,isBoss:true,fireCooldown:120,fireDamage:35,spawnInt:100},
    zombie:   {name:"ゾンビ",  emoji:"🧟",hp:120,speed:0.65,gold:14, power:8,  color:"#84cc16",r:14,spawnInt:52},
    demon:    {name:"デーモン",emoji:"😈",hp:420,speed:0.85,gold:28, power:16, color:"#dc2626",r:17,spawnInt:58},
    specter:  {name:"スペクター",emoji:"👻",hp:180,speed:1.25,gold:20,power:11,color:"#60a5fa",r:15,spawnInt:38},
    golem:    {name:"ゴーレム",emoji:"🪨",hp:620,speed:0.38,gold:36,power:20,color:"#94a3b8",r:19,spawnInt:72},
    hydra:    {name:"ヒュドラ",emoji:"🐍",hp:1700,speed:0.34,gold:110,power:32,color:"#22c55e",r:24,isBoss:true,fireCooldown:90,fireDamage:46,spawnInt:112},
    leviathan:{name:"リヴァイアサン",emoji:"🐙",hp:2800,speed:0.30,gold:160,power:42,color:"#06b6d4",r:27,isBoss:true,fireCooldown:72,fireDamage:58,spawnInt:125}
};

const WaveData=[
    {enemies:[{t:'slime',n:5}],                                  bonus:0,hpM:1.0},
    {enemies:[{t:'slime',n:8}],                                  bonus:1,hpM:1.1},
    {enemies:[{t:'slime',n:5},{t:'goblin',n:3}],                 bonus:0,hpM:1.2},
    {enemies:[{t:'goblin',n:7}],                                 bonus:1,hpM:1.3},
    {enemies:[{t:'goblin',n:6},{t:'dragon',n:1}],                bonus:2,hpM:1.4},
    {enemies:[{t:'slime',n:10},{t:'orc',n:3}],                   bonus:1,hpM:1.5},
    {enemies:[{t:'orc',n:5},{t:'goblin',n:5}],                   bonus:1,hpM:1.7},
    {enemies:[{t:'orc',n:7},{t:'goblin',n:10}],                  bonus:0,hpM:2.0},
    {enemies:[{t:'orc',n:8},{t:'dragon',n:1}],                   bonus:2,hpM:2.2},
    {enemies:[{t:'slime',n:10},{t:'goblin',n:10},{t:'orc',n:8},{t:'dragon',n:2}],bonus:0,hpM:2.5},
    {enemies:[{t:'zombie',n:10},{t:'specter',n:6}],               bonus:1,hpM:2.7},
    {enemies:[{t:'zombie',n:12},{t:'demon',n:4}],                 bonus:1,hpM:2.9},
    {enemies:[{t:'specter',n:14},{t:'zombie',n:8}],               bonus:1,hpM:3.1},
    {enemies:[{t:'golem',n:4},{t:'demon',n:6}],                   bonus:2,hpM:3.3},
    {enemies:[{t:'specter',n:10},{t:'golem',n:4},{t:'hydra',n:1}],bonus:3,hpM:3.6},
    {enemies:[{t:'zombie',n:14},{t:'demon',n:8},{t:'golem',n:4}], bonus:2,hpM:3.8},
    {enemies:[{t:'specter',n:16},{t:'demon',n:8}],                bonus:2,hpM:4.0},
    {enemies:[{t:'golem',n:8},{t:'demon',n:10}],                  bonus:3,hpM:4.3},
    {enemies:[{t:'specter',n:14},{t:'golem',n:8},{t:'hydra',n:1}],bonus:3,hpM:4.6},
    {enemies:[{t:'zombie',n:16},{t:'specter',n:14},{t:'demon',n:12},{t:'golem',n:8},{t:'leviathan',n:1}],bonus:4,hpM:5.0}
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// スキルプール（15種）
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SKILL_POOL=[
    {id:'all_dmg',    name:'猛攻の鼓舞',  emoji:'⚔️',  rarity:'rare',      desc:'全タワーの攻撃力 +30%',       apply:g=>{g.mults.dmg*=1.3;g._refreshAllTowers();}},
    {id:'all_range',  name:'鷹の目',      emoji:'🦅',  rarity:'uncommon',  desc:'全タワーの射程 +20%',         apply:g=>{g.mults.range*=1.2;g._refreshAllTowers();}},
    {id:'all_spd',    name:'疾風の加護',  emoji:'💨',  rarity:'uncommon',  desc:'全タワーの攻撃速度 +25%',     apply:g=>{g.mults.spd*=1.25;g._refreshAllTowers();}},
    {id:'gold',       name:'宝の地図',    emoji:'🗺️',  rarity:'common',    desc:'即座に +120G 獲得',           apply:g=>{g.gold+=120;g.updateHUD();}},
    {id:'heal_v',     name:'大地の癒し',  emoji:'🌿',  rarity:'common',    desc:'村のHPを +30 回復',           apply:g=>{g.hp=Math.min(CFG.maxHP,g.hp+30);g.updateHUD();}},
    {id:'enemy_slow', name:'泥沼の呪い',  emoji:'🌀',  rarity:'rare',      desc:'全敵の移動速度 −20%（永続）', apply:g=>{g.mults.enemySpd*=0.8;}},
    {id:'cannon_big', name:'大爆発理論',  emoji:'💥',  rarity:'rare',      desc:'カノン砲の爆発範囲 ×1.6',    apply:g=>{g.mults.cannonSplash*=1.6;}},
    {id:'mage_slow2', name:'深淵の魔法',  emoji:'🔵',  rarity:'uncommon',  desc:'魔法塔の鈍足時間 ×2',        apply:g=>{g.mults.mageSlowDur*=2;}},
    {id:'wall_hp2',   name:'鉄壁の砦',   emoji:'🏰',  rarity:'uncommon',  desc:'全防壁のHP ×2',              apply:g=>{g.mults.wallHp*=2;g._refreshAllTowers();}},
    {id:'spring2',    name:'奇跡の泉',    emoji:'✨',  rarity:'uncommon',  desc:'回復の泉の回復量 ×2',        apply:g=>{g.mults.springHeal*=2;}},
    {id:'cost_down',  name:'賢者の商人',  emoji:'🛒',  rarity:'rare',      desc:'全タワーの建設コスト −25%',   apply:g=>{g.mults.cost*=0.75;}},
    {id:'expand_pt',  name:'海底調査',    emoji:'🌊',  rarity:'common',    desc:'拡張ポイント +4 即時獲得',    apply:g=>{g.expandPts+=4;g.updateHUD();}},
    {id:'archer_2x',  name:'黄金の矢',    emoji:'🏹',  rarity:'legendary', desc:'弓兵台の攻撃力 ×2',          apply:g=>{g.mults.archerDmg*=2;g._refreshAllTowers();}},
    {id:'mage_2x',    name:'魔力解放',    emoji:'🔮',  rarity:'legendary', desc:'魔法塔のダメージ +60%',       apply:g=>{g.mults.mageDmg*=1.6;g._refreshAllTowers();}},
    {id:'gold_mult',  name:'金の島',      emoji:'💎',  rarity:'legendary', desc:'敵撃破ゴールド ×1.5',        apply:g=>{g.mults.goldMult*=1.5;}},
];
const RARITY_LABEL={common:'コモン',uncommon:'アンコモン',rare:'レア',legendary:'レジェンダリー'};
const RARITY_CLASS={common:'rarity-common',uncommon:'rarity-uncommon',rare:'rarity-rare',legendary:'rarity-legendary'};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Tower
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Tower{
    constructor(r,c,type,game){
        this.row=r;this.col=c;this.type=type;this.game=game||null;this.level=1;this.timer=0;
        const s=TowerSpecs[type];
        this.hp=s.maxHp;this.maxHp=s.maxHp;this.emoji=s.emoji;
        this._refresh();
    }
    _refresh(){
        const s=TowerSpecs[this.type],m=UPG_MULT[this.level-1];
        const gm=this.game?this.game.mults:{};
        const typeDmg=this.type==='archer'?(gm.archerDmg||1):this.type==='mage'?(gm.mageDmg||1):1;
        this.damage=(s.damage||0)*m*(gm.dmg||1)*typeDmg;
        this.range=(s.range||0)*Math.pow(m,0.4)*(gm.range||1);
        this.cooldown=Math.max(20,Math.round((s.cooldown||300)/m/(gm.spd||1)));
        const hpMult=this.type==='wall'?(gm.wallHp||1):1;
        const newMax=Math.round(s.maxHp*m*hpMult);
        if(this.hp>newMax)this.hp=newMax;
        this.maxHp=newMax;
    }
    upgradeCost(){return this.level>=3?null:Math.round(TowerSpecs[this.type].cost*UPG_COST[this.level]);}
    upgrade(game){
        const cost=this.upgradeCost();
        if(!cost||game.gold<cost)return false;
        game.gold-=cost;this.level++;this._refresh();
        this.hp=Math.min(this.hp+this.maxHp*0.3,this.maxHp);
        Sound.playUpgrade();return true;
    }
    sellValue(){
        let t=TowerSpecs[this.type].cost;
        for(let lv=2;lv<=this.level;lv++)t+=Math.round(TowerSpecs[this.type].cost*UPG_COST[lv-1]);
        return Math.floor(t*0.7);
    }
    levelStars(){return['★☆☆','★★☆','★★★'][this.level-1];}
    update(game){
        if(this.hp<=0)return;
        if(this.type==='spring'){
            this.timer++;
            if(this.timer>=this.cooldown){
                this.timer=0;
                if(game.hp<CFG.maxHP){
                    const h=TowerSpecs.spring.heal*UPG_MULT[this.level-1]*(game.mults.springHeal||1);
                    game.hp=Math.min(CFG.maxHP,game.hp+h);game.updateHUD();Sound.playHeal();
                    const cx=MID*game.cs+game.cs/2,cy=MID*game.cs+game.cs/2;
                    game.floatText('+'+h.toFixed(0)+'HP',cx,cy,'#10b981');
                    game.particles(cx,cy,'#10b981',8);
                }
            }
            return;
        }
        if(this.type==='wall')return;
        if(this.timer>0)this.timer--;
        if(this.timer===0){
            let target=null,best=Infinity;
            const tx=this.col*game.cs+game.cs/2,ty=this.row*game.cs+game.cs/2;
            game.enemies.forEach(e=>{
                const d=Math.hypot(e.x-tx,e.y-ty)/game.cs;
                if(d<=this.range){const c=e.costToVillage();if(c<best){best=c;target=e;}}
            });
            if(target){this._shoot(game,tx,ty,target);this.timer=this.cooldown;}
        }
    }
    _shoot(game,tx,ty,t){
        const cs=game.cs;
        if(this.type==='archer'){Sound.playShoot();game.projs.push(new Proj(tx,ty,t,this.damage,'arrow'));}
        else if(this.type==='mage'){Sound.playMagic();game.projs.push(new Proj(tx,ty,t,this.damage,'magic',TowerSpecs.mage.splash*cs*(game.mults.cannonSplash||1)*0.7));}
        else if(this.type==='cannon'){Sound.playCannon();game.projs.push(new Proj(tx,ty,t,this.damage,'cannon',TowerSpecs.cannon.splash*cs*(game.mults.cannonSplash||1)));}
    }
    draw(ctx,tx,ty,cs){
        if(this.hp<this.maxHp){
            const bw=cs*.75;
            ctx.fillStyle='#ef4444';ctx.fillRect(tx-bw/2,ty-cs/2+2,bw,4);
            ctx.fillStyle='#22c55e';ctx.fillRect(tx-bw/2,ty-cs/2+2,bw*(this.hp/this.maxHp),4);
        }
        ctx.font=cs*.58+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(this.emoji,tx,ty+2);
        if(this.level>=2){
            ctx.font='bold '+cs*.2+'px Inter,sans-serif';
            ctx.fillStyle=this.level===3?'#fbbf24':'#93c5fd';
            ctx.fillText(this.levelStars(),tx,ty+cs*.38);
        }
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Enemy
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Enemy{
    constructor(type,game){
        this.type=type;
        const s=EnemySpecs[type];
        const hpM=WaveData[game.waveIdx]?WaveData[game.waveIdx].hpM:1;
        this.hp=Math.round(s.hp*hpM);this.maxHp=this.hp;
        this.speed=s.speed*(game.mults?game.mults.enemySpd:1);this.gold=s.gold;this.power=s.power;
        this.color=s.color;this.radius=s.r;this.isBoss=s.isBoss||false;
        this.slowTimer=0;this.fireTimer=0;
        const side=Math.floor(Math.random()*4),off=Math.floor(Math.random()*GRID);
        let r=0,c=0;
        if(side===0){r=0;c=off;}else if(side===1){r=GRID-1;c=off;}
        else if(side===2){r=off;c=0;}else{r=off;c=GRID-1;}
        if(r===MID&&c===MID){r=0;c=0;}
        this.gridR=r;this.gridC=c;
        this.x=c*game.cs+game.cs/2;this.y=r*game.cs+game.cs/2;
        this.reached=false;
        if(this.isBoss)Sound.playBossAppear();
    }
    costToVillage(){return Math.hypot(MID-this.gridC,MID-this.gridR);}
    update(game){
        if(this.hp<=0)return;
        let spd=this.speed;
        if(this.slowTimer>0){this.slowTimer--;spd*=0.5;}
        const cs=game.cs;
        this.gridR=Math.floor(this.y/cs);this.gridC=Math.floor(this.x/cs);
        if(this.gridR===MID&&this.gridC===MID){this.reached=true;return;}
        let dir=null;
        if(this.gridR>=0&&this.gridR<GRID&&this.gridC>=0&&this.gridC<GRID)
            dir=game.pathMap[this.gridR][this.gridC];
        let tx=dir?(this.gridC+dir.dx)*cs+cs/2:MID*cs+cs/2;
        let ty=dir?(this.gridR+dir.dy)*cs+cs/2:MID*cs+cs/2;
        const d=Math.hypot(tx-this.x,ty-this.y);
        if(d<=spd){this.x=tx;this.y=ty;}
        else{const a=Math.atan2(ty-this.y,tx-this.x);this.x+=Math.cos(a)*spd;this.y+=Math.sin(a)*spd;}
        if(this.isBoss){
            this.fireTimer++;
            const cd=EnemySpecs[this.type].fireCooldown||120;
            if(this.fireTimer>=cd){this.fireTimer=0;this._fireAtTower(game);}
        }
        const cr=Math.floor(this.y/cs),cc=Math.floor(this.x/cs);
        if(cr>=0&&cr<GRID&&cc>=0&&cc<GRID){
            const cell=game.grid[cr][cc];
            if(cell.tower){
                cell.tower.hp-=1.5;this.slowTimer=5;
                if(cell.tower.hp<=0){
                    game.particles(this.x,this.y,'#ef4444',8);game.floatText('破壊!',this.x,this.y,'#ef4444');
                    if(game.selCell&&game.selCell.r===cr&&game.selCell.c===cc)game.clearDetail();
                    cell.tower=null;game.rebuildPath();
                }
            }
        }
    }
    _fireAtTower(game){
        const targets=[];
        for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++)if(game.grid[r][c].tower)targets.push(game.grid[r][c].tower);
        if(!targets.length)return;
        const t=targets[Math.floor(Math.random()*targets.length)];
        Sound.playExplode();
        const dmg=EnemySpecs[this.type].fireDamage||35;
        game.enemyProjs.push(new EProj(this.x,this.y,t.col*game.cs+game.cs/2,t.row*game.cs+game.cs/2,dmg));
    }
    draw(ctx){
        if(this.slowTimer>0){ctx.beginPath();ctx.arc(this.x,this.y,this.radius+3,0,Math.PI*2);ctx.fillStyle='rgba(14,165,233,.3)';ctx.fill();}
        ctx.font=this.radius*1.5+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(EnemySpecs[this.type].emoji,this.x,this.y+2);
        const bw=this.radius*1.6;
        ctx.fillStyle='#ef4444';ctx.fillRect(this.x-bw/2,this.y-this.radius-5,bw,3);
        ctx.fillStyle=this.isBoss?'#a855f7':'#22c55e';ctx.fillRect(this.x-bw/2,this.y-this.radius-5,bw*Math.max(0,this.hp/this.maxHp),3);
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Projectile
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class Proj{
    constructor(x,y,target,dmg,type,splash=0){
        this.x=x;this.y=y;this.target=target;this.dmg=dmg;this.type=type;this.splash=splash;
        this.spd=type==='arrow'?4.5:(type==='cannon'?3.5:3.0);this.done=false;
    }
    update(){
        if(!this.target||this.target.hp<=0){this.done=true;return;}
        const dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy);
        if(d<this.spd)this._hit();else{this.x+=dx/d*this.spd;this.y+=dy/d*this.spd;}
    }
    _hit(){
        this.done=true;
        if(this.type==='arrow'){this.target.hp-=this.dmg;Sound.playHit();}
        else{
            const g=window.game,col=this.type==='cannon'?'#f97316':'#a855f7';
            g.particles(this.x,this.y,col,this.type==='cannon'?20:15);
            const slowDur=Math.round(150*(window.game.mults.mageSlowDur||1));
            g.enemies.forEach(e=>{if(Math.hypot(e.x-this.x,e.y-this.y)<=this.splash){e.hp-=this.dmg;if(this.type==='mage')e.slowTimer=slowDur;}});
            Sound.playExplode();
        }
    }
    draw(ctx){
        if(this.type==='arrow'){ctx.beginPath();ctx.arc(this.x,this.y,3,0,Math.PI*2);ctx.fillStyle='#fbbf24';ctx.fill();}
        else if(this.type==='magic'){
            ctx.beginPath();ctx.arc(this.x,this.y,6,0,Math.PI*2);ctx.fillStyle='#c084fc';ctx.fill();
            ctx.beginPath();ctx.arc(this.x,this.y,3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
        }else{
            ctx.beginPath();ctx.arc(this.x,this.y,8,0,Math.PI*2);ctx.fillStyle='#374151';ctx.fill();
            ctx.beginPath();ctx.arc(this.x,this.y,4,0,Math.PI*2);ctx.fillStyle='rgba(150,150,150,.4)';ctx.fill();
        }
    }
}

class EProj{
    constructor(x,y,tx,ty,dmg){this.x=x;this.y=y;this.tx=tx;this.ty=ty;this.dmg=dmg;this.spd=2.2;this.done=false;}
    update(game){
        const dx=this.tx-this.x,dy=this.ty-this.y,d=Math.hypot(dx,dy);
        if(d<this.spd)this._hit(game);else{this.x+=dx/d*this.spd;this.y+=dy/d*this.spd;}
    }
    _hit(game){
        this.done=true;Sound.playExplode();game.particles(this.x,this.y,'#f97316',15);
        const r=Math.floor(this.y/game.cs),c=Math.floor(this.x/game.cs);
        if(r>=0&&r<GRID&&c>=0&&c<GRID){
            const cell=game.grid[r][c];
            if(cell.tower){
                cell.tower.hp-=this.dmg;game.floatText('-'+this.dmg,this.x,this.y,'#f97316');
                if(cell.tower.hp<=0){
                    game.particles(this.x,this.y,'#ef4444',10);game.floatText('大破!',this.x,this.y,'#ef4444');
                    if(game.selCell&&game.selCell.r===r&&game.selCell.c===c)game.clearDetail();
                    cell.tower=null;game.rebuildPath();
                }
            }
        }
    }
    draw(ctx){
        ctx.beginPath();ctx.arc(this.x,this.y,8,0,Math.PI*2);ctx.fillStyle='#ea580c';ctx.fill();
        ctx.beginPath();ctx.arc(this.x,this.y,4,0,Math.PI*2);ctx.fillStyle='#eab308';ctx.fill();
    }
}

class Particle{
    constructor(x,y,col){
        this.x=x;this.y=y;this.color=col;
        this.vx=(Math.random()-.5)*2.5;this.vy=(Math.random()-.5)*2.5;
        this.r=Math.random()*2.5+1;this.alpha=1;this.decay=Math.random()*.03+.015;
    }
    update(){this.x+=this.vx;this.y+=this.vy;this.alpha-=this.decay;}
    draw(ctx){ctx.save();ctx.globalAlpha=Math.max(0,this.alpha);ctx.fillStyle=this.color;ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();ctx.restore();}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GameEngine
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
class GameEngine{
    constructor(){
        this.canvas=document.getElementById('game-canvas');
        this.ctx=this.canvas.getContext('2d');
        this.resize();
        this.updateLayoutMetrics();
        window.addEventListener('resize',()=>{this.resize();this.updateLayoutMetrics();});
        requestAnimationFrame(()=>this.resize());
        this.reset();this.setupInput();this.loop();
    }
    reset(){
        this.hp=CFG.maxHP;this.gold=CFG.baseGold;this.expandPts=0;this.kills=0;
        this.waveIdx=0;this.playing=false;this.phase='build';
        this.phaseTimer=CFG.waveSec*60;this.speed=1;
        this.over=false;this.clear=false;
        this.selType='archer';this.expandMode=false;
        this.hover=null;this.selCell=null;
        this.totalEnemies=0;
        this.lastTideResult=null;
        this.superWeaponCd=0;
        // スキルシステム
        this.mults={dmg:1,range:1,spd:1,enemySpd:1,cannonSplash:1,mageSlowDur:1,springHeal:1,wallHp:1,cost:1,goldMult:1,archerDmg:1,mageDmg:1};
        this.activeSkills=[];// {id, name, emoji} 取得済みスキル一覧
        this.skillPending=false;
        this.grid=[];
        for(let r=0;r<GRID;r++){this.grid[r]=[];for(let c=0;c<GRID;c++){
            let t=TILE.DEEP;
            if(r===MID&&c===MID)t=TILE.VILLAGE;
            else if(r>=3&&r<=5&&c>=3&&c<=5)t=TILE.LAND;
            else if(r>=2&&r<=6&&c>=2&&c<=6)t=TILE.SHALLOW;
            this.grid[r][c]={row:r,col:c,type:t,tower:null};
        }}
        this.enemies=[];this.projs=[];this.enemyProjs=[];this.parts=[];this.floats=[];
        this.spawnQ=[];this.spawnT=0;this.pathMap=null;
        this.rebuildPath();this.updateHUD();this.updateNextWave();this.updateUI();this.clearDetail();
    }
    currentSuperWeapon(){
        const w=this.waveIdx+1;
        if(w>=17)return SUPER_WEAPON.glacier;
        if(w>=14)return SUPER_WEAPON.tempest;
        if(w>=11)return SUPER_WEAPON.meteor;
        return SUPER_WEAPON.orbital;
    }
    useSuperWeapon(){
        const w=this.currentSuperWeapon();
        if(!this.playing||this.over||this.clear)return;
        if(this.phase!=='wave'){
            this.floatText('Wave中のみ使用可能',MID*this.cs+this.cs/2,MID*this.cs+this.cs/2-70,'#f472b6');
            return;
        }
        if(this.superWeaponCd>0){
            this.floatText('兵器は再充填中',MID*this.cs+this.cs/2,MID*this.cs+this.cs/2-70,'#f472b6');
            return;
        }
        if(this.gold<w.cost){
            this.floatText('ゴールド不足! (必要:'+w.cost+'G)',MID*this.cs+this.cs/2,MID*this.cs+this.cs/2-70,'#f87171');
            return;
        }
        if(this.enemies.length===0){
            this.floatText('標的がいません',MID*this.cs+this.cs/2,MID*this.cs+this.cs/2-70,'#94a3b8');
            return;
        }
        this.gold-=w.cost;this.superWeaponCd=w.cooldownSec*60;
        if(w.effect==='orbital'){
            this.enemies.forEach(e=>{e.hp-=w.damage;this.particles(e.x,e.y,'#f472b6',18);this.floatText('☄️'+Math.round(w.damage),e.x,e.y-12,'#f472b6');});
        }else if(w.effect==='meteor'){
            const picks=[...this.enemies].sort(()=>Math.random()-.5).slice(0,Math.min(6,this.enemies.length));
            picks.forEach(t=>{this.particles(t.x,t.y,'#fb7185',22);this.enemies.forEach(e=>{if(Math.hypot(e.x-t.x,e.y-t.y)<=this.cs*1.6)e.hp-=w.damage;});this.floatText('🌠'+Math.round(w.damage),t.x,t.y-14,'#fb7185');});
        }else if(w.effect==='tempest'){
            [...this.enemies].sort((a,b)=>b.hp-a.hp).slice(0,Math.min(8,this.enemies.length)).forEach(e=>{e.hp-=w.damage;e.slowTimer=Math.max(e.slowTimer,220);this.particles(e.x,e.y,'#a5b4fc',14);this.floatText('⚡'+Math.round(w.damage),e.x,e.y-12,'#a5b4fc');});
        }else{
            this.enemies.forEach(e=>{e.hp-=w.damage;e.slowTimer=Math.max(e.slowTimer,300);this.particles(e.x,e.y,'#67e8f9',16);this.floatText('❄️'+Math.round(w.damage),e.x,e.y-12,'#67e8f9');});
        }
        Sound.playExplode();Sound.playMagic();
        this.floatText(w.icon+' '+w.name+' 発動!',MID*this.cs+this.cs/2,MID*this.cs+this.cs/2-40,'#f5d0fe');
        this.updateHUD();
        this.updateSuperWeaponUI();
    }
    updateSuperWeaponUI(){
        const w=this.currentSuperWeapon();
        const btn=document.getElementById('btn-super-weapon');
        const label=document.getElementById('super-weapon-label');
        const cd=document.getElementById('super-weapon-cd');
        if(!btn||!label||!cd)return;
        label.textContent=w.icon+' '+w.name+' ('+w.cost+'G)';
        if(this.superWeaponCd>0){
            const sec=Math.ceil(this.superWeaponCd/60);
            btn.disabled=true;
            btn.classList.add('opacity-60');
            btn.classList.remove('hover:from-fuchsia-600','hover:to-purple-600');
            cd.textContent='再充填: '+sec+'秒';
            cd.classList.remove('text-emerald-300');
            cd.classList.add('text-fuchsia-300');
        }else{
            btn.disabled=this.gold<w.cost;
            btn.classList.toggle('opacity-60',this.gold<w.cost);
            btn.classList.add('hover:from-fuchsia-600','hover:to-purple-600');
            cd.textContent=this.gold>=w.cost?'準備完了':'必要コスト: '+w.cost+'G';
            cd.classList.remove('text-fuchsia-300');
            cd.classList.add('text-emerald-300');
        }
    }
    _sample(arr,count){
        const a=[...arr];
        for(let i=a.length-1;i>0;i--){
            const j=Math.floor(Math.random()*(i+1));
            [a[i],a[j]]=[a[j],a[i]];
        }
        return a.slice(0,count);
    }
    _isCoreCell(r,c){
        if(!TIDE_CFG.protectCore)return false;
        return r>=3&&r<=5&&c>=3&&c<=5;
    }
    applyTideEvent(){
        if(this.waveIdx<TIDE_CFG.minWave){this.lastTideResult=null;return;}
        const intensity=Math.min(TIDE_CFG.maxChanges,1+Math.floor(this.waveIdx/2));
        const shallowToLand=[],landToShallow=[],deepToShallow=[];
        for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++){
            const cell=this.grid[r][c];
            if(cell.type===TILE.VILLAGE||cell.tower)continue;
            if(cell.type===TILE.SHALLOW)shallowToLand.push(cell);
            else if(cell.type===TILE.LAND&&!this._isCoreCell(r,c))landToShallow.push(cell);
            else if(cell.type===TILE.DEEP)deepToShallow.push(cell);
        }
        const upCount=Math.min(Math.ceil(intensity*0.6),shallowToLand.length);
        const downCount=Math.min(Math.floor(intensity*0.3),landToShallow.length);
        const edgeCount=Math.min(Math.max(0,intensity-upCount-downCount),deepToShallow.length);
        if(upCount+downCount+edgeCount===0){this.lastTideResult=null;return;}
        this._sample(shallowToLand,upCount).forEach(cell=>{cell.type=TILE.LAND;});
        this._sample(landToShallow,downCount).forEach(cell=>{cell.type=TILE.SHALLOW;});
        this._sample(deepToShallow,edgeCount).forEach(cell=>{cell.type=TILE.SHALLOW;});
        this.lastTideResult={upCount,downCount,edgeCount,total:upCount+downCount+edgeCount};
        this.rebuildPath();
    }
    resize(){
        const p=this.canvas.parentElement;
        const dpr=Math.min(window.devicePixelRatio||1,2);
        this.renderDpr=dpr;
        let s;
        if(window.matchMedia('(max-width:1024px)').matches){
            const header=document.getElementById('app-header');
            const headerH=header?header.getBoundingClientRect().height:152;
            const vh=window.innerHeight;
            const ctrlH=Math.max(84,Math.round(vh*0.15));
            const gp=document.getElementById('game-pane');
            const gpW=gp?gp.clientWidth:(window.innerWidth-16);
            const gpH=gp?gp.clientHeight:0;
            const avail=Math.max(150,vh-headerH-ctrlH-130-36);
            const heightCap=gpH>0?Math.max(150,gpH-8):avail;
            s=Math.min(gpW||390,avail,heightCap);
        }else{
            s=Math.min(p.clientWidth||400,p.clientHeight||400);
            if(s<=0)s=400;
        }
        if(s<=0)s=150;
        p.style.width=s+'px';
        p.style.height=s+'px';
        this.canvas.width=Math.round(s*dpr);
        this.canvas.height=Math.round(s*dpr);
        this.ctx.setTransform(1,0,0,1,0,0);
        this.ctx.scale(dpr,dpr);
        this.logicalSize=s;this.cs=s*1.3/GRID;this.gridOffset=(s-s*1.3)/2;
    }
    updateLayoutMetrics(){
        const header=document.getElementById('app-header');
        if(header)document.documentElement.style.setProperty('--header-h',header.offsetHeight+'px');
    }
    rebuildPath(){
        const dist=Array(GRID).fill(null).map(()=>Array(GRID).fill(Infinity));
        const next=Array(GRID).fill(null).map(()=>Array(GRID).fill(null));
        dist[MID][MID]=0;const q=[{r:MID,c:MID,cost:0}];
        while(q.length){
            q.sort((a,b)=>a.cost-b.cost);const{r,c,cost}=q.shift();
            if(cost>dist[r][c])continue;
            [{r:r-1,c},{r:r+1,c},{r,c:c-1},{r,c:c+1}].forEach(n=>{
                if(n.r<0||n.r>=GRID||n.c<0||n.c>=GRID)return;
                const cell=this.grid[n.r][n.c];
                let mc=cell.type===TILE.SHALLOW||cell.type===TILE.DEEP?5:1;
                if(cell.tower)mc=cell.tower.type==='wall'?150:80;
                const nc=cost+mc;
                if(nc<dist[n.r][n.c]){dist[n.r][n.c]=nc;next[n.r][n.c]={dx:c-n.c,dy:r-n.r};q.push({r:n.r,c:n.c,cost:nc});}
            });
        }
        this.pathMap=next;
    }
    setupInput(){
        const coords=e=>{
            const rect=this.canvas.getBoundingClientRect();
            const t=e.touches?e.touches[0]:e;
            return{
                x:(t.clientX-rect.left)*this.logicalSize/rect.width-this.gridOffset,
                y:(t.clientY-rect.top)*this.logicalSize/rect.height-this.gridOffset
            };
        };
        const handle=(x,y)=>{if(!this.playing||this.over||this.clear)return;const r=Math.floor(y/this.cs),c=Math.floor(x/this.cs);if(r>=0&&r<GRID&&c>=0&&c<GRID)this.click(r,c);};
        this.canvas.addEventListener('mousemove',e=>{const{x,y}=coords(e);const r=Math.floor(y/this.cs),c=Math.floor(x/this.cs);this.hover=(r>=0&&r<GRID&&c>=0&&c<GRID)?{r,c}:null;});
        this.canvas.addEventListener('mouseleave',()=>{this.hover=null;});
        this.canvas.addEventListener('mousedown',e=>{e.preventDefault();const p=coords(e);handle(p.x,p.y);});
        this.canvas.addEventListener('touchstart',e=>{e.preventDefault();const p=coords(e);handle(p.x,p.y);},{passive:false});
    }
    click(r,c){
        const cell=this.grid[r][c];
        if(this.expandMode){
            const cost=(cell.type===TILE.SHALLOW)?1:(cell.type===TILE.DEEP?2:0);
            if(cost&&this.expandPts>=cost){
                this.expandPts-=cost;cell.type=TILE.LAND;
                this.particles(c*this.cs+this.cs/2,r*this.cs+this.cs/2,'#0ea5e9',15);
                Sound.playUpgrade();this.rebuildPath();this.updateHUD();
                this.floatText('+ 陸地化!',c*this.cs+this.cs/2,r*this.cs,'#38bdf8');
            }else{
                this.floatText(this.expandPts<=0?'ポイント不足!':(cost===0?'拡張できません':'深海は2Pt必要!'),c*this.cs+this.cs/2,r*this.cs,'#f87171');
            }
            return;
        }
        if(cell.type===TILE.LAND&&cell.tower){this.selCell={r,c};this.showDetail(cell.tower);return;}
        this.clearDetail();
        if(cell.type===TILE.LAND){
            const spec=TowerSpecs[this.selType];
            const realCost2=Math.round(spec.cost*(this.mults.cost||1));
            if(this.gold>=realCost2){
                const realCost=Math.round(spec.cost*(this.mults.cost||1));
                this.gold-=realCost;cell.tower=new Tower(r,c,this.selType,this);
                this.particles(c*this.cs+this.cs/2,r*this.cs+this.cs/2,'#10b981',12);
                this.floatText('-'+spec.cost+'G',c*this.cs+this.cs/2,r*this.cs+this.cs/2,'#38bdf8');
                Sound.playBuild();this.rebuildPath();this.updateHUD();
            }else{this.floatText('ゴールド不足! (必要:'+realCost2+'G)',c*this.cs+this.cs/2,r*this.cs+this.cs/2,'#f87171');}
        }else if(cell.type===TILE.VILLAGE){this.floatText('ここは村の中心です',c*this.cs+this.cs/2,r*this.cs,'#f43f5e');}
        else{this.floatText('海には建てられません',c*this.cs+this.cs/2,r*this.cs,'#94a3b8');}
    }
    showDetail(tower){
        const spec=TowerSpecs[tower.type];
        document.getElementById('panel-tower-detail').classList.remove('hidden');
        document.getElementById('detail-title').textContent=tower.emoji+' '+spec.name;
        document.getElementById('detail-level').textContent='Lv.'+tower.level+' '+tower.levelStars();
        document.getElementById('detail-hp').textContent=Math.ceil(tower.hp)+'/'+tower.maxHp;
        document.getElementById('detail-dmg').textContent=tower.damage>0?tower.damage.toFixed(1):'—';
        document.getElementById('detail-range').textContent=tower.range>0?tower.range.toFixed(1)+'マス':'—';
        const uc=tower.upgradeCost();
        const btn=document.getElementById('btn-upgrade');
        if(uc&&tower.level<3){
            btn.disabled=this.gold<uc;btn.classList.toggle('opacity-50',this.gold<uc);
            document.getElementById('upgrade-label').textContent='Lv.'+(tower.level+1)+'にUP ('+uc+'G)';
        }else{btn.disabled=true;btn.classList.add('opacity-50');document.getElementById('upgrade-label').textContent='MAX レベル';}
        document.getElementById('sell-label').textContent='撤去して '+tower.sellValue()+'G 回収';
    }
    clearDetail(){this.selCell=null;document.getElementById('panel-tower-detail').classList.add('hidden');}

    // ━━━ スキルカードシステム ━━━
    _refreshAllTowers(){
        for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++)
            if(this.grid[r][c].tower)this.grid[r][c].tower._refresh();
    }
    showSkillCards(){
        this.skillPending=true;
        const usedIds=this.activeSkills.map(s=>s.id);
        const pool=SKILL_POOL.filter(s=>!usedIds.includes(s.id));
        const shuffled=[...pool].sort(()=>Math.random()-.5);
        const picks=shuffled.slice(0,Math.min(3,shuffled.length));

        const row=document.getElementById('skill-cards-row');
        while(row.firstChild)row.removeChild(row.firstChild);

        picks.forEach(skill=>{
            const card=document.createElement('button');
            card.className='skill-card-anim '+RARITY_CLASS[skill.rarity];
            card.style.cssText='width:100%;border-width:2px;border-style:solid;border-radius:14px;padding:12px 14px;display:flex;flex-direction:row;align-items:center;gap:12px;text-align:left;transition:transform .15s;-webkit-tap-highlight-color:transparent;';

            const emojiEl=document.createElement('span');
            emojiEl.style.cssText='font-size:28px;flex-shrink:0;line-height:1;';emojiEl.textContent=skill.emoji;

            const mid=document.createElement('div');
            mid.style.cssText='flex:1;min-width:0;';

            const nameEl=document.createElement('p');
            nameEl.style.cssText='font-weight:900;color:#fff;font-size:14px;line-height:1.2;margin:0 0 3px;';nameEl.textContent=skill.name;

            const descEl=document.createElement('p');
            descEl.style.cssText='font-size:10px;color:#cbd5e1;line-height:1.4;margin:0;';descEl.textContent=skill.desc;

            mid.appendChild(nameEl);mid.appendChild(descEl);

            const rarityEl=document.createElement('span');
            rarityEl.className=RARITY_CLASS[skill.rarity];
            rarityEl.style.cssText='font-size:9px;font-weight:700;padding:2px 8px;border-radius:999px;border-width:1px;border-style:solid;flex-shrink:0;white-space:nowrap;';
            rarityEl.textContent=RARITY_LABEL[skill.rarity];

            card.appendChild(emojiEl);card.appendChild(mid);card.appendChild(rarityEl);
            card.addEventListener('click',()=>this.selectSkill(skill));
            row.appendChild(card);
        });

        // 取得済みスキル表示
        const wrap=document.getElementById('active-skills-wrap');
        if(this.activeSkills.length>0){
            wrap.style.display='flex';
            const ar=document.getElementById('active-skills-row');
            while(ar.firstChild)ar.removeChild(ar.firstChild);
            this.activeSkills.forEach(s=>{
                const chip=document.createElement('span');
                chip.className='text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5';
                chip.textContent=s.emoji+' '+s.name;
                ar.appendChild(chip);
            });
        }else{wrap.style.display='none';}

        const ov=document.getElementById('overlay-skill');ov.style.display='flex';
    }
    selectSkill(skill){
        skill.apply(this);
        this.activeSkills.push({id:skill.id,name:skill.name,emoji:skill.emoji});
        document.getElementById('overlay-skill').style.display='none';
        this.skillPending=false;
        Sound.playUpgrade();
        this.floatText(skill.emoji+' '+skill.name+' 取得!',MID*this.cs+this.cs/2,MID*this.cs+this.cs/2-40,'#fbbf24');
        this.updateHUD();
    }

    particles(x,y,col,n=10){for(let i=0;i<n;i++)this.parts.push(new Particle(x,y,col));}
    floatText(text,x,y,color){this.floats.push({text,x,y,color,alpha:1,vy:-1.2,life:50});}
    updateHUD(){
        document.getElementById('hud-wave').textContent=(this.waveIdx+1)+'/'+WaveData.length;
        document.getElementById('hud-gold').textContent=this.gold;
        document.getElementById('hud-points').textContent=this.expandPts;
        document.getElementById('hud-kills').textContent=this.kills;
        const pct=Math.max(0,this.hp/CFG.maxHP*100);
        const bar=document.getElementById('hud-hp-bar');
        bar.style.width=pct+'%';
        document.getElementById('hud-hp-text').textContent=Math.ceil(this.hp)+'/'+CFG.maxHP;
        pct<30?bar.classList.add('pulse-effect'):bar.classList.remove('pulse-effect');
        // タワーボタンのコスト更新（割引反映）
        if(this.mults.cost!==1){
            document.querySelectorAll('.tower-btn').forEach(btn=>{
                const spec=TowerSpecs[btn.dataset.type];
                if(!spec)return;
                const costEl=btn.querySelector('.tower-cost');
                if(costEl)costEl.textContent=Math.round(spec.cost*this.mults.cost)+'G';
            });
        }
        const boss=this.enemies.find(e=>e.isBoss);
        const bw=document.getElementById('boss-bar-wrap');
        if(boss){
            bw.classList.remove('hidden');
            document.getElementById('boss-hp-bar').style.width=Math.max(0,boss.hp/boss.maxHp*100)+'%';
            document.getElementById('boss-hp-text').textContent=Math.ceil(boss.hp)+' / '+boss.maxHp;
            if(this.phase==='wave')Sound.setMood('boss');
        }else{bw.classList.add('hidden');}
        if(!boss&&this.phase==='wave')Sound.setMood('wave');
        if(this.phase==='build')Sound.setMood('build');
        this.updateLayoutMetrics();
        this.updateSuperWeaponUI();
    }
    updateNextWave(){
        const el=document.getElementById('next-wave-content');
        // DOM-only construction (no innerHTML)
        while(el.firstChild)el.removeChild(el.firstChild);
        const nextIdx=this.waveIdx+(this.phase==='wave'?1:0);
        if(nextIdx>=WaveData.length){
            const s=document.createElement('span');s.className='text-emerald-400 font-bold';s.textContent='🏆 最終Waveです！';el.appendChild(s);return;
        }
        const preset=WaveData[nextIdx];
        const labelEl=document.createElement('p');
        labelEl.className='text-slate-300 font-bold mb-1.5 text-xs';
        const wLabel=this.phase==='wave'?'次のWave '+(nextIdx+1):'Wave '+(nextIdx+1);
        labelEl.textContent=wLabel+' (HP×'+preset.hpM+')';
        el.appendChild(labelEl);
        const row=document.createElement('div');row.className='flex flex-wrap gap-1.5';
        preset.enemies.forEach(g=>{
            const s=EnemySpecs[g.t];
            const chip=document.createElement('span');
            chip.className='bg-slate-800 rounded-lg px-2 py-1 flex items-center gap-1 text-[10px]';
            chip.textContent=s.emoji+'×'+g.n;
            row.appendChild(chip);
        });
        el.appendChild(row);
        if(preset.bonus>0){
            const note=document.createElement('p');
            note.className='text-sky-400 text-[10px] mt-1.5';
            note.textContent='✨ クリアボーナス: 拡張Pt +'+(preset.bonus+1);
            el.appendChild(note);
        }
        const tide=document.createElement('p');
        const tideCells=Math.min(TIDE_CFG.maxChanges,1+Math.floor(nextIdx/2));
        tide.className='text-cyan-400 text-[10px] mt-1';
        tide.textContent='🌊 潮汐予報: Wave開始時に地形が1〜'+tideCells+'マス変化';
        el.appendChild(tide);
    }
    updateUI(){
        document.querySelectorAll('.tower-btn').forEach(btn=>{
            btn.classList.toggle('selected',btn.dataset.type===this.selType&&!this.expandMode);
        });
        const eb=document.getElementById('btn-expand-mode');
        if(this.expandMode){
            eb.classList.add('bg-sky-500','text-white','animate-pulse');
            eb.classList.remove('bg-sky-900/50','text-sky-200');
            document.getElementById('expand-btn-text').textContent='拡張モード: ON';
            document.getElementById('mode-badge-text').textContent='島拡張モード';
        }else{
            eb.classList.remove('bg-sky-500','text-white','animate-pulse');
            eb.classList.add('bg-sky-900/50','text-sky-200');
            document.getElementById('expand-btn-text').textContent='拡張モードをオンにする';
            document.getElementById('mode-badge-text').textContent=this.phase==='wave'?'ウェーブ進行中!!':'配置フェーズ';
        }
    }
    startWave(){
        if(this.phase!=='build')return;
        this.phase='wave';this.expandMode=false;this.clearDetail();this.updateUI();
        Sound.setMood('wave');
        this.applyTideEvent();
        document.getElementById('wave-progress-wrap').classList.remove('hidden');
        const wc=WaveData[this.waveIdx];
        this.spawnQ=[];
        wc.enemies.forEach(g=>{for(let i=0;i<g.n;i++)this.spawnQ.push({type:g.t});});
        this.spawnQ.sort(()=>Math.random()-.5);
        this.totalEnemies=this.spawnQ.length;this.spawnT=0;
        document.getElementById('wp-wave').textContent=this.waveIdx+1;
        if(this.lastTideResult){
            const cx=MID*this.cs+this.cs/2,cy=MID*this.cs+this.cs/2;
            this.floatText('🌊 潮汐変化 '+this.lastTideResult.total+'マス',cx,cy+30,'#22d3ee');
        }
        Sound.playMagic();this.updateNextWave();
    }
    checkWaveEnd(){
        if(this.phase==='wave'&&this.spawnQ.length===0&&this.enemies.length===0&&!this.skillPending){
            this.phase='build';this.phaseTimer=CFG.waveSec*60;
            Sound.setMood('build');
            document.getElementById('wave-progress-wrap').classList.add('hidden');
            const preset=WaveData[this.waveIdx];
            this.expandPts+=(1+(preset?preset.bonus:1));
            const reward=40+this.waveIdx*10;this.gold+=reward;
            Sound.playHeal();
            const cx=MID*this.cs+this.cs/2,cy=MID*this.cs+this.cs/2;
            this.floatText('Waveクリア! +'+reward+'G',cx,cy-30,'#facc15');
            if(preset&&preset.bonus>0)this.floatText('拡張Pt+'+preset.bonus+'!',cx,cy,'#38bdf8');
            if(this.waveIdx<WaveData.length-1){
                this.waveIdx++;this.updateNextWave();
                // スキルカード選択（最終Waveは除く）
                setTimeout(()=>this.showSkillCards(),400);
            }else{
                setTimeout(()=>{this.clear=true;this.showEnd(true);},400);
            }
            this.rebuildPath();this.updateHUD();this.updateUI();
        }
    }
    showEnd(isClear){
        Sound.stopBgm();
        if(isClear){
            Sound.playClearJingle();
            document.getElementById('clear-kills').textContent='撃破数: '+this.kills+'体';
            document.getElementById('overlay-clear').classList.remove('hidden');
        }else{
            Sound.playGameOverJingle();
            document.getElementById('gameover-kills').textContent='撃破数: '+this.kills+'体';
            document.getElementById('overlay-gameover').classList.remove('hidden');
        }
    }
    update(){
        if(!this.playing||this.over||this.clear)return;
        for(let step=0;step<this.speed;step++){
            if(this.superWeaponCd>0)this.superWeaponCd--;
            if(this.phase==='build'){if(this.phaseTimer>0){this.phaseTimer--;if(!this.phaseTimer)this.startWave();}}
            if(this.phase==='wave'&&this.spawnQ.length>0){
                this.spawnT++;
                const interval=(EnemySpecs[this.spawnQ[0].type]&&EnemySpecs[this.spawnQ[0].type].spawnInt)||45;
                if(this.spawnT>=interval){this.enemies.push(new Enemy(this.spawnQ.shift().type,this));this.spawnT=0;}
            }
            if(step===0&&this.phase==='wave'){
                const rem=this.spawnQ.length+this.enemies.length;
                document.getElementById('wp-remaining').textContent=rem;
                document.getElementById('wp-bar').style.width=(this.totalEnemies>0?rem/this.totalEnemies*100:0)+'%';
            }
            for(let i=this.enemies.length-1;i>=0;i--){
                const e=this.enemies[i];e.update(this);
                if(e.reached){
                    this.hp-=e.power;Sound.playHit();
                    const cx=MID*this.cs+this.cs/2,cy=MID*this.cs+this.cs/2;
                    this.particles(cx,cy,'#f43f5e',20);this.floatText('-'+e.power+' HP',cx,cy,'#f43f5e');
                    this.enemies.splice(i,1);this.updateHUD();
                    if(this.hp<=0){this.hp=0;this.over=true;this.updateHUD();this.showEnd(false);return;}
                }else if(e.hp<=0){
                    this.kills++;this.gold+=Math.round(e.gold*(this.mults.goldMult||1));
                    this.particles(e.x,e.y,e.color,12);this.floatText('+'+e.gold+'G',e.x,e.y,'#facc15');
                    Sound.playExplode();this.enemies.splice(i,1);this.updateHUD();
                    if(this.selCell){const cell=this.grid[this.selCell.r][this.selCell.c];if(cell.tower)this.showDetail(cell.tower);}
                }
            }
            for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++)if(this.grid[r][c].tower)this.grid[r][c].tower.update(this);
            for(let i=this.projs.length-1;i>=0;i--){this.projs[i].update();if(this.projs[i].done)this.projs.splice(i,1);}
            for(let i=this.enemyProjs.length-1;i>=0;i--){this.enemyProjs[i].update(this);if(this.enemyProjs[i].done)this.enemyProjs.splice(i,1);}
            for(let i=this.parts.length-1;i>=0;i--){this.parts[i].update();if(this.parts[i].alpha<=0)this.parts.splice(i,1);}
            for(let i=this.floats.length-1;i>=0;i--){const f=this.floats[i];f.y+=f.vy;f.life--;f.alpha=f.life/50;if(f.life<=0)this.floats.splice(i,1);}
            this.checkWaveEnd();
        }
    }
    draw(){
        const ctx=this.ctx,cs=this.cs,now=Date.now();
        const sz=this.logicalSize;
        ctx.clearRect(0,0,sz,sz);
        ctx.save();ctx.translate(this.gridOffset,this.gridOffset);
        if(this.phase==='build'){document.getElementById('countdown-timer').textContent=Math.ceil(this.phaseTimer/60)+'s';document.getElementById('phase-countdown').classList.remove('opacity-20');}
        else{document.getElementById('countdown-timer').textContent='進行中';document.getElementById('phase-countdown').classList.add('opacity-20');}
        // グリッド
        for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++){
            const cell=this.grid[r][c],x=c*cs,y=r*cs;
            switch(cell.type){
                case TILE.DEEP:{const w=Math.sin(now/800+(r+c))*2;ctx.fillStyle='#0f172a';ctx.fillRect(x,y,cs,cs);ctx.fillStyle='#020617';ctx.fillRect(x+2,y+2+w,cs-4,cs-4);break;}
                case TILE.SHALLOW:{const p=Math.sin(now/400+(r*c))*.15+.85;ctx.fillStyle='rgba(14,116,144,'+(0.4*p)+')';ctx.fillRect(x,y,cs,cs);ctx.fillStyle='#0891b2';ctx.fillRect(x+1,y+1,cs-2,cs-2);break;}
                case TILE.LAND:ctx.fillStyle='#14532d';ctx.fillRect(x,y,cs,cs);ctx.fillStyle='#15803d';ctx.fillRect(x+1,y+1,cs-2,cs-2);ctx.fillStyle='#22c55e';ctx.fillRect(x+4,y+4,3,3);break;
                case TILE.VILLAGE:ctx.fillStyle='#854d0e';ctx.fillRect(x,y,cs,cs);ctx.fillStyle='#ca8a04';ctx.fillRect(x+1,y+1,cs-2,cs-2);break;
            }
            ctx.strokeStyle='rgba(255,255,255,.04)';ctx.strokeRect(x,y,cs,cs);
        }
        // 選択タワーハイライト
        if(this.selCell){const{r,c}=this.selCell;ctx.strokeStyle='#fbbf24';ctx.lineWidth=2.5;ctx.setLineDash([4,3]);ctx.strokeRect(c*cs+1,r*cs+1,cs-2,cs-2);ctx.setLineDash([]);ctx.lineWidth=1;}
        // 拡張モードホバー
        if(this.expandMode&&this.hover){const{r,c}=this.hover;const cell=this.grid[r][c];if(cell.type===TILE.SHALLOW||cell.type===TILE.DEEP){ctx.fillStyle='rgba(56,189,248,.35)';ctx.fillRect(c*cs,r*cs,cs,cs);ctx.strokeStyle='#38bdf8';ctx.lineWidth=2;ctx.strokeRect(c*cs,r*cs,cs,cs);ctx.lineWidth=1;}}
        // 配置ホバー射程
        if(!this.expandMode&&this.hover&&!this.selCell){const{r,c}=this.hover;const cell=this.grid[r][c];const spec=TowerSpecs[this.selType];if(cell.type===TILE.LAND&&!cell.tower&&spec&&spec.range>0){const hx=c*cs+cs/2,hy=r*cs+cs/2;ctx.beginPath();ctx.arc(hx,hy,spec.range*cs,0,Math.PI*2);ctx.fillStyle='rgba(56,189,248,.12)';ctx.fill();ctx.strokeStyle='#0ea5e9';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);}}
        // 既存タワーホバー射程
        if(this.hover&&!this.expandMode){const{r,c}=this.hover;const cell=this.grid[r][c];if(cell.tower&&cell.tower.range>0){const hx=c*cs+cs/2,hy=r*cs+cs/2;ctx.beginPath();ctx.arc(hx,hy,cell.tower.range*cs,0,Math.PI*2);ctx.fillStyle='rgba(251,191,36,.08)';ctx.fill();ctx.strokeStyle='#f59e0b';ctx.lineWidth=1;ctx.stroke();}}
        // 村
        const pulse=Math.sin(now/500)*.04+1;ctx.save();ctx.translate(MID*cs+cs/2,MID*cs+cs/2);ctx.scale(pulse,pulse);
        ctx.font=cs*.72+'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🏠',0,0);ctx.restore();
        // タワー
        for(let r=0;r<GRID;r++)for(let c=0;c<GRID;c++)if(this.grid[r][c].tower)this.grid[r][c].tower.draw(ctx,c*cs+cs/2,r*cs+cs/2,cs);
        // 敵・弾
        ctx.textAlign='center';ctx.textBaseline='middle';
        this.enemies.forEach(e=>e.draw(ctx));
        this.projs.forEach(p=>p.draw(ctx));
        this.enemyProjs.forEach(p=>p.draw(ctx));
        this.parts.forEach(p=>p.draw(ctx));
        this.floats.forEach(f=>{ctx.save();ctx.globalAlpha=f.alpha;ctx.fillStyle=f.color;ctx.font='bold 12px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(f.text,f.x,f.y);ctx.restore();});
        ctx.restore();
    }
    loop(){this.update();this.draw();requestAnimationFrame(()=>this.loop());}
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 初期化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
window.onload=()=>{
    window.game=new GameEngine();

    document.getElementById('btn-start-game').addEventListener('click',()=>{
        Sound.init();window.game.playing=true;
        document.getElementById('overlay-title').classList.add('hidden');Sound.playUpgrade();Sound.startBgm('build');
    });
    document.getElementById('btn-force-wave').addEventListener('click',()=>{if(window.game.phase==='build')window.game.startWave();});
    document.getElementById('btn-speed').addEventListener('click',()=>{
        const g=window.game;g.speed=[1,2,4][[1,2,4].indexOf(g.speed)+1]||1;
        document.getElementById('speed-label').textContent=g.speed+'x';Sound.playShoot();
    });
    document.getElementById('btn-sound-toggle').addEventListener('click',()=>{
        Sound.enabled=!Sound.enabled;document.getElementById('sound-icon').className=Sound.enabled?'fa-solid fa-volume-high':'fa-solid fa-volume-xmark';
        if(Sound.enabled){
            Sound.init();
            if(window.game&&window.game.playing){
                Sound.startBgm(window.game.phase==='wave'?'wave':'build');
                window.game.updateHUD();
            }
        }else{
            Sound.stopBgm();
            if(Sound.ctx)Sound.ctx.suspend();
        }
    });
    document.querySelectorAll('.tower-btn').forEach(btn=>btn.addEventListener('click',()=>{
        window.game.expandMode=false;window.game.selType=btn.dataset.type;window.game.clearDetail();window.game.updateUI();Sound.playShoot();
    }));
    document.getElementById('btn-expand-mode').addEventListener('click',()=>{window.game.expandMode=!window.game.expandMode;window.game.clearDetail();window.game.updateUI();Sound.playShoot();});
    document.getElementById('btn-super-weapon').addEventListener('click',()=>window.game.useSuperWeapon());
    document.getElementById('btn-upgrade').addEventListener('click',()=>{
        const g=window.game;if(!g.selCell)return;
        const cell=g.grid[g.selCell.r][g.selCell.c];if(!cell.tower)return;
        if(cell.tower.upgrade(g)){g.particles(g.selCell.c*g.cs+g.cs/2,g.selCell.r*g.cs+g.cs/2,'#fbbf24',20);g.floatText('UPGRADE!',g.selCell.c*g.cs+g.cs/2,g.selCell.r*g.cs,'#fbbf24');g.updateHUD();g.showDetail(cell.tower);}
    });
    document.getElementById('btn-sell').addEventListener('click',()=>{
        const g=window.game;if(!g.selCell)return;
        const{r,c}=g.selCell;const cell=g.grid[r][c];if(!cell.tower)return;
        const ref=cell.tower.sellValue();g.gold+=ref;
        g.particles(c*g.cs+g.cs/2,r*g.cs+g.cs/2,'#ef4444',10);g.floatText('+'+ref+'G (撤去)',c*g.cs+g.cs/2,r*g.cs+g.cs/2,'#facc15');
        cell.tower=null;Sound.playExplode();g.rebuildPath();g.updateHUD();g.clearDetail();
    });
    document.getElementById('detail-close').addEventListener('click',()=>window.game.clearDetail());
    const modal=document.getElementById('modal-help');
    document.getElementById('btn-help').addEventListener('click',()=>{modal.classList.remove('hidden');Sound.playShoot();});
    document.getElementById('modal-close').addEventListener('click',()=>modal.classList.add('hidden'));
    document.getElementById('modal-confirm').addEventListener('click',()=>modal.classList.add('hidden'));
};
