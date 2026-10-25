/* Techno_A Trading — browser-only educational paper-trading simulator.
   Prices/candles are synthetic. This is not live market data and not secure authentication.
   Never use a real password. Production needs a backend, a market-data provider, and security review. */
const STARTING_CASH = 1_000_000; // account balance and rank thresholds are USD-based
const STORAGE_USERS = "slTradingUsers_v1";
const STORAGE_SESSION = "slTradingSession_v1";
const STORAGE_MARKET = "technoTradingMarket_v2";
const KES_PER_USD_DISPLAY = 129.5; // fixed illustrative display conversion; not a live FX rate

const seedAssets = [
  {symbol:"NVDA",name:"NVIDIA",type:"Stock",price:142.50,vol:.018},
  {symbol:"AAPL",name:"Apple",type:"Stock",price:228.30,vol:.012},
  {symbol:"MSFT",name:"Microsoft",type:"Stock",price:512.20,vol:.011},
  {symbol:"AMZN",name:"Amazon",type:"Stock",price:221.70,vol:.016},
  {symbol:"GOOGL",name:"Alphabet",type:"Stock",price:193.80,vol:.014},
  {symbol:"TSLA",name:"Tesla",type:"Stock",price:342.10,vol:.027},
  {symbol:"META",name:"Meta Platforms",type:"Stock",price:681.40,vol:.018},
  {symbol:"JPM",name:"JPMorgan Chase",type:"Stock",price:294.60,vol:.012},
  {symbol:"KO",name:"Coca-Cola",type:"Stock",price:71.25,vol:.008},
  {symbol:"DIS",name:"Disney",type:"Stock",price:113.40,vol:.016},
  {symbol:"BTC-USD",name:"Bitcoin",type:"Crypto",price:67400,vol:.025},
  {symbol:"ETH-USD",name:"Ethereum",type:"Crypto",price:3520,vol:.030},
  {symbol:"SOL-USD",name:"Solana",type:"Crypto",price:168.40,vol:.038},
  {symbol:"XRP-USD",name:"XRP",type:"Crypto",price:0.58,vol:.035},
  {symbol:"DOGE-USD",name:"Dogecoin",type:"Crypto",price:0.16,vol:.042},
  {symbol:"EUR/USD",name:"Euro / US Dollar",type:"Forex",price:1.085,vol:.003},
  {symbol:"GBP/USD",name:"British Pound / US Dollar",type:"Forex",price:1.292,vol:.004},
  {symbol:"USD/JPY",name:"US Dollar / Japanese Yen",type:"Forex",price:149.8,vol:.004},
  {symbol:"USD/KES",name:"US Dollar / Kenyan Shilling",type:"Forex",price:129.5,vol:.002},
  {symbol:"AUD/USD",name:"Australian Dollar / US Dollar",type:"Forex",price:0.654,vol:.004},
  {symbol:"XAU/USD",name:"Gold",type:"Commodity",price:2735,vol:.010},
  {symbol:"XAG/USD",name:"Silver",type:"Commodity",price:32.4,vol:.016},
  {symbol:"WTI",name:"Crude Oil (WTI)",type:"Commodity",price:71.6,vol:.020},
  {symbol:"NGAS",name:"Natural Gas",type:"Commodity",price:3.2,vol:.032},
  {symbol:"SPX",name:"S&P 500",type:"Index",price:5800,vol:.008},
  {symbol:"NDX",name:"Nasdaq 100",type:"Index",price:20250,vol:.011},
  {symbol:"DJI",name:"Dow Jones Industrial Average",type:"Index",price:42900,vol:.007},
  {symbol:"NSE20",name:"NSE 20 Share Index (practice)",type:"Index",price:2100,vol:.009}
];

let mode = "login";
let currentUser = null;
let activeAssetType = "All";
let displayCurrency = "KES";
let market = loadMarket();
const $ = id => document.getElementById(id);

function currencyRate(){return displayCurrency==="KES"?KES_PER_USD_DISPLAY:1;}
function money(n, digits=2){
  const value=(Number(n)||0)*currencyRate();
  if(displayCurrency==="KES") return "KSh "+new Intl.NumberFormat("en-KE",{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
  return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
}
function compactMoney(n){
  const value=(Number(n)||0)*currencyRate();
  return (displayCurrency==="KES"?"KSh ":"$")+new Intl.NumberFormat(displayCurrency==="KES"?"en-KE":"en-US",{notation:"compact",maximumFractionDigits:2}).format(value);
}
function priceText(asset, n=asset.price){
  const digits=asset.type==="Forex"&&asset.price<10?4:(n<1?5:2);
  return money(n,digits);
}
const users = () => JSON.parse(localStorage.getItem(STORAGE_USERS) || "{}");
const saveUsers = all => localStorage.setItem(STORAGE_USERS, JSON.stringify(all));
function makeCandles(price, count=60, vol=.015){
  const candles=[]; let last=price;
  for(let i=0;i<count;i++){
    const open=last;
    const close=Math.max(.00001,open*(1+(Math.random()-.49)*vol));
    const wick=vol*(.15+Math.random()*.75);
    const high=Math.max(open,close)*(1+Math.random()*wick);
    const low=Math.max(.00001,Math.min(open,close)*(1-Math.random()*wick));
    candles.push({open,high,low,close,time:Date.now()-(count-i)*20000});
    last=close;
  }
  candles[candles.length-1].close=price;
  candles[candles.length-1].high=Math.max(candles[candles.length-1].high,price);
  candles[candles.length-1].low=Math.min(candles[candles.length-1].low,price);
  return candles;
}
function loadMarket(){
  // A new storage key keeps old stock-only demo data from breaking the expanded market.
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_MARKET)||"null");
    if(Array.isArray(saved)&&saved.length===seedAssets.length) return saved;
  }catch{}
  return seedAssets.map(a=>({...a,history:makeCandles(a.price,60,a.vol)}));
}
function saveMarket(){localStorage.setItem(STORAGE_MARKET,JSON.stringify(market));}
function say(el,message,type=""){el.textContent=message;el.className="form-message"+(type?" "+type:"");}
function getAccount(){return currentUser?users()[currentUser]:null;}
function saveAccount(account){const all=users();all[currentUser]=account;saveUsers(all);}
function ensureAccountShape(a){
  a.cash=Number(a.cash??STARTING_CASH);a.holdings||={};a.trades||=[];a.redeemedCodes||=[];a.createdAt||=new Date().toISOString();return a;
}
function setMode(next){
  mode=next;$("loginTab").classList.toggle("active",mode==="login");$("registerTab").classList.toggle("active",mode==="register");
  $("authSubmit").textContent=mode==="login"?"Sign in":"Create account";$("password").autocomplete=mode==="login"?"current-password":"new-password";say($("authMessage"),"");
}
$("loginTab").addEventListener("click",()=>setMode("login"));
$("registerTab").addEventListener("click",()=>setMode("register"));
$("authForm").addEventListener("submit",e=>{
  e.preventDefault();const username=$("username").value.trim(),password=$("password").value;
  if(!/^[a-zA-Z0-9_]{3,20}$/.test(username)){say($("authMessage"),"Use 3–20 letters, numbers, or underscores for your username.","bad");return;}
  const all=users();
  if(mode==="register"){
    if(password.length<4){say($("authMessage"),"Password must be at least 4 characters.","bad");return;}
    if(all[username.toLowerCase()]){say($("authMessage"),"That username already exists. Try signing in.","bad");return;}
    all[username.toLowerCase()]={username,passwordDemoOnly:password,cash:STARTING_CASH,holdings:{},trades:[],redeemedCodes:[],createdAt:new Date().toISOString()};
    saveUsers(all);signIn(username.toLowerCase());
  }else{
    const account=all[username.toLowerCase()];
    if(!account||account.passwordDemoOnly!==password){say($("authMessage"),"Username or password is incorrect.","bad");return;}
    signIn(username.toLowerCase());
  }
});
function signIn(username){
  currentUser=username;localStorage.setItem(STORAGE_SESSION,username);
  $("authView").classList.add("hidden");$("appView").classList.remove("hidden");$("logoutBtn").classList.remove("hidden");
  renderAll();
}
$("logoutBtn").addEventListener("click",()=>{
  currentUser=null;localStorage.removeItem(STORAGE_SESSION);$("appView").classList.add("hidden");$("authView").classList.remove("hidden");$("logoutBtn").classList.add("hidden");
  $("password").value="";say($("authMessage"),"You signed out successfully.","good");
});
function getStock(symbol){return market.find(s=>s.symbol===symbol);}
function positionValue(account,symbol){const h=account.holdings[symbol],a=getStock(symbol);return h&&a?h.shares*a.price:0;}
function portfolioValue(account){return Object.keys(account.holdings).reduce((sum,s)=>sum+positionValue(account,s),0);}
function netWorth(account){return account.cash+portfolioValue(account);}
function positionCost(account,symbol){const h=account.holdings[symbol];return h?h.shares*h.avgCost:0;}
function openPL(account){return Object.keys(account.holdings).reduce((sum,s)=>sum+positionValue(account,s)-positionCost(account,s),0);}

const ranks=[
 {name:"F Class",min:0,max:1000,range:"Under $1K"},
 {name:"D Class",min:1000,max:10000,range:"$1K – $10K"},
 {name:"C Class",min:10000,max:100000,range:"Over $10K – $100K"},
 {name:"B Class",min:100000,max:1000000,range:"Over $100K – $1M"},
 {name:"B+ Class",min:1000000,max:10000000,range:"Over $1M – under $10M"},
 {name:"A Class",min:10000000,max:100000000,range:"$10M – $100M"},
 {name:"A+ Class",min:100000000,max:800000000,range:"Over $100M – under $800M"},
 {name:"S Class",min:800000000,max:1000000000,range:"$800M – $1B"},
 {name:"Elite Class",min:1000000000,max:10000000000,range:"Over $1B – under $10B"},
 {name:"Master Class",min:10000000000,max:1e15,range:"$10B – under $1Q"},
 {name:"Who Is This Guy?",min:1e15,max:Infinity,range:"$1 Quadrillion+"}
];
function rankFor(value){
  if(value<1000)return 0;if(value<=10000)return 1;if(value<=100000)return 2;if(value<=1000000)return 3;
  if(value<10000000)return 4;if(value<=100000000)return 5;if(value<800000000)return 6;
  if(value<=1000000000)return 7;if(value<10000000000)return 8;if(value<1e15)return 9;return 10;
}
function renderRank(account){
  const worth=netWorth(account),index=rankFor(worth),rank=ranks[index];
  $("rankBadge").textContent=rank.name.toUpperCase();$("nextRank").textContent=Number.isFinite(rank.max)?compactMoney(rank.max):"TOP RANK";
  const pct=Number.isFinite(rank.max)?Math.max(0,Math.min(100,((worth-rank.min)/(rank.max-rank.min))*100)):100;
  $("rankProgressBar").style.width=pct+"%";
  $("rankLadder").innerHTML=ranks.map((r,i)=>`<div class="rank-item ${i===index?"current":""}"><strong>${r.name}</strong><small>${r.range}</small></div>`).join("");
}
function renderSummary(account){
  $("cashValue").textContent=money(account.cash,0);$("portfolioValue").textContent=money(portfolioValue(account),0);$("netWorth").textContent=money(netWorth(account),0);
  const pl=openPL(account);$("profitLoss").textContent=(pl>=0?"+":"")+money(pl,0);$("profitLoss").className=pl>=0?"good-text":"bad-text";
}
function renderStocks(){
  const query=$("stockSearch").value.toLowerCase();
  const shown=market.filter(a=>(activeAssetType==="All"||a.type===activeAssetType)&&(a.symbol+" "+a.name+" "+a.type).toLowerCase().includes(query));
  $("stockRows").innerHTML=shown.map(a=>{
    const prev=a.history?.length>1?a.history[a.history.length-2].close:a.price,change=prev?((a.price-prev)/prev)*100:0;
    return `<tr><td><div class="company"><span class="ticker-icon">${a.type==="Crypto"?"₿":a.type==="Forex"?"FX":a.type==="Commodity"?"CM":a.type==="Index"?"IX":a.symbol.slice(0,2)}</span><div><strong>${a.symbol}</strong><small>${a.name} · ${a.type}</small></div></div></td><td>${priceText(a)}</td><td class="${change>=0?"change-up":"change-down"}">${change>=0?"+":""}${change.toFixed(2)}%</td><td><button class="mini-btn" data-buy="${a.symbol}">Chart / trade</button></td></tr>`;
  }).join("")||`<tr><td colspan="4">No matching assets.</td></tr>`;
  $("stockRows").querySelectorAll("[data-buy]").forEach(btn=>btn.addEventListener("click",()=>{
    $("tradeStock").value=btn.dataset.buy;updateOrderTotal();drawChart();$("tradeStock").scrollIntoView({behavior:"smooth",block:"center"});
  }));
  const previous=$("tradeStock").value;
  $("tradeStock").innerHTML=market.map(a=>`<option value="${a.symbol}">${a.symbol} — ${a.name} (${a.type})</option>`).join("");
  if(getStock(previous))$("tradeStock").value=previous;
  updateOrderTotal();
}
function renderHoldings(account){
  const entries=Object.entries(account.holdings).filter(([,h])=>h.shares>0);
  $("holdings").innerHTML=entries.length?entries.map(([symbol,h])=>{
    const a=getStock(symbol);if(!a)return "";
    const value=h.shares*a.price,pl=value-h.shares*h.avgCost;
    return `<div class="holding-row"><div><strong>${symbol}</strong><small>${h.shares.toLocaleString(undefined,{maximumFractionDigits:4})} units · avg cost ${money(h.avgCost)}</small></div><div class="holding-right"><strong>${money(value)}</strong><small class="${pl>=0?"change-up":"change-down"}">${pl>=0?"+":""}${money(pl)}</small></div></div>`;
  }).join(""):`<div class="empty-state">No positions yet. Choose any asset above to make your first practice trade.</div>`;
}
function renderJournal(account){
  const trades=account.trades.slice(-8).reverse();
  $("journal").innerHTML=trades.length?trades.map(t=>`<div class="journal-item"><div><strong>${t.action} ${t.symbol}</strong><small>${new Date(t.date).toLocaleString()}</small></div><div class="holding-right"><strong>${money(t.total)}</strong><small>${Number(t.shares)||0} unit${Number(t.shares)===1?"":"s"}${t.realizedPL!==undefined?` · P/L ${money(t.realizedPL)}`:""}</small></div></div>`).join(""):`<div class="empty-state">Your completed trades will appear here.</div>`;
}
function renderProfile(account){
  $("profileName").textContent=account.username;$("avatar").textContent=account.username.slice(0,1).toUpperCase();
  $("joinedDate").textContent="Joined "+new Date(account.createdAt).toLocaleDateString();$("tradeCount").textContent=account.trades.length;
  const closed=account.trades.filter(t=>t.action==="SELL"&&typeof t.realizedPL==="number");
  $("winRate").textContent=closed.length?Math.round(closed.filter(t=>t.realizedPL>0).length/closed.length*100)+"%":"—";
}
function renderAll(){
  const account=ensureAccountShape(getAccount());saveAccount(account);
  renderSummary(account);renderStocks();renderHoldings(account);renderJournal(account);renderProfile(account);renderRank(account);drawChart();
  $("lastUpdated").textContent="Updated "+new Date().toLocaleTimeString();
}
function updateOrderTotal(){
  if(!$("tradeStock"))return;
  const a=getStock($("tradeStock").value)||market[0],raw=Number($("shareQty").value),qty=Number.isFinite(raw)&&raw>0?raw:0;
  $("selectedPrice").textContent=priceText(a);$("orderTotal").textContent=money(a.price*qty);
  $("chartAssetName").textContent=`${a.symbol} · ${a.name}`;
}
$("tradeStock").addEventListener("change",()=>{updateOrderTotal();drawChart();});
$("shareQty").addEventListener("input",updateOrderTotal);
$("stockSearch").addEventListener("input",renderStocks);
$("currencySelect").addEventListener("change",()=>{displayCurrency=$("currencySelect").value;renderAll();});
$("timeframeSelect").addEventListener("change",drawChart);
$("assetFilters").querySelectorAll("[data-type]").forEach(btn=>btn.addEventListener("click",()=>{
  activeAssetType=btn.dataset.type;$("assetFilters").querySelectorAll(".filter-btn").forEach(b=>b.classList.toggle("active",b===btn));renderStocks();
}));

function detectPattern(c){
  if(c.length<3)return ["Collecting candles…","More candles are needed to inspect a pattern."];
  const a=c[c.length-1],b=c[c.length-2],body=Math.abs(a.close-a.open),range=Math.max(a.high-a.low,1e-9),upper=a.high-Math.max(a.open,a.close),lower=Math.min(a.open,a.close)-a.low;
  if(body/range<.1)return ["Doji","Open and close are close together: indecision may be present."];
  if(lower>body*2&&upper<body*.7&&a.close>a.open)return ["Hammer-like candle","A long lower wick after a decline can be watched for a possible reversal."];
  if(a.close>a.open&&b.close<b.open&&a.open<=b.close&&a.close>=b.open)return ["Bullish engulfing-like","The latest up candle covers the previous body; confirmation is still needed."];
  if(a.close<a.open&&b.close>b.open&&a.open>=b.close&&a.close<=b.open)return ["Bearish engulfing-like","The latest down candle covers the previous body; confirmation is still needed."];
  if(upper>body*2&&lower<body*.7)return ["Shooting-star-like candle","A long upper wick can indicate rejection of higher prices."];
  return ["No clear basic pattern","No simple pattern detected in the latest candle pair."];
}
function drawChart(){
  const asset=getStock($("tradeStock")?.value)||market[0];if(!asset)return;
  $("chartAssetName").textContent=`${asset.symbol} · ${asset.name}`;$("chartPrice").textContent=priceText(asset);
  const raw=(asset.history||[]);
  const seconds={"1m":60,"5m":300,"15m":900,"1h":3600,"1D":86400}[$("timeframeSelect").value]||60;
  const bucketMs=seconds*1000, grouped=[];
  raw.forEach(c=>{
    const key=Math.floor((c.time||Date.now())/bucketMs);
    const last=grouped[grouped.length-1];
    if(last&&last.key===key){last.high=Math.max(last.high,c.high);last.low=Math.min(last.low,c.low);last.close=c.close;last.time=c.time;}
    else grouped.push({key,open:c.open,high:c.high,low:c.low,close:c.close,time:c.time});
  });
  const candles=grouped.slice(-45),first=candles[0]?.open||asset.price,last=candles[candles.length-1]?.close||asset.price;
  const change=(last-first)/first*100;$("chartChange").textContent=`${change>=0?"+":""}${change.toFixed(2)}% over displayed candles`;
  const [pattern,hint]=detectPattern(candles);$("patternName").textContent=pattern;$("patternHint").textContent=hint;
  const canvas=$("candleChart"),rect=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1,w=Math.max(320,rect.width),h=Math.max(210,rect.height||280);
  canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const pad={top:14,right:76,bottom:22,left:12},cw=w-pad.left-pad.right,ch=h-pad.top-pad.bottom;
  if(!candles.length)return;
  const min=Math.min(...candles.map(c=>c.low)),max=Math.max(...candles.map(c=>c.high)),span=Math.max(max-min,asset.price*.001);
  const y=v=>pad.top+(max-v)/span*ch,step=cw/candles.length,bodyW=Math.max(3,Math.min(12,step*.58));
  ctx.font="10px system-ui";ctx.textAlign="right";ctx.textBaseline="middle";
  for(let i=0;i<5;i++){const yy=pad.top+i*ch/4,val=max-i*span/4;ctx.strokeStyle="#253247";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad.left,yy);ctx.lineTo(w-pad.right+8,yy);ctx.stroke();ctx.fillStyle="#8e9db4";ctx.fillText(priceText(asset,val),w-5,yy);}
  candles.forEach((c,i)=>{
    const x=pad.left+i*step+step/2,up=c.close>=c.open,color=up?"#35d39a":"#ff6f7d";
    ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x,y(c.high));ctx.lineTo(x,y(c.low));ctx.stroke();
    const top=y(Math.max(c.open,c.close)),bottom=y(Math.min(c.open,c.close)),bh=Math.max(1,bottom-top);
    if(up)ctx.fillRect(x-bodyW/2,top,bodyW,bh);else ctx.fillRect(x-bodyW/2,top,bodyW,bh);
  });
  ctx.fillStyle="#8e9db4";ctx.textAlign="left";ctx.textBaseline="bottom";
  const tf=$("timeframeSelect").value;ctx.fillText(`${candles.length} simulated ${tf} candles (built from synthetic ticks)`,pad.left,h-2);
}
window.addEventListener("resize",()=>{if(currentUser)drawChart();});
function addTrade(account,trade){account.trades.push({...trade,date:new Date().toISOString()});if(account.trades.length>250)account.trades=account.trades.slice(-250);}
function performTrade(action){
  const account=ensureAccountShape(getAccount()),a=getStock($("tradeStock").value),qty=Number($("shareQty").value);
  if(!a||!Number.isFinite(qty)||qty<=0||qty>1e12){say($("tradeMessage"),"Enter a valid quantity greater than zero.","bad");return;}
  const rounded=Number(qty.toFixed(6)),total=a.price*rounded;
  if(!Number.isFinite(total)){say($("tradeMessage"),"That order is too large.","bad");return;}
  if(action==="BUY"){
    if(total>account.cash){say($("tradeMessage"),"Not enough virtual cash for this order.","bad");return;}
    const old=account.holdings[a.symbol]||{shares:0,avgCost:0},newShares=old.shares+rounded;
    account.holdings[a.symbol]={shares:newShares,avgCost:((old.shares*old.avgCost)+total)/newShares};account.cash-=total;
    addTrade(account,{action:"BUY",symbol:a.symbol,shares:rounded,total});
  }else{
    const holding=account.holdings[a.symbol];
    if(!holding||holding.shares+1e-8<rounded){say($("tradeMessage"),"You don't own enough units to sell that quantity.","bad");return;}
    const realizedPL=(a.price-holding.avgCost)*rounded;holding.shares=Number((holding.shares-rounded).toFixed(6));
    if(holding.shares<=1e-8)delete account.holdings[a.symbol];
    account.cash+=total;addTrade(account,{action:"SELL",symbol:a.symbol,shares:rounded,total,realizedPL});
  }
  saveAccount(account);renderAll();say($("tradeMessage"),`${action==="BUY"?"Bought":"Sold"} ${rounded} ${a.symbol} for ${money(total)} virtual cash.`,"good");
}
$("buyBtn").addEventListener("click",()=>performTrade("BUY"));
$("sellBtn").addEventListener("click",()=>performTrade("SELL"));
$("codeForm").addEventListener("submit",e=>{
  e.preventDefault();const code=$("codeInput").value.trim().toLowerCase(),account=ensureAccountShape(getAccount());
  if(account.redeemedCodes.includes(code)){say($("codeMessage"),"You've already redeemed that code on this account.","bad");return;}
  if(code==="mastertrader"){
    account.cash+=1_000_000_000;account.redeemedCodes.push(code);addTrade(account,{action:"BONUS",symbol:"MASTERTRADER",shares:0,total:1_000_000_000});
    saveAccount(account);renderAll();say($("codeMessage"),"MASTERTRADER accepted! $1,000,000,000 virtual cash added.","good");
  }else if(code==="randoms"){
    const bonus=Math.floor((Math.random()*9+1)*10_000);account.cash+=bonus;account.redeemedCodes.push(code);addTrade(account,{action:"BONUS",symbol:"RANDOMS",shares:0,total:bonus});
    saveAccount(account);renderAll();say($("codeMessage"),`RANDOMS accepted! You received ${money(bonus,0)} virtual cash.`,"good");
  }else say($("codeMessage"),"Invalid code. Check the spelling and try again.","bad");
  $("codeInput").value="";
});

// Synthetic OHLC candle movement; not linked to exchanges.
function tickMarket(){
  market=market.map(a=>{
    const prev=a.price,noise=(Math.random()-.5)*a.vol*1.8,open=prev;
    const close=Math.max(.00001,open*(1+noise)),wick=a.vol*(.1+Math.random()*.35);
    const candle={open,close,high:Math.max(open,close)*(1+Math.random()*wick),low:Math.max(.00001,Math.min(open,close)*(1-Math.random()*wick)),time:Date.now()};
    a.price=Number(close.toPrecision(a.type==="Forex"?6:8));a.history=[...(a.history||[]).slice(-119),candle];return a;
  });
  saveMarket();if(currentUser)renderAll();
}
setInterval(tickMarket,20000);
const session=localStorage.getItem(STORAGE_SESSION);
if(session&&users()[session])signIn(session);else{$("authView").classList.remove("hidden");$("appView").classList.add("hidden");}
