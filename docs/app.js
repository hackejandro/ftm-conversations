const FEED_URL='./feed.json';
const links=new Map(),feed=document.getElementById('feed'),detail=document.getElementById('detail'),list=document.getElementById('link-list'),status=document.getElementById('live-status'),statusText=document.getElementById('live-text');
let selectedUrl=null,generatedAt=null;
function shortDid(did){return did.length>22?did.slice(0,12)+'…'+did.slice(-5):did}
function initials(value){return value.slice(-2).toUpperCase()}
function relativeTime(value){const m=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/60000));return m<1?'zojuist':m<60?m+' min':m<1440?Math.floor(m/60)+' uur':Math.floor(m/1440)+' d'}
function fallbackTitle(url){const p=new URL(url),part=decodeURIComponent(p.pathname).replace(/[-_]/g,' ').replace(/\/+$/,'').split('/').filter(Boolean).pop();return part&&part.length>3?part:p.hostname.replace(/^www\./,'')}
function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
function metrics(item){const replies=item.posts.flatMap(post=>post.replies||[]);return{shares:item.posts.length,messages:item.posts.length+replies.length,people:new Set([...item.posts,...replies].map(post=>post.did)).size}}
function setStatus(state,text){status.dataset.state=state;statusText.textContent=text}
function liveStatus(){if(!generatedAt)return;const time=new Date(generatedAt).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'});setStatus('live','Bijgewerkt om '+time)}
function loadDemo(){
  const now=Date.now(),minutes=value=>new Date(now-value*60000).toISOString();
  const demo=[{id:'demo-ftm',url:'https://www.ftm.nl/voorbeeldartikel',domain:'ftm.nl',title:'Een onderzoek besproken door verschillende lezers',description:'Voorbeeld dat alleen in de lokale voorvertoning wordt getoond.',posts:[
    {did:'did:plc:demo1',rkey:'share1',handle:'anna.example',displayName:'Anna',text:'Dit roept een vraag op die een breder gesprek verdient.',createdAt:minutes(35),replies:[{did:'did:plc:demo2',rkey:'reply1',handle:'mika.example',displayName:'Mika',text:'Vooral omdat de gevolgen per land zo sterk verschillen.',createdAt:minutes(24)}]},
    {did:'did:plc:demo3',rkey:'share2',handle:'lucas.example',displayName:'Lucas',text:'Goed onderzoek. Ik had deze cijfers nog niet eerder bij elkaar gezien.',createdAt:minutes(12),replies:[]}
  ]}];
  links.clear();for(const item of demo)links.set(item.url,item);generatedAt=new Date().toISOString();render();setStatus('live','Lokaal ontwerpvoorbeeld — geen echt artikel');
}
function render(){
  list.replaceChildren();const items=[...links.values()].slice(0,20);
  if(!items.length){list.append(element('p','empty-state','Momenteel voldoet geen FTM-artikel aan de voorwaarden. Het overzicht wordt iedere vijftien minuten bijgewerkt.'));return}
  for(const item of items){const score=metrics(item),card=element('button','link-card'),copy=element('span','link-copy');card.setAttribute('aria-label','Open gesprekken over '+(item.title||fallbackTitle(item.url)));copy.append(element('span','domain',item.domain),element('strong','link-title',item.title||fallbackTitle(item.url)));if(item.description)copy.append(element('span','description',item.description));const meta=element('span','card-meta');meta.append(element('span','',score.shares+' unieke gesprekken'),element('span','',score.messages+' berichten'),element('span','',score.people+' personen'));copy.append(meta);const arrow=element('span','open-label','→');arrow.setAttribute('aria-hidden','true');card.append(copy,arrow);card.addEventListener('click',()=>openLink(item.url));list.append(card)}
}
function showFeed(updateHistory=true){selectedUrl=null;detail.classList.add('hidden');feed.classList.remove('hidden');if(updateHistory){const next=new URL(location.href);next.searchParams.delete('story');history.pushState({},'',next)}window.scrollTo(0,0)}
function openLink(url,scroll=true,updateHistory=true){
  const item=links.get(url);if(!item)return;selectedUrl=url;const posts=item.posts||[],replies=posts.flatMap(post=>post.replies||[]),people=new Set([...posts,...replies].map(post=>post.did)).size;
  if(updateHistory&&item.id){const next=new URL(location.href);next.searchParams.set('story',item.id);history.pushState({},'',next)}
  document.getElementById('detail-domain').textContent=item.domain;document.getElementById('detail-title').textContent=item.title||fallbackTitle(item.url);document.getElementById('detail-description').textContent=item.description||'Gedeeld in openbare ATProto-berichten.';document.getElementById('detail-conversations').textContent=posts.length+' unieke gesprekken';document.getElementById('detail-messages').textContent=(posts.length+replies.length)+' berichten';document.getElementById('detail-people').textContent=people+' personen';document.getElementById('article-button').href=item.url;
  const conversations=document.getElementById('conversations');conversations.replaceChildren();
  function appendMessage(post,label,isReply=false){const article=element('article','conversation'+(isReply?' reply':'')),author=element('div','conversation-author'),identity=element('div'),name=post.displayName||post.handle||shortDid(post.did);identity.append(element('strong','',name),element('span','',(post.handle?'@'+post.handle+' · ':'')+label+' · '+relativeTime(post.createdAt)));author.append(element('span','avatar',initials(name)),identity);article.append(author,element('p','',post.text||'Dit bericht deelde de link zonder begeleidende tekst.'));const meta=element('div','conversation-meta'),source=element('a','','Bekijk oorspronkelijk bericht ↗');source.href='https://bsky.app/profile/'+post.did+'/post/'+post.rkey;source.target='_blank';source.rel='noopener noreferrer';meta.append(source);article.append(meta);conversations.append(article)}
  for(const post of posts){appendMessage(post,'onafhankelijke deling');for(const reply of post.replies||[])appendMessage(reply,'reactie',true)}feed.classList.add('hidden');detail.classList.remove('hidden');if(scroll)window.scrollTo(0,0)
}
async function loadFeed(){
  if(location.protocol==='file:'){loadDemo();return}setStatus('loading','Gesprekken laden…');
  try{const response=await fetch(FEED_URL,{cache:'no-store'});if(!response.ok)throw new Error();const snapshot=await response.json();links.clear();for(const item of snapshot.items||[])links.set(item.url,item);render();const requested=new URLSearchParams(location.search).get('story'),requestedItem=[...links.values()].find(item=>item.id===requested);if(requestedItem)openLink(requestedItem.url,false,false);else if(selectedUrl&&links.has(selectedUrl))openLink(selectedUrl,false,false);generatedAt=snapshot.generatedAt||null;generatedAt?liveStatus():setStatus('loading','Het eerste overzicht wordt opgebouwd…')}
  catch{setStatus('error','Het overzicht kon niet worden geladen — nieuwe poging volgt…')}
}
loadFeed();setInterval(loadFeed,15*60*1000);document.getElementById('back').addEventListener('click',()=>showFeed());document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')loadFeed()});window.addEventListener('popstate',()=>{const requested=new URLSearchParams(location.search).get('story'),item=[...links.values()].find(value=>value.id===requested);item?openLink(item.url,false,false):showFeed(false)});
